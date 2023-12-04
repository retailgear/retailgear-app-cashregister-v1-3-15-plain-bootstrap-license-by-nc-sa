import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faCheck, faRefresh, faSearch, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import * as _moment from 'moment';
import { TransactionDetailsComponent } from '../../../transactions/components/transaction-details/transaction-details.component';
import { ApiService } from '../../service/api.service';
import { DialogComponent, DialogService } from "../../service/dialog";
import { ReceiptService } from '../../service/receipt.service';
import { TillService } from '../../service/till.service';
import { ToastService } from '../toast';
@Component({
  selector: 'app-transaction-action',
  templateUrl: './transaction-action-dialog.component.html',
  styleUrls: ['./transaction-action-dialog.component.scss']
})
export class TransactionActionDialogComponent implements OnInit {
  dialogRef: DialogComponent

  faTimes = faTimes;
  faSearch = faSearch;
  faSpinner = faSpinner;
  faRefresh = faRefresh;
  faCheck = faCheck;
  loading = false;
  showLoader = false;
  oDataSource: any = undefined;
  transactionDetail:any =undefined;
  activityItems: any;
  activity: any;
  printActionSettings: any;
  printSettings: any;
  nRepairCount: number = 0;
  nOrderCount: number = 0;
  aTypes = ['regular', 'order', 'repair', 'giftcard', 'repair_alternative'];
  aActionSettings = ['DOWNLOAD', 'PRINT_THERMAL', 'EMAIL', 'PRINT_PDF']
  // aUniqueTypes: any = [];
  aRepairItems: any = [];
  aTemplates: any = [];
  employees:any =[];
  aRepairActionSettings: any;
  aRepairAlternativeActionSettings: any;
  usedActions: boolean = false;
  businessDetails: any;
  bRegularCondition: boolean;
  bOrderCondition: boolean = false;
  
  bProcessingTransaction: boolean = false;
  bRepairDisabled: boolean = false;
  bOrderDisabled: boolean = false;
  bRegularDisabled: boolean = false;
  bGiftCardDisabled : boolean = false;
  bRepairAlternativeDisabled : boolean = false;
  eType = 'cash-register-revenue';
  bReceiveNewsletter: boolean = false;
  iBusinessId: any = localStorage.getItem('currentBusiness');
  iWorkstationId: any = localStorage.getItem('currentWorkstation');
  aGiftcardItems: any;

  constructor(
    private viewContainer: ViewContainerRef,
    private receiptService: ReceiptService,
    private toastService: ToastService,
    private apiService: ApiService,
    private dialogService:DialogService,
    private tillService:TillService
  ) {
    const _injector = this.viewContainer.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit() {  
    this.dialogRef.contextChanged.subscribe((context: any) => {
      this.oDataSource = context.oDataSource;
      this.transactionDetail = context.transactionDetail;
      this.aTemplates = context.aTemplates;
      this.activityItems = context.activityItems;
      this.activity = context.activity;
      this.nOrderCount = context.nOrderCount;
      this.nRepairCount = context.nRepairCount;
      this.bRegularCondition = context.bRegularCondition;
      
      this.aRepairItems = this.activityItems.filter((item: any) => item.oType.eKind === 'repair' || item.oType.eKind === 'order');
      this.aGiftcardItems = this.activityItems.filter((item: any) => item.oType.eKind === 'giftcard');
      console.log(this.aRepairItems)
      // this.bRegularCondition = this.oDataSource.total > 0.02 || this.oDataSource.total < -0.02 || this.oDataSource.totalGiftcardDiscount || this.oDataSource.totalRedeemedLoyaltyPoints;
      this.bOrderCondition = this.nOrderCount >= 1; //this.nOrderCount === 1 || this.nRepairCount >= 1 || // && this.nRepairCount === 1

    })
    this.listEmployee();
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  listEmployee() {
    this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.iBusinessId }).subscribe((result:any)=>{
      if (result?.data?.length) {
        this.employees = this.employees.concat(result.data[0].result);
      }
    })
  }

  async performAction(type: any, action: any, index: number = 0, event:any) {
    this.usedActions = true;
    let oDataSource;
    const oTemplate = this.aTemplates.find((template: any) => template.eType === type);
    let pdfTitle = '';
    let sThermalTemplateType = type;
    event.target.disabled = true;

    if (index != undefined && (type === 'repair' || type === 'repair_alternative')) {
      
      if(type == 'repair') this.bRepairDisabled = true;
      else if(type == 'repair_alternative') this.bRepairAlternativeDisabled = true;
      oDataSource = this.tillService.prepareDataForRepairReceipt(this.aRepairItems[index], this.oDataSource, null);
      pdfTitle = oDataSource.sNumber;
      sThermalTemplateType = type;
    
    } else if (type === 'regular') {
      oDataSource = this.oDataSource;
      pdfTitle = this.oDataSource.sNumber;
      sThermalTemplateType = 'business-receipt';
    
    } else if (type === 'giftcard') {
      
      oDataSource = { ...this.aGiftcardItems[index] };
      oDataSource.businessDetails = this.oDataSource.businessDetails;
      oDataSource.nTotal = oDataSource.nPaidAmount;
      oDataSource.sReceiptNumber = this.oDataSource.sReceiptNumber;
      oDataSource.sBarcodeURI = this.tillService.generateBarcodeURI(true, 'G-' + oDataSource.sGiftCardNumber);
      pdfTitle = oDataSource.sGiftCardNumber;
    
    } else if (type === 'order') {

      oDataSource = this.tillService.prepareDataForOrderReceipt(this.activity, this.activityItems, this.oDataSource); 
      pdfTitle = oDataSource.sActivityNumber;
    }

    // oDataSource?.aPayments?.forEach((payment: any) => {
    //   payment.dCreatedDate = moment(payment.dCreatedDate).format('DD-MM-yyyy HH:mm:ss');
    // })
    // oDataSource.dCreatedDate = moment(oDataSource.dCreatedDate).format('DD-MM-yyyy HH:mm:ss');
    
    if (action == 'PRINT_THERMAL') {

      await this.receiptService.printThermalReceipt({
        currency: this.tillService.currency,
        oDataSource: oDataSource,
        printSettings: this.printSettings,
        apikey: this.businessDetails.oPrintNode.sApiKey,
        title: this.oDataSource.sNumber,
        sType: type,
        sTemplateType: sThermalTemplateType
      }).toPromise();
      event.target.disabled = false;

    } else if (action == 'EMAIL') {
      
      const response = await this.receiptService.exportToPdf({
        oDataSource: oDataSource,
        pdfTitle: pdfTitle,
        templateData: oTemplate,
        printSettings: this.printSettings.filter((s: any) => s.sType === type),
        sAction: 'sentToCustomer',
      }).toPromise();
      event.target.disabled = false;

      const body = {
        pdfContent: response,
        iTransactionId: this.oDataSource._id,
        receiptType: 'purchase-receipt',
        sCustomerEmail: oDataSource.oCustomer.sEmail,
        businessDetails: this.businessDetails
      }

      this.apiService.postNew('cashregistry', '/api/v1/till/send-to-customer', body).subscribe((result: any) => {
        if (result) this.toastService.show({ type: 'success', text: 'Mail send to customer.' });
      })
    
    } else {
      const oSettings = this.printSettings.find((s: any) => s.sType === type && s.sMethod === 'pdf' && s.iWorkstationId === this.iWorkstationId)
      if (!oSettings && action === 'PRINT_PDF') {
        this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
        this.bRegularDisabled = false;
        return;
      }
      await this.receiptService.exportToPdf({
        oDataSource: oDataSource,
        pdfTitle: pdfTitle,
        templateData: oTemplate,
        printSettings: oSettings,
        sAction: (action === 'DOWNLOAD') ? 'download' : 'print',
        sApiKey: this.businessDetails.oPrintNode.sApiKey
      }).toPromise();
      event.target.disabled = false;
    }
  }
  
  openTransactionDetail() {
    this.dialogService.openModal(TransactionDetailsComponent, 
      { 
        cssClass: "w-fullscreen mt--5", 
        context: { 
          transaction: this.oDataSource, 
          businessDetails: this.businessDetails, 
          eType: this.eType, 
          from: 'transactions-action',
          employeesList: this.employees,
          printSettings: this.printSettings
        }, 
        hasBackdrop: true, 
        closeOnBackdropClick: false, 
        closeOnEsc: false 
      }).instance.close.subscribe(
        result => {
          this.close(result?.action);
          // if (res) this.routes.navigate(['business/till']);
        });
  }


  updateCustomer() {
    let customerDetails = JSON.parse(JSON.stringify(this.oDataSource.oCustomer));
    customerDetails.bNewsletter = this.bReceiveNewsletter;
    customerDetails.iBusinessId = this.businessDetails._id;
    this.apiService.putNew('customer', `/api/v1/customer/update/${this.businessDetails._id}/${this.oDataSource.iCustomerId}`, customerDetails).subscribe(
      (result: any) => {
        if (result?.message == "success") {
          this.toastService.show({ type: 'success', text: 'Customer details updated.' });
        } else {
          this.toastService.show({ type: 'warning', text: 'Error while updating customer details updated.' });
        }
      }, (error: any) => {
        this.toastService.show({ type: 'warning', text: 'Error while updating customer details updated.' });
      }
    )
  }
}
