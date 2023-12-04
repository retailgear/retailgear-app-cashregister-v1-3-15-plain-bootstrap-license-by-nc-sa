import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TransactionsComponent} from "./transactions.component";

const routes: Routes = [
  { path: '', component: TransactionsComponent, pathMatch: 'full'},
  { path: 'import', loadChildren: ()=> import("./transaction-import/transaction-import.module").then(module=> module.TransactionImportModule)}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionsRoutingModule { }
