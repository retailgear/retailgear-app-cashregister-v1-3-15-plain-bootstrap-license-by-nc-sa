import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ApiService } from 'src/app/shared/service/api.service';
import { ImportService } from 'src/app/shared/service/import.service';
import { StepperComponent } from 'src/app/shared/_layout/components/common';
@Component({
  selector: 'app-transaction-import',
  templateUrl: './transaction-import.component.html',
  styleUrls: ['./transaction-import.component.sass']
})
export class TransactionImportComponent implements OnInit {

  stepperIndex: any = 0;
  parsedTransactionData: Array<any> = [];
  transactionDetailsForm: any;
  updateTemplateForm: any;
  importInprogress: boolean = false;
  businessDetails: any = {};
  location: any = {};
  stepperInstatnce: any;
  @ViewChild('stepperContainer', { read: ViewContainerRef }) stepperContainer!: ViewContainerRef;

  constructor(
    private importService: ImportService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.businessDetails._id = localStorage.getItem('currentBusiness'),
    this.location._id = localStorage.getItem('currentLocation')
  }

  ngAfterContentInit(): void {
    StepperComponent.bootstrap();
    setTimeout(() => {
      this.stepperInstatnce = StepperComponent.getInstance(this.stepperContainer.element.nativeElement);
    }, 200);
  }

  public moveToStep(step: any) {
    if (step == 'next') {
      this.stepperInstatnce.goNext();
    } else if (step == 'previous') {
      this.stepperInstatnce.goPrev();
    } else if (step == 'import') {
      this.importTransaction()
      this.stepperInstatnce.goNext();
    }
  }

  importTransaction() {
    this.importInprogress = true;
    let data: any = {
      iBusinessId: this.businessDetails._id,
      iLocationId: this.location._id,
      // oTemplate: this.importService.processImportTransaction({ transaction: this.updateTemplateForm }), // Can be used in future if required.
      aTransaction: this.parsedTransactionData,
      sDefaultLanguage: localStorage.getItem('language') || 'n;'
    };

    this.apiService.postNew('cashregistry', '/api/v1/transaction/import', data).subscribe((result: any) => {
      this.importInprogress = false;
    }, (error) => {
      console.error(error);
    });
  }
}
