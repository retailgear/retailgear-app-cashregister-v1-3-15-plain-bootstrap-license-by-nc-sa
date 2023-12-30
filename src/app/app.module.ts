import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { TranslateModule } from "@ngx-translate/core";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from "@angular/forms";
// import { PrintComponent } from './print/print.component';

// Translate imports
import { OverlayModule } from '@angular/cdk/overlay';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { TranslationsService } from './shared/service/translation.service';
// import { BarcodeComponent } from './barcode/barcode.component';
import { AppInitService } from './shared/service/app-init.service';
import { SharedServiceModule } from './shared/shared-service.module';
import { LoginCashRegisterComponent } from './login-cash-register/login-cash-register.component';

import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { ToastModule } from './shared/components/toast';
import { NgSelectModule } from '@ng-select/ng-select';

import { SharedModule } from "./shared/shared.module";

@NgModule({
  declarations: [
    AppComponent,
    // PrintComponent,
    // BarcodeComponent,
    LoginCashRegisterComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TranslateModule.forRoot(),
    FormsModule,
    NgJsonEditorModule,
    SharedServiceModule,
    OverlayModule,
    RecaptchaFormsModule,
    RecaptchaModule,
    ToastModule,
    NgSelectModule,
    SharedModule
  ],
  providers: [
    AppInitService,
    {
      provide: APP_INITIALIZER,
      useFactory: initCsp,
      deps: [AppInitService],
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
  constructor(
    private translationsService: TranslationsService,
  ) {
    // this.translationsService.init()
  }
}

export function initCsp(appInitService: AppInitService) {
  return () => {
    appInitService.initCsp();
  };
}
