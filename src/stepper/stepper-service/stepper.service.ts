import { Injectable } from '@angular/core';
import { Logger } from '@app/@core/logger/logger';
import {
  CustomerSegment,
  IdValuePairDTO,
  MeetingDTO,
  MeetingSlotDTO,
  ParticipantDTO,
} from '@app/@models/models';
import { DATE_FORMAT } from '@app/constants';
import { Contact, SchedulerParams } from '@app/interfaces';
import { cloneDeep } from 'lodash-es';
import * as moment from 'moment';

const log = new Logger('StepperService');

@Injectable({
  providedIn: 'root',
})
export class StepperService {
  aDefaultCompanyValue!: IdValuePairDTO;
  aCompanyValue!: IdValuePairDTO;
  aTopicValue!: IdValuePairDTO;
  aChannelValue!: IdValuePairDTO;
  anOfficeValue!: IdValuePairDTO;
  anAgentValue!: IdValuePairDTO;
  aLanguageValue!: IdValuePairDTO;
  aTagValue!: Array<number>;
  anAvailabilityFilter!: Array<string>;

  get defaultCompanyValue(): IdValuePairDTO {
    return this.aDefaultCompanyValue;
  }

  set defaultCompanyValue(value: IdValuePairDTO) {
    this.aDefaultCompanyValue = value;
  }

  get companyValue(): IdValuePairDTO {
    return this.aCompanyValue;
  }

  set companyValue(value: IdValuePairDTO) {
    this.aCompanyValue = value;
  }

  get topicValue(): IdValuePairDTO {
    return this.aTopicValue;
  }

  set topicValue(value: IdValuePairDTO) {
    this.aTopicValue = value;
  }

  get channelValue(): IdValuePairDTO {
    return this.aChannelValue;
  }

  set channelValue(value: IdValuePairDTO) {
    this.aChannelValue = value;
  }

  get officeValue(): IdValuePairDTO {
    return this.anOfficeValue;
  }

  set officeValue(value: IdValuePairDTO) {
    this.anOfficeValue = value;
  }

  get agentValue(): IdValuePairDTO {
    return this.anAgentValue;
  }

  set agentValue(value: IdValuePairDTO) {
    this.anAgentValue = value;
  }

  get languageValue(): IdValuePairDTO {
    return this.aLanguageValue;
  }

  set languageValue(value: IdValuePairDTO) {
    this.aLanguageValue = value;
  }

  get tagValue(): Array<number> {
    return this.aTagValue;
  }

  set tagValue(value: Array<number>) {
    this.aTagValue = value;
  }

  get availabilityFilter(): Array<string> {
    return this.anAvailabilityFilter;
  }

  set availabilityFilter(value: Array<string>) {
    this.anAvailabilityFilter = value;
  }

  aMaxDate!: moment.Moment;
  aMinDate!: moment.Moment;
  aDateValue!: moment.Moment;

  get maxDate(): moment.Moment {
    return this.aMaxDate;
  }

  set maxDate(value: moment.Moment) {
    this.aMaxDate = value;
  }

  get minDate(): moment.Moment {
    return this.aMinDate;
  }

  set minDate(value: moment.Moment) {
    this.aMinDate = value;
  }

  get dateValue(): moment.Moment {
    return this.aDateValue;
  }

  set dateValue(value: moment.Moment) {
    this.aDateValue = value;
  }

  aLanguage!: string;

  get language(): string {
    return this.aLanguage;
  }

  set language(value: string) {
    this.aLanguage = value;
  }

  aSlot!: MeetingSlotDTO;

  get slot(): MeetingSlotDTO {
    if (!this.aSlot) {
      this.aSlot = {} as MeetingSlotDTO;
    }
    return this.aSlot;
  }

  set slot(value: MeetingSlotDTO) {
    this.aSlot = value;
  }

  aContact!: Contact;

  get contact(): Contact {
    if (!this.aContact) {
      this.aContact = { termsAndConditionsAccepted: true } as Contact;
    }
    if (!this.aContact.participants) {
      this.aContact.participants = Array<ParticipantDTO>();
    }
    return this.aContact;
  }

  set contact(value: Contact) {
    this.aContact = value;
  }

  constructor() {
    log.debug('construct');
  }

  clear(): void {
    log.debug('clear');
    this.companyValue = null as unknown as IdValuePairDTO;
    this.topicValue = null as unknown as IdValuePairDTO;
    this.channelValue = null as unknown as IdValuePairDTO;
    this.officeValue = null as unknown as IdValuePairDTO;
    this.agentValue = null as unknown as IdValuePairDTO;
    this.languageValue = null as unknown as IdValuePairDTO;
    this.tagValue = null as unknown as Array<number>;

    this.availabilityFilter = null as unknown as Array<string>;
    this.dateValue = null as unknown as moment.Moment;
    this.minDate = null as unknown as moment.Moment;
    this.maxDate = null as unknown as moment.Moment;
    this.contact = null as unknown as Contact;
  }

  get schedulerParams(): SchedulerParams {
    return cloneDeep({
      companyId: this.companyValue?.id,
      topicId: this.topicValue?.id,
      channelId: this.channelValue?.id,
      officeId: this.officeValue?.id,
      agentId: this.agentValue?.id,
      languageId: this.languageValue?.id,
      tagIds: this.tagValue,
    });
  }

  get schedulerParamsWithDate(): SchedulerParams {
    return cloneDeep({
      companyId: this.companyValue?.id,
      topicId: this.topicValue?.id,
      channelId: this.channelValue?.id,
      officeId: this.officeValue?.id,
      agentId: this.agentValue?.id,
      languageId: this.languageValue?.id,
      tagIds: null,
      startDate:
        this.dateValue && this.dateValue.isValid()
          ? this.dateValue.format(DATE_FORMAT)
          : undefined,
      endDate:
        this.dateValue && this.dateValue.isValid()
          ? this.dateValue.format(DATE_FORMAT)
          : undefined,
    });
  }

  get meeting(): MeetingDTO {
    const meeting: MeetingDTO = {
      timeFrom: this.slot?.timeFrom || (null as unknown as string),
      timeTo: this.slot?.timeTo || (null as unknown as string),
      officeId: this.slot?.officeId || (null as unknown as number),
      topicId: this.slot?.topicId || (null as unknown as number),
      channelId: this.slot?.channelId || (null as unknown as number),
      agentId: this.slot?.agentId || (null as unknown as number),
      language: this.slot?.languageCode,
      customerFirstName: this.contact.firstName,
      customerLastName: this.contact.lastName,
      customerEmail: this.contact.email,
      customerPhoneNumber: this.contact.phone,
      messageToAgent: this.contact.comments,
      notificationsByEmail: this.contact.remainderByEmail,
      notificationsBySMS: this.contact.remainderBySMS,
      termsAndConditionsAccepted: this.contact.termsAndConditionsAccepted,
      extraInfo: this.contact.extraInfo,
      personalId: this.contact.personalId,
      customerAddress: this.contact.address,
      participants: this.contact.participants,
      customerSegment: CustomerSegment.PERSONAL,
    };
    return meeting;
  }
}
