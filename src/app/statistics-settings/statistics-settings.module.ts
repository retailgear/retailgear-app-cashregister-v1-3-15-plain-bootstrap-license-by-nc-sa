import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsSettingsComponent } from './statistics-settings.component';
import { StatisticsSettingsRoutingModule } from './statistics-settings-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { OverlayModule } from '@angular/cdk/overlay';
import { SharedModule } from '../shared/shared.module';
@NgModule({
  declarations: [
    StatisticsSettingsComponent
  ],
  imports: [
    OverlayModule,
    CommonModule,
    StatisticsSettingsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    FontAwesomeModule
  ]
})
export class StatisticsSettingsModule { }
