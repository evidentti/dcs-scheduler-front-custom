import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Logger } from '@app/@core/logger/logger';
import {
  FilterDTO,
  IdValuePairDTO,
  SelectionListItemDTO,
} from '@app/@models/models';
import { ServiceApi } from '@app/@service-api/service-api';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import {
  filter,
  find,
  forOwn,
  includes,
  indexOf,
  isEqual,
  map,
} from 'lodash-es';
import { Observable } from 'rxjs';
import {
  INVALID,
  StepperAction,
  StepperEvent,
} from '@cus/src/stepper/stepper.component';
import { StepperBaseDirective } from '@cus/src/stepper/stepper-base';
import { TranslateService } from '@ngx-translate/core';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { AppConfigModule } from '@app/app-config.module';
import { NOT_FOUND } from '@app/constants';

const log = new Logger('FilterStepComponent');

@Component({
  selector: 'app-filter-step',
  templateUrl: './filter-step.component.html',
  styleUrls: ['./filter-step.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class FilterStepComponent
  extends StepperBaseDirective
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() events!: Observable<StepperEvent>;

  @ViewChild('companySelection') companySelection!: HTMLElement;
  @ViewChild('topicSelection') topicSelection!: HTMLElement;
  @ViewChild('channelSelection') channelSelection!: HTMLElement;
  @ViewChild('officeSelection') officeSelection!: HTMLElement;
  @ViewChild('agentSelection') agentSelection!: HTMLElement;
  @ViewChild('languageSelection') languageSelection!: HTMLElement;
  @ViewChild('tagSelection') tagSelection!: HTMLElement;

  visibleFilters!: Array<string>;
  tempTagArray!: Array<IdValuePairDTO>;

  aCompanyFilter!: Array<IdValuePairDTO>;
  aTopicFilter!: Array<IdValuePairDTO>;
  aChannelFilter!: Array<IdValuePairDTO>;
  anOfficeFilter!: Array<IdValuePairDTO>;
  anAgentFilter!: Array<IdValuePairDTO>;
  aLanguageFilter!: Array<IdValuePairDTO>;
  aTagFilter!: Array<IdValuePairDTO>;

  get companyFilter(): Array<IdValuePairDTO> {
    return this.aCompanyFilter;
  }

  set companyFilter(value: Array<IdValuePairDTO>) {
    this.aCompanyFilter = value;
  }

  get topicFilter(): Array<IdValuePairDTO> {
    return this.aTopicFilter;
  }

  set topicFilter(filters: Array<IdValuePairDTO>) {
    this.aTopicFilter = filters;
  }

  get channelFilter(): Array<IdValuePairDTO> {
    return this.aChannelFilter;
  }

  set channelFilter(filters: Array<IdValuePairDTO>) {
    this.aChannelFilter = filters;
  }

  get officeFilter(): Array<IdValuePairDTO> {
    return this.anOfficeFilter;
  }

  set officeFilter(filters: Array<IdValuePairDTO>) {
    this.anOfficeFilter = filters;
  }

  get agentFilter(): Array<IdValuePairDTO> {
    if (!this.anAgentFilter) {
      this.anAgentFilter = Array<IdValuePairDTO>();
    }
    return this.anAgentFilter;
  }

  set agentFilter(filters: Array<IdValuePairDTO>) {
    this.anAgentFilter = filters;
  }

  get languageFilter(): Array<IdValuePairDTO> {
    if (!this.aLanguageFilter) {
      this.aLanguageFilter = Array<IdValuePairDTO>();
    }
    return this.aLanguageFilter;
  }

  set languageFilter(filters: Array<IdValuePairDTO>) {
    this.aLanguageFilter = filters;
  }

  get tagFilter(): Array<IdValuePairDTO> {
    return this.aTagFilter;
  }

  set tagFilter(filters: Array<IdValuePairDTO>) {
    this.aTagFilter = filters;
  }

  constructor(
    private controlContainer: FormGroupDirective,
    protected override stepperService: StepperService,
    private serviceApi: ServiceApi,
    private config: AppConfigModule,
    protected override translateService: TranslateService,
    protected override appDataService: AppDataService,
    protected override focusMonitor: FocusMonitor,
    protected override zone: NgZone,
    protected override liveAnnouncer: LiveAnnouncer
  ) {
    super(
      stepperService,
      translateService,
      appDataService,
      focusMonitor,
      zone,
      liveAnnouncer
    );
    log.debug('construct');
  }

  override ngOnInit(): void {
    log.debug('init');
    super.ngOnInit();
    this.formGroup = this.controlContainer.form;
    if (this.formGroup) {
      this.formGroup.addControl(
        'filterStepCompanyControl',
        new FormControl(null)
      );
      this.formGroup.addControl(
        'filterStepTopicControl',
        new FormControl(null)
      );
      this.formGroup.addControl(
        'filterStepChannelControl',
        new FormControl(null)
      );
      this.formGroup.addControl(
        'filterStepOfficeControl',
        new FormControl(null)
      );
      this.formGroup.addControl(
        'filterStepAgentControl',
        new FormControl(null)
      );
      this.formGroup.addControl(
        'filterStepLanguageControl',
        new FormControl(null)
      );
      this.formGroup.addControl('filterStepTagControl', new FormControl(null));
    }

    this.visibleFilters = this.config.visibleFilterFields;

    this.eventSub = this.events?.subscribe((event: StepperEvent) => {
      log.debug('stepper event', event);

      // STEP
      switch (event.step) {
        case this.step:
          // ACTION
          switch (event.action) {
            case StepperAction.REFRESH:
              this.getFilters();
              break;
            case StepperAction.CLEAR:
              break;
            case StepperAction.INTERACTED:
              this.checkErrors();
              break;
            case StepperAction.ANIMATION_DONE:
              this.getFilters();
              break;
            case StepperAction.RELEASE:
              break;

            default:
              break;
          }
          break;

        default:
          break;
      }
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
    this.companyCtrl?.setValidators([Validators.required.bind(this)]);
  }

  showFilter(name: string): boolean {
    // log.debug('showFilter', name);
    return this.formGroupRef && includes(this.visibleFilters, name);
  }

  isRequired(control: AbstractControl | null): boolean {
    if (control?.validator) {
      const validator = control.validator({} as AbstractControl);
      return Boolean(validator?.['required']);
    }
    return false;
  }

  checkErrors(): void {
    log.debug('checkErrors');
    forOwn(
      this.formGroup?.controls,
      (control: AbstractControl, key: string) => {
        let invalidControl: string = null as unknown as string;
        if (control.status === INVALID) {
          if (!invalidControl) {
            invalidControl = key;
          }
        }
        switch (key) {
          case 'filterStepCompanyControl':
            this.companySelection?.focus();
            this.announceAssertive('errors on the page');
            break;
          case 'filterStepTopicControl':
            break;
          case 'filterStepChannelControl':
            break;
          case 'filterStepOfficeControl':
            break;
          case 'filterStepAgentControl':
            break;
          case 'filterStepLanguageControl':
            break;
          case 'filterStepTagControl':
            break;
          default:
            break;
        }
      }
    );
  }

  companyChanged(event: MatSelectChange): void {
    log.debug('companyChanged', event);
    this.stepperService.companyValue =
      find(this.companyFilter, { id: Number(event?.value) }) ||
      (null as unknown as IdValuePairDTO);
    this.getFilters();
  }

  topicChanged(event: MatSelectChange): void {
    log.debug('topicChanged', event);
    this.stepperService.topicValue =
      find(this.topicFilter, { id: Number(event?.value) }) ||
      (null as unknown as IdValuePairDTO);
    this.getFilters();
  }

  channelChanged(event: MatSelectChange): void {
    log.debug('channelChanged', event);
    this.stepperService.channelValue =
      find(this.channelFilter, { id: Number(event?.value) }) ||
      (null as unknown as IdValuePairDTO);
    this.getFilters();
  }

  officeChanged(event: MatSelectChange): void {
    log.debug('officeChanged', event);
    this.stepperService.officeValue =
      find(this.officeFilter, { id: Number(event?.value) }) ||
      (null as unknown as IdValuePairDTO);
    this.getFilters();
  }

  agentChanged(event: MatSelectChange): void {
    log.debug('agentChanged', event);
    this.stepperService.agentValue =
      find(this.agentFilter, { id: Number(event?.value) }) ||
      (null as unknown as IdValuePairDTO);
    this.getFilters();
  }

  languageChanged(event: MatSelectChange): void {
    log.debug('languageChanged', event);
    this.stepperService.languageValue =
      find(this.languageFilter, { id: Number(event?.value) }) ||
      (null as unknown as IdValuePairDTO);
    this.getFilters();
  }

  tagChanged(event: MatSelectChange): void {
    log.debug('tagChanged', event);
    this.tempTagArray = event?.value as Array<SelectionListItemDTO>;
  }

  openedChanged(opened: boolean): void {
    log.debug('openedChanged', opened);
    if (!opened && !isEqual(this.stepperService.tagValue, this.tempTagArray)) {
      this.stepperService.tagValue = map(
        this.tempTagArray,
        (value: IdValuePairDTO) => value.id
      );
      this.getFilters();
    }
  }

  getFilters(): void {
    log.debug('getFilters');
    this.primarySub = this.serviceApi
      .getFilters(this.stepperService.schedulerParams)
      .subscribe((schedulerFilter: FilterDTO) => {
        this.companyFilter =
          schedulerFilter?.companies ||
          (null as unknown as Array<IdValuePairDTO>);
        this.topicFilter =
          schedulerFilter?.topics || (null as unknown as Array<IdValuePairDTO>);
        this.channelFilter =
          schedulerFilter?.channels ||
          (null as unknown as Array<IdValuePairDTO>);
        this.officeFilter =
          schedulerFilter?.offices ||
          (null as unknown as Array<IdValuePairDTO>);
        this.agentFilter =
          schedulerFilter?.agents || (null as unknown as Array<IdValuePairDTO>);
        this.languageFilter =
          schedulerFilter?.languages ||
          (null as unknown as Array<IdValuePairDTO>);
        this.tagFilter =
          schedulerFilter?.tags || (null as unknown as Array<IdValuePairDTO>);
        this.filtersReady();
      });
  }

  filtersReady(): void {
    log.debug('filtersReady');
    const companyValue =
      find(this.companyFilter, {
        id: this.stepperService.companyValue?.id,
      }) || (null as unknown as IdValuePairDTO);
    this.stepperService.companyValue = companyValue;
    if (companyValue?.id) {
      this.companyCtrl?.setValue(companyValue.id);
    } else {
      this.companyCtrl?.reset();
    }

    const topicValue =
      find(this.topicFilter, {
        id: this.stepperService.topicValue?.id,
      }) || (null as unknown as IdValuePairDTO);
    this.stepperService.topicValue = topicValue;
    if (topicValue?.id) {
      this.topicCtrl?.setValue(topicValue.id);
    } else {
      this.topicCtrl?.reset();
    }

    const channelValue =
      find(this.channelFilter, {
        id: this.stepperService.channelValue?.id,
      }) || (null as unknown as IdValuePairDTO);
    this.stepperService.channelValue = channelValue;
    if (channelValue?.id) {
      this.channelCtrl?.setValue(channelValue.id);
    } else {
      this.channelCtrl?.reset();
    }

    const officeValue =
      find(this.officeFilter, {
        id: this.stepperService.officeValue?.id,
      }) || (null as unknown as IdValuePairDTO);
    this.stepperService.officeValue = officeValue;
    if (officeValue?.id) {
      this.officeCtrl?.setValue(officeValue.id);
    } else {
      this.officeCtrl?.reset();
    }

    const agentValue =
      find(this.agentFilter, {
        id: this.stepperService.agentValue?.id,
      }) || (null as unknown as IdValuePairDTO);
    this.stepperService.agentValue = agentValue;
    if (agentValue?.id) {
      this.agentCtrl?.setValue(agentValue.id);
    } else {
      this.agentCtrl?.reset();
    }

    const languageValue =
      find(this.languageFilter, {
        id: this.stepperService.languageValue?.id,
      }) || (null as unknown as IdValuePairDTO);
    this.stepperService.languageValue = languageValue;
    if (languageValue?.id) {
      this.languageCtrl?.setValue(languageValue.id);
    } else {
      this.languageCtrl?.reset();
    }

    const tagValue: Array<IdValuePairDTO> = filter(
      this.tagFilter,
      (value: IdValuePairDTO) => {
        const found = indexOf(this.stepperService.tagValue, value.id);
        if (found !== NOT_FOUND) {
          return value;
        }
        return null;
      }
    ) as Array<IdValuePairDTO>;

    this.stepperService.tagValue = map(
      tagValue,
      (value: IdValuePairDTO) => value.id
    );
    this.tagCtrl?.setValue(tagValue);
  }

  get companyCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepCompanyControl');
  }

  get topicCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepTopicControl');
  }

  get channelCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepChannelControl');
  }

  get officeCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepOfficeControl');
  }

  get agentCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepAgentControl');
  }

  get languageCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepLanguageControl');
  }

  get tagCtrl(): AbstractControl | null {
    return this.formGroup?.get('filterStepTagControl');
  }
}
