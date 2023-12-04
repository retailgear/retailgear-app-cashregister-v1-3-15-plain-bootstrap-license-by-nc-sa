import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus, faArrowDown, faArrowUp, faUpload, faPhone, faAt } from '@fortawesome/free-solid-svg-icons';

import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { SelectArticleDialogComponent } from '../../shared/components/select-articlegroup-dialog/select-articlegroup-dialog.component';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { CreateArticleGroupService } from '../../shared/service/create-article-groups.service';
import { DialogService } from '../../shared/service/dialog';
import { PriceService } from '../../shared/service/price.service';
import { TillService } from '../../shared/service/till.service';
import { DiscountDialogComponent } from '../dialogs/discount-dialog/discount-dialog.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-order]',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OrderComponent implements OnInit {
  @Input() item: any
  @Input() taxes: any
  @Input() bSerialSearchMode: any
  @Output() itemChanged = new EventEmitter<any>();
  @Input() oStaticData: any;

  faTimes = faTimes
  faPlus = faPlus
  faMinus = faMinus
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;
  faUpload = faUpload;
  faPhone = faPhone;
  faAt = faAt;
  typeArray = [
    { key: 'regular', value: false, title: 'REGULAR' },
    { key: 'return', value: true, title: 'RETURN' }
  ];
  propertyOptions: Array<any> = [];
  selectedProperties: Array<any> = [];
  articleGroupDetails: any = {
    iBusinessId: "",
    sCategory: "",
    sSubCategory: "",
    oName: {},
    bShowInOverview: false,
    bShowOnWebsite: false,
    bInventory: false,
    aProperty: []
  };
  brand: any = null;
  brandsList: Array<any> = [];
  filteredBrands: Array<any> = [];
  supplier: any;
  supplierOptions: Array<any> = [];
  suppliersList: Array<any> = [];
  showDeleteBtn: boolean = false;
  aProperty: any = [];
  collapsedBtn: Boolean = false;

  contactType: 'phone' | 'email' | 'whatsapp' | '' = ''
  bShowServicePartnerRemark = false;
  bShowColleagueRemark = false;
  sServicePartnerRemark = '';
  sCommentVisibleServicePartner = '';
  sColleagueRemark = '';
  sCommentVisibleColleague = '';

  @Input() disablePrepayment: any;
  @Input() availableAmount: any;
  @Input() settings:any;
  @Output() articleGroupDataChanged = new EventEmitter<any>();
  language: any = localStorage.getItem('language');
  articleGroupsList : any = [];
  constructor(
    private priceService: PriceService,
    private apiService: ApiService,
    private createArticleGroupService: CreateArticleGroupService,
    private toastrService: ToastService,
    public tillService: TillService,
    private dialogService: DialogService) {
    // if (!this.oStaticData?.articleGroupsList?.length) {
    //   this.oStaticData = {
    //     articleGroupsList: []
    //   }
    // }
  }

 async ngOnInit() {
   this.oStaticData.articleGroupsList.forEach((el: any, index: any) => {
     el.sArticleGroupName = (el?.oName) ? el?.oName[this.language] || el?.oName['en'] || '' : '';
   })
    this.checkArticleGroups();
    this.getProperties();
    this.listSuppliers();
    this.getBusinessBrands();
    if (this.item.new && this.item.isFor !== 'shopProducts') {
      this.selectArticleGroup();
      // this.item.new = false;
    }
    let data = {
     // iBusinessPartnerId:this.item.iBusinessPartnerId,
      iBusinessId: localStorage.getItem('currentBusiness'),
    };

    if(!this.oStaticData?.articleGroupsList.length){
      const result: any = await this.getAllArticleGroupList(data);
      if(result.data?.length && result.data[0]?.result?.length){
        this.oStaticData.articleGroupsList = result.data[0].result;
        this.oStaticData.articleGroupsList.forEach((el: any, index: any) => {
          el.sArticleGroupName = (el?.oName) ? el?.oName[this.language] || el?.oName['en'] || '' : '';
        })
      }
    }

    // if (this.settings?.bAutoIncrementBagNumbers) {
    //   this.item.sBagNumber =  (this.settings?.sPrefix || '') + (this.settings?.nLastBagNumber + 1).toString();
    // }
  }

  async getAllArticleGroupList(data: any) {
    return this.apiService.postNew('core', '/api/v1/business/article-group/list', data).toPromise();
  }

  selectArticleGroup() {
    if (this.settings?.bAutoIncrementBagNumbers && this.settings?.bPrefillBagNumbers) {
      this.item.sBagNumber =  (this.settings?.sPrefix || '') + (this.settings?.nLastBagNumber + 1).toString();
    }
    this.dialogService.openModal(SelectArticleDialogComponent,
      {
        cssClass: 'modal-m',
        context: { item: this.item, from: 'order', articleGroupsList:  this.oStaticData.articleGroupsList },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe((data) => {
        if (data.action) {
          const { articlegroup, brand, supplier, nMargin } = data;
          this.item.supplier = supplier.sName;
          this.item.iBusinessPartnerId = supplier._id;
          this.item.sBusinessPartnerName = supplier.sName;
          this.item.iArticleGroupId = articlegroup._id;
          this.item.iArticleGroupOriginalId = articlegroup._id;
          this.item.oArticleGroupMetaData.oNameOriginal = articlegroup.oName;
          this.item.oArticleGroupMetaData.sCategory = articlegroup?.sCategory;
          this.item.nMargin = nMargin;
          this.supplier = supplier.sName;
          this.item.iSupplierId = supplier._id;
          this.brand = brand.sName;
          this.item.iBusinessBrandId = brand._id;
          this.updateProperties(articlegroup);
          this.changeInMargin();
          this.settingsChanged();
        } else {
          this.deleteItem();
        }

        this.oStaticData = {
          articleGroupsList: data.articlegroup,
          brandsList: data.brandsList,
          partnersList: data.partnersList
        }
        this.articleGroupDataChanged.emit(this.oStaticData);
      });
  }
  notAllowedCommaAndSemiColon(event: any) {
    let keyCode = (event.which) ? event.which : event.keyCode
    if (keyCode == 59 || keyCode == 44) return false; /* 44=comma & 59= semicolon */
    else return true;
  }

  numericOnly(event:any): boolean {
    let patt = /[0-9\,\.\ ]/;
    let result = patt.test(event.key);
    let itemprice = this.item?.price.toString();
    itemprice = itemprice.includes(",");
    if(itemprice==true && event.keyCode==44){
      result = false;
    }
    return result;
  }

  settingsChanged(){
    if (this.settings?.bAutoIncrementBagNumbers && this.item.sBagNumber != '' && this.settings?.bPrefillBagNumbers) {
      this.item.sBagNumber = this.item.sBagNumber ? this.item.sBagNumber : (this.settings?.sPrefix || '') + (this.settings?.nLastBagNumber + 1).toString();
    }
    this.itemChanged.emit({type:'settingsChanged', data: this.item.sBagNumber});
  }

  changeInMargin() {
    this.item.nPurchasePrice = this.item.price / this.item.nMargin || 1;
  }

  changeInPurchasePrice() {
    this.item.nMargin = this.item.price / this.item.nPurchasePrice || 1;
  }

  updateProperties(articlegroup: any) {
    this.item.oArticleGroupMetaData.aProperty = articlegroup.aProperty;
    articlegroup.aProperty.forEach((properties: any) => {
      const propertiesIndex = this.item.oArticleGroupMetaData.aProperty.findIndex((aProperty: any) => aProperty.iPropertyId === properties.iPropertyId);
      if (propertiesIndex > -1) {
        const prop = this.propertyOptions[properties.iPropertyId]?.find((prop: any) => prop.sCode === properties.sCode);
        if (prop) {
          this.item.oArticleGroupMetaData.aProperty[propertiesIndex] = prop;
          this.selectedProperties[properties.iPropertyId] = properties.sCode;
        }
      };
    });
  }

  deleteItem(): void {
    this.itemChanged.emit({type: 'delete'})
  }
  getDiscount(item: any): string {
    return this.priceService.getDiscount(item.nDiscount)
  }

  getColorCode(item: any): string {
    const { eTransactionItemType } = item;
    if (item.tType === 'refund') {
      return '#f7422e';
    }
    switch (eTransactionItemType) {
      case 'regular':
        return '#4ab69c';
      case 'broken':
        return '#f0e959';
      case 'return':
        return '#f7422e';
      default:
        return '#4ab69c';
    }
  }

  assignArticleGroupMetadata(articlegroup: any) {
    this.item.iArticleGroupId = articlegroup._id;
    this.item.oArticleGroupMetaData.oName = articlegroup.oName;
    this.item.oArticleGroupMetaData.sCategory = articlegroup.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = articlegroup.sSubCategory;
  }

  async createArticleGroup() {
    const articleBody = { name: 'Ordered products', sCategory: 'Ordered products', sSubCategory: 'Ordered products' };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.assignArticleGroupMetadata(result.data);
  }

  constisEqualsJson(obj1: any, obj2: any) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    return keys1.length === keys2.length && Object.keys(obj1).every(key => obj1[key] == obj2[key]);
  }

  getProperties() {
    this.selectedProperties = [];
    let data = {
      skip: 0,
      limit: 500,
      sortBy: '',
      sortOrder: '',
      searchValue: '',
      oFilterBy: {},
      iBusinessId: localStorage.getItem('currentBusiness'),
    };

    const aProperty: any = [];
    this.apiService.postNew('core', '/api/v1/properties/list', data).subscribe(
      (result: any) => {
        if (result.data && result.data.length > 0) {
          result.data[0].result.map((property: any) => {
            if (typeof (this.propertyOptions[property._id]) == 'undefined') {
              this.propertyOptions[property._id] = [];
              property.aOptions.map((option: any) => {
                if (option?.sCode?.trim() != '') {
                  let opt: any = {
                    iPropertyId: property._id,
                    iPropertyOptionId: option?._id,
                    sPropertyOptionName: option?.sKey,
                    sPropertyName: property.sName,
                    oProperty: {
                    },
                    sCode: option.sCode,
                    sName: option.sKey,
                  };
                  opt.oProperty[option.sKey] = option.value;
                  this.propertyOptions[property._id].push(opt);
                  const proprtyIndex = aProperty.findIndex((prop: any) => prop.iPropertyId == property._id);
                  if (proprtyIndex === -1) {
                    aProperty.push(opt);
                  }
                }
              });
            }
          });
          aProperty.forEach((prop: any) => {
            const check = this.item.oArticleGroupMetaData.aProperty.find((o: any) => o.iPropertyId === prop.iPropertyId);
            if (!check) {
              this.item.oArticleGroupMetaData.aProperty.push(prop);
            }
          });
          const data = this.item.oArticleGroupMetaData.aProperty.filter(
            (set => (a: any) => true === set.has(a.iPropertyId))(new Set(aProperty.map((b: any) => b.iPropertyId)))
          );

          data.forEach((element: any) => {
            const toReplace = this.propertyOptions[element.iPropertyId].find((o: any) => this.constisEqualsJson(o.oProperty, element.oProperty));
            if (toReplace) {
              element = toReplace;
              this.selectedProperties[toReplace.iPropertyId] = toReplace.sCode;
            }
          });
          this.item.oArticleGroupMetaData.aProperty = data;
        }
      }
    );
  }

  openImageModal() {
    this.dialogService.openModal(ImageUploadComponent, { cssClass: "modal-m", context: { mode: 'create' } })
      .instance.close.subscribe(result => {
        if (result.url)
          this.item.aImage.push(result.url);
      });
  }
  // Function for search suppliers
  searchSuppliers(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.supplierOptions = this.suppliersList.filter((supplier: any) => {
        return supplier.sName && supplier.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    } else {
      this.supplierOptions = [];
    }
  }

  listSuppliers() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    let url = '/api/v1/business/partners/supplierList';
    this.apiService.postNew('core', url, oBody).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        const response = result.data[0];
        this.suppliersList = response.result;
        if (this.item.iSupplierId) {
          const tempsupp = this.suppliersList.find(o => o._id === this.item.iSupplierId);
          this.supplier = tempsupp?.sName;
          this.item.sBusinessPartnerName = tempsupp?.sName;
        }
      }
    }, (error) => {
    });
  }

  getBusinessBrands() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    this.apiService.postNew('core', '/api/v1/business/brands/list', oBody).subscribe((result: any) => {
      if (result.data && result.data.length > 0) {
        this.brandsList = result.data[0].result;
        if (this.item.iBusinessBrandId) {
          const tempsupp = this.brandsList.find(o => o._id === this.item.iBusinessBrandId);
          this.brand = tempsupp.sName;
        }
      }
    })
  }

  // Function for search suppliers
  searchBrands(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredBrands = this.brandsList.filter((brands: any) => {
        return brands.sName && brands.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    } else {
      this.filteredBrands = [];
    }
  }
  checkArticleGroups() {
    if (this.item.iArticleGroupId) {
      return;
    }
    this.createArticleGroupService.checkArticleGroups('order').subscribe((res: any) => {
      if (res?.data?._id) this.assignArticleGroupMetadata(res.data);
    });
  }

  // Function for set dynamic property option
  setPropertyOption(property: any, index: number) {
    if (this.propertyOptions[property.iPropertyId]?.length > 0) {
      let option = this.propertyOptions[property.iPropertyId].filter((opt: any) => opt.sCode == this.selectedProperties[property.iPropertyId]);
      if (option?.length > 0) {
        this.item.oArticleGroupMetaData.aProperty[index] = option[0];
      }
    }
  }

  changeInbrokenAmount(item: any) {
    if (item.nBrokenProduct < 0) {
      item.nBrokenProduct = 0;
    }
    if (item.quantity < item.nBrokenProduct) {
      item.nBrokenProduct = item.quantity;
    }
  }

  openDiscountDialog(): void {
    this.dialogService.openModal(DiscountDialogComponent, { context: { item: JSON.parse(JSON.stringify(this.item)) } })
      .instance.close.subscribe((data) => {
        if (data.item) {
          this.item.nDiscount = data.item.nDiscount;
          this.item.bDiscountOnPercentage = data.item?.discount?.percent || false;
          // this.getTotalDiscount(data.item)
          this.itemChanged.emit({type: 'item', data: this.item});
        }
      })
  }

  getTotalDiscount(item: any): string {
    return this.priceService.getDiscountValue(item);
  }

  getTotalPrice(item: any): string {
    return this.priceService.getArticlePrice(item)
  }

  openImage(imageIndex:any){
    const url =this.item.aImage[imageIndex];
    window.open(url , "_blank");
  }

  removeImage(index: number): void {
    this.item.aImage.splice(index, 1);
  }

  updatePayments(price?:any) {
    if(price) this.item.price = price;
    this.itemChanged.emit({type: 'item', data: this.item});
  }

  changePrePayment(item:any){
    if (item.paymentAmount < 0 && item.paymentAmount > item.nTotal) item.oType.bPrepayment = true;
    else if (item.paymentAmount >= 0 && item.nTotal > item.paymentAmount) item.oType.bPrepayment = true;
    else if (item.paymentAmount >= 0 && item.nTotal == item.paymentAmount) item.oType.bPrepayment = false;
    else if (item.nTotal > 0 && item.paymentAmount < 0) throw ('strange transaction A');
    else if (item.nTotal <= 0 && item.paymentAmount > 0) throw ('strange transaction B');

    if (item.paymentAmount > this.availableAmount) {
      this.toastrService.show({ type: 'warning', text: `Can't assign more than available money!` });
      item.paymentAmount = 0;
      // return;
    }

    item.manualUpdate = true;
    item.prepaymentTouched = true;
    this.itemChanged.emit({type: 'prepaymentChange'});
  }
}
