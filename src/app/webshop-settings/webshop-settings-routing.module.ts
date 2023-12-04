import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebshopSettingsComponent } from './webshop-settings.component';

const routes: Routes = [
  {
    path: '',
    component: WebshopSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebshopSettingsRoutingModule { }
