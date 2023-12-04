import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportRepairOrderDetailComponent } from './import-repair-order-detail/import-repair-order-detail.component';
import { ImportRepairOrderFileComponent } from './import-repair-order-file/import-repair-order-file.component';
import { ImportRepairOrderComponent } from './import-repair-order.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ImportRepairOrderRoutingModule } from './import-repair-order-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    ImportRepairOrderComponent,
    ImportRepairOrderDetailComponent,
    ImportRepairOrderFileComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ImportRepairOrderRoutingModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule,
    FormsModule,
    FileUploadModule,
    FontAwesomeModule
  ]
})

export class ImportRepairOrderModule { }
