import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { DialogComponent } from '../../service/dialog';
import { ApiService } from '../../service/api.service';
import { ToastService } from '../toast';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.sass']
})
export class AddFavouritesComponent implements OnInit {

  dialogRef: DialogComponent;
  searchKeyword: any;
  oActivityItem:any;
  shopProducts: any;
  // commonProducts: any;
  business: any = {};
  mode: string = '';
  // isStockSelected = true;
  newSelectedProduct: any = {};
  requestParams: any = {
    iBusinessId: ''
  }
  searching: boolean = false;
  creating: boolean = false;
  customMethod: any = {
    sName: '',
    bStockReduction: false,
    bInvoice: false,
    // bAssignSavingPoints : false,
    bAssignSavingPointsLastPayment: true,
    sLedgerNumber: ''
  }
  aProjection: Array<any> = [
    'oName',
    'sEan',
    'nVatRate',
    'sProductNumber',
    'nPriceIncludesVat',
    'bDiscountOnPercentage',
    'nDiscount',
    'sLabelDescription',
    'aLocation',
    'aImage',
    'aProperty',
    'sArticleNumber',
    'iArticleGroupId',
    'iBusinessPartnerId',
    'iBusinessBrandId',
  ];
  iLocationId: string = '';
  translation:any =[];
  button?:any;
  bValid:boolean = false;
  limit: number = 20;

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private translateService: TranslateService,

  ) {
    const _injector = this.viewContainer.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.business._id = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.translation = this.translateService.instant('SUCCESSFULLY_UPDATED');
      

    if(this.mode==='edit') {
      console.log(this.button)
      this.onSelectProduct(this.button)
    }
  } 

  async search() {

    this.shopProducts = [];
    // this.commonProducts = [];
    // if (searchValue && searchValue.length > 2) {
    //   this.isLoading = true;
    let data = {
      iBusinessId: this.business._id,
      skip: 0,
      limit: 10,
      sortBy: '',
      sortOrder: '',
      searchValue: this.searchKeyword,
      aProjection: this.aProjection,
      oFilterBy: {
        oStatic: {},
        oDynamic: {}
      }
    }
    this.searching = true;
    const shopResult:any = await this.apiService.postNew('core', '/api/v1/business/products/list', data).toPromise();
    if (shopResult && shopResult.data && shopResult.data.length) {
      this.shopProducts = shopResult.data[0].result;
    }
    this.searching = false;
  }
  

  onSelectProduct(product: any, isFrom?: string, isFor?: string) {
    if (this.mode === 'create') {
      this.newSelectedProduct.sName = product.oName ? product.oName['en'] : 'No name';
      this.newSelectedProduct.iBusinessProductId = product._id;
      this.newSelectedProduct.aImage = product.aImage;
      if (product?.aLocation?.length) {
        this.newSelectedProduct.nPrice = product?.aLocation.filter((location: any) => location._id === this.iLocationId)[0]?.nPriceIncludesVat || 0
      }
      this.shopProducts = null;
    } else {
      this.newSelectedProduct.nPrice = product?.nPrice || 0;
      this.newSelectedProduct.sName = product?.sName || 'No name';
      this.newSelectedProduct._id = product?._id;
    }
  }

  assignProduct(){
    this.oActivityItem.iBusinessId = this.business._id;
    this.oActivityItem.sProductName = this.newSelectedProduct.sName;
    this.oActivityItem.nPriceIncVat = this.newSelectedProduct.nPrice
    this.oActivityItem.aImage = this.newSelectedProduct.aImage
    this.oActivityItem.iBusinessProductId = this.newSelectedProduct.iBusinessProductId
    this.apiService.putNew('cashregistry', '/api/v1/activities/items/' + this.oActivityItem._id, this.oActivityItem)
      .subscribe((result: any) => {
        if(result.message == 'success'){
          this.apiService.activityItemDetails.next(this.oActivityItem);
          this.toastService.show({type:"success" , text:this.translation['SUCCESSFULLY_UPDATED']});
          this.close(this.oActivityItem);
        }
        else
        {
          this.toastService.show({type:"warning" , text:result.message});
        }
      }, (error) => {
        console.log('error: ', error);
        this.toastService.show({type:"warning" , text:error.message});
      })


  }

  async create(event: any) {
    event.target.disabled = true;
    this.creating = true;

    let data = {
      iBusinessId: this.business._id,
      iLocationId: localStorage.getItem('currentLocation'),
      oQuickButton: this.newSelectedProduct
    };

    if (!data.iLocationId) {
      this.toastService.show({ type: 'warning', text: this.translateService.instant('PLEASE_SELECT_LOCATION')`Please select a location` });
      return;
    }
    let _result: any, msg:string = '';
    if (this.mode === 'create') {
      _result = await this.apiService.postNew('cashregistry', '/api/v1/quick-buttons/create', data).toPromise();
      msg = this.translateService.instant('NEW_QUICK_BUTTON_ADDED')
    } else {
      _result = await this.apiService.putNew('cashregistry', `/api/v1/quick-buttons/${this.newSelectedProduct._id}`, data).toPromise();
      msg = this.translateService.instant('QUICK_BUTTON_UPDATED')
    }
    event.target.disabled = false;
    this.creating = false;

    if (_result.message == 'success') {
      this.close(true);
      this.toastService.show({ type: 'success', text: msg }); //`New Quick Button added successfully`
    } else {
      this.toastService.show({ type: 'success', text: this.translateService.instant('AN_ERROR_OCCURED') });
    }
  }

  validate() {
    if(this.newSelectedProduct.sName.length > this.limit) 
      this.bValid = false;
    else this.bValid = true;
  }

  close(action: boolean) {
    this.dialogRef.close.emit({ action: action })
  }
}
