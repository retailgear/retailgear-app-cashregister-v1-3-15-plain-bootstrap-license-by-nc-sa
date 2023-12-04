import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DayClosureRoutingModule } from './day-closure-routing.module';
import { DayClosuresComponent } from './day-closures/day-closures.component';
import { DayClosureComponent } from './day-closure.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    DayClosuresComponent,
    DayClosureComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DayClosureRoutingModule,
    TranslateModule,
    SharedModule,
  ]
})
export class DayClosureModule { }
