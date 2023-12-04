import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerImportComponent } from './customer-import.component';
import { FileUploadModule } from '@iplab/ngx-file-upload';
// import { BrowserAnimationsModule   } from '@angular/platform-browser/animations';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileImportComponent } from '../file-import/file-import.component';
import { CustomerDetailsImportComponent } from '../customer-details-import/customer-details-import.component';
import { CustomerImportRoutingModule } from './customer-import-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslationsService } from '../../shared/service/translation.service';

@NgModule({
  declarations: [
    CustomerImportComponent,
    FileImportComponent,
    CustomerDetailsImportComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CustomerImportRoutingModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule,
    FormsModule,
    FileUploadModule,
    // BrowserAnimationsModule,
    FontAwesomeModule
  ],

})
export class CustomerImportModule { }
