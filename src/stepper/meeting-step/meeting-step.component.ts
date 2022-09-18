import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { Logger } from '@app/@core/logger/logger';
import { FilterDTO, LanguageDTO, MeetingSlotDTO } from '@app/@models/models';
import { ServiceApi } from '@app/@service-api/service-api';
import { DATE_FORMAT, SHOW_SUCCESS_INFO } from '@app/constants';
import { SchedulerParams } from '@app/interfaces';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { environment } from '@env/environment';
import { find, groupBy, head, includes, maxBy, minBy } from 'lodash-es';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import {
  EDIT_OPEN_ANIMATIONS,
  StepperBaseDirective,
} from '@cus/src/stepper/stepper-base';
import {
  SLOT_CONTROL,
  StepperAction,
  StepperEvent,
} from '@cus/src/stepper/stepper.component';
import { AppConfigModule } from '@app/app-config.module';
import { BUS_EMIT } from '@app/@core/event-bus-srv/event-bus.service';
import { TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor } from '@angular/cdk/a11y';

const log = new Logger('MeetingStepComponent');

@Component({
  selector: 'app-meeting-step',
  templateUrl: './meeting-step.component.html',
  styleUrls: ['./meeting-step.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  animations: EDIT_OPEN_ANIMATIONS,
})
export class MeetingStepComponent
  extends StepperBaseDirective
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild(MatCalendar) calendar!: MatCalendar<Date>;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @Input() events!: Observable<StepperEvent>;
  @Output() selected: EventEmitter<void> = new EventEmitter<void>();

  pageSizeOptions: Array<number> = [20];
  activeData: any;
  defaultImage = environment.brand + environment.defaultImage;
  calendarDateValue!: moment.Moment;

  aDateText!: string;

  get dateText(): string {
    if (!this.aDateText) {
      this.aDateText = 'meeting slot selection';
    }
    return this.aDateText;
  }

  set dateText(value: string) {
    this.aDateText = value;
  }

  aDataSource!: MatTableDataSource<any>;

  get dataSource(): MatTableDataSource<any> {
    if (!this.aDataSource) {
      this.aDataSource = new MatTableDataSource<any>([]);
      this.aDataSource.paginator = this.paginator;
    }
    return this.aDataSource;
  }

  set dataSource(dataSource: MatTableDataSource<any>) {
    this.aDataSource = dataSource;
  }

  constructor(
    private controlContainer: FormGroupDirective,
    protected override stepperService: StepperService,
    private serviceApi: ServiceApi,
    private iconReg: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private config: AppConfigModule,
    protected override translateService: TranslateService,
    protected dateAdapter: DateAdapter<any>,
    protected override appDataService: AppDataService,
    protected override focusMonitor: FocusMonitor,
    protected override zone: NgZone
  ) {
    super(stepperService, translateService, appDataService, focusMonitor, zone);
    log.debug('construct');
    this.iconReg.addSvgIcon(
      'access_time_black',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        environment.brand + 'access_time_black.svg'
      )
    );
    this.iconReg.addSvgIcon(
      'phone',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        environment.assets + 'phone.svg'
      )
    );
    this.iconReg.addSvgIcon(
      'wifi_black',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        environment.brand + 'wifi_black.svg'
      )
    );
    this.iconReg.addSvgIcon(
      'meeting_room_black',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        environment.brand + 'meeting_room_black.svg'
      )
    );
  }

  override ngOnInit(): void {
    log.debug('init');
    super.ngOnInit();
    this.formGroup = this.controlContainer.form;
    if (this.formGroup) {
      this.formGroup.addControl(SLOT_CONTROL, new FormControl(null));
    }

    this.dateAdapter.setLocale(this.stepperService.language);

    this.eventSub = this.events?.subscribe((event: StepperEvent) => {
      log.debug('stepper event', event);

      // STEP
      switch (event.step) {
        case this.step:
          // ACTION
          switch (event.action) {
            case StepperAction.REFRESH:
              if (this.stepperService.dateValue) {
                this.getMeetingSlot(
                  this.stepperService.schedulerParamsWithDate
                );
              }
              break;
            case StepperAction.CLEAR:
              this.clear();
              break;
            case StepperAction.INTERACTED:
              this.formGroup?.markAllAsTouched();
              this.slotCtrl?.updateValueAndValidity();
              break;
            case StepperAction.ANIMATION_DONE:
              this.getAvailabilities();
              break;
            case StepperAction.RELEASE:
              if (this.stepperService.slot?.id) {
                this.releaseMeetingSlot(this.stepperService.slot.id);
              }
              break;

            default:
              break;
          }
          break;

        default:
          break;
      }
    });

    this.dateAdapter.localeChanges.subscribe((value: any) => {
      log.debug('localeChanges', value);
    });
  }

  override ngAfterViewInit(): void {
    log.debug('after view init');
    super.ngAfterViewInit();
    this.setValidators();
  }

  override ngOnDestroy(): void {
    log.debug('destroy');
    super.ngOnDestroy();
  }

  setValidators(): void {
    log.debug('setValidators');
    this.slotCtrl?.setValidators([Validators.required.bind(this)]);
  }

  momentFilter = (date: moment.Moment): boolean => {
    let result = this.availabilitiesDisabled;
    if (this.stepperService.availabilityFilter && date) {
      for (const av of this.stepperService.availabilityFilter) {
        result = result || includes(av, moment(date).format(DATE_FORMAT));
      }
    }
    return Boolean(result);
  };

  dateChanged(date?: moment.Moment | null): void {
    log.debug('dateChanged', date);
    this.calendarDateValue =
      date?.clone() || (null as unknown as moment.Moment);
    if (this.stepperService.dateValue !== date) {
      this.stepperService.dateValue =
        date || (null as unknown as moment.Moment);
      this.dateText = this.formatDateText(this.stepperService.dateValue);
      this.getMeetingSlot(this.stepperService.schedulerParamsWithDate);
    }
  }

  slotSelected(slot?: MeetingSlotDTO): void {
    log.debug('slotSelected', slot);
    if (slot) {
      if (slot) {
        this.slotCtrl?.setValue(Boolean(true));
      } else {
        this.slotCtrl?.reset();
      }
      this.postSelectedMeetingSlot(slot);
    }
  }

  getAvailabilities(): void {
    log.debug('getAvailabilities');
    this.primarySub = this.serviceApi
      .getAvailableDates(this.stepperService.schedulerParams)
      .subscribe((availabilityFilter: FilterDTO) => {
        this.stepperService.availabilityFilter =
          availabilityFilter?.availableDates ||
          (null as unknown as Array<string>);
        this.availabilitiesReady();
      });
  }

  availabilitiesReady(): void {
    log.debug('availabilitiesReady');

    const max = maxBy(
      this.stepperService.availabilityFilter,
      (av: string) => av
    );
    const min = minBy(
      this.stepperService.availabilityFilter,
      (av: string) => av
    );

    this.stepperService.maxDate = max
      ? moment(max)
      : (null as unknown as moment.Moment);
    this.stepperService.minDate = min
      ? moment(min)
      : (null as unknown as moment.Moment);

    if (this.config.autoSlotSearch) {
      const value = find(
        this.stepperService.availabilityFilter,
        (date: string) => {
          if (this.stepperService.dateValue?.isValid()) {
            const m: moment.Moment = moment(date);
            return (
              m &&
              m.isValid() &&
              this.stepperService.dateValue.format(DATE_FORMAT) ===
                m.format(DATE_FORMAT)
            );
          }
          return false;
        }
      );
      if (value) {
        this.stepperService.dateValue = moment(value);
        this.dateText = this.formatDateText(this.stepperService.dateValue);
      } else {
        const firstDateValue = moment(
          head(this.stepperService.availabilityFilter)
        );
        this.stepperService.dateValue =
          firstDateValue && firstDateValue.isValid()
            ? firstDateValue
            : (null as unknown as moment.Moment);
        this.dateText = this.formatDateText(this.stepperService.dateValue);
      }
      if (this.stepperService.dateValue) {
        this.getMeetingSlot(this.stepperService.schedulerParamsWithDate);
      }
    }
  }

  getMeetingSlot(params?: SchedulerParams): void {
    log.debug('getMeetingSlot', params);
    this.secondarySub = this.serviceApi.getMeetingSlot(params).subscribe(
      (slots: Array<MeetingSlotDTO>) => {
        log.debug('getMeetingSlot', slots);
        this.meetingSlotsReady(slots);
        if (!slots) {
          BUS_EMIT({ name: SHOW_SUCCESS_INFO, value: 'no free times found' });
        }
      },
      (error: HttpErrorResponse) => {
        log.error('getMeetingSlot', error);
      }
    );
  }

  meetingSlotsReady(meetingSlots?: Array<MeetingSlotDTO>): void {
    log.debug('meetingSlotsReady', meetingSlots);

    const groups = groupBy(meetingSlots, (slot: MeetingSlotDTO) =>
      head(slot.timeFrom?.split('T'))
    );

    let groupedSlots: Array<MeetingSlotDTO> = Array<MeetingSlotDTO>();
    let selectedDate;

    for (const key in groups) {
      if (!selectedDate && Object.prototype.hasOwnProperty.call(groups, key)) {
        selectedDate = key;
        groupedSlots = groups[key] as Array<MeetingSlotDTO> | [];
      }
    }

    if (selectedDate) {
      this.stepperService.dateValue = moment(selectedDate);
      this.dateText = this.formatDateText(this.stepperService.dateValue);
    }

    this.dataSource.data = groupedSlots;
  }

  postSelectedMeetingSlot(slot: MeetingSlotDTO): void {
    log.debug('postSelectedMeetingSlot', slot);
    const agentId = slot?.agentId || (null as unknown as number);
    this.reserveSub = this.serviceApi
      .postSelectedMeetingSlot(agentId, slot)
      .subscribe(
        (meetingSlot: MeetingSlotDTO) => {
          log.debug('postSelectedMeetingSlot', 'meetingSlot =', meetingSlot);
          this.stepperService.slot = meetingSlot;
          this.clear();
          this.selected.emit();
        },
        (error: HttpErrorResponse) => {
          log.error('postSelectedMeetingSlot', error);
        }
      );
  }

  releaseMeetingSlot(id: number): void {
    log.debug('releaseMeetingSlot', id);
    this.reserveSub = this.serviceApi
      .releaseMeetingSlot(id)
      .subscribe((response: any) => {
        log.debug('releaseMeetingSlot', 'response = ', response);
        this.stepperService.slot = null as unknown as MeetingSlotDTO;
      });
  }

  pageChangeEvent(): void {
    log.debug('pageChangeEvent');
  }

  languageText(languages: Array<LanguageDTO>): string {
    // log.debug('languageText', languages);
    let text = '';

    for (const language of languages) {
      if (text?.length) {
        text = `${text}, ${language.name}`;
      } else {
        text = `${language.name}`;
      }
    }

    return text;
  }

  clear(): void {
    log.debug('clear');
    this.stepperService.availabilityFilter = null as unknown as Array<string>;
    this.dataSource.data = Array<MeetingSlotDTO>();
    this.stepperService.maxDate = null as unknown as moment.Moment;
    this.stepperService.minDate = null as unknown as moment.Moment;
    this.stepperService.dateValue = null as unknown as moment.Moment;
    this.calendarDateValue = null as unknown as moment.Moment;
    this.dateText = '';
  }

  formatDateText(value: moment.Moment): string {
    if (value && value.isValid()) {
      return value.format('dddd D.M.YYYY');
    }
    return '';
  }

  protected override langChanged(lang: string): void {
    log.debug('langChanged', lang, this.calendar);
    super.langChanged(lang);
    this.dateAdapter.setLocale(lang);
    this.calendar.updateTodaysDate();
  }

  get availabilitiesDisabled(): boolean {
    return !Boolean(this.stepperService?.availabilityFilter?.length);
  }

  get minDateValue(): moment.Moment {
    return this.stepperService.minDate;
  }

  get maxDateValue(): moment.Moment {
    return this.stepperService.maxDate;
  }

  get dateValue(): moment.Moment {
    return this.stepperService.dateValue;
  }

  get schedulerColumns(): Array<string> {
    return ['availability'];
  }

  get slotCtrl(): AbstractControl | null {
    return this.formGroup?.get(SLOT_CONTROL);
  }
}
