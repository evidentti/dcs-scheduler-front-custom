import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { Logger } from '@app/@core/logger/logger';
import { Observable } from 'rxjs';
import { StepperBaseDirective } from '@cus/src/stepper/stepper-base';
import {
  StepperAction,
  StepperEvent,
} from '@cus/src/stepper/stepper.component';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { TranslateService } from '@ngx-translate/core';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ParticipantDTO, VideoType } from '@app/@models/models';
import { MatAccordion } from '@angular/material/expansion';
import { EMPTY_PARTICIPANT, TEL_NUMBER_MIN_LENGTH } from '@app/constants';
import { isEqual, isString, remove } from 'lodash-es';
import { AppConfigModule } from '@app/app-config.module';
import PhoneNumber from 'awesome-phonenumber';

const log = new Logger('ParticipantStepComponent');

@Component({
  selector: 'app-participant-step',
  templateUrl: './participant-step.component.html',
  styleUrls: ['./participant-step.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class ParticipantStepComponent
  extends StepperBaseDirective
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('accord', { read: MatAccordion }) accord!: MatAccordion;
  @Input() events!: Observable<StepperEvent>;

  activeParticipant!: ParticipantDTO;
  addedParticipant!: ParticipantDTO;

  constructor(
    private controlContainer: FormGroupDirective,
    private config: AppConfigModule,
    protected override stepperService: StepperService,
    protected override translateService: TranslateService,
    protected override appDataService: AppDataService,
    protected override focusMonitor: FocusMonitor,
    protected override zone: NgZone
  ) {
    super(stepperService, translateService, appDataService, focusMonitor, zone);
    log.debug('construct');
  }

  override ngOnInit(): void {
    log.debug('init');
    super.ngOnInit();
    this.formGroup = this.controlContainer.form;

    this.eventSub = this.events?.subscribe((event: StepperEvent) => {
      log.debug('stepper event', event);

      // STEP
      switch (event.step) {
        case this.step:
          // ACTION
          switch (event.action) {
            case StepperAction.REFRESH:
              break;
            case StepperAction.CLEAR:
              break;
            case StepperAction.INTERACTED:
              break;
            case StepperAction.ANIMATION_DONE:
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
  }

  override ngOnDestroy(): void {
    log.debug('destroy');
    super.ngOnDestroy();
  }

  addParticipant(): void {
    log.debug('addParticipant');
    this.accord?.closeAll();
    const participant = EMPTY_PARTICIPANT();
    this.stepperService.contact.participants?.unshift(participant);
    this.addedParticipant = participant;
  }

  panelOpen(value: ParticipantDTO): void {
    log.debug('panelOpen', value);
    this.activeParticipant = value;
  }

  panelClose(value: ParticipantDTO): void {
    log.debug('panelClose', value);
    this.addedParticipant = null as unknown as ParticipantDTO;
  }

  afterCollapse(value: ParticipantDTO): void {
    log.debug('afterCollapse', value);
  }

  afterExpand(value: ParticipantDTO): void {
    log.debug('afterExpand', value);
  }

  closeAll(): void {
    log.debug('closeAll');
    this.accord?.closeAll();
  }

  removeParticipant(event: ParticipantDTO): void {
    log.debug('removeParticipant', event);
    remove(
      this.stepperService.contact.participants || Array<ParticipantDTO>(),
      (participant: ParticipantDTO) => isEqual(event, participant)
    );
  }

  formatPhoneNumber(nbr: string): string {
    if (isString(nbr) && nbr.length >= TEL_NUMBER_MIN_LENGTH) {
      const firstChar = nbr.substring(0, 1);
      const fixedNbr =
        firstChar === '+' ? new PhoneNumber(nbr) : new PhoneNumber(nbr, 'FI');
      if (fixedNbr?.isValid()) {
        return fixedNbr
          .getNumber('international')
          ?.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
      }
    }

    return nbr;
  }

  get participants(): Array<ParticipantDTO> {
    return (
      this.stepperService.contact.participants ||
      (null as unknown as Array<ParticipantDTO>)
    );
  }

  get meetingParticipantsMaxCount(): number {
    if (this.stepperService.slot?.videoType === VideoType.BROADCAST) {
      return this.config.meetingParticipantsMaxCountBroadcast;
    }
    if (this.stepperService.slot?.videoType === VideoType.VIDEO) {
      return this.config.meetingParticipantsMaxCountVideo;
    }
    // default value is the same as VideoType.VIDEO
    return this.config.meetingParticipantsMaxCountVideo || 0;
  }
}
