import { Component, Input, OnInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { faTimes, faSearch, faSpinner, faRefresh, faCheck } from "@fortawesome/free-solid-svg-icons";
import * as _ from 'lodash';
import { ApiService } from '../../../shared/service/api.service';
import { DialogComponent } from "../../service/dialog";
import { TerminalService } from '../../service/terminal.service';
import { ToastService } from '../toast';
import { TillService } from '../../service/till.service';

@Component({
  selector: 'app-terminal-dialog',
  templateUrl: './terminal-dialog.component.html',
  styleUrls: ['./terminal-dialog.component.scss']
})
export class TerminalDialogComponent implements OnInit {
  @Input() customer: any;
  dialogRef: DialogComponent

  faTimes = faTimes;
  faSearch = faSearch;
  faSpinner = faSpinner;
  faRefresh = faRefresh;
  faCheck = faCheck;
  loading = false;
  showLoader = false;
  progressClass = 'mat-warn';
  statusMessage = 'PAYMENT_WAITING_ON_CUSTOMER';
  ifCardSuccess = false;
  paymentReference: any;
  progressValue = 0;
  amount = 0;
  paymentSequenceNo = 0;
  otherPayments: Array<any> = [];
  cardPayments: Array<any> = [];
  interval: any;
  selectedIndex = 0;
  restartPaymentTimer = 46;
  nItemsTotalToBePaid:number = 0;
  nTotalPaidUpToNow:number = 0;
  totalAmount:any = 0;
  changeAmount:any = 0;
  isProceed = false;
  iWorkstationId = localStorage.getItem('currentWorkstation');
  iBusinessId = localStorage.getItem('currentBusiness');
  bEnable : boolean = false;
  bFetchingPaymentIntegrations: boolean = false;
  aProviders: any;
  sSelectedProvider:string;

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private terminalService: TerminalService,
    private toastrService: ToastService,
    private httpClient: HttpClient,
    public tillService:TillService) {
    const _injector = this.viewContainer.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit() {
    // OLD APPROACH
    // this.cardPayments = this.dialogRef.context.payments.filter((o: any) => o.sName.toLowerCase() === 'card' && o.amount);
    // this.otherPayments = this.dialogRef.context.payments.filter((o: any) => o.sName.toLowerCase() !== 'card' && o.amount);
    this.nTotalPaidUpToNow = this.nItemsTotalToBePaid;
    this.cardPayments = this.dialogRef.context.payments.filter((o: any) => o.bUseTerminal && o.amount);
    if (this.cardPayments?.length) this.nTotalPaidUpToNow -= this.tillService.getSum(this.cardPayments, 'amount')

    this.otherPayments = this.dialogRef.context.payments.filter((o: any) => !o.bUseTerminal && o.amount);
    if (this.dialogRef.context.changeAmount > 0) {
      this.changeAmount = -this.dialogRef.context.changeAmount
    } else if (this.dialogRef.context.changeAmount < 0) {
      this.changeAmount = 0;
    }
    // this.totalAmount = _.sumBy(this.dialogRef.context.payments, 'amount');
    this.cardPayments.map((o: any) => {
      o.status = 'PROCEED';
      o.remark = 'NOT_PAID';
      o.sCardName = '';
      o.oPayNL = { sTransactionId: '', sTransactionStatus: '', sTicketHash: '' };
      this.isProceed = true;
      return o;
    });
   
    this.getPaymentsProviderSettings();
    // if (this.cardPayments.length > 0) {
    //   this.startTerminal(this.cardPayments[this.paymentSequenceNo]);
    //   this.paymentSequenceNo += this.paymentSequenceNo + 1;
    // }

    // remove it after testing
    // this.startProgressBar();
  }

  getPaymentsProviderSettings(){
    const oBody = {
      iBusinessId: this.iBusinessId,
      oFilterBy: {
        eName: ['paynl', 'ccv'],
        "oWebshop.bUseForWebshop" : false
      }
    }
    this.bFetchingPaymentIntegrations = true;
    this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider/list`, oBody).subscribe((result: any) => {
      this.bFetchingPaymentIntegrations = false;
      if (result?.data?.length){
        this.aProviders = result.data;
        this.sSelectedProvider = this.aProviders[0].eName;
        this.checkPaymentIntegration();
      }
    })
  }
  
  checkPaymentIntegration() {
    const oProvider = this.aProviders.find((el:any) => el.eName == this.sSelectedProvider)
    if(oProvider.aPaymentIntegration?.length){
      this.bEnable = oProvider.aPaymentIntegration?.some((paymentIntegration: any) => paymentIntegration.iWorkstationId == this.iWorkstationId)
    } else {
      this.bEnable = false;
    }
  }

  startProgressBar() {
    this.restartPaymentTimer = 45;
    this.progressValue = 0;
    this.interval = setInterval(() => {
      this.progressValue += 2.2;
      if (this.progressValue >= 100) {
        clearInterval(this.interval);
      }
      if (this.restartPaymentTimer > 0) {
        this.restartPaymentTimer -= 1;
      }
    }, 1000);
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  startTerminal(paymentInfo: any, index: number) {
    this.selectedIndex = index;
    paymentInfo.status = 'PROGRESS';
    paymentInfo.remark = 'PAYMENT_WAITING_ON_CUSTOMER';
    this.amount = paymentInfo.amount;
    this.progressClass = '';
    this.startProgressBar();
    this.statusMessage = 'PAYMENT_WAITING_ON_CUSTOMER';
    console.log('started terminal payment, amount=', this.amount, this.sSelectedProvider)
    this.terminalService.startTerminalPayment(this.amount, this.sSelectedProvider)
      .subscribe((res) => {
        paymentInfo.paymentReference = res.paymentReference;
        console.log('response from paynl', res)
        this.checkTerminalStatus(res.terminalStatusUrl); //, this.amount == 0.03
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });

    // this.checkTerminalStatus('res.terminalStatusUrl');
  }

  //All possible statuses:
  //APPROVED
  //HOST_CANCELLATION
  //DEVICE_CANCELLATION
  //USER_CANCELLATION
  //MERCHANT_CANCELLATION
  //TIMEOUT_EXPIRATION
  //For translations: Add PAYMENT_ before these strings

  checkTerminalStatus(url: string, testmode:boolean = false) {
    console.log('checkTerminalStatus called', url)
    setTimeout(() => {
      this.httpClient.get(url).subscribe((res: any) => {
        console.log('response of check', res)
          if (res.status === 'start') {
            this.checkTerminalStatus(url);
          }
          if (res.incidentcodetext || testmode) {
            console.log('res', res, 'index', this.selectedIndex)
            if (res.approved === '1' || testmode) {
              console.log('res approved')
              this.ifCardSuccess = true;
            }
            this.cardPayments[this.selectedIndex].remark = 'PAYMENT_' + res.incidentcodetext;
            this.cardPayments[this.selectedIndex].status = 'SUCCESS';
            this.cardPayments[this.selectedIndex].sCardName = res.cardbrandlabelname;
            this.cardPayments[this.selectedIndex].oPayNL.sTransactionId = res.txid;
            this.cardPayments[this.selectedIndex].oPayNL.sTransactionStatus = res.incidentcodetext;
            this.cardPayments[this.selectedIndex].oPayNL.sTicketHash = res.ticket;
            console.log('current status = ',this.cardPayments[this.selectedIndex]);
            if (res.error === '1') {
              console.log('res error')
              this.progressClass = 'mat-warn';
              this.cardPayments[this.selectedIndex].status = 'RETRY';
            }
            this.statusMessage = 'PAYMENT_' + res.incidentcodetext;
            this.progressValue = 100;
            this.restartPaymentTimer = 0;
            clearInterval(this.interval);
          }
        }, err => {
          this.toastrService.show({ type: 'danger', text: err.message });
        });

    }, 5 * 1000);
  }

  continue() {
    this.cardPayments = this.cardPayments.filter((item: any) => item.status === 'SUCCESS')
    console.log('successfull card payments', this.cardPayments)
    const paymentsToreturn = this.cardPayments.concat(this.otherPayments);
    const oCashPaymentMethod = this.dialogRef.context.payments.find((o: any) => o.sName.toLowerCase() === 'cash')
    const cashPaymentMethod = _.clone(oCashPaymentMethod);
    cashPaymentMethod.amount = this.changeAmount;
    cashPaymentMethod.remark = 'CHANGE_MONEY';
    paymentsToreturn.push(cashPaymentMethod);

    const nDiff = +(this.nItemsTotalToBePaid - this.totalAmount).toFixed(2); /* due to javascript exception */
    if ((nDiff < 0 && nDiff >= - 0.01) || (nDiff > 0 && nDiff <= 0.01)) { /* no need of zero differences */
      oCashPaymentMethod.amount = Number(oCashPaymentMethod.amount) + (this.nItemsTotalToBePaid - this.totalAmount);
      oCashPaymentMethod.remark = 'TOTAL_AMOUNT_UPDATED';
    }

    this.close(paymentsToreturn);
  }
}
