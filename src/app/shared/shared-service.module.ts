import { Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService } from './service/pdf.service';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class SharedServiceModule {
  constructor(private injector: Injector) {
    SharedServiceModule.getPrintService = () => injector.get(PdfService);
  }

  public static getPrintService: () => PdfService;
}
