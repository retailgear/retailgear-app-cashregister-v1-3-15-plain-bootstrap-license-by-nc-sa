import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { DialogComponent } from '../../service/dialog';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-custom-payment-method',
  templateUrl: './custom-payment-method.component.html',
  styleUrls: ['./custom-payment-method.component.sass']
})
export class CustomPaymentMethodComponent implements OnInit {

  dialogRef: DialogComponent;
  mode: string = ''
  requestParams: any = {
    iBusinessId: ''
  }
  customMethod: any = {
    sName: '',
    bStockReduction: false,
    bInvoice: false,
    // bAssignSavingPoints : false,
    bAssignSavingPointsLastPayment: true,
    sLedgerNumber: ''
  }

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService
  ) {
    const _injector = this.viewContainer.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness')
  }

  update() {
    this.customMethod.iBusinessId = this.requestParams.iBusinessId;
    this.apiService.putNew('cashregistry', '/api/v1/payment-methods/update', this.customMethod).subscribe((result: any) => {
      this.dialogRef.close.emit({ action: true })
    }, (error) => {
    })
  }

  create() {
    this.customMethod.iBusinessId = this.requestParams.iBusinessId;
    this.apiService.postNew('cashregistry', '/api/v1/payment-methods/create', this.customMethod).subscribe((result: any) => {
      this.dialogRef.close.emit({ action: true })
    }, (error) => {
    })
  }

  close() {
    this.dialogRef.close.emit({ action: false })
  }
}
