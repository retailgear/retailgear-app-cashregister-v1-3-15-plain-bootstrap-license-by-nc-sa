import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionAuditComponent } from './transaction-audit.component';

const routes: Routes = [
  { path: 'view/:iStatisticId', component: TransactionAuditComponent },
  { path: '', component: TransactionAuditComponent, pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionAuditRoutingModule { }
