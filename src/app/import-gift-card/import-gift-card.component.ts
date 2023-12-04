import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ApiService } from '../shared/service/api.service';
import { ImportGiftCardService } from '../shared/service/import-gift-card.service';
import { StepperComponent } from '../shared/_layout/components/common';
import * as _ from 'lodash';

@Component({
  selector: 'import-gift-card',
  templateUrl: './import-gift-card.component.html',
  styleUrls: ['./import-gift-card.component.scss']
})

export class ImportGiftCardComponent implements OnInit {

  stepperIndex: any = 0;
  parsedGiftCardData: Array<any> = [];
  giftCardDetailsForm: any;
  updateTemplateForm: any;
  importInprogress: boolean = false;
  businessDetails: any = {};
  location: any = {};
  stepperInstance: any;
  allFields: any = {
    first: [],
    last: [],
    all: []
  };
  referenceObj: any = {};
  iWorkStationId: any;
  iEmployeeId: any;
  @ViewChild('stepperContainer', { read: ViewContainerRef }) stepperContainer!: ViewContainerRef;
  bShowError: boolean = false;
  created: any;
  failed: any;
  
  constructor(
    private apiService: ApiService,
    private importGiftCardService: ImportGiftCardService
  ) { }

  ngOnInit(): void {
    this.businessDetails._id = localStorage.getItem('currentBusiness');
    this.location._id = localStorage.getItem('currentLocation');
    this.iWorkStationId = localStorage.getItem('currentWorkstation');
    this.iEmployeeId = JSON.parse(localStorage.getItem('currentUser') || '{}').userId;
  }

  ngAfterContentInit(): void {
    StepperComponent.bootstrap();
    setTimeout(() => {
      this.stepperInstance = StepperComponent.getInstance(this.stepperContainer.element.nativeElement);
    }, 200);
  }

  public moveToStep(step: any) {
    if (step == 'next') {
      this.stepperInstance.goNext();
    } else if (step == 'previous') {
      this.stepperInstance.goPrev();
    } else if (step == 'import') {
      this.importGiftCard()
      this.stepperInstance.goNext();
    }
  }

  async importGiftCard() {
    try {
      this.importInprogress = true;
      const oData = {
        parsedGiftCardData: this.parsedGiftCardData,
        referenceObj: this.referenceObj,
        iBusinessId: this.businessDetails._id,
        iLocationId: this.location._id,
        iWorkStationId: this.iWorkStationId,
        iEmployeeId: this.iEmployeeId
      }

      let aAllRecords = [];
      const { parsedGiftCardData, oBody } =await this.importGiftCardService.mapTheImportGiftCardBody(oData);
      this.parsedGiftCardData = parsedGiftCardData;
      const aTransactionItem = JSON.parse(JSON.stringify(oBody?.transactionItems));

      for (let i = 0; i < aTransactionItem?.length; i++) {
        oBody.transactionItems = [aTransactionItem[i]];
        oBody.oTransaction.iCustomerId = aTransactionItem[i].iCustomerId;
        oBody.oTransaction.oCustomer = aTransactionItem[i].oCustomer,
        oBody.oTransaction.eSource = 'import-csv';
        oBody.oTransaction.dCreatedDate = aTransactionItem[i].dCreatedDate;
        oBody.bImportGiftCard = true;
        oBody.payments = this.importGiftCardService.mapPayment(aTransactionItem[i]);
        
        let oCopy =_.cloneDeep(oBody);
        aAllRecords.push(oCopy);
      }
      
      const aOpenTransaction: any = [];
      for (const oRecord of aAllRecords) {
        aOpenTransaction.push(oRecord);
        console.log('oRecord', oRecord)
      }

      const [_aCloseTransaction, _aOpenTransaction]: any = await Promise.all([
        // this.apiService.postNew('cashregistry', '/api/v1/till/historical-activity', { aCloseTransaction, iBusinessId: this.businessDetails._id }).toPromise(),
        this.apiService.postNew('cashregistry', '/api/v1/till/multiple-transaction', { aOpenTransaction, iBusinessId: this.businessDetails._id }).toPromise()
      ])


      this.importInprogress = false;
      this.parsedGiftCardData = [];
      
    } catch (error) {
      this.parsedGiftCardData = [];
      console.log('Import Gift card error');
      this.importInprogress = false;
      this.bShowError = true;
    }
  }

}
