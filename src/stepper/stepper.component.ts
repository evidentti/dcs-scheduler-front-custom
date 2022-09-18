import { CdkStep, StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from '@app/@core/data-srv/data.service';
import { Logger } from '@app/@core/logger/logger';
import { IdValuePairDTO } from '@app/@models/idValuePairDTO';
import { environment } from '@env/environment';
import { Subject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@shared';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { ExtraService } from '@app/@service-api/services/extra.service';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { I18nService } from '@app/@core/i18n-srv/i18n.service';
import { InputService } from '@app/@core/input-srv/input.service';

export const COMPANY_CONTROL = 'companyControl';
export const TOPIC_CONTROL = 'topicControl';
export const CHANNEL_CONTROL = 'channelControl';
export const OFFICE_CONTROL = 'officeControl';
export const AGENT_CONTROL = 'agentControl';
export const LANGUAGE_CONTROL = 'languageControl';
export const TAG_CONTROL = 'tagControl';
export const SLOT_CONTROL = 'slotControl';
export const INVALID = 'INVALID';

export const DURATION = 3000;
export const POLITINESS_ASSERTIVE = 'assertive';
export const POLITINESS_POLITE = 'polite';

export type StepperActionEnum =
  | 'REFRESH'
  | 'CLEAR'
  | 'INTERACTED'
  | 'ANIMATION_DONE'
  | 'RELEASE';

/* eslint-disable */
export const StepperAction = {
  REFRESH: 'REFRESH' as StepperActionEnum,
  CLEAR: 'CLEAR' as StepperActionEnum,
  INTERACTED: 'INTERACTED' as StepperActionEnum,
  ANIMATION_DONE: 'ANIMATION_DONE' as StepperActionEnum,
  RELEASE: 'RELEASE' as StepperActionEnum,
};
/* eslint-enable */

const log = new Logger('StepperComponent');

export interface StepperEvent {
  step?: CdkStep;
  action?: StepperActionEnum;
}

@UntilDestroy()
@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('focusMonitorComponent', { read: ElementRef })
  focusMonitorComponent!: ElementRef;
  @ViewChild('stepperSection') stepperSection!: ElementRef;
  @ViewChild('stepper') private stepper!: MatStepper;
  @ViewChild('filterStep') private filterStep!: MatStep;
  @ViewChild('meetingStep') private meetingStep!: MatStep;
  @ViewChild('contactStep') private contactStep!: MatStep;
  @ViewChild('participantStep') private participantStep!: MatStep;
  @ViewChild('confirmStep') private confirmStep!: MatStep;
  @ViewChild('summaryStep') private summaryStep!: MatStep;

  isLinear = true;

  eventSub: Subject<StepperEvent> = new Subject<StepperEvent>();

  private aFilterFormGroup!: FormGroup;
  private aMeetingFormGroup!: FormGroup;
  private aContactFormGroup!: FormGroup;
  private aParticipantFormGroup!: FormGroup;
  private aConfirmFormGroup!: FormGroup;
  private aSummaryFormGroup!: FormGroup;

  get filterFormGroup(): FormGroup {
    if (!this.aFilterFormGroup) {
      this.aFilterFormGroup = this.formBuilder.group({});
    }
    return this.aFilterFormGroup;
  }

  get meetingFormGroup(): FormGroup {
    if (!this.aMeetingFormGroup) {
      this.aMeetingFormGroup = this.formBuilder.group({});
    }
    return this.aMeetingFormGroup;
  }

  get contactFormGroup(): FormGroup {
    if (!this.aContactFormGroup) {
      this.aContactFormGroup = this.formBuilder.group({});
    }
    return this.aContactFormGroup;
  }

  get participantFormGroup(): FormGroup {
    if (!this.aParticipantFormGroup) {
      this.aParticipantFormGroup = this.formBuilder.group({});
    }
    return this.aParticipantFormGroup;
  }

  get confirmFormGroup(): FormGroup {
    if (!this.aConfirmFormGroup) {
      this.aConfirmFormGroup = this.formBuilder.group({});
    }
    return this.aConfirmFormGroup;
  }

  get summaryFormGroup(): FormGroup {
    if (!this.aSummaryFormGroup) {
      this.aSummaryFormGroup = this.formBuilder.group({});
    }
    return this.aSummaryFormGroup;
  }

  constructor(
    private iconReg: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private dataService: DataService,
    private stepperService: StepperService,
    private translateService: TranslateService,
    private extraService: ExtraService,
    private appDataService: AppDataService,
    private inputService: InputService,
    private focusMonitor: FocusMonitor,
    private zone: NgZone,
    private i18nService: I18nService
  ) {
    log.debug('construct');
    this.iconReg.addSvgIcon(
      'done_white',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        environment.assets + 'done_white.svg'
      )
    );
    this.iconReg.addSvgIcon(
      'edit',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        environment.assets + 'edit.svg'
      )
    );
  }

  ngOnInit(): void {
    log.debug('init');

    this.stepperService.language = this.translateService.currentLang;
    moment.locale(this.stepperService.language);

    this.dataService.watchCompanyInit
      .pipe(untilDestroyed(this))
      .subscribe((company: IdValuePairDTO) => {
        log.debug('watch company', company);
        this.stepperService.defaultCompanyValue = company;
      });

    this.translateService.onLangChange
      .pipe(untilDestroyed(this))
      .subscribe((event: LangChangeEvent) => {
        log.debug('onLangChange', event);
        if (event?.lang) {
          this.sendStepperEvent(StepperAction.REFRESH);
        }
      });
  }

  ngAfterViewInit(): void {
    log.debug('after view init');

    if (this.focusMonitorComponent) {
      this.focusMonitor
        .monitor(this.focusMonitorComponent, true)
        .subscribe((origin) =>
          this.zone?.run(() => {
            if (origin && this.appDataService) {
              this.appDataService.bodyFocus = this.formatFocusClass(origin);
            }
          })
        );
    }
  }

  ngOnDestroy(): void {
    log.debug('destroy');
    this.eventSub?.unsubscribe();

    if (this.focusMonitorComponent) {
      this.focusMonitor?.stopMonitoring(this.focusMonitorComponent);
    }
  }

  formatFocusClass(origin: FocusOrigin): string {
    log.debug('formatFocusClass', origin);
    return origin ? `cdk-${origin}-focused` : 'blurred';
  }

  updateFocus(target: HTMLElement, type: string): void {
    log.debug('updateFocus', type, target);
    if (target) {
      switch (type) {
        case 'touch':
        case 'mouse':
        case 'program':
        case 'keyboard':
          this.focusMonitor?.focusVia(target, type);
          break;

        default:
          break;
      }
    }
  }

  slotSelected(): void {
    log.debug('slotSelected');
    this.stepper.next();
  }

  stepChanged(event: StepperSelectionEvent): void {
    log.debug('stepChanged', event);

    switch (event.selectedStep) {
      case this.filterStep:
        this.filterStep?.reset();
        this.meetingStep?.reset();
        this.contactStep?.reset();
        this.participantStep?.reset();
        this.confirmStep?.reset();
        this.summaryStep?.reset();
        this.stepperService.clear();
        this.sendStepperEventWithStep(this.filterStep, StepperAction.CLEAR);
        this.sendStepperEventWithStep(this.meetingStep, StepperAction.CLEAR);
        this.sendStepperEventWithStep(this.meetingStep, StepperAction.RELEASE);
        this.sendStepperEventWithStep(this.contactStep, StepperAction.CLEAR);
        this.sendStepperEventWithStep(
          this.participantStep,
          StepperAction.CLEAR
        );
        this.sendStepperEventWithStep(this.confirmStep, StepperAction.CLEAR);
        this.sendStepperEventWithStep(this.summaryStep, StepperAction.CLEAR);
        break;
      case this.meetingStep:
        break;
      case this.contactStep:
        break;
      case this.participantStep:
        break;
      case this.confirmStep:
        break;
      case this.summaryStep:
        break;

      default:
        break;
    }
  }

  animationDone(): void {
    log.debug('animationDone');

    switch (this.stepper.selected) {
      case this.filterStep:
        this.scrollToTop();
        break;
      case this.meetingStep:
      case this.contactStep:
      case this.participantStep:
      case this.confirmStep:
      case this.summaryStep:
        this.scrollToStepper();
        break;

      default:
        break;
    }

    this.sendStepperEvent(StepperAction.ANIMATION_DONE);
  }

  stepInteracted(event: CdkStep): void {
    log.debug('stepInteracted', event);
    this.sendStepperEvent(StepperAction.INTERACTED);
  }

  sendStepperEvent(action?: StepperActionEnum): void {
    log.debug('sendStepperEvent', action);
    const event = this.stepperEvent;
    event.action = action;
    this.eventSub.next(event);
  }

  sendStepperEventWithStep(step: CdkStep, action?: StepperActionEnum): void {
    log.debug('sendStepperEventWithStep', step, action);
    const event: StepperEvent = {
      step,
      action,
    };
    this.eventSub.next(event);
  }

  setLanguage(language: string): void {
    this.i18nService.language = language;
  }

  scrollToTop(): void {
    log.debug('scrollToTop');
    setTimeout(
      (self: StepperComponent) => {
        (self.focusMonitorComponent?.nativeElement as HTMLElement)?.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      },
      0,
      this
    );
  }

  scrollToStepper(): void {
    log.debug('scrollToStepper');
    setTimeout(
      (self: StepperComponent) => {
        const offsetTop =
          (this.stepperSection.nativeElement as HTMLElement)?.offsetTop || 0;
        (self.focusMonitorComponent?.nativeElement as HTMLElement)?.scrollTo({
          top: offsetTop,
          left: 0,
          behavior: 'smooth',
        });
      },
      0,
      this
    );
  }

  get stepperEvent(): StepperEvent {
    return { step: this.stepper?.selected } as StepperEvent;
  }

  get showRecaptchaInfo(): boolean {
    return this.extraService.hideRecaptchaBadge;
  }

  get languages(): string[] {
    return this.i18nService.supportedLanguages;
  }

  get language(): string {
    return this.stepperService.language;
  }

  get showParticipants(): boolean {
    return this.inputService.isPersonInput('participants');
  }

  get meetingStepEditable(): boolean {
    return false;
  }

  get contactStepEditable(): boolean {
    return true;
  }

  get participantStepEditable(): boolean {
    return true;
  }

  get confirmStepEditable(): boolean {
    return true;
  }
}
