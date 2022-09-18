import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/@core/i18n-srv/i18n.service';
import { StepperComponent } from './stepper.component';
import { NavigationService } from '@app/@core/navigation-srv/navigation.service';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  {
    path: '',
    component: StepperComponent,
    canActivate: [NavigationService],
    data: { title: extract('scheduler') },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [],
})
export class StepperRoutingModule {}
