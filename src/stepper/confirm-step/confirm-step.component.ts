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
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { MeetingDTO, MeetingSlotDTO } from '@app/@models/models';
import { TranslateService } from '@ngx-translate/core';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Contact } from '@app/interfaces';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

const log = new Logger('ConfirmStepComponent');

@Component({
  selector: 'app-confirm-step',
  templateUrl: './confirm-step.component.html',
  styleUrls: ['./confirm-step.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class ConfirmStepComponent
  extends StepperBaseDirective
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() events!: Observable<StepperEvent>;

  response!: MeetingDTO;
  defaultImage = environment.brand + environment.defaultImage;

  constructor(
    private controlContainer: FormGroupDirective,
    private iconReg: MatIconRegistry,
    private sanitizer: DomSanitizer,
    protected override stepperService: StepperService,
    protected override translateService: TranslateService,
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

  get slot(): MeetingSlotDTO {
    return this.stepperService.slot;
  }

  get contact(): Contact {
    return this.stepperService.contact;
  }
}
