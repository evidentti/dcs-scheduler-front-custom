import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CoreModule } from '@app/@core/core.module';

import { StepperService } from './stepper.service';

describe('StepperService', () => {
  let service: StepperService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, HttpClientTestingModule],
      providers: [StepperService],
    });
    service = TestBed.inject(StepperService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    void expect(service).toBeTruthy();
  });
});
