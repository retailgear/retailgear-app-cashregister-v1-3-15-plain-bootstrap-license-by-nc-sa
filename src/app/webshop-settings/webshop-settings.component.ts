import { Component, OnInit, ViewChild } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../shared/service/api.service';
import { ExtraServiceComponent } from './component/extra-service/extra-service.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-webshop-settings',
  templateUrl: './webshop-settings.component.html',
  styleUrls: ['./webshop-settings.component.scss']
})
export class WebshopSettingsComponent implements OnInit {

  @ViewChild(ExtraServiceComponent) extraService!: ExtraServiceComponent;
  faPlus = faPlus;

  deliveryMethods: Array<any> = ['ExpressShipping', 'RegisteredShipping', 'Neighborhood'];
  paymentMethodFormGroup: FormGroup;
  paymentProviderDetails: any;
  showPaymentMethodError: boolean = false;
  method: String = '';
  paymentProvider: String = 'paynl';
  business: any = {};
  iLocationId: string | null = '';
  showLoader: boolean = false;
  webShop: any = {
  }
  newShipping: any = {
    type: '',
    domestic: 0,
    europe: 0,
    abroad: 0,
  }

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder
  ) {
    this.paymentMethodFormGroup = this.formBuilder.group({
      provider: ['', Validators.required],
      mollieAPIKey: [''],
      stripeSecretKey: [''],
      stripeSign: [''],
      useForWebshop: [ false ],
      sApiCode: [''],
      sApiToken: [''],
      sServiceId: ['']
    });
    this.paymentMethodFormGroup.valueChanges.subscribe((value : any) => {
      for (const key in this.paymentMethodFormGroup.controls) {
        this.paymentMethodFormGroup.controls[key].clearValidators();
        this.paymentMethodFormGroup.controls[key].updateValueAndValidity();
      }
      this.showPaymentMethodError = false;
      switch(value.provider){
        case 'paynl':
          break;
        case 'mollie':
          this.paymentMethodFormGroup.controls['mollieAPIKey'].setValidators([Validators.required]);
          break;
        case 'stripe':
          this.paymentMethodFormGroup.controls['stripeSecretKey'].setValidators([Validators.required]);
          this.paymentMethodFormGroup.controls['stripeSign'].setValidators([Validators.required]);
          break;
      }
    });
  }

  ngOnInit(): void {
    this.business._id = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.getWebShopSettings();
    this.getPaymentSettings();
  }

  getWebShopSettings() {
    this.showLoader = true;
    this.apiService.getNew('cashregistry', '/api/v1/settings/' + this.business._id,).subscribe((result: any) => {
      this.webShop = result;
      this.showLoader = false;
    }, (error) => {
      this.showLoader = false;
    })
  }

  updateWebShopSettings() {
    this.showLoader = true;
    this.webShop.iBusinessId = this.business._id;
    this.apiService.putNew('cashregistry', '/api/v1/settings/update/' + this.business._id, this.webShop).subscribe((result: any) => {
      this.getWebShopSettings()
      this.showLoader = false;
    }, (error) => {
      this.getWebShopSettings()
      this.showLoader = false;
    })
  }

  AddDeliveryMethod(newShipping: any) {
    if (this.webShop && this.webShop.aShippingOptions) {
      this.webShop.aShippingOptions.push(newShipping);
    } else {
      this.webShop.aShippingOptions = [newShipping];
    }

    this.updateWebShopSettings()
  }

  changeProvider(value: String) { }

  updateSettings(){
    this.extraService.updateExtraServiceDetails();
    if(!this.paymentMethodFormGroup.pristine && this.paymentMethodFormGroup.touched){
      let isForCreate = this.paymentProviderDetails?._id ? false : true;
      this.savePaymentSettings(isForCreate); 
    }
  }

  savePaymentSettings(isForCreate : boolean = true){
    this.showPaymentMethodError = false;
    if(this.paymentMethodFormGroup.invalid){
      this.showPaymentMethodError = true;
      return;
    }
    let data: any = {
      iBusinessId : this.business._id,
      iLocationId : this.iLocationId,
      eName : this.paymentMethodFormGroup.get('provider')?.value,
      oWebshop : {
        bUseForWebshop : this.paymentMethodFormGroup.get('useForWebshop')?.value
      }
    }
    switch(this.paymentMethodFormGroup.get('provider')?.value){
      case 'paynl':
        data.oPayNL = {};
        break;
      case 'mollie':
        data.oMollie = {
          sApiToken: this.paymentMethodFormGroup.get('mollieAPIKey')?.value
        }
        break;
      case 'stripe':
        data.oStripe = {
          sSecret: this.paymentMethodFormGroup.get('stripeSecretKey')?.value,
          sSignature: this.paymentMethodFormGroup.get('stripeSign')?.value
        }
        break; 
    } 
    if(isForCreate){
      if(this.paymentMethodFormGroup.get('useForWebshop')?.value){
        let paymentName = (data.eName[0].toUpperCase() + data.eName[0].slice(1)) + ' Payment';
        this.apiService.postNew('cashregistry', '/api/v1/payment-methods/create', {iBusinessId: this.business._id,bIsDefaultPaymentMethod: true, sName: paymentName}).subscribe(
          (result : any) => {})
      }
      this.apiService.postNew('cashregistry', '/api/v1/payment-service-provider', data).subscribe(
        (result : any) => {})
    } else {
      this.apiService.putNew('cashregistry', `/api/v1/payment-service-provider/${this.paymentProviderDetails._id}`, data).subscribe(
        (result : any) => {})
    }
    
  }

  getPaymentSettings(){
    this.apiService.postNew('cashregistry', '/api/v1/payment-service-provider/list',{iBusinessId : this.business._id, oFilterBy: { iLocationId: this.iLocationId }}).subscribe(
      (result : any) => {
        if(result?.data?.length > 0){
          this.paymentProviderDetails = result.data[0];
          this.paymentMethodFormGroup.controls.provider.setValue(result.data[0].eName);
          this.paymentMethodFormGroup.controls.useForWebshop.setValue(result.data[0].oWebshop.bUseForWebshop);
          switch(result.data[0].eName){
            case 'paynl':
              this.paymentMethodFormGroup.controls.sApiCode.setValue(result.data[0].oPayNL.sApiCode);
              this.paymentMethodFormGroup.controls.sApiToken.setValue(result.data[0].oPayNL.sApiToken);
              this.paymentMethodFormGroup.controls.sServiceId.setValue(result.data[0].oPayNL.sServiceId);
              break;
            case 'mollie':
              this.paymentMethodFormGroup.controls.mollieAPIKey.setValue(result.data[0].oMollie.sApiToken);
              break;
            case 'stripe':
              this.paymentMethodFormGroup.controls.stripeSecretKey.setValue(result.data[0].oStripe.sSecret);
              this.paymentMethodFormGroup.controls.stripeSign.setValue(result.data[0].oStripe.sSignature);
              break;
          }
        }
      },
      (error : any) => {
      }
    )
  }

  filteredDeliveryMethods(){
    return this.deliveryMethods.filter((method : string) => this.webShop.aShippingOptions.findIndex((option : any) => option.type == method) == -1);
  }

  removeShippingOption(option : any){
    let index = this.webShop.aShippingOptions.findIndex((sOption : any) => sOption.type == option.type);
    this.webShop.aShippingOptions.splice(index);
  }
  addShippingOption(){
    let shippingOption = JSON.parse(JSON.stringify(this.newShipping));
    this.webShop.aShippingOptions.push(shippingOption);
    this.newShipping.type = '';
  }
}
