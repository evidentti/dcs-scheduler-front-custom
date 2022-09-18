import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroupDirective,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Logger } from '@app/@core/logger/logger';
import { Observable, Observer, of, Subscription } from 'rxjs';
import {
  EDIT_OPEN_ANIMATIONS,
  StepperBaseDirective,
} from '@cus/src/stepper/stepper-base';
import {
  StepperAction,
  StepperEvent,
} from '@cus/src/stepper/stepper.component';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import { Contact, PhoneNumberDTO } from '@app/interfaces';
import { includes, isString } from 'lodash-es';
import PhoneNumber from 'awesome-phonenumber';
import { environment } from '@env/environment';
import { MediaObserver } from '@angular/flex-layout';
import { NUMBER_POSSIBILITIES } from '@app/constants';
import { TranslateService } from '@ngx-translate/core';
import { AppDataService } from '@app/@core/app-data-srv/app-data.service';
import { FocusMonitor } from '@angular/cdk/a11y';
import { InputService } from '@app/@core/input-srv/input.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ServiceApi } from '@app/@service-api/service-api';

const log = new Logger('ContactStepComponent');

@Component({
  selector: 'app-contact-step',
  templateUrl: './contact-step.component.html',
  styleUrls: ['./contact-step.component.scss'],
  animations: EDIT_OPEN_ANIMATIONS,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class ContactStepComponent
  extends StepperBaseDirective
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() events!: Observable<StepperEvent>;

  firstNameSub!: Subscription;
  lastNameSub!: Subscription;
  personalIdSub!: Subscription;
  phoneSub!: Subscription;
  emailSub!: Subscription;
  commentSub!: Subscription;

  aPhoneErrorInfo!: string;

  get phoneErrorInfo(): string {
    if (!this.aPhoneErrorInfo) {
      this.aPhoneErrorInfo = '';
    }
    return this.aPhoneErrorInfo;
  }

  set phoneErrorInfo(info: string) {
    this.aPhoneErrorInfo = info;
  }

  constructor(
    private controlContainer: FormGroupDirective,
    protected override stepperService: StepperService,
    protected override translateService: TranslateService,
    private media: MediaObserver,
    private inputService: InputService,
    private serviceApi: ServiceApi,
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
    if (this.formGroup) {
      this.formGroup.addControl(
        'contactStepFirstNameControl',
        new FormControl('')
      );
      this.formGroup.addControl(
        'contactStepLastNameControl',
        new FormControl('')
      );
      this.formGroup.addControl(
        'contactStepPersonalIdControl',
        new FormControl('', { updateOn: 'blur' })
      );
      this.formGroup.addControl(
        'contactStepSmsSelectorControl',
        new FormControl(false)
      );
      this.formGroup.addControl(
        'contactStepEmailSelectorControl',
        new FormControl(false)
      );
      this.formGroup.addControl('contactStepPhoneControl', new FormControl(''));
      this.formGroup.addControl('contactStepEmailControl', new FormControl(''));
      this.formGroup.addControl(
        'contactStepCommentControl',
        new FormControl('')
      );
    }

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
              this.smsSelectorCtrl?.reset();
              this.emailSelectorCtrl?.reset();
              this.updateSmsValidators(Boolean(this.smsSelectorCtrl?.value));
              this.updateEmailValidators(
                Boolean(this.emailSelectorCtrl?.value)
              );
              break;
            case StepperAction.INTERACTED:
              this.formGroup?.markAllAsTouched();
              this.smsSelectorCtrl?.updateValueAndValidity();
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

    this.firstNameSub =
      this.firstNameCtrl?.valueChanges.subscribe((value: string) => {
        this.contact.firstName = value || '';
      }) || (null as unknown as Subscription);

    this.lastNameSub =
      this.lastNameCtrl?.valueChanges.subscribe((value: string) => {
        this.contact.lastName = value || '';
      }) || (null as unknown as Subscription);

    this.personalIdSub =
      this.personalIdCtrl?.valueChanges.subscribe((value: string) => {
        this.contact.personalId = value || '';
      }) || (null as unknown as Subscription);

    this.phoneSub =
      this.phoneCtrl?.valueChanges.subscribe((/* phone: string*/) => {
        this.contact.phone = this.phoneNumber?.getNumber('e164');
      }) || (null as unknown as Subscription);

    this.emailSub =
      this.emailCtrl?.valueChanges.subscribe((value: string) => {
        this.contact.email = value || '';
      }) || (null as unknown as Subscription);

    this.commentSub =
      this.commentCtrl?.valueChanges.subscribe((value: string) => {
        this.contact.comments = value || '';
      }) || (null as unknown as Subscription);
  }

  override ngAfterViewInit(): void {
    log.debug('after view init');
    super.ngAfterViewInit();
    this.setValidators();
  }

  override ngOnDestroy(): void {
    log.debug('destroy');
    super.ngOnDestroy();

    this.firstNameSub?.unsubscribe();
    this.lastNameSub?.unsubscribe();
    this.personalIdSub?.unsubscribe();
    this.phoneSub?.unsubscribe();
    this.commentSub?.unsubscribe();
  }

  personalIdValidator(
    control: AbstractControl
  ): Observable<ValidationErrors | null> {
    log.debug('personalIdValidator', control.value);
    if (control?.value) {
      return this.serviceApi.validatePersonalId(control.value);
    } else {
      return of(null);
    }
  }

  messageSelectorValidator =
    (/* control: AbstractControl*/): ValidationErrors | null => {
      const untouched =
        !Boolean(this.smsSelectorCtrl?.touched) ||
        !Boolean(this.emailSelectorCtrl?.touched);
      const hasValue =
        Boolean(this.smsSelectorCtrl?.value) ||
        Boolean(this.emailSelectorCtrl?.value);
      if (!untouched && !hasValue) {
        return { invalid: true };
      }
      return null;
    };

  phoneValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const nbr = control?.value as string;
    if (nbr) {
      const firstChar = nbr.substring(0, 1);
      const fixedNbr =
        firstChar === '+'
          ? new PhoneNumber(nbr)
          : new PhoneNumber(nbr, environment.defaultCountry);
      this.phoneErrorInfo = null as unknown as string;
      if (!fixedNbr.isValid()) {
        const possibility: string = (fixedNbr?.toJSON() as PhoneNumberDTO)
          ?.possibility;
        if (includes(NUMBER_POSSIBILITIES, possibility)) {
          this.phoneErrorInfo = possibility;
        }
        return { invalid: true };
      }
    }
    return null;
  };

  setValidators(): void {
    log.debug('setValidators');
    if (this.isMandatoryInput('customerFirstName')) {
      this.firstNameCtrl?.setValidators([Validators.required.bind(this)]);
    } else {
      this.firstNameCtrl?.clearValidators();
    }
    if (this.isMandatoryInput('customerLastName')) {
      this.lastNameCtrl?.setValidators([Validators.required.bind(this)]);
    } else {
      this.lastNameCtrl?.clearValidators();
    }
    if (this.isMandatoryInput('personalId')) {
      this.personalIdCtrl?.setValidators([Validators.required.bind(this)]);
      this.personalIdCtrl?.setAsyncValidators([
        this.personalIdValidator.bind(this),
      ]);
    } else {
      this.personalIdCtrl?.setAsyncValidators([
        this.personalIdValidator.bind(this),
      ]);
    }
    if (this.isMandatoryInput('customerPhoneNumber')) {
      this.phoneCtrl?.setValidators([
        Validators.required.bind(this),
        this.phoneValidator,
      ]);
    } else {
      this.phoneCtrl?.setValidators([this.phoneValidator]);
    }
    if (this.isMandatoryInput('customerEmail')) {
      this.emailCtrl?.setValidators([Validators.required.bind(this)]);
    } else {
      this.emailCtrl?.clearValidators();
    }
    if (this.isMandatoryInput('messageSelector')) {
      this.smsSelectorCtrl?.setValidators([this.messageSelectorValidator]);
    } else {
      this.smsSelectorCtrl?.clearValidators();
    }
  }

  checkInput(): void {
    const nbr = this.checkPhoneNumber;
    if (isString(nbr)) {
      this.phoneCtrl?.setValue(nbr);
    } else {
      this.phoneCtrl?.reset();
    }
    this.phoneCtrl?.updateValueAndValidity();
  }

  paste(): void {
    setTimeout(
      (self: ContactStepComponent) => {
        self.formatNumber();
      },
      0,
      this
    );
  }

  spaceKeydown(event: Event | KeyboardEvent): boolean {
    const index = (event.target as HTMLInputElement)?.selectionStart || 0;
    const str = (event.target as HTMLInputElement)?.value;
    const test =
      str.substring(0, index) +
      (event as KeyboardEvent).key +
      str.substring(index, str.length);
    return !Boolean(test?.includes('  '));
  }

  formatNumber(): void {
    const nbr =
      this.phoneNumber?.getNumber('international') ||
      this.phoneNumber?.getNumber('national') ||
      this.fixedPhoneNumber;
    if (isString(nbr)) {
      const firstChar = nbr.substring(0, 1);
      const fixedNbr =
        firstChar === '+'
          ? new PhoneNumber(nbr)
          : new PhoneNumber(nbr, environment.defaultCountry);
      if (fixedNbr?.isPossible()) {
        this.phoneCtrl?.setValue(fixedNbr.getNumber('international'));
      } else {
        this.phoneCtrl?.setValue(this.fixedPhoneNumber);
      }
    }
  }

  isInput(value: string): Observable<boolean> {
    return of(this.formGroupRef && this.inputService.isPersonInput(value));
  }

  isRequired(control: AbstractControl | null): boolean {
    if (control?.validator) {
      const validator = control.validator({} as AbstractControl);
      return Boolean(validator?.['required']);
    }
    return false;
  }

  isMandatoryInput(value: string): boolean {
    return Boolean(value && this.inputService.isMandatoryPersonInput(value));
  }

  updateSmsValidators(checked: boolean): void {
    log.debug('updateSmsValidators', checked);
    if (checked || this.isMandatoryInput('customerPhoneNumber')) {
      this.phoneCtrl?.setValidators([
        Validators.required.bind(this),
        this.phoneValidator,
      ]);
    } else {
      this.phoneCtrl?.setValidators([this.phoneValidator]);
    }
  }

  updateEmailValidators(checked: boolean): void {
    log.debug('updateEmailValidators', checked);
    if (checked || this.isMandatoryInput('customerEmail')) {
      this.emailCtrl?.setValidators([Validators.required.bind(this)]);
    } else {
      this.emailCtrl?.clearValidators();
    }
  }

  smsSelectorChanged(value: MatCheckboxChange): void {
    log.debug('smsSelectorChanged', value);
    this.updateSmsValidators(value.checked);
    this.smsSelectorCtrl?.updateValueAndValidity();
  }

  emailSelectorChanged(value: MatCheckboxChange): void {
    log.debug('emailSelectorChanged', value);
    this.updateEmailValidators(value.checked);
    this.smsSelectorCtrl?.updateValueAndValidity();
  }

  get contact(): Contact {
    return this.stepperService.contact;
  }

  get checkPhoneNumber(): string {
    const firstChar = (this.phoneCtrl?.value as string)?.substring(0, 1);
    return firstChar === '+'
      ? `+${(this.phoneCtrl?.value as string)?.replace(/[^0-9\s]/gm, '')}`
      : (this.phoneCtrl?.value as string)?.replace(/[^0-9\s]/gm, '');
  }

  get phoneNumber(): PhoneNumber | null {
    const fixedPhoneNumber = this.fixedPhoneNumber;
    if (isString(fixedPhoneNumber)) {
      return new PhoneNumber(fixedPhoneNumber);
    }
    return null;
  }

  get fixedPhoneNumber(): string {
    return this.checkPhoneNumber?.replace(/\s\s+/gm, ' ');
  }

  get emailInputType(): string {
    return this.media.isActive('xs') || this.media.isActive('sm')
      ? 'text'
      : 'email';
  }

  get showMessageSelectorError(): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      const mandatory = this.isMandatoryInput('messageSelector');
      const untouched =
        !Boolean(this.smsSelectorCtrl?.touched) ||
        !Boolean(this.emailSelectorCtrl?.touched);
      const hasValue =
        Boolean(this.smsSelectorCtrl?.value) ||
        Boolean(this.emailSelectorCtrl?.value);
      observer.next(mandatory && !untouched && !hasValue);
      observer.complete();
    });
  }

  get firstNameCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepFirstNameControl');
  }

  get lastNameCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepLastNameControl');
  }

  get personalIdCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepPersonalIdControl');
  }

  get smsSelectorCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepSmsSelectorControl');
  }

  get emailSelectorCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepEmailSelectorControl');
  }

  get phoneCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepPhoneControl');
  }

  get emailCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepEmailControl');
  }

  get commentCtrl(): AbstractControl | null {
    return this.formGroup?.get('contactStepCommentControl');
  }
}
