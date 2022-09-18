import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/@shell/shell.service';
import { ShellRoute } from '@app/interfaces';

const routes: Routes = [
  Shell.childRoutes([
    {
      path: 'scheduler',
      loadChildren: () =>
        import('@cus/src/stepper/stepper.module').then((m) => m.StepperModule),
      group: 2,
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
