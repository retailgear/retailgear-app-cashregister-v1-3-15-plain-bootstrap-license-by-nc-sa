import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TillSettingsRoutingModule } from './till-settings-routing.module';
import { TillSettingsComponent } from './till-settings.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ApiService } from '../shared/service/api.service';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';


@NgModule({
  declarations: [
    TillSettingsComponent
  ],
  imports: [
    CommonModule,
    TillSettingsRoutingModule,
    FontAwesomeModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers:[
    ApiService
  ]
})
export class TillSettingsModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }
 }
