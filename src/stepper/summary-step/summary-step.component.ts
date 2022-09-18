import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { Logger } from '@app/@core/logger/logger';
import { Observable } from 'rxjs';
import { StepperBaseDirective } from '@cus/src/stepper/stepper-base';
import {
  StepperAction,
  StepperEvent,
} from '@cus/src/stepper/stepper.component';
import { environment } from '@env/environment';
import { CAPTCHA, SHOW_SUCCESS_INFO } from '@app/constants';
import { load, ReCaptchaInstance } from 'recaptcha-v3';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { MeetingDTO, MeetingSlotDTO } from '@app/@models/models';
import { ServiceApi } from '@app/@service-api/service-api';
import { HttpErrorResponse } from '@angular/common/http';
import { BUS_EMIT } from '@app/@core/event-bus-srv/event-bus.service';
import { TranslateService } from '@ngx-translate/core';
import { ExtraService } from '@app/@service-api/services/extra.service';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor } from '@angular/cdk/a11y';
import { head } from 'lodash-es';

const log = new Logger('SummaryStepComponent');

@Component({
  selector: 'app-summary-step',
  templateUrl: './summary-step.component.html',
  styleUrls: ['./summary-step.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class SummaryStepComponent
  extends StepperBaseDirective
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() events!: Observable<StepperEvent>;

  response!: MeetingDTO;
  defaultImage = environment.brand + environment.defaultImage;

  constructor(
    private controlContainer: FormGroupDirective,
    private serviceApi: ServiceApi,
    protected override stepperService: StepperService,
    protected override translateService: TranslateService,
    private extraService: ExtraService,
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
              if (this.response?.shortId) {
                this.getMeetingWithShortId(this.response.shortId);
              }
              break;
            case StepperAction.CLEAR:
              this.response = null as unknown as MeetingDTO;
              break;
            case StepperAction.INTERACTED:
              break;
            case StepperAction.ANIMATION_DONE:
              if (!this.response) {
                this.bookMeeting();
              }
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
  }

  override ngOnDestroy(): void {
    log.debug('destroy');
    super.ngOnDestroy();
  }

  bookMeeting(): void {
    log.debug('bookMeeting');
    if (this.stepperService.meeting) {
      if (environment.authMode === CAPTCHA) {
        void load(environment.sitekey).then((recaptcha: ReCaptchaInstance) => {
          if (this.extraService.hideRecaptchaBadge) {
            recaptcha.hideBadge();
          }
          void recaptcha.execute('validate').then((token: string) => {
            log.debug('recaptcha', 'token', token);
            const meeting = this.stepperService.meeting;
            meeting.captcha = token;
            if (!meeting.language) {
              meeting.language = this.languageCode;
            }
            this.postMeeting(meeting);
          });
        });
      } else {
        const meeting = this.stepperService.meeting;
        if (!meeting.language) {
          meeting.language = this.languageCode;
        }
        this.postMeeting(meeting);
      }
    }
  }

  postMeeting(meeting: MeetingDTO): void {
    log.debug('postMeeting', meeting);
    this.primarySub = this.serviceApi.postMeeting(meeting).subscribe(
      (response: MeetingDTO) => {
        log.debug('postMeeting', 'response =', response);
        this.response = response;
        this.stepperService.slot = null as unknown as MeetingSlotDTO;
        BUS_EMIT({ name: SHOW_SUCCESS_INFO, value: 'booking confirmed' });
      },
      (error: HttpErrorResponse) => {
        log.error('postMeeting', error);
      }
    );
  }

  getMeetingWithShortId(id: string): void {
    log.debug('getMeetingWithShortId');
    this.secondarySub = this.serviceApi.getMeetingWithShortId(id).subscribe(
      (response: MeetingDTO) => {
        log.debug('getMeetingWithShortId', response);
        this.response = response;
      },
      (error: HttpErrorResponse) => {
        log.error('getMeeting', error);
      }
    );
  }

  get languageCode(): string | undefined {
    return head(this.language?.split('-'));
  }
}
