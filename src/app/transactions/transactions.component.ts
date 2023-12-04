import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewContainerRef, QueryList, ViewChildren, ViewChild, Compiler, Injector, NgModuleRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faLongArrowAltDown, faLongArrowAltUp, faMinusCircle, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject } from 'rxjs';
import { BankConfirmationDialogComponent } from '../shared/components/bank-confirmation-dialog/bank-confirmation-dialog.component';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
import { BarcodeService } from '../shared/service/barcode.service';
import { DialogComponent, DialogService } from '../shared/service/dialog';
import { TillService } from '../shared/service/till.service';
import { MenuComponent } from '../shared/_layout/components/common';
import { TransactionItemsDetailsComponent } from '../shared/components/transaction-items-details/transaction-items-details.component';

import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  providers: [BarcodeService]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  dialogRef: DialogComponent
  option: boolean = true;
  faSearch = faSearch;
  faIncrease = faPlusCircle;
  faDecrease = faMinusCircle;
  faArrowUp = faLongArrowAltUp;
  faArrowDown = faLongArrowAltDown;
  cities = [
    { name: 'Amsterdam', code: 'AMS' },
    { name: 'Bruxelles', code: 'BRU' },
    { name: 'Paris', code: 'PAR' },
    { name: 'Instanbul', code: 'INS' }
  ];
  selectedCity: string = '';
  transactions: any = [];
  TIEkinds: Array<any> = ['regular', 'giftcard', 'repair', 'order', 'gold-purchase', 'gold-sell', 'discount', 'offer', 'refund'];
  paymentMethods: Array<any> = [];
  businessDetails: any = {};
  userType: any = {};
  requestParams: any = {
    methods: [],
    TIEKinds: [],
    workstations: [],
    locations: [],
    invoiceStatus: 'all',
    importStatus: 'all',
    iBusinessId: "",
    skip: 0,
    limit: 10,
    searchValue: '',
    sortBy: 'dCreatedDate',
    sortOrder: 'desc',
    bankConfirmedStatus: 'all'
  };
  showLoader: boolean = false;
  widgetLog: string[] = [];
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  showAdvanceSearch = false;
  transactionMenu = [
    { key: 'REST_PAYMENT' },
    //{ key: 'REFUND/REVERT' },
    //{ key: 'PREPAYMENT' },
    { key: 'MARK_CONFIRMED' },
  ];

  iBusinessId: any = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem('currentLocation');

  // Advance search fields 

  filterDates: any = {
    startDate: '',//new Date((new Date()).setDate(new Date().getDate() - 7)),
    endDate: ''//new Date(new Date().setHours(23, 59, 59)),
  }

  transactionStatuses: Array<any> = ['ALL', 'EXPECTED_PAYMENTS', 'NEW', 'CANCELLED', 'FAILED', 'EXPIRED', 'COMPLETED', 'REFUNDED'];
  employee: any = { sFirstName: 'All' };
  employees: Array<any> = [this.employee];
  workstations: Array<any> = [];
  selectedTransactionStatuses: Array<any> = [];
  locations: Array<any> = [];
  eType: string = '';

  tableHeaders: Array<any> = [
    { key: 'DATE', selected: true, sort: 'desc' },
    { key: 'LOCATION', disabled: true },
    { key: 'TRANSACTION_NUMBER', selected: false, sort: '' },
    { key: 'RECEIPT_INVOICE_NUMBER', selected: false, sort: '' },
    { key: 'CUSTOMER', selected: false, sort: '' },
    { key: 'METHOD', disabled: true },
    { key: 'TOTAL', disabled: true },
    // { key: 'TYPE', disabled: true },
    { key: 'ACTION', disabled: true }
  ]

  @ViewChildren('transactionItems') things: QueryList<any>;
  businessDetailsLoaded: boolean = false;
  SupplierStockProductSliderData = new BehaviorSubject<any>({});
  @ViewChild('slider', { read: ViewContainerRef }) container!: ViewContainerRef;
  componentRef: any;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private routes: Router,
    private toastrService: ToastService,
    private barcodeService: BarcodeService,
    public tillService: TillService,
    private compiler: Compiler,
    private injector: Injector,
    private route: ActivatedRoute
  ) { }


  async ngOnInit() {
    this.apiService.setToastService(this.toastrService);
    this.userType = localStorage.getItem("type");

    if (this.routes.url.includes('/business/web-orders')) this.eType = 'webshop-revenue';
    else if (this.routes.url.includes('/business/reservations')) this.eType = 'webshop-reservation';
    else this.eType = 'cash-register-revenue';

    //Needed to open transaction details from Business Product page
    if (this.route.snapshot.queryParamMap.get('sNumber')) {
      this.openModal(this.route.snapshot.queryParamMap.get('sNumber'), true);
    }

    // this.businessDetails._id = localStorage.getItem("currentBusiness");
    this.fetchBusinessDetails();
    // this.loadTransaction();

    this.listEmployee();
    this.getWorkstations();
    // this.getLocations();
    this.getPaymentMethods();

    this.barcodeService.barcodeScanned.subscribe((barcode: string) => {
      this.openModal(barcode);
    });
    this.initSlider();
  }



  // Function for reset selected filters
  resetFilters() {
    this.requestParams.searchValue = "";

    this.requestParams = {
      methods: [],
      TIEKinds: [],
      workstations: [],
      locations: [],
      invoiceStatus: 'all',
      importStatus: 'all',
      iBusinessId: "",
      skip: 0,
      limit: 10,
      searchValue: '',
      iEmployeeId: '',
      sortBy: 'dCreatedDate',
      sortOrder: 'desc'
    };
    this.employee = [];
    this.showAdvanceSearch = false;
    this.loadTransaction();

  }

  fetchBusinessDetails() {
    this.apiService.getNew('core', `/api/v1/business/${this.iBusinessId}`).subscribe((result: any) => {
      this.businessDetails = result.data;
      this.locations = this.businessDetails.aLocation;
      this.loadTransaction();
      this.businessDetails.currentLocation = this.businessDetails?.aLocation?.filter((location: any) => location?._id.toString() == this.iLocationId.toString())[0];
      this.tillService.selectCurrency(this.businessDetails.currentLocation);
      this.businessDetailsLoaded = true;
      setTimeout(() => {
        MenuComponent.reinitialization();
      }, 200);
    })

  }

  getPaymentMethods() {
    this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.iBusinessId).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.paymentMethods = [...result.data.map((v: any) => ({ ...v, isDisabled: false }))]
        this.paymentMethods.forEach((element: any) => {
          element.sName = element.sName.toLowerCase();
        });
      }
    }, (error) => {
    })
  }

  toolTipData(item: any) {
    var itemList = []
    var returnArr = [];

    if (item.aTransactionItems && item.aTransactionItems.length > 0) {
      for (var i = 0; i < item.aTransactionItems.length; i++) {
        itemList.push(item.aTransactionItems[i].sProductName)
        returnArr.push(item.aTransactionItems[i].sProductName + ' - ' + this.tillService.currency + (item.aTransactionItems[i].nPriceIncVat || 0));
      }
    }
    return returnArr.join(" | ");
  }

  goToCashRegister() {
    this.routes.navigate(['/business/till']);
  }

  loadTransaction(isPageChanged?: boolean) {
    if (this.requestParams.searchValue && !isPageChanged) this.resetThePagination();
    this.transactions = [];
    this.requestParams.iBusinessId = this.iBusinessId;
    this.requestParams.type = 'transaction';
    this.requestParams.filterDates = this.filterDates;
    this.requestParams.transactionStatus = this.transactionStatuses;
    this.requestParams.iEmployeeId = this.employee && this.employee._id ? this.employee._id : '';
    this.requestParams.iWorkstationId = undefined // we need to work on this once devides are available.
    this.showLoader = true;
    this.requestParams.eTransactionType = this.eType;
    this.requestParams.bIsDetailRequire = true;  // to fetch the extra detail;
    this.requestParams.searchValue = this.requestParams.searchValue.trim();
    this.apiService.postNew('cashregistry', '/api/v1/transaction/list', this.requestParams).subscribe((result: any) => {
      if (result?.data?.result?.length) {
        this.transactions = result.data.result;
        this.transactions.forEach((transaction: any) => {
          const aTemp = transaction.aPayments.filter((payment: any) => payment.sRemarks !== 'CHANGE_MONEY')
          const bankPaymentIndex = transaction.aPayments.findIndex((payment: any) => payment.sMethod == 'bankpayment');
          if (bankPaymentIndex != -1) {
            transaction.bConfirmed = transaction.aPayments[bankPaymentIndex].bConfirmed;
            transaction.paymentType = 'bankpayment';
          }
          transaction.sMethods = aTemp.map((m: any) => m.sMethod).join(',');
          transaction.nTotal = 0;
          aTemp.forEach((m: any) => transaction.nTotal += m.nAmount)
          const oLocation = this.businessDetails.aLocation.find((el: any) => el._id == transaction.iLocationId);
          if (oLocation) transaction.sLocationName = oLocation?.sName;
        })
        this.paginationConfig.totalItems = result.data.totalCount;
      }
      this.showLoader = false;
      setTimeout(() => {
        MenuComponent.bootstrap();
      }, 200);
    }, (error) => {
      this.showLoader = false;
    })
  }

  // getLocations() {
  //   this.apiService.postNew('core', `/api/v1/business/${this.iBusinessId}/list-location`, {}).subscribe((result: any) => {      
  //       if (result.message == 'success') {
  //         this.locations = result.data.aLocation;
  //       }
  //     })
  // }

  getWorkstations() {
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}/${this.iLocationId}`).subscribe((result: any) => {
      if (result && result.data) {
        this.workstations = result.data;
      }
    });
  }

  listEmployee() {
    this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.iBusinessId }).subscribe((result: any) => {
      if (result?.data?.length) {
        this.employees = this.employees.concat(result.data[0].result);
      }
    })
  }

  openChat(): void {
    // this.chatService.openWidget();
  }

  closeChat(): void {
    // this.chatService.closeWidget();
  }

  // Function for handle event of transaction menu
  clickMenuOpt(key: string, transaction: any) {
    // console.log("transactionid", transaction._id);
    switch (key) {
      case 'MARK_CONFIRMED':
        this.bankConfirmation(transaction._id);
        break
      case 'REST_PAYMENT':
        this.openTransaction(transaction, 'activity');
        break
      default:
        break;
    }
  }
  openTransaction(transaction: any, itemType: any) {
    this.dialogService.openModal(TransactionItemsDetailsComponent, { cssClass: "modal-xl", context: { transaction, itemType } })
      .instance.close.subscribe(result => {
        if (result?.transaction) {
          const data = this.tillService.processTransactionSearchResult(result);
          //console.log("data", data);
          localStorage.setItem('fromTransactionPage', JSON.stringify(data));
          if (result?.action) this.routes.navigate(['business/till']);
        }
      });
  }

  bankConfirmation(transactionId: any) {
    const transactionIndex = this.transactions.findIndex((transaction: any) => transaction._id == transactionId);
    // console.log("transaction index" , this.transactions[transactionIndex]._id)
    this.dialogService.openModal(BankConfirmationDialogComponent, {
      cssClass: "modal-lg",
      context: {
        transaction: this.transactions[transactionIndex]
      },
      hasBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEsc: false
    }).instance.close.subscribe((result: any) => {
      if (result?.res) {
        this.transactions[transactionIndex].aPayments = result?.res;
        const bankPaymentIndex = this.transactions[transactionIndex].aPayments.findIndex((payment: any) => payment.sMethod == 'bankpayment');
        if (bankPaymentIndex != -1) {
          this.transactions[transactionIndex].bConfirmed = this.transactions[transactionIndex].aPayments[bankPaymentIndex].bConfirmed;
        }
      }
    });
  }

  //  Function for set sort option on transaction table
  setSortOption(sortHeader: any) {
    if (sortHeader.selected) {
      sortHeader.sort = sortHeader.sort == 'asc' ? 'desc' : 'asc';
      this.sortAndLoadTransactions(sortHeader)
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
      this.sortAndLoadTransactions(sortHeader)
    }
  }

  sortAndLoadTransactions(sortHeader: any) {
    let sortBy = 'dCreatedDate';
    if (sortHeader.key == 'Date') sortBy = 'dCreatedDate';
    if (sortHeader.key == 'Transaction no.') sortBy = 'sNumber';
    if (sortHeader.key == 'Receipt number') sortBy = 'oReceipt.sNumber';
    if (sortHeader.key == 'Customer') sortBy = 'oCustomer.sFirstName';
    this.requestParams.sortBy = sortBy;
    this.requestParams.sortOrder = sortHeader.sort;
    this.loadTransaction();
  }

  resetThePagination() {
    this.requestParams.skip = 0;
    this.paginationConfig.currentPage = 1;
    this.requestParams.limit = parseInt(this.paginationConfig.itemsPerPage);
  }

  changeItemsPerPage() {
    this.resetThePagination();
    this.loadTransaction();
  }

  // Function for handle page change
  pageChanged(selctedPage: any) {
    this.requestParams.skip = (selctedPage - 1) * parseInt(this.paginationConfig.itemsPerPage);
    this.paginationConfig.currentPage = selctedPage;
    this.loadTransaction(true);
  }




  // Function for show transaction details
  showTransaction(transaction: any) {
    const oDialogComponent: DialogComponent = this.dialogService.openModal(TransactionDetailsComponent,
      {
        cssClass: "w-fullscreen mt--5",
        context: {
          transaction: transaction,
          businessDetails: this.businessDetails,
          eType: this.eType,
          from: 'transactions',
          employeesList: this.employees
        },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance;

    oDialogComponent.close.subscribe(async (result) => {
      if (result) transaction.sInvoiceNumber = result?.sInvoiceNumber;
      if (result?.oData?.oCurrentCustomer) {
        transaction.oCustomer._id = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer._id ? result.oData.oCurrentCustomer._id : transaction.oCustomer._id;
        transaction.iCustomerId = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer._id ? result.oData.oCurrentCustomer._id : transaction.iCustomerId;
        transaction.oCustomer.bIsCompany = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.bIsCompany ? result.oData.oCurrentCustomer.bIsCompany : false;
        transaction.oCustomer.sFirstName = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sFirstName ? result.oData.oCurrentCustomer.sFirstName : "";
        transaction.oCustomer.sLastName = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sLastName ? result.oData.oCurrentCustomer.sLastName : "";
        transaction.oCustomer.sSalutation = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sSalutation ? result.oData.oCurrentCustomer.sSalutation : "";
        transaction.oCustomer.sPrefix = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sPrefix ? result.oData.oCurrentCustomer.sPrefix : "";
        transaction.oCustomer.sEmail = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sEmail ? result.oData.oCurrentCustomer.sEmail : "";
        transaction.oCustomer.sGender = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sGender ? result.oData.oCurrentCustomer.sGender : "";
        transaction.oCustomer.sVatNumber = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sVatNumber ? result.oData.oCurrentCustomer.sVatNumber : "";
        transaction.oCustomer.sCocNumber = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sCocNumber ? result.oData.oCurrentCustomer.sCocNumber : "";
        transaction.oCustomer.nClientId = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.nClientId ? result.oData.oCurrentCustomer.nClientId : "";
        transaction.oCustomer.oContactPerson = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.oContactPerson ? result.oData.oCurrentCustomer.oContactPerson : "";
        transaction.oCustomer.sCompanyName = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.sCompanyName ? result.oData.oCurrentCustomer.sCompanyName : "";
        transaction.oCustomer.oShippingAddress = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.oShippingAddress ? result.oData.oCurrentCustomer.oShippingAddress : "";
        transaction.oCustomer.oInvoiceAddress = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.oInvoiceAddress ? result.oData.oCurrentCustomer.oInvoiceAddress : "";
        transaction.oCustomer.oPhone = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.oPhone ? result.oData.oCurrentCustomer.oPhone : "";
        transaction.oCustomer.bCounter = result && result.oData && result.oData.oCurrentCustomer && result.oData.oCurrentCustomer.bCounter ? result.oData.oCurrentCustomer.bCounter : false;
      }
      if (result?.action) this.routes.navigate(['business/till']);
    }, (error) => {
      console.log('Error: ', error);
    });

    oDialogComponent.triggerEvent.subscribe(res => {
      if (res?.type === 'open-slider' && res?.data) {
        this.SupplierStockProductSliderData.next(res.data);
      }
    })
  }

  initSlider() {
    // try {
    //   import('supplierProductSlider/SupplierProductSliderModule').then(({ SupplierProductSliderModule }) => {
    //     this.compiler.compileModuleAsync(SupplierProductSliderModule).then(moduleFactory => {
    //       const moduleRef: NgModuleRef<typeof SupplierProductSliderModule> = moduleFactory.create(this.injector);
    //       const componentFactory = moduleRef.instance.resolveComponent();
    //       this.componentRef = this.container.createComponent(componentFactory, undefined, moduleRef.injector);
    //       this.componentRef.instance.$data = this.SupplierStockProductSliderData.asObservable();
    //       this.componentRef.instance.toastService = this.toastrService;
    //     });
    //   }).catch(e => {
    //     console.warn('error in importing supplier product slider module');
    //   });
    // } catch (error) {
    //   console.log('error while initializing slider', error);
    // }
  }

  async openModal(barcode: any, isQparam?: boolean) {
    if (barcode.startsWith('0002'))
      barcode = barcode.substring(4)

    if (barcode.startsWith("T")) {
      if (!isQparam)
        this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })
      const result: any = await this.apiService.postNew('cashregistry', `/api/v1/transaction/detail/${barcode}`, { iBusinessId: this.iBusinessId }).toPromise();
      if (result?.data?._id) {
        this.showTransaction(result?.data);
      }
    } else if (barcode.startsWith("A") || barcode.startsWith("AI")) {
      this.requestParams.searchValue = barcode;
      this.loadTransaction();
    } else {
      if (!isQparam)
        this.toastrService.show({ type: 'warning', text: 'Please go to different page to process this barcode!' })
    }

  }

  ngOnDestroy(): void {
    MenuComponent.clearEverything();
  }
}
