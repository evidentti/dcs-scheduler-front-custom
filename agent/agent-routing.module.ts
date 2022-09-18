import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/@shell/shell.service';
import { ShellRoute } from '@app/interfaces';
import { INFO_VIEW_GROUP } from '@app/constants';

const routes: Routes = [
  Shell.childRoutes([
    {
      path: 'scheduler',
      loadChildren: () =>
        import('@app/scheduler-view/scheduler-view.module').then(
          (m) => m.SchedulerViewModule
        ),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'contact',
      loadChildren: () =>
        import('@app/contact-view/contact-view.module').then(
          (m) => m.ContactViewModule
        ),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'summary',
      loadChildren: () =>
        import('@app/summary-view/summary-view.module').then(
          (m) => m.SummaryViewModule
        ),
      group: null as unknown as number,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'adhoc',
      loadChildren: () =>
        import('@app/adhoc-view/adhoc-view.module').then(
          (m) => m.AdhocViewModule
        ),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'agent',
      loadChildren: () =>
        import('@app/agent-view/agent-view.module').then(
          (m) => m.AgentViewModule
        ),
      group: 3,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'meeting',
      loadChildren: () =>
        import('@app/meeting-view/meeting-view.module').then(
          (m) => m.MeetingViewModule
        ),
      group: 3,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'times',
      loadChildren: () =>
        import('@app/service-hour-view/service-hour-view.module').then(
          (m) => m.ServiceHourViewModule
        ),
      group: 3,
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
