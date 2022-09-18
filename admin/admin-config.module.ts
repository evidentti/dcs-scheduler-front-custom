import { NgModule } from '@angular/core';
import { BaseConfig } from '@app/@base/base.config';
import { ADMIN } from '@app/constants';

@NgModule({
  imports: [],
  exports: [],
  providers: [],
})
export class AppConfigModule extends BaseConfig {
  constructor() {
    super();
    this.type = ADMIN;
  }

  get useOnlyForPriorityTopics(): boolean {
    return false;
  }

  get useChannelsForServiceHours(): boolean {
    return false;
  }
}
