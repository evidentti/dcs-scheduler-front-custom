import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CoreModule, FlexLayoutModule } from '@angular/flex-layout';
import { FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '@app/@shared/shared.module';
import { AppConfigModule } from '@app/app-config.module';
import { MaterialModule } from '@app/material.module';
import { TranslateModule } from '@ngx-translate/core';

import { MeetingStepComponent } from './meeting-step.component';

describe('MeetingStepComponent', () => {
  let component: MeetingStepComponent;
  let fixture: ComponentFixture<MeetingStepComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot(),
        FlexLayoutModule,
        MaterialModule,
        ReactiveFormsModule,
        CoreModule,
        SharedModule,
        AppConfigModule,
      ],
      declarations: [MeetingStepComponent],
      providers: [FormGroupDirective],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeetingStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
