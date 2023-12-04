import { Component, Input, OnInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { faTimes, faSearch, faSpinner, faRefresh, faCheck } from "@fortawesome/free-solid-svg-icons";
import * as _ from 'lodash';

import { DialogComponent } from "../../service/dialog";
import { TerminalService } from '../../service/terminal.service';
import { ToastService } from '../toast';

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
  totalAmount = 0;
  changeAmount = 0;
  constructor(
    private viewContainer: ViewContainerRef,
    private terminalService: TerminalService,
    private toastrService: ToastService,
    private httpClient: HttpClient) {
    const _injector = this.viewContainer.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.cardPayments = this.dialogRef.context.payments.filter((o: any) => o.sName.toLowerCase() === 'card' && o.amount);
    this.otherPayments = this.dialogRef.context.payments.filter((o: any) => o.sName.toLowerCase() !== 'card' && o.amount);
    this.changeAmount = this.dialogRef.context.changeAmount < 0 ? 0 : this.dialogRef.context.changeAmount;
    this.totalAmount = _.sumBy(this.dialogRef.context.payments, 'amount');
    this.cardPayments.map((o: any) => { o.status = 'PROCEED'; o.remark = 'NOT_PAID'; o.sCardName = ''; o.oPayNL = { sTransactionId: '', sTransactionStatus: '', sTicketHash: '' }; return o; });
    // if (this.cardPayments.length > 0) {
    //   this.startTerminal(this.cardPayments[this.paymentSequenceNo]);
    //   this.paymentSequenceNo += this.paymentSequenceNo + 1;
    // }

    // remove it after testing
    // this.startProgressBar();
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
    this.terminalService.startTerminalPayment(this.amount)
      .subscribe((res) => {
        paymentInfo.paymentReference = res.paymentReference;
        if(this.amount == 0.02)
          this.checkTerminalStatus(res.terminalStatusUrl, true);
        else 
          this.checkTerminalStatus(res.terminalStatusUrl, false);
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

  checkTerminalStatus(url: string, testmode?:boolean) {
    setTimeout(() => {
      this.httpClient.get(url)
        .subscribe((res: any) => {
          if (res.status === 'start') {
            this.checkTerminalStatus(url);
          }
          if (res.incidentcodetext || testmode) {
            if (res.approved === '1' || testmode) {
              this.ifCardSuccess = true;
            }
            this.cardPayments[this.selectedIndex].remark = 'PAYMENT_' + res.incidentcodetext;
            this.cardPayments[this.selectedIndex].status = 'SUCCESS';
            this.cardPayments[this.selectedIndex].sCardName = res.cardbrandlabelname;
            this.cardPayments[this.selectedIndex].oPayNL.sTransactionId = res.txid;
            this.cardPayments[this.selectedIndex].oPayNL.sTransactionStatus = res.incidentcodetext;
            this.cardPayments[this.selectedIndex].oPayNL.sTicketHash = res.ticket;
            if (res.error === '1') {
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
    const paymentsToreturn = this.cardPayments.concat(this.otherPayments);
    if (this.dialogRef.context.changeAmount > 0) {
      const cashPaymentMethod = _.clone(this.dialogRef.context.payments.find((o: any) => o.sName.toLowerCase() === 'cash'));
      cashPaymentMethod.amount = -this.dialogRef.context.changeAmount;
      paymentsToreturn.push(cashPaymentMethod);
    }
    this.close(paymentsToreturn);
  }
}
