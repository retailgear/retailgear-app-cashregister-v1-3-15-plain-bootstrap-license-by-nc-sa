import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestFilterComponent } from './testfilter.component';
import { TestFilterRoutingModule } from './testfilter-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule, PaginatePipe } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    TestFilterComponent
  ],
  imports: [
    TranslateModule,
    CommonModule,
    SharedModule,
    TestFilterRoutingModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    NgxPaginationModule
  ],
  providers: [
    PaginatePipe
  ]
})
export class TestFilterModule { }
