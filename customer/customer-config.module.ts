import { NgModule } from '@angular/core';
import {
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { BaseConfig } from '@app/@base/base.config';
import { CUSTOMER } from '@app/constants';

@NgModule({
  imports: [],
  exports: [],
  providers: [],
})
export class AppConfigModule extends BaseConfig {
  constructor() {
    super();
    this.type = CUSTOMER;
  }

  get useOnlyForPriorityTopics(): boolean {
    return false;
  }

  get autoSlotSearch(): boolean {
    return false;
  }

  override get snackBarVerticalPosition(): MatSnackBarVerticalPosition {
    return 'top' as MatSnackBarVerticalPosition;
  }

  override get snackBarHorizontalPosition(): MatSnackBarHorizontalPosition {
    return 'end' as MatSnackBarHorizontalPosition;
  }
}
