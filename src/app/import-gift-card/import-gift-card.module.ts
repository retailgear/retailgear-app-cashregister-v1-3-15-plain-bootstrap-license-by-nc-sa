import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportGiftCardComponent } from './import-gift-card.component';
import { ImportGiftCardRoutingModule } from './import-gift-card-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { GiftCardFileImportComponent } from './import-gift-card-file/import-gift-card-file.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ImportGiftCardDetailComponent } from './import-gift-card-detail/import-gift-card-detail.component';

@NgModule({
  declarations: [
    ImportGiftCardComponent,
    GiftCardFileImportComponent,
    ImportGiftCardDetailComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ImportGiftCardRoutingModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule,
    FormsModule,
    FileUploadModule,
    FontAwesomeModule
  ]
})

export class ImportGiftCardModule { }
