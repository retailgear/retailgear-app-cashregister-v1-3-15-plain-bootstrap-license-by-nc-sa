import { animate, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { faArrowRightFromBracket, faBoxesStacked, faCalculator, faCoins, faCopy, faGifts, faMoneyBill, faRing, faRotateLeft, faScrewdriverWrench, faSearch, faSpinner, faTimes, faTimesCircle, faTrash, faTrashAlt, faTruck, faUser } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { MenuComponent } from '../shared/_layout/components/common';
import { AddExpensesComponent } from '../shared/components/add-expenses-dialog/add-expenses.component';
import { CardsComponent } from '../shared/components/cards-dialog/cards-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CustomerActivitiesDialogComponent } from '../shared/components/customer-activities-dialog/customer-activities.component';
import { CustomerDialogComponent } from '../shared/components/customer-dialog/customer-dialog.component';
import { MorePaymentsDialogComponent } from '../shared/components/more-payments-dialog/more-payments-dialog.component';
import { TerminalDialogComponent } from '../shared/components/terminal-dialog/terminal-dialog.component';
import { ToastService } from '../shared/components/toast';
import { TransactionActionDialogComponent } from '../shared/components/transaction-action-dialog/transaction-action-dialog.component';
import { TransactionItemsDetailsComponent } from '../shared/components/transaction-items-details/transaction-items-details.component';
import { TransactionsSearchComponent } from '../shared/components/transactions-search/transactions-search.component';
import { ApiService } from '../shared/service/api.service';
import { BarcodeService } from "../shared/service/barcode.service";
import { CreateArticleGroupService } from '../shared/service/create-article-groups.service';
import { CustomerStructureService } from '../shared/service/customer-structure.service';
import { DialogComponent, DialogService } from '../shared/service/dialog';
import { FiskalyService } from '../shared/service/fiskaly.service';
import { PaymentDistributionService } from '../shared/service/payment-distribution.service';
import { ReceiptService } from '../shared/service/receipt.service';
import { TerminalService } from '../shared/service/terminal.service';
import { TillService } from '../shared/service/till.service';
import { SupplierWarningDialogComponent } from './dialogs/supplier-warning-dialog/supplier-warning-dialog.component';
@Component({
  selector: 'app-till',
  templateUrl: './till.component.html',
  styleUrls: ['./till.component.scss'],
  providers: [BarcodeService],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('0ms', style({ opacity: 0 }))
      ])
    ])
  ],
  // encapsulation: ViewEncapsulation.ShadowDom,
})
export class TillComponent implements OnInit, AfterViewInit, OnDestroy {

  faScrewdriverWrench = faScrewdriverWrench;
  faTruck = faTruck;
  faBoxesStacked = faBoxesStacked;
  faGifts = faGifts;
  faUser = faUser;
  faTimes = faTimes;
  faTimesCircle = faTimesCircle;
  faTrashAlt = faTrashAlt;
  faTrash = faTrash;
  faRing = faRing;
  faCoins = faCoins;
  faCalculator = faCalculator;
  faMoneyBill = faMoneyBill;
  faArrowRightFromBracket = faArrowRightFromBracket;
  faSpinner = faSpinner;
  faSearch = faSearch;
  faCopy = faCopy;
  faRotateLeft = faRotateLeft;
  transactionItems: Array<any> = [];
  selectedTransaction: any = null;
  customer: any;
  searchKeyword: any;
  shopProducts: any = [];
  commonProducts: any = [];
  supplierId!: string;
  iActivityId!: string;
  sNumber: string = '';
  isStockSelected = true;
  payMethods: Array<any> = [];
  allPaymentMethod: Array<any> = [];
  appliedGiftCards: Array<any> = [];
  redeemedLoyaltyPoints: number = 0;
  business: any = {};
  payMethodsLoading: boolean = false;
  isGoldForPayments = false;
  requestParams: any = { iBusinessId: '' };
  parkedTransactionLoading = false;
  eKind: string = 'regular';
  parkedTransactions: Array<any> = [];
  terminals: Array<any> = [];
  quickButtons: Array<any> = [];
  fetchingProductDetails: boolean = false;
  bSearchingProduct: boolean = false;
  bSearchingCommonProduct: boolean = false;
  bIsPreviousDayStateClosed: boolean = true;
  bIsDayStateOpened: boolean = false; // Not opened then require to open it first
  bDayStateChecking: boolean = false;
  dOpenDate: any = '';
  aBusinessLocation: any = [];

  transaction: any = {};
  activityItems: any = {};
  amountDefined: any;
  aProjection: Array<any> = [
    'oName',
    'sEan',
    'nVatRate',
    'sProductNumber',
    'nPriceIncludesVat',
    'bDiscountOnPercentage',
    'nDiscount',
    'sLabelDescription',
    'aImage',
    'aProperty',
    'aLocation',
    'sArticleNumber',
    'iArticleGroupId',
    'iBusinessPartnerId',
    'sBusinessPartnerName',
    'iBusinessBrandId',
    'nPurchasePrice',
    'iBrandId',
  ];
  discountArticleGroup: any = {};
  saveInProgress = false;
  @ViewChild('searchField') searchField!: ElementRef;
  selectedQuickButton: any;
  getSettingsSubscription !: Subscription;
  dayClosureCheckSubscription !: Subscription;
  businessDetails: any;
  printActionSettings: any;
  printSettings: any;
  activity: any;
  bIsOpeningDayState: boolean = false;
  bHasIActivityItemId: boolean = false;
  bSerialSearchMode = false;
  employee: any;
  bIsFiscallyEnabled: boolean = false;
  bDisablePrepayment: boolean = true;
  bAllGiftcardPaid: boolean = true;

  // paymentChanged: Subject<any> = new Subject<any>();
  availableAmount: any = 0;
  nFinalAmount = 0;
  nItemsTotalToBePaid = 0;
  nItemsTotalDiscount = 0;
  nItemsTotalQuantity = 0;
  nTotalPayment = 0;

  oStaticData: any = {};

  iBusinessId = localStorage.getItem('currentBusiness') || '';
  iLocationId = localStorage.getItem('currentLocation') || '';
  iWorkstationId = localStorage.getItem('currentWorkstation') || '';
  language: any = localStorage.getItem('language') || 'en';

  /* Check if saving points are enabled */
  // savingPointsSetting: boolean;// = JSON.parse(localStorage.getItem('savingPoints') || '');

  bIsTransactionLoading = false;
  nGiftcardAmount = 0;
  bDisableCheckout: boolean;
  bShowOverassignedWarning: boolean;
  nClientId: any = "-";

  bFromBarcode: boolean = false;
  bProductSelected: boolean = false;

  oShopProductsPaginationConfig: any = {
    id: 'paginate_shop_products',
    itemsPerPage: 6,
    currentPage: 1,
    totalItems: 0
  };
  oCommonProductsPaginationConfig: any = {
    id: 'paginate_common_products',
    itemsPerPage: 6,
    currentPage: 1,
    totalItems: 0
  };
  bNormalOrder: boolean = true;
  sBusinessCountry: string = '';
  bAllowOpenManualCashDrawer: boolean = false;
  aInitialPaymentMethods: any = [];
  workstations: Array<any> = [];


  randNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    // event.preventDefault();
    let bFound = false;
    if (event?.key?.length) {
      if (event?.key?.startsWith("F")) {
        const oButton = this.quickButtons.find((el: any) => el?.oKeyboardShortcut?.sKey1 == event.key)
        if (oButton) {
          bFound = true;
          this.onSelectProduct(oButton, 'quick-button', '', oButton)
        }
      } else {
        const oKeyboardShortcut = {
          sKey1: '',
          sKey2: event.key
        }
        if (event.ctrlKey) oKeyboardShortcut.sKey1 = 'Control';
        if (event.altKey) oKeyboardShortcut.sKey1 = 'Alt';
        const oButton = this.quickButtons.find((el: any) => el?.oKeyboardShortcut?.sKey1 == oKeyboardShortcut.sKey1 && el.oKeyboardShortcut?.sKey2 == oKeyboardShortcut.sKey2)
        if (oButton) {
          bFound = true;
          this.onSelectProduct(oButton, 'quick-button', '', oButton)
        }
      }
    }
    if (bFound) event.preventDefault();
  }

  constructor(
    private translateService: TranslateService,
    private dialogService: DialogService,
    private paymentDistributeService: PaymentDistributionService,
    private apiService: ApiService,
    private toastrService: ToastService,
    public tillService: TillService,
    private barcodeService: BarcodeService,
    private terminalService: TerminalService,
    private createArticleGroupService: CreateArticleGroupService,
    private customerStructureService: CustomerStructureService,
    private fiskalyService: FiskalyService,
    private receiptService: ReceiptService,
  ) { }

  async ngOnInit() {
    this.getWorkstations();
    this.apiService.setToastService(this.toastrService)
    this.paymentDistributeService.setToastService(this.toastrService)
    this.tillService.updateVariables();
    this.bDayStateChecking = true;
    if (this.iLocationId != this.tillService?.settings?.currentLocation?.iLocationId) {
      this.tillService.settings = null;
      await this.tillService.fetchSettings();
    }
    this.tillService.fetchPointsSettings();
    this.checkDayState();
    this.requestParams.iBusinessId = this.iBusinessId;
    this.getPaymentMethods();
    this.getParkedTransactions();

    this.barcodeService.barcodeScanned.subscribe((barcode: string) => {
      this.openModal(barcode);
    });

    this.checkArticleGroups();

    if (this.bIsDayStateOpened) this.fetchQuickButtons();

    const currentEmployeeId = JSON.parse(localStorage.getItem('currentUser') || '')['userId'];

    const _businessData: any = await this.getBusinessDetails().toPromise();
    this.businessDetails = _businessData.data;
    this.aBusinessLocation = this.businessDetails?.aLocation || [];
    this.businessDetails.currentLocation = this.businessDetails?.aLocation?.find((location: any) => location?._id === this.iLocationId);
    /*Needed to change fields order*/
    if (this.businessDetails?.currentLocation) {
      this.sBusinessCountry = this.businessDetails?.currentLocation?.oAddress?.countryCode;
      //console.log(this.sBusinessCountry);
      if (this.sBusinessCountry == 'UK' || this.sBusinessCountry == 'GB' || this.sBusinessCountry == 'FR') {
        this.bNormalOrder = false;
      }
    }

    this.tillService.selectCurrency(this.businessDetails.currentLocation);
    // this.getPrintSettings(true)
    this.getPrintSettings()
    this.getEmployee(currentEmployeeId)

    this.mapFiscallyData()

    this.checkout();

    setTimeout(() => {
      MenuComponent.bootstrap();
    });

  }

  getWorkstations() {
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}/${this.iLocationId}`).subscribe((result: any) => {
      if (result && result.data) {
        this.workstations = result.data;
      }
    });
  }

  async mapFiscallyData() {
    let _fiscallyData: any;
    try {
      _fiscallyData = await this.fiskalyService.getTSSList();
    } catch (err) {
      // console.log('error while executing fiskaly service', err)
    }
    if (_fiscallyData) {

      this.businessDetails.aLocation.forEach((location: any) => {
        const oMatch = _fiscallyData.find((tss: any) => tss.iLocationId === location._id)
        if (oMatch) {
          location.tssInfo = oMatch.tssInfo;
          location.bIsFiskalyEnabled = oMatch.bEnabled;
        }
      });
      if (this.businessDetails.currentLocation?.tssInfo && this.businessDetails.currentLocation?.bIsFiskalyEnabled) {
        this.bIsFiscallyEnabled = true;
        this.cancelFiskalyTransaction();
        this.fiskalyService.setTss(this.businessDetails.currentLocation?.tssInfo._id)
      }
    }

    this.loadTransaction();
  }

  ngAfterViewInit() {
    if (this.searchField)
      this.searchField.nativeElement.focus();
  }
  // async getfiskalyInfo() {
  //   const tssId = await this.fiskalyService.fetchTSS();
  // }

  onSelectRegular() {
    this.shopProducts = []; this.commonProducts = []; this.eKind = 'regular'; this.isStockSelected = true
  }
  onSelectOrder() {
    this.shopProducts = []; this.commonProducts = []; this.eKind = 'order'; this.isStockSelected = false
    if (this.searchField)
      this.searchField.nativeElement.focus();
  }

  loadTransaction() {
    const fromTransactionPage: any = localStorage.getItem('fromTransactionPage');
    if (fromTransactionPage) {
      this.handleTransactionResponse(JSON.parse(fromTransactionPage));
      localStorage.removeItem('fromTransactionPage');
      localStorage.removeItem('recentUrl');
    } else {
      this.bIsTransactionLoading = false;
    }
  }

  getValueFromLocalStorage(key: string): any {
    if (key === 'currentEmployee') {
      const value = localStorage.getItem('currentUser');
      if (value) {
        return JSON.parse(value)
      } else {
        return ''
      }
    } else {
      return localStorage.getItem(key) || '';
    }
  }

  getPaymentMethods() {
    this.payMethodsLoading = true;
    this.payMethods = [];
    this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.requestParams.iBusinessId).subscribe(async (result: any) => {
      if (result?.data?.length) { //test
        this.allPaymentMethod = result.data.map((v: any) => ({ ...v, isDisabled: false }));
        //console.log('im here 1',  this.allPaymentMethod);
        if (this.tillService?.settings?.aDefaultPayMethodSettings?.length) {
          for (let oMethod of this.allPaymentMethod) {
            let setting = await this.tillService?.settings?.aDefaultPayMethodSettings?.find((el: any) => el._id == oMethod._id)
            if (setting) {
              //console.log('im inside here')
              oMethod.bShowInCashRegister = setting.bShowInCashRegister;
              oMethod.bStockReduction = setting.bStockReduction;
              oMethod.bInvoice = setting.bInvoice;
              oMethod.bAssignSavingPoints = setting.bAssignSavingPoints;
              oMethod.bAssignSavingPointsLastPayment = setting.bAssignSavingPointsLastPayment;
            }
          }
        }

        const aVisibleMethods = this.allPaymentMethod.filter((el: any) => el.bShowInCashRegister);
        if (this.tillService?.settings?.aPaymentMethodSequence?.length) {
          this.tillService.settings.aPaymentMethodSequence.forEach((iPaymentMethodId: any) =>
            this.payMethods.push(aVisibleMethods.find((el: any) => el._id == iPaymentMethodId))
          );
        } else {
          if (aVisibleMethods.length)
            this.payMethods = aVisibleMethods;
          else
            this.payMethods = result.data.filter((el: any) => el.bShowInCashRegister);
        }
      }
      this.aInitialPaymentMethods = this.payMethods;
      this.payMethodsLoading = false;
    }, (error) => {
      this.payMethodsLoading = false;
    })
  }

  async addOrder(product: any) {
    let tax = Math.max(...this.tillService.taxes.map((tax: any) => tax.nRate), 0);
    this.transactionItems.push({
      eTransactionItemType: 'regular',
      // manualUpdate: false,
      isExclude: false,
      index: this.transactionItems.length,
      name: this.searchKeyword,
      oType: { bRefund: false, bDiscount: false, bPrepayment: false },
      type: 'order',
      aImage: [],
      quantity: 1,
      nBrokenProduct: 0,
      price: 0,
      nPurchasePrice: 0,
      nMargin: 2,
      nDiscount: 0,
      tax: tax,
      paymentAmount: 0,
      oArticleGroupMetaData: { aProperty: [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      description: '',
      sServicePartnerRemark: '',
      sCommentVisibleServicePartner: '',
      eEstimatedDateAction: 'call_on_ready',
      open: true,
      new: true,
      isFor: 'create',
      eActivityItemStatus: 'new'
    });
    this.searchKeyword = '';
    this.clearPaymentAmounts();
    await this.updateFiskalyTransaction('ACTIVE', []);
  }

  updateAmountVariables() {
    // console.log('updateAmountVariables');
    this.nItemsTotalToBePaid = +(_.sumBy(this.transactionItems, (item: any) => (!item.isExclude) ? item.amountToBePaid : 0).toFixed(2));//this.getTotals('price');
    this.nItemsTotalDiscount = this.getTotals('discount');
    this.nItemsTotalQuantity = +(_.sumBy(this.transactionItems, 'quantity').toFixed(2))
    this.nTotalPayment = +(_.sumBy(this.transactionItems.filter((i: any) => !i.isExclude), 'paymentAmount').toFixed(2))
    // console.log('here in 411',this.nTotalPayment, this.nItemsTotalToBePaid, this.availableAmount);
    if (this.availableAmount > this.nItemsTotalToBePaid && this.nTotalPayment == this.nItemsTotalToBePaid) {
      // console.log('if 1', Math.abs(this.availableAmount - this.nItemsTotalToBePaid).toFixed(2), this.availableAmount, this.nItemsTotalToBePaid)
      this.nFinalAmount = +(Math.abs(this.availableAmount - this.nItemsTotalToBePaid).toFixed(2));
    } else if (this.availableAmount > this.nTotalPayment) {
      // console.log('else if 1')
      this.nFinalAmount = +(Math.abs(this.availableAmount - this.nTotalPayment).toFixed(2));
    } else {
      // console.log('else')
      this.nFinalAmount = +(Math.abs(this.nItemsTotalToBePaid - this.nTotalPayment).toFixed(2));
    }

    // console.log({
    //   nItemsTotalToBePaid: this.nItemsTotalToBePaid,
    //   nTotalPayment: this.nTotalPayment,
    //   nFinalAmount: this.nFinalAmount,
    //   availableAmount: this.availableAmount,
    //   nItemsTotalDiscount: this.nItemsTotalDiscount
    // })

    this.checkout();
  }

  getTotals(type: string): number {
    this.amountDefined = this.payMethods.find((pay) => pay.amount || pay.amount?.toString() === '0');
    if (!type) {
      return 0
    }
    let result = 0
    switch (type) {
      case 'price':
        this.transactionItems.filter((el: any) => !['loyalty-points'].includes(el.type)).forEach((i) => {
          if (!i.isExclude) {
            const nPrice = (typeof i.price === 'string') ? i.price.replace(',', '.') : i.price;
            let discountPrice = i.bDiscountOnPercentage ? (nPrice - this.tillService.getPercentOf(nPrice, i?.nDiscount || 0)) : i.nDiscount;
            discountPrice = +(discountPrice.toFixed(2));
            // console.log({nPrice, discountPrice})
            if (i.tType === 'refund') {
              i.nTotal = (i.quantity * (nPrice - discountPrice)) - (i?.nGiftcardDiscount || 0) - (i?.nRedeemedLoyaltyPoints || 0);
              result -= (i?.new) ? i.nTotal : i.nRefundAmount;
            } else {
              // i.nTotal = i.quantity * (nPrice - discountPrice);
              // i.nTotal -= i.nGiftcardDiscount || 0;
              // i.nTotal -= i.nRedeemedLoyaltyPoints || 0;
              // i.nTotal = i.type === 'gold-purchase' ? -1 * i.nTotal : i.nTotal;
              result += i.amountToBePaid - (i.prePaidAmount || 0);
            }
          } else {
            i.paymentAmount = 0;
          }
        });
        break;
      case 'quantity':
        result = _.sumBy(this.transactionItems, 'quantity') || 0
        break;
      case 'discount':
        let sum = 0;
        this.transactionItems.filter((el: any) => !['loyalty-points'].includes(el.type)).forEach(element => {
          let discountPrice = element.bDiscountOnPercentage ? (element.price * ((element.nDiscount || 0) / 100)) : element.nDiscount;
          sum += element.quantity * discountPrice;
          sum += element?.nGiftcardDiscount || 0;
          sum += element.nRedeemedLoyaltyPoints || 0;
        });
        result = sum;
        break;
      default:
        result = 0;
        break;
    }
    return +result.toFixed(2)
  }

  totalPrepayment() {
    // console.log('totalPrepayment', this.transactionItems)
    let result = 0
    this.transactionItems.forEach((i) => {
      // console.log(i);
      if (!i.isExclude) {
        result += (i.paymentAmount)// - i?.nGiftcardDiscount || 0 - i?.nRedeemedLoyaltyPoints || 0);
      }
    });
    return +(result.toFixed(2));
  }

  checkout() {
    this.bAllGiftcardPaid = this.transactionItems.filter((v: any) => v.type == 'giftcard' && !v.isExclude).every((el: any) => el.paymentAmount == el.amountToBePaid);

    this.bDisableCheckout = true;
    this.bShowOverassignedWarning = false;
    if (this.transactionItems?.length) {
      const bAllItemsAreExcluded = this.transactionItems.filter((item: any) => item?.isExclude)?.length == this.transactionItems?.length;
      // if (this.amountDefined && this.bAllGiftcardPaid) this.bDisableCheckout = false;
      if ((bAllItemsAreExcluded || (this.availableAmount && this.nTotalPayment)) && this.bAllGiftcardPaid) {
        this.bDisableCheckout = false;
      } else if (this.nTotalPayment > this.availableAmount) {
        this.bShowOverassignedWarning = true;
        this.bDisableCheckout = true;
      } else if (this.nItemsTotalToBePaid == 0) {
        this.bDisableCheckout = false;
      } else if (!this.bAllGiftcardPaid) {
        this.bDisableCheckout = true;
      }
      // console.log(bAllItemsAreExcluded,
      //   { bAllGiftcardPaid: this.bAllGiftcardPaid, nTotalPayment: this.nTotalPayment, availableAmount: this.availableAmount})
    }

  }
  async addItem(type: string) {
    // console.log('add item,', type, type==='repair')

    const price = (type === 'giftcard') ? 5 : 0;
    const tax = Math.max(...this.tillService.taxes.map((tax: any) => tax.nRate), 0);

    this.transactionItems.push({
      isExclude: type === 'repair',
      manualUpdate: type === 'gold-purchase',
      eTransactionItemType: 'regular',
      index: this.transactionItems.length,
      name: this.translateService.instant(type.toUpperCase()),
      type,
      oType: { bRefund: false, bDiscount: false, bPrepayment: false },
      oArticleGroupMetaData: { aProperty: [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      aImage: [],
      quantity: 1,
      nBrokenProduct: 0,
      price,
      nMargin: 2,
      nPurchasePrice: 0,
      nTotal: type === 'gold-purchase' ? -1 * price : price,
      nDiscount: 0,
      tax: tax,
      paymentAmount: type === 'gold-purchase' ? -1 * price : 0,
      description: '',
      sServicePartnerRemark: '',
      sCommentVisibleServicePartner: '',
      eActivityItemStatus: 'new',
      eEstimatedDateAction: 'call_on_ready',
      open: true,
      new: true,
      iBusinessId: this.iBusinessId,
      ...(type === 'giftcard') && { sGiftCardNumber: Date.now() },
      ...(type === 'giftcard') && { bGiftcardTaxHandling: 'true' },
      ...(type === 'giftcard') && { isGiftCardNumberValid: false },
      ...(type === 'gold-purchase') && { oGoldFor: { name: 'stock', type: 'goods' } }
    });
    this.clearPaymentAmounts();
    // console.log('added item', this.transactionItems[0].isExclude, this.transactionItems[0])
    await this.updateFiskalyTransaction('ACTIVE', []);
  }

  cancelItems(): void {
    if (this.transactionItems.length > 0) {
      const buttons = [
        { text: 'YES', value: true, status: 'success', class: 'btn-primary ml-auto mr-2' },
        { text: 'NO', value: false, class: 'btn-warning' }
      ]
      this.dialogService.openModal(ConfirmationDialogComponent, {
        context: {
          header: 'CLEAR_TRANSACTION',
          bodyText: 'ARE_YOU_SURE_TO_CLEAR_THIS_TRANSACTION',
          buttonDetails: buttons
        },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe(result => {
        if (result) {
          this.transactionItems = []
          this.clearAll();
        }
      })
    }
    this.resetSearch();
  }

  itemChanged(event: any, index: number): void {
    // console.log("event", event);
    // console.log('itemChanged: ', event);
    switch (event.type) {
      case 'delete':
        // console.log('itemChanged delete')
        this.transactionItems.splice(index, 1);
        if (!this.transactionItems?.length && this.sNumber) {
          const buttons = [
            { text: 'YES_CLEAR_CASH_REGISTER', value: true, class: 'btn-primary mx-2' },
            { text: 'NO_KEEP_EXISTING_TRANSACTION', value: false, status: 'success', class: 'btn-secondary ml-auto mr-2' },
          ]
          this.dialogService.openModal(ConfirmationDialogComponent, {
            cssClass: "modal-lg",
            context: {
              header: 'CLEAR_EXISTING_TRANSACTION',
              bodyText: 'NO_ITEMS_LEFT_IN_THE_TRANSACTION_YOU_ARE_MODIFYING_WANT_TO_CLEAR_THE_CASH_REGISTER',
              buttonDetails: buttons
            },
            hasBackdrop: true,
            closeOnBackdropClick: false,
            closeOnEsc: false
          }).instance.close.subscribe(result => {
            if (result) this.clearAll();
          })
        }
        this.clearPaymentAmounts();
        break;
      case 'update':
        this.clearPaymentAmounts();
        break;
      case 'prepaymentChange':
        this.distributeAmount();

        this.updateAmountVariables();
        break;
      case 'duplicate':
        const tItem = Object.create(this.transactionItems[index]);
        tItem.sGiftCardNumber = Date.now();
        this.transactionItems.push(tItem);
        this.clearPaymentAmounts();
        break;
      case 'settingsChanged':
        if (event.data) {
          this.checkBagNumber(event.data)
          let number = event.data.match(/\d+/g);
          this.tillService.settings.currentLocation.nLastBagNumber = Number(number);
        }
        break;
      default:
        this.transactionItems[index] = event.data;
        this.clearPaymentAmounts();
        break;
    }
    this.updateFiskalyTransaction('ACTIVE', []);
  }

  /*CHECK IF BAG NUMBER EXISTS, IF IT EXISTS THEN SHOW WARNING MESSAGE */
  checkBagNumber(sBagNumber: any) {
    let oBody = {
      iBusinessId: localStorage.getItem('currentBusiness'),
      sSearchValue: sBagNumber
    }
    this.apiService.postNew('cashregistry', '/api/v1/activities/items', oBody).subscribe((result: any) => {
      if (result?.data?.length) {
        let dup = result.data.find((el: any) => (el.sBagNumber == sBagNumber));
        if (dup) this.toastrService.show({ type: 'warning', title: 'DUPLICATED_BAGNUMBER' + ': ' + sBagNumber, text: 'THIS_BAGNUMBER_ALREADY_EXIST' });
      }
    });
  }

  createGiftCard(item: any, index: number): void {
    const body = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,

      // Do we still need to keep this hard code value here?
      iCustomerId: this.customer?._id,

      sGiftCardNumber: this.transactionItems[index].sGiftCardNumber,
      eType: 'giftcard',
      nPriceIncVat: this.transactionItems[index].price,
      nPurchasePrice: this.transactionItems[index].price / 1.21,
      nVatRate: this.transactionItems[index].tax,
      nQuantity: this.transactionItems[index].quantity,
      nPaidAmount: 0,
      sProductName: this.transactionItems[index].name,
      iActivityId: this.iActivityId,
    };
    this.apiService.postNew('cashregistry', '/api/v1/till/gift-card', body)
      .subscribe((data: any) => {
        this.iActivityId = data.iActivityId;
        this.transactionItems[index].iActivityItemId = data._id;
        this.toastrService.show({ type: 'success', text: 'Giftcard created!' });
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  openTransactionSearchDialog() {
    // console.log('open transaction search dialog')
    this.dialogService.openModal(TransactionsSearchComponent,
      {
        cssClass: 'modal-xl',
        context: { customer: this.customer },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe(async (data) => {
        // console.log('response of transaction search component', JSON.parse(JSON.stringify(data)));
        if (data?.transaction) {
          this.bIsTransactionLoading = true;
          // / Finding BusinessProduct and their location and stock. Need to show in the dropdown of location choosing /
          if (data?.transactionItems?.length) {
            let aBusinessProduct: any = [];
            const _aBusinessProduct: any = await this.getBusinessProductList(data?.transactionItems.map((el: any) => el.iBusinessProductId)).toPromise();
            if (_aBusinessProduct?.data?.length && _aBusinessProduct.data[0]?.result?.length) aBusinessProduct = _aBusinessProduct.data[0]?.result;
            data.transactionItems = data.transactionItems?.map((oTI: any) => {
              // / assigning the BusinessProduct location to transction-item /
              const oFoundProdLoc = aBusinessProduct?.find((oBusinessProd: any) => oBusinessProd?._id?.toString() === oTI?.iBusinessProductId?.toString());
              if (oFoundProdLoc?.aLocation?.length) {
                oTI.aLocation = oFoundProdLoc.aLocation?.map((oProdLoc: any) => {
                  const oFound: any = this.aBusinessLocation?.find((oBusLoc: any) => oBusLoc?._id?.toString() === oProdLoc?._id?.toString());
                  oProdLoc.sName = oFound?.sName;
                  return oProdLoc;
                });
              }
              oTI.oCurrentLocation = oTI.aLocation?.find((o: any) => o._id === oTI.iLocationId);
              oTI.bProductLoaded = true;
              return oTI;
            })
          }

          this.handleTransactionResponse(data);
        }
        // this.changeInPayment();
      });
  }

  async openCustomerDialog() {
    this.dialogService.openModal(CustomerDialogComponent,
      {
        cssClass: 'modal-xl',
        context: { customer: this.customer, from: 'cash-register' },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe(async (data) => {
        if (data.customer) {
          this.customer = data.customer;
          let str = this.customer?.nClientId;
          if (str && str.indexOf('/') > 0) {
            str = str.replaceAll('undefined', '-');
            this.nClientId = str.substring(0, str.indexOf('/'));
            this.customer.nClientId = str;
          } else {
            this.nClientId = this.customer?.nClientId == '' ? '-' : this.customer?.nClientId;
          }
          if (this.customer?._id && this.customer._id != '') {
            const nPointsResult: any = await this.apiService.getNew('cashregistry', `/api/v1/points-settings/points?iBusinessId=${this.iBusinessId}&iCustomerId=${this.customer._id}`).toPromise();
            const oPointsSettingsResult: any = await this.apiService.getNew('cashregistry', `/api/v1/points-settings?iBusinessId=${this.iBusinessId}`).toPromise();
            this.customer.nLoyaltyPoints = nPointsResult;
            this.customer.nLoyaltyPointsValue = nPointsResult / oPointsSettingsResult.nPerEuro2;
          }
          if (this.customer?.activityData?.length) {
            this.findOpenActivitiesForCustomer();
          }
        }
      })
  }

  findOpenActivitiesForCustomer() {
    this.dialogService.openModal(CustomerActivitiesDialogComponent,
      {
        cssClass: 'modal-xl',
        context: { customer: this.customer },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe(async (data) => {
        if (data?.transaction) {
          this.bIsTransactionLoading = true;
          // / Finding BusinessProduct and their location and stock. Need to show in the dropdown of location choosing /
          if (data?.transactionItems?.length) {
            let aBusinessProduct: any = [];
            const _aBusinessProduct: any = await this.getBusinessProductList(data?.transactionItems.map((el: any) => el.iBusinessProductId)).toPromise();
            if (_aBusinessProduct?.data?.length && _aBusinessProduct.data[0]?.result?.length) aBusinessProduct = _aBusinessProduct.data[0]?.result;
            data.transactionItems = data.transactionItems?.map((oTI: any) => {
              // / assigning the BusinessProduct location to transction-item /
              const oFoundProdLoc = aBusinessProduct?.find((oBusinessProd: any) => oBusinessProd?._id?.toString() === oTI?.iBusinessProductId?.toString());
              if (oFoundProdLoc?.aLocation?.length) {
                oTI.aLocation = oFoundProdLoc.aLocation?.map((oProdLoc: any) => {
                  const oFound: any = this.aBusinessLocation?.find((oBusLoc: any) => oBusLoc?._id?.toString() === oProdLoc?._id?.toString());
                  oProdLoc.sName = oFound?.sName;
                  return oProdLoc;
                });
              }
              oTI.oCurrentLocation = oTI.aLocation?.find((o: any) => o._id === oTI.iLocationId);
              return oTI;
            })
          }

          this.handleTransactionResponse(data);
        }
      })
  }

  fetchCustomer(customerId: any) {
    this.apiService.getNew('customer', `/api/v1/customer/${customerId}?iBusinessId=${this.iBusinessId}`).subscribe(
      (result: any) => {
        const customer = result;
        customer['NAME'] = this.customerStructureService.makeCustomerName(customer);
        customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
        customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
        customer['EMAIL'] = customer.sEmail;
        customer['PHONE'] = (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '');
        this.customer = customer;
        // this.close({ action: true });
      },
      (error: any) => {
        console.error(error);
      }
    );
  }

  /* A payment which made */
  getUsedPayMethods(total: boolean): any {

    if (!this.payMethods) {
      return 0
    }
    if (total) {
      return (_.sumBy(this.payMethods, 'amount') || 0);

      // not to consider giftcard and loyalty points as a payment
      // + this.redeemedLoyaltyPoints; //(_.sumBy(this.appliedGiftCards, 'nAmount') || 0) +
    }
    return this.payMethods.filter(p => p.amount && p.amount !== 0) || 0
  }

  changeInPayment() {
    this.distributeAmount();
    this.allPaymentMethod = this.allPaymentMethod.map((v: any) => ({ ...v, isDisabled: true }));

    const paidAmount = _.sumBy(this.payMethods, 'amount') || 0;
    if (paidAmount === 0) {
      this.payMethods.forEach(o => o.isDisabled = false);
    } else {
      this.payMethods.forEach(o => o.isDisabled = true);
    }

    // const aGiftcard = this.transactionItems.filter((v: any) => v.type == 'giftcard');
    // this.bAllGiftcardPaid = aGiftcard.filter((el: any) => !el.isExclude).every((el: any) => el.paymentAmount == el.amountToBePaid)

    this.transactionItems = [...this.transactionItems]
    this.updateAmountVariables();
  }

  clearAll() {
    this.transactionItems = [];
    this.shopProducts = [];
    this.commonProducts = [];
    this.searchKeyword = '';
    this.selectedTransaction = null;
    if (!this.payMethods.length) this.payMethods = this.aInitialPaymentMethods;
    this.payMethods.map(o => { o.amount = null, o.isDisabled = false });
    this.appliedGiftCards = [];
    this.nGiftcardAmount = 0;
    this.redeemedLoyaltyPoints = 0;
    this.iActivityId = '';
    this.sNumber = '';
    this.customer = null;
    this.saveInProgress = false;
    this.clearPaymentAmounts();
    this.bAllGiftcardPaid = true;
    this.bShowOverassignedWarning = false;
    // localStorage.removeItem('fromTransactionPage');
  }

  clearPaymentAmounts() {
    // console.log('this.transactionItems: ', this.transactionItems);

    this.transactionItems.forEach((item: any) => {
      if (item.type === 'loyalty-points') return;
      if (item.paymentAmount > 0) item.paymentAmount = 0;
      if (item.type === 'repair' || item.type === 'order') {
        if (item?.prepaymentTouched) {
          item.manualUpdate = false;
          item.prepaymentTouched = false;
        }
      } else {
        if (item.type === 'giftcard') return;
        item.isExclude = false;
        item.manualUpdate = (item.type === 'gold-purchase') ? true : false;
      }
    })

    this.payMethods.forEach(o => { o.amount = null, o.isDisabled = false });
    if (this.transactionItems?.length) this.distributeAmount();
    else this.availableAmount = 0;

    this.updateAmountVariables();
  }


  startTerminalPayment() {
    this.dialogService.openModal(TerminalDialogComponent,
      {
        cssClass: 'modal-lg',
        context: { payments: this.payMethods },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe((data) => {
        if (data) {
          data.forEach((pay: any) => {
            if (pay.sName === 'Card' && pay.status !== 'SUCCESS') {
              pay.nExpectedAmount = pay.amount;
              pay.amount = 0;
            }
          });
        }
      })
  }

  // nRefundAmount needs to be added
  checkUseForGold() {
    let isGoldForPayment = true;
    const goldTransactionPayments = this.transactionItems.filter(o => o.oGoldFor?.name === 'cash' || o.oGoldFor?.name === 'bankpayment');
    goldTransactionPayments.forEach(element => {
      const paymentMethod = this.payMethods.findIndex(o => o.sName.toLowerCase() === element.oGoldFor.name && o.amount === element.amountToBePaid);
      if (paymentMethod < 0) {
        isGoldForPayment = false;
        // this.toastrService.show({ type: 'danger', text: `The amount paid for '${element.oGoldFor.name}' does not match.` });
        this.toastrService.show({
          type: 'danger',
          text: `You selected '${element.oGoldFor.name}' as a administrative procedure for this gold purchase.
        If your administration supports special rules for 'VAT' processing on gold purchases please remove all the other products/items on this purchase.
        In case you're following the 'regular' procedure like most retailers (95%): Change the option 'Cash/Bank' to 'Stock/Repair/Giftcard/Order' on the gold purchase item's dropdown.
        You can still give cash to your customer or select bank (transfer) as a method.
        In that case on paper the governement handles this 'gold purchase' as an exchange to goods (which may be done on a different transaction.`,
          noAutoClose: true
        });
      }
    });
    return isGoldForPayment;
  }

  getRelatedTransactionItem(iActivityItemId: string, iTransactionItemId: string, index: number) {
    return this.apiService.getNew('cashregistry', `/api/v1/transaction/item/activityItem/${iActivityItemId}?iBusinessId=${this.iBusinessId}&iTransactionItemId=${iTransactionItemId}`).toPromise();
  }

  getRelatedTransaction(iActivityId: string, iTransactionId: string) {
    const body = {
      iBusinessId: this.iBusinessId,
      iTransactionId: iTransactionId
    }
    return this.apiService.postNew('cashregistry', '/api/v1/transaction/activity/' + iActivityId, body);
  }

  async createTransaction() {
    this.dispatchEvent('stopIdle');
    const isGoldForCash = this.checkUseForGold();
    if (this.transactionItems.length < 1 || !isGoldForCash) return;
    let giftCardPayment = this.allPaymentMethod.find((o) => o.sName === 'Giftcards');
    if (!giftCardPayment) {
      const oBody = {
        sName: 'Giftcards',
        iBusinessId: this.iBusinessId,
        bStockReduction: false,
        bInvoice: false,
        bAssignSavingPoints: false,
        bAssignSavingPointsLastPayment: true,
        bShowInCashRegister: false
      }
      const _result: any = await this.apiService.postNew('cashregistry', '/api/v1/payment-methods/create', oBody).toPromise();
      if (_result?.data?._id) giftCardPayment = _result.data;
    }
    this.saveInProgress = true;

    if (this.nItemsTotalToBePaid < 0) {
      let nDiff = parseFloat((this.nItemsTotalToBePaid - this.availableAmount).toFixed(2));
      if (nDiff < -0.02 || nDiff > 0.02) {
        this.toastrService.show({ type: 'warning', text: `We do not allow prepayment on negative transactions and also we do not support negative change money.` });
        this.saveInProgress = false;
        return;
      }
    }

    let changeAmount = 0;
    if (this.availableAmount > this.nItemsTotalToBePaid && this.nTotalPayment == this.nItemsTotalToBePaid) {
      changeAmount = this.availableAmount - this.nItemsTotalToBePaid;
    } else if (this.availableAmount > this.nTotalPayment) {
      changeAmount = this.availableAmount - this.nTotalPayment;
    }
    // console.log({ changeAmount, nItemsTotalToBePaid: this.nItemsTotalToBePaid })
    this.dialogService.openModal(TerminalDialogComponent,
      {
        cssClass: 'modal-lg',
        context: {
          payments: this.payMethods,
          changeAmount,
          nItemsTotalToBePaid: this.nItemsTotalToBePaid,
          totalAmount: this.nTotalPayment
        },
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe(async (payMethods: any) => {
        // console.log({payMethods})
        if (!payMethods) {
          this.saveInProgress = false;
          this.clearPaymentAmounts();
        } else {
          payMethods.forEach((pay: any) => {
            if (pay.sName === 'Card' && pay.status !== 'SUCCESS') {
              pay.nExpectedAmount = pay.amount;
              pay.amount = 0;
            }
          });
          this.distributeAmount(payMethods);
          // this.transactionItems = [...this.transactionItems.filter((item: any) => item.type !== 'empty-line')]
          const body = this.tillService.createTransactionBody(this.transactionItems, payMethods, this.discountArticleGroup, this.redeemedLoyaltyPoints, this.customer);
          if (body.transactionItems.filter((item: any) => item.oType.eKind === 'repair')[0]?.iActivityItemId) {
            this.bHasIActivityItemId = true
          }

          //console.log('here', this.appliedGiftCards)
          // OLD VERSION - working
          // const aInternalGiftcards = this.appliedGiftCards.filter((item: any) => item.type == 'custom');
          // const aExternalGiftcards = this.appliedGiftCards.filter((item: any) => item.type != 'custom');

          // NEW VERSION - not working
          const { aInternalGiftcards, aExternalGiftcards } = this.appliedGiftCards.reduce((context: any, item: any) => {
            if (item.type == 'custom') context.aInternalGiftcards.push(item);
            else context.aExternalGiftcards.push(item);
            return context;
          }, { aInternalGiftcards: [], aExternalGiftcards: [] });
          // console.log('here', this.appliedGiftCards)

          if (aExternalGiftcards?.length) { // we have some cards by external providers -> we will generate a revenue from it -> so need to process them as payment
            aExternalGiftcards.forEach((oCard: any) => {
              body.payments.push({
                ...giftCardPayment,
                sGiftCardNumber: oCard.sGiftCardNumber,
                amount: oCard.nAmount
              })
            })
          }
          if (this.appliedGiftCards?.length) body.giftCards = this.appliedGiftCards;
          if (aInternalGiftcards?.length) this.tillService.createGiftcardTransactionItem(body, this.discountArticleGroup);

          body.oTransaction.iActivityId = this.iActivityId;
          const aUniqueBusinessPartnerIds = [...new Set(_.compact(body.transactionItems.map((a: any) => a.iBusinessPartnerId)))];
          // console.log(body);
          // return;
          const oDialogComponent: DialogComponent = this.dialogService.openModal(TransactionActionDialogComponent,
            {
              cssClass: 'modal-lg',
              hasBackdrop: true,
              closeOnBackdropClick: false,
              closeOnEsc: false,
              context: {
                printActionSettings: this.printActionSettings,
                printSettings: this.printSettings,
                businessDetails: this.businessDetails,
              }
            }).instance;

          if (this.bIsFiscallyEnabled) {
            const result: any = await this.fiskalyService.updateFiskalyTransaction(this.transactionItems, _.clone(body.payments), 'FINISHED');
            if (result) {
              localStorage.removeItem('fiskalyTransaction');
              body.oTransaction.oFiskalyData = {
                sFiskalyTxId: result._id,
                sQRCodeData: result?.qr_code_data
              }
            }
          }
          body.oTransaction.eSource = 'cash-registry';
          this.apiService.postNew('cashregistry', '/api/v1/till/transaction', body).subscribe(async (data: any) => {

            this.saveInProgress = false;
            const { transaction, aTransactionItems, activityItems, activity } = data;
            this.tillService.adjustEmptyLineItems(aTransactionItems, body.transactionItems)
            transaction.aTransactionItems = aTransactionItems;
            transaction.activity = activity;
            this.transaction = transaction;
            this.transaction.sWorkstationName = this.workstations.find((workstation: any) => workstation._id == this.iWorkstationId).sName;
            this.activityItems = activityItems;
            this.activity = activity;
            const bHasRepairOrOrderItems = this.transaction.aTransactionItemType.includes('repair') || this.transaction.aTransactionItemType.includes('order');
            if (this.tillService.settings?.currentLocation?.bAutoIncrementBagNumbers && bHasRepairOrOrderItems) this.tillService.updateSettings();

            this.transaction.aTransactionItems.forEach((tItem: any) => {
              for (const aItem of this.activityItems) {
                if (aItem.iTransactionItemId === tItem._id) {
                  tItem.sActivityItemNumber = aItem.sNumber;
                  break;
                }
              }
            });

            const bOpenCashDrawer = payMethods.some((m: any) => m.sName === 'Cash' && m.remark != 'CHANGE_MONEY');
            if (bOpenCashDrawer && this.tillService?.settings?.bOpenCashDrawer) this.openDrawer();

            this.handleReceiptPrinting(oDialogComponent);

            setTimeout(() => {
              this.saveInProgress = false;
              this.fetchBusinessPartnersProductCount(aUniqueBusinessPartnerIds);
              this.eKind = 'regular';
            }, 100);
            if (this.selectedTransaction) {
              this.deleteParkedTransaction();
            };

          }, err => {
            this.toastrService.show({ type: 'danger', text: err.message });
            this.saveInProgress = false;
          });
        }
      });
  }

  getEmployee(id: any) {
    if (id != '') {
      this.apiService.getNew('auth', `/api/v1/employee/${id}?iBusinessId=${this.iBusinessId}`).subscribe((result: any) => {
        this.employee = result?.data;
        this.bAllowOpenManualCashDrawer = this.employee.aRights.includes('DEVELOPER') || this.employee.aRights.includes('OWNER');
      });
    }
  }


  async handleReceiptPrinting(oDialogComponent: DialogComponent) {
    this.transaction.businessDetails = this.businessDetails;
    this.transaction.currentLocation = this.businessDetails.currentLocation;
    this.transaction.oCustomer = this.customer;
    this.transaction = await this.tillService.processTransactionForPdfReceipt(this.transaction);

    let oDataSource = JSON.parse(JSON.stringify(this.transaction));

    oDataSource.sActivityNumber = oDataSource.activity.sNumber;

    let nRepairCount = 0, nOrderCount = 0;
    oDataSource.aTransactionItems.forEach((item: any) => {
      if (item.oType.eKind == 'repair') nRepairCount++;
      else if (item.oType.eKind == 'order') nOrderCount++;
    })
    // console.log({ oDataSource })
    const bRegularCondition = oDataSource.total >= 0.02 || oDataSource.total <= -0.02 ||
      oDataSource.totalGiftcardDiscount ||
      oDataSource.totalRedeemedLoyaltyPoints ||
      oDataSource.aTransactionItems.some((item: any) => item.oType.bRefund);
    // console.log({ bRegularCondition }, oDataSource.aTransactionItems.some((item: any) => item.oType.bRefund))
    const aPromises: any = [];
    aPromises.push(this.getTemplate())
    aPromises.push(this.getBase64FromUrl(oDataSource?.businessDetails?.sLogoLight))
    if (this.employee._id != oDataSource.iEmployeeId) {
      aPromises.push(this.apiService.getNew('auth', `/api/v1/employee/${oDataSource.iEmployeeId}?iBusinessId=${this.iBusinessId}`).toPromise())
    }

    const aResult: any = await Promise.all(aPromises);
    if (this.employee._id != oDataSource.iEmployeeId) {
      this.employee = aResult[2].data;
    }
    oDataSource.sAdvisedEmpFirstName = this.employee?.sFirstName || 'a';
    oDataSource.sBusinessLogoUrl = aResult[1].data;
    if (oDataSource.oCustomer && oDataSource.oCustomer.bCounter === true) {
      oDataSource.oCustomer = {};
    }

    const aTemplates = aResult[0].data;
    oDialogComponent.contextChanged.next({
      oDataSource,
      nRepairCount,
      nOrderCount,
      activityItems: this.activityItems,
      activity: this.activity,
      aTemplates,
      bRegularCondition
    });
    this.dispatchEvent('startIdle');

    oDialogComponent.close.subscribe((result: any) => {
      this.clearAll();
      if (result) {
        this.loadTransaction()
      } else {
        if (this.tillService.settings.bLockCashRegisterAfterTransaction)
          this.dispatchEvent('lockScreen')
      }

    });
    oDialogComponent.triggerEvent.subscribe(() => { this.clearAll(); });

    if (nOrderCount >= 1) {
      const orderTemplate = aTemplates.find((template: any) => template.eType === 'order');
      const oOrderData: any = this.tillService.prepareDataForOrderReceipt(this.activity, this.activityItems, oDataSource);
      this.sendForReceipt(oOrderData, orderTemplate, oOrderData.sNumber, 'is_created', 'order');
    }

    if (bRegularCondition) {
      //print proof of payments receipt
      const template = aTemplates.find((template: any) => template.eType === 'regular');
      this.sendForReceipt(oDataSource, template, oDataSource.sNumber, 'is_created', 'regular');
    }

    let today = new Date();
    today.setSeconds(0);
    today.setMilliseconds(0);

    const template = aTemplates.find((template: any) => template.eType === 'repair');
    this.activityItems.filter((oItem: any) => oItem.oType.eKind == 'repair').forEach((oItem: any) => {
      const oRepairDataSource: any = this.tillService.prepareDataForRepairReceipt(oItem, oDataSource, this.employee)

      let creationDate = new Date(oItem.dCreatedDate);
      creationDate.setSeconds(0);
      creationDate.setMilliseconds(0);
      // console.log(oItem.eActivityItemStatus, today.toISOString(), creationDate.toISOString());
      if (oItem.eActivityItemStatus == 'new' || today.toISOString() == creationDate.toISOString()) {
        this.sendForReceipt(oRepairDataSource, template, oRepairDataSource.sNumber, 'is_created', 'repair');
      }
    })

    const oAlternativeReceiptTemplate = aTemplates.find((template: any) => template.eType === 'repair_alternative');
    const oAlternativeDataSource = this.activityItems.filter((item: any) => item.oType.eKind === 'repair');
    oAlternativeDataSource.sAdvisedEmpFirstName = this.employee?.sFirstName || 'a';
    oAlternativeDataSource.forEach((data: any) => {
      data.sBusinessLogoUrl = aResult[1].data;
      data.businessDetails = this.businessDetails;

      let creationDate = new Date(data.dCreatedDate);
      creationDate.setSeconds(0);
      creationDate.setMilliseconds(0);
      // console.log(data.eActivityItemStatus, today.toISOString(), creationDate.toISOString());
      if (data.eActivityItemStatus == 'new' || today.toISOString() == creationDate.toISOString()) {
        this.sendForReceipt(data, oAlternativeReceiptTemplate, data.sNumber, 'is_created', 'repair_alternative');
      }
    })

    const oGiftcardTemplate = aTemplates.find((template: any) => template.eType === 'giftcard');
    this.activityItems.filter((oItem: any) => oItem.oType.eKind == 'giftcard').forEach((oItem: any) => {
      if (!oItem.nGiftcardRemainingAmount) return;
      const oDataSource = this.tillService.prepareDataForGiftcardReceipt(oItem, this.transaction);
      this.sendForReceipt(oDataSource, oGiftcardTemplate, oDataSource.sGiftCardNumber, 'is_created', 'giftcard');
    })

    if (this.appliedGiftCards?.length) {
      this.appliedGiftCards.forEach((oAppliedGiftcard: any) => {
        if (oAppliedGiftcard.nGiftcardRemainingAmount) {
          const oDataSource = this.tillService.prepareDataForGiftcardReceipt(oAppliedGiftcard, this.transaction);
          this.sendForReceipt(oDataSource, oGiftcardTemplate, oDataSource.sGiftCardNumber, 'partly_redeemed', 'giftcard');
        }
      })
    }

  }

  async sendForReceipt(oDataSource: any, template: any, title: any, eSituation: string = 'is_created', type: any) {
    // console.log('sendForReceipt', eSituation, type)
    const oPrintActionSettings = this.printActionSettings?.find((pas: any) => pas.eType === type && pas.eSituation === eSituation);
    // console.log({oPrintActionSettings});
    if (oPrintActionSettings) {
      const aActionToPerform = oPrintActionSettings.aActionToPerform;
      // console.log({ aActionToPerform });
      if (aActionToPerform.includes('PRINT_THERMAL')) {
        await this.receiptService.printThermalReceipt({
          oDataSource: oDataSource,
          printSettings: this.printSettings,
          sAction: 'thermal',
          apikey: this.businessDetails.oPrintNode.sApiKey,
          title: oDataSource.sNumber,
          sType: type,
          sTemplateType: (type == 'regular') ? 'business-receipt' : type
        }).toPromise();
      } else if (aActionToPerform.includes('PRINT_THERMAL_ALTERNATIVE')) {
        await this.receiptService.printThermalReceipt({
          oDataSource: oDataSource,
          printSettings: this.printSettings,
          sAction: 'thermal',
          apikey: this.businessDetails.oPrintNode.sApiKey,
          title: oDataSource.sNumber,
          sType: 'repair_alternative',
          sTemplateType: (type == 'repair') ? 'repair_alternative' : 'business-receipt'
        }).toPromise();
      }

      const settings = this.printSettings.find((s: any) => s.sMethod === 'pdf' && s.sType === type && s.iWorkstationId === this.iWorkstationId);
      if (aActionToPerform.includes('DOWNLOAD') || aActionToPerform.includes('PRINT_PDF')) {
        await this.receiptService.exportToPdf({
          oDataSource: oDataSource,
          pdfTitle: title,
          templateData: template,
          printSettings: settings,
          printActionSettings: oPrintActionSettings,
          sApiKey: this.businessDetails.oPrintNode.sApiKey
        }).toPromise();
      }
    }
  }

  getPrintSettings() {
    const oBody = {
      iLocationId: this.iLocationId || localStorage.getItem('currentLocation'),
      iWorkstationId: this.iWorkstationId || localStorage.getItem('currentWorkstation'),
    }

    this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, oBody).subscribe((result: any) => {
      if (result?.data?.length && result?.data[0]?.result?.length) {
        this.printSettings = [];
        result?.data[0]?.result.forEach((settings: any) => {
          if (settings?.sMethod === 'actions') {
            this.printActionSettings = settings?.aActions || [];
          } else {
            this.printSettings.push(settings);
          }
        })
      }
    });
  }

  getBase64FromUrl(url: any) {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.iBusinessId}?url=${url}`).toPromise();
  }

  getTemplate() { //types: any
    const body = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
    }
    return this.apiService.postNew('cashregistry', `/api/v1/pdf/templates`, body).toPromise();
  }

  getBusinessDetails() {
    return this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId);
  }


  fetchBusinessPartnersProductCount(aBusinessPartnerId: any) {
    if (!aBusinessPartnerId.length || 1 > aBusinessPartnerId.length) {
      return;
    }
    const body = {
      iBusinessId: this.iBusinessId,
      aBusinessPartnerId
    };
    this.apiService.postNew('core', '/api/v1/business/partners/product-count', body).subscribe(
      (result: any) => {
        if (result?.data) {
          const urls: any = [];
          result.data.forEach((element: any) => {
            if (element.businessproducts > 10) {
              urls.push({ name: element.sName, iBusinessPartnerId: element._id });
            }
          });
          if (urls.length > 0) {
            this.openWarningPopup(urls);
          }
        }
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  /* Search API for finding the  common-brands products */
  listShopProducts(searchValue: string | undefined, isFromEAN: boolean | false) {
    this.shopProducts = [];
    this.bSearchingProduct = true;
    let data = {
      iBusinessId: this.iBusinessId,
      skip: (this.oShopProductsPaginationConfig.currentPage - 1) * this.oShopProductsPaginationConfig.itemsPerPage,
      limit: this.oShopProductsPaginationConfig.itemsPerPage,
      sortBy: `oName.${this.language}`,
      sortOrder: 'asc',
      searchValue: searchValue,
      aProjection: this.aProjection,
      oFilterBy: {
        oStatic: {},
        oDynamic: {}
      },
    }

    this.bProductSelected = false;
    this.apiService.postNew('core', '/api/v1/business/products/list', data).subscribe((result: any) => {
      this.bSearchingProduct = false;
      if (result?.data?.length) {
        const response = result.data[0];
        this.shopProducts = response.result;
        this.oShopProductsPaginationConfig.totalItems = response.count.totalData;
        this.shopProducts.forEach((el: any) => el.oCurrentLocation = el?.aLocation?.find((oLoc: any) => oLoc?._id?.toString() === this.iLocationId));
        // console.log('shop products are loaded')
        if (this.bFromBarcode && this.shopProducts.length == 1) {
          this.bFromBarcode = false;
          this.onSelectProduct(this.shopProducts[0], 'business', 'shopProducts');
        }
        this.shopProducts.forEach((product: any) => {
          product.sProductName = this.tillService.getName(product?.oName, this.language)
          if (product?.sArticleNumber) {
            product.sNewArticleNumber = product.sArticleNumber.split('*/*')[0];
          }
        });
      }
    }, (error) => {
      this.bSearchingProduct = false;
    });
  }

  listCommonBrandProducts(searchValue: string | undefined, isFromEAN: boolean | false) {
    this.commonProducts = [];
    this.bSearchingCommonProduct = true;
    let data = {
      iBusinessId: this.iBusinessId,
      skip: (this.oCommonProductsPaginationConfig.currentPage - 1) * this.oCommonProductsPaginationConfig.itemsPerPage,
      limit: this.oCommonProductsPaginationConfig.itemsPerPage,
      sortBy: '',
      sortOrder: '',
      searchValue: searchValue,
      aProjection: this.aProjection,
      oFilterBy: {
        oStatic: {},
        oDynamic: {}
      },
      language: this.language
    };

    this.apiService.postNew('core', '/api/v1/products/commonbrand/list', data).subscribe((result: any) => {
      this.bSearchingCommonProduct = false;
      if (result?.data?.length) {
        const response = result.data[0];
        if (!this.bProductSelected) {
          this.commonProducts = response.result;
          this.oCommonProductsPaginationConfig.totalItems = response.count.totalData;
        }
      }
    }, (error) => {
      this.bSearchingCommonProduct = false;
    });
  }

  getBusinessProduct(iBusinessProductId: string): Observable<any> {
    return this.apiService.getNew('core', `/api/v1/business/products/${iBusinessProductId}?iBusinessId=${this.iBusinessId}`)
  }

  getBusinessProductList(aBusinessProductId: any): Observable<any> {
    const oBody = { iBusinessId: this.iBusinessId, aBusinessProductId: aBusinessProductId, sortBy: `oName.${this.language}`, sortOrder: 'asc' };
    return this.apiService.postNew('core', `/api/v1/business/products/list`, oBody);
  }

  getBaseProduct(iProductId: string): Observable<any> {
    return this.apiService.getNew('core', `/api/v1/products/${iProductId}?iBusinessId=${this.iBusinessId}`)
  }

  // Add selected product into purchase order
  async onSelectProduct(product: any, isFrom: string = '', isFor: string = '', source?: any) {
    // console.log('onSelectProduct', product);
    this.bProductSelected = true;
    let selectedQuickButton;
    let nPriceIncludesVat = 0, nVatRate = 0;
    if (isFrom === 'quick-button') {
      source.loading = true;
      this.onSelectRegular();
      selectedQuickButton = product;
      this.bSearchingProduct = false;
      nPriceIncludesVat = selectedQuickButton.nPrice;
    }
    let currentLocation;
    if (isFor == 'commonProducts') {
      const _oBaseProductDetail = await this.getBaseProduct(product?._id).toPromise();
      product = _oBaseProductDetail.data;
    } else {
      const _oBusinessProductDetail = await this.getBusinessProduct(product?.iBusinessProductId || product?._id).toPromise().catch((error) => {
        if (isFrom == 'quick-button') {
          setTimeout(() => {
            this.toastrService.show({ type: 'danger', text: this.translateService.instant('BUSINESS_PRODUCT_NOT_FOUND_PLEASE_DELETE_QB') });
            source.loading = false;
          }, 400);
        }
      });
      if (_oBusinessProductDetail?.data) _oBusinessProductDetail.data.sSerialNumber = product?.sSerialNumber;
      product = _oBusinessProductDetail?.data;
      if (product?.aLocation?.length) {
        product.aLocation = product.aLocation.filter((oProdLoc: any) => {
          const oFound: any = this.aBusinessLocation.find((oBusLoc: any) => oBusLoc?._id?.toString() === oProdLoc?._id?.toString());
          if (oFound) {
            oProdLoc.sName = oFound?.sName;
            return oProdLoc;
          }
        })
        currentLocation = product.aLocation.find((o: any) => o._id === this.iLocationId);
        if (currentLocation) {
          if (isFrom == 'quick-button') {
            //UPDATE QUICK BUTTON PRICE IF nPrice IS DIFFERENT FROM BUSINESS PRODUCT nPriceIncludesVat.
            if (selectedQuickButton.nPrice != currentLocation?.nPriceIncludesVat) {
              selectedQuickButton.nPrice = currentLocation?.nPriceIncludesVat;
              nPriceIncludesVat = currentLocation?.nPriceIncludesVat || 0;
              let data = {
                iBusinessId: this.iBusinessId,
                iLocationId: this.iLocationId,
                oQuickButton: selectedQuickButton,
              };
              this.apiService.putNew('cashregistry', `/api/v1/quick-buttons/${selectedQuickButton?._id}`, data).toPromise();
            }
          } else {
            nPriceIncludesVat = currentLocation?.nPriceIncludesVat || 0;
          }
          nVatRate = currentLocation?.nVatRate || 0;
        }
      }
    }
    // console.log(this.tillService.settings, {currentLocation});
    const name = this.tillService.getNameWithPrefillingSettings(product, this.language);

    let sDescription = '';
    const aSetting = this.tillService.settings.aDescriptionFieldToPrefill;
    // console.log(aSetting);
    if (aSetting?.length) {
      aSetting.forEach((sSetting: any) => {
        // console.log(sSetting);
        if (sSetting == 'oShortDescription') sDescription += ' ' + (product.oShortDescription[this.language] || '').replace(/<\/?[^>]+(>|$)/g, "");
        if (sSetting == 'sInternalDescription') sDescription += ' ' + (product.aLocation.find((el: any) => el._id == this.iLocationId)?.sInternalDescription || '');
        if (sSetting == 'sDiamond') sDescription += ' ' + this.tillService.getDescriptionWithGemDetails(product);
      })
    }
    this.transactionItems.push({
      name,
      eTransactionItemType: 'regular',
      type: this.eKind,
      quantity: 1,
      price: (isFor == 'commonProducts') ? product.nSuggestedRetailPrice : nPriceIncludesVat,
      nMargin: 1,
      nPurchasePrice: product.nPurchasePrice,
      paymentAmount: 0,
      oType: {
        bRefund: isFrom === 'quick-button' ? selectedQuickButton.oType?.bRefund : false,
        bDiscount: false,
        bPrepayment: false
      },
      nDiscount: product.nDiscount || 0,
      bDiscountOnPercentage: product.bDiscountOnPercentage || false,
      tax: nVatRate,
      sProductNumber: product.sProductNumber,
      sArticleNumber: product.sArticleNumber,
      ean: product?.sEan,
      description: sDescription,//product.sLabelDescription,
      iArticleGroupId: product.iArticleGroupId,
      oArticleGroupMetaData: { aProperty: product.aProperty || [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      iBusinessBrandId: product.iBusinessBrandId || product.iBrandId,
      iBusinessProductId: isFor == 'commonProducts' ? undefined : product._id,
      iProductId: isFor == 'commonProducts' ? product._id : undefined,
      iBusinessPartnerId: product.iBusinessPartnerId, //'6274d2fd8f38164d68186410',
      sBusinessPartnerName: product.sBusinessPartnerName, //'6274d2fd8f38164d68186410',
      iSupplierId: product.iBusinessPartnerId,
      aImage: product.aImage,
      isExclude: false,
      // manualUpdate: false,
      open: true,
      new: true,
      isFor,
      oBusinessProductMetaData: this.tillService.createProductMetadata(product),
      eActivityItemStatus: (this.eKind === 'order') ? 'new' : 'delivered',
      oCurrentLocation: currentLocation,
      aLocation: product?.aLocation,
      bProductLoaded: true,
      sSerialNumber: this.bSerialSearchMode ? product?.sSerialNumber : undefined,
      bQuickButton: isFrom === 'quick-button' ? true : false,
      bHasStock: product?.bHasStock
    });
    // console.log('this.transactionItems', this.transactionItems);
    if (isFrom === 'quick-button') {
      source.loading = false;
    }
    this.clearPaymentAmounts();
    if (this.bIsFiscallyEnabled) await this.updateFiskalyTransaction('ACTIVE', []);
    // console.log('calling reset search now')
    this.resetSearch();
  }

  resetSearch() {
    this.searchKeyword = '';
    this.shopProducts = [];
    this.commonProducts = [];
    // console.log('reset search called', this.shopProducts, this.commonProducts)
  }

  search() {
    this.oShopProductsPaginationConfig.currentPage = 1;
    this.oCommonProductsPaginationConfig.currentPage = 1;
    this.shopProducts = [];
    this.commonProducts = [];
    if (this.bSerialSearchMode) {
      this.listShopProductsBySerial(this.searchKeyword, false);
    } else {
      this.listShopProducts(this.searchKeyword, false);
      if (!this.isStockSelected) {
        this.listCommonBrandProducts(this.searchKeyword, false); // Searching for the products of common brand
      }
    }
  }

  listShopProductsBySerial(searchValue: string | undefined, isFromEAN: boolean | false) {
    let data = {
      iBusinessId: this.iBusinessId,
      sSerialNumber: searchValue,
    }
    this.bSearchingProduct = true;
    this.shopProducts = [];
    this.apiService.postNew('core', '/api/v1/business/products/list-by-serial-number', data).subscribe((result: any) => {
      this.bSearchingProduct = false;
      if (result?.data?.length) {
        this.shopProducts = result.data;
      }
    }, (error) => {
      this.bSearchingProduct = false;
    });
  }

  addNewLine() {
    this.transactionItems.push({
      name: '',
      type: 'empty-line',
      quantity: 1,
      price: 0,
      nDiscount: 0,
      bDiscountOnPercentage: false,
      tax: 0,
      description: '',
      open: true,
      paymentAmount: 0
    });
    this.distributeAmount();
  }

  getParkedTransactionBody(): Object {
    const body = {
      aTaxes: this.tillService.taxes,
      aTransactionItems: this.transactionItems,
      oCustomer: this.customer,
      // searchKeyword: this.searchKeyword,
      // shopProducts: this.shopProducts,
      iBusinessId: this.iBusinessId,
      iSupplierId: this.supplierId,
      iActivityId: this.iActivityId ? this.iActivityId : undefined,
      bIsStockSelected: this.isStockSelected,
      aPayMethods: this.payMethods,
      oBusiness: this.business,
      iLocationId: this.iLocationId,
      oRequestParams: this.requestParams,
    };
    // console.log(body);
    return body;
  }
  park() {
    this.apiService.postNew('cashregistry', `/api/v1/park?iBusinessId=${this.iBusinessId}`, this.getParkedTransactionBody())
      .subscribe((data: any) => {
        this.parkedTransactions.unshift({
          _id: data?._id.toString(),
          dUpdatedDate: data?.dUpdatedDate.toString(),
          sNumber: data?.sNumber.toString()
        })
        this.toastrService.show({ type: 'success', text: this.translateService.instant('TRANSACTION_PARKED') })

      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
    this.clearAll();
  }

  getParkedTransactions() {
    this.apiService.getNew('cashregistry', `/api/v1/park?iBusinessId=${this.iBusinessId}`).subscribe((data: any) => {
      this.parkedTransactions = data;

    }, err => {
      this.toastrService.show({ type: 'danger', text: err.message });
    });
  }

  fetchParkedTransactionInfo() {
    this.parkedTransactionLoading = true;
    this.apiService.getNew('cashregistry', `/api/v1/park/${this.selectedTransaction._id}?iBusinessId=${this.iBusinessId}`)
      .subscribe((transactionInfo: any) => {
        // console.log(transactionInfo);
        this.tillService.taxes = transactionInfo.aTaxes;
        this.transactionItems = transactionInfo.aTransactionItems;
        this.customer = transactionInfo.oCustomer;
        this.iBusinessId = transactionInfo.iBusinessId;
        this.supplierId = transactionInfo.iSupplierId;
        this.iActivityId = transactionInfo.iActivityId;
        this.isStockSelected = transactionInfo.bIsStockSelected;
        this.payMethods = transactionInfo.aPayMethods;
        this.business = transactionInfo.oBusiness;
        this.iLocationId = transactionInfo.iLocationId;
        this.requestParams = transactionInfo.oRequestParams;
        this.parkedTransactionLoading = false;
        this.availableAmount = +((_.sumBy(this.payMethods, 'amount') || 0).toFixed(2)); //this.getUsedPayMethods(true);
        this.updateAmountVariables();
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
        this.parkedTransactionLoading = false;
      });
  }

  updateParkedTransaction() {
    this.apiService.putNew('cashregistry', `/api/v1/park/${this.selectedTransaction._id}?iBusinessId=${this.iBusinessId}`, this.getParkedTransactionBody())
      .subscribe((data: any) => {
        this.toastrService.show({ type: 'success', text: data.message });
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  deleteParkedTransaction() {
    let vm = this;
    this.apiService.deleteNew('cashregistry', `/api/v1/park/${this.selectedTransaction._id}?iBusinessId=${this.iBusinessId}`)
      .subscribe((data: any) => {
        this.toastrService.show({ type: 'success', text: data.message });
        this.parkedTransactions = this.parkedTransactions.filter(function (item) {
          return item._id !== vm.selectedTransaction._id;
        });

        vm.clearAll();
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  openExpenses() {
    const paymentMethod = this.payMethods.find((o: any) => o.sName.toLowerCase() === 'cash');
    this.dialogService.openModal(AddExpensesComponent, {
      cssClass: 'modal-m',
      context: {
        paymentMethod,
      },
      hasBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEsc: false
    }).instance.close.subscribe(result => { });
  }

  openCardsModal(mode: string = 'new', oGiftcard?: any) {
    const oPassedGiftcard = JSON.parse(JSON.stringify(oGiftcard || ''));
    if (mode == 'edit') {
      delete oPassedGiftcard._id;
      // oGiftcard = JSON.parse(JSON.stringify(oGiftcard));
    }
    this.dialogService.openModal(CardsComponent, {
      cssClass: 'modal-lg', hasBackdrop: true, closeOnBackdropClick: false, closeOnEsc: false,
      context: { customer: this.customer, oGiftcard: oPassedGiftcard, mode: mode, appliedGiftCards: this.appliedGiftCards }
    }).instance.close.subscribe(result => {
      if (result) {
        if (result?.oGiftcard?.nAmount) {
          const oExisting = this.appliedGiftCards.find((el: any) => el._id == result.oGiftcard?._id);
          if (mode == 'edit' || oExisting) {
            oExisting.nAmount = result?.oGiftcard?.nAmount;
          } else {
            this.appliedGiftCards.push(result?.oGiftcard);
          }
        }

        if (result?.oExternalGiftcard?.nAmount) this.appliedGiftCards.push(result.oExternalGiftcard);
        if (result?.redeemedLoyaltyPoints) this.addReedemedPoints(result.redeemedLoyaltyPoints);
        this.changeInPayment();
      }
    });
  }


  openMorePaymentMethodModal() {
    this.dialogService.openModal(MorePaymentsDialogComponent,
      {
        cssClass: 'modal-l',
        context: this.allPaymentMethod,
        hasBackdrop: true,
        closeOnBackdropClick: false,
        closeOnEsc: false
      }).instance.close.subscribe(result => {
        if (result) {
          this.payMethods.push({ ...result, amount: null });
        }
      });
  }

  removeGift(index: any) {
    this.appliedGiftCards.splice(index, 1);
    this.changeInPayment();
  }

  fetchTerminals() {
    let cardPayments = ['card'];
    this.terminalService.getTerminals()
      .subscribe((res) => {
        this.terminals = res;
        if (1 > this.terminals.length) {
          cardPayments = ['maestro', 'mastercard', 'visa'];
        }
        this.allPaymentMethod.forEach((element: any) => {
          if (cardPayments.includes(element.sName.toLowerCase())) {
            this.payMethods.push(_.clone(element));
          }
        });
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async addReedemedPoints(redeemedLoyaltyPoints: number) {
    let result: any;
    result = await this.createArticleGroupService.checkArticleGroups('loyalty-points').toPromise();
    let iArticleGroupId = '';
    if (result?.data?._id) iArticleGroupId = result?.data?._id;

    this.transactionItems.push({
      name: 'Loyalty Points',
      type: 'loyalty-points',
      eTransactionType: 'loyalty-points',
      quantity: 1,
      iArticleGroupId: iArticleGroupId,
      nRedeemedLoyaltyPoints: redeemedLoyaltyPoints,
      paymentAmount: 0,
      redeemedLoyaltyPoints,
      price: 0,
      nDiscount: 0,
      bDiscountOnPercentage: false,
      oType: { bRefund: false, bDiscount: false, bPrepayment: false },
      tax: 0,
      description: '',
      oArticleGroupMetaData: { aProperty: [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      open: false,
      isExclude: true
    });
    this.redeemedLoyaltyPoints = redeemedLoyaltyPoints;
    this.clearPaymentAmounts();
  }

  openDayState() {
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation',
    }
    this.bIsOpeningDayState = true;
    this.apiService.postNew('cashregistry', `/api/v1/statistics/open/day-state`, oBody).subscribe((result: any) => {
      this.bIsOpeningDayState = false;
      if (result?.message === 'success') {
        this.bIsDayStateOpened = true;
        this.tillService.iStatisticsId = result.data._id
        if (this.bIsDayStateOpened) this.fetchQuickButtons();
        this.toastrService.show({ type: 'success', text: `Day-state is open now` });
      }
    }, (error) => {
      this.bIsOpeningDayState = false;
      this.toastrService.show({ type: 'warning', text: `Day-state is not open` });
    })
  }

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('discount').subscribe((res: any) => {
      if (res.data) this.discountArticleGroup = res.data;
    });

    const data = {
      iBusinessId: this.iBusinessId,
    };
    this.apiService.postNew('core', '/api/v1/business/article-group/list', data).subscribe((result: any) => {
      if (result?.data?.length && result?.data[0]?.result?.length)
        this.oStaticData.articleGroupsList = result.data[0].result;
    });

  }

  fetchQuickButtons() {
    this.bSearchingProduct = true;
    try {
      this.apiService.getNew('cashregistry', `/api/v1/quick-buttons/${this.requestParams.iBusinessId}?iLocationId=${this.iLocationId}`).subscribe((result: any) => {

        this.bSearchingProduct = false;
        if (result?.length) {
          this.quickButtons = result;
        }
      }, (error) => {
        this.bSearchingProduct = false;
      })
    } catch (e) {
      this.bSearchingProduct = false;
    }
  }

  checkDayState() {
    const oBody = {
      iBusinessId: this.iBusinessId || localStorage.getItem('currentBusiness'),
      iLocationId: this.iLocationId || localStorage.getItem('currentLocation'),
      iWorkstationId: this.iWorkstationId || localStorage.getItem('currentWorkstation'),
      sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation'
    }

    this.dayClosureCheckSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/check`, oBody).subscribe(async (result: any) => {
      if (result?.data) {
        this.bDayStateChecking = false;
        this.bIsDayStateOpened = result?.data?.bIsDayStateOpened;
        if (this.bIsDayStateOpened) {
          this.tillService.iStatisticsId = result.data?.oStatisticDetail?._id;
          this.bIsTransactionLoading = true;
          this.fetchQuickButtons();
        }
        if (result?.data?.oStatisticDetail?.dOpenDate) {
          this.dOpenDate = result?.data?.oStatisticDetail?.dOpenDate;

          let nDayClosurePeriodAllowed = 0;
          if (this.tillService.settings?.sDayClosurePeriod && this.tillService.settings.sDayClosurePeriod === 'week') {
            nDayClosurePeriodAllowed = 3600 * 24 * 7;
          } else {
            nDayClosurePeriodAllowed = 3600 * 24;
          }

          /* Show Close day state warning when Day-state is close according to settings day/week */
          const nOpenTimeSecond = new Date(this.dOpenDate).getTime();
          const nCurrentTimeSecond = new Date().getTime();

          const nDifference = (nCurrentTimeSecond - nOpenTimeSecond) / 1000;
          if (nDifference > nDayClosurePeriodAllowed) this.bIsPreviousDayStateClosed = false;
        }
      }
    }, (error) => {
      console.error('Error here: ', error);
      this.toastrService.show({ type: 'warning', text: `Day-state is not closed` });
    })
  }

  assignAllAmount(index: number) {
    this.payMethods[index].amount = this.nItemsTotalToBePaid;
    this.changeInPayment();
    this.createTransaction();
  }

  switchMode() {
    if (this.eKind === 'giftcard' || this.eKind === 'gold-purchase' || this.eKind === 'repair')
      this.eKind = 'regular';
  }

  async startFiskalyTransaction() {
    if (!this.bIsFiscallyEnabled) return;
    try {
      const res = await this.fiskalyService.startTransaction();
      localStorage.setItem('fiskalyTransaction', JSON.stringify(res));
    } catch (error: any) {
      if (error.error.code === 'E_UNAUTHORIZED') {
        localStorage.removeItem('fiskalyAuth');
        await this.startFiskalyTransaction();
      }
    }
  }

  async updateFiskalyTransaction(state: string, payments: []) {
    if (!this.bIsFiscallyEnabled) return;
    const pay = _.clone(payments);
    try {
      if (!localStorage.getItem('fiskalyTransaction')) {
        await this.startFiskalyTransaction();
      }
      const result = await this.fiskalyService.updateFiskalyTransaction(this.transactionItems, pay, state);
      if (state === 'FINISHED') {
        localStorage.removeItem('fiskalyTransaction');
      } else {
        localStorage.setItem('fiskalyTransaction', JSON.stringify(result));
      }
    } catch (error: any) {
      if (error?.error?.code === 'E_UNAUTHORIZED') {
        await this.updateFiskalyTransaction(state, payments);
      }
    }
  }

  async cancelFiskalyTransaction() {
    if (!this.bIsFiscallyEnabled) return;
    try {
      if (localStorage.getItem('fiskalyTransaction')) {
        await this.fiskalyService.updateFiskalyTransaction(this.transactionItems, [], 'CANCELLED');
        localStorage.removeItem('fiskalyTransaction');
      }
      // this.fiskalyService.clearAll();
    } catch (error) {
      localStorage.removeItem('fiskalyTransaction');
      this.fiskalyService.clearAll();
    }
  }

  openWarningPopup(urls: any): void {
    this.dialogService.openModal(SupplierWarningDialogComponent, { cssClass: 'modal-lg', context: { urls } })
      .instance.close.subscribe((data) => {
      })
  }

  async openModal(barcode: any) {
    barcode.toUpperCase();
    if (barcode.startsWith('0002'))
      barcode = barcode.substring(4)
    this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })

    const oBody = {
      iBusinessId: this.iBusinessId,
      searchValue: barcode
    }
    /**THIS IS TO ADD ARTICLES AUTOMATICALLY IN THE CASH REGISTER */
    if (!barcode.startsWith("AI") && !barcode.startsWith("T") && !barcode.startsWith("A") && !barcode.startsWith("G")) {
      if (this.eKind != 'regular' && this.eKind != 'order') this.eKind = 'regular';
      this.bFromBarcode = true;
      this.listShopProducts(barcode, false);
      // if (/^-?\d+$/.test(barcode) && barcode.length <= 11)
    } else {
      const result: any = await this.apiService.postNew('cashregistry', '/api/v1/transaction/search', oBody).toPromise();
      if (result?.data?.records?.length) {
        if (barcode.startsWith("AI")) {
          const oActivity = result?.data?.records[0];
          const oActivityItem = oActivity.aActivityItemMetaData.find((el: any) => el.sActivityItemNumber == barcode)
          this.openTransaction(oActivity, 'activity', [oActivityItem.iActivityItemId], 'AI');
        } else if (barcode.startsWith("T") || barcode.startsWith("A")) {
          this.openTransaction(result?.data?.records[0], 'activity');
        } else if (barcode.startsWith("G")) {
          const oBody: any = {
            iBusinessId: this.iBusinessId,
            oFilterBy: {
              sGiftCardNumber: barcode.substring(2)
            }
          }
          const oItemResult: any = await this.apiService.postNew('cashregistry', `/api/v1/activities/activity-item`, oBody).toPromise();
          if (oItemResult?.data[0]?.result?.length) {
            const oGiftcard = oItemResult?.data[0]?.result[0];
            this.openCardsModal(oGiftcard)
          }
        } else if (barcode.startsWith("R")) {
          // activityitem.find({sRepairNumber: barcode},{eTransactionItem.eKind : 1})
        }
      }
    }
  }

  openTransaction(transaction: any, itemType: any, aSelectedIds?: any, sBarcodeStartString?: string) {
    // console.log('openTransaction', { transaction, itemType, aSelectedIds, sBarcodeStartString })
    this.dialogService.openModal(TransactionItemsDetailsComponent, { cssClass: "modal-xl", context: { transaction, itemType, aSelectedIds, sBarcodeStartString }, hasBackdrop: true })
      .instance.close.subscribe(result => {
        if (result?.transaction) {
          const oData = this.tillService.processTransactionSearchResult(result);
          this.handleTransactionResponse(oData);
        }
      });
  }

  async handleTransactionResponse(data: any) {
    // console.log('handleTransactionResponse', JSON.parse(JSON.stringify(data)))
    // this.clearAll();
    const { transactionItems, transaction } = data;
    this.transactionItems.push(...transactionItems);
    this.iActivityId = transaction.iActivityId || transaction._id;
    this.sNumber += transaction?.sNumber + '<br/>';

    for (const item of this.transactionItems) {
      if (item?.iBusinessProductId && !item?.oCurrentLocation) {
        // console.log('fetching business product again');
        const _oBusinessProductDetail: any = await this.getBusinessProduct(item?.iBusinessProductId).toPromise();
        const product = _oBusinessProductDetail.data;
        if (product?.aLocation?.length) {
          item.aLocation = product.aLocation.filter((oProdLoc: any) => {
            // console.log('oProdLoc: ', oProdLoc, this.aBusinessLocation);
            const oFound: any = this.aBusinessLocation.find((oBusLoc: any) => oBusLoc?._id?.toString() === oProdLoc?._id?.toString());
            if (oFound) {
              oProdLoc.sName = oFound?.sName;
              return oProdLoc;
            }
          })
          item.oCurrentLocation = product.aLocation.find((o: any) => o._id === this.iLocationId);
          item.bProductLoaded = true;
        }
      }
    }

    if (transaction.iCustomerId && !this.customer) {
      this.fetchCustomer(transaction.iCustomerId);
    }
    this.changeInPayment();
    this.bIsTransactionLoading = false;
    await this.updateFiskalyTransaction('ACTIVE', []);
  }


  ngOnDestroy() {
    localStorage.removeItem('fromTransactionPage');
    localStorage.removeItem('recentUrl');
    this.cancelFiskalyTransaction();
    if (this.getSettingsSubscription) this.getSettingsSubscription.unsubscribe();
    if (this.dayClosureCheckSubscription) this.dayClosureCheckSubscription.unsubscribe();
    // console.log('cashregister destroy')
    MenuComponent.clearEverything();
    this.tillService.settings = null;
    this.tillService.oSavingPointSettings = null;
  }

  async openDrawer() {
    const oSettings = this.printSettings?.find((settings: any) =>
      settings.sMethod === 'thermal' &&
      settings.iWorkstationId === this.iWorkstationId &&
      settings.sType === 'regular' &&
      settings.nComputerId &&
      settings.nPrinterId);

    if (oSettings) {
      const response: any = await this.receiptService.openDrawer(this.businessDetails.oPrintNode.sApiKey, oSettings.nPrinterId, oSettings.nComputerId).toPromise();
      if (response.status == "PRINTJOB_NOT_CREATED") {
        let message = '';
        if (response.computerStatus != 'online') {
          message = 'Your computer status is : ' + response.computerStatus + '.';
        } else if (response.printerStatus != 'online') {
          message = 'Your printer status is : ' + response.printerStatus + '.';
        }
        this.toastrService.show({ type: 'warning', title: 'DRAWER_NOT_OPENED', text: message });
      } else {
        this.toastrService.show({ type: 'success', text: 'DRAWER_OPENED', apiUrl: '/api/v1/printnode/print-job', templateContext: { apiKey: this.businessDetails.oPrintNode.sApiKey, id: response.id } });
      }
    } else {
      this.toastrService.show({ type: 'warning', text: 'Error while opening cash drawer. Please check your print settings!' })
    }
  }

  articleGroupDataChange(oStaticData: any) {
    // console.log('articleGroupDataChange', oStaticData)
    this.oStaticData = oStaticData;
  }

  removeLoyaltyPoints() {
    this.redeemedLoyaltyPoints = 0;
    this.transactionItems.splice(this.transactionItems.findIndex(el => el.type === 'loyalty-points'), 1);
    this.changeInPayment();
  }

  dispatchEvent(event: string) {
    window.dispatchEvent(new Event(event))
  }

  pageChanged(page: any, isFrom: string = 'shopProducts', searchValue: string) {
    if (isFrom == 'shopProducts') {
      this.oShopProductsPaginationConfig.currentPage = page;
      this.listShopProducts(searchValue, false);
    } else {
      this.oCommonProductsPaginationConfig.currentPage = page;
      this.listCommonBrandProducts(searchValue, false)
    }
  }

  distributeAmount(payMethods: any = []) {
    this.nGiftcardAmount = 0;
    this.availableAmount = +((_.sumBy((payMethods?.length) ? payMethods : this.payMethods, 'amount') || 0).toFixed(2)); //this.getUsedPayMethods(true);

    if (this.appliedGiftCards?.length) {
      this.nGiftcardAmount = +((_.sumBy(this.appliedGiftCards.filter(el => el.type == 'custom'), 'nAmount') || 0).toFixed(2));
      this.availableAmount += +((_.sumBy(this.appliedGiftCards.filter(el => el.type != 'custom'), 'nAmount') || 0).toFixed(2));
      //console.log(this.availableAmount, this.nGiftcardAmount);
    }

    this.paymentDistributeService.distributeAmount({
      transactionItems: this.transactionItems,
      availableAmount: this.availableAmount,
      nGiftcardAmount: this.nGiftcardAmount,
      nRedeemedLoyaltyPoints: this.redeemedLoyaltyPoints,
      payMethods: this.payMethods
    });
  }

}
