import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DialogComponent, DialogService } from '../../service/dialog';
import { ViewContainerRef } from '@angular/core';
import { ApiService } from '../../../shared/service/api.service';
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from '@ngx-translate/core';
import { TillService } from '../../../shared/service/till.service';
//import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ImageAndDocumentsDialogComponent } from '../../../shared/components/image-and-documents-dialog/image-and-documents-dialog.component';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexXAxis,
  ChartComponent,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexLegend
} from "ng-apexcharts";
import { ToastService } from '../toast';
import { WebOrderDetailsComponent } from '../../../shared/components/web-order-details/web-order-details.component';
import { ActivityDetailsComponent } from '../../../shared/components/activity-details-dialog/activity-details.component';
import { TransactionDetailsComponent } from '../../../transactions/components/transaction-details/transaction-details.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CustomerDialogComponent } from '../../../shared/components/customer-dialog/customer-dialog.component';
import * as countryPhoneCodeList from '../../../../assets/json/country_phone_code_list.json';
import { CustomerStructureService } from '../../service/customer-structure.service';
export interface BarChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  colors: any;
  tooltip: any
};

export interface PieChartOptions {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  legend: ApexLegend;
  title: any;
  options: any
};

export const ChartColors = {
  REPAIR: '#4ab69c',
  SPECIAL_ORDERS: '#212E48',
  SHOP_PURCHASE: '#1C3238',
  QUOTATION: '#7337EE',
  WEBSHOP: '#92929F',
  REFUND: '#fd7e14',
  GIFTCARD: '#198754',
  GOLD_PURCHASE: '#800000',
  PRODUCT_RESERVATION: '#d63384',
  DISCOUNTS: '#dc3545',
  JEWELLERY: '#20c997',
  WATCHES: '#6f42c1'
}

@Component({
  selector: 'app-customer-details',
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.scss']
})

export class CustomerDetailsComponent implements OnInit, AfterViewInit {
  aCountryPhoneCodes: Array<any> = countryPhoneCodeList;
  dialogRef: DialogComponent;
  salutations: Array<any> = [
    { key: 'mr', value: 'MR' },
    { key: 'mrs', value: 'MRS' },
    { key: 'mr_mrs', value: 'MR_MRS' },
    { key: 'family', value: 'FAMILY' },
    { key: 'firm', value: 'FIRM' }];
  gender: Array<any> = ['Male', 'Female', "Other"]
  documentTypes: Array<any> = ['Driving license', 'Passport', 'Identity card', 'Alien document'];
  mode: string = '';
  editProfile: boolean = false;
  bIsCurrentCustomer: boolean = false;
  bIsCounterCustomer: boolean = false;
  showStatistics: boolean = false;
  //savingPointsSetting: boolean = false;
  faTimes = faTimes;
  faUpload = faUpload;
  aPaymentChartData: any = [];
  aEmployeeStatistic: any = [];
  translations: any;
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  iEmployeeId: any;
  employeesList: any;
  mergeCustomerIdList: any;
  customerLoyalityPoints: number = 0;
  pointsAdded: Boolean = false;
  oPointsSettingsResult: any;
  employees: Array<any> = [];
  purchasePaginationConfig: any = {
    id: 'purchases_paginate',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  transactionItemPaginationConfig: any = {
    id: 'transaction_item_paginate',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  activitiesPaginationConfig: any = {
    id: 'activities_paginate',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  itemsPaginationConfig: any = {
    id: 'items_paginate',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  purchaseRequestParams: any = {
    skip: 0,
    limit: 10
  }
  transactionItemRequestParams: any = {
    skip: 0,
    limit: 10
  }
  activitiesRequestParams: any = {
    skip: 0,
    limit: 10
  }
  itemsRequestParams: any = {
    skip: 0,
    limit: 10
  }
  customer: any = {
    _id: '',
    bNewsletter: true,
    sSalutation: 'MR',
    sEmail: '',
    sFirstName: '',
    sPrefix: '',
    sLastName: '',
    oPhone: {
      sCountryCode: '',
      sMobile: '',
      sPrefixMobile: '',
      sLandLine: '',
      sPrefixLandline: '',
      sFax: '',
      bWhatsApp: true
    },
    sNote: '',
    dDateOfBirth: '',
    oIdentity: {
      documentName: '',
      documentNumber: '',
    },
    sGender: 'male',
    oInvoiceAddress: {
      sCountry: 'Netherlands',
      sCountryCode: 'NL',
      sState: '',
      sPostalCode: '',
      sHouseNumber: '',
      sHouseNumberSuffix: '',
      //sAddition: '',
      sStreet: '',
      sCity: ''
    },
    oShippingAddress: {
      sCountry: 'Netherlands',
      sCountryCode: 'NL',
      sState: '',
      sPostalCode: '',
      sHouseNumber: '',
      sHouseNumberSuffix: '',
      //sAddition: '',
      sStreet: '',
      sCity: ''
    },
    sCompanyName: '',
    sVatNumber: '',
    sCocNumber: '',
    nPaymentTermDays: '',
    nLoyaltyPoints: 0,
    nLoyaltyPointsValue: 0,
    createrDetail: {},
    iEmployeeId: '',
    aGroups: [],
    sImage: '',
    bIsCompany: false,
    oContactPerson: {
      sFirstName: '',
      sPrefix: '',
      sLastName: ''
    }
  }
  webOrders: Boolean = false;
  requestParams: any = {
    iBusinessId: "",
    aProjection: ['sSalutation', 'sFirstName', 'sPrefix', 'sLastName', 'dDateOfBirth', 'dDateOfBirth', 'nClientId', 'sGender', 'bIsEmailVerified',
      'bCounter', 'sEmail', 'oPhone', 'oShippingAddress', 'oInvoiceAddress', 'iBusinessId', 'sComment', 'bNewsletter', 'sCompanyName', 'oPoints',
      'sCompanyName', 'oIdentity', 'sVatNumber', 'sCocNumber', 'nPaymentTermDays', 'nDiscount', 'bWhatsApp', 'nMatchingCode', 'sNote', 'sBagNumber', 'dEstimatedDate', 'eActivityItemStatus', 'sBusinessPartnerName',
      'bIsMerged', 'eStatus', 'bIsImported', 'sImage'],

  };

  bTransactionsLoader: boolean = false;
  bTransactionItemLoader: boolean = false;
  bActivitiesLoader: boolean = false;
  bActivityItemsLoader: boolean = false;
  repairStatuses: Array<any> = [
    { key: 'NEW', value: 'new' },
    { key: 'INFO', value: 'info' },
    { key: 'PROCESSING', value: 'processing' },
    { key: 'CANCELLED', value: 'cancelled' },
    { key: 'INSPECTION', value: 'inspection' },
    { key: 'COMPLETED', value: 'completed' },
    { key: 'REFUND', value: 'refund' },
    { key: 'REFUNDINCASHREGISTER', value: 'refundInCashRegister' },
    { key: 'OFFER', value: 'offer' },
    { key: 'OFFER_IS_OK', value: 'offer-is-ok' },
    { key: 'OFFER_IS_NOT_OK', value: 'offer-is-not-ok' },
    { key: 'TO_REPAIR', value: 'to-repair' },
    { key: 'PART_ARE_ORDER', value: 'part-are-order' },
    { key: 'SHIPPED_TO_REPAIR', value: 'shipped-to-repair' },
    { key: 'DELIVERED', value: 'delivered' },
    { key: 'PRODUCT_ORDERED', value: 'product-ordered' },
    { key: 'ORDER_READY', value: 'order-ready' },
  ];

  aTransactions !: Array<any>;
  aTransctionTableHeaders: Array<any> = [
    { key: 'DATE', selected: true, sort: 'desc' },
    { key: 'TRANSACTION_NUMBER', selected: false, sort: '' },
    { key: 'RECEIPT_INVOICE_NUMBER', selected: false, sort: '' },
    { key: 'METHOD', disabled: true },
    { key: 'TOTAL', disabled: true },
    { key: 'ACTION', disabled: true }
  ];
  aTransactionItems !: Array<any>;
  aTransctionItemTableHeaders: Array<any> = [
    { key: 'DATE', disabled: true },
    { key: 'PRODUCT_NUMBER', disabled: true },
    { key: 'DESCRIPTION', disabled: true },
    { key: 'SELLING_PRICE', disabled: true },
    { key: 'ACTION', disabled: true }
  ];

  aActivities!: Array<any>;
  aActivityTableHeaders: Array<any> = [
    { key: 'ACTIVITY_NUMBER', selected: false, sort: '' },
    { key: 'REPAIR_NUMBER', disabled: true },
    { key: 'TYPE', disabled: true },
    { key: 'INTAKE_DATE', selected: true, sort: 'asc' },
    { key: 'END_DATE', selected: false, sort: 'asc' },
    { key: 'STATUS', disabled: true },
    { key: 'SUPPLIER_REPAIRER', disabled: true },
    { key: 'ACTION', disabled: true }
  ]

  aActivityItems!: Array<any>;
  aActivityItemsTableHeaders: Array<any> = [
    { key: 'ACTIVITY_NUMBER', selected: false, sort: '' },
    { key: 'REPAIR_NUMBER', disabled: true },
    { key: 'TYPE', disabled: true },
    { key: 'INTAKE_DATE', selected: true, sort: 'asc' },
    { key: 'END_DATE', selected: false, sort: 'asc' },
    { key: 'STATUS', disabled: true },
    { key: 'SUPPLIER_REPAIRER', disabled: true },
    { key: 'ACTION', disabled: true }
  ];
  currentTab = 0;
  tabs = [
    { index: 0, name: 'PURCHASES' },
    { index: 1, name: 'TRANSACTION_ITEMS' },
    { index: 2, name: 'ACTIVITIES' },
    { index: 3, name: 'ITEMS_PER_VISIT' },
    { index: 4, name: 'STATISTICS' },
    { index: 5, name: 'GENERAL' }
  ];

  tabTitles: any = [
    'Purchases',
    'Transaction Items',
    'Activities',
    'Items per visit',
    'Statistics',
    'General'
  ];

  @ViewChild("statistics-chart") statisticsChart !: ChartComponent;
  public statisticsChartOptions !: Partial<BarChartOptions> | any;

  @ViewChild("activities-chart") activitiesChart !: ChartComponent;
  public activitiesChartOptions !: Partial<PieChartOptions> | any;

  @ViewChild("paymentMethodsChart") paymentMethodsChart !: ChartComponent;
  public paymentMethodsChartOptions !: Partial<PieChartOptions> | any;

  @ViewChild('customerNote') customerNote: ElementRef;

  aStatisticsChartDataLoading = false
  aActivityTitles: any = [
    { name: "REPAIRS", type: "Repairs", value: 0, color: ChartColors.REPAIR },//$primary-color
    { name: "SPECIALS", type: "Special orders", value: 0, color: ChartColors.SPECIAL_ORDERS },//$dark-primary-light-color
    { name: "SHOP_PURCHASE", type: "Shop purchase", value: 0, color: ChartColors.SHOP_PURCHASE },//$dark-success-light-color
    { name: "QUOTATION", type: "Quotation", value: 0, color: ChartColors.QUOTATION },//$info-active-color
    { name: "WEBSHOP", type: "Webshop", value: 0, color: ChartColors.WEBSHOP },//$gray-700
    { name: "GIFTCARD", type: "Giftcard", value: 0, color: ChartColors.GIFTCARD },//$green
    { name: "GOLD_PURCHASE", type: "Gold purchase", value: 0, color: ChartColors.GOLD_PURCHASE },//$maroon
    { name: "PRODUCT_RESERVATION", type: "Product reservation", value: 0, color: ChartColors.PRODUCT_RESERVATION }//$pink
  ];
  activityTitlesEkind = ['regular', 'reservation', 'giftcard', 'gold-purchase', 'repair', 'order'];
  aStatisticsChartData: any = [];

  totalActivities: number = 0;
  from !: string;

  customerNotesChangedSubject: Subject<string> = new Subject<string>();
  nTotalTurnOver: any;
  nAvgOrderValueIncVat: number;
  customerGroupList: any = [];
  aSelectedGroups: any = [];
  businessDetails: any = {};
  nClientId: any = "-";
  oS: any;
  showDeleteBtn: boolean = false;
  sDocumentName: any = '';
  sDocumentNumber: any = 0;
  aImage: any = [];
  oTemp: any;

  bNormalOrder: boolean = true;
  sBusinessCountry: string = '';

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    public tillService: TillService,
    private customerStructureService: CustomerStructureService,
    private router: Router
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  async ngOnInit() {
    this.apiService.setToastService(this.toastService);
    this.getBusinessDetails();
    this.customer = { ... this.customer, ... this.dialogRef?.context?.customerData };
    let str = this.customer?.nClientId;
    if (str && str.indexOf('/') > 0) {
      str = str.replaceAll('undefined', '-');
      this.customer.nClientId = str;
      this.nClientId = str.substring(0, str.indexOf('/'));
    } else {
      this.nClientId = this.customer.nClientId == '' ? '-' : this.customer.nClientId;
    }
    const translations = ['SUCCESSFULLY_ADDED', 'SUCCESSFULLY_UPDATED', 'SUCCESSFULLY_DELETED', 'LOYALITY_POINTS_ADDED', 'LOYALITY_POINTS_NOT_ADDED', 'REDUCING_MORE_THAN_AVAILABLE', 'ARE_YOU_SURE_TO_DELETE_THIS_CUSTOMER', 'ONLY_LETTERS_ARE_ALLOWED', 'CUSTOMER_NOT_CREATED', 'LASTNAME_REQUIRED']
    this.translateService.get(translations).subscribe(
      result => this.translations = result
    )
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness');
    this.requestParams.iLocationid = localStorage.getItem('currentLocation');
    this.iEmployeeId = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser') || '') : "";

    this.requestParams.oFilterBy = {
      _id: this.customer._id,
      iCustomerId: this.customer._id
    }
    this.fetchLoyaltyPoints();
    this.getListEmployees();
    await this.getMergedCustomerIds();
    this.getCustomerGroups();
    this.loadTransactions();
  }
  openImageModal(isFrom: any) {
    this.dialogService.openModal(ImageAndDocumentsDialogComponent, { cssClass: "modal-xl", context: { mode: 'create', imageData: this.oTemp, customer: this.customer._id, isFrom: isFrom } })
      .instance.close.subscribe(result => {
        if (result) {
          if (result.event.docs) {
            this.oTemp = {
              aImage: result.event.docs.aImage,
              sDocumentName: result.event.docs.sDocumentName,
              sDocumentNumber: result.event.docs.sDocumentNumber
            }
          } else {
            this.oTemp = undefined;
          }
        }
      });
  }

  openImage(imageIndex: any) {
    const url = this.oTemp.aImage[imageIndex];
    window.open(url, "_blank");
  }
  removeImage(index: number): void {
    this.oTemp.aImage.splice(index, 1);
  }

  onTabChange(index: any) {
    if (this.currentTab === index) return;
    this.currentTab = index;
    if (index === 0) this.loadTransactions();
    else if (index === 1) this.loadTransactionItems();
    else if (index === 2) this.loadActivities();
    else if (index === 3) this.loadActivityItems();
    else if (index === 4) this.getCoreStatistics(); this.loadStatisticsTabData();
  }

  mergeCustomer(customer: any, Id: any, iSearchedCustomerId: any, key: any) {
    this.dialogService.openModal(CustomerDialogComponent, { cssClass: 'modal-xl', context: { customer: this.customer, iChosenCustomerId: Id, iSearchedCustomerId: null, key: "MERGE" } })
      .instance.close.subscribe((data) => {
        this.requestParams = {
          iBusinessId: this.requestParams.iBusinessId,
          searchValue: ''
        }
        if (data.customer) {
          this.close({ action: true });
          this.customer = data.customer;
        }
      })
  }

  deleteCustomer(customer: any) {
    let confirmBtnDetails = [
      { text: "CANCEL", value: 'close', class: 'btn btn-secondary ml-auto mr-2' },
      { text: "YES", value: 'remove', status: 'success', class: 'btn btn-success ml-auto mr-2' }
    ];
    this.dialogService.openModal(ConfirmationDialogComponent, { context: { header: 'DELETE', bodyText: this.translations[`ARE_YOU_SURE_TO_DELETE_THIS_CUSTOMER`], buttonDetails: confirmBtnDetails } })
      .instance.close.subscribe(
        (status: any) => {
          if (status == 'remove') {
            this.apiService.postNew('customer', '/api/v1/customer/delete', { iCustomerId: customer._id, iBusinessId: this.requestParams.iBusinessId }).subscribe((res: any) => {
              if (res?.message == 'success') {
                this.close({ action: true });
                this.toastService.show({ type: 'success', text: this.translations[`SUCCESSFULLY_DELETED`] })
              } else {
                this.toastService.show({ type: 'warning', text: 'Internal Server Error' });
              }
            })

          }
        })
  }


  async getMergedCustomerIds() {
    if (this.customer && this.customer?._id) {
      const oBody = {
        iBusinessId: this.requestParams.iBusinessId,
        iCustomerId: this.customer._id
      }
      let url = '/api/v1/customer/merged/customer';
      const result: any = await this.apiService.postNew('customer', url, oBody).toPromise();
      this.mergeCustomerIdList = result?.aUniqueCustomerId;
      return result?.aUniqueCustomerId;
    }
  }


  customerNotesChanged(event: any) {
    this.customerNotesChangedSubject.next(event);
  }

  customerType(event: any) {
    this.customer.sSalutation = event.value;
    if (event.key == 'firm') {
      this.customer.bIsCompany = true;
      this.customer.sGender = 'other';
      if (this.mode === 'create') {
        this.customer.oContactPerson.sFirstName = this.customer.sFirstName;
        this.customer.oContactPerson.sPrefix = this.customer.sPrefix;
        this.customer.oContactPerson.sLastName = this.customer.sLastName;
        this.customer.sFirstName = '';
        this.customer.sPrefix = '';
        this.customer.sLastName = '';
      } else {
        this.customer.oContactPerson.sFirstName = this.customer.sFirstName;
        this.customer.oContactPerson.sPrefix = this.customer.sPrefix;
        this.customer.oContactPerson.sLastName = this.customer.sLastName;
      }

    }
    else {
      this.customer.bIsCompany = false;
      if (this.mode === 'create') {
        this.customer.sFirstName = this.customer.sFirstName || this.customer.oContactPerson.sFirstName;
        this.customer.sPrefix = this.customer.sPrefix || this.customer.oContactPerson.sPrefix;
        this.customer.sLastName = this.customer.sLastName || this.customer.oContactPerson.sLastName;
        this.customer.oContactPerson.sFirstName = "";
        this.customer.oContactPerson.sPrefix = "";
        this.customer.oContactPerson.sLastName = "";
        this.customer.sCompanyName = "";
        this.customer.sVatNumber = "";
        this.customer.nPaymentTermDays = null;
      }
      if (this.mode === 'details') {
        this.customer.oContactPerson.sFirstName = '';
        this.customer.oContactPerson.sPrefix = '';
        this.customer.oContactPerson.sLastName = '';
      }
    }
  }

  getCustomerGroups() {
    this.apiService.postNew('customer', '/api/v1/group/list', { iBusinessId: this.requestParams.iBusinessId, iLocationId: localStorage.getItem('currentLocation') }).subscribe((res: any) => {
      if (res?.message == 'success') {
        if (res?.data?.length) {
          this.customerGroupList = res?.data[0]?.result;
          if (this.customer?.aGroups?.length) {
            this.customer.aGroups.forEach((group: any) => {
              const index = this.customerGroupList.findIndex((cGroup: any) => cGroup._id == group);
              if (index >= 0) {
                this.aSelectedGroups.push(this.customerGroupList[index].sName);
              }
            })
          }
        }
      }
    }, (error) => { })
  }

  getBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + localStorage.getItem('currentBusiness')).subscribe((response: any) => {
      const currentLocation = localStorage.getItem('currentLocation');
      if (response?.data) this.businessDetails = response.data;
      this.businessDetails.currentLocation = this.businessDetails?.aLocation?.filter((location: any) => location?._id.toString() == currentLocation?.toString())[0];
      this.tillService.selectCurrency(this.businessDetails.currentLocation);

      if (this.businessDetails?.aLocation?.length) {
        const locationIndex = this.businessDetails.aLocation.findIndex((location: any) => location._id == currentLocation);

        if (locationIndex != -1) {
          const currentLocationDetail = this.businessDetails?.aLocation[locationIndex];

          /*Needed to change fields order*/
          this.sBusinessCountry = currentLocationDetail?.oAddress?.countryCode;
          //console.log(this.sBusinessCountry);
          if (this.sBusinessCountry == 'UK' || this.sBusinessCountry == 'GB' || this.sBusinessCountry == 'FR') {
            this.bNormalOrder = false;
          }

          if (!this.customer?._id) {
            if (currentLocationDetail?.oAddress?.countryCode) {
              const oCountryPhoneCode = this.aCountryPhoneCodes.find(code => code.key === currentLocationDetail?.oAddress?.countryCode);
              this.customer.oPhone.sPrefixMobile = oCountryPhoneCode.value;
              this.customer.oPhone.sPrefixLandline = oCountryPhoneCode.value;
            }
            if (currentLocationDetail?.oAddress?.country && currentLocationDetail?.oAddress?.countryCode) {
              this.customer.oInvoiceAddress.sCountry = currentLocationDetail?.oAddress?.country;
              this.customer.oInvoiceAddress.sCountryCode = currentLocationDetail?.oAddress?.countryCode;
              this.customer.oShippingAddress.sCountry = currentLocationDetail?.oAddress?.country;
              this.customer.oShippingAddress.sCountryCode = currentLocationDetail?.oAddress?.countryCode;
            }
          }

          this.customer.invoiceAddress = this.customerStructureService.makeCustomerAddress(this.customer?.oInvoiceAddress, true, this.bNormalOrder);
          this.customer.shippingAddress = this.customerStructureService.makeCustomerAddress(this.customer?.oShippingAddress, true, this.bNormalOrder);
        }
      }
    });
  }

  addLoyalityPoints() {
    this.pointsAdded = true;
    if (this.customerLoyalityPoints < 0 && this.customerLoyalityPoints < -this.customer.nLoyaltyPoints) {
      this.toastService.show({ type: 'warning', title: this.translations['LOYALITY_POINTS_NOT_ADDED'], text: this.translations['REDUCING_MORE_THAN_AVAILABLE'] });
      this.pointsAdded = false;
    } else {
      const oBody = {
        iBusinessId: this.requestParams.iBusinessId,
        iLocationId: localStorage.getItem('currentLocation'),
        iCustomerId: this.customer._id,
        nSavingsPoints: this.customerLoyalityPoints
      }
      this.apiService.postNew('cashregistry', '/api/v1/points-settings/createPoints', oBody).subscribe((res: any) => {
        if (res.message == 'success' && res?.data?._id) {
          this.pointsAdded = false;
          this.customerLoyalityPoints = 0;
          this.customer.nLoyaltyPoints = this.customer.nLoyaltyPoints + res.data.nSavingsPoints;
          this.customer.nLoyaltyPointsValue = this.customer.nLoyaltyPoints / this.oPointsSettingsResult.nPerEuro2;
          this.toastService.show({ type: 'success', text: this.translations['LOYALITY_POINTS_ADDED'] });
        } else {
          this.pointsAdded = false;
          this.customerLoyalityPoints = 0;
          this.toastService.show({ type: 'danger', text: this.translations['LOYALITY_POINTS_NOT_ADDED'] });
        }

      })
    }
  }


  getListEmployees() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    let url = '/api/v1/employee/list';
    this.apiService.postNew('auth', url, oBody).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.employeesList = result.data[0].result;
        if (this.customer?.iEmployeeId) {
          let createerIndex = this.employeesList.findIndex((employee: any) => employee._id == this.customer.iEmployeeId);
          if (createerIndex != -1) {
            this.customer.createrDetail = this.employeesList[createerIndex];
          }
        }
      }
    }, (error) => {
    });
  }

  convertFirstLetterUpper(event: any, fieldName: any) {
    const aField: any = fieldName.split('.');
    //console.log(aField?.length)
    if (aField?.length > 1) {
      if (this.customer[aField[0]][aField[1]]?.length == 1) {
        this.customer[aField[0]][aField[1]] = this.customer[aField[0]][aField[1]].toUpperCase();
      }
    } else {
      if (this.customer[fieldName]?.length == 1) {
        this.customer[fieldName] = this.customer[fieldName].toUpperCase();
      }
    }
  }

  handleCustomerNotesUpdate() {
    if (this.mode == 'details') {
      this.apiService.putNew('customer', '/api/v1/customer/update/' + this.requestParams.iBusinessId + '/' + this.customer._id, this.customer).subscribe(
        (result: any) => {
          if (result?.message === 'success') {
            this.toastService.show({ type: 'success', text: this.translations[`SUCCESSFULLY_UPDATED`] });
          } else {
            let errorMessage = ""
            this.translateService.get(result?.message).subscribe(
              result => errorMessage = result
            )
            this.toastService.show({ type: 'warning', text: errorMessage });
          }
        },
        (error: any) => {
          let errorMessage = ""
          this.translateService.get(error.message).subscribe(
            result => errorMessage = result
          )
          this.toastService.show({ type: 'warning', text: errorMessage });
        }
      );
    }
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();

    this.customerNotesChangedSubject.pipe(
      filter(Boolean),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.handleCustomerNotesUpdate();
    });
  }

  changeItemsPerPage(pageCount: any, tab: any) {
    if (tab == 'purchases') {
      this.purchasePaginationConfig.itemsPerPage = parseInt(pageCount);
      this.purchaseRequestParams.skip = 0;
      this.purchasePaginationConfig.currentPage = 1;
      this.purchaseRequestParams.limit = parseInt(this.purchasePaginationConfig.itemsPerPage);
      this.loadTransactions()
    }
    if (tab == 'TransactionItems') {
      this.transactionItemPaginationConfig.itemsPerPage = parseInt(pageCount);
      this.purchaseRequestParams.skip = 0;
      this.transactionItemPaginationConfig.currentPage = 1;
      this.transactionItemRequestParams.limit = parseInt(this.transactionItemPaginationConfig.itemsPerPage);
      this.loadTransactionItems()
    }
    if (tab == 'activities') {
      this.activitiesPaginationConfig.itemsPerPage = parseInt(pageCount);
      this.purchaseRequestParams.skip = 0;
      this.activitiesPaginationConfig.currentPage = 1;
      this.activitiesRequestParams.limit = parseInt(this.activitiesPaginationConfig.itemsPerPage);
      this.loadActivities()
    }

    if (tab == 'activityItems') {
      this.itemsPaginationConfig.itemsPerPage = parseInt(pageCount);
      this.purchaseRequestParams.skip = 0;
      this.itemsPaginationConfig.currentPage = 1;
      this.itemsRequestParams.limit = parseInt(this.itemsPaginationConfig.itemsPerPage);
      this.loadActivityItems()
    }

  }

  pageChanged(page: any, tab: any) {
    if (tab == 'purchases') {
      this.purchasePaginationConfig.currentPage = parseInt(page);
      this.purchaseRequestParams.skip = this.purchasePaginationConfig.itemsPerPage * (page - 1);
      this.purchaseRequestParams.limit = this.purchasePaginationConfig.itemsPerPage;
      this.loadTransactions()
    }
    if (tab == 'TransactionItems') {
      this.transactionItemPaginationConfig.currentPage = parseInt(page);
      this.transactionItemRequestParams.skip = this.transactionItemPaginationConfig.itemsPerPage * (page - 1);
      this.transactionItemRequestParams.limit = this.transactionItemPaginationConfig.itemsPerPage;
      this.loadTransactionItems()
    }
    if (tab == 'activities') {
      this.activitiesPaginationConfig.currentPage = parseInt(page);
      this.activitiesRequestParams.skip = this.activitiesPaginationConfig.itemsPerPage * (page - 1);
      this.activitiesRequestParams.limit = this.activitiesPaginationConfig.itemsPerPage;
      this.loadActivities()
    }
    if (tab == 'activityItems') {
      this.itemsPaginationConfig.currentPage = parseInt(page);
      this.itemsRequestParams.skip = this.itemsPaginationConfig.itemsPerPage * (page - 1);
      this.itemsRequestParams.limit = this.itemsPaginationConfig.itemsPerPage;
      this.loadActivityItems()
    }


  }

  customerCountryChanged(type: string, event: any) {
    this.customer[type].sCountryCode = event.key;
    this.customer[type].sCountry = event.value;

    if (this.customer[type].sCountryCode == 'UK' || this.customer[type].sCountryCode == 'GB' || this.customer[type].sCountryCode == 'FR') {
      this.bNormalOrder = false;
    } else {
      this.bNormalOrder = true;
    }
  }

  async checkAddress(addressBody: any) {
    const result: any = await this.apiService.postNew('customer', '/api/v1/customer/check-address', addressBody).toPromise();
    return result;
  }

  async EditOrCreateCustomer() {
    if ((this.customer.sLastName == "" || !this.customer.sLastName) && this.customer.sSalutation != 'FIRM') {
      this.toastService.show({ type: 'danger', text: this.translations[`LASTNAME_REQUIRED`] });
      return;
    }
    this.customer.iBusinessId = this.requestParams.iBusinessId;
    this.customer.iEmployeeId = this.iEmployeeId?.userId;
    if (this.customer?.bIsCompany) {
      this.customer.sFirstName = "";
      this.customer.sLastName = "";
      this.customer.sPrefix = "";
    }
    if (this.customer?.oShippingAddress?.sPostalCode) {
      let oShippingAddressPostalCode = this.customer?.oShippingAddress?.sPostalCode;
      oShippingAddressPostalCode = oShippingAddressPostalCode.replace(/[ ]+/g, "");
      oShippingAddressPostalCode = oShippingAddressPostalCode.trim();
      this.customer.oShippingAddress.sPostalCode = oShippingAddressPostalCode;
    }
    if (this.customer?.oInvoiceAddress?.sPostalCode) {
      let oInvoiceAddressPostalCode = this.customer?.oInvoiceAddress?.sPostalCode;
      oInvoiceAddressPostalCode = oInvoiceAddressPostalCode.replace(/[ ]+/g, "");
      oInvoiceAddressPostalCode = oInvoiceAddressPostalCode.trim();
      this.customer.oInvoiceAddress.sPostalCode = oInvoiceAddressPostalCode;
    }

    if (this.customer?.oPhone?.sMobile == "") this.customer.oPhone.sPrefixMobile = "";
    if (this.customer?.oPhone?.sLandLine == "") this.customer.oPhone.sPrefixLandline = "";
    
    /* We are updating the current customer [T, A, AI] and Not the System customer */
    if (this.editProfile && this.bIsCurrentCustomer && this.mode !== 'create') {
      this.close({ bShouldUpdateCustomer: true, oCustomer: this.customer });
      return;
    }

    if (this.mode == 'create') {
      const addressBody = {
        iBusinessId: this.requestParams.iBusinessId,
        oInvoiceAddress: this.customer?.oInvoiceAddress,
        oShippingAddress: this.customer?.oShippingAddress,
      }
      let bInvoiceAddressBlank = false;
      let bShippingAddressBlank = false;

      if (!this.customer.oInvoiceAddress?.sStreet && !this.customer.oInvoiceAddress?.sHouseNumberSuffix && !this.customer.oInvoiceAddress?.sPostalCode && !this.customer.oInvoiceAddress?.sHouseNumber)
        bInvoiceAddressBlank = true;

      if (!this.customer.oShippingAddress?.sStreet && !this.customer.oShippingAddress?.sHouseNumberSuffix && !this.customer.oShippingAddress?.sPostalCode && !this.customer.oShippingAddress?.sHouseNumber)
        bShippingAddressBlank = true;

      let addressesLength = 0;
      if (bInvoiceAddressBlank && bShippingAddressBlank) {
        addressesLength = 0;
      } else {
        const addresses = await this.checkAddress(addressBody);
        addressesLength = addresses?.data?.length;
      }

      if (addressesLength) {
        let confirmBtnDetails = [
          { text: "YES", value: 'success', status: 'success', class: 'btn-success me-3' },
          { text: "NO", value: 'close', class: 'btn-warning' }
        ];
        let bodyText = this.translateService.instant("CUSTOMER_WITH_ADDRESS_ALREADY_EXIST") + " (" + this.translateService.instant('CUSTOMERS_WITH_THIS_ADDRESS') + ': ' + addressesLength + ")";
        this.dialogService.openModal(ConfirmationDialogComponent, { context: { header: 'ADDRESS_ALREADY_EXISTS', bodyText: bodyText, buttonDetails: confirmBtnDetails }, hasBackdrop: false })
          .instance.close.subscribe((status: any) => {
            if (status == 'success') {
              this.apiService.postNew('customer', '/api/v1/customer/create', this.customer).subscribe(
                (result: any) => {
                  if (result.message == 'success') {
                    this.toastService.show({ type: 'success', text: this.translations[`SUCCESSFULLY_ADDED`] });
                    /* Updating current-customer in [A, T, AI] and Not the System customer */
                    if (this.editProfile && this.bIsCurrentCustomer) {
                      this.close({ bShouldUpdateCustomer: true, oCustomer: result.data });
                      return;
                    }
                    this.close({ action: true, customer: result.data });
                  } else {
                    let errorMessage = ""
                    this.translateService.get(result.message).subscribe(
                      result => errorMessage = result
                    )
                    this.toastService.show({ type: 'warning', text: errorMessage })
                  }
                },
                (error: any) => {
                  console.log(error.message);
                });
            } else {
              this.toastService.show({ type: 'warning', text: this.translations[`CUSTOMER_NOT_CREATED`] })
            }
          })
      } else {
        this.apiService.postNew('customer', '/api/v1/customer/create', this.customer).subscribe(
          (result: any) => {
            if (result.message == 'success') {
              this.toastService.show({ type: 'success', text: this.translations[`SUCCESSFULLY_ADDED`] });
              /* Updating current-customer in [A, T, AI] and Not the System customer */
              if (this.editProfile && this.bIsCurrentCustomer) {
                this.close({ bShouldUpdateCustomer: true, oCustomer: result.data });
                return;
              }
              this.close({ action: true, customer: result.data });
              if (this.oTemp) {
                const oDocumentsBody = {
                  aImage: this.oTemp?.aImage,
                  iCustomerId: result.data._id,
                  sDocumentName: this.oTemp?.sDocumentName,
                  sDocumentNumber: this.oTemp?.sDocumentNumber,
                  iBusinessId: this.requestParams.iBusinessId
                }
                this.apiService.postNew('JEWELS_AND_WATCHES', '/api/v1/document/create', oDocumentsBody).subscribe(
                  (result: any) => {
                  })
              }
            } else {
              let errorMessage = ""
              this.translateService.get(result.message).subscribe(
                result => errorMessage = result
              )
              this.toastService.show({ type: 'warning', text: errorMessage })
            }
          },
          (error: any) => {
            console.log(error.message);
          }
        );
      }
    }
    if (this.mode == 'details') {
      this.apiService.putNew('customer', '/api/v1/customer/update/' + this.requestParams.iBusinessId + '/' + this.customer._id, this.customer).subscribe(
        (result: any) => {
          if (result?.message === 'success') {
            this.toastService.show({ type: 'success', text: this.translations[`SUCCESSFULLY_UPDATED`] });
            this.fetchUpdatedDetails();
            this.close({ action: true });
            if (this.oTemp) {
              const oDocumentsBody = {
                aImage: this.oTemp?.aImage,
                iCustomerId: this.customer._id,
                sDocumentName: this.oTemp?.sDocumentName,
                sDocumentNumber: this.oTemp?.sDocumentNumber,
                iBusinessId: this.requestParams.iBusinessId
              }
              this.apiService.postNew('JEWELS_AND_WATCHES', '/api/v1/document/create', oDocumentsBody).subscribe(
                (result: any) => {
                })
            }
          }
          else {
            let errorMessage = "";
            this.translateService.get(result.message).subscribe((res: any) => {
              errorMessage = res;
            })
            this.toastService.show({ type: 'warning', text: errorMessage });
          }
        },
        (error: any) => {
          console.log(error.message);
        }
      );
    }
  }

  fetchUpdatedDetails() {
    this.apiService.postNew('customer', `/api/v1/customer/list`, this.requestParams)
      .subscribe((result: any) => {
        this.customer = result.data[0].result[0];

        this.bTransactionsLoader = false;
        this.bActivitiesLoader = false;
        this.bActivityItemsLoader = false;

        this.cdr.detectChanges();

        this.editProfile = false;
      },
        (error: any) => {
          console.error(error)
        }
      )
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  getCoreStatistics() {
    if (this.customer.bCounter) return;
    const dDate = new Date(new Date().setHours(0, 0, 0));
    dDate.setFullYear(dDate.getFullYear() - 1);
    const body = {
      iBusinessId: localStorage.getItem('currentBusiness'),
      oFilter: {
        iCustomerId: this.customer._id,
        sTransactionType: 'cash-registry',
        sDisplayMethod: 'revenuePerArticleGroup',
        dStartDate: dDate,
        dEndDate: new Date(new Date().setHours(23, 59, 59)),
        // dStartDate: "2022-09-10T13:59",
        // dEndDate: "2022-10-24T21:59:59.639Z",
      },
    };
    this.aStatisticsChartDataLoading = true;
    this.apiService
      .postNew('cashregistry', '/api/v1/statistics/transaction/audit', body)
      .subscribe(
        (result: any) => {
          if (result?.data?.oTransactionAudit?.[0]?.individual?.length) this.setAStatisticsChartData(result?.data?.oTransactionAudit?.[0]?.individual)
          if (result?.data?.aPaymentMethods?.length) this.aPaymentChartData = result?.data?.aPaymentMethods;
          if (result?.data?.aEmployeeStatistic?.length) this.aEmployeeStatistic = result?.data?.aEmployeeStatistic;
          if (result?.data?.oTransactionAudit?.[0]?.overall?.length) {
            this.nTotalTurnOver = result?.data?.oTransactionAudit?.[0]?.overall[0].nTotalRevenue;
            this.nAvgOrderValueIncVat = parseFloat((this.nTotalTurnOver / result?.data?.oTransactionAudit?.[0]?.overall[0].nQuantity).toFixed(2));
          }
          this.aStatisticsChartDataLoading = false;
        },
        (error: any) => {
          console.log(error);
          this.aStatisticsChartDataLoading = false;
        }
      );
  }

  setAStatisticsChartData(data: any[]) {
    const aStatisticsChartData: any[] = []
    data.map((item, index) => {
      let color: any = Object.entries(ChartColors)
      color = color[Math.floor(Math.random() * color.length)][1]
      let chartItem = {
        item: {
          element: {
            name: item.sName,
            data: [
              {
                x: item.sName,
                y: item.nTotalRevenue,
                info: [
                  { type: item.sName, value: item.nTotalRevenue }
                ]
              }
            ]
          },
          color: color
        }
      }
      aStatisticsChartData.push(chartItem)
    })
    this.aStatisticsChartData = aStatisticsChartData
    this.loadStatisticsTabData()
  }

  //  Function for set sort option on transaction table
  setSortOption(sortHeader: any) {
    if (sortHeader.selected) {
      sortHeader.sort = sortHeader.sort == 'asc' ? 'desc' : 'asc';
      this.sortAndLoadTransactions(sortHeader)
    } else {
      this.aTransctionTableHeaders = this.aTransctionTableHeaders.map((th: any) => {
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
    this.loadTransactions();
  }

  //  Function for set sort option on transaction item table
  setTransactionItemSortOption(sortHeader: any) {
    if (sortHeader.selected) {
      sortHeader.sort = sortHeader.sort == 'asc' ? 'desc' : 'asc';
      this.sortAndLoadTransactionItems(sortHeader)
    } else {
      this.aTransctionItemTableHeaders = this.aTransctionItemTableHeaders.map((th: any) => {
        if (sortHeader.key == th.key) {
          th.selected = true;
          th.sort = 'asc';
        } else {
          th.selected = false;
        }
        return th;
      })
      this.sortAndLoadTransactionItems(sortHeader)
    }
  }

  sortAndLoadTransactionItems(sortHeader: any) {
    let sortBy = 'dCreatedDate';
    if (sortHeader.key == 'Product no.') sortBy = 'sProductName';
    if (sortHeader.key == 'Description') sortBy = 'sDescription';
    if (sortHeader.key == 'Selling price') sortBy = 'nPaymentAmount';
    this.requestParams.sortBy = sortBy;
    this.requestParams.sortOrder = sortHeader.sort;
    this.loadTransactionItems();
  }



  getTypes(arr: any) {
    let str = '';
    if (arr && arr.length) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i]?.oArticleGroupMetaData?.sCategory) {
          if (!str) { str += (arr[i]?.oArticleGroupMetaData?.sCategory) }
          else { str += (', ' + arr[i]?.oArticleGroupMetaData?.sCategory) }
        }
      }
    }
    return str;
  }

  async loadTransactions() {
    if (this.customer.bCounter) return;
    this.requestParams.oFBy = {
      iCustomerId: this.mergeCustomerIdList
    }
    this.bTransactionsLoader = true;
    const body = {
      iCustomerId: this.customer._id,
      iBusinessId: this.requestParams.iBusinessId,
      skip: this.purchaseRequestParams.skip,
      limit: this.purchaseRequestParams.limit,
      oFilterBy: this.requestParams.oFBy,
      bIsDetailRequire: true // to fetch the extra details
    }
    this.apiService.postNew('cashregistry', '/api/v1/transaction/list', body).subscribe((result: any) => {
      if (result?.data?.result) {
        this.aTransactions = result.data.result || [];
        this.purchasePaginationConfig.totalItems = this.aTransactions.length;
        this.aTransactions.forEach(transaction => {
          transaction.sTotal = 0;
          transaction.aTransactionItems.forEach((item: any) => {
            
            if((item.bIsImported && !item.nPaymentAmount) || item.bMigrate)
              transaction.sTotal += parseFloat(item.nPriceIncVat);
            else 
              transaction.sTotal += parseFloat(item.nPaymentAmount);

            const count = this.totalActivities;
            if (item?.oType?.eKind && this.activityTitlesEkind.includes(item?.oType?.eKind)) this.totalActivities = count + item.nQuantity || 0;
            switch (item?.oType?.eKind) {
              case "regular":
                this.aActivityTitles[2].value += item.nQuantity;
                break;
              case "expenses":
                break;
              case "reservation":
                this.aActivityTitles[7].value += item.nQuantity;
                break;
              case "giftcard":
                this.aActivityTitles[5].value += item.nQuantity;
                break;
              case "empty-line":
                break;
              case "repair":
                this.aActivityTitles[0].value += item.nQuantity;
                break;
              case "order":
                this.aActivityTitles[1].value += item.nQuantity;
                break;
              case "gold-purchase":
                this.aActivityTitles[6].value += item.nQuantity;
                break;
              case "gold-sell":
                break;
              case "loyalty-points-discount":
                break;
              case "loyalty-points":
                break;
              case "discount":
                break;
              case "payment-discount":
                break;
            }
          })
        });
        this.purchasePaginationConfig.totalItems = result.data.totalCount;
        this.activitiesChartOptions = {
          series: this.aActivityTitles.map((el: any) => el.value),
          colors: this.aActivityTitles.map((el: any) => el.color),
          chart: {
            width: '75%',
            type: "pie"
          },
          title: {
            text: this.translateService.instant("NUMBER_OF_ACTIVITIES") + ` (${this.totalActivities})`,
            style: {
              fontWeight: 'bold',
            },
          },
          legend: {
            position: 'left',
            itemMargin: {
              horizontal: 15,
              vertical: 5
            },
            fontWeight: 600,
          },
          labels: this.aActivityTitles.map((el: any) => this.translateService.instant(el.name) + " (" + el.value + ") "),
        };
      }
      this.bTransactionsLoader = false;
    }, (error) => {
      this.bTransactionsLoader = false;
    })
  }
  loadTransactionItems() {
    if (this.customer.bCounter) return;
    this.bTransactionItemLoader = true;
    let data = {
      iCustomerId: this.customer._id,
      iTransactionId: 'all',
      skip: this.transactionItemRequestParams.skip,
      limit: this.transactionItemRequestParams.limit,
      sFrom: 'customer',
      oFilterBy: {},
      iBusinessId: this.requestParams.iBusinessId
    };
    this.apiService.postNew('cashregistry', '/api/v1/transaction/item/list', data).subscribe((result: any) => {
      if (result?.data) {
        this.aTransactionItems = result.data[0].result || [];
        this.transactionItemPaginationConfig.totalItems = result.data[0].count.totalData;
      }
      this.bTransactionItemLoader = false;
    }, (error) => {
      this.bTransactionItemLoader = false;
    })
  }
  listEmployee() {
    this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.requestParams.iBusinessId }).subscribe((result: any) => {
      if (result?.data?.length && result.data[0].result?.length) {
        this.employees = result.data[0].result
      }
    })
  }

  loadActivities() {
    this.listEmployee();
    if (this.customer.bCounter) return;
    this.aActivities = [];
    this.bActivitiesLoader = true;
    let oBody: any = { ... this.requestParams, ... this.activitiesRequestParams };
    delete oBody.oFilterBy._id;

    this.apiService.postNew('cashregistry', '/api/v1/activities', oBody).subscribe((result: any) => {
      this.aActivities = result.data || [];
      this.activitiesPaginationConfig.totalItems = result.count;
      this.bActivitiesLoader = false;
    }, (error) => {
      this.bActivitiesLoader = false;
    })

  }

  loadActivityItems() {
    if (this.customer.bCounter) return;
    this.bActivityItemsLoader = true;
    let oBody: any = { ... this.requestParams, ...this.itemsRequestParams };
    delete oBody.oFilterBy._id;
    this.apiService.postNew('cashregistry', '/api/v1/activities/items', oBody).subscribe(
      (result: any) => {
        this.aActivityItems = result.data || [];
        this.itemsPaginationConfig.totalItems = result.count;
        this.bActivityItemsLoader = false;
      },
      (error: any) => {
        this.bActivityItemsLoader = false;
      })
  }



  loadStatisticsTabData() {
    if (this.customer.bCounter) return;
    this.statisticsChartOptions = {
      series: this.aStatisticsChartData.map((el: any) => el.item.element),
      colors: this.aStatisticsChartData.map((el: any) => el.item.color),
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
          let data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];

          let html = `<div>
                        <div style="background:#dbf0eb;padding:10px">${data.x}</div>
                        <ul style='list-style-type:circle;padding:5px 15px;margin:5px;line-height:1.5'>`;
          data.info.forEach((el: any) => {
            html += `<li>
                        <span>${el.type}:<span>
                        <span style="margin:10px 5px;font-weight:bold"> € ${el.value}</span>
                    </li>`;
          });
          html += `</ul><div>`;

          return html;
        }
      },
      chart: {
        type: "bar",
        height: 350,

      },
      dataLabels: {
        enabled: true,
        style: {
          'fontSize': '15px'
        }
      },
      yaxis: {
        title: {
          text: this.translateService.instant("REVENUE"),
          style: {
            'fontSize': '15px'
          }
        },
        labels: {
          formatter: function (y: any) {
            return "\u20AC" + y.toFixed(0)
          }
          ,
          style: {
            'fontSize': '15px'
          }
        },
      },
      xaxis: {
        type: 'category'
      }
    };

    this.paymentMethodsChartOptions = {
      series: this.aPaymentChartData.map((el: any) => el.nAmount),
      chart: {
        width: '100%',
        type: "pie"
      },
      title: {
        text: this.translateService.instant("PAYMENT_METHODS"),
        style: {
          fontWeight: 'bold',
        },
      },
      legend: {
        position: 'left',
        itemMargin: {
          horizontal: 15,
          vertical: 5
        },
        fontWeight: 600,
      },
      labels: this.aPaymentChartData.map((el: any) => `${el.sMethod} (${el.nAmount})`),
      options: {

      }
    };
  }

  async showActivityItem(activityItem: any, event: any) {
    const oBody = {
      iBusinessId: this.requestParams.iBusinessId,
    }
    activityItem.bFetchingActivityItem = true;
    event.target.disabled = true;
    const aActivityItem: any = [];
    if (this.aActivityItems?.length) {
      const items = this.aActivityItems.filter((AI: any) => AI._id == activityItem.iActivityItemId);
      aActivityItem.push(items[0]);
    } else {
      const items: any = await this.apiService.postNew('cashregistry', `/api/v1/activities/activity-item/${activityItem.iActivityItemId}`, oBody).toPromise();
      aActivityItem.push(items?.data[0].result[0])
    }
    activityItem.bFetchingActivityItem = false;
    event.target.disabled = false;
    this.dialogService.openModal(ActivityDetailsComponent, { cssClass: 'w-fullscreen', context: { activityItems: aActivityItem, businessDetails: this.businessDetails, items: true, from: 'transaction-details' } })
      .instance.close.subscribe((result: any) => { });
  }

  // Function for show transaction details
  showTransaction(transaction: any) {
    this.dialogService.openModal(TransactionDetailsComponent, { cssClass: "modal-xl", context: { transaction: transaction, businessDetails: this.businessDetails, eType: 'cash-register-revenue', from: 'customer' } })
      .instance.close.subscribe(
        (res: any) => {
          // console.log({res});
          if (res?.action) {
            this.close(false);
            this.router.navigate(['business/till']);
          }
        });
  }
  openActivityItems(activity: any, openActivityId?: any) {
    this.dialogService.openModal(ActivityDetailsComponent,
      {
        cssClass: 'modal-xl',
        //hasBackdrop: true,
        // closeOnBackdropClick: true,
        //closeOnEsc: true,
        context: {
          activityItems: [activity],
          businessDetails: this.businessDetails,
          openActivityId,
          items: true,
          employeesList: this.employees,
          from: 'activity-items'
        }
      }).instance.close.subscribe((result) => {
        if (result?.oData?.oCurrentCustomer) {
          if (result?.oData?.oCurrentCustomer?.sFirstName) activity.oCustomer.sFirstName = result?.oData?.oCurrentCustomer?.sFirstName;
          if (result?.oData?.oCurrentCustomer?.sLastName) activity.oCustomer.sLastName = result?.oData?.oCurrentCustomer?.sLastName;
          if (result?.oData?.oCurrentCustomer?.sCompanyName) activity.oCustomer.sCompanyName = result?.oData.oCurrentCustomer?.sCompanyName
          if (result?.oData?.oCurrentCustomer?.bIsCompany) activity.oCustomer.bIsCompany = result?.oData.oCurrentCustomer?.bIsCompany
        }
      }, (error) => {
        console.log('Error here');
      });
  }

  openActivities(activity: any, openActivityId?: any) {
    if (this.webOrders) {
      let isFrom = this.router.url.includes('/business/webshop-orders') ? 'web-orders' : 'web-reservations';
      this.dialogService.openModal(WebOrderDetailsComponent, { cssClass: 'w-fullscreen', context: { activity, businessDetails: this.businessDetails, from: isFrom } })
        .instance.close.subscribe(result => {
          if (this.webOrders && result) this.router.navigate(['business/till']);
        });
    } else {
      this.dialogService.openModal(ActivityDetailsComponent, {
        cssClass: 'modal-xl',
        //hasBackdrop: true,
        //closeOnBackdropClick: true,
        // closeOnEsc: true,
        context: {
          activity,
          businessDetails: this.businessDetails,
          openActivityId,
          items: false,
          webOrders: this.webOrders,
          from: 'services',
          employeesList: this.employees
        }
      }).instance.close.subscribe(result => {
        if (this.webOrders && result) this.router.navigate(['business/till']);
      });
    }
  }



  async fetchLoyaltyPoints() {
    if (this.customer.bCounter) return;
    if (this.customer?._id && this.customer._id != '') {
      const nPointsResult: any = await this.apiService.getNew('cashregistry', `/api/v1/points-settings/points?iBusinessId=${this.requestParams.iBusinessId}&iCustomerId=${this.customer._id}`).toPromise();
      this.oPointsSettingsResult = await this.apiService.getNew('cashregistry', `/api/v1/points-settings?iBusinessId=${this.requestParams.iBusinessId}`).toPromise();
      this.customer.nLoyaltyPoints = nPointsResult;
      this.customer.nLoyaltyPointsValue = nPointsResult / this.oPointsSettingsResult.nPerEuro2;
    }
  }

  copyInvoiceAddressToShipping() {
    const invoiceAddress = {
      sStreet: this.customer.oInvoiceAddress.sStreet,
      sHouseNumber: this.customer.oInvoiceAddress.sHouseNumber,
      sHouseNumberSuffix: this.customer.oInvoiceAddress.sHouseNumberSuffix,
      sPostalCode: this.customer.oInvoiceAddress.sPostalCode,
      sCity: this.customer.oInvoiceAddress.sCity,
      sCountry: this.customer.oInvoiceAddress.sCountry,
      sCountryCode: this.customer.oInvoiceAddress.sCountryCode,
      sState: this.customer.oInvoiceAddress.sState
    }
    this.customer.oShippingAddress = {
      ...this.customer.oShippingAddress,
      ...invoiceAddress
    }
  }

  onlyLetters(event: any) {
    let charCode = event.keyCode;
    let pattern = /[0-9]/;
    let char = String.fromCharCode(charCode);
    //console.log(char, ' - ', charCode, ' - ', String.fromCharCode(charCode),' - ', pattern.test(char) || (charCode >= 96 && charCode <= 105 ));
    // invalid character, prevent input
    if (pattern.test(char) || (charCode >= 96 && charCode <= 105)) {
      event.preventDefault();
      this.toastService.show({ type: 'warning', text: this.translations['ONLY_LETTERS_ARE_ALLOWED'] });
    }
  }

  removeSpaces(string: string) {
    return string.replace(/\s/g, '');
  }
}
