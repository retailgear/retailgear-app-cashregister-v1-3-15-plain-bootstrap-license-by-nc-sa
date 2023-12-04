import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../shared/service/dialog';
import { TillService } from '../shared/service/till.service';
import { ClosingDaystateDialogComponent } from '../shared/components/closing-daystate-dialog/closing-daystate-dialog.component';
import * as moment from 'moment';
import { TransactionDetailsComponent } from '../transactions/components/transaction-details/transaction-details.component';
import { ReceiptService } from '../shared/service/receipt.service';
import { ClosingDaystateHelperDialogComponent } from '../shared/components/closing-daystate-helper-dialog/closing-daystate-helper-dialog.component';
import { CalendarGanttViewDialogComponent } from '../shared/components/calendar-gantt-view-dialog/calendar-gantt-view-dialog.component';

@Component({
  selector: 'app-transaction-audit',
  templateUrl: './transaction-audit.component.html',
  styleUrls: ['./transaction-audit.component.scss'],
  providers: [TransactionAuditUiPdfService]
})

export class TransactionAuditComponent implements OnInit, OnDestroy {

  iBusinessId: any = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem('currentLocation');
  iWorkstationId:any = localStorage.getItem('currentWorkstation');
  iEmployeeId: any = JSON.parse(localStorage.getItem('currentUser') || '')['userId'];
  sUserType: any = localStorage.getItem('type');
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
  IsDynamicState = false;
  aWorkStation: any = [];
  aEmployee: any = [];
  aPaymentMethods: any = [];
  aDayClosure: any = [];
  oStockPerLocation: any = [];
  isShowStockLocation: boolean = false;
  object = Object
  
  closingDayState: boolean = false;
  bShowDownload: boolean = false;

  statisticsData$: any;
  businessDetails: any = {};
  statistics: any;
  optionMenu = 'sales-order';
  statisticFilter = {
    isArticleGroupLevel: true,
    isProductLevel: false,
    dFromState: '',
    dToState: '',
    eChosenStateCreationType: '' /* To disable the TO_STATE if Migration date chosen from FROM_STATE */
  };
  filterDates:any = {
    startDate: "",//new Date(new Date().setHours(0, 0, 0)),
    endDate: "",//new Date(new Date().setHours(23, 59, 59)),
  };
  bIsArticleGroupLevel: boolean = true; // Could be Article-group level or product-level (if false then article-group mode)
  bIsSupplierMode: boolean = false; // could be Business-owner-mode or supplier-mode (if true then supplier-mode)
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
  aStatisticsDocuments: any;
  sCurrentLocation: any;
  sCurrentWorkstation: any;
  pdfGenerationInProgress: boolean = false;
  bShowProperty: boolean = false;
  bDayStateClosed: boolean = false;

  aRefundItems: any;
  aDiscountItems: any;
  aRepairItems: any;
  aGoldPurchases: any;
  aGiftItems: any;
  previousPage = 0
  sDayClosureMethod:any;

  bOpeningDayClosure = false;
  bOpeningHistoricalDayState = false;

  nTotalRevenue = 0;
  nTotalQuantity = 0;
  aStatisticsIds:any = [];
  sFrom: any;
  aBusinessPartners: any;
  aSelectedBusinessPartnerId: any;
  aArticleGroupDetails: any;
  bReCalculateLoading: boolean = false;
  bAllowOpenManualCashDrawer: boolean = false;
  oCurrentEmployee: any;
  aPrintSettings: any;
  bOpeningDrawer: boolean = false;
  aCalendarEvent: any = []; /* to show the data in calendar */
  bIsCalendarOpen: boolean = false;
  oCalendarSelectedData: any = {};
  oHelperDetails: any = {
    oStartAmountIncorrect: {
      bChecked: false,
      nAmount: 0,
    },
    bCantCloseDueToDifference: false,
    bWrongDayEndCash: false,
    aReasons: [{ nAmount: 0 }],
    bSaved: true,
    nAmountToAdd: 0,
    nAmountToDeduct: 0,
  };
  bSavingHelperDetails:boolean = false;
  bDayClosureLoading: boolean = false;
  bBusinessLocationLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    public translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private location: Location,
    public auditService: TransactionAuditUiPdfService,
    private taxService: TaxService,
    private dialogService: DialogService,
    private tillService: TillService,
    private receiptService: ReceiptService,
  ) {
    const _oUser = localStorage.getItem('currentUser');
    if (_oUser) this.oUser = JSON.parse(_oUser);
    this.previousPage = this.route?.snapshot?.queryParams?.page || 0
    this.selectViewModeAndData();
  }

  selectViewModeAndData(){
    const oState = this.router.getCurrentNavigation()?.extras?.state;
    this.sFrom = oState?.from;
    const sDateFormat = "YYYY-MM-DDThh:mm";
    
    if(this.sFrom == 'sales-list') {
      this.aSelectedBusinessPartnerId = oState?.aBusinessPartnerId;
      this.IsDynamicState = true;
      this.sDisplayMethod = eDisplayMethodKeysEnum.revenuePerBusinessPartner;

      if (oState?.filterDates?.startDate && oState?.filterDates?.endDate) {
        this.filterDates = {
          startDate: moment(new Date(oState.filterDates.startDate).setHours(0, 0, 0)).format(sDateFormat),
          endDate: moment(new Date(oState.filterDates.endDate).setHours(23, 59, 59)).format(sDateFormat)
        }
      } else {
        this.filterDates = {
          startDate: moment(new Date().setHours(0, 0, 0)).subtract({days: 1}).format(sDateFormat),
          endDate: moment(new Date().setHours(23, 59, 59)).format(sDateFormat)
        };
      }
    } else {
      this.iStatisticId = this.route.snapshot?.params?.iStatisticId;
      if (this.iStatisticId) {
        this.oStatisticsData.dStartDate = oState?.dStartDate;
        this.oStatisticsData.dEndDate = oState?.dEndDate;
        this.oStatisticsData.bIsDayStateOpened = oState?.bIsDayStateOpened ? true : false;
        this.oStatisticsData.iLocationId = oState?.iLocationId;
        this.oStatisticsData.iWorkstationId = oState?.iWorkstationId;
  
        if (this.oStatisticsData.bIsDayStateOpened){
          this.bOpeningDayClosure = true;
        } else {
          this.bOpeningHistoricalDayState = true;
          this.statisticFilter.dFromState = this.oStatisticsData.dStartDate;
          this.statisticFilter.dToState = this.oStatisticsData.dEndDate;
        } 
  
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
  }

  async ngOnInit() {
    this.apiService.setToastService(this.toastService);
    await this.tillService.fetchSettings();
    this.sDayClosureMethod = this.tillService.settings?.sDayClosureMethod || 'workstation';
    if(this.bOpeningDayClosure) {
      if(this.tillService.settings.bShowDayStatesBasedOnTurnover) this.sDisplayMethod = eDisplayMethodKeysEnum.aRevenuePerTurnoverGroup
    }
    this.setOptionMenu()

    this.fetchBusinessDetails();
    this.getEmployees();
    this.getWorkstations();

    // if (this.iLocationId != this.tillService?.settings?.currentLocation?.iLocationId) {
    //   this.tillService.settings = null;
    //   await this.tillService.fetchSettings();
    // }

    this.fetchBusinessPartners();
    this.fetchStatistics(this.sDisplayMethod.toString()); /* Only for view or dynamic or static document */
    this.getProperties();
    this.getPaymentMethods();
    const transactionAudits = localStorage.getItem('transactionAuditPdfService.aAmount');
    let transactionAuditArray = [];
    if (transactionAudits) {
      transactionAuditArray = JSON.parse(transactionAudits);
    }
   if(transactionAuditArray?.length) this.auditService.aAmount = transactionAuditArray;

    setTimeout(() => {
      MenuComponent.bootstrap();
    }, 200);
   
  }

  fetchBusinessPartners() {
    const oBody =  {
      iBusinessId: this.iBusinessId,
    };
    this.aBusinessPartners = []
      this.apiService.postNew('core', '/api/v1/business/partners/list', oBody).subscribe((result: any) => {
        if (result?.data?.length && result?.data[0]?.result?.length) {
          this.aBusinessPartners = result.data[0].result;
        }
      }
    )
  }

  setOptionMenu() {
    this.aOptionMenu = [
      {
        sKey: 'SALES',
        sValue: 'cash-registry',
        bDisable: false,
        children: [
          {
            sKey: 'ArticleGroup',
            sValue: this.translateService.instant('ARTICLE_GROUP'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
            sValue: this.translateService.instant('BOOKKEEPING'),
            bDisable: false,
            children: [
              {
                sKey: 'Vat rates',
                sValue: this.translateService.instant('VAT_RATES'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates,
                }
              },
              {
                sKey: 'Revenue per',
                sValue: this.translateService.instant('REVENUE_PER'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerProperty
                }
              },
              {
                sKey: 'Article group',
                sValue: this.translateService.instant('ARTICLE_GROUP'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates
                }
              },
            ]
          },
          {
            sKey: 'Supplier',
            sValue: this.translateService.instant('SUPPLIER'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
            sValue: this.translateService.instant('MANAGER'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'businessOwner',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
        bDisable: false,
        children: [
          {
            sKey: 'ArticleGroup',
            sValue: this.translateService.instant('ARTICLE GROUP'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
            sValue: this.translateService.instant('BOOKKEEPING'),
            bDisable: false,
            children: [
              {
                sKey: 'Vat rates',
                sValue: this.translateService.instant('VAT_RATES'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates,
                }
              },
              {
                sKey: 'Revenue per',
                sValue: this.translateService.instant('REVENUE_PER'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerProperty
                }
              },
              {
                sKey: 'Article group',
                sValue: this.translateService.instant('ARTICLE_GROUP'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates
                }
              },
            ]
          },
          {
            sKey: 'Supplier',
            sValue: this.translateService.instant('SUPPLIER'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
            sValue: this.translateService.instant('MANAGER'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'businessOwner',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
        bDisable: false,
        children: [
          {
            sKey: 'ArticleGroup',
            sValue: this.translateService.instant('ARTICLE GROUP'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
            sValue: this.translateService.instant('BOOKKEEPING'),
            bDisable: false,
            children: [
              {
                sKey: 'Vat rates',
                sValue: this.translateService.instant('VAT_RATES'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates,
                }
              },
              {
                sKey: 'Revenue per',
                sValue: this.translateService.instant('REVENUE_PER'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerProperty
                }
              },
              {
                sKey: 'Article group',
                sValue: this.translateService.instant('ARTICLE_GROUP'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.aVatRates
                }
              },
            ]
          },
          {
            sKey: 'Supplier',
            sValue: this.translateService.instant('SUPPLIER'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerSupplierAndArticleGroup,
                  modeFilter: 'supplier',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
            sValue: this.translateService.instant('MANAGER'),
            bDisable: false,
            children: [
              {
                sKey: 'Compact',
                sValue: this.translateService.instant('COMPACT'),
                bDisable: false,
                data: {
                  displayMethod: eDisplayMethodKeysEnum.revenuePerArticleGroup,
                  modeFilter: 'businessOwner',
                }
              },
              {
                sKey: 'Specific',
                sValue: this.translateService.instant('SPECIFIC'),
                bDisable: false,
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
    /* TurnOver Start */
    /* Showing this menu only if the all the article-group has category and bShowDayStatesBasedOnTurnover is turned on */
    if (this.tillService.settings?.bShowDayStatesBasedOnTurnover) {
      const oTurnoverGroup = {
        sKey: 'Turnover Group',
        sValue: this.translateService.instant('TURN_OVER_GROUP'),
        bDisable: false,
        data: {
          displayMethod: eDisplayMethodKeysEnum.aRevenuePerTurnoverGroup
        }
      }
      for (const oOption of this.aOptionMenu) {
        for (const oChild of oOption?.children) {
          if (oChild?.sKey == 'Bookkeeping' || oChild?.sKey == 'ArticleGroup') {
            oChild.children.push(oTurnoverGroup);
          }
        }
      }
    }
    /* TurnOver End */
    if (eUserType && eUserType.toLowerCase() !== 'supplier') {
      let iPurchaseIndex = this.aOptionMenu.findIndex(i => i.sValue.toLowerCase() === 'sales-order')
      this.aOptionMenu.splice(iPurchaseIndex, 1)
    }

    if(this.sFrom == 'sales-list') {
      this.onDropdownItemSelected(this.aOptionMenu[0], this.aOptionMenu[0].children[2], this.aOptionMenu[0].children[2].children[1])
    } else {
      if (this.tillService.settings?.bShowDayStatesBasedOnTurnover) {
        this.onDropdownItemSelected(this.aOptionMenu[0], this.aOptionMenu[0].children[1], this.aOptionMenu[0].children[1].children[3])
      } else {
        this.onDropdownItemSelected(this.aOptionMenu[0], this.aOptionMenu[0].children[0], this.aOptionMenu[0].children[0].children[0])
      }
    }
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

  onDropdownItemSelected(parent: any, child1: any, child2: any) {
    if (child2?.bDisable) return;
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

  displayMethodChange() {
    this.aStatistic = [];
  }

  /* Countings Code (KK) */
  processCounting() {
    this.oCountings = this.oStatisticsDocument?.oCountings;
    console.log('processCounting', JSON.parse(JSON.stringify(this.oCountings)))
    // this.oCountings.nCashAtStart = this.oStatisticsDocument?.oCountings?.nCashAtStart || 0;
    // this.oCountings.nCashCounted = this.oStatisticsDocument?.oCountings?.nCashCounted || 0;
    // this.oCountings.nSkim = this.oStatisticsDocument?.oCountings?.nSkim || 0;
    // this.oCountings.nCashRemain = this.oStatisticsDocument?.oCountings?.nCashRemain || 0;
    // this.oCountings.nCashDifference = this.oStatisticsDocument?.oCountings?.nCashDifference || 0;
    this.bDayStateClosed = !this.oStatisticsDocument?.bIsDayState;
    
    const oCountings = localStorage.getItem('oCountings');
    if(oCountings) {
      this.oCountings = JSON.parse(oCountings);
      localStorage.removeItem('oCountings');
    }
    let aKeys: any = [];
    if (this.oStatisticsDocument?.oCountings?.oCountingsCashDetails) aKeys = Object.keys(this.oStatisticsDocument?.oCountings?.oCountingsCashDetails);
    if (aKeys?.length) {
      this.auditService.aAmount.map((item: any) => {
        if (aKeys.includes(item.key)) {
          item.nQuantity = this.oStatisticsDocument?.oCountings?.oCountingsCashDetails[item.key];
        }
      });
    }
  }

  fetchStatistics(sDisplayMethod?: string) {
    if (this.bOpeningDayClosure) {
      /* If not closed yet then we require both data static as well and dynamic */
      this.getStaticData(sDisplayMethod);
      this.getDynamicData(sDisplayMethod);
    } else if (this.bOpeningHistoricalDayState) {
      /* Already closed then we can get all the data from one API only */
      this.getStaticData(sDisplayMethod);
    } else this.fetchAuditStatistic(sDisplayMethod);
  }

  /* Fetch Audit (Be it Static or Dynamic), where user can change filter as well */
  fetchAuditStatistic(sDisplayMethod?: string) {
    if (this.IsDynamicState) this.getDynamicData(sDisplayMethod);
    else {
      if (!this.aDayClosure?.length) this.fetchDayClosureList();
      this.getStaticData(sDisplayMethod);
    }
  }

  /* Static Data for statistic (from statistic document) */
  getStaticData(sDisplayMethod?: string) {
    this.aStatistic = [];
    this.aPaymentMethods = [];
    this.bStatisticLoading = true;

    let aLocation = this?.aSelectedLocation?.length ? this.aSelectedLocation : [];
    let iWorkstationId = this.selectedWorkStation?.length ? this.selectedWorkStation : [];
    if (this.bOpeningDayClosure) {
      /* It's only for view purpose and we can only view for the current location and current workstation */
      aLocation = [this.iLocationId];
      iWorkstationId = [this.iWorkstationId]
    } else if(this.bOpeningHistoricalDayState) {
      aLocation = [this.oStatisticsData.iLocationId];
      iWorkstationId = [this.oStatisticsData.iWorkstationId]
    }
    const isMigrationChosen = this.statisticFilter.eChosenStateCreationType == 'migration' ? true : false;
    const oBody: any = {
      iBusinessId: this.iBusinessId,
      iStatisticId: this.iStatisticId,
      oFilter: {
        sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation',
        aLocationId: aLocation,
        iWorkstationId: iWorkstationId,
        sTransactionType: this.optionMenu,
        sDisplayMethod: sDisplayMethod || this.sDisplayMethod.toString(),
        dStartDate: this.statisticFilter.dFromState,
        dEndDate: this.statisticFilter.dToState,
        aFilterProperty: this.aFilterProperty,
        bIsArticleGroupLevel: true,
        bIsSupplierMode: this.bIsSupplierMode,
        isMigrationChosen: isMigrationChosen /* to pass into back-end to fetch dynamic data of PN1 */
      }
    }

    if (this.IsDynamicState) {
      oBody.oFilter.bIsArticleGroupLevel = this.bIsArticleGroupLevel;
      oBody.oFilter.bIsSupplierMode = this.bIsSupplierMode;
    }

    this.getStatisticSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/list`, oBody).
      subscribe((result: any) => {
        this.bStatisticLoading = false;
        if (result?.data) {
          const oData = result?.data;
          if (oData.aStatistic?.length) {
            this.aStatistic = oData.aStatistic;
            
            if (this.aStatistic?.length && this.aStatistic[0]?.overall?.length) {

              if (this.bOpeningHistoricalDayState) {
                const aUniqueArticleGroupId: any = this.getUniqueArticleGroupIds();
                this.getArticleGroups(aUniqueArticleGroupId);
              }
              this.nTotalRevenue = +(this.aStatistic[0].overall[0].nTotalRevenue.toFixed(2))
              this.nTotalQuantity = this.aStatistic[0].overall[0].nQuantity;
            }

            this.aStatisticsDocuments = oData.aStaticDocument;
            // console.log(this.aStatisticsDocuments)
            if (this.iStatisticId && this.aStatisticsDocuments?.length) {
              this.oStatisticsDocument = this.aStatisticsDocuments[0];
              this.processCounting();
            } else {
              this.oStatisticsDocument = this.auditService.processingMultipleStatisticsBySummingUp({ aStatisticsDocuments: this.aStatisticsDocuments, aStatistic: this.aStatistic });
            }
            if (this.aStatisticsDocuments?.length) this.mappingThePaymentMethod(this.aStatisticsDocuments);
            if (this.bOpeningHistoricalDayState) this.handleCashMutations();
            this.checkShowDownload();
          }
          // console.log(JSON.parse(JSON.stringify(this.oCountings)));
        }
      }, (error) => {
        this.bStatisticLoading = false;
        console.log('error: ', error);
      });
  }

  handleCashMutations() {
    this.oHelperDetails.nAmountToAdd = 0;
    this.oHelperDetails.nAmountToDeduct = 0;
    // console.log('handleCashMutations', this.aStatistic, JSON.parse(JSON.stringify(this.oHelperDetails)))
    for (const el of this.aStatistic[0].individual) {
      const aModifiedRecord = el?.aArticleGroups?.filter((el: any) => ['MODIFIED_START_AMOUNT', 'ADD_CASH_WITHOUT_REVENUE'].includes(el.sName));
      if (aModifiedRecord?.length) {
        // console.log({ aModifiedRecord })
        aModifiedRecord.forEach((oModifiedRecord: any) => {
          if (oModifiedRecord.sName == 'MODIFIED_START_AMOUNT') {
            // nRevenue = oModifiedRecord.nTotalRevenue;
            this.oHelperDetails.oStartAmountIncorrect.nAmount = oModifiedRecord.nTotalRevenue;
            this.oHelperDetails.oStartAmountIncorrect.bChecked = true;
            // console.log('MODIFIED_START_AMOUNT, adding revenue before',this.oHelperDetails.nAmountToAdd )
            this.oHelperDetails.nAmountToAdd += oModifiedRecord.nTotalRevenue;
            // console.log('MODIFIED_START_AMOUNT, adding revenue after', this.oHelperDetails.nAmountToAdd)

            // if (this.bOpeningDayClosure || this.IsDynamicState) {
            //   console.log('handleCashMutations modifying 848', 'before cash in till', this.oCountings.nCashInTill)
            //   this.oCountings.nCashInTill += nRevenue;
            //   this.oCountings.nCashInTill = +(this.oCountings.nCashInTill.toFixed(2))
            //   console.log('after', this.oCountings.nCashInTill)
            //   console.log('after', { nRevenue })
            // }        
          } else if (oModifiedRecord.sName == 'ADD_CASH_WITHOUT_REVENUE') {
            // console.log({oModifiedRecord})
            // console.log('ADD_CASH_WITHOUT_REVENUE, adding revenue before', this.oHelperDetails.nAmountToAdd)
            this.oHelperDetails.nAmountToAdd += oModifiedRecord.nTotalRevenue;
            // console.log('ADD_CASH_WITHOUT_REVENUE, adding revenue after', this.oHelperDetails.nAmountToAdd)
            const oReason = this.oHelperDetails.aReasons[0];
            oReason.nAmount = oModifiedRecord.nTotalRevenue;
            oReason.oExpense = {
              oExpenseType: { title: oModifiedRecord.sName }
            }
          }
        });
      }
    }
    if(this.bOpeningDayClosure) this.oCountings.nCashInTill -= this.oHelperDetails.nAmountToAdd
  }

  getUniqueArticleGroupIds() {
    const aUniqueArticleGroupId:any = [];
    switch(this.sDisplayMethod) {
      case eDisplayMethodKeysEnum.aRevenuePerTurnoverGroup:
        this.aStatistic[0].individual.forEach((el: any) => {
          aUniqueArticleGroupId.push(...el.aArticleGroups.map((oGroup: any) => oGroup._id));
        });
        break; 
      case eDisplayMethodKeysEnum.revenuePerArticleGroup:
        aUniqueArticleGroupId.push(...this.aStatistic[0].individual.map((el: any) => el._id));
        break; 
    }

    return [...new Set(aUniqueArticleGroupId.map((el: any) => el))];
  }

  setArticleGroupNames() {
    switch(this.sDisplayMethod) {
      case eDisplayMethodKeysEnum.aRevenuePerTurnoverGroup:
        this.aStatistic[0].individual.forEach((el: any) => {
          el.aArticleGroups.forEach((oGroup: any) => {
            const oData = this.aArticleGroupDetails.find((oItem: any) => oItem._id === oGroup._id)
            if (oData) {
              oGroup.oName = oData.oName;
            }
          });
        })
        break; 
      case eDisplayMethodKeysEnum.revenuePerArticleGroup:
        this.aStatistic[0].individual.forEach((el: any) => {
          const oData = this.aArticleGroupDetails.find((oItem: any) => oItem._id === el._id)
          if (oData) el.oName = oData.oName;
        })
        break; 
    }
  }

  mappingThePaymentMethod(aData: any) {
    aData.forEach((oData: any) => {

      if (oData.aPaymentMethods?.length) {
        if (!this.aPaymentMethods?.length) {
          this.aPaymentMethods.push(...oData.aPaymentMethods);
        } else {
          oData.aPaymentMethods.forEach((el: any) => {
            const iExistingIndex = this.aPaymentMethods.findIndex((p: any) => p.sMethod === el.sMethod);
            if (iExistingIndex > -1) {
              this.aPaymentMethods[iExistingIndex].nAmount += el.nAmount;
              this.aPaymentMethods[iExistingIndex].nQuantity += el.nQuantity;
            } else {
              this.aPaymentMethods.push(el);
            }
          })
        }
      }
    })
    this.nPaymentMethodTotal = this.aPaymentMethods.reduce((a: any, b: any) => a + b.nAmount, 0);
    this.nNewPaymentMethodTotal = this.nPaymentMethodTotal;
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
      sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation',
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
        bIsSupplierMode: this.bIsSupplierMode,
        iBusinessPartnerId: this.aSelectedBusinessPartnerId,
        iStatisticId: this.iStatisticId
      },
    };

    if (this.IsDynamicState) {
      oBody.oFilter.bIsArticleGroupLevel = this.bIsArticleGroupLevel;
      oBody.oFilter.bIsSupplierMode = this.bIsSupplierMode;

      if(this.sFrom != 'sales-list' && this.filterDates.startDate == '') {
        this.filterDates.startDate = moment(new Date().setHours(0, 0, 0)).format("YYYY-MM-DDThh:mm")
        this.filterDates.endDate = moment(new Date().setHours(23, 59, 59)).format("YYYY-MM-DDThh:mm")
      }
    }
    return oBody;
  }

  /* Dynamic Data for statistic (from transaction-item) */
  getDynamicData(sDisplayMethod?: string) {
    /* Below for Dynamic-data */
    const oBody = this.processingDynamicDataRequest(sDisplayMethod);
    this.bStatisticLoading = true;
    this.aStatistic = [];
    this.statisticAuditSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/transaction/audit`, oBody).subscribe((result: any) => {
        if (result?.data) {

          if (result.data?.oTransactionAudit?.length)
            this.aStatistic = result.data.oTransactionAudit;

          if (this.aStatistic?.length && this.aStatistic[0]?.overall?.length) {            
            let aUniqueArticleGroupId:any = [];
            this.aStatistic[0].individual.forEach((el:any) => {
              // const oModifiedRecord = el.aArticleGroups.find((el: any) => el.sName == 'MODIFIED_START_AMOUNT');
              // if (oModifiedRecord) {
              //   this.oHelperDetails.oStartAmountIncorrect.nAmount = oModifiedRecord.nTotalRevenue;
              //   nModifiedAmount = oModifiedRecord.nTotalRevenue;
              // }
              aUniqueArticleGroupId.push(...el.aArticleGroups.map((oGroup:any) => oGroup._id));
            })
            aUniqueArticleGroupId = [...new Set(aUniqueArticleGroupId.map((el:any) => el))];
            this.getArticleGroups(aUniqueArticleGroupId);

            this.nTotalRevenue = +(this.aStatistic[0].overall[0].nTotalRevenue.toFixed(2));
            this.nTotalQuantity = this.aStatistic[0].overall[0].nQuantity;
          }
          this.aPaymentMethods = result?.data?.aPaymentMethods;
          if (this.bOpeningDayClosure || this.IsDynamicState) {
            this.aPaymentMethods.forEach((item: any) => {
              item.nNewAmount = item.nAmount;
              this.nPaymentMethodTotal += parseFloat(item.nAmount);
              if (item?.sMethod === 'cash') {
                // console.log('before adjusting cash payment method', this.oCountings.nCashInTill, item)
                this.oCountings.nCashInTill = +((item?.nAmount || 0).toFixed(2));
                // console.log('after adjusting cash payment method', this.oCountings.nCashInTill)
              }
            });
            if (this.IsDynamicState) this.nPaymentMethodTotal = this.tillService.getSum(this.aPaymentMethods, 'nAmount')
            this.nNewPaymentMethodTotal = this.nPaymentMethodTotal;
          this.filterDuplicatePaymentMethods();
          this.handleCashMutations();
          }
          this.checkShowDownload();
        }
        this.bStatisticLoading = false;
      },
        (error) => {
          this.bStatisticLoading = false;
          this.aStatistic = [];
          this.aPaymentMethods = [];
        }
      );
    this.getGreenRecords();
  }

  getArticleGroups(aUniqueArticleGroupId:any) {
    const oBody = {
      iBusinessId: this.iBusinessId,
      aArticleGroupId: aUniqueArticleGroupId
    }
    this.apiService.postNew('core', '/api/v1/business/article-group/list', oBody).subscribe((result: any) => {
      if (result?.data?.length && result?.data[0]?.result?.length) {
        this.aArticleGroupDetails = result?.data[0]?.result;
        this.setArticleGroupNames();
      }
    });
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
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}/${this.iLocationId}`).subscribe((result:any) => {
      if (result?.data?.length) {
        this.aWorkStation = result.data;
        this.sCurrentWorkstation = this.aWorkStation.filter((el: any) => el._id === this.iWorkstationId)[0]?.sName;
      }
    });
  }

  getEmployees() {
    this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.iBusinessId }).subscribe((result:any) => {
      if (result?.data?.length && result?.data[0]?.result?.length) {
        this.aEmployee = result.data[0].result;
        this.oCurrentEmployee = this.aEmployee.find((oEmployee:any) => oEmployee._id == this.iEmployeeId);
        if(this.oCurrentEmployee) {
          this.bAllowOpenManualCashDrawer = this.oCurrentEmployee.aRights.includes('DEVELOPER') || this.oCurrentEmployee.aRights.includes('OWNER');
        }
      }
    });
  }

  fetchBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId).subscribe((result: any) => {
      this.businessDetails = result.data;
      this.aLocation = this.businessDetails.aLocation;
      this.fetchStockValuePerLocation();
      let oLocation;
 
      if (this.bOpeningHistoricalDayState) {
        oLocation = this.aLocation.find((el: any) => el._id === this.oStatisticsData.iLocationId);
      } else {
        oLocation = this.aLocation.find((el: any) => el._id === this.iLocationId);
      }

      if (oLocation) {
        this.tillService.selectCurrency(oLocation);
        this.sCurrentLocation = this.businessDetails.sName + " (" + oLocation?.sName + ")";
        this.aSelectedLocation.push(oLocation._id);
      }
    });
  }

  async exportToPDF(mode:string = 'compact') {
    this.pdfGenerationInProgress = true;
    await this.auditService.exportToPDF({
      aSelectedLocation: this.aSelectedLocation,
      bIsDynamicState: this.IsDynamicState,
      aLocation: this.aLocation,
      aSelectedWorkStation: (this.iStatisticId) ? this.sCurrentWorkstation : (this.selectedWorkStation?.length ? this.selectedWorkStation : []),
      aWorkStation: this.aWorkStation,
      sBusinessName: this.businessDetails.sName,
      sDisplayMethod: this.sDisplayMethod,
      sDisplayMethodString: this.sSelectedOptionMenu,
      aStatistic: this.aStatistic,
      oStatisticsDocument: this.oStatisticsDocument,
      aStatisticsDocuments: this.aStatisticsDocuments,
      aPaymentMethods: this.aPaymentMethods,
      bIsArticleGroupLevel: this.bIsArticleGroupLevel,
      bIsSupplierMode: this.bIsSupplierMode,
      aEmployee: this.aEmployee,
      aStatisticsIds: (this.iStatisticId) ? [this.iStatisticId] : this.aStatisticsIds,
      oFilterData: {
        oFilterDates: (this.IsDynamicState) ? this.filterDates : {startDate: this.statisticFilter.dFromState, endDate: this.statisticFilter.dToState},
        mode,
        sType: this.sOptionMenu.parent.sValue,
        sTransactionType: this.sOptionMenu.parent.sKey,
        iBusinessPartnerId: this.aSelectedBusinessPartnerId,
        sFrom: this.sFrom
      }
    });
    this.pdfGenerationInProgress = false;
  }

  calculateTotalCounting() {
    this.oCountings.nCashCounted = 0;
    this.auditService.aAmount.forEach((amount: any) => {
      this.oCountings.nCashCounted += amount.nValue * amount.nQuantity;
    });
    this.oCountings.nCashRemain = this.oCountings.nCashCounted - this.oCountings.nSkim;
    localStorage.setItem('transactionAuditPdfService.aAmount', JSON.stringify(this.auditService.aAmount));
  }

  async expandItem(item: any, iBusinessPartnerId: any = undefined, from: string = 'articlegroup') {
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
        sFrom: 'audit',
        oFilterBy: {
          dStartDate: (this.IsDynamicState) ? new Date(this.filterDates.startDate) : this.statisticFilter.dFromState,
          dEndDate: (this.IsDynamicState) ? new Date(this.filterDates.endDate) : this.statisticFilter.dToState,
          // IsDynamicState
          bIsArticleGroupLevel: this.bIsArticleGroupLevel,
          bIsSupplierMode: this.bIsSupplierMode,
          iArticleGroupId: item?._id,
          iLocationId: this?.aSelectedLocation?.length ? this.aSelectedLocation : [],
          iWorkstationId: this.selectedWorkStation?.length ? this.selectedWorkStation : [],
          aStatisticsIds: (this.iStatisticId) ? [this.iStatisticId] : this.aStatisticsIds
        },
        sTransactionType: this.optionMenu,
        iBusinessId: this.iBusinessId,
      };

      // if (this.iStatisticId) {
      //   // data.oFilterBy.dStartDate = this.oStatisticsDocument?.dOpenDate;
      //   // data.oFilterBy.dEndDate = (this.oStatisticsDocument?.dCloseDate) ? this.oStatisticsDocument?.dCloseDate : this.oStatisticsData.dEndDate;
      // } else {
      //   data.oFilterBy.dStartDate = this.statisticFilter.dFromState || this.filterDates.startDate
      //   data.oFilterBy.dEndDate = this.statisticFilter.dToState || this.filterDates.endDate
      // }

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
        if (iBusinessPartnerId) data.oFilterBy.iBusinessPartnerId = iBusinessPartnerId;
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
          oTI.nRevenueAmount = oTI.nRevenueAmount * oTI.nQuantity;
          oTI.nProfitOfRevenue = oTI.nProfitOfRevenue * oTI.nQuantity;
          return oTI;
        })
      }
    } else if (from === 'payments') {
      if (item?.aItems) return;
      item.isLoading = true;
      const data: any = {
        iBusinessId: this.iBusinessId,
        iWorkstationId: this.iWorkstationId,
        iLocationId: this.iLocationId,
        oFilterBy: {
          iPaymentMethodId: item.iPaymentMethodId,
          aStatisticsIds: (this.iStatisticId) ? [this.iStatisticId] : this.aStatisticsIds
        }
      }
      if(!data.oFilterBy.aStatisticsIds?.length) {
        data.oFilterBy.dStartDate = (this.IsDynamicState) ? new Date(this.filterDates.startDate) : this.statisticFilter.dFromState
        data.oFilterBy.dEndDate = (this.IsDynamicState) ? new Date(this.filterDates.endDate) : this.statisticFilter.dToState
      }
      // if (this.iStatisticId) {
      //   data.oFilterBy.dStartDate = this.oStatisticsDocument?.dOpenDate;
      //   data.oFilterBy.dEndDate = (this.oStatisticsDocument?.dCloseDate) ? this.oStatisticsDocument?.dCloseDate : this.oStatisticsData.dEndDate;
      // } else {
      //   data.oFilterBy.dStartDate = this.statisticFilter.dFromState || this.filterDates.startDate
      //   data.oFilterBy.dEndDate = this.statisticFilter.dToState || this.filterDates.endDate
      // }
      const _result: any = await this.apiService.postNew('cashregistry', '/api/v1/payments/list', data).toPromise()
      if (_result.data?.length && _result.data[0]?.result?.length) {
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
      iEmployeeId: this.iEmployeeId,
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
    const oBody = this.processingDynamicDataRequest();
    const _oBody = JSON.parse(JSON.stringify(oBody));
    _oBody.oFilter.dEndDate = new Date();
    _oBody.bSkipCheckFlag = true; /*  bSkipCheckFlag is for, when there is no sell for a day and user is trying to close-the-day-state */
    return this.apiService.postNew('cashregistry', `/api/v1/statistics/transaction/audit`, _oBody).toPromise();
  }

  checkAndAskForQuickCountings() {
    const nTotalCash = this.oCountings.nCashInTill + this.oCountings.nCashAtStart;
    if (nTotalCash != 0 && !this.oCountings.nCashCounted) {
      this.dialogService.openModal(ClosingDaystateDialogComponent, {
        cssClass: 'modal-m', context: { nCashInTill: nTotalCash }, hasBackdrop: true, closeOnBackdropClick: false
      }).instance.close.subscribe((result: any) => {
        if (result?.type) {
          this.oCountings.nCashCounted = +(nTotalCash.toFixed(2));
          if (result?.data === 'leave_in_till') {
            this.oCountings.nCashRemain = +(nTotalCash.toFixed(2));
            this.oCountings.nSkim = 0;
          } else if (result?.data === 'skim_all') {
            this.oCountings.nSkim = +(nTotalCash.toFixed(2));
            this.oCountings.nCashRemain = 0;
          }
          this.onCloseDayState();
        }
      });
    } else this.onCloseDayState();
    localStorage.setItem('transactionAuditPdfService.aAmount', '');
  }

  async onCloseDayState() {
    
    /* fetching Audit detail for checking if day-state is changed or not */
    this.closingDayState = true;
    const oStatisticDetail: any = await this.getDynamicAuditDetail();
    this.closingDayState = false; /* while fetching the data, loader should show off */
    
    /* isAnyTransactionDone: If any transaction is not happened then we should not throw any error */
    if (!oStatisticDetail?.data?.isAnyTransactionDone) {
      const confirmBtnDetails = [
        { text: "PROCEED", value: 'proceed', status: 'success', class: 'ml-auto mr-2' },
        { text: "CANCEL", value: 'close' }
      ];
      this.dialogService.openModal(ConfirmationDialogComponent, 
        { 
          context: { 
            header: 'NO_TRANSACTION_CREATED', 
            bodyText: 'IN_THIS_PERIOD_NOT_TRANSACTION_HAS_BEE_CREATED', 
            buttonDetails: confirmBtnDetails 
          },
          hasBackdrop: true,
          closeOnBackdropClick: false,
          closeOnEsc: false 
          })
        .instance.close.subscribe((status: any) => {
          if (status === 'proceed') this.closeDayState(oStatisticDetail);
        }, (error) => {
          this.toastService.show({ type: 'warning', text: `Something went wrong` });
        })
    } else {
      this.closeDayState(oStatisticDetail);
    }
  }

  async closeDayState(oStatisticDetail: any) {
    this.closingDayState = true;

    /* isAnyTransactionDone: If any transaction is not happened then we should not throw any error */
    /* Below "IF CONIDTION" only used when we do have any transaction, if not transaction created in that period then we should not check */
    if (oStatisticDetail?.data?.isAnyTransactionDone) {
      if (!oStatisticDetail?.data?.oTransactionAudit?.length || !oStatisticDetail?.data?.oTransactionAudit[0]?.overall?.length) {
        this.toastService.show({ type: 'warning', text: 'Something went wrong' });
        return;
      }

      let aAmount = oStatisticDetail?.data?.oTransactionAudit[0]?.overall[0]?.nTotalRevenue
      let bAmount = this.aStatistic[0].overall[0].nTotalRevenue
      /* This is to check if day-state is not changed already (in mean-time) */
      if (
        oStatisticDetail?.data?.oTransactionAudit[0]?.overall[0]?.nQuantity != this.aStatistic[0].overall[0].nQuantity) {
        this.toastService.show({ type: 'warning', text: 'It seems someone created an extra transaction item. Refresh this page and try again.' });
        return;
      } else if ((bAmount - aAmount > 0.05 || bAmount - aAmount < -0.05)) {
        // below allows some difference of 0.05 but not greater than that + allows difference of -0.05 but not less difference
        this.toastService.show({ type: 'warning', text: 'There seems to be a difference of more than 0.05 cts between revenue and payments total. Refresh this page and try again. In case this message keeps appearing after refresh: contact support' });
        return;
      }
    }
    if(!this.oCountings?.oCountingsCashDetails) this.oCountings.oCountingsCashDetails = {};
    this.auditService.aAmount.filter((item: any) => item.nQuantity > 0).forEach((item: any) => (this.oCountings.oCountingsCashDetails[item.key] = item.nQuantity));
    
    this.oCountings.nCashDifference = +(this.oCountings.nCashCounted - (
      this.oCountings.nCashAtStart + this.oCountings.nCashInTill + this.oHelperDetails.nAmountToAdd + this.oHelperDetails.nAmountToDeduct
    )).toFixed(2);
    
    const oCashPaymentMethod = this.allPaymentMethod.find((el: any) => el.sName.toLowerCase() === 'cash');
    let oCashInSafePaymentMethod = this.allPaymentMethod.find((el: any) => el.sName.toLowerCase() === 'cash_in_safe');
    if (!oCashInSafePaymentMethod) {
      const oBody = {
        sName: 'CASH_IN_SAFE',
        bIsDefaultPaymentMethod: true,
        iBusinessId: this.iBusinessId,
        bStockReduction: false,
        bInvoice: false,
        bAssignSavingPoints: false,
        bAssignSavingPointsLastPayment: false,
        sLedgerNumber: '',
        bShowInCashRegister: false
      }
      const _result: any = await this.apiService.postNew('cashregistry', '/api/v1/payment-methods/create', oBody).toPromise();
      oCashInSafePaymentMethod = _result.data;
    }
    const nVatRate = await this.taxService.fetchDefaultVatRate({ iLocationId: this.iLocationId });

    const oBody:any = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      iEmployeeId: this.iEmployeeId,
      iStatisticId: this.iStatisticId,
      oCountings: this.oCountings,
      sComment: this.oStatisticsDocument.sComment,
      sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation',
      oCloseDayStateData: {
        oCashPaymentMethod,
        oCashInSafePaymentMethod,
        nVatRate,
      },
    }
    const org = localStorage.getItem('org');
    if(org) oBody.aLanguage = JSON.parse(org)['aLanguage'];
    // return;
    this.closeSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/close/day-state`, oBody).subscribe((result: any) => {
      this.toastService.show({ type: 'success', text: this.translateService.instant('DAY_STATE_IS_CLOSED_NOW')});
      this.closingDayState = false;
      this.bDayStateClosed = true;
      if(result?.data?._id) {
        this.statisticFilter.dFromState = result?.data.dOpenDate;
        this.statisticFilter.dToState = result?.data.dCloseDate;
      }
      this.getStaticData();
    }, (error) => {
      console.log('Error: ', error);
      this.toastService.show({ type: 'warning', text: 'Something went wrong or open the day-state first' });
      this.closingDayState = false;
    })
  }

  getPaymentMethods() {
    this.payMethods = [];
    this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.iBusinessId).subscribe((result: any) => {
      if (result?.data?.length) {
        this.allPaymentMethod = result.data;
        this.payMethods = [...result.data];
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
          amount: +((item.nNewAmount - item.nAmount).toFixed(2)),
          comment: 'PAYMENT_METHOD_CHANGE',
          oPayment: {
            iPaymentMethodId: item.iPaymentMethodId,
            nAmount: +((item.nNewAmount - item.nAmount).toFixed(2)),
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
            amount: +(item.nAmount.toFixed(2)),
            comment: 'PAYMENT_METHOD_CHANGE',
            oPayment: {
              iPaymentMethodId: item._id,
              nAmount: +(item.nAmount.toFixed(2)),
              sMethod: item.sName.toLowerCase()
            },
            nVatRate: nVatRate
          }).toPromise();
        }
      }
    }

    const endDate = new Date();
    this.filterDates.endDate = moment(endDate).format("YYYY-MM-DDThh:mm");
    this.oStatisticsData.dEndDate = endDate;

    this.paymentEditMode = false;
    event.target.disabled = false;

    this.fetchStatistics();
  }

  onChangeDropdown() {
    this.statisticFilter.dFromState = '';
    this.statisticFilter.dToState = '';
    this.aDayClosure = [];
    this.fetchAuditStatistic();
  }

  /* For FROM State and TO State */
  fetchDayClosureList() {
    try {
      this.bDayClosureLoading = true;
      this.aDayClosure = [];
      const oBody = {
        iBusinessId: this.iBusinessId,
        sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation',
        oFilter: {
          iLocationId: this.iLocationId,
          aLocationId: this?.aSelectedLocation?.length ? this.aSelectedLocation : [],
          iWorkstationId: this.selectedWorkStation?.length ? this.selectedWorkStation : []
        },
      }
      this.dayClosureListSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/list`, oBody).subscribe((result: any) => {
        if (result?.data?.length && result.data[0]?.result?.length) {
          this.aDayClosure = result.data[0]?.result.map((oDayClosure: any) => {
            this.aCalendarEvent.push({
              title: oDayClosure?.sWorkStationName,
              start: oDayClosure?.dOpenDate,
              end: oDayClosure?.dCloseDate,
              customProperty: { oDayClosure },
            })
            return {
              _id: oDayClosure?._id,
              dOpenDate: oDayClosure?.dOpenDate,
              dCloseDate: oDayClosure?.dCloseDate,
              isDisable: true,
              sWorkStationName: oDayClosure?.sWorkStationName,
              eCreationType: oDayClosure?.eCreationType
            }
          });
        }
        this.bDayClosureLoading = false;
      }, (error) => {
        this.bDayClosureLoading = false;
        console.log('error: ', error);
      })
    } catch (error) {
      this.bDayClosureLoading = false;
      console.log('error: ', error);
    }
  }

  async openCalendar(eType: string) {
    this.bIsCalendarOpen = true;
    if (!this.aCalendarEvent?.length) {
      this.toastService.show({ type: 'warning', text: `There is no data available` });
      return;
    }
    this.dialogService.openModal(CalendarGanttViewDialogComponent, {
      cssClass: "modal-lg",
      context: {
        aCalendarEvent: this.aCalendarEvent,
        eType, /* from-state or to-state */
        aWorkStation: this.aWorkStation,
        aLocation: this.aLocation,
        oCalendarSelectedData: this.oCalendarSelectedData,
        aSelectedLocation: this.aSelectedLocation,
        sDayClosureMethod: this.sDayClosureMethod
      },
      hasBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEsc: false
    }).instance.close.subscribe((result: any) => {
      this.bIsCalendarOpen = false;
      if (result?.isChosen) {
        
        this.selectedWorkStation = result?.oData?.selectedWorkStation;
        this.aSelectedLocation = result?.oData?.aSelectedLocation;

        const _oDayClosure = result?.oData?.extendedProps?.customProperty?.oDayClosure;

        // if (isOpenDate) this.statisticFilter.dFromState = _oDayClosure.dOpenDate
        // else this.statisticFilter.dToState = _oDayClosure.dCloseDate


        /* for enabling and disabling the date in calendar-view */
        if (eType === 'FROM_STATE') {
          this.statisticFilter.dFromState = this.oCalendarSelectedData.dOpenDate = result?.oData?.start;
          if (!this.oCalendarSelectedData.dCloseDate) this.statisticFilter.dToState = this.oCalendarSelectedData.dCloseDate = result?.oData?.end;
        } else if (eType === 'TO_STATE') {
          this.statisticFilter.dToState = this.oCalendarSelectedData.dCloseDate = result?.oData?.end;
          if (!this.oCalendarSelectedData.dOpenDate) this.statisticFilter.dFromState = this.oCalendarSelectedData.dOpenDate = result?.oData?.start;
        }
        console.log('eType:', eType);
        console.log('oData clicked:', result?.oData?.title);
        console.log('Start:', result?.oData?.start);
        console.log('End:', result?.oData?.end);
        console.log('_oDayClosure:', _oDayClosure);

        this.onStateChange(_oDayClosure, true);
        this.onStateChange(_oDayClosure, false);
      }
    });
  }

  /* we are only enabling the [sales->article-group->compcat] mode when migration date chosen */
  toggleDropdownOfState() {
    const isMigrationChosen = this.statisticFilter.eChosenStateCreationType == 'migration' ? true : false;

    const oData = {
      oParent: {},
      oChild: {},
      oGrandChild: {}
    }

    /* Parent */
    for (const oOption of this.aOptionMenu) {
      oOption.bDisable = false;
      if (isMigrationChosen && oOption.sKey !== 'SALES') oOption.bDisable = true;
      else oData.oParent = oOption;

      /* Child */
      for (const oChild of oOption?.children) {
        oChild.bDisable = false;
        if (isMigrationChosen && oChild.sKey !== 'ArticleGroup') oChild.bDisable = true;
        else oData.oChild = oChild;

        /* Grand-Child */
        for (const oGrandChild of oChild.children) {
          oGrandChild.bDisable = false;
          if (isMigrationChosen && oGrandChild.sKey !== 'Compact') oGrandChild.bDisable = true;
          else oData.oGrandChild = oGrandChild;
        }
      }
    }

    /* Migrated statistic only works with Sales->ArticleGroup->Compact so we making default selected */
    if (isMigrationChosen) this.onDropdownItemSelected(oData.oParent, oData.oChild, oData.oGrandChild);
  }

  onStateChange(_oDayClosure: any, isOpenDate: boolean) {
    if (_oDayClosure?.eCreationType) this.statisticFilter.eChosenStateCreationType = _oDayClosure.eCreationType;
    console.log('_oDayClosure.dOpenDate: ', _oDayClosure.dOpenDate, _oDayClosure.dCloseDate);

    this.aStatistic = [];
    this.aStatisticsIds = [];

    const dFromStateTime = new Date(this.statisticFilter.dFromState).getTime();
    const dToStateTime = new Date(this.statisticFilter.dToState).getTime();
    /* Disabling the date which is smaller than the dFromState in dToState */
    this.aDayClosure.forEach((oDayClosure: any) => {
      oDayClosure.isDisable = false;
      const dDayClosureDateTime = new Date(oDayClosure.dCloseDate).getTime();
      if (dFromStateTime > dDayClosureDateTime) oDayClosure.isDisable = true; // || oDayClosure.eCreationType !== _oDayClosure.eCreationType

      const dFromTime = new Date(oDayClosure.dOpenDate).getTime();
      const dToTime = new Date(oDayClosure.dCloseDate).getTime();

      if (dFromTime >= dFromStateTime && dToTime <= dToStateTime) this.aStatisticsIds.push(oDayClosure._id);
    });

    this.toggleDropdownOfState();
    this.checkShowDownload();
  }

  checkShowDownload() {
    if (this.bOpeningHistoricalDayState) {
      // console.log({bOpeningHistoricalDayState: this.bOpeningHistoricalDayState})
      this.bShowDownload = true;  
    } else if (this.bOpeningDayClosure) {
      // console.log({bOpeningDayClosure: this.bOpeningDayClosure})
      this.bShowDownload = this.bDayStateClosed;
    } else if (this.IsDynamicState) {
      // console.log({ IsDynamicState: this.IsDynamicState, aStatistic: this.aStatistic }, this.filterDates.startDate, this.filterDates.endDate)
      this.bShowDownload = this.filterDates.startDate && this.filterDates.endDate &&
        this.aStatistic?.length && 
        this.aStatistic[0]?.individual?.length
    } else {
      // console.log('in else')
      const bCondition1 = !this.selectedEmployee?._id && !this.selectedWorkStation?._id && !(this.aSelectedLocation?.length > 1);
      
      this.bShowDownload = (bCondition1 &&
        this.statisticFilter.dFromState != '' && 
        this.statisticFilter.dToState != '' && 
        this.aStatistic?.length && 
        this.aStatistic[0]?.individual?.length
      );
      // console.log({ bCondition1, from: this.statisticFilter.dFromState, to: this.statisticFilter.dToState, aStatistic:this.aStatistic });
    }
    // console.log({oStatisticsDocument: this.oStatisticsDocument})
    if (this.bShowDownload) {
      setTimeout(() => {
        MenuComponent.reinitialization();
      });
    }
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

  async openTransactionDetailsModal(oItem:any){
    // console.log(oItem);
    const oBody = {
      iBusinessId: this.iBusinessId,
      type: 'transaction',
      eType: 'cash-register-revenue',
      bIsDetailRequire:true,
      oFilterBy: {
        _id: oItem.iTransactionId
      }
    }
    const oTransaction:any = await this.apiService.postNew('cashregistry', '/api/v1/transaction/list', oBody).toPromise();
    // console.log(oTransaction);
      this.dialogService.openModal(TransactionDetailsComponent,
        {
          cssClass: "w-fullscreen mt--5",
          context: {
            transaction: oTransaction?.data?.result[0],
            businessDetails: this.businessDetails,
            from: 'audit',
            employeesList: this.aEmployee
          },
          hasBackdrop: true,
          closeOnBackdropClick: false,
          closeOnEsc: false
        }).instance;
  }

  reCalculateDayClosure() {
    console.log('reCalculateDayClosure called');
    this.bReCalculateLoading = true;
    const oBody = {
      iBusinessId: this.iBusinessId,
      // iLocationId: this.iLocationId,
      // iWorkstationId: this.iWorkstationId,
      iStatisticId: this.iStatisticId
    }
    this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/re-calculate`, oBody).subscribe((result: any) => {
      this.bReCalculateLoading = false;
      this.toastService.show({ type: 'success', text: `Day-closure re-calculated successfully` });
    }, (error: any) => {
      this.bReCalculateLoading = false;
      console.log('error here: ', error);
      this.toastService.show({ type: 'warning', text: `Something went wrong` });
    })
  }

  ngOnDestroy(): void {
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
  
  async openDrawer() {
    this.bOpeningDrawer = true;
    if (!this.aPrintSettings?.length) {
      const oBody = {
        iLocationId: this.iLocationId,
        iWorkstationId: this.iWorkstationId
      }
      const result:any = await this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, oBody).toPromise();
      if (result?.data?.length && result?.data[0]?.result?.length) {
        this.aPrintSettings = result.data[0].result;
      }
    }
    const oSettings = this.aPrintSettings?.find((settings: any) =>
      settings.sMethod === 'thermal' &&
      settings.iWorkstationId === this.iWorkstationId &&
      settings.sType === 'regular' &&
      settings.nComputerId &&
      settings.nPrinterId);

    if (oSettings) {
      const response:any = await this.receiptService.openDrawer(this.businessDetails.oPrintNode.sApiKey, oSettings.nPrinterId, oSettings.nComputerId).toPromise();
      this.bOpeningDrawer = false;
      if (response.status == "PRINTJOB_NOT_CREATED") {
        let message = '';
        if (response.computerStatus != 'online') {
          message = 'Your computer status is : ' + response.computerStatus + '.';
        } else if (response.printerStatus != 'online') {
          message = 'Your printer status is : ' + response.printerStatus + '.';
        }
        this.toastService.show({ type: 'warning', title: 'PRINTJOB_NOT_CREATED', text: message });
      } else {
        this.toastService.show({ type: 'success', text: 'DRAWER_OPENED', apiUrl: '/api/v1/printnode/print-job', templateContext: { apiKey: this.businessDetails.oPrintNode.sApiKey, id: response.id } });
      }
    } else {
      this.toastService.show({ type: 'warning', text: 'Error while opening cash drawer. Please check your print settings!' })
    }
  }

  openDayClosureHelpModal() {
    this.dialogService.openModal(ClosingDaystateHelperDialogComponent, { 
      cssClass: 'modal-lg', 
      hasBackdrop: true,
      context: {
        oHelperDetails: JSON.parse(JSON.stringify(this.oHelperDetails)),
        oCountings: this.oCountings,
        oCashPaymentMethod: this.allPaymentMethod.find((o: any) => o.sName.toLowerCase() === 'cash')
      } 
    }).instance.close.subscribe((result:any) => {
      if(result?.type) {
        this.oHelperDetails = JSON.parse(JSON.stringify(result.oHelperDetails));
        this.oHelperDetails.bSaved = false;
        let nAmountToDeduct = 0, nAmountToAdd = 0;
        this.oHelperDetails.aReasons.forEach((oReason:any) => {
          switch(oReason.sKey) {
            case 'expense-lost-money': 
            case 'add-expenses':
              nAmountToDeduct += oReason.nAmount;
              oReason.nAmount = -oReason.nAmount;
              break;
            case 'add-cash-without-revenue':
              nAmountToAdd += oReason.nAmount;
              break;
          }
        })
        if (this.oHelperDetails.oStartAmountIncorrect.bChecked) nAmountToAdd += this.oHelperDetails.oStartAmountIncorrect.nAmount;
        if (nAmountToDeduct > 0) this.oHelperDetails.nAmountToDeduct = -nAmountToDeduct;
        this.oHelperDetails.nAmountToAdd = nAmountToAdd;
        this.oHelperDetails.nAmountToDeduct = nAmountToDeduct;
        console.log(this.oHelperDetails);
      }
    });
  }

  async saveHelperDetails() {
    localStorage.setItem('oCountings', JSON.stringify(this.oCountings));
    const aTransactionItem:any = [];

    if (this.oHelperDetails.oStartAmountIncorrect.bChecked) {
      aTransactionItem.push(this.oHelperDetails.oStartAmountIncorrect.oExpense.oTransactionItem);
    }
    this.oHelperDetails.aReasons.forEach((oReason:any) => {
      if (oReason?.oExpense?.oTransactionItem) aTransactionItem.push(oReason?.oExpense?.oTransactionItem);
    });
    
    if(aTransactionItem.length) {
      const aPromise:any = [];
      this.bSavingHelperDetails = true;
      aTransactionItem.forEach((oTransactionItem:any) => {
        aPromise.push(this.apiService.postNew('cashregistry', '/api/v1/till/add-expenses', oTransactionItem).toPromise())
      })
      await Promise.all(aPromise);
      this.bSavingHelperDetails = false;
    }
    this.oHelperDetails.bSaved = true;
    this.oHelperDetails.nAmountToDeduct = 0;
    this.fetchStatistics();
  }

  listBusinessSubscription!: Subscription;
  getStatisticSubscription!: Subscription;
  statisticAuditSubscription!: Subscription;
  greenRecordsSubscription!: Subscription;
  propertyListSubscription!: Subscription;
  workstationListSubscription!: Subscription;
  employeeListSubscription!: Subscription;
  transactionItemListSubscription!: Subscription;
  closeSubscription!: Subscription;
  dayClosureListSubscription !: Subscription;
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

  oCountings: any = {
    nCashCounted: 0,
    nCashInTill: 0,
    nSkim: 0,
    nCashDifference: 0,
    nCashRemain: 0,
    nCashAtStart: 0,
    oCountingsCashDetails: {},
  };
}
