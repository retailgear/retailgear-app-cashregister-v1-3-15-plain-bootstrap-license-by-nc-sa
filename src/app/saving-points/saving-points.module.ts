import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavingPointsComponent } from './saving-points.component';
import { SavingPointsRoutingModule } from './saving-points-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApiService } from '../shared/service/api.service';
import { SharedModule } from '../shared/shared.module';



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
    FontAwesomeModule,
  ]
})
export class SavingPointsModule { }
