import { TranslateService } from '@ngx-translate/core';
import { StepperBaseDirective } from './stepper-base';
import { StepperService } from './stepper-service/stepper.service';

describe('StepperBaseDirective', () => {
  it('should create an instance', () => {
    void expect(
      new StepperBaseDirective(
        null as unknown as StepperService,
        null as unknown as TranslateService
      )
    ).toBeTruthy();
  });
});
