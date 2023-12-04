import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransactionAuditRoutingModule } from './transaction-audit-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

// import { TillProductSectionComponent } from './component/till-product-section/till-product-section.component';
import { TransactionAuditComponent } from './transaction-audit.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    TransactionAuditComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TransactionAuditRoutingModule,
    SharedModule,
    TranslateModule
  ]
})
export class TransactionAuditModule { }
