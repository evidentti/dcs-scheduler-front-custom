import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperComponent } from './stepper.component';
import { StepperRoutingModule } from './stepper-routing.module';
import { SharedModule } from '@app/@shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '@app/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FilterStepComponent } from '@cus/src/stepper/filter-step/filter-step.component';
import { MeetingStepComponent } from '@cus/src/stepper/meeting-step/meeting-step.component';
import { ContactStepComponent } from '@cus/src/stepper/contact-step/contact-step.component';
import { ParticipantStepComponent } from './participant-step/participant-step.component';
import { ConfirmStepComponent } from './confirm-step/confirm-step.component';
import { SummaryStepComponent } from '@cus/src/stepper/summary-step/summary-step.component';
import { StepperService } from '@cus/src/stepper/stepper-service/stepper.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { environment } from '@env/environment';
import { MY_SECOND_FORMATS } from '@app/constants';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatPaginatorI18nService } from '@app/@core/mat-paginator-intl-srv/matpaginatorIntl.service';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MatDatepickerI18nService } from '@app/@core/mat-datepicker-intl-srv/matdatepickerIntl.service';
import { ParticipantComponent } from './participant/participant.component';
import { MatStepperI18nService } from '@app/@core/mat-stepper-intl-srv/matstepperIntl.service';
import { MatStepperIntl } from '@angular/material/stepper';

@NgModule({
  declarations: [
    StepperComponent,
    FilterStepComponent,
    MeetingStepComponent,
    ContactStepComponent,
    ParticipantStepComponent,
    ConfirmStepComponent,
    SummaryStepComponent,
    ParticipantComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule,
    MaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    StepperRoutingModule,
  ],
  providers: [
    StepperService,
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_LOCALE, useValue: environment.defaultLanguage },
    { provide: MAT_DATE_FORMATS, useValue: MY_SECOND_FORMATS },
    { provide: MatPaginatorIntl, useClass: MatPaginatorI18nService },
    { provide: MatDatepickerIntl, useClass: MatDatepickerI18nService },
    { provide: MatStepperIntl, useClass: MatStepperI18nService },
  ],
  exports: [ParticipantComponent],
})
export class StepperModule {}
