import { NgModule } from '@angular/core';
import { BaseConfig } from '@app/@base/base.config';
import { CONFIG_SERVER } from '@app/constants';

@NgModule({
  imports: [],
  exports: [],
  providers: [],
})
export class AppConfigModule extends BaseConfig {
  constructor() {
    super();
    this.type = CONFIG_SERVER;
  }
}
