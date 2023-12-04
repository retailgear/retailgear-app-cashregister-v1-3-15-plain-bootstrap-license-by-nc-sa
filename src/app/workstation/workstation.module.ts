import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkstationComponent } from './workstation.component';
import { WorkstationRoutingModule } from './workstation-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    WorkstationComponent
  ],
  imports: [
    CommonModule,
    WorkstationRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    FontAwesomeModule
  ]
})
export class WorkstationModule { }
