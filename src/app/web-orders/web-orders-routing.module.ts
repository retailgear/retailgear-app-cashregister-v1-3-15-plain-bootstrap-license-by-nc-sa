import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionsComponent } from '../transactions/transactions.component';

const routes: Routes = [
  { path: '', component: TransactionsComponent, pathMatch: 'full', data: { title: 'Sample data!'}},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebOrdersRoutingModule { }
