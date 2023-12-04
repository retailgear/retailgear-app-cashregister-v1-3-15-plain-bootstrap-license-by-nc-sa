import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkstationComponent } from './workstation.component';
import { WorkstationRoutingModule } from './workstation-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';



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
