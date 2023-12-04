import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TransactionsRoutingModule } from './transactions-routing.module';
import { NgxPaginationModule, PaginatePipe } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
// import { SharedModule } from '../../shared/shared.module';
import { DialogService,DialogComponent } from '../shared/service/dialog';

import { TransactionsComponent } from './transactions.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    TransactionsComponent,
    TransactionDetailsComponent
  ],
  imports: [
    TransactionsRoutingModule,
    FontAwesomeModule,
    NgxPaginationModule,
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    TranslateModule,
  ],
  providers: [ 
    DialogService,
    DialogComponent,
    PaginatePipe
   ]
})
export class TransactionsModule { }
