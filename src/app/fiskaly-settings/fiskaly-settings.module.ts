import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiskalySettingsComponent } from './fiskaly-settings.component';
import { FiskalySettingsRoutingModule } from './fiskaly-settings-routing.module';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [
    FiskalySettingsComponent
  ],
  imports: [
    CommonModule,
    FiskalySettingsRoutingModule,
    TranslateModule,
    FormsModule,
  ]
})
export class FiskalySettingsModule { }
