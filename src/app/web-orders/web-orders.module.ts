import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebOrdersRoutingModule } from './web-orders-routing.module';
import { TransactionsModule } from '../transactions/transactions.module';

@NgModule({
  declarations: [
    // WebOrdersComponent
  ],
  imports: [
    CommonModule,
    TransactionsModule,
    WebOrdersRoutingModule
  ]
})
export class WebOrdersModule { }
