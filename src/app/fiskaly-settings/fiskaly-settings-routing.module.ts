import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FiskalySettingsComponent } from './fiskaly-settings.component';

const routes: Routes = [
  {
    path: '',
    component: FiskalySettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FiskalySettingsRoutingModule { }
