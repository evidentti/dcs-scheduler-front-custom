import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatStep } from '@angular/material/stepper';
import { Logger } from '@app/@core/logger/logger';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@shared';
import { take } from 'rxjs/operators';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor, FocusOrigin, LiveAnnouncer } from '@angular/cdk/a11y';
import { DURATION, POLITINESS_ASSERTIVE } from './stepper.component';
import { animate, style, transition, trigger } from '@angular/animations';

const log = new Logger('StepperBaseDirective');

export const EDIT_OPEN_ANIMATIONS = [
  trigger('stepErrorAnimation', [
    transition(':enter', [
      style({ transform: 'translateY(-0.6rem)', opacity: 0 }),
      animate('0.25s', style({ transform: 'translateY(0)', opacity: 1 })),
    ]),
  ]),
];

@UntilDestroy()
@Directive()
export class StepperBaseDirective implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('focusMonitorComponent')
  focusMonitorComponent!: ElementRef<HTMLElement>;
  @Input() step!: MatStep;

  protected formGroup!: FormGroup;

  protected anEventSub!: Subscription;
  protected aPrimarySub!: Subscription;
  protected aSecondarySub!: Subscription;
  protected aReserveSub!: Subscription;

  get eventSub(): Subscription {
    return this.anEventSub;
  }

  set eventSub(sub: Subscription) {
    this.anEventSub?.unsubscribe();
    this.anEventSub = sub;
  }

  get primarySub(): Subscription {
    return this.aPrimarySub;
  }

  set primarySub(sub: Subscription) {
    this.aPrimarySub?.unsubscribe();
    this.aPrimarySub = sub;
  }

  get secondarySub(): Subscription {
    return this.aSecondarySub;
  }

  set secondarySub(sub: Subscription) {
    this.aSecondarySub?.unsubscribe();
    this.aSecondarySub = sub;
  }

  get reserveSub(): Subscription {
    return this.aReserveSub;
  }

  set reserveSub(sub: Subscription) {
    this.aReserveSub?.unsubscribe();
    this.aReserveSub = sub;
  }

  constructor(
    protected stepperService: StepperService,
    protected translateService: TranslateService,
    protected appDataService?: AppDataService,
    protected focusMonitor?: FocusMonitor,
    protected zone?: NgZone,
    protected liveAnnouncer?: LiveAnnouncer
  ) {
    log.debug('construct');
  }

  ngOnInit(): void {
    log.debug('init');

    this.translateService.onLangChange
      .pipe(untilDestroyed(this))
      .subscribe((event: LangChangeEvent) => {
        log.debug('onLangChange', event);
        this.langChanged(event?.lang);
      });
  }

  ngAfterViewInit(): void {
    log.debug('after view init');

    if (this.focusMonitorComponent) {
      this.focusMonitor
        ?.monitor(this.focusMonitorComponent, true)
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
    this.primarySub?.unsubscribe();
    this.secondarySub?.unsubscribe();
    this.reserveSub?.unsubscribe();

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

  announceAssertive(text: string): void {
    log.debug('announceAssertive', text);
    this.translateService
      .get(text)
      .pipe(take(1))
      .subscribe((message: string) => {
        void this.liveAnnouncer?.announce(
          message,
          POLITINESS_ASSERTIVE,
          DURATION
        );
      });
  }

  protected langChanged(lang: string): void {
    log.debug('langChanged', lang);
    if (lang) {
      this.stepperService.language = lang;
      moment.locale(lang);
    }
  }

  get language(): string {
    return this.stepperService.language;
  }

  get formGroupRef(): FormGroup {
    return this.formGroup;
  }

  get showLoadingAnimation(): boolean {
    return (
      (this.primarySub && !this.primarySub.closed) ||
      (this.secondarySub && !this.secondarySub.closed) ||
      (this.reserveSub && !this.reserveSub.closed)
    );
  }
}
