import { ComponentFactory, ComponentFactoryResolver, ComponentRef, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TillRoutingModule } from './till-routing.module';
import { TillComponent } from './till.component';
import { TranslateModule } from "@ngx-translate/core";
import { DropdownModule } from "primeng/dropdown";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ToolbarModule } from "primeng/toolbar";
import { OrderComponent } from './order/order.component';
import { RepairComponent } from './repair/repair.component';
import { GiftComponent } from './gift/gift.component';
import { GoldPurchaseComponent } from './gold-purchase/gold-purchase.component';
import { GoldSellComponent } from './gold-sell/gold-sell.component';
import { OfferComponent } from './offer/offer.component';
import { ProductComponent } from './product/product.component';
import { SharedModule } from "../shared/shared.module";
import { OtherComponent } from './other/other.component';
import { LoyaltyPointsDiscountComponent } from './loyalty-points-discount/loyalty-points-discount.component';

@NgModule({
  declarations: [
    TillComponent,
    OrderComponent,
    RepairComponent,
    GiftComponent,
    GoldPurchaseComponent,
    GoldSellComponent,
    OfferComponent,
    ProductComponent,
    OtherComponent,
    LoyaltyPointsDiscountComponent
  ],
  imports: [
    CommonModule,
    TillRoutingModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    //PrimeNG
    DropdownModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    SharedModule
  ],
  exports: [
    TillComponent,
    TillRoutingModule,
    TranslateModule,
    FormsModule,
    //PrimeNG
    DropdownModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
  ],
  bootstrap: [
    TillComponent
  ]
})
export class TillModule {
  constructor(private componentFactoryResolver: ComponentFactoryResolver) {

  }

  public resolveComponent(): ComponentFactory<TillComponent> {
    return this.componentFactoryResolver.resolveComponentFactory(TillComponent);
  }

  public componentReference() {
    return TillComponent;
  }
}
