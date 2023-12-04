import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerImportComponent } from './customer-import.component';

const routes: Routes = [
  { path: '', component: CustomerImportComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerImportRoutingModule { }
