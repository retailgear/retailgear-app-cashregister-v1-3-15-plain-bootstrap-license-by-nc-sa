import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { DialogComponent } from '../../service/dialog';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-custom-payment-method',
  templateUrl: './custom-payment-method.component.html',
  styleUrls: ['./custom-payment-method.component.scss']
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
    bAssignSavingPoints : false,
    bAssignSavingPointsLastPayment: true,
    sLedgerNumber: '',
    bShowInCashRegister: true,
    bUseTerminal: false
  }
  visiblePayMethods: any;
  settings: any;

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService
  ) {
    const _injector = this.viewContainer.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness')
    //console.log('initial', this.visiblePayMethods);
  }

  async update() {
    //Need to update payments method sequence
    if(this.mode == 'details' && this.customMethod.bIsDefaultPaymentMethod){
      let newProps = { 
        _id: this.customMethod._id,
        bShowInCashRegister:  this.customMethod.bShowInCashRegister,
        bStockReduction:  this.customMethod.bStockReduction,
        bInvoice:  this.customMethod.bInvoice,
        bAssignSavingPoints:  this.customMethod.bAssignSavingPoints,
        bAssignSavingPointsLastPayment:  this.customMethod.bAssignSavingPointsLastPayment
      };
      let method = await this.settings?.aDefaultPayMethodSettings?.find((el:any) => el._id === this.customMethod._id);
      if(method){
        this.settings.aDefaultPayMethodSettings = this.settings?.aDefaultPayMethodSettings?.map((el:any) => { 
          if(el._id === method._id) el = newProps;
          return el;
        });
      }else{
        this.settings?.aDefaultPayMethodSettings?.push(newProps);
      }
      const oBody = {
        aDefaultPayMethodSettings:  this.settings?.aDefaultPayMethodSettings,
      }
      this.apiService.putNew('cashregistry', '/api/v1/settings/update/' + this.requestParams.iBusinessId, oBody).subscribe((result: any) => {
        if(this.customMethod.bShowInCashRegister)
          this.visiblePayMethods.push(this.customMethod);
        else
          this.visiblePayMethods = this.visiblePayMethods.filter((el: any)=> el._id != this.customMethod._id);
        this.saveSequence();
        //this.dialogRef.close.emit({ action: true })
       }, (error) => {
      });
      
    }else{
      this.customMethod.iBusinessId = this.requestParams.iBusinessId;
      this.apiService.putNew('cashregistry', '/api/v1/payment-methods/update', this.customMethod).subscribe((result: any) => {
        if(result?.data){
          if(this.customMethod.bShowInCashRegister)
            this.visiblePayMethods.push(this.customMethod);
          else
            this.visiblePayMethods = this.visiblePayMethods.filter((el: any)=> el._id != this.customMethod._id);
          this.saveSequence();
          //this.dialogRef.close.emit({ action: true })
        }
      }, (error) => {
      })
    }
  }

  create() {
    //Need to update payments method sequence
    this.customMethod.iBusinessId = this.requestParams.iBusinessId;
    this.apiService.postNew('cashregistry', '/api/v1/payment-methods/create', this.customMethod).subscribe((result: any) => {
      if(result?.data){
        if(result?.data.bShowInCashRegister)
          this.visiblePayMethods.push(result?.data);
        this.saveSequence();
      }
      // this.payMethods.push(result)
     
    }, (error) => {
    })
  }

  saveSequence() {
    const oBody = {
      aPaymentMethodSequence: this.visiblePayMethods,
    }
    this.apiService.putNew('cashregistry', '/api/v1/settings/update/' + this.requestParams.iBusinessId, oBody).subscribe((result: any) => {
      this.dialogRef.close.emit({ action: true })
     }, (error) => {
    });
  }

  close() {
    this.dialogRef.close.emit({ action: false })
  }
}
