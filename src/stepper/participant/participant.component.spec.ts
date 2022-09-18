import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CoreModule, FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '@app/@shared/shared.module';
import { AppConfigModule } from '@app/app-config.module';
import { MaterialModule } from '@app/material.module';
import { TranslateModule } from '@ngx-translate/core';

import { ParticipantComponent } from './participant.component';

describe('ParticipantComponent', () => {
  let component: ParticipantComponent;
  let fixture: ComponentFixture<ParticipantComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        TranslateModule.forRoot(),
        FlexLayoutModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        CoreModule,
        SharedModule,
        AppConfigModule,
      ],
      declarations: [ParticipantComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
