import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent, DialogService } from '../../service/dialog';
import { ToastService } from '../toast';


@Component({
  selector: 'app-bank-confirmation-dialog',
  templateUrl: './bank-confirmation-dialog.component.html',
  styleUrls: ['./bank-confirmation-dialog.component.scss']
})
export class BankConfirmationDialogComponent implements OnInit {

  faTimes = faTimes;
  dialogRef: DialogComponent;
  transaction: any;
  bankConfirmation: any = {
    dDateConfirmed:new Date(),
    nAmount: 0
  }
  iBusinessId: any = "";
  isShowLoading:Boolean =false;
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private dialogService: DialogService,
    private toastService: ToastService,

  ) {
    const _injector = this.viewContainerRef.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);

  }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness');
  }

  submit() {
    if (this.transaction.aPayments?.length) {
      const bankPayment = this.transaction.aPayments.filter((payment: any) => {
        if (payment.sMethod == 'bankpayment' && !payment?.bConfirmed) return payment
      });
      if (!bankPayment?.length) {
        this.toastService.show({ type: 'danger', text: 'Bank payment already confirmed' });
        this.close({ action: false });
      }
      const nTotalBankPayment = bankPayment[0]?.nAmount;
      let nTotalBankConfirmedPayment = 0;
      for (let paymentConfirmation of bankPayment[0]?.aBankConfirmation) {
        nTotalBankConfirmedPayment = nTotalBankConfirmedPayment + Number(paymentConfirmation?.nAmount);
      }
      // Transform negatives to positive number, only for the below condition.
      if (Math.abs(nTotalBankConfirmedPayment) < Math.abs(nTotalBankPayment)) {
        bankPayment[0].aBankConfirmation.push(this.bankConfirmation);
        const oBody = {
          iBusinessId: this.iBusinessId,
          iTransactionId: this.transaction._id,
          bankPayment: bankPayment[0]
        }
        this.isShowLoading= true;
        this.apiService.putNew('cashregistry', `/api/v1/transaction/bank/bankPaymentConfirmation`, oBody).subscribe((res: any) => {
          console.log("res", res);
          this.isShowLoading = false;
          if(res?.message == 'success'){
            this.toastService.show({type:'success' , text:'Successfully update'});
            this.close({ action: true , res:res?.data});
          }else{
            this.toastService.show({type:'danger' , text:res?.message});
            this.close({ action: false});
          }
  
        }, (error) => {
          console.log(error);
          this.isShowLoading = false;
          this.toastService.show({ type: 'danger', text: error });
          this.close({ action: false });
        })
      } else {
        this.toastService.show({ type: 'danger', text: 'BankPayment already confirmed' });
        this.close({action:false});
      }
    } else {
      this.close({ action: false });
    }


  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }


}
