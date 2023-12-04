import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebshopSettingsComponent } from './webshop-settings.component';
import { WebshopSettingsRoutingModule } from './webshop-settings-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from 'primeng/api';
import { ExtraServiceComponent } from './component/extra-service/extra-service.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CouponServiceComponent } from './component/coupon-service/coupon-service.component';
import { AddEditCouponComponent } from './component/add-edit-coupon/add-edit-coupon.component';



@NgModule({
  declarations: [
    WebshopSettingsComponent,
    ExtraServiceComponent,
    CouponServiceComponent,
    AddEditCouponComponent
  ],
  imports: [
    CommonModule,
    WebshopSettingsRoutingModule,
    TranslateModule,
    FormsModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    NgSelectModule,
    SharedModule
  ]
})
export class WebshopSettingsModule { }
