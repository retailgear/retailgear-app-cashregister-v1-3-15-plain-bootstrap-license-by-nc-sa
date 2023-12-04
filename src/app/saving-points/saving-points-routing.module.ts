import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SavingPointsComponent } from './saving-points.component';

const routes: Routes = [
  {
    path: '',
    component: SavingPointsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SavingPointsRoutingModule { }
