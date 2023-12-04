import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ApiService } from '../../shared/service/api.service';
import { ImportService } from '../../shared/service/import.service';
import { StepperComponent } from '../../shared/_layout/components/common';
@Component({
  selector: 'app-transaction-import',
  templateUrl: './transaction-import.component.html',
  styleUrls: ['./transaction-import.component.scss']
})
export class TransactionImportComponent implements OnInit {

  stepperIndex: any = 0;
  parsedTransactionData: Array<any> = [];
  transactionDetailsForm: any;
  updateTemplateForm: any;
  importInprogress: boolean = false;
  businessDetails: any = {};
  location: any = {};
  workstation: any = {};
  currentEmployeeId: string = '';
  stepperInstatnce: any;
  bShowError: boolean = true;

  @ViewChild('stepperContainer', { read: ViewContainerRef }) stepperContainer!: ViewContainerRef;

  constructor(
    private importService: ImportService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.currentEmployeeId = JSON.parse(localStorage.getItem('currentUser') || '')['userId'];
    this.businessDetails._id = localStorage.getItem('currentBusiness'),
    this.location._id = localStorage.getItem('currentLocation'),
    this.workstation._id = localStorage.getItem('currentWorkstation')
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

  async importTransaction() {
    this.importInprogress = true;
    //Create Trasnaction properly?
    const aNewTransaction:any = [];
    for (let j = 0; j < this.parsedTransactionData?.length; j++) {
        // console.log('im here', this.parsedTransactionData[j])
        let data = this.parsedTransactionData[j];
        
        let finalCdate = new Date();
        if(data?.dCreationDate?.includes('-')){
          const formatCdate = new Date(data?.dCreationDate?.split('-').reverse().join('/'));
          const dCreatedDate = new Date(formatCdate).setHours(5, 30, 0, 0);
          finalCdate = new Date(dCreatedDate);
        }else{
          const formatCdate = new Date(data?.dCreationDate?.split('/').reverse().join('/'));
          const dCreatedDate = new Date(formatCdate);
          finalCdate = new Date(dCreatedDate);
        }
        
        data.nPriceIncVat = parseFloat((data?.nPriceIncVat)?.replace(/,/g, '.'));
        data.nPaymentAmount = parseFloat((data?.nPaymentAmount)?.replace(/,/g, '.'));

        const oEmployee = {
          sFirstName: data['oEmployeeMetaData.sFirstName'],
          sLastName: data['oEmployeeMetaData.sLastName']
        }

        const oCustomer = {
          nClientId: data?.nClientId,
          sFirstName: data['oCustomer.sFirstName'],
          sLastName: data['oCustomer.sLastName']
        }

        let aTransactionItems = [];

        //need to put all the transaction
        const oTransactionItemData = {
          'iLocationId': this.location._id,
          'iWorkstationId': this.workstation._id,
          "oEmployeeMetaData": oEmployee,
          "iEmployeeId": data?.iEmployeeId || this.currentEmployeeId,
          'iBusinessId': this.businessDetails._id,
          "iProductId": data?.iProductId ? data?.iProductId : undefined,
          "eStatus": 'y',
          "iArticleGroupOriginalId": "636452cb33a9344d347103ef",
          "iArticleGroupId": "636452cb33a9344d347103ef",
          'oType': {
            'eTransactionType': 'cash-registry',
            'eKind': 'regular',
            'bRefund': false,
            'bDiscount': false,
            "bPrepayment": false
          },
          "sProductName": data?.sProductName ? data?.sProductName : data?.sArticleNumber,
          "sTransactionNumber": data?.sNumber,
          "sDescription": data?.sDescription ? data?.sDescription : '',
          "sComment": data?.sDescription ? data?.sDescription :'',
          "sArticleNumber": data?.sArticleNumber ? data?.sArticleNumber : undefined,
          "sProductNumber": data?.sProductNumber ? data?.sProductNumber : undefined,
          "nRevenueAmount": data?.nPriceIncVat,
          "nVatRate": data?.nVatRate ? data?.nVatRate : 21,
          "nDiscount": data?.nDiscount ? data?.nDiscount : 0, 
          "bDiscountOnPercentage": data?.bDiscountOnPercentage ? data?.bDiscountOnPercentage : false,
          "nQuantity": data?.nQuantity ? Number(data?.nQuantity) : 1,
          "nPurchasePrice": data?.purchasePrice ? Number(data?.nPurchasePrice) : 0,
          'nPriceIncVat': data?.nPriceIncVat ? Number(data?.nPriceIncVat) : 0,
          "nPaidAmount": data?.nPaymentAmount ?  Number(data?.nPaymentAmount) : Number(data?.nPriceIncVat),
          "nPaymentAmount": data?.nPaymentAmount ?  data?.nPaymentAmount : data?.nPriceIncVat,
          "eSource":"import-csv",
          "bImported": true,
          "dCreatedDate": finalCdate,
          "dUpdatedDate": new Date()
        }

        aTransactionItems.push(oTransactionItemData);

        let oTransaction = await aNewTransaction.find((el: any) => (el.sNumber).toUpperCase() == (data?.sNumber).toUpperCase());
        if(oTransaction){
          oTransaction?.transactionItems?.push(oTransactionItemData);
        }else{
          const oTransaction = {
            'iLocationId': this.location._id,
            'iWorkstationId': this.workstation._id,
            "iEmployeeId": data?.iEmployeeId || this.currentEmployeeId,
            "oEmployeeMetaData":oEmployee,
            'iBusinessId': this.businessDetails._id,
            "eType": "cash-register-revenue",
            "eStatus": 'y',
            "oCustomer": oCustomer,
            "aTransactionItemType": [],
            "sNumber": data?.sNumber ? data?.sNumber : '',
            "sReceiptNumber": data?.sReceiptNumber ? data?.sReceiptNumber : undefined,
            "sInvoiceNumber": data?.sInvoiceNumber ? data?.sInvoiceNumber : undefined,
            "transactionItems": aTransactionItems,
            "eSource":"import-csv",
            "dCreatedDate": finalCdate,
            "dUpdatedDate": new Date(),
            "bImported": true,
            "payments": []
          }
  
          aNewTransaction.push(oTransaction);  
        };
    }

    let data: any = {
      iBusinessId: this.businessDetails._id,
      iLocationId: this.location._id,
      // oTemplate: this.importService.processImportTransaction({ transaction: this.updateTemplateForm }), // Can be used in future if required.
      aTransaction: aNewTransaction,
      sDefaultLanguage: localStorage.getItem('language') || 'en',
      bImport: true
    };

    this.apiService.postNew('cashregistry', '/api/v1/migration/transaction', data).subscribe((result: any) => {
      this.importInprogress = false;
      this.parsedTransactionData = [];
    }, (error) => {
      this.bShowError = true
      this.parsedTransactionData = [];
      console.error(error);
    });
  }
}
