import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TillSettingsComponent } from './till-settings.component';

const routes: Routes = [
  {
    path: '',
    component: TillSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TillSettingsRoutingModule { }
