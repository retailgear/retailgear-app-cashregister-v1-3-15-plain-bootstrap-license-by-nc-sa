import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrintSettingsComponent } from './print-settings.component';

const routes: Routes = [
  {
    path: '',
    component: PrintSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrintSettingsRoutingModule { }
