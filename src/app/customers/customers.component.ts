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

// import { result } from 'lodash';

// interface FSEntry {
//   NAME: string;
//   PHONE: string;
//   EMAIL: string;
//   SHIPPING_ADDRESS?: string;
//   INVOICE_ADDRESS?: string;
// }

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.sass']
})
export class CustomersComponent implements OnInit {

  faSearch = faSearch;

  business: any = {}
  customers: Array<any> = [];  //make it empty later
  showLoader: boolean = false;

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
  allColumns = [this.customColumn, ...this.defaultColumns];
  headerList: Array<any> = ['Salutation', 'First name', 'Prefix', 'Last name', 'Date of birth', 'Client id', 'Gender', 'Email verified', 'Counter', 'Email', 'phone'
   , 'Shipping Address' , 'Invoice Address' , 'Comment' , 'Newsletter' , 'Company name' , 'Points' , 'Identity' , 'Vat number' ,
   'Coc number' , 'Payment term days' , 'Discount' , 'Whatsapp' , 'Matching code' , 'Note' , 'Migrated customer'
  ];
  valuesList: Array<any> = ['sSalutation', 'sFirstName', 'sPrefix', 'sLastName', 'dDateOfBirth', 'nClientId', 'sGender', 'bIsEmailVerified',
  'bCounter', 'sEmail', 'PHONE', 'SHIPPING_ADDRESS', 'INVOICE_ADDRESS', 'sComment', 'bNewsletter', 'sCompanyName', 'oPoints',
   'oIdentity', 'sVatNumber', 'sCocNumber', 'nPaymentTermDays', 'nDiscount', 'bWhatsApp', 'nMatchingCode' , 'sNote' , 'iEmployeeId' , 'bIsMigrated'];
  
  requestParams: any = {
    iBusinessId: "",
    skip: 0,
    limit: 10,
    sortBy: '',
    sortOrder: '',
    searchValue: '',
    aProjection: ['sSalutation', 'sFirstName', 'sPrefix', 'sLastName', 'dDateOfBirth', 'dDateOfBirth', 'nClientId', 'sGender', 'bIsEmailVerified',
      'bCounter', 'sEmail', 'oPhone', 'oShippingAddress', 'oInvoiceAddress', 'iBusinessId', 'sComment', 'bNewsletter', 'sCompanyName', 'oPoints',
      'sCompanyName', 'oIdentity', 'sVatNumber', 'sCocNumber', 'nPaymentTermDays', 'nDiscount', 'bWhatsApp', 'nMatchingCode' , 'sNote' , 'iEmployeeId' , 'bIsMigrated'],
    oFilterBy: {
      oStatic: {},
      oDynamic: {}
    }
  };

  @ViewChildren('inputElement') inputElement!: QueryList<ElementRef>;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private paginationPipe: PaginatePipe,
    private dialogService: DialogService,
    private customerStructureService: CustomerStructureService
  ) {
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.business._id = localStorage.getItem("currentBusiness");
    this.requestParams.iBusinessId = this.business._id;
    this.getCustomers()

  }

  createCustomer() {
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass: "modal-xl", context: { mode: 'create' } }).instance.close.subscribe(result => {
      if (result && result.action && result.action == true) this.getCustomers()
    });
  }

  changeItemsPerPage(pageCount: any) {
    this.paginationConfig.itemsPerPage = pageCount;
    this.requestParams.skip = this.paginationConfig.itemsPerPage * (this.paginationConfig.currentPage - 1);
    this.requestParams.limit = this.paginationConfig.itemsPerPage;
    this.getCustomers()
  }

  getCustomers() {
    this.showLoader = true;
    this.customers = [];
    this.apiService.postNew('customer', '/api/v1/customer/list', this.requestParams)
      .subscribe(async (result: any) => {
        this.showLoader = false;
        if (result?.data?.[0]?.result) {
          this.paginationConfig.totalItems = result.data[0].count.totalData;
          this.customers = result.data[0].result;
          for (const customer of this.customers) {
            customer['NAME'] = this.customerStructureService.makeCustomerName(customer);
            customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false);
            customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false);
            customer['EMAIL'] = customer.sEmail;
            customer['PHONE'] = (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '')
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
    // return this.dataSourceBuilder.create(result, this.getters);
  }

  export(){
    this.dialogService.openModal(ExportsComponent , { cssClass: "modal-lg", context: { requestParams:this.requestParams , headerList : this.headerList , valuesList:this.valuesList , separator:''  } }).instance.close.subscribe(result => {
      console.log("--------------customer export successfully!!!");
    })

  }

  openCustomer(customer: any) {
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass: "modal-xl position-fixed start-0 end-0", context: { customer: customer, mode: 'details', from: 'customer' } }).instance.close.subscribe(
      result => { if (result && result.action && result.action == true) this.getCustomers(); });
  }

  // Function for handle page change
  pageChanged(page: any) {
    this.paginationConfig.currentPage = page;
    this.requestParams.skip = this.paginationConfig.itemsPerPage * (page - 1);
    this.requestParams.limit = this.paginationConfig.itemsPerPage;
    this.getCustomers()
  }
}
