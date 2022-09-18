import { Injectable } from '@angular/core';
import { BaseService } from '@app/@base/base.service';
import { Logger } from '@app/@core/logger/logger';

const log = new Logger('ExtraService');

@Injectable({
  providedIn: 'root',
})
export class ExtraService extends BaseService {
  constructor() {
    super();
    log.debug('construct');
  }

  override get hideRecaptchaBadge(): boolean {
    return true;
  }
}
