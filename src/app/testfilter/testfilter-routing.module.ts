import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestFilterComponent } from './testfilter.component';

const routes: Routes = [
  { path: '', component: TestFilterComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestFilterRoutingModule { }