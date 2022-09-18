import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BaseService } from '@app/@base/base.service';
import { Logger } from '@app/@core/logger/logger';
import { KeyValuePairDTO, KeyValuePairListDTO } from '@app/@models/models';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

const log = new Logger('ExtraService');

const routes = {
  tenantinfo: () => '/tenant',
};

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class ExtraService extends BaseService implements OnDestroy {
  sub!: Subject<boolean>;

  constructor(protected httpClient: HttpClient) {
    super();
    log.debug('construct');
  }

  ngOnDestroy(): void {
    log.debug('destroy');
  }

  override getTenantInfo(): Observable<Array<KeyValuePairDTO>> {
    log.debug('getTenantInfo');

    if (this.sub && !this.sub.closed) {
      this.sub.next(true);
      this.sub.unsubscribe();
    }
    this.sub = new Subject<boolean>();
    return this.httpClient
      .useAccessToken(true)
      .get(routes.tenantinfo())
      .pipe(
        untilDestroyed(this),
        takeUntil(this.sub),
        map(
          (response: KeyValuePairListDTO) =>
            response?.result as Array<KeyValuePairDTO>
        )
      );
  }
}
