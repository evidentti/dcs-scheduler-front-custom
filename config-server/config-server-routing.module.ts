import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/@shell/shell.service';
import { INFO_VIEW_GROUP } from '@app/constants';
import { ShellRoute } from '@app/interfaces';

const routes: Routes = [
  Shell.childRoutes([
    {
      path: 'tenant',
      loadChildren: () =>
        import('@app/tenant-view/tenant-view.module').then(
          (m) => m.TenantViewModule
        ),
      group: 1,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'info',
      loadChildren: () =>
        import('@app/info-view/info-view.module').then((m) => m.InfoViewModule),
      group: INFO_VIEW_GROUP,
    } as ShellRoute,
  ]),
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {
  get routes(): Routes {
    return routes;
  }
}
