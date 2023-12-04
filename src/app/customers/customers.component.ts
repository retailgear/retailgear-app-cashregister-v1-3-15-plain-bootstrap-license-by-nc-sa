import { Component, OnInit, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { DialogService } from '../shared/service/dialog';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../shared/service/api.service';
import { PaginatePipe } from 'ngx-pagination';
import { CustomerDetailsComponent } from '../shared/components/customer-details/customer-details.component';
import { CustomerStructureService } from '../shared/service/customer-structure.service';
import { ToastService } from '../shared/components/toast';
import {ExportsComponent} from '../shared/components/exports/exports.component';
import { MenuComponent } from '../shared/_layout/components/common';
import { CustomerDialogComponent } from '../shared/components/customer-dialog/customer-dialog.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { faLongArrowAltDown, faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  animations: [trigger('openClose', [
    state('open', style({
      height: '*',
      opacity: 1,
    })),
    state('closed', style({
      height: '0',
      opacity: 0
    })),
    transition('open => closed', [
      animate('300ms')
    ]),
    transition('closed => open', [
      animate('300ms')
    ]),
  ])
  ]
})
export class CustomersComponent implements OnInit {

  customer: any = null;
  separator:string = ',';
  faSearch = faSearch;
  bIsShowDeletedCustomer: boolean = false;
  updated_customer: any = null;
  business: any = {}
  customers: Array<any> = [];  //make it empty later
  showLoader: boolean = false;
  settings:any;
  getSettingsSubscription !: Subscription;
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  customColumn = 'NAME';
  defaultColumns = ['PHONE', 'EMAIL', 'SHIPPING_ADDRESS', 'INVOICE_ADDRESS'];
  allColumns = [...this.defaultColumns];  
  customerMenu = [
    { key: 'MERGE' },
    { key: 'DELETE' }
  ];
  options = [
    { key: 'SHOW_DELETED_CUSTOMERS' },
    { key: 'EXPORT' }
  ];
  requestParams: any = {
    iBusinessId: "",
    skip: 0,
    limit: 10,
    sortBy: '_id',
    sortOrder: 'desc',
    searchValue: '',
    aProjection: ['sSalutation', 'sFirstName', 'sPrefix', 'sLastName', 'dDateOfBirth', 'dDateOfBirth', 'nClientId', 'sGender', 'bIsEmailVerified',
      'bCounter', 'sEmail', 'oPhone', 'oShippingAddress', 'oInvoiceAddress', 'iBusinessId', 'sComment', 'bNewsletter', 'sCompanyName', 'oPoints',
      'sCompanyName', 'oIdentity', 'sVatNumber', 'sCocNumber', 'nPaymentTermDays',
      'nDiscount', 'bWhatsApp', 'nMatchingCode', 'sNote', 'iEmployeeId', 'bIsMigrated', 'bIsMerged', 'eStatus', 'bIsImported', 'aGroups', 'bIsCompany', 'oContactPerson','sImage'],
    oFilterBy: {
      aSearchField: [],
      aSelectedGroups: []
    },
    customerType: 'all'
  };
  iChosenCustomerId : any;
  aInputHint:Array<any> = [""];
  bIsComaRemoved: boolean = false;
  bIsProperSearching: boolean = true;
  
  @ViewChildren('inputElement') inputElement!: QueryList<ElementRef>;
  showFilters = false;

  aFilterFields: Array<any> = [
    { key: 'FIRSTNAME', value: 'sFirstName' },
    { key: 'INSERT', value: 'sPrefix' },
    { key: 'LASTNAME', value: 'sLastName' },
    { key: 'PHONE', value: 'sMobile' },
    { key: 'POSTAL_CODE', value: 'sPostalCode' },
    { key: 'HOUSE_NUMBER', value: 'sHouseNumber' },
    { key: 'STREET', value: 'sStreet' },
    { key: 'COMPANY_NAME', value: 'sCompanyName' },
    { key: 'NCLIENTID', value: 'nClientId'}
  ];
  customerTypes:any=[
   { key:'ALL', value:'all'},
    {key:'PRIVATE' , value:'private'},
    {key:'COMPANY' , value:'company'}
  ]
  translations:any;
  aPlaceHolder: Array<any> = ["Search"];
  fNameString :any = "FIRSTNAME";
  LNameString :any = "LASTNAME";
  PrefixString:any = "INSERT";
  PhoneString:any ="PHONE";
  CNameString :any = "COMPANY_NAME";
  nCNameString :any = "NCLIENTID";
  StreetString :any = "STREET";
  PCodeString :any = "POSTAL_CODE";
  HNumberString :any = "HOUSE_NUMBER";
  showAdvanceSearch: boolean = false;
  faArrowUp = faLongArrowAltUp;
  faArrowDown = faLongArrowAltDown;
  tableHeaders: Array<any> = [
    { key: 'NAME',  disabled: true },
    { key: 'PHONE', disabled: true },
    { key: 'EMAIL', disabled: true },
    { key: 'SHIPPING_ADDRESS', selected: false, sort: '' },
    { key: 'INVOICE_ADDRESS', selected: false, sort: '' },
    {key:'ACTION' , disabled:true }
  ]
  customerGroupList :any=[];

  bNormalOrder: boolean = true;
  sBusinessCountry: string = '';
  businessDetails:any={};

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private paginationPipe: PaginatePipe,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private customerStructureService: CustomerStructureService
  ) {
  }

  async ngOnInit() {
    this.apiService.setToastService(this.toastService);
    this.business._id = localStorage.getItem("currentBusiness");
    this.requestParams.iBusinessId = this.business._id;
    this.getSettings();
    const translations = ['SUCCESSFULLY_ADDED', 'SUCCESSFULLY_UPDATED', 'SUCCESSFULLY_DELETED', 'LOYALITY_POINTS_ADDED', 'LOYALITY_POINTS_NOT_ADDED', 'REDUCING_MORE_THAN_AVAILABLE', 'ARE_YOU_SURE_TO_DELETE_THIS_CUSTOMER', 'ONLY_LETTERS_ARE_ALLOWED', 'CUSTOMER_NOT_CREATED', 'LASTNAME_REQUIRED']
    this.translateService.get(translations).subscribe(
      result => this.translations = result
    )
    this.translateService.onTranslationChange.subscribe((result:any) => {
    this.translateService.get(this.aPlaceHolder).subscribe((result:any) => {
      this.aPlaceHolder.forEach((el:any, index:any) => {
        this.aPlaceHolder[index] = result[el];
      })
     });
    })
    this.getCustomers();
    this.getBusinessSettings();
    this.getCustomerGroups();
    this.getBusinessDetails();
  }

  getBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + localStorage.getItem('currentBusiness')).subscribe((response: any) => {
      const currentLocation = localStorage.getItem('currentLocation');
      if (response?.data) this.businessDetails = response.data;
      if (this.businessDetails?.aLocation?.length) {
        const locationIndex = this.businessDetails.aLocation.findIndex((location: any) => location._id == currentLocation);

        if (locationIndex != -1) {
          const currentLocationDetail = this.businessDetails?.aLocation[locationIndex];

          /*Needed to change fields order*/
          this.sBusinessCountry = currentLocationDetail?.oAddress?.countryCode;
          //console.log(this.sBusinessCountry);
          if(this.sBusinessCountry == 'UK' || this.sBusinessCountry == 'GB'|| this.sBusinessCountry == 'FR'){
            this.bNormalOrder = false;
          }
        }
      }
    });
  }


  getSettings() {
    this.getSettingsSubscription = this.apiService.getNew('customer', `/api/v1/customer/settings/get/${this.requestParams.iBusinessId}`).subscribe((result: any) => {
      this.settings = result;
      if (this.settings?.aCustomerSearch) {
        this.requestParams.oFilterBy.aSearchField = this.settings?.aCustomerSearch;
        this.showAdvanceSearch = this.requestParams.oFilterBy.aSearchField.length > 0 ? true : false;
      }
      this.setPlaceHolder();
    }, (error) => {
      console.log(error);
    })
  }

  getCustomerGroups(){
    this.apiService.postNew('customer', '/api/v1/group/list', { iBusinessId: this.requestParams.iBusinessId, iLocationId: localStorage.getItem('currentLocation') }).subscribe((res: any) => {
      if (res?.data?.length) {
        this.customerGroupList = res?.data[0]?.result;
      }
    }, (error) => {})
  }

  // Function for reset selected filters
  resetFilters() {
    this.aPlaceHolder = ["SEARCH"];
    this.requestParams.searchValue = '';
    this.requestParams = {
      iBusinessId: this.business._id,
      skip: 0,
      limit: 10,
      sortBy: '_id',
      sortOrder: 'desc',
      searchValue: '',
      aProjection: ['sSalutation', 'sFirstName', 'sPrefix', 'sLastName', 'dDateOfBirth', 'dDateOfBirth', 'nClientId', 'sGender', 'bIsEmailVerified',
        'bCounter', 'sEmail', 'oPhone', 'oShippingAddress', 'oInvoiceAddress', 'iBusinessId', 'sComment', 'bNewsletter', 'sCompanyName', 'oPoints',
        'sCompanyName', 'oIdentity', 'sVatNumber', 'sCocNumber', 'nPaymentTermDays',
        'nDiscount', 'bWhatsApp', 'nMatchingCode', 'sNote', 'iEmployeeId', 'bIsMigrated', 'bIsMerged', 'eStatus', 'bIsImported', 'aGroups', 'bIsCompany', 'oContactPerson'],
      oFilterBy: {
        aSearchField: [],
        aSelectedGroups: []
      },
      customerType: 'all'
    };
    this.getCustomers();
    this.getSettings();
  }

  removeItemAll(arr: any, value: any) {
    var i = 0;
    while (i < arr.length) {
      if (arr[i] === value) {
        arr.splice(i, 1);
      } else {
        ++i;
      }
    }
    return arr;
  }
  
  //  Function for set sort option on customer table
  setSortOption(sortHeader: any) {
    console.log(sortHeader.sort)
    if (sortHeader.selected) {
      sortHeader.sort = sortHeader.sort == 'asc' ? 'desc' : 'asc';
      this.sortAndLoadCustomers(sortHeader)
    } else {
      this.tableHeaders = this.tableHeaders.map((th: any) => {
        if (sortHeader.key == th.key) {
          th.selected = true;
          th.sort = 'asc';
        } else {
          th.selected = false;
        }
        return th;
      })
      this.sortAndLoadCustomers(sortHeader)
    }
  }
  sortAndLoadCustomers(sortHeader: any) {
    let sortBy = 'dCreatedDate';
    if (sortHeader.key == 'SHIPPING_ADDRESS') sortBy = 'oShippingAddress.sStreet';
    if (sortHeader.key == 'INVOICE_ADDRESS') sortBy = 'oInvoiceAddress.sStreet';
    
    this.requestParams.sortBy = sortBy;
    this.requestParams.sortOrder = sortHeader.sort;
    this.getCustomers();
  }
  setPlaceHolder() {
    if (this.requestParams.oFilterBy.aSearchField.length != 0) {
      let pIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sPostalCode");
      let sIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sStreet");
      let hIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sHouseNumber");
      let fIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sFirstName");
      let prIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sPrefix");
      let lIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sLastName");
      let mIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sMobile");
      let cIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sCompanyName");
      let nIndex = this.requestParams.oFilterBy.aSearchField.indexOf("nClientId");
      
      if (pIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.PCodeString));
        this.removeItemAll(this.aInputHint, "0000AB");
      } else {
        this.aPlaceHolder[pIndex] = this.translateService.instant(this.PCodeString);
        this.aInputHint[pIndex] = "0000AB";
      }

      if (sIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.StreetString));
        this.removeItemAll(this.aInputHint, "Mainstreet");
      } else {
        this.aPlaceHolder[sIndex] = this.translateService.instant(this.StreetString);
        this.aInputHint[sIndex] = "Mainstreet";
      }

      if (hIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.HNumberString));
        this.removeItemAll(this.aInputHint, "123A");
      } else {
        this.aPlaceHolder[hIndex] = this.translateService.instant(this.HNumberString);
        this.aInputHint[hIndex] = "123A";
      }
      if (fIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.fNameString));
        this.removeItemAll(this.aInputHint, "John");
      } else {
        this.aPlaceHolder[fIndex] = this.translateService.instant(this.fNameString);
        this.aInputHint[fIndex] = "John";
      }
      if (prIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.PrefixString));
        this.removeItemAll(this.aInputHint, "Van");
      } else {
        this.aPlaceHolder[prIndex] = this.translateService.instant(this.PrefixString);
        this.aInputHint[prIndex] = "Van";
      }
      if (lIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.LNameString));
        this.removeItemAll(this.aInputHint, "Doe");
      } else {
        this.aPlaceHolder[lIndex] = this.translateService.instant(this.LNameString);
        this.aInputHint[lIndex] = "Doe";
      }
      if (mIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.PhoneString));
        this.removeItemAll(this.aInputHint, "1234567890");
      } else {
        this.aPlaceHolder[mIndex] = this.translateService.instant(this.PhoneString);
        this.aInputHint[mIndex] = "1234567890";
      }
      if (cIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.CNameString));
        this.removeItemAll(this.aInputHint, "Modern Company");
      } else {
        this.aPlaceHolder[cIndex] = this.translateService.instant(this.CNameString);
        this.aInputHint[cIndex] = "Modern Company";
      }
      if (nIndex == -1) {
        this.aPlaceHolder = this.removeItemAll(this.aPlaceHolder, this.translateService.instant(this.nCNameString));
        this.removeItemAll(this.aInputHint, "000000");
      } else {
        this.aPlaceHolder[nIndex] = this.translateService.instant(this.nCNameString);
        this.aInputHint[cIndex] = "Modern Company";
      }
    } else {
      this.aPlaceHolder = ["Search"];
    }
    this.aPlaceHolder = this.removeDuplicates(this.aPlaceHolder);
    this.aInputHint = this.removeDuplicates(this.aInputHint);
    this.showSearchWarningText();
  }

  removeDuplicates(arr: any) {
    return arr.filter((item: any, index: any) => arr.indexOf(item) === index);
  }

  /* show warnign if user is not searching as shown */
  showSearchWarningText() {
    this.bIsProperSearching = true;
    const aSearchValueArray = this.requestParams.searchValue.split(',').map((el: any) => el.trim()).filter((elem: any) => elem != '');
    if (aSearchValueArray?.length && aSearchValueArray?.length !== this.requestParams.oFilterBy?.aSearchField?.length) {
      this.bIsProperSearching = false;
    }
  }

  /* converting space into comma */
  customerEventHandler(event: any) {
    if (event.keyCode === 32) {
      if (!this.bIsComaRemoved && this.requestParams.oFilterBy.aSearchField?.length > 1) this.requestParams.searchValue = this.requestParams.searchValue.replace(/.$/, ",");
      this.bIsComaRemoved = false;
    } else if (event.keyCode === 8) {
      if (!this.requestParams.searchValue) this.bIsComaRemoved = false;
      else this.bIsComaRemoved = true;
    }
    this.showSearchWarningText();
  }

  /* Function to detect typed string and automatically prefill fields, if fields are not prefilled. */
  stringDetection() {
    this.aPlaceHolder = ["search"];
    const aSearchValueArray = this.requestParams.searchValue.split(',').map((el: any) => el.trim()).filter((elem: any) => elem != '');

     /* Prefill if no option is selected */
    if (aSearchValueArray.length == 1 && aSearchValueArray[0].match(/\d+/g)) {
      //console.log('This', aSearchValueArray[0], 'and', aSearchValueArray[0].match(/\d+/g)[0].length);

      /* Prefill with house number */
      if(aSearchValueArray[0].match(/\d+/g)[0].length <= 3 && !this.requestParams.oFilterBy.aSearchField.includes('sHouseNumber')){
        //console.log('it is a house number!');
        this.requestParams.oFilterBy.aSearchField.splice(0,0,'sHouseNumber');
        this.requestParams.oFilterBy.aSearchField = this.removeDuplicates(this.requestParams.oFilterBy.aSearchField);
        let pIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sHouseNumber");
        this.aInputHint[pIndex] = "123A";
        this.aInputHint = this.removeDuplicates(this.aInputHint);

      /* Prefill with postal code */
      }else if (aSearchValueArray[0].match(/\d+/g)[0].length >= 4 &&  !this.requestParams.oFilterBy.aSearchField.includes('sPostalCode')) {
        /*If string contains number & >= 4 -> then add sPostalCode in selected field */
        //console.log('It is a postal code!',  this.requestParams.oFilterBy.aSearchField.length)
        this.requestParams.oFilterBy.aSearchField.splice(0,0,'sPostalCode');
        this.requestParams.oFilterBy.aSearchField = this.removeDuplicates(this.requestParams.oFilterBy.aSearchField);
        let pIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sPostalCode");
        this.aInputHint[pIndex] = "0000AB";
        this.aInputHint = this.removeDuplicates(this.aInputHint);
      }
    } else if(aSearchValueArray.length > 1 && aSearchValueArray[0].length >= 3){
      //console.log('Else', aSearchValueArray[0], 'and', aSearchValueArray.length);
    }
  }

  // Function for handle event of transaction menu
  clickMenuOpt(key: string, customer:any) {
    switch (key) {
      case "MERGE":
        this.openCustomerDialog(customer,customer?._id,null,key);
        break;
      case "DELETE":
        this.deleteCustomer(customer);
        break;
    }
  }

  deleteCustomer(customer: any) {
    let confirmBtnDetails = [
      { text: "CANCEL", value: 'close', class: 'btn btn-warning me-2' },
      { text: "YES", value: 'remove', status: 'success', class: 'btn btn-success' }
    ];
    this.dialogService.openModal(ConfirmationDialogComponent, { context: { header: 'DELETE', bodyText: this.translations[`ARE_YOU_SURE_TO_DELETE_THIS_CUSTOMER`], buttonDetails: confirmBtnDetails } })
      .instance.close.subscribe(
        (status: any) => {
          if (status == 'remove') {
            this.apiService.postNew('customer', '/api/v1/customer/delete', { iCustomerId: customer._id, iBusinessId: this.requestParams.iBusinessId }).subscribe((res: any) => {
              if (res?.message == 'success') {
                this.getCustomers();
                this.toastService.show({ type: 'success', text: this.translations[`SUCCESSFULLY_DELETED`] })
              } else {
                this.toastService.show({ type: 'warning', text: 'Internal Server Error' });
              }
            })

          }
        })
  }

  openCustomerDialog(customer: any, Id: any, iSearchedCustomerId: any, key: any): void {
    this.dialogService.openModal(CustomerDialogComponent, {
      cssClass: 'modal-xl',
      context: {
        allcustomer: this.customers,
        customer: customer,
        iChosenCustomerId: Id,
        iSearchedCustomerId: null,
        key: "MERGE"
      },
      hasBackdrop: true
    }).instance.close.subscribe((data: any) => {})
  }

  createCustomer() {
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass: "modal-xl", context: { mode: 'create' }, hasBackdrop: true }).instance.close.subscribe(result => {
      if (result && result.action && result.action == true) this.getCustomers()
    });
  }


  resetThePagination() {
    this.requestParams.skip = 0;
    this.paginationConfig.currentPage = 1; 
    this.requestParams.limit = parseInt(this.paginationConfig.itemsPerPage);
  }
  
  // Function for update item's per page
  changeItemsPerPage() {
    this.resetThePagination();
    this.getCustomers();
  }

  // Function for handle page change
  pageChanged(selctedPage: any) {
    this.requestParams.skip = (selctedPage - 1) * parseInt(this.paginationConfig.itemsPerPage);
    this.paginationConfig.currentPage = selctedPage;
    this.getCustomers(true);
  }


  getCustomers(isPageChanged?: boolean) {
    this.showLoader = true;
    if (this.requestParams.searchValue && !isPageChanged) this.resetThePagination();
    this.customers = [];
    this.apiService.postNew('customer', '/api/v1/customer/list', this.requestParams)
      .subscribe(async (result: any) => {
        this.showLoader = false;
        if (result?.data?.[0]?.result) {
          this.paginationConfig.totalItems = result.data[0].count.totalData;
          this.customers = result.data[0].result;
          for (const customer of this.customers) {
            customer.isDisable = false;
            customer.isUpdated = false;
            customer.isMerged = false;
            if (customer?.bIsCompany) {
              customer.name = customer.sCompanyName;
              customer['NAME'] = customer.sCompanyName;
            } else {
              customer.name = this.customerStructureService.makeCustomerName(customer);
              customer['NAME'] = this.customerStructureService.makeCustomerName(customer);
            }

            customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
            customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
            customer['EMAIL'] = customer.sEmail;
            customer['PHONE'] = (customer.oPhone.sLandLine && customer.oPhone.sPrefixLandline ? customer.oPhone.sPrefixLandline : '') + (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone.sMobile && customer.oPhone.sPrefixMobile ? customer.oPhone.sPrefixMobile : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '');
          }
          setTimeout(() => {
            MenuComponent.bootstrap();
            // MenuComponent.reinitialization();
          }, 200);
        }
      },
        (error: any) => {
          this.customers = [];
          this.showLoader = false;
        })
  }

  // Function for return data to render on tree grid view
  loadPageTableData() {
    let result = this.paginationPipe.transform(this.customers, this.paginationConfig);
  }

  async getBusinessSettings() {
    const result: any = await this.apiService.getNew('core', `/api/v1/business/setting/${this.requestParams.iBusinessId}`).toPromise();
    if (result && result?.data?.eExportCSVOption) {
      if(result.data.eExportCSVOption == "comma-and-dot-as-price-decimal")this.separator = ',';
      else this.separator = ';';
    }
  }
 
  export() {
    const headerList = [
      { name: 'SALUTATION', key: "sSalutation", value: 'Salutation', isSelected: true , width:'10%' },
      { name: 'FIRST_NAME', key: "sFirstName", value: 'First name', isSelected: true , width:'10%' },
      { name: 'INSERT', key: "sPrefix", value: 'Prefix', isSelected: true , width:'10%' },
      { name: 'LAST_NAME', key: "sLastName", value: 'Last name', isSelected: true , width:'10%' },
      { name: 'DATE_OF_BIRTH', key: "dDateOfBirth", value: 'Date of birth', isSelected: true , width:'10%' },
      { name: 'GENDER', key: "sGender", value: 'Gender', isSelected: true , width:'10%' },
      { name: 'EMAIL', key: "sEmail", value: 'Email', isSelected: true , width:'10%' },
      { name: 'PHONE_LANDLINE', key: "oPhone.sLandLine", value: 'Landline', isSelected: true , width:'10%' },
      { name: 'PHONE_MOBILE', key: 'oPhone.sMobile', value: 'Mobile', isSelected: true , width:'10%' },
      { name: 'SHIPPING_ADDRESS', key: 'oShippingAddress', value: 'ShippingAddress', isSelected: true , width:'10%' },
      { name: 'INVOICE_ADDRESS', key: 'oInvoiceAddress', value: 'InvoiceAddress', isSelected: true , width:'10%' },
      { name: 'COMPANY_NAME', key: "sCompanyName", value: 'Company name', isSelected: true , width:'10%' },
      { name: 'VAT_NUMBER', key: "sVatNumber", value: 'Vat number', isSelected: true , width:'10%' },
      { name: 'COC_NUMBER', key: "sCocNumber", value: 'Coc number', isSelected: true , width:'10%' },
      { name: 'PAYMENT_TERM_IN_DAYS', key: "nPaymentTermDays", value: 'Payment term days', isSelected: true , width:'10%' },
      { name: 'MATCHING_CODE', key: "nMatchingCode", value: 'Matching code', isSelected: true , width:'10%' },
      { name: 'NCLIENTID', key: "nClientId", value: 'Client id', isSelected: true , width:'10%' },
      { name: 'NOTES', key: "sNote", value: 'Note', isSelected: true , width:'10%' },
      { name: 'POINTS', key: "oPoints", value: 'Points', isSelected: true , width:'10%' },
      { name: 'RECEIVE_NEWSLETTER', key: "bNewsletter", value: 'Newsletter', isSelected: true , width:'10%' }
    ];
    this.dialogService.openModal(ExportsComponent, { cssClass: "modal-lg", context: { requestParams: this.requestParams, customerHeaderList: headerList, separator: this.separator } }).instance.close.subscribe(result => {})
  }

  openCustomer(customer: any) {
    this.dialogService.openModal(CustomerDetailsComponent, {
      cssClass: "modal-xl position-fixed start-0 end-0",
      context: {
        customerData: customer,
        mode: 'details',
        from: 'customer'
      },
      hasBackdrop:true
    }).instance.close.subscribe(result => { if (result && result.action && result.action == true) this.getCustomers(); });
  }

  
  
}
