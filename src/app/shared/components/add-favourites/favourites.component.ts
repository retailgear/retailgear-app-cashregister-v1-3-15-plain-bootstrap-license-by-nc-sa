import { Component, HostListener, OnInit, ViewContainerRef } from '@angular/core';
import { DialogComponent } from '../../service/dialog';
import { ApiService } from '../../service/api.service';
import { ToastService } from '../toast';
import { TranslateService } from '@ngx-translate/core';
import { TillService } from '../../service/till.service';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.scss']
})
 
export class AddFavouritesComponent implements OnInit {

  dialogRef: DialogComponent;
  searchKeyword: any;
  oActivityItem:any;
  shopProducts: any;
  mode: string = '';
  newSelectedProduct: any = {
    oType: {
      bRefund: false
    },
    oKeyboardShortcut: {
      sKey1: '',
      sKey2: ''
    }
  };
  
  searching: boolean = false;
  creating: boolean = false;
  customMethod: any = {
    sName: '',
    bStockReduction: false,
    bInvoice: false,
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
  iBusinessId:any = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem('currentLocation');
  currentLanguage = localStorage.getItem('language') || 'en';
  
  button?:any;
  bValid:boolean = false;
  limit: number = 20;
  product: any;

  oShopProductsPaginationConfig: any = {
    id: 'paginate_shop_products',
    itemsPerPage: 4,
    currentPage: 1,
    totalItems: 0
  };

  aTypes: any = [
    { value: false, key: 'REGULAR' },
    { value: true, key: 'RETURN' }
  ];

  aFunctionKeys:any = [
    { title: '' },
    { title: 'Control' },
    { title: 'Alt' },
    { title: 'F1' },
    { title: 'F2' },
    { title: 'F3' },
    { title: 'F4' },
    { title: 'F5' },
    { title: 'F6' },
    { title: 'F7' },
    { title: 'F8' },
    { title: 'F9' },
    { title: 'F10' },
    { title: 'F11' },
    { title: 'F12' },
  ]

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private translateService: TranslateService,
    public tillService: TillService

  ) {
    const _injector = this.viewContainer.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  async ngOnInit(): Promise<void> {

    if(this.mode==='edit') {
      await this.fetchQuickbuttonProduct();
      this.newSelectedProduct.nPrice = this.button?.nPrice || 0;
      this.newSelectedProduct.sName = this.button?.sName || 'No name';
      this.newSelectedProduct._id = this.button?._id;
      this.newSelectedProduct.oType.bRefund = this.button?.oType?.bRefund;
      if (this.button?.oKeyboardShortcut) this.newSelectedProduct.oKeyboardShortcut = this.button?.oKeyboardShortcut;
      this.validate();
    }
  }

  async fetchQuickbuttonProduct(){
    this.product = await this.apiService.getNew('core',  `/api/v1/business/products/${this.button?.iBusinessProductId}?iBusinessId=${this.iBusinessId}`).toPromise();

    if (this.product && this.product.data) {
      this.product = this.product.data;
      this.newSelectedProduct.sNameOriginal = this.product.oName ? this.product.oName[this.currentLanguage] : 'NO NAME';
      this.newSelectedProduct.sArticleNumber = this.product.sArticleNumber;
      this.newSelectedProduct.sNewArticleNumber = this.product.sArticleNumber?.split('*/*')[0];
      this.newSelectedProduct.sProductNumber = this.product.sProductNumber;
      if (this.product?.aLocation?.length) {
        this.product.nPrice = this.product?.aLocation.filter((location: any) => location._id === this.iLocationId)[0]?.nPriceIncludesVat || 0
      }
    }
  }

  async search() {
    if(this.searchKeyword < 3) return;
    this.shopProducts = [];
    let data = {
      iBusinessId: this.iBusinessId,
      limit: 10,
      searchValue: this.searchKeyword,
      aProjection: this.aProjection,
      sortBy: `oName.${this.currentLanguage}`,
      sortOrder: 'asc',
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

  // Function for pagination
  pageChanged(page: any, isFrom: string = 'shopProducts', searchValue: string) {
    if (isFrom == 'shopProducts') {
      this.oShopProductsPaginationConfig.currentPage = page;
      this.search();
    }
  }

  onSelectProduct(product: any, isFrom?: string, isFor?: string) {
    if (this.mode == 'create' || this.mode == 'assign') {
      this.newSelectedProduct._id = product._id;
      this.newSelectedProduct.sName = product.oName ? product.oName[this.currentLanguage] : 'No name';
      this.newSelectedProduct.iBusinessProductId = product._id;
      this.newSelectedProduct.aImage = product.aImage;
      if (product?.aLocation?.length) {
        this.newSelectedProduct.nPrice = product?.aLocation.filter((location: any) => location._id === this.iLocationId)[0]?.nPriceIncludesVat || 0
      }
      this.shopProducts = null;
      this.searchKeyword ='';
      this.validate(); 
    }else{
      this.shopProducts = null;
    }
  }

  assignProduct(){
    this.oActivityItem.iBusinessId = this.iBusinessId;
    this.oActivityItem.sProductName = this.newSelectedProduct.sName;
    this.oActivityItem.aImage = this.newSelectedProduct.aImage
    this.oActivityItem.iBusinessProductId = this.newSelectedProduct.iBusinessProductId
    
    const nPrice = this.newSelectedProduct.nPrice;
    this.oActivityItem.nPriceIncVat = nPrice
    this.oActivityItem.nTotalAmount = nPrice * this.oActivityItem.nQuantity;
    const nDiscountAmount = +((this.oActivityItem.bDiscountOnPercentage ? this.tillService.getPercentOf(nPrice, this.oActivityItem?.nDiscount || 0) : this.oActivityItem.nDiscount).toFixed(2));
    this.oActivityItem.nPaidAmount += (nDiscountAmount * this.oActivityItem.nQuantity);
    
    this.apiService.putNew('cashregistry', '/api/v1/activities/items/' + this.oActivityItem._id, this.oActivityItem)
      .subscribe((result: any) => {
        if(result.message == 'success'){
          this.apiService.activityItemDetails.next(this.oActivityItem);
          this.toastService.show({ type: "success", text: this.translateService.instant('SUCCESSFULLY_UPDATED') });
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

    if(this.newSelectedProduct.oKeyboardShortcut.sKey1.startsWith('F') || this.newSelectedProduct.oKeyboardShortcut.sKey1 == ''){
      this.newSelectedProduct.oKeyboardShortcut.sKey2 = '';
    }

    let data = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oQuickButton: this.newSelectedProduct
    };

    if (!data.iLocationId) {
      this.toastService.show({ type: 'warning', text: this.translateService.instant('PLEASE_SELECT_LOCATION')`Please select a location` });
      return;
    }
    let _result: any, msg:string = '';

    //UPDATE SELLING PRICE AND PURCHASE PRICE IF PRICE OF QUICKBUTTON AND BUSINESS PRODUCT IS DIFFERENT.
    if(this.newSelectedProduct.nPrice != this.product.nPrice){
      
      //Update business product selling price
      let newPriceIncVat = this.product?.aLocation.filter((location: any) => location._id === this.iLocationId)[0]?.nPriceIncludesVat;
      this.product?.aLocation.map((location: any) => {
        if(location._id === this.iLocationId)
        location.nPriceIncludesVat =  Number(this.newSelectedProduct.nPrice);
      }); 
      this.product.sFunctionName = 'update-business-product';
      await this.apiService.putNew('core', `/api/v1/business/products/${this.product._id}?iBusinessId=${this.iBusinessId}`, this.product).toPromise();

      //Update purchase price
      let margin = Number((newPriceIncVat / this.product.nPurchasePrice).toFixed(2));
      let newPurchasePrice = this.newSelectedProduct.nPrice / margin;
     
      if(newPurchasePrice){
        let data = {
          iLocationId: this.iLocationId,
          nPurchasePrice: newPurchasePrice
        }
        await this.apiService.putNew('core', `/api/v1/business/products/purchase-price/${this.product._id}?iBusinessId=${this.iBusinessId}`, data).toPromise();
      }
    }
    
    _result = await this.apiService.putNew('cashregistry', `/api/v1/quick-buttons/${this.newSelectedProduct._id}`, data).toPromise();
    msg = this.translateService.instant('QUICK_BUTTON_UPDATED')
    
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
    // Disable -> no product is selected, name is more than the limit (quick buttons case) or if the length is 0.
    
    /*Create new quick button validation (to create qb, products needs to be created/selected first)*/
    if(this.mode != 'assign' && (!this.newSelectedProduct._id || this.newSelectedProduct.sName.length > this.limit || this.newSelectedProduct.sName.length == 0)){
      console.log(this.newSelectedProduct._id)
      this.bValid = false;
    }else if(this.mode === 'assign' && (!this.newSelectedProduct._id || this.newSelectedProduct.sName.length == 0)){
      /*Assign product to existing AI/A validation*/
      this.bValid = false;
    }else{
      this.bValid = true;
    }
  }

  close(action: boolean) {
    this.dialogRef.close.emit({ action: action })
  }
}
