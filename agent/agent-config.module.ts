import { NgModule } from '@angular/core';
import {
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { BaseConfig } from '@app/@base/base.config';
import { AGENT } from '@app/constants';

@NgModule({
  imports: [],
  exports: [],
  providers: [],
})
export class AppConfigModule extends BaseConfig {
  constructor() {
    super();
    this.type = AGENT;
  }

  get useOnlyForPriorityTopics(): boolean {
    return false;
  }

  get useChannelsForServiceHours(): boolean {
    return false;
  }

  get participantsLengthCompany(): number {
    return 4;
  }

  get participantsLengthPerson(): number {
    return 4;
  }

  override get snackBarVerticalPosition(): MatSnackBarVerticalPosition {
    return 'top' as MatSnackBarVerticalPosition;
  }

  override get snackBarHorizontalPosition(): MatSnackBarHorizontalPosition {
    return 'end' as MatSnackBarHorizontalPosition;
  }
}
