import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersGroupComponent } from './customers-group.component';

const routes: Routes = [{ path: '', component: CustomersGroupComponent , pathMatch:'full'}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersGroupRoutingModule { }
