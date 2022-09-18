import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/@shell/shell.service';
import { ShellRoute } from '@app/interfaces';
import { INFO_VIEW_GROUP } from '@app/constants';

const routes: Routes = [
  Shell.childRoutes([
    {
      path: 'company',
      loadChildren: () =>
        import('@app/company-view/company-view.module').then(
          (m) => m.CompanyViewModule
        ),
      group: 1,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'language',
      loadChildren: () =>
        import('@app/language-view/language-view.module').then(
          (m) => m.LanguageViewModule
        ),
      group: 1,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'topic',
      loadChildren: () =>
        import('@app/topic-view/topic-view.module').then(
          (m) => m.TopicViewModule
        ),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'channel',
      loadChildren: () =>
        import('@app/channel-view/channel-view.module').then(
          (m) => m.ChannelViewModule
        ),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'region',
      loadChildren: () =>
        import('@app/region-view/region-view.module').then(
          (m) => m.RegionViewModule
        ),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'tag',
      loadChildren: () =>
        import('@app/tag-view/tag-view.module').then((m) => m.TagViewModule),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'priority/edit',
      loadChildren: () =>
        import('@app/priority-edit-view/priority-edit-view.module').then(
          (m) => m.PriorityEditViewModule
        ),
      group: null as unknown as number,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'topictimes',
      loadChildren: () =>
        import(
          '@app/topic-service-hour-view/topic-service-hour-view.module'
        ).then((m) => m.TopicServiceHourViewModule),
      group: 2,
    } as ShellRoute,
  ]),
  Shell.childRoutes([
    {
      path: 'office',
      loadChildren: () =>
        import('@app/office-view/office-view.module').then(
          (m) => m.OfficeViewModule
        ),
      group: 3,
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
      path: 'resource',
      loadChildren: () =>
        import('@app/resource-view/resource-view.module').then(
          (m) => m.ResourceViewModule
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
      path: 'reports',
      loadChildren: () =>
        import('@app/reports-view/reports-view.module').then(
          (m) => m.ReportsViewModule
        ),
      group: 4,
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
