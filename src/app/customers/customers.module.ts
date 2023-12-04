import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

import { CustomersRoutingModule } from './customers-routing.module';

import { CustomersComponent } from './customers.component';
import { PaginatePipe } from 'ngx-pagination';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { BrowserModule } from '@angular/platform-browser'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import { CustomerImportComponent } from './customer-import/customer-import.component';
// import { FileImportComponent } from './file-import/file-import.component';
// import { FileUploadModule } from '@iplab/ngx-file-upload';
// import { BrowserAnimationsModule   } from '@angular/platform-browser/animations';
// import { CustomerDetailsImportComponent } from './customer-details-import/customer-details-import.component';

@NgModule({
  declarations: [
    CustomersComponent,
    // CustomerImportComponent,
    // FileImportComponent,
    // CustomerDetailsImportComponent
    
  ],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SharedModule,
    TranslateModule,
    NgxPaginationModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormsModule,
    // BrowserModule,
    FontAwesomeModule,
    // FileUploadModule,
    // BrowserAnimationsModule
    // NoopAnimationsModule
  ],
  providers: [
    PaginatePipe
  ]
})
export class CustomersModule { }
