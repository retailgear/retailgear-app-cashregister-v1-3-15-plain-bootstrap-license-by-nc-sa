import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
// import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from '@angular/common/http';
import { PrintComponent } from './print/print.component';
import { FormsModule } from "@angular/forms";
import { Observable } from 'rxjs';

// Translate imports
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { SharedServiceModule } from './shared/shared-service.module';
import { BarcodeComponent } from './barcode/barcode.component';
import { TranslationsService } from 'src/app/shared/service/translation.service';


@NgModule({
  declarations: [
    AppComponent,
    PrintComponent,
    BarcodeComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    // BrowserAnimationsModule,
    AppRoutingModule,
    TranslateModule.forRoot(),
    FormsModule,
    NgJsonEditorModule,
    SharedServiceModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    private translationsService: TranslationsService,


  ) {
    console.log('cash register app module constructor')
    // this.translationsService.init()
  }
}
