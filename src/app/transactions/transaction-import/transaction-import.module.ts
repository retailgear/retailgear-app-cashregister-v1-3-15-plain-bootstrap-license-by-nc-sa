import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionImportComponent } from './transaction-import.component';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TransactionDetailsImportComponent } from '../transaction-details-import/transaction-details-import.component';
import { TransactionFileImportComponent } from '../transaction-file-import/transaction-file-import.component';
import { TransactionImportRoutingModule } from './transaction-import-routing.module';

@NgModule({
  declarations: [
    TransactionImportComponent,
    TransactionFileImportComponent,
    TransactionDetailsImportComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TransactionImportRoutingModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule,
    FormsModule,
    FileUploadModule,
    FontAwesomeModule
  ]
})
export class TransactionImportModule { }
