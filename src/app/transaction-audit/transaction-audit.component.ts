import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
import { TransactionAuditUiPdfService } from '../shared/service/transaction-audit-pdf.service';
import { MenuComponent } from '../shared/_layout/components/common';
import { ChildChild, DisplayMethod, eDisplayMethodKeysEnum, View, ViewMenuChild } from './transaction-audit.model';
import { TaxService } from '../shared/service/tax.service';

@Component({
  selector: 'app-transaction-audit',
  templateUrl: './transaction-audit.component.html',
  styleUrls: ['./transaction-audit.component.scss'],
  providers: [TransactionAuditUiPdfService]
})
export class TransactionAuditComponent implements OnInit, AfterViewInit, OnDestroy {

  iBusinessId: any = '';
  sUserType: any = '';
  iLocationId: any = '';
  iStatisticId: any;
  aLocation: any = [];
  aStatistic: any = [];
  oUser: any = {};
  aSelectedLocation: any = [];
  selectedWorkStation: any = [];
  selectedEmployee: any = {};
  propertyOptions: Array<any> = [];
  selectedProperties: any;
  aProperty: Array<any> = [];
  aFilterProperty: Array<any> = [];
  IsDynamicState: boolean = false;
  aWorkStation: any = [];
  aEmployee: any = [];
  aPaymentMethods: any = [];
  aDayClosure: any = [];
  oStockPerLocation: any = [];

  closingDayState: boolean = false;
  bShowDownload: boolean = false;

  closeSubscription!: Subscription;
  dayClosureListSubscription !: Subscription;

  statisticsData$: any;
  businessDetails: any = {};
  statistics: any;
  optionMenu = 'sales-order';
  statisticFilter = {
    isArticleGroupLevel: true,
    isProductLevel: false,
    dFromState: '',
    dToState: '',
    // dFromState: new Date(new Date().setHours(0, 0, 0)),
    // dToState: new Date(new Date().setHours(23, 59, 59))
  };
  filterDates = {
    startDate: new Date(new Date().setHours(0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59)),
  };
  bIsArticleGroupLevel: boolean = true; // Could be Article-group level or product-level (if false then article-group mode)
  bIsSupplierMode: boolean = true; // could be Business-owner-mode or supplier-mode (if true then supplier-mode)
  edisplayMethodKeysEnum = eDisplayMethodKeysEnum
  creditAmount = 0;
  debitAmount = 0;
  paymentCreditAmount = 0;
  paymentDebitAmount = 0;
  bStatisticLoading: boolean = false;
  bIsCollapseItem: boolean = false;
  stastitics = { totalRevenue: 0, quantity: 0 };
  bookkeeping = { totalAmount: 0 };
  bookingRecords: any;
  paymentRecords: any;

  payMethods: any;
  allPaymentMethod: any;
  paymentEditMode: boolean = false;
  nPaymentMethodTotal: number = 0;
  nNewPaymentMethodTotal: number = 0;
  bInvalidNewTotal: boolean = false;

  aNewSelectedPaymentMethods: any = [];

  oStatisticsData: any = {};
  oStatisticsDocument: any;

  listBusinessSubscription!: Subscription;
  getStatisticSubscription!: Subscription;
  statisticAuditSubscription!: Subscription;
  greenRecordsSubscription!: Subscription;
  propertyListSubscription!: Subscription;
  workstationListSubscription!: Subscription;
  employeeListSubscription!: Subscription;
  transactionItemListSubscription!: Subscription;
  sCurrentLocation: any;
  sCurrentWorkstation: any;
  pdfGenerationInProgress: boolean = false;
  bShowProperty: boolean = false;
  bDisableCountings: boolean = false;

  groupingHelper(item: any) {
    return item.child[0];
  }

  aOptionMenu: View[] = [];
  public sOptionMenu: {
    parent: View,
    child1: ViewMenuChild,
    child2: ChildChild,
  } = {} as {
    parent: View,
    child1: ViewMenuChild,
    child2: ChildChild,
  };
  public sSelectedOptionMenu = '';

  aVatRateMethod: any = [
    'oShopPurchase',
    'oWebShop',
    'oDeliverySupplier',
    'oDeliveryRetailer',
    'oSalesOrderSupplier',
  ];

  aDisplayMethod: DisplayMethod[] = [
    {
      sKey: eDisplayMethodKeysEnum.revenuePerBusinessPartner,
      sValue: 'Supplier And Article-Group And Dynamic Property',
    },
    {
      // sKey: 'revenuePerArticleGroupAndProperty',
      sKey: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
      sValue: 'Article Group and Dynamic Property',
    },
    {
      sKey: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup, // Use the revenuePerBusinessPartner and Remove the Dynamic Property
      sValue: 'Supplier And Article-Group',
    },
    {
      sKey: eDisplayMethodKeysEnum.revenuePerProperty,
      sValue: 'Revenue Per Property',
    },
    {
      sKey: eDisplayMethodKeysEnum.revenuePerArticleGroup, // Use the revenuePerArticleGroupAndProperty and remove the Dynamic Property
      sValue: 'Article Group',
    },
    {
      sKey: eDisplayMethodKeysEnum.aVatRates,
      sValue: 'Vat Rates',
    },
  ];
  sDisplayMethod: eDisplayMethodKeysEnum = eDisplayMethodKeysEnum.revenuePerBusinessPartner

  aAmount: any = [
    { sLabel: '500.00', nValue: 500, nQuantity: 0, key: 'nType500' },
    { sLabel: '200.00', nValue: 200, nQuantity: 0, key: 'nType200' },
    { sLabel: '100.00', nValue: 100, nQuantity: 0, key: 'nType100' },
    { sLabel: '50.00', nValue: 50, nQuantity: 0, key: 'nType50' },
    { sLabel: '20.00', nValue: 20, nQuantity: 0, key: 'nType20' },
    { sLabel: '10.00', nValue: 10, nQuantity: 0, key: 'nType10' },
    { sLabel: '5.00', nValue: 5, nQuantity: 0, key: 'nType5' },
    { sLabel: '2.00', nValue: 2, nQuantity: 0, key: 'nType2' },
    { sLabel: '1.00', nValue: 1, nQuantity: 0, key: 'nType1' },
    { sLabel: '0.50', nValue: 0.5, nQuantity: 0, key: 'nType0_5' },
    { sLabel: '0.20', nValue: 0.2, nQuantity: 0, key: 'nType0_2' },
    { sLabel: '0.10', nValue: 0.1, nQuantity: 0, key: 'nType0_1' },
    { sLabel: '0.05', nValue: 0.05, nQuantity: 0, key: 'nType0_05' },
  ];

  oCountings: any = {
    nCashCounted: 0,
    nCashInTill: 0,
    nSkim: 0,
    nCashDifference:0,
    nCashRemain: 0,
    nCashAtStart: 0,
    oCountingsCashDetails: {},
  };
  aRefundItems: any;
  aDiscountItems: any;
  aRepairItems: any;
  iWorkstationId: string | null;
  aGoldPurchases: any;
  aGiftItems: any;
  previousPage = 0

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private location: Location,
    public transactionAuditPdfService: TransactionAuditUiPdfService,
    private taxService: TaxService

  ) {
    
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
    this.sUserType = localStorage.getItem('type') || '';
    const _oUser = localStorage.getItem('currentUser');
    if (_oUser) this.oUser = JSON.parse(_oUser);
    this.previousPage = this.route?.snapshot?.queryParams?.page || 0

    this.iStatisticId = this.route.snapshot?.params?.iStatisticId;
    if (this.iStatisticId) {
      this.oStatisticsData.dStartDate = this.router.getCurrentNavigation()?.extras?.state?.dStartDate ?? null;
      this.oStatisticsData.dEndDate = this.router.getCurrentNavigation()?.extras?.state?.dEndDate ?? null;
      this.oStatisticsData.bIsDayStateOpened = this.router.getCurrentNavigation()?.extras?.state?.bIsDayStateOpened ? true : false;
      if (this.oStatisticsData.dStartDate) {
        this.filterDates.startDate = this.oStatisticsData.dStartDate;
        const endDate = (this.oStatisticsData.dEndDate) ? this.oStatisticsData.dEndDate : new Date();
        this.filterDates.endDate = endDate;
        this.oStatisticsData.dEndDate = endDate;
      } else {
        this.router.navigate(['/business/day-closure'])
      }
    }
  }

  async ngOnInit() {
    this.apiService.setToastService(this.toastService);
    this.businessDetails._id = localStorage.getItem('currentBusiness');
    this.setOptionMenu()

    const [_businessData, _workstationData, _employeeData]: any = await Promise.all([
      this.fetchBusinessDetails(),
      this.getWorkstations(),
      this.getEmployees()
    ])

    this.businessDetails = _businessData.data;

    if (_workstationData && _workstationData.data?.length) {
      this.aWorkStation = _workstationData.data;
      this.sCurrentWorkstation = this.aWorkStation.filter((el: any) => el._id === this.iWorkstationId)[0]?.sName;
    }

    if (_employeeData?.data?.length) {
      this.aEmployee = _employeeData.data[0].result;
    }

    this.fetchStatistics(this.sDisplayMethod.toString()); /* Only for view or dynamic or static document */

    this.fetchBusinessLocation();
    this.getProperties();
    this.getPaymentMethods();
    
    setTimeout(() => {
      MenuComponent.bootstrap();
    }, 200);
  }

  ngAfterViewInit(): void {
  }

  setOptionMenu() {
    this.aOptionMenu = [
      {
        sKey: 'SALES',
        sValue: 'cash-registry',
        children: [
          {
            sKey: 'ArticleGroup',
            sValue: this.translate.instant('ARTICLE GROUP'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
                  modeFilter: 'supplier',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
          {
            sKey: 'Bookkeeping',
            sValue: this.translate.instant('BOOKKEEPING'),
            children: [
              {
                sKey: 'Vat rates',
                sValue: this.translate.instant('VAT_RATES'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates,
                }
              },
              {
                sKey: 'Revenue per',
                sValue: this.translate.instant('REVENUE_PER'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerProperty
                }
              },
              {
                sKey: 'Article group',
                sValue: this.translate.instant('ARTICLE_GROUP'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates
                }
              },
            ]
          },
          {
            sKey: 'Supplier',
            sValue: this.translate.instant('SUPPLIER'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerBusinessPartner,
                  modeFilter: 'supplier',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
          {
            sKey: 'Manager',
            sValue: this.translate.instant('MANAGER'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'businessOwner',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
                  modeFilter: 'businessOwner',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
        ],
      },
      {
        sKey: 'PURCHASE',
        sValue: 'purchase-order',
        children: [
          {
            sKey: 'ArticleGroup',
            sValue: this.translate.instant('ARTICLE GROUP'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
                  modeFilter: 'supplier',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
          {
            sKey: 'Bookkeeping',
            sValue: this.translate.instant('BOOKKEEPING'),
            children: [
              {
                sKey: 'Vat rates',
                sValue: this.translate.instant('VAT_RATES'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates,
                }
              },
              {
                sKey: 'Revenue per',
                sValue: this.translate.instant('REVENUE_PER'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerProperty
                }
              },
              {
                sKey: 'Article group',
                sValue: this.translate.instant('ARTICLE_GROUP'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates
                }
              },
            ]
          },
          {
            sKey: 'Supplier',
            sValue: this.translate.instant('SUPPLIER'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerBusinessPartner,
                  modeFilter: 'supplier',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
          {
            sKey: 'Manager',
            sValue: this.translate.instant('MANAGER'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'businessOwner',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
                  modeFilter: 'businessOwner',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
        ],
      },
      {
        sKey: 'SALES_ORDERS',
        sValue: 'sales-order',
        children: [
          // ArticleGroup
          {
            sKey: 'ArticleGroup',
            sValue: this.translate.instant('ARTICLE GROUP'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
                  modeFilter: 'supplier',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
          {
            sKey: 'Bookkeeping',
            sValue: this.translate.instant('BOOKKEEPING'),
            children: [
              {
                sKey: 'Vat rates',
                sValue: this.translate.instant('VAT_RATES'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates,
                }
              },
              {
                sKey: 'Revenue per',
                sValue: this.translate.instant('REVENUE_PER'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerProperty
                }
              },
              {
                sKey: 'Article group',
                sValue: this.translate.instant('ARTICLE_GROUP'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates
                }
              },
            ]
          },
          {
            sKey: 'Supplier',
            sValue: this.translate.instant('SUPPLIER'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerBusinessPartner,
                  modeFilter: 'supplier',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
          {
            sKey: 'Manager',
            sValue: this.translate.instant('MANAGER'),
            children: [
              {
                sKey: 'Compact',
                sValue: this.translate.instant('COMPACT'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'businessOwner',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translate.instant('SPECIFIC'),
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroupAndProperty,
                  modeFilter: 'businessOwner',
                  levelFilter: 'articleGroup'
                }
              }
            ]
          },
        ],
      },
    ]

    const eUserType = localStorage.getItem('type') ?? ''
    if (eUserType && eUserType.toLowerCase() !== 'supplier') {
      let iPurchaseIndex = this.aOptionMenu.findIndex(i => i.sValue.toLowerCase() === 'sales-order')
      this.aOptionMenu.splice(iPurchaseIndex, 1)
    }
    this.onDropdownItemSelected(this.aOptionMenu[0], this.aOptionMenu[0].children[0], this.aOptionMenu[0].children[0].children[0])
  }

  goBack() {
    if (this.previousPage) {
      this.router.navigateByUrl('/business/day-closure/list?page=' + this.previousPage, {
        replaceUrl: true,
      })
      return
    }
    this.location.back()
  }

  onDropdownItemSelected(parent: View, child1: ViewMenuChild, child2: ChildChild) {
    this.bShowProperty = false;
    this.sOptionMenu = {
      parent,
      child1,
      child2,
    }
    this.optionMenu = parent.sValue.toLowerCase().trim();
    this.sSelectedOptionMenu = `${parent.sKey}->${child1.sKey}->${child2.sKey}`;
    if (child2?.sValue == 'REVENUE_PER' || child2?.sValue == "SPECIFIC") this.bShowProperty = true;
    const eDisplayMethod = child2.data?.displayMethod || null
    const sModeFilter = child2.data?.modeFilter || null
    const sLevelFilter = child2.data?.levelFilter || null

    if (eDisplayMethod) {
      this.sDisplayMethod = eDisplayMethod
    }
    if (sModeFilter) {
      this.bIsSupplierMode = sModeFilter === "supplier"
    }
    if (sLevelFilter) {
      this.bIsArticleGroupLevel = sLevelFilter === "articleGroup"
    }


  }

  fetchBusinessLocation() {
    if (!this.oUser?.userId) return;
    this.listBusinessSubscription = this.apiService.postNew('core', `/api/v1/business/${this.iBusinessId}/list-location`, { iBusinessId: this.iBusinessId, }).subscribe((result: any) => {
      if (result?.data?.aLocation?.length) {
        this.aLocation = result.data.aLocation;
        this.fetchStockValuePerLocation();
        this.sCurrentLocation = result?.data?.sName;
        this.aLocation.forEach((oLocation: any) => {
          if (oLocation._id === this.iLocationId) {
            this.transactionAuditPdfService.selectCurrency(oLocation);
            this.sCurrentLocation += " (" + oLocation?.sName + ")";
            this.aSelectedLocation.push(oLocation._id);
          }
        });

      }
    },
      (error) => {
        console.log('error: ', error);
      }
    );
  }

  displayMethodChange() {
    this.aStatistic = [];
  }

  /* Countings Code (KK) */
  processCounting() {
    this.oCountings.nCashAtStart = this.oStatisticsDocument?.oCountings?.nCashAtStart || 0;
    this.oCountings.nCashCounted = this.oStatisticsDocument?.oCountings?.nCashCounted || 0;
    this.oCountings.nSkim = this.oStatisticsDocument?.oCountings?.nSkim || 0;
    this.oCountings.nCashRemain = this.oStatisticsDocument?.oCountings?.nCashRemain || 0;
    this.oCountings.nCashDifference = this.oStatisticsDocument?.oCountings?.nCashDifference || 0;
    this.bDisableCountings = !this.oStatisticsDocument.bIsDayState;
    if (this.aStatistic?.length && this.aStatistic[0]?.overall?.length) {
      this.aStatistic[0].overall[0].nTotalRevenue = parseFloat(this.aStatistic[0].overall[0].nTotalRevenue.toFixed(2))
      this.oCountings.nCashInTill = this.aStatistic[0].overall[0].nTotalRevenue;
    }
    
    let aKeys: any = [];
    if (this.oStatisticsDocument?.oCountings?.oCountingsCashDetails) aKeys = Object.keys(this.oStatisticsDocument?.oCountings?.oCountingsCashDetails);
    if (aKeys?.length) {
      this.aAmount.map((item: any) => {
        if (aKeys.includes(item.key)) {
          item.nQuantity = this.oStatisticsDocument?.oCountings?.oCountingsCashDetails[item.key];
        }
      });
    }
  }

  fetchStatistics(sDisplayMethod?: string) {
    if (this.iStatisticId) this.fetchDayClosureData(sDisplayMethod);
    else this.fetchAuditStatistic(sDisplayMethod);
  }

  /* (Only, for Viewing statistic) Day-closure view whenever we will have the iStatisticId */
  fetchDayClosureData(sDisplayMethod?: string) {
    /* If not closed yet then we require both data static as well and dynamic */
    if (this.oStatisticsData.bIsDayStateOpened) {
      this.getStaticData(sDisplayMethod);
      this.getDynamicData(sDisplayMethod);
    } else {
      /* Already closed then we can get all the data from one API only */
      this.getStaticData(sDisplayMethod);
    }
  }

  /* Fetch Audit (Be it Static or Dynamic), where user can change filter as well */
  fetchAuditStatistic(sDisplayMethod?: string) {
    if (this.IsDynamicState) this.getDynamicData(sDisplayMethod);
    else this.getStaticData(sDisplayMethod);
  }

  /* Static Data for statistic (from statistic document) */
  getStaticData(sDisplayMethod?: string) {
    this.aStatistic = [];
    this.aPaymentMethods = [];
    this.bStatisticLoading = true;

    let aLocation = this?.aSelectedLocation?.length ? this.aSelectedLocation : [];
    let iWorkstationId = this.selectedWorkStation?.length ? this.selectedWorkStation : [];
    if (this.iStatisticId) {
      /* It's only for view purpose and we can only view for the current location and current workstation */
      aLocation = [this.iLocationId];
      iWorkstationId = [this.iWorkstationId]
    }

    const oBody: any = {
      iBusinessId: this.iBusinessId,
      iStatisticId: this.iStatisticId,
      oFilter: {
        aLocationId: aLocation,
        // iWorkstationId: iWorkstationId,
        sTransactionType: this.optionMenu,
        sDisplayMethod: sDisplayMethod || this.sDisplayMethod.toString(),
        dStartDate: this.statisticFilter.dFromState,
        dEndDate: this.statisticFilter.dToState,
        aFilterProperty: this.aFilterProperty,
        bIsArticleGroupLevel: true,
        bIsSupplierMode: true,
      }
    }

    if (this.IsDynamicState) {
      oBody.oFilter.bIsArticleGroupLevel = this.bIsArticleGroupLevel;
      oBody.oFilter.bIsSupplierMode = this.bIsSupplierMode;
    }

    // this.checkShowDownload();
    this.fetchDayClosureList();
    this.getStatisticSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/list`, oBody).
      subscribe((result: any) => {
        this.bStatisticLoading = false;
        if (result?.data) {
          const oData = result?.data;
          if (oData.aStatistic?.length) this.aStatistic = oData.aStatistic;
          if (oData?.oStatistic?._id) {
            if (oData?.oStatistic?.aPaymentMethods?.length) {
              this.mappingThePaymentMethod(oData?.oStatistic);
              // this.aPaymentMethods = oData?.oStatistic?.aPaymentMethods; /* old approach */
            }
            this.oStatisticsDocument = oData?.oStatistic;
            this.iWorkstationId = this.oStatisticsDocument.iWorkstationId;
            // console.log('this.iWorkstationId', this.iWorkstationId, this.oStatisticsDocument.iWorkstationId, this.oStatisticsDocument)
            this.sCurrentWorkstation = this.aWorkStation.filter((el: any) => el._id === this.iWorkstationId)[0]?.sName;
            // console.log('current=', this.sCurrentWorkstation);
            if (!this.oStatisticsDocument?.sComment) this.oStatisticsDocument.sComment = '';
            this.processCounting();
          }
        }
      }, (error) => {
        this.bStatisticLoading = false;
        console.log('error: ', error);
      });
  }

  mappingThePaymentMethod(oData: any) {
    if (oData.aPaymentMethods?.length) {
      this.nPaymentMethodTotal = 0;
      this.nNewPaymentMethodTotal = 0;

      this.aPaymentMethods = oData.aPaymentMethods;
      this.aPaymentMethods.map((item: any) => {
        item.nNewAmount = item.nAmount;
        this.nPaymentMethodTotal += parseFloat(item.nAmount);
        return item;
      });
      this.nNewPaymentMethodTotal = this.nPaymentMethodTotal;
      this.filterDuplicatePaymentMethods();
    }
  }

  processingDynamicDataRequest(sDisplayMethod?: string) {
    let aLocation = this?.aSelectedLocation?.length ? this.aSelectedLocation : [];
    let iWorkstationId = this.selectedWorkStation?.length ? this.selectedWorkStation : undefined;
    if (this.iStatisticId) {
      /* It's only for view purpose and we can only view for the current location and current workstation */
      aLocation = [this.iLocationId];
      iWorkstationId = this.iWorkstationId
    }
    const oBody = {
      iBusinessId: this.iBusinessId,
      oFilter: {
        aLocationId: aLocation,
        iWorkstationId: iWorkstationId,
        iEmployeeId: this.selectedEmployee?._id,
        sTransactionType: this.optionMenu,
        sDisplayMethod: sDisplayMethod || this.sDisplayMethod.toString(),
        dStartDate: this.filterDates.startDate,
        dEndDate: this.filterDates.endDate,
        aFilterProperty: this.aFilterProperty,
        bIsArticleGroupLevel: true,
        bIsSupplierMode: true
      },
    };

    if (this.IsDynamicState) {
      oBody.oFilter.bIsArticleGroupLevel = this.bIsArticleGroupLevel;
      oBody.oFilter.bIsSupplierMode = this.bIsSupplierMode;
    }

    return oBody;
  }

  /* Dynamic Data for statistic (from transaction-item) */
  getDynamicData(sDisplayMethod?: string) {

    /* Below for Dynamic-data */
    this.checkShowDownload();
    const oBody = this.processingDynamicDataRequest(sDisplayMethod);
    this.bStatisticLoading = true;
    this.statisticAuditSubscription = this.apiService
      .postNew('cashregistry', `/api/v1/statistics/transaction/audit`, oBody).subscribe((result: any) => {
        this.bStatisticLoading = false;
        if (result?.data) {

          if (result.data?.oTransactionAudit?.length)
            this.aStatistic = result.data.oTransactionAudit;

          if (this.aStatistic?.length && this.aStatistic[0]?.overall?.length) {
            this.aStatistic[0].overall[0].nTotalRevenue = parseFloat(this.aStatistic[0].overall[0].nTotalRevenue.toFixed(2))
            this.oCountings.nCashInTill = this.aStatistic[0].overall[0].nTotalRevenue;
          }
          this.mappingThePaymentMethod(result?.data);
        }
      },
        (error) => {
          this.bStatisticLoading = false;
          this.aStatistic = [];
          this.aPaymentMethods = [];
        }
      );
    this.getGreenRecords();
  }

  resetValues() {
    this.creditAmount = 0;
    this.debitAmount = 0;
    this.paymentCreditAmount = 0;
    this.paymentDebitAmount = 0;
    this.paymentRecords = [];
    this.bookingRecords = [];
  }

  getGreenRecords() {
    this.resetValues();
    const tempBookName = this.optionMenu;
    const body = {
      startDate: this.filterDates.startDate,
      endDate: this.filterDates.endDate,
      bookName: tempBookName,
    };
    this.greenRecordsSubscription = this.apiService
      .postNew(
        'bookkeeping',
        `/api/v1/bookkeeping/booking/records?iBusinessId=${this.iBusinessId}`,
        body
      )
      .subscribe(
        (result: any) => {
          this.bookingRecords = result.filter(
            (o: any) => o.sBookName === tempBookName
          );
          this.paymentRecords = result.filter(
            (o: any) => o.sBookName === 'payment-book'
          );
          this.bookingRecords.forEach((book: any) => {
            if (book.eType === 'credit') {
              this.creditAmount += book.nValue;
            } else {
              this.debitAmount += book.nValue;
            }
          });
          this.paymentRecords.forEach((book: any) => {
            if (book.eType === 'credit') {
              this.paymentCreditAmount += book.nValue;
            } else {
              this.paymentDebitAmount += book.nValue;
            }
          });
        },
        (error) => { }
      );
  }

  onChanges(changes: string) {
    this.getGreenRecords();
  }

  getProperties() {
    this.selectedProperties = [];
    let data = {
      skip: 0,
      limit: 100,
      sortBy: '',
      sortOrder: '',
      searchValue: '',
      oFilterBy: {},
      iBusinessId: localStorage.getItem('currentBusiness'),
    };

    this.propertyListSubscription = this.apiService
      .postNew('core', '/api/v1/properties/list', data)
      .subscribe((result: any) => {
        if (result?.data && result?.data[0]?.result?.length) {
          result.data[0].result.map((property: any) => {
            if (typeof this.propertyOptions[property._id] == 'undefined') {
              this.propertyOptions[property._id] = [];

              property.aOptions.map((option: any) => {
                if (option?.sCode?.trim() != '') {
                  const opt: any = {
                    iPropertyId: property._id,
                    sPropertyName: property.sName,
                    iPropertyOptionId: option?._id,
                    sPropertyOptionName: option?.value,
                    sCode: option.sCode,
                    sName: option.sKey,
                    selected: false,
                  };
                  this.propertyOptions[property._id].push(opt);
                  const propertyIndex = this.aProperty.findIndex(
                    (prop: any) => prop.iPropertyId == property._id
                  );
                  if (propertyIndex === -1) this.aProperty.push(opt);
                }
              });
            }
          });
        }
      });
  }

  onProperties(value?: any) {
    if (this.selectedProperties && this.selectedProperties[value]) {
      this.aFilterProperty = [];
      for (const oProperty of this.aProperty) {
        if (this.selectedProperties[oProperty?.iPropertyId]?.length) {
          const aOption = this.propertyOptions[oProperty?.iPropertyId].filter(
            (opt: any) => {
              return this.selectedProperties[oProperty?.iPropertyId].includes(
                opt.sName
              );
            }
          );
          for (const oOption of aOption) {
            this.aFilterProperty.push(oOption?.iPropertyOptionId);
          }
        }
      }
    }
  }

  getWorkstations() {
    return this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}/${this.iLocationId}`).toPromise();
  }

  getEmployees() {
    return this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.iBusinessId }).toPromise();
  }

  fetchBusinessDetails() {
    return this.apiService.getNew('core', '/api/v1/business/' + this.businessDetails._id).toPromise();
  }

  async exportToPDF() {
    this.pdfGenerationInProgress = true;
    await this.transactionAuditPdfService.exportToPDF({
      // aDisplayMethod: this.aDisplayMethod,
      aSelectedLocation: this.aSelectedLocation,
      sOptionMenu: this.sOptionMenu,
      bIsDynamicState: this.IsDynamicState,
      aLocation: this.aLocation,
      aSelectedWorkStation: (this.iStatisticId) ? this.sCurrentWorkstation : (this.selectedWorkStation?.length ? this.selectedWorkStation : []),
      aWorkStation: this.aWorkStation,
      oFilterDates: this.filterDates,
      oBusinessDetails: this.businessDetails,
      sDisplayMethod: this.sDisplayMethod,
      sDisplayMethodString: this.sSelectedOptionMenu,
      aStatistic: this.aStatistic,
      oStatisticsDocument: this.oStatisticsDocument,
      aPaymentMethods: this.aPaymentMethods,
      bIsArticleGroupLevel: this.bIsArticleGroupLevel,
      bIsSupplierMode: this.bIsSupplierMode
    });
    this.pdfGenerationInProgress = false;
  }

  calculateTotalCounting() {
    this.oCountings.nCashCounted = 0;
    this.aAmount.forEach((amount: any) => {
      this.oCountings.nCashCounted += amount.nValue * amount.nQuantity;
    });
  }

  async expandItem(item: any, iBusinessPartnerId: string = '', from:string = 'articlegroup') {
    item.bIsCollapseItem = !item.bIsCollapseItem;

    if (from === 'articlegroup') {

      if (item.aTransactionItems) return;
      let data: any = {
        skip: 0,
        limit: 100,
        sortBy: '',
        sortOrder: '',
        searchValue: '',
        iTransactionId: 'all',
        oFilterBy: {
          dStartDate: this.filterDates.startDate,
          dEndDate: this.filterDates.endDate,
          // IsDynamicState
          bIsArticleGroupLevel: this.bIsArticleGroupLevel,
          bIsSupplierMode: this.bIsSupplierMode,
          iLocationId: this?.aSelectedLocation?.length ? this.aSelectedLocation : [],
          iWorkstationId: this.selectedWorkStation?.length ? this.selectedWorkStation : []
        },
        sTransactionType: this.optionMenu,
        iBusinessId: this.iBusinessId,
      };
      if (!this.IsDynamicState && this.oStatisticsData.bIsDayStateOpened) {
        data.oFilterBy.dStartDate = this.statisticFilter.dFromState || this.filterDates.startDate
        data.oFilterBy.dEndDate = this.statisticFilter.dToState || this.filterDates.endDate
      }
      if (
        this.sDisplayMethod.toString() === 'revenuePerBusinessPartner' ||
        this.sDisplayMethod.toString() === 'revenuePerSupplierAndArticleGroup' ||
        this.sDisplayMethod.toString() === 'revenuePerArticleGroupAndProperty' ||
        this.sDisplayMethod.toString() === 'revenuePerArticleGroup'
      ) {
        data.oFilterBy.iArticleGroupOriginalId = item._id;
      }
      if (
        this.sDisplayMethod.toString() === 'revenuePerBusinessPartner' ||
        this.sDisplayMethod.toString() === 'revenuePerSupplierAndArticleGroup'
      ) {
        data.oFilterBy.iBusinessPartnerId = iBusinessPartnerId;
      }

      if (this.sDisplayMethod.toString() === 'revenuePerProperty') {
        data.oFilterBy.aPropertyOptionIds = item.aPropertyOptionIds;
      }

      item.isLoading = true;
      const _result: any = await this.apiService.postNew('cashregistry', '/api/v1/transaction/item/list', data).toPromise();
      item.isLoading = false;
      if (_result?.data[0]?.result?.length) {
        item.aTransactionItems = _result.data[0].result;
        item.aTransactionItems.map((oTI: any) => {
          oTI.nRevenueAmount = oTI.nRevenueAmount * oTI.nQuantity
          return oTI;
        })
        }      
    } else if (from === 'payments') {
      if (item?.aItems) return;
      item.isLoading = true;
      const data = {
        iBusinessId: this.iBusinessId,
        iWorkstationId: this.iWorkstationId,
        iLocationId: this.iLocationId,
        oFilterBy: {
          dStartDate: this.oStatisticsDocument?.dOpenDate,
          dEndDate: (this.oStatisticsDocument?.dCloseDate) ? this.oStatisticsDocument?.dCloseDate : this.oStatisticsData.dEndDate,
          iPaymentMethodId: item.iPaymentMethodId
        }
      }
      const _result: any = await this.apiService.postNew('cashregistry', '/api/v1/payments/list', data).toPromise()
      if (_result.data?.length && _result.data[0]?.result?.length){
        item.aItems = _result.data[0]?.result;
      }
      item.isLoading = false;

    }
  }

  fetchTransactionItems(): Observable<any> {
    let data = {
      iTransactionId: 'all',
      oFilterBy: {
        dStartDate: this.filterDates.startDate,
        dEndDate: this.filterDates.endDate,
        bIsArticleGroupLevel: this.bIsArticleGroupLevel,
        bIsSupplierMode: this.bIsSupplierMode
      },
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
    };
    return this.apiService.postNew('cashregistry', '/api/v1/transaction/item/list', data);
  }

  fetchActivityItems(): Observable<any> {
    let data = {
      startDate: this.filterDates.startDate,
      endDate: this.filterDates.endDate,
      iBusinessId: this.iBusinessId,
      selectedWorkstations: this.selectedWorkStation?.length ? this.selectedWorkStation : [],
    };

    return this.apiService.postNew('cashregistry', '/api/v1/activities/items', data);
  }

  fetchGoldPurchaseItems(): Observable<any> {
    let data = {
      oFilterBy: {
        startDate: this.filterDates.startDate,
        endDate: this.filterDates.endDate,
      },
      iBusinessId: this.iBusinessId,
    };

    return this.apiService.postNew('cashregistry', '/api/v1/activities/gold-purchases-payments/list', data);
  }

  addExpenses(data: any): Observable<any> {
    const value = localStorage.getItem('currentEmployee');
    let currentEmployeeId;
    if (value) currentEmployeeId = JSON.parse(value)._id;
    const transactionItem = {
      sProductName: data?._eType || 'expenses',
      sComment: data.comment,
      nPriceIncVat: data.amount,
      nPurchasePrice: data.amount,
      iBusinessId: this.iBusinessId,
      nTotal: data.amount,
      nPaymentAmount: data.amount,
      nRevenueAmount: data.amount,
      iWorkstationId: this.iWorkstationId,
      iEmployeeId: currentEmployeeId,
      iLocationId: this.iLocationId,
      oPayment: data?.oPayment,
      oType: {
        eTransactionType: data?._eType || 'expenses',
        bRefund: false,
        eKind: data?._eType || 'expenses',
        bDiscount: false,
      },
      nVatRate: data?.nVatRate
    };
    return this.apiService.postNew('cashregistry', `/api/v1/till/add-expenses`, transactionItem);
  }

  getDynamicAuditDetail() {
    const _oBody = this.processingDynamicDataRequest();
    _oBody.oFilter.dEndDate = new Date();
    return this.apiService.postNew('cashregistry', `/api/v1/statistics/transaction/audit`, _oBody).toPromise();
  }

  async closeDayState() {
    this.closingDayState = true;

    /* fetching Audit detail for checking if day-state is changed or not */
    const oStatisticDetail: any = await this.getDynamicAuditDetail();
    if (!oStatisticDetail?.data?.oTransactionAudit?.length || !oStatisticDetail?.data?.oTransactionAudit[0]?.overall?.length) {
      this.toastService.show({ type: 'warning', text: 'Something went wrong' });
      return;
    }
  
     /* This is to check if day-state is not changed already (in mean-time) */
    if (oStatisticDetail?.data?.oTransactionAudit[0]?.overall[0]?.nTotalRevenue != this.aStatistic[0].overall[0].nTotalRevenue ||
      oStatisticDetail?.data?.oTransactionAudit[0]?.overall[0]?.nQuantity != this.aStatistic[0].overall[0].nQuantity) {
        this.toastService.show({ type: 'warning', text: 'Someone modified the transaction in this workstation. Please refresh the page' });
        return;
    }

    this.aAmount.filter((item: any) => item.nQuantity > 0).forEach((item: any) => (this.oCountings.oCountingsCashDetails[item.key] = item.nQuantity));
    this.oCountings.nCashDifference = this.oCountings?.nCashCounted - (this.oCountings?.nCashAtStart + this.oCountings?.nCashInTill);

    const oCashPaymentMethod = this.allPaymentMethod.filter((el: any) => el.sName.toLowerCase() === 'cash')[0];
    const oBankPaymentMethod = this.allPaymentMethod.filter((el: any) => el.sName.toLowerCase() === 'bankpayment')[0];
    const nVatRate = await this.taxService.fetchDefaultVatRate({ iLocationId: this.iLocationId });

    console.log('nVatRate: ', nVatRate);
    console.log('nDifferenceAmount: ', this.oCountings.nCashDifference);
    const aPromises:any = [];
    
    if (this.oCountings.nCashDifference !== 0) {
      //we have difference in cash, so add that as and expense
      aPromises.push(this.addExpenses(
        {
          amount: this.oCountings.nCashDifference,
          comment: 'DIFF_IN_CASH_COUNTING',
          oPayment: {
            iPaymentMethodId: oCashPaymentMethod._id,
            nAmount: this.oCountings.nCashDifference,
            sMethod: oCashPaymentMethod.sName.toLowerCase(),
            sComment: 'DIFF_IN_CASH_COUNTING',
          },
          _eType: 'diff-counting',
          nVatRate: nVatRate
        }
      ).toPromise());
    }

    if (this.oCountings.nSkim > 0) {
      //amount to put in bank - so add create new expense with positive amount to add it as bank payment, and negative amount as cash
      // so increase bank payment amount and equally decrease cash payment amount

      aPromises.push(this.addExpenses({
        amount: this.oCountings.nSkim,
        comment: 'Transfer to the bank (increase bank amount)',
        oPayment: {
          iPaymentMethodId: oBankPaymentMethod._id,
          nAmount: this.oCountings.nSkim,
          sMethod: oBankPaymentMethod.sName.toLowerCase(),
          sComment: 'Transfer to the bank (increase bank amount)',
        },
        nVatRate: nVatRate
      }).toPromise());

      aPromises.push(this.addExpenses({
        amount: -this.oCountings.nSkim,
        comment: 'Transfered to the bank (decrease cash amount)',
        oPayment: {
          iPaymentMethodId: oCashPaymentMethod._id,
          nAmount: -this.oCountings.nSkim,
          sMethod: oCashPaymentMethod.sName.toLowerCase(),
          sComment: 'Transfered to the bank (decrease cash amount)',
        },
        nVatRate: nVatRate
      }).toPromise());
    }

    await Promise.all(aPromises)

    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      iStatisticId: this.iStatisticId,
      oCountings: this.oCountings,
      sComment: this.oStatisticsDocument.sComment
    }

    this.closeSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/close/day-state`, oBody).subscribe((result: any) => {
      this.toastService.show({ type: 'success', text: `Day-state is close now` });
      this.closingDayState = false;
      this.bDisableCountings = true;
      // this.oStatisticsDocument = result?.data;
      this.getStaticData();
      this.checkShowDownload();
    }, (error) => {
      console.log('Error: ', error);
      this.toastService.show({ type: 'warning', text: 'Something went wrong or open the day-state first' });
      this.closingDayState = false;
    })
  }

  getPaymentMethods() {
    this.payMethods = [];
    this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.iBusinessId).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.allPaymentMethod = result.data;
        this.payMethods = [...result.data];
        // result.data.forEach((element: any) => {
        //   this.payMethods.push(element);
        // });
        this.filterDuplicatePaymentMethods();
      }
    });
  }

  filterDuplicatePaymentMethods() {
    const aPresent = [...this.aPaymentMethods.map((item: any) => item.iPaymentMethodId), ...this.aNewSelectedPaymentMethods.map((item: any) => item._id)];
    this.payMethods = this.payMethods.filter((item: any) => !aPresent.includes(item._id));
  }

  toggleEditPaymentMode() {
    this.paymentEditMode = !this.paymentEditMode;
    // this.addRow();
    if (!this.paymentEditMode) this.aNewSelectedPaymentMethods = [];
  }

  addRow() {
    this.aNewSelectedPaymentMethods.push({})
    this.filterDuplicatePaymentMethods()
  }

  reCalculateTotal() {
    this.nNewPaymentMethodTotal = 0;
    this.aPaymentMethods.forEach((item: any) => {
      if (item.nNewAmount)
        this.nNewPaymentMethodTotal += parseFloat(item.nNewAmount);
    });
    if (this.aNewSelectedPaymentMethods?.length)
      this.aNewSelectedPaymentMethods.forEach((item: any) => {
        if (item.nAmount)
          this.nNewPaymentMethodTotal += parseFloat(item.nAmount);
      });
  }

  async saveUpdatedPayments(event: any) {
    event.target.disabled = true;
    const nVatRate = await this.taxService.fetchDefaultVatRate({ iLocationId: this.iLocationId });
    for (const item of this.aPaymentMethods) {
      if (item.nAmount != item.nNewAmount) {
        await this.addExpenses({
          amount: item.nNewAmount - item.nAmount,
          comment: 'Payment method change',
          oPayment: {
            iPaymentMethodId: item.iPaymentMethodId,
            nAmount: item.nNewAmount - item.nAmount,
            sMethod: item.sMethod
          },
          nVatRate: nVatRate
        }).toPromise();
      }
    }

    if (this.aNewSelectedPaymentMethods.length) {
      for (const item of this.aNewSelectedPaymentMethods) {
        if (item.nAmount) {
          await this.addExpenses({
            amount: item.nAmount,
            comment: 'Payment method change',
            oPayment: {
              iPaymentMethodId: item._id,
              nAmount: item.nAmount,
              sMethod: item.sName.toLowerCase()
            },
            nVatRate: nVatRate
          }).toPromise();
        }
      }
    }

    const endDate = new Date();
    this.filterDates.endDate = endDate;
    this.oStatisticsData.dEndDate = endDate;

    this.paymentEditMode = false;
    event.target.disabled = false;

    this.fetchStatistics();
  }

  /* For FROM State and TO State */
  fetchDayClosureList() {
    try {
      this.aDayClosure = [];

      const oBody = {
        iBusinessId: this.iBusinessId,
        oFilter: {
          iLocationId: this.iLocationId,
          aLocationId: this?.aSelectedLocation?.length ? this.aSelectedLocation : [],
          iWorkstationId: this.selectedWorkStation?.length ? this.selectedWorkStation : []
        },
      }
      this.dayClosureListSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/list`, oBody).subscribe((result: any) => {
        if (result?.data?.length && result.data[0]?.result?.length) {
          const _aDayClosure = result.data[0]?.result.map((oDayClosure: any) => {
            const oData = { _id: oDayClosure?._id, dOpenDate: oDayClosure?.dOpenDate, dCloseDate: oDayClosure?.dCloseDate, isDisable: true, sWorkStationName: oDayClosure?.sWorkStationName }
            return oData;
          });
          this.aDayClosure = _aDayClosure;
          this.checkShowDownload();
        }
        // this.showLoader = false;
      }, (error) => {
        console.log('error: ', error);
        // this.showLoader = false;
      })
    } catch (error) {
      console.log('error: ', error);
    }
  }

  onStateChange(dDate: any, isOpenDate: boolean, aDayClosure: any) {
    const dFromStateTime = new Date(this.statisticFilter.dFromState).getTime();
    const dToStateTime = new Date(this.statisticFilter.dToState).getTime();
    /* Disabling the date which is smaller than the dFromState in dToState */
    for (let i = 0; i < aDayClosure?.length; i++) {
      aDayClosure[i].isDisable = false;
      const dDayClosureDateTime = new Date(aDayClosure[i].dCloseDate).getTime();
      if (dFromStateTime > dDayClosureDateTime) aDayClosure[i].isDisable = true;
    }
    
    this.checkShowDownload();
  }

  checkShowDownload() {
    const bCondition1 = this.IsDynamicState;
    // = (this.oStatisticsDocument && this.oStatisticsDocument?.bIsDayState === false);
      
    const bCondition2 = (!this.selectedEmployee?._id &&
      !this.selectedWorkStation?._id &&
      !(this.aSelectedLocation?.length > 1) &&
      this.statisticFilter.dFromState != '' &&
      this.statisticFilter.dToState != '');
    
    const bCondition3 = (this.iStatisticId && this.iStatisticId != '' && this.oStatisticsDocument && this.oStatisticsDocument?.bIsDayState === false) || false ;

    this.bShowDownload = bCondition1 || bCondition2 || bCondition3;
  }

  fetchStockValuePerLocation() {
    const url = `/api/v1/stock/correction/stock-value/per-location`;
    const oBody = { iBusinessId: this.iBusinessId }
    this.listBusinessSubscription = this.apiService.postNew('core', url, oBody).subscribe((result: any) => {
      if (result?.data?.aHistory?.length) {
        this.oStockPerLocation = result.data;
        for (let i = 0; i < this.aLocation?.length; i++) {
          const oLocation = this.oStockPerLocation.aHistory.find((oHistory: any) => oHistory?._id == this.aLocation[i]._id)
          if (oLocation) {
            oLocation.sName = this.aLocation[i].sName;
          }
        }
      }
    }, (error) => {
      console.log('error: ', error);
    });
  }

  ngOnDestroy(): void {
    console.log('destroy audit page')
    MenuComponent.clearEverything();
    if (this.listBusinessSubscription) this.listBusinessSubscription.unsubscribe();
    if (this.getStatisticSubscription) this.getStatisticSubscription.unsubscribe();
    if (this.statisticAuditSubscription) this.statisticAuditSubscription.unsubscribe();
    if (this.greenRecordsSubscription) this.greenRecordsSubscription.unsubscribe();
    if (this.propertyListSubscription) this.propertyListSubscription.unsubscribe();
    if (this.workstationListSubscription) this.workstationListSubscription.unsubscribe();
    if (this.employeeListSubscription) this.employeeListSubscription.unsubscribe();
    if (this.transactionItemListSubscription) this.transactionItemListSubscription.unsubscribe();
    if (this.dayClosureListSubscription) this.dayClosureListSubscription.unsubscribe();
  }

}
