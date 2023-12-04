import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavingPointsComponent } from './saving-points.component';
import { SavingPointsRoutingModule } from './saving-points-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';



@NgModule({
  declarations: [
    SavingPointsComponent
  ],
  imports: [
    CommonModule,
    SavingPointsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    FontAwesomeModule
  ]
})
export class SavingPointsModule { }
