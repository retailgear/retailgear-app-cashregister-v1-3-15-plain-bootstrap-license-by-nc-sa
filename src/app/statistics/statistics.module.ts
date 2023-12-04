import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatisticsRoutingModule } from './statistics-routing.module';
// import { SharedModule } from '../../shared/shared.module';
import { TranslateModule } from "@ngx-translate/core";

import { StatisticsComponent } from './statistics.component';
import { FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    StatisticsComponent
  ],
  imports: [
    StatisticsRoutingModule,
    TranslateModule,
    CommonModule,
    FormsModule
    // SharedModule
  ]
})
export class StatisticsModule { }
