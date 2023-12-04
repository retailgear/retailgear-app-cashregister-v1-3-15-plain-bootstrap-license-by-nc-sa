import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { faArrowDown, faArrowUp, faAt, faMinus, faPhone, faPlus, faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { SelectArticleDialogComponent } from '../../shared/components/select-articlegroup-dialog/select-articlegroup-dialog.component';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { DialogService } from '../../shared/service/dialog';
import { PriceService } from '../../shared/service/price.service';
import { TillService } from '../../shared/service/till.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { DiscountDialogComponent } from '../dialogs/discount-dialog/discount-dialog.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-repair]',
  templateUrl: './repair.component.html',
  styleUrls: ['./repair.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class RepairComponent implements OnInit {
  @Input() item: any
  @Input() taxes: any
  @Output() itemChanged = new EventEmitter<any>();

  faTimes = faTimes;
  faPlus = faPlus;
  faMinus = faMinus;
  faUpload = faUpload;
  faPhone = faPhone;
  faAt = faAt;
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;
  employee: any = null;
  brand: any = null;
  supplierOptions: Array<any> = [];
  suppliersList: Array<any> = [];
  filteredEmployees: Array<any> = [];
  employeesList: Array<any> = [];
  filteredBrands: Array<any> = [];
  brandsList: Array<any> = [];
  typeArray = ['regular', 'broken', 'return'];
  propertyOptions: Array<any> = [];
  selectedProperties: Array<any> = [];
  aProperty: any = [];
  showDeleteBtn: boolean = false;
  collapsedBtn: Boolean = false;
  repairer: any = null;
  iBusinessId: any = localStorage.getItem('currentBusiness');
  oRepairer: any = {
    sName: '',
    _id: ''
  };
  // temporary variable
  supplier: any;
  sIsEstimatedDate: 'PriceAgreed' | 'Quotation' = 'PriceAgreed'
  contactType: 'phone' | 'email' | 'whatsapp' | '' = ''
  bShowServicePartnerRemark = false;
  bShowColleagueRemark = false;
  sServicePartnerRemark = '';
  sCommentVisibleServicePartner = '';
  sColleagueRemark = '';
  sCommentVisibleColleague = '';

  @ViewChild('descriptionRef') descriptionRef!: ElementRef
  @Input() disablePrepayment:any;
  @Input() availableAmount:any;
  @Output() articleGroupDataChanged = new EventEmitter<any>();
  @Input() oStaticData:any;
  @Input() settings:any;
  language:any = localStorage.getItem('language');

  constructor(private priceService: PriceService,
    private apiService: ApiService,
    private dialogService: DialogService,
    private toastrService: ToastService,
    public tillService: TillService) {

  }

  async ngOnInit() {
    this.oStaticData?.articleGroupsList?.forEach((el: any) => {
      el.sArticleGroupName = (el?.oName) ? el?.oName[this.language] || el?.oName['en'] || '' : '';
    })
    this.listSuppliers();
    this.listEmployees();
    this.getBusinessBrands();
    this.getProperties();
    if (this.item.new) {
      this.selectArticleGroup();
    }

    if(!this.oStaticData?.articleGroupsList?.length){
      const data = { iBusinessId: this.iBusinessId };
      const result: any = await this.getAllArticleGroupList(data);
      if(result.data?.length && result.data[0]?.result?.length){
        this.oStaticData.articleGroupsList = result.data[0].result;
        this.oStaticData.articleGroupsList.forEach((el: any) => {
          el.sArticleGroupName = (el?.oName) ? el?.oName[this.language] || el?.oName['en'] || '' : '';
        })
      }
    }
  }

  async getAllArticleGroupList(data: any) {
    return this.apiService.postNew('core', '/api/v1/business/article-group/list', data).toPromise();
  }

  /* setting a property if item already having the property */
  processProperty() {
    if (this.item?.oArticleGroupMetaData?.aProperty?.length) {
      const aProperty = this.item.oArticleGroupMetaData.aProperty;
      for (const oProperty of aProperty) {
        this.selectedProperties[oProperty.iPropertyId] = [oProperty.sPropertyOptionName];
      }
    }
  }
  getProperties() {
    this.selectedProperties = [];
    const data = {
      iBusinessId: this.iBusinessId,
    };

    this.apiService.postNew('core', '/api/v1/properties/list', data).subscribe((result: any) => {
        if (result?.data?.length && result?.data[0]?.result?.length) {
          result.data[0].result.forEach((property: any) => {
            if (!this.propertyOptions[property._id]) {
              this.propertyOptions[property._id] = [];
              property.aOptions.forEach((option: any) => {
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
                    selected:true
                  };
                  opt.oProperty[option.sKey] = option.value;
                  this.propertyOptions[property._id].push(opt);
                  const proprty = this.aProperty.find((prop: any) => prop.iPropertyId == property._id);
                  if (proprty) {
                    this.aProperty.push(opt);
                  }
                }
              });
            }
          });

          if (!this.item.oArticleGroupMetaData.aProperty?.length) {
            this.item.oArticleGroupMetaData.aProperty = this.aProperty
          };
          const data = this.item.oArticleGroupMetaData.aProperty.filter(
            (set => (a: any) => true === set.has(a.iPropertyId))(new Set(this.aProperty.map((b: any) => b.iPropertyId)))
          );

          data.forEach((element: any) => {
            const toReplace = this.propertyOptions[element.iPropertyId].find((o: any) => o.sPropertyOptionName === element.sPropertyOptionName);

            if (!toReplace) {
              element.selected = false;
            }else{
              element = toReplace;
              this.selectedProperties[toReplace.iPropertyId] = toReplace.sCode;
            }
          });
          this.item.oArticleGroupMetaData.aProperty = data;
          this.processProperty();
        }
      }
    );
  }

  selectArticleGroup() {
    if (this.settings?.bAutoIncrementBagNumbers && this.settings?.bPrefillBagNumbers) {
      this.item.sBagNumber =  (this.settings?.sPrefix || '') + (this.settings?.nLastBagNumber + 1).toString();
    }
    this.dialogService.openModal(SelectArticleDialogComponent,
      {
        cssClass: 'modal-m',
        context: {
          from: 'repair',
          iBusinessBrandId: this.item.iBusinessBrandId,
          articleGroupsList: this.oStaticData?.articleGroupsList || [],
          brandsList: this.oStaticData?.brandsList || [],
          partnersList: this.oStaticData?.partnersList || [],
        },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe((data) => {
        if (data.action) {
          if (this.descriptionRef) {
            this.descriptionRef.nativeElement.focus();
          }
          const { articlegroup, brand, supplier, nMargin } = data;
          this.assignArticleGroupMetadata(articlegroup);
          this.item.supplier = supplier.sName;
          this.supplier = supplier.sName;
          this.item.iSupplierId = supplier._id;
          this.item.iBusinessPartnerId = supplier._id;
          this.item.sBusinessPartnerName = supplier.sName;
          this.item.nMargin = nMargin;
          this.brand = brand.sName;
          this.item.iBusinessBrandId = brand._id;
          this.updateProperties(articlegroup);
          this.changeInMargin();
          this.settingsChanged();
        }
        else {
          this.deleteItem();
        }

        this.oStaticData = {
          articleGroupsList: data.articleGroupsList,
          brandsList: data.brandsList,
          partnersList: data.partnersList
        }
        this.articleGroupDataChanged.emit(this.oStaticData)
      });
  }

  settingsChanged(){
    if (this.settings?.bAutoIncrementBagNumbers && this.item.sBagNumber != '' && this.settings?.bPrefillBagNumbers) {
      this.item.sBagNumber = this.item.sBagNumber ? this.item.sBagNumber : (this.settings?.sPrefix || '') + (this.settings?.nLastBagNumber + 1).toString();
    }
    this.itemChanged.emit({type:'settingsChanged', data: this.item.sBagNumber});
  }
  
  changeInMargin() {
    const nPrice:number = +(String(this.item.price).replace(',','.'));
    this.item.nPurchasePrice = nPrice / (this.item.nMargin || 1);
  }

  changeInPurchasePrice() {
    this.item.nMargin = this.item.price / this.item.nPurchasePrice || 1;
  }

  updateProperties(articlegroup: any) {
    this.item.oArticleGroupMetaData.aProperty = articlegroup.aProperty;
    this.item.oArticleGroupMetaData.sCategory = articlegroup.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = articlegroup.sSubCategory;
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

  updatePayments(price?:any) {
    if(price) this.item.price = price;
    this.itemChanged.emit({type: 'item', data: this.item});
  }

  changePrePayment(item: any) {
    if (item.paymentAmount == 0 || (item.paymentAmount < 0 && item.paymentAmount > item.nTotal)) item.oType.bPrepayment = true;
    else if (item.paymentAmount > 0 && item.nTotal > item.paymentAmount) item.oType.bPrepayment = true;
    else if (item.paymentAmount > 0 && item.nTotal == item.paymentAmount) item.oType.bPrepayment = false;
    else if (item.nTotal > 0 && item.paymentAmount < 0) throw ('strange transaction A');
    else if (item.nTotal <= 0 && item.paymentAmount > 0) throw ('strange transaction B');

    if (item.paymentAmount > this.availableAmount) {
      this.toastrService.show({ type: 'warning', text: `Can't assign more than available money!` });
      item.paymentAmount = 0;
      // return;
    }

    item.manualUpdate = true;
    item.prepaymentTouched = true;
    this.itemChanged.emit({type:'prepaymentChange', data:null});
  }

  deleteItem() {
    this.itemChanged.emit({type:'delete'})
  }

  notAllowedCommaAndSemiColon(event: any) {
    let keyCode = (event.which) ? event.which : event.keyCode
    if (keyCode == 59 || keyCode == 44) return false; /* 44=comma & 59= semicolon */
    else return true;
  }

  numericOnly(event:any): boolean {
    let patt = /[0-9\,\.\ ]/;
    let result = patt.test(event.key);
    var itemprice = this.item?.price.toString();
    itemprice = itemprice.includes(",");
    if(itemprice==true && event.keyCode==44){
      result = false;
    }
    return result;
  }

  listEmployees() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    let url = '/api/v1/employee/list';
    this.apiService.postNew('auth', url, oBody).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.employeesList = result.data[0].result;
        this.employeesList.map(o => o.sName = `${o.sFirstName} ${o.sLastName}`);
        if (this.item.iEmployeeId) {
          const tempsupp = this.employeesList.find(o => o._id === this.item.iSupplierId);
          if (tempsupp && tempsupp?.sName){
            this.employee = tempsupp.sName;
          }
        }
      }
    }, (error) => {
    });
  }

  assignArticleGroupMetadata(articlegroup: any) {
    this.item.iArticleGroupId = articlegroup._id;
    this.item.iArticleGroupOriginalId = articlegroup._id;
    this.item.oArticleGroupMetaData.oNameOriginal = articlegroup.oName;
    this.item.oArticleGroupMetaData.oName = articlegroup.oName;
    this.item.oArticleGroupMetaData.sCategory = articlegroup.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = articlegroup.sSubCategory;
  }

  // checkArticleGroups() {
  //   this.createArticleGroupService.checkArticleGroups('repair')
  //     .subscribe((res: any) => {
  //       if (1 > res.data.length) {
  //         this.createArticleGroup();
  //       } else {
  //         this.assignArticleGroupMetadata(res.data[0].result[0]);
  //       }
  //     }, err => {
  //       this.toastrService.show({ type: 'danger', text: err.message });
  //     });
  // }

  // async createArticleGroup() {
  //   const articleBody = { name: 'Repair', sCategory: 'Repair', sSubCategory: 'Repair' };
  //   const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
  //   this.assignArticleGroupMetadata(result.data);
  // }

  constisEqualsJson(obj1: any, obj2: any) {
    return obj1===obj2;
  }

  listSuppliers() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    let url = '/api/v1/business/partners/supplierList';
    this.apiService.postNew('core', url, oBody).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.suppliersList = result.data[0].result;
        if (this.item.iSupplierId) {
          const tempsupp = this.suppliersList.find(o => o._id === this.item.iSupplierId);
          this.supplier = tempsupp.sName;
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
  searchSuppliers(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.supplierOptions = this.suppliersList.filter((supplier: any) => {
        return supplier.sName && supplier.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    } else {
      this.supplierOptions = [];
    }
  }

  // Function for search suppliers
  searchEmployees(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredEmployees = this.employeesList.filter((employee: any) => {
        return employee.sName && employee.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    } else {
      this.filteredEmployees = [];
    }
  }

  selectAssignee(oRepairer: any, item:any) {
    this.filteredEmployees = [];
    this.oRepairer = {
      sName: oRepairer?.sName,
      iAssigneeId: oRepairer?._id
    }
    let oUser: any = localStorage.getItem('currentUser') || null;
    if (oUser) oUser = JSON.parse(oUser);
    this.item.iEmployeeId = oUser?.userId || null;
    this.item.iAssigneeId = oRepairer?._id;
    this.itemChanged.emit({type:'item', data: this.item});
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

  // Function for set dynamic property option
  setPropertyOption(property: any, index: number) {
    if (this.propertyOptions[property.iPropertyId]?.length > 0) {
      let option = this.propertyOptions[property.iPropertyId].filter((opt: any) => opt.sCode == this.selectedProperties[property.iPropertyId]);
      if (option?.length > 0) {
        this.item.oArticleGroupMetaData.aProperty[index] = option[0];
      }
    }
  }

  openImageModal() {
    this.dialogService.openModal(ImageUploadComponent, { cssClass: "modal-m", context: { mode: 'create' } })
      .instance.close.subscribe(result => {
        if (result.url)
          this.item.aImage.push(result.url);
      });
  }

  clearRepair(): void {
    this.repairer = null;
  }

  getTotalPrice(item: any): void {
    return this.priceService.calculateItemPrice(item)
  }

  openDiscountDialog(): void {
    this.dialogService.openModal(DiscountDialogComponent,
      {
        context: { item: JSON.parse(JSON.stringify(this.item)) },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe((data) => {
        if (data.item) {
          this.item.nDiscount = data.item.nDiscount;
          this.item.bDiscountOnPercentage = data.item?.discount?.percent || false;
          // this.getTotalDiscount(data.item)
          this.itemChanged.emit({type: 'item', data: this.item});
        }
      })
  }

  openImage(imageIndex:any){
    const url =this.item.aImage[imageIndex];
    window.open(url , "_blank");
  }
  removeImage(index: number): void {
    this.item.aImage.splice(index, 1);
  }

  changeTotalAmount() {
    this.item.paymentAmount = -1 * this.item.quantity * this.item.price;
  }
}
