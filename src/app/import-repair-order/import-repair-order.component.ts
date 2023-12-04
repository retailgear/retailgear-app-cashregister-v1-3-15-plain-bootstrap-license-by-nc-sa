import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ApiService } from '../shared/service/api.service';
import { ImportRepairOrderService } from '../shared/service/import-repair-order.service';
import { StepperComponent } from '../shared/_layout/components/common';
import * as _ from 'lodash';

@Component({
  selector: 'import-repair-order',
  templateUrl: './import-repair-order.component.html',
  styleUrls: ['./import-repair-order.component.scss']
})
export class ImportRepairOrderComponent implements OnInit {

  stepperIndex: any = 0;
  parsedRepairOrderData: Array<any> = [];
  repairOrderDetailsForm: any;
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
  bShowError: boolean = false;

  @ViewChild('stepperContainer', { read: ViewContainerRef }) stepperContainer!: ViewContainerRef;

  constructor(
    private apiService: ApiService,
    private ImportRepairOrderService: ImportRepairOrderService
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
      this.importRepairOrder()
      this.stepperInstance.goNext();
    }
  }
  
  async importRepairOrder() {
    try {
      this.importInprogress = true;
      const oData = {
        parsedRepairOrderData: this.parsedRepairOrderData,
        referenceObj: this.referenceObj,
        iBusinessId: this.businessDetails._id,
        iLocationId: this.location._id,
        iWorkStationId: this.iWorkStationId,
        iEmployeeId: this.iEmployeeId
      }
      
      let aAllRecords = [];
      const { parsedRepairOrderData, oBody } = this.ImportRepairOrderService.mapTheImportRepairOrderBody(oData);
      this.parsedRepairOrderData = parsedRepairOrderData;
      const aTransactionItem = JSON.parse(JSON.stringify(oBody?.transactionItems));

      for (let i = 0; i < aTransactionItem?.length; i++) {
        oBody.transactionItems = [aTransactionItem[i]];
        oBody.oTransaction.iCustomerId = aTransactionItem[i].iCustomerId;
        oBody.oTransaction.eSource = 'import-csv';
        oBody.oTransaction.oCustomer = aTransactionItem[i].oCustomer;
        oBody.eType = aTransactionItem[i].eType;
        oBody.payments = this.ImportRepairOrderService.mapPayment(aTransactionItem[i]);

        let oCopy =_.cloneDeep(oBody);
        aAllRecords.push(oCopy);
      }

      const aCloseTransaction: any = [];
      const aOpenTransaction: any = [];
      for (const oRecord of aAllRecords) {
        if (oRecord?.transactionItems[0].eActivityItemStatus == 'delivered') aCloseTransaction.push(oRecord);
        else aOpenTransaction.push(oRecord);
      }

      const [_aCloseTransaction, _aOpenTransaction]: any = await Promise.all([
        this.apiService.postNew('cashregistry', '/api/v1/till/historical-activity', { aCloseTransaction, iBusinessId: this.businessDetails._id }).toPromise(),
        this.apiService.postNew('cashregistry', '/api/v1/till/multiple-transaction', { aOpenTransaction, iBusinessId: this.businessDetails._id }).toPromise()
      ])

      this.importInprogress = false;
      this.parsedRepairOrderData = [];
    } catch (error) {
      this.parsedRepairOrderData = [];
      this.importInprogress = false;
      this.bShowError = true;
    }
  }

}
