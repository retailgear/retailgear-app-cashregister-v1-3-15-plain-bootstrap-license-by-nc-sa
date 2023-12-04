import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionImportComponent } from './transaction-import.component';

const routes: Routes = [
  { path: '', component: TransactionImportComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionImportRoutingModule { }
