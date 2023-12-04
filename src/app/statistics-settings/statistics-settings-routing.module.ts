import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StatisticsSettingsComponent } from './statistics-settings.component';

const routes: Routes = [
  {
    path: '',
    component: StatisticsSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StatisticsSettingsRoutingModule { }
