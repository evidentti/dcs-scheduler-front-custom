import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CoreModule, FlexLayoutModule } from '@angular/flex-layout';
import { FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '@app/@shared/shared.module';
import { AppConfigModule } from '@app/app-config.module';
import { MaterialModule } from '@app/material.module';
import { TranslateModule } from '@ngx-translate/core';

import { FilterStepComponent } from './filter-step.component';

describe('FilterStepComponent', () => {
  let component: FilterStepComponent;
  let fixture: ComponentFixture<FilterStepComponent>;

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
      declarations: [FilterStepComponent],
      providers: [FormGroupDirective],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
