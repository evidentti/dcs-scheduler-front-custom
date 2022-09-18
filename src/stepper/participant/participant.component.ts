import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { InputService } from '@app/@core/input-srv/input.service';
import { Logger } from '@app/@core/logger/logger';
import { ParticipantDTO } from '@app/@models/models';
import { ServiceApi } from '@app/@service-api/service-api';
import { NUMBER_POSSIBILITIES } from '@app/constants';
import { PhoneNumberDTO } from '@app/interfaces';
import { environment } from '@env/environment';
import PhoneNumber from 'awesome-phonenumber';
import {
  cloneDeep,
  forOwn,
  includes,
  isEqual,
  isString,
  merge,
} from 'lodash-es';
import { Observable, of, Subscription } from 'rxjs';

const log = new Logger('ParticipantComponent');

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss'],
})
export class ParticipantComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('initialFocusElementRef')
  initialFocusElementRef!: ElementRef<HTMLElement>;

  @Input() participant!: ParticipantDTO;
  @Input() isNew!: boolean;
  @Output() closeAll: EventEmitter<void> = new EventEmitter<void>();
  @Output() remove: EventEmitter<ParticipantDTO> =
    new EventEmitter<ParticipantDTO>();

  form: FormGroup;
  changed!: boolean;

  firstNameSub!: Subscription;
  lastNameSub!: Subscription;
  personalIdSub!: Subscription;
  phoneSub!: Subscription;
  emailSub!: Subscription;

  anOriginalParticipant!: ParticipantDTO;
  anEditedParticipant!: ParticipantDTO;

  get originalParticipant(): ParticipantDTO {
    if (!this.anOriginalParticipant) {
      this.anOriginalParticipant = { firstName: '', lastName: '' };
    }
    return this.anOriginalParticipant;
  }

  set originalParticipant(value: ParticipantDTO) {
    this.anOriginalParticipant = value;
  }

  get editedParticipant(): ParticipantDTO {
    if (!this.anEditedParticipant) {
      this.anEditedParticipant = { firstName: '', lastName: '' };
    }
    return this.anEditedParticipant;
  }

  set editedParticipant(value: ParticipantDTO) {
    this.anEditedParticipant = value;
  }

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
    private formBuilder: FormBuilder,
    private inputService: InputService,
    private serviceApi: ServiceApi
  ) {
    log.debug('construct');

    this.form = this.formBuilder.group({
      participantFirstNameControl: ['', null],
      participantLastNameControl: ['', null],
      participantPersonalIdControl: ['', { updateOn: 'blur' }],
      participantPhoneControl: ['', null],
      participantEmailControl: ['', null],
      remember: true,
    });
  }

  ngOnInit(): void {
    log.debug('init');
    this.originalParticipant = cloneDeep(this.participant);
    this.editedParticipant = cloneDeep(this.participant);
    this.firstNameCtrl?.setValue(this.originalParticipant?.firstName);
    this.lastNameCtrl?.setValue(this.originalParticipant?.lastName);
    this.personalIdCtrl?.setValue(this.originalParticipant?.personalId);
    this.phoneCtrl?.setValue(this.originalParticipant?.phoneNumber);
    this.emailCtrl?.setValue(this.originalParticipant?.email);

    this.changed = !isEqual(this.originalParticipant, this.editedParticipant);

    this.firstNameSub =
      this.firstNameCtrl?.valueChanges.subscribe((firstName: string) => {
        this.editedParticipant.firstName = firstName || '';
        this.changed = !isEqual(
          this.originalParticipant,
          this.editedParticipant
        );
      }) || (null as unknown as Subscription);

    this.lastNameSub =
      this.lastNameCtrl?.valueChanges.subscribe((lastName: string) => {
        this.editedParticipant.lastName = lastName || '';
        this.changed = !isEqual(
          this.originalParticipant,
          this.editedParticipant
        );
      }) || (null as unknown as Subscription);

    this.personalIdSub =
      this.personalIdCtrl?.valueChanges.subscribe((personalId: string) => {
        this.editedParticipant.personalId = personalId || '';
        this.changed = !isEqual(
          this.originalParticipant,
          this.editedParticipant
        );
      }) || (null as unknown as Subscription);

    this.phoneSub =
      this.phoneCtrl?.valueChanges.subscribe((phone: string) => {
        this.editedParticipant.phoneNumber = phone
          ? this.phoneNumber?.getNumber('e164')
          : phone;
        this.changed = !isEqual(
          this.originalParticipant,
          this.editedParticipant
        );
      }) || (null as unknown as Subscription);

    this.emailSub =
      this.emailCtrl?.valueChanges.subscribe((email: string) => {
        this.editedParticipant.email = email || '';
        this.changed = !isEqual(
          this.originalParticipant,
          this.editedParticipant
        );
      }) || (null as unknown as Subscription);
  }

  ngAfterViewInit(): void {
    log.debug('after view init');
    this.setValidators();

    if (this.isNew) {
      setTimeout(
        (self: ParticipantComponent) => {
          self.initialFocusElementRef.nativeElement.focus();
        },
        500,
        this
      );
    }
  }

  ngOnDestroy(): void {
    log.debug('destroy');
    this.firstNameSub?.unsubscribe();
    this.lastNameSub?.unsubscribe();
    this.personalIdSub?.unsubscribe();
    this.phoneSub?.unsubscribe();
    this.emailSub?.unsubscribe();
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
    if (this.isMandatoryInput('participantFirstName')) {
      this.firstNameCtrl?.setValidators([Validators.required.bind(this)]);
    } else {
      this.firstNameCtrl?.clearValidators();
    }
    if (this.isMandatoryInput('participantLastName')) {
      this.lastNameCtrl?.setValidators([Validators.required.bind(this)]);
    } else {
      this.lastNameCtrl?.clearValidators();
    }
    if (this.isMandatoryInput('participantPersonalId')) {
      this.personalIdCtrl?.setValidators([Validators.required.bind(this)]);
      this.personalIdCtrl?.setAsyncValidators([
        this.personalIdValidator.bind(this),
      ]);
    } else {
      this.personalIdCtrl?.setAsyncValidators([
        this.personalIdValidator.bind(this),
      ]);
    }
    if (this.isMandatoryInput('participantPhone')) {
      this.phoneCtrl?.setValidators([
        Validators.required.bind(this),
        this.phoneValidator,
      ]);
    } else {
      this.phoneCtrl?.setValidators([this.phoneValidator]);
    }
    if (this.isMandatoryInput('participantEmail')) {
      this.emailCtrl?.setValidators([
        Validators.email.bind(this),
        Validators.required.bind(this),
      ]);
    } else {
      this.emailCtrl?.setValidators([Validators.email.bind(this)]);
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
      (self: ParticipantComponent) => {
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
    return of(this.inputService.isPersonInput(value));
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

  save(): void {
    log.debug('save');
    forOwn(
      this.form?.controls,
      (control: AbstractControl /* , key: string*/) => {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    );

    if (this.form.valid) {
      this.participant = merge(this.participant, this.editedParticipant);
      this.originalParticipant = cloneDeep(this.participant);
      this.editedParticipant = cloneDeep(this.participant);
      this.changed = !isEqual(this.originalParticipant, this.editedParticipant);
      this.closeAll.emit();
    }
  }

  removeParticipant(participant: ParticipantDTO): void {
    log.debug('removeParticipant', participant);
    this.remove.emit(participant);
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

  get firstNameCtrl(): AbstractControl | null {
    return this.form.get('participantFirstNameControl');
  }

  get lastNameCtrl(): AbstractControl | null {
    return this.form.get('participantLastNameControl');
  }

  get personalIdCtrl(): AbstractControl | null {
    return this.form.get('participantPersonalIdControl');
  }

  get phoneCtrl(): AbstractControl | null {
    return this.form.get('participantPhoneControl');
  }

  get emailCtrl(): AbstractControl | null {
    return this.form.get('participantEmailControl');
  }
}
