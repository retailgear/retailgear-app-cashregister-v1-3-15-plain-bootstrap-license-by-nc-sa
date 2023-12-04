import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus, faUpload, faArrowDown, faArrowUp, faPhone, faAt } from "@fortawesome/free-solid-svg-icons";
import { SelectArticleDialogComponent } from 'src/app/shared/components/select-articlegroup-dialog/select-articlegroup-dialog.component';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { CreateArticleGroupService } from 'src/app/shared/service/create-article-groups.service';
import { DialogService } from 'src/app/shared/service/dialog';
import { PriceService } from 'src/app/shared/service/price.service';
import { TillService } from 'src/app/shared/service/till.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';

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
  oRepairer: any = {
    sName: '',
    _id: ''
  };
  // temporary variable
  supplier: any;
  sIsEstimatedDate: 'PriceAgreed' | 'Quotation' = 'PriceAgreed'
  contactType: 'phone' | 'email' | 'whatsapp' | '' = ''
  bShowServicePartnerRemark = false
  @ViewChild('descriptionRef') descriptionRef!: ElementRef
  constructor(private priceService: PriceService,
    private apiService: ApiService,
    private dialogService: DialogService,
    private toastrService: ToastService,
    public tillService: TillService,
    private createArticleGroupService: CreateArticleGroupService) { }

  ngOnInit(): void {
    this.listSuppliers();
    this.listEmployees();
    this.getBusinessBrands();
    this.checkArticleGroups();
    this.getProperties();
    // this.listSuppliers();
    // this.getBusinessBrands();
    if (this.item.new) {
      this.selectArticleGroup();
      this.item.new = false;
    }
    this.processProperty();
  }

  selectArticleGroup() {
    this.dialogService.openModal(SelectArticleDialogComponent, { cssClass: 'modal-m', context: { from: 'repair' } })
      .instance.close.subscribe((data) => {
        if (data) {
          if (this.descriptionRef) {
            this.descriptionRef.nativeElement.focus();
          }
          const { articlegroup, brand, supplier, nMargin } = data;
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
        }
        else {
          this.deleteItem();
        }
      });
  }

  changeInMargin() {
    this.item.nPurchasePrice = this.item.price / (this.item.nMargin || 1);
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

  updatePayments(): void {
    this.itemChanged.emit('update');
  }
  deleteItem(): void {
    this.itemChanged.emit('delete')
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

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('Repair')
      .subscribe((res: any) => {
        if (1 > res.data.length) {
          this.createArticleGroup();
        } else {
          this.assignArticleGroupMetadata(res.data[0].result[0]);
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async createArticleGroup() {
    const articleBody = { name: 'Repair', sCategory: 'Repair', sSubCategory: 'Repair' };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.assignArticleGroupMetadata(result.data);
  }

  constisEqualsJson(obj1: any, obj2: any) {
    // const keys1 = Object.keys(obj1);
    // const keys2 = Object.keys(obj2);
    // return keys1.length === keys2.length && Object.keys(obj1).every(key => obj1[key] == obj2[key]);
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
                  const proprtyIndex = this.aProperty.findIndex((prop: any) => prop.iPropertyId == property._id);
                  if (proprtyIndex === -1) {
                    this.aProperty.push(opt);
                  }
                }
              });
            }
          });

          if (this.item.oArticleGroupMetaData.aProperty.length === 0) {
            this.item.oArticleGroupMetaData.aProperty = this.aProperty
          };
          const data = this.item.oArticleGroupMetaData.aProperty.filter(
            (set => (a: any) => true === set.has(a.iPropertyId))(new Set(this.aProperty.map((b: any) => b.iPropertyId)))
          );

          data.forEach((element: any) => {
            const toReplace = this.propertyOptions[element.iPropertyId].find((o: any) => o.sPropertyOptionName === element.sPropertyOptionName);
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

  // Function for search suppliers
  searchSuppliers(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.supplierOptions = this.suppliersList.filter((supplier: any) => {
        return supplier.sName && supplier.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  // Function for search suppliers
  searchEmployees(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredEmployees = this.employeesList.filter((employee: any) => {
        return employee.sName && employee.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  selectAssignee(oRepairer: any, item:any) {
    this.filteredEmployees = [];
    this.oRepairer = {
      sName: oRepairer?.sName,
      iAssigneeId: oRepairer?._id
    }
    let oUser: any = localStorage.getItem('currentEmployee') || localStorage.getItem('currentUser') || null;
    if (oUser) oUser = JSON.parse(oUser);
    this.item.iEmployeeId = oUser?.userId || null;
    this.item.iAssigneeId = oRepairer?._id;
    this.itemChanged.emit(this.item);
  }

  // Function for search suppliers
  searchBrands(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredBrands = this.brandsList.filter((brands: any) => {
        return brands.sName && brands.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
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

  /* setting a property if item already having the property */
  processProperty() {
    if (this.item?.oArticleGroupMetaData?.aProperty?.length) {
      const aProperty = this.item.oArticleGroupMetaData.aProperty;
      for (const oProperty of aProperty) {
        this.selectedProperties[oProperty.iPropertyId] = oProperty.sCode
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

  removeImage(index: number): void {
    this.item.aImage.splice(index, 1);
  }

  changeTotalAmount() {
    this.item.paymentAmount = -1 * this.item.quantity * this.item.price;
  }
}
