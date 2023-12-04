import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersComponent } from './customers.component';
import { CustomerImportComponent } from './customer-import/customer-import.component';

const routes: Routes = [
  { path: '', component: CustomersComponent, pathMatch: 'full'},
  { path: 'import', loadChildren: ()=> import("./customer-import/customer-import.module").then(module=> module.CustomerImportModule)}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
