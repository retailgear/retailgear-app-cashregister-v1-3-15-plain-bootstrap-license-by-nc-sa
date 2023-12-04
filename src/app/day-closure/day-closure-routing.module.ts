import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DayClosureComponent } from './day-closure.component';
import { DayClosuresComponent } from './day-closures/day-closures.component';

const routes: Routes = [
  { path: '', component: DayClosureComponent },
  { path: 'list', component: DayClosuresComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DayClosureRoutingModule { }
