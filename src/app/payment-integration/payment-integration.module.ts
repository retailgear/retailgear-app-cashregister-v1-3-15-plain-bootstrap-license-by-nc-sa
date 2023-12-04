import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule as primengSharedModule } from 'primeng/api';
import { JsonEditorModule } from '../json-editor/json-editor.module';
import { SharedModule } from '../shared/shared.module';
import { PaymentIntegrationRoutingModule } from './payment-integration-routing.module';
import { PaymentIntegrationComponent } from './payment-integration.component';


@NgModule({
  declarations: [
    PaymentIntegrationComponent,
  ],
  imports: [
    PaymentIntegrationRoutingModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    primengSharedModule,
    SharedModule,
    JsonEditorModule
  ]
})
export class PaymentIntegrationModule { }
