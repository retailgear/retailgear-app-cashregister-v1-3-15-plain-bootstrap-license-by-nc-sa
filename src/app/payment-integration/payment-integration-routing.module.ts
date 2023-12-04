import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentIntegrationComponent } from './payment-integration.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentIntegrationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentIntegrationRoutingModule { }
