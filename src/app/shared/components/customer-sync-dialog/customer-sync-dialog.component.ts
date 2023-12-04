import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { DialogComponent, DialogService } from '../../service/dialog';
import { ViewContainerRef } from '@angular/core';
import { ApiService } from '../../../shared/service/api.service';
import { CustomerDetailsComponent } from '../customer-details/customer-details.component';

import { faL, faTimes } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from '@ngx-translate/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexXAxis,
  ChartComponent,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexLegend
} from "ng-apexcharts";
import { ToastService } from '../toast';
import { TransactionDetailsComponent } from '../../../transactions/components/transaction-details/transaction-details.component';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CustomerDialogComponent } from '../../../shared/components/customer-dialog/customer-dialog.component';

@Component({
  selector: 'app-customer-sync-dialog',
  templateUrl: './customer-sync-dialog.component.html',
  styleUrls: ['./customer-sync-dialog.component.scss']
})

export class CustomerSyncDialogComponent implements OnInit, AfterViewInit {

  dialogRef: DialogComponent;
  mode: string = '';
  editProfile: boolean = true;
  customer: any = {
    _id: '',
    bNewsletter: true,
    sSalutation: '',
    sEmail: '',
    sFirstName: '',
    sPrefix: '',
    sLastName: '',
    oPhone: {
      sCountryCode: '',
      sMobile: '',
      sLandLine: '',
      sFax: '',
      bWhatsApp: true
    },
    sNote: '',
    dDateOfBirth: '',
    oIdentity: {
      documentName: '',
      documentNumber: '',
    },
    sGender: '',
    oInvoiceAddress: {
      sCountry: 'Netherlands',
      sCountryCode: 'NL',
      sState: '',
      sPostalCode: '',
      sHouseNumber: '',
      sHouseNumberSuffix: '',
      //sAddition: '',
      sStreet: '',
      sCity: ''
    },
    oShippingAddress: {
      sCountry: 'Netherlands',
      sCountryCode: 'NL',
      sState: '',
      sPostalCode: '',
      sHouseNumber: '',
      sHouseNumberSuffix: '',
      //sAddition: '',
      sStreet: '',
      sCity: ''
    },
    sCompanyName: '',
    sVatNumber: '',
    sCocNumber: '',
    nPaymentTermDays: '',
    nLoyaltyPoints: 0,
    nLoyaltyPointsValue: 0,
    createrDetail: {},
    iEmployeeId: '',
    aGroups: [],
    bIsCompany: false
  }

  selectedCustomer: any = 'system' ;
  customers: Array<any> = [];

  requestParams: any = {
    iBusinessId: ""
  };


  @ViewChild('customerNote') customerNote: ElementRef;
  businessDetails: any = {};
  systemCustomer: any;
  activityItems: any;
  
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private router: Router
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.activityItems = this.dialogRef?.context?.activityItems;
    this.systemCustomer = this.dialogRef?.context?.systemCustomer;
    this.customer = { ... this.systemCustomer, ... this.dialogRef?.context?.currentCustomer };
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness');
    this.requestParams.iLocationid = localStorage.getItem('currentLocation');
    console.log('SYSTEM CUSTOMER --- ', this.systemCustomer);
    console.log('CURRENT CUSTOMER --- ', this.customer);

    console.log('SELECTED CUSTOMER --- ', this.selectedCustomer);
  }

  
  /* Update customer in [T, A, AI] */
  updateCurrentCustomer(oData: any) {
    const oBody = {
      oCustomer: this.systemCustomer,
      iBusinessId: this.requestParams.iBusinessId,
      iActivityItemId: this.activityItems[0]._id
    }
    
    this.apiService.postNew('cashregistry', '/api/v1/transaction/update-customer', oBody).subscribe((result: any) => {
      this.close({ action: true, currentCustomer: this.systemCustomer });
      this.toastService.show({ type: "success", text: 'SUCCESSFULLY_UPDATED' });
    }, (error) => {
      console.log('update customer error: ', error);
      this.toastService.show({ type: "warning", text: `Something went wrong` });
    });
  }
  openCustomer(customer: any) {
    this.dialogService.openModal(CustomerDetailsComponent,
      { cssClass: "modal-xl position-fixed start-0 end-0", context: { customerData: customer, mode: 'details', editProfile: false } }).instance.close.subscribe(result => { this.close({ action: true }); });
  }

  UpdateCustomerData() {
    if (this.selectedCustomer == 'system') {
      this.updateCurrentCustomer(this.selectedCustomer);
    } else { // current
      //console.log("else", this.systemCustomer);
      this.customer.iBusinessId = this.requestParams.iBusinessId;
      this.apiService.putNew('customer', '/api/v1/customer/update/' + this.requestParams.iBusinessId + '/' + this.systemCustomer._id, this.customer).subscribe(
        (result: any) => {
          if (result?.message === 'success') {
            this.toastService.show({ type: 'success', text:`SUCCESSFULLY_UPDATED` });
            this.close({ action: true,  systemCustomer: this.customer});
          } else{
             let errorMessage = "";
             this.translateService.get(result.message).subscribe((res:any)=>{
              errorMessage = res;
             })
             this.toastService.show({type:'warning' , text:errorMessage});
          }
        },
        (error: any) => {
          console.log(error.message);
        }
      );
      //this.openCustomer(this.systemCustomer);
    }
  }

  ngAfterViewInit() {

  }


  close(data: any) {
    this.dialogRef.close.emit(data);
  }



}
