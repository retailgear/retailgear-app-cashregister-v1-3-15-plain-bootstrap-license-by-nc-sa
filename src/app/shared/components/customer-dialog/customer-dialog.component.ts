import { Component, ElementRef, Input, OnInit, QueryList, ViewChildren, ViewContainerRef } from '@angular/core';
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../service/api.service';
import { DialogComponent, DialogService } from "../../service/dialog";
import { CustomerDetailsComponent } from '../customer-details/customer-details.component';
import { CustomerAddressDialogComponent } from '../customer-address-dialog/customer-address-dialog.component';
import { ToastService } from '../toast';
import { PaginatePipe } from 'ngx-pagination';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CustomerStructureService } from '../../../shared/service/customer-structure.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-dialog',
  templateUrl: './customer-dialog.component.html',
  styleUrls: ['./customer-dialog.component.scss'],
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
export class CustomerDialogComponent implements OnInit {
  @Input() customer: any;
  dialogRef: DialogComponent

  faTimes = faTimes
  faSearch = faSearch
  loading = false
  showLoader = false;
  customers: Array<any> = [];
  allcustomer: Array<any> = [];
  settings:any;
  getSettingsSubscription !: Subscription;
  business: any = {}
  customColumn = 'NAME';
  defaultColumns = [ 'PHONE', 'EMAIL', 'SHIPPING_ADDRESS', 'INVOICE_ADDRESS'];
  allColumns = [ this.customColumn, ...this.defaultColumns ];
  isCustomerSearched:Boolean = false;
  requestParams: any = {
    searchValue: '',
    skip:0 , 
    limit:10,
    oFilterBy: {
      aSearchField: [],
      aSelectedGroups: []
    },
    customerType: 'all'
  }
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  fakeCustomer: any = {
    number: '45663',
    counter: false,
    name: 'Christy van Woudenberg',
    email: 'CristyvanWoudenberg@armyspy.com',
    address: {
      street: 'Slatuinenweg',
      number: 24,
      zip: '1057 KB',
      city: 'Amsterdam'
    }
  }
  fakeCustomers = [] = [
    {
      number: '45663',
      counter: false,
      name: 'Christy van Woudenberg',
      email: 'CristyvanWoudenberg@armyspy.com',
      address: {
        street: 'Slatuinenweg',
        number: 24,
        zip: '1057 KB',
        city: 'Amsterdam'
      }
    },
    {
      number: '99647',
      counter: false,
      name: 'Irem Botman',
      email: 'IremBotman@teleworm.us',
      address: {
        street: 'Van der Leeuwlaan',
        number: 39,
        zip: '3119 LP',
        city: 'Schiedam'
      }
    },
    {
      number: '666543',
      counter: false,
      name: 'Chaline Kruisselbrink',
      email: 'ChalineKruisselbrink@dayrep.com',
      address: {
        street: 'Hogenhof',
        number: 1,
        zip: '3861 CG',
        city: 'Nijkerk'
      }
    },
    {
      number: '55147',
      counter: false,
      name: 'Jovan Abbink',
      email: 'JovanAbbink@teleworm.us',
      address: {
        street: 'Turfsteker',
        number: 94,
        zip: '8447 DB',
        city: 'Heerenveen'
      }
    },
    {
      number: '33654',
      counter: false,
      name: 'Richano van der Zijden',
      email: 'RichanovanderZijden@teleworm.us',
      address: {
        street: 'Veilingweg',
        number: 192,
        zip: '4731 CW',
        city: 'Oudenbosch'
      }
    }
  ]
  key:any;
  iChosenCustomerId : any;
  iSearchedCustomerId : any;
  // aFilterFields:any = [
  //   { title: 'PSOTAL_CODE', key: 'sPostalCode'},
  //   { title: 'HOUSE_NUMBER', key: 'sHouseNumber'},
  // ]

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
  
  showFilters = false;
  from:any;
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
  aInputHint:Array<any> = [""];
  bIsComaRemoved: boolean = false;
  bIsProperSearching: boolean = true;
  showAdvanceSearch: boolean = false;
  customerGroupList :any=[];

  customerTypes:any=[
    { key:'ALL', value:'all'},
     {key:'PRIVATE' , value:'private'},
     {key:'COMPANY' , value:'company'}
   ]

  bNormalOrder: boolean = true;
  sBusinessCountry: string = '';
  businessDetails:any={};
 
  @ViewChildren('inputElement') inputElement!: QueryList<ElementRef>;

  constructor(
    private viewContainer: ViewContainerRef,
    private paginationPipe: PaginatePipe,
    private dialogService: DialogService,
    private apiService: ApiService,
    private translateService: TranslateService,
    private customerStructureService: CustomerStructureService,
    private toastService: ToastService) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngAfterViewInit(): void {
    this.inputElement.first.nativeElement.focus();
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.business._id = localStorage.getItem("currentBusiness");
    this.requestParams.iBusinessId = this.business._id;
    this.getSettings();
    this.translateService.onTranslationChange.subscribe((result:any) => {
      this.translateService.get(this.aPlaceHolder).subscribe((result:any) => {
        this.aPlaceHolder.forEach((el:any, index:any) => {
          this.aPlaceHolder[index] = result[el];
        })
       });
     })
    this.allcustomer = this.dialogRef?.context?.allcustomer;
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
      sortOrder: -1,
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
    this.customers = [];
    this.isCustomerSearched = false;
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


   /* Function to detect typed string and automatically prefill fields, if fields are not prefilled. */
  stringDetection() {
    this.aPlaceHolder = ["search"];
    this.requestParams.searchValue = this.requestParams.searchValue;
    if (this.requestParams.oFilterBy.aSearchField.length == 0 && this.requestParams.searchValue.length >= 3) {
      if (this.requestParams.searchValue.length >= 4) {
        /*If string contains number & >= 4 -> then add sPostalCode in selected field */
        if (/\d/.test(this.requestParams.searchValue)) {
          /*TODO: fill the selection with sPostalCode, the following code is is not showing the selected element on frontend*/
          this.requestParams.oFilterBy.aSearchField.unshift('sPostalCode');
          this.requestParams.oFilterBy.aSearchField = this.removeDuplicates(this.requestParams.oFilterBy.aSearchField);
          let pIndex = this.requestParams.oFilterBy.aSearchField.indexOf("sPostalCode");
          this.aInputHint[pIndex] = "0000AB";
          this.aInputHint = this.removeDuplicates(this.aInputHint);

        }
      } 
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

  makeCustomerName = async (customer: any) => {
    if (!customer) {
      return '';
    }
    let result = '';
    if (customer.sSalutation) {
      await this.translateService.get(customer.sSalutation.toUpperCase()).subscribe( (res) => {
        result += res + ' ';
      });
    }
    if (customer.sFirstName) {
      result += customer.sFirstName + ' ';
    }
    if (customer.sPrefix) {
      result += customer.sPrefix + ' ';
    }

    if (customer.sLastName) {
      result += customer.sLastName;
    }

    return result;
  }

  formatZip(zipcode: string) {
    if (!zipcode) {
      return '';
    }
    return zipcode.replace(/([0-9]{4})([a-z]{2})/gi, (original, group1, group2) => {
      return group1 + ' ' + group2.toUpperCase();
    });
  }

  // makeCustomerAddress(address: any, includeCountry: boolean) {
  //   if (!address) {
  //     return '';
  //   }
  //   let result = '';
  //   if (address.sStreet) {
  //     result += address.sStreet + ' ';
  //   }
  //   if (address.sHouseNumber) {
  //     result += address.sHouseNumber + (address.sHouseNumberSuffix ? '' : ' ');
  //   }
  //   if (address.sHouseNumberSuffix) {
  //     result += address.sHouseNumberSuffix + ' ';
  //   }
  //   if (address.sPostalCode) {
  //     result += this.formatZip(address.sPostalCode) + ' ';
  //   }
  //   if (address.sCity) {
  //     result += address.sCity;
  //   }
  //   if (includeCountry && address.sCountry) {
  //     result += address.sCountry;
  //   }
  //   return result;
  // }

  getCustomers() {
    if (this.requestParams?.searchValue?.length < 3) return; // && !condition1
    this.showLoader = true;
    this.customers = [];
    this.isCustomerSearched = false;
    this.apiService.postNew('customer', '/api/v1/customer/list', this.requestParams)
      .subscribe(async (result: any) => {
        this.showLoader = false;
        this.isCustomerSearched = true;
          if (result && result.data && result.data[0] && result.data[0].result) {
            
            if(this.key == "MERGE"){
              this.customers = result.data[0].result.filter((customer: any) => customer?._id.toString() != this.iChosenCustomerId.toString());
              }else{
              this.customers = result.data[0].result;
             }


            this.paginationConfig.totalItems = result.data[0].count.totalData;        
            for(const customer of this.customers){
              if(customer?.bIsCompany){
                customer['NAME'] = customer.sCompanyName;
              }else{
                customer['NAME'] = this.customerStructureService.makeCustomerName(customer);
              }
              customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
              customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
              customer['EMAIL'] = customer.sEmail;
              customer['PHONE'] = (customer.oPhone.sLandLine && customer.oPhone.sPrefixLandline ? customer.oPhone.sPrefixLandline : '') + (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone.sMobile && customer.oPhone.sPrefixMobile ? customer.oPhone.sPrefixMobile : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '');
            }

          }
      },
      (error : any) =>{
        this.customers = [];
        this.showLoader = false;
      })
  }

  getMergeCustomers() {
    if (this.requestParams?.searchValue?.length < 3) return;
    this.showLoader = true;
    this.customers = [];
    this.isCustomerSearched = false;
    this.apiService.postNew('customer', '/api/v1/customer/mergecustomer/list', this.requestParams)
      .subscribe(async (result: any) => {
        this.showLoader = false;
        this.isCustomerSearched = true;
        this.requestParams = {
          searchValue: ''
        }
          if (result && result.data && result.data[0] && result.data[0].result) {
            this.customers = result.data[0].result;
            
            for(const customer of this.customers){
              customer['NAME'] = await this.makeCustomerName(customer);
              customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
              customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
              customer['EMAIL'] = customer.sEmail;
              //customer['STATUS'] = customer.bIsConnected;
              customer['PHONE'] = (customer.oPhone.sLandLine && customer.oPhone.sPrefixLandline ? customer.oPhone.sPrefixLandline : '') + (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone.sMobile && customer.oPhone.sPrefixMobile ? customer.oPhone.sPrefixMobile : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '');
            }
          }
      },
      (error : any) =>{
        this.customers = [];
        this.showLoader = false;
      })
  }
  
  AddCustomer(){
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass:"modal-xl", context: { mode: 'create' } }).instance.close.subscribe(async (result) =>{ 
      let customer =  result.customer;
      customer['NAME'] =  await this.makeCustomerName(customer);
      customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
      customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
      customer['EMAIL'] = customer.sEmail;
      customer['PHONE'] = (customer.oPhone.sLandLine && customer.oPhone.sPrefixLandline ? customer.oPhone.sPrefixLandline : '') + (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone.sMobile && customer.oPhone.sPrefixMobile ? customer.oPhone.sPrefixMobile : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '');
      this.close({action: true, customer: customer });
    });
  }

  editCustomer(customer: any){
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass:"modal-xl", context: { mode: 'details', customerData: customer, editProfile: false } }).instance.close.subscribe(result =>{
       this.getCustomers()
    });
  }

  changeItemsPerPage(pageCount: any) {
    this.paginationConfig.itemsPerPage = pageCount;
    this.getCustomers();
  }

  // Function for trigger event after page changes
  pageChanged(page: any) {
    this.requestParams.skip = (page - 1) * parseInt(this.paginationConfig.itemsPerPage);
    this.getCustomers();
    this.paginationConfig.currentPage = page;
  }

  /* show warnign if user is not searching as shown */
  showSearchWarningText() {
    this.bIsProperSearching = true;
    const aSearchValueArray = this.requestParams.searchValue.split(',').map((el: any) => el.trim()).filter((elem: any) => elem != '');
    if (aSearchValueArray?.length && aSearchValueArray?.length !== this.requestParams.oFilterBy?.aSearchField?.length) {
      this.bIsProperSearching = false;
    }
  }
  

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  randNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min +1) + min);
  }

  async setCustomer(customer: any) {

    if(this.key == "MERGE"){

      this.dialogService.openModal(CustomerAddressDialogComponent, { cssClass:"modal-lg", context: {iChosenCustomerId:this.iChosenCustomerId, mode: 'create', customerData: customer, editProfile: true } }).instance.close.subscribe(data =>{
        
       this.requestParams = {
        iBusinessId: this.requestParams.iBusinessId,
        searchValue: ''
      }
        
        let icIndex = this.allcustomer.findIndex(i => i._id.toString() == this.iChosenCustomerId.toString());
       
        if(icIndex != -1){
          this.allcustomer[icIndex].isDisable = true;
          this.allcustomer[icIndex].isMerged = true;
        }
       
       
        let isIndex = this.allcustomer.findIndex(i => i._id == data?.customer?.data?._id);
       
        if(isIndex != -1){
          this.allcustomer[isIndex] = data?.customer?.data;
          this.allcustomer[isIndex].isUpdated = true;
          this.allcustomer[isIndex].name = data?.customer?.data?.sSalutation.toUpperCase() +" " + data?.customer?.data?.sFirstName + " "+  data?.customer?.data?.sPrefix + " "+  data?.customer?.data?.sLastName ;
          this.allcustomer[isIndex]['NAME'] = data?.customer?.data?.sSalutation.toUpperCase() +" " + data?.customer?.data?.sFirstName + " "+  data?.customer?.data?.sPrefix + " "+  data?.customer?.data?.sLastName ;
          this.allcustomer[isIndex]['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(data?.customer?.data?.oShippingAddress, false, this.bNormalOrder);
          this.allcustomer[isIndex]['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(data?.customer?.data?.oInvoiceAddress, false, this.bNormalOrder);
          this.allcustomer[isIndex]['EMAIL'] = data?.customer?.data?.sEmail;
          this.allcustomer[isIndex]['PHONE'] =(data?.customer?.data?.oPhone.sLandLine && data?.customer?.data?.oPhone.sPrefixLandline ? data?.customer?.data?.oPhone.sPrefixLandline : '') + (data?.customer?.data?.oPhone && data?.customer?.data?.oPhone.sLandLine ? data?.customer?.data?.oPhone.sLandLine : '') + (data?.customer?.data?.oPhone && data?.customer?.data?.oPhone.sLandLine && data?.customer?.data?.oPhone.sMobile ? ' / ' : '') + (data?.customer?.data?.oPhone.sMobile && data?.customer?.data?.oPhone.sPrefixMobile ? data?.customer?.data?.oPhone.sPrefixMobile : '') +  (data?.customer?.data?.oPhone && data?.customer?.data?.oPhone.sMobile ? data?.customer?.data?.oPhone.sMobile : '')
        }
     });




      // this.iSearchedCustomerId = customer._id;
      // this.loading = true;
      // this.requestParams.iChosenCustomerId = this.iChosenCustomerId;
      // this.requestParams.iSearchedCustomerId = this.iSearchedCustomerId;
      // this.apiService.postNew('customer', '/api/v1/customer/mergecustomer/create', this.requestParams)
      //   .subscribe(async (result: any) => {
      //     this.showLoader = false;
      //     this.isCustomerSearched = true;

      //     this.apiService.getNew('customer', "/api/v1/customer/" + this.requestParams.iBusinessId+"/"+this.iSearchedCustomerId).subscribe((res: any)=>{
           
      //       this.customer = res;
      //       this.close({action: true, customer: res });
      //       return;

      //     });
      //     this.getMergeCustomers();
      //   },
      //     (error: any) => { })
        
    } else {
      if (this.from && this.from === 'cash-register') {
        customer.loading = true;
        const oBody = {
          iBusinessId: this.business._id,
          type: 'transaction'
        }
        
        const _activityData:any = await this.apiService.postNew('cashregistry', `/api/v1/activities/customer/${customer._id}`, oBody).toPromise();
        if (_activityData?.data?.length && _activityData?.data[0]?.result?.length) {
          customer.activityData = _activityData?.data[0]?.result;
        }
        customer.loading = false;
      }
      this.customer = customer;
    }
  this.dialogRef.close.emit({ action: false, customer: this.customer })
  }

  save(): void {
    this.dialogRef.close.emit({action: true, customer: this.customer})
  }

}
