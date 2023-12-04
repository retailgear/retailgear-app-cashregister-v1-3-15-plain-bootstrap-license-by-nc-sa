import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { faArrowRightFromBracket, faBoxesStacked, faCalculator, faCoins, faCopy, faGifts, faMoneyBill, faRing, faRotateLeft, faScrewdriverWrench, faSearch, faSpinner, faTimes, faTimesCircle, faTrashAlt, faTruck, faUser } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';

import * as JsBarcode from 'jsbarcode';
import * as _moment from 'moment';
import { AddExpensesComponent } from '../shared/components/add-expenses-dialog/add-expenses.component';
import { CardsComponent } from '../shared/components/cards-dialog/cards-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
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
import { TaxService } from '../shared/service/tax.service';
import { TerminalService } from '../shared/service/terminal.service';
import { TillService } from '../shared/service/till.service';
import { MenuComponent } from '../shared/_layout/components/common';
import { SupplierWarningDialogComponent } from './dialogs/supplier-warning-dialog/supplier-warning-dialog.component';
import { HttpClient } from '@angular/common/http';
const moment = (_moment as any).default ? (_moment as any).default : _moment;
@Component({
  selector: 'app-till',
  templateUrl: './till.component.html',
  styleUrls: ['./till.component.scss'],
  providers: [BarcodeService]
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
  faRing = faRing;
  faCoins = faCoins;
  faCalculator = faCalculator;
  faMoneyBill = faMoneyBill;
  faArrowRightFromBracket = faArrowRightFromBracket;
  faSpinner = faSpinner;
  faSearch = faSearch;
  faCopy = faCopy;
  faRotateLeft = faRotateLeft;
  taxes: any = [];
  transactionItems: Array<any> = [];
  selectedTransaction: any = null;
  customer: any = null;
  searchKeyword: any;
  shopProducts: any;
  commonProducts: any;
  businessId!: string;
  supplierId!: string;
  iActivityId!: string;
  sNumber !: string;
  isStockSelected = true;
  payMethods: Array<any> = [];
  allPaymentMethod: Array<any> = [];
  appliedGiftCards: Array<any> = [];
  redeemedLoyaltyPoints: number = 0;
  business: any = {};
  locationId: any = null;
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
  bIsPreviousDayStateClosed: boolean = true;
  bIsDayStateOpened: boolean = false; // Not opened then require to open it first
  bDayStateChecking: boolean = false;
  dOpenDate: any = '';
  iWorkstationId!: any;
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
  settings: any;
  businessDetails: any;
  printActionSettings: any;
  printSettings: any;
  activity: any;
  bIsOpeningDayState: boolean = false;
  selectedLanguage: any = localStorage.getItem('language') ? localStorage.getItem('language') : 'en';
  bHasIActivityItemId: boolean = false;
  employee: any;

  randNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  constructor(
    private translateService: TranslateService,
    private dialogService: DialogService,
    private taxService: TaxService,
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
    private http: HttpClient
  ) {
  }
  async ngOnInit() {
    this.apiService.setToastService(this.toastrService)
    this.business._id = localStorage.getItem('currentBusiness');
    this.locationId = localStorage.getItem('currentLocation') || null;
    this.iWorkstationId = localStorage.getItem('currentWorkstation');

    this.checkDayState();

    this.requestParams.iBusinessId = this.business._id;
    let taxDetails: any = await this.taxService.getLocationTax({ iLocationId: this.locationId });
    if (taxDetails) {
      this.taxes = taxDetails?.aRates || [];
    } else {
      setTimeout(async () => {
        taxDetails = await this.taxService.getLocationTax({ iLocationId: this.locationId });
        this.taxes = taxDetails?.aRates || [];
      }, 1000);
    }
    this.getPaymentMethods();
    this.getParkedTransactions();
    this.barcodeService.barcodeScanned.subscribe((barcode: string) => {
      this.openModal(barcode);
    });
    this.loadTransaction();

    this.checkArticleGroups();

    if (this.bIsDayStateOpened) this.fetchQuickButtons();

    const currentEmployeeId = JSON.parse(localStorage.getItem('currentUser') || '')['userId'];

    const _businessData: any = await this.getBusinessDetails().toPromise()

    this.businessDetails = _businessData.data;
    this.businessDetails.currentLocation = this.businessDetails?.aLocation?.filter((location: any) => location?._id.toString() == this.locationId.toString())[0];
    this.tillService.selectCurrency(this.businessDetails.currentLocation);
    this.businessDetails.sMobile = this.businessDetails.oPhone.sMobile;
    this.businessDetails.sLandLine = this.businessDetails?.oPhone?.sLandLine;
    this.businessDetails.sAddressline1 = this.businessDetails.currentLocation.oAddress.street + " " +
      this.businessDetails.currentLocation.oAddress.houseNumber + " " +
      this.businessDetails.currentLocation.oAddress.houseNumberSuffix + " ,  " +
      this.businessDetails.currentLocation.oAddress.postalCode + " " +
      this.businessDetails.currentLocation.oAddress.city;
    this.businessDetails.sAddressline2 = this.businessDetails.currentLocation.oAddress.country;


    this.getPrintSettings(true)
    this.getPrintSettings()
    this.getEmployee(currentEmployeeId)

    setTimeout(() => {
      MenuComponent.bootstrap();
    });

    if (this.businessDetails.currentLocation?.tssInfo) {
      this.getfiskalyInfo();
      this.cancelFiskalyTransaction();
    }
  }

  ngAfterViewInit() {
    if (this.searchField)
      this.searchField.nativeElement.focus();
  }
  async getfiskalyInfo() {
    const tssId = await this.fiskalyService.fetchTSS();
  }

  onSelectRegular() {
    this.shopProducts = []; this.commonProducts = []; this.eKind = 'regular'; this.isStockSelected = true
  }
  onSelectOrder() {
    this.shopProducts = []; this.commonProducts = []; this.eKind = 'order'; this.isStockSelected = false
    if (this.searchField)
      this.searchField.nativeElement.focus();
  }

  loadTransaction() {
    let fromTransactionPage: any = localStorage.getItem('fromTransactionPage');
    if (fromTransactionPage) {
      // const parsed = JSON.parse(fromTransactionPage);
      // console.log('sending to service, ', parsed)
      // const data = this.tillService.processTransactionSearchResult(parsed);
      // console.log('225 return of processing', data);
      this.handleTransactionResponse(JSON.parse(fromTransactionPage));
      // fromTransactionPage = JSON.parse(fromTransactionPage);
      // this.clearAll();
      // const { transactionItems, transaction } = fromTransactionPage;
      // this.transactionItems = transactionItems;
      // this.iActivityId = transaction.iActivityId || transaction._id;
      // if (transaction.iCustomerId) {
      //   this.fetchCustomer(transaction.iCustomerId);
      // }
      // this.changeInPayment();
    }
  }

  getValueFromLocalStorage(key: string): any {
    if (key === 'currentEmployee') {
      const value = localStorage.getItem('currentEmployee');
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
    const methodsToDisplay = ['card', 'cash', 'bankpayment', 'maestro', 'mastercard', 'visa'];
    this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.requestParams.iBusinessId).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.allPaymentMethod = result.data.map((v: any) => ({ ...v, isDisabled: false }));
        this.allPaymentMethod.forEach((element: any) => {
          if (methodsToDisplay.includes(element.sName.toLowerCase())) {
            this.payMethods.push(_.clone(element));
          }
        });
      }
      this.payMethodsLoading = false;
    }, (error) => {
      this.payMethodsLoading = false;
    })
  }

  addOrder(product: any): void {
    let tax = Math.max(...this.taxes.map((tax: any) => tax.nRate), 0);
    this.transactionItems.push({
      eTransactionItemType: 'regular',
      manualUpdate: false,
      index: this.transactionItems.length,
      name: this.searchKeyword,
      oType: { bRefund: false, bDiscount: false, bPrepayment: false },
      type: 'order',
      aImage: [],
      quantity: 1,
      nBrokenProduct: 0,
      price: 0,
      nPurchasePrice: 0,
      nMargin: 1,
      nDiscount: 0,
      tax: tax,
      paymentAmount: 0,
      oArticleGroupMetaData: { aProperty: [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      description: '',
      sServicePartnerRemark: '',
      eEstimatedDateAction: 'call_on_ready',
      open: true,
      new: true,
      isFor: 'create',
    });
    this.searchKeyword = '';
    this.clearPaymentAmounts();
  }

  getTotals(type: string): number {

    this.amountDefined = this.payMethods.find((pay) => pay.amount || pay.amount?.toString() === '0');
    if (!type) {
      return 0
    }
    let result = 0
    switch (type) {
      case 'price':
        this.transactionItems.forEach((i) => {
          if (!i.isExclude) {
            if (i.tType === 'refund') {
              result -= i.prePaidAmount;
            } else {
              let discountPrice = i.bDiscountOnPercentage ? (i.price - (i.price * ((i.nDiscount || 0) / 100))) : (i.price - i.nDiscount);
              i.nTotal = i.quantity * discountPrice;
              i.nTotal = i.type === 'gold-purchase' ? -1 * i.nTotal : i.nTotal;
              result += i.nTotal - (i.prePaidAmount || 0);
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
        this.transactionItems.forEach(element => {
          let discountPrice = element.bDiscountOnPercentage ? (element.price * ((element.nDiscount || 0) / 100)) : element.nDiscount;
          sum += element.quantity * discountPrice;
        });
        result = sum;
        break;
      default:
        result = 0;
        break;
    }
    return result
  }

  totalPrepayment() {
    let result = 0
    this.transactionItems.forEach((i) => {
      if (!i.isExclude) {
        result += i.paymentAmount;
      }
    });
    return result;
  }
  async addItem(type: string) {
    // const price = this.randNumber(5, 200);
    const price = 0;
    let tax = Math.max(...this.taxes.map((tax: any) => tax.nRate), 0);
    this.transactionItems.push({
      isExclude: type === 'repair' ? true : false,
      eTransactionItemType: 'regular',
      manualUpdate: type === 'gold-purchase',
      index: this.transactionItems.length,
      name: this.translateService.instant(type.toUpperCase()),
      type,
      oType: { bRefund: false, bDiscount: false, bPrepayment: false },
      oArticleGroupMetaData: { aProperty: [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      aImage: [],
      quantity: 1,
      nBrokenProduct: 0,
      price,
      nMargin: 1,
      nPurchasePrice: 0,
      nTotal: type === 'gold-purchase' ? -1 * price : price,
      nDiscount: 0,
      tax: tax,
      paymentAmount: type === 'gold-purchase' ? -1 * price : 0,
      description: '',
      sServicePartnerRemark: '',
      eActivityItemStatus: 'new',
      eEstimatedDateAction: 'call_on_ready',
      open: true,
      new: true,
      iBusinessId: this.getValueFromLocalStorage('currentBusiness'),
      ...(type === 'giftcard') && { sGiftCardNumber: Date.now() },
      ...(type === 'giftcard') && { bGiftcardTaxHandling: 'true' },
      ...(type === 'giftcard') && { isGiftCardNumberValid: false },
      ...(type === 'gold-purchase') && { oGoldFor: { name: 'stock', type: 'goods' } }
    });
    this.clearPaymentAmounts();
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
        }
      }).instance.close.subscribe(result => {
        if (result) {
          this.transactionItems = []
          this.clearAll();
        }
      }
      )
    }
    this.resetSearch();
  }

  itemChanged(item: any, index: number): void {
    switch (item) {
      case 'delete':
        // console.log('itemChanged delete')
        this.transactionItems.splice(index, 1);
        this.clearPaymentAmounts();
        this.updateFiskalyTransaction('ACTIVE', []);
        break;
      case 'update':
        // console.log('itemChanged update')
        this.clearPaymentAmounts();
        // let availableAmount = this.getUsedPayMethods(true);
        // this.paymentDistributeService.distributeAmount(this.transactionItems, availableAmount);
        break;
      case 'prepaymentChange':
        this.paymentDistributeService.distributeAmount(this.transactionItems, this.getUsedPayMethods(true));
        break;
      case 'duplicate':
        const tItem = Object.create(this.transactionItems[index]);
        tItem.sGiftCardNumber = Date.now();
        this.transactionItems.push(tItem);
        this.clearPaymentAmounts();
        break;
      default:
        // console.log('itemChanged default')
        this.transactionItems[index] = item
        this.clearPaymentAmounts();
        break;
    }
  }

  createGiftCard(item: any, index: number): void {
    const body = {
      iBusinessId: this.getValueFromLocalStorage('currentBusiness'),
      iLocationId: this.getValueFromLocalStorage('currentLocation'),

      // Do we still need to keep this hard code value here?
      iCustomerId: '6182a52f1949ab0a59ff4e7b',

      sGiftCardNumber: this.transactionItems[index].sGiftCardNumber,
      eType: '',
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

  openTransactionSearchDialog(): void {
    this.dialogService.openModal(TransactionsSearchComponent, { cssClass: 'modal-xl', context: { customer: this.customer } })
      .instance.close.subscribe((data) => {
        if (data?.transaction) {
          this.handleTransactionResponse(data);
        }
        // this.changeInPayment();
      });
  }

  openCustomerDialog(): void {
    this.dialogService.openModal(CustomerDialogComponent, { cssClass: 'modal-xl', context: { customer: this.customer } })
      .instance.close.subscribe((data) => {
        if (data.customer) {
          this.customer = data.customer;
        }
      })
  }

  fetchCustomer(customerId: any) {
    this.apiService.getNew('customer', `/api/v1/customer/${customerId}?iBusinessId=${this.business._id}`).subscribe(
      (result: any) => {
        const customer = result;
        customer['NAME'] = this.customerStructureService.makeCustomerName(customer);
        customer['SHIPPING_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false);
        customer['INVOICE_ADDRESS'] = this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false);
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
      return (_.sumBy(this.appliedGiftCards, 'nAmount') || 0) + (_.sumBy(this.payMethods, 'amount') || 0) + this.redeemedLoyaltyPoints;
    }
    return this.payMethods.filter(p => p.amount && p.amount !== 0) || 0
  }

  changeInPayment() {
    let availableAmount = this.getUsedPayMethods(true);
    this.paymentDistributeService.distributeAmount(this.transactionItems, availableAmount);
    this.allPaymentMethod = this.allPaymentMethod.map((v: any) => ({ ...v, isDisabled: true }));
    this.payMethods.map(o => o.isDisabled = true);
    const paidAmount = _.sumBy(this.payMethods, 'amount') || 0;
    if (paidAmount === 0) {
      this.payMethods.map(o => o.isDisabled = false);
    }
    // console.log('change in payment in cash ')
    this.transactionItems = [...this.transactionItems]
  }

  clearAll() {
    this.transactionItems = [];
    this.shopProducts = [];
    this.commonProducts = [];
    this.searchKeyword = '';
    this.selectedTransaction = null;
    this.payMethods.map(o => { o.amount = null, o.isDisabled = false });
    this.appliedGiftCards = [];
    this.redeemedLoyaltyPoints = 0;
    this.iActivityId = '';
    this.sNumber = '';
    this.customer = null;
    this.clearPaymentAmounts();
    // console.log('clearAll called, iActivityId = ', this.iActivityId);
  }

  clearPaymentAmounts() {
    // console.log(this.transactionItems);
    this.payMethods.map(o => { o.amount = null, o.isDisabled = false });
    let availableAmount = this.getUsedPayMethods(true);
    this.paymentDistributeService.distributeAmount(this.transactionItems, availableAmount);
  }


  startTerminalPayment() {
    this.dialogService.openModal(TerminalDialogComponent, { cssClass: 'modal-lg', context: { payments: this.payMethods } })
      .instance.close.subscribe((data) => {
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
    return this.apiService.getNew('cashregistry', `/api/v1/transaction/item/activityItem/${iActivityItemId}?iBusinessId=${this.business._id}&iTransactionItemId=${iTransactionItemId}`).toPromise();
  }

  getRelatedTransaction(iActivityId: string, iTransactionId: string) {
    const body = {
      iBusinessId: this.business._id,
      iTransactionId: iTransactionId
    }
    return this.apiService.postNew('cashregistry', '/api/v1/transaction/activity/' + iActivityId, body);
  }

  createTransaction() {
    const isGoldForCash = this.checkUseForGold();
    if (this.transactionItems.length < 1 || !isGoldForCash) {
      return;
    }
    console.log(this.transactionItems);
    const giftCardPayment = this.allPaymentMethod.find((o) => o.sName === 'Giftcards');
    this.saveInProgress = true;
    const nTotalToPay = this.getTotals('price');
    const nEnteredAmountTotal = this.getUsedPayMethods(true);

    if (nTotalToPay < 0) {
      let nDiff = parseFloat((nTotalToPay - nEnteredAmountTotal).toFixed(2));
      if (nDiff < -0.02 || nDiff > 0.02) {
        this.toastrService.show({ type: 'warning', text: `We do not allow prepayment on negative transactions and also we do not support negative change money.` });
        this.saveInProgress = false;
        return;
      }
    }
    const changeAmount = nEnteredAmountTotal - nTotalToPay
    this.dialogService.openModal(TerminalDialogComponent, { cssClass: 'modal-lg', context: { payments: this.payMethods, changeAmount } })
      .instance.close.subscribe((payMethods: any) => {
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
          payMethods = payMethods.filter((o: any) => o.amount !== 0);
          const body = this.tillService.createTransactionBody(this.transactionItems, payMethods, this.discountArticleGroup, this.redeemedLoyaltyPoints, this.customer);
          if (body.transactionItems.filter((item: any) => item.oType.eKind === 'repair')[0]?.iActivityItemId) {
            this.bHasIActivityItemId = true
          }
          if (giftCardPayment && this.appliedGiftCards.length > 0) {
            this.appliedGiftCards.forEach(element => {
              const cardPaymethod = _.clone(giftCardPayment);
              cardPaymethod.amount = element.nAmount;
              cardPaymethod.sGiftCardNumber = element.sGiftCardNumber;
              cardPaymethod.iArticleGroupId = element.iArticleGroupId;
              cardPaymethod.iArticleGroupOriginalId = element.iArticleGroupOriginalId;
              cardPaymethod.type = element.type;
              body.payments.push(cardPaymethod);
            });
            body.giftCards = this.appliedGiftCards;
          }
          body.oTransaction.iActivityId = this.iActivityId;
          let result = body.transactionItems.map((a: any) => a.iBusinessPartnerId);
          const uniq = [...new Set(_.compact(result))];
          if (this.appliedGiftCards?.length) this.tillService.createGiftcardTransactionItem(body, this.discountArticleGroup);

          const oDialogComponent: DialogComponent = this.dialogService.openModal(TransactionActionDialogComponent, {
            cssClass: 'modal-lg', hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true,
          }).instance;

          this.apiService.postNew('cashregistry', '/api/v1/till/transaction', body)
            .subscribe(async (data: any) => {

              // this.toastrService.show({ type: 'success', text: 'Transaction created.' });
              this.saveInProgress = false;
              const { transaction, aTransactionItems, activityItems, activity } = data;
              transaction.aTransactionItems = aTransactionItems;
              transaction.activity = activity;
              this.transaction = transaction;
              this.activityItems = activityItems;
              this.activity = activity;


              this.transaction.aTransactionItems.map((tItem: any) => {
                for (const aItem of this.activityItems) {
                  if (aItem.iTransactionItemId === tItem._id) {
                    tItem.sActivityItemNumber = aItem.sNumber;
                    break;
                  }
                }
              });

              this.handleReceiptPrinting(oDialogComponent);
              this.updateFiskalyTransaction('FINISHED', body.payments);
              setTimeout(() => {
                this.saveInProgress = false;
                this.fetchBusinessPartnersProductCount(uniq);
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
      this.apiService.getNew('auth', `/api/v1/employee/${id}?iBusinessId=${this.business._id}`).subscribe((result: any) => {
        this.employee = result?.data;
      });
    }
  }


  async handleReceiptPrinting(oDialogComponent: DialogComponent) {
    this.transaction = await this.tillService.processTransactionForPdfReceipt(this.transaction);

    let oDataSource = JSON.parse(JSON.stringify(this.transaction));
    let nTotalOriginalAmount = 0;
    oDataSource.aTransactionItems.forEach((item: any) => {
      nTotalOriginalAmount += item.nPriceIncVatAfterDiscount;
      let description = (item?.totalPaymentAmount != item?.nPriceIncVatAfterDiscount) ? `${this.translateService.instant('ORIGINAL_AMOUNT_INC_DISC')}: ${item.nPriceIncVatAfterDiscount}\n` : '';
      if (item?.related?.length) {
        description += `${this.translateService.instant('ALREADY_PAID')}: \n${item.sTransactionNumber} | ${item.nRevenueAmount} (${this.translateService.instant('THIS_RECEIPT')})\n`;

        item.related.forEach((related: any) => {
          description += `${related.sTransactionNumber} | ${related.nRevenueAmount}\n`;
        });
      }

      item.description = description;
    });
    // oDataSource.bHasPrePayments = true;
    oDataSource.sActivityNumber = oDataSource.activity.sNumber;
    oDataSource.nTotalOriginalAmount = nTotalOriginalAmount;
    oDataSource.sBarcodeURI = this.generateBarcodeURI(false, oDataSource.sNumber);
    oDataSource.sActivityBarcodeURI = this.generateBarcodeURI(false, oDataSource.sActivityNumber);

    const aUniqueItemTypes = [];

    const nRepairCount = oDataSource.aTransactionItemType.filter((e: any) => e === 'repair')?.length;
    const nOrderCount = oDataSource.aTransactionItemType.filter((e: any) => e === 'order')?.length;

    const bRegularCondition = oDataSource.total > 0.02 || oDataSource.total < -0.02;
    const bOrderCondition = nOrderCount === 1 && nRepairCount === 1 || nRepairCount > 1 || nOrderCount > 1;
    const bRepairCondition = nRepairCount === 1 && nOrderCount === 0;
    const bRepairAlternativeCondition = nRepairCount >= 1 && nOrderCount >= 1;

    if (bRegularCondition) aUniqueItemTypes.push('regular')

    if (bOrderCondition) aUniqueItemTypes.push('order');

    aUniqueItemTypes.push(...['repair', 'repair_alternative', 'giftcard']);

    oDataSource.businessDetails = this.businessDetails;
    oDataSource.currentLocation = this.businessDetails.currentLocation;// ? this.businessDetails.currentLocation : this.getValueFromLocalStorage('currentLocation');    

    const [_template, _oLogoData]: any = await Promise.all([
      this.getTemplate(aUniqueItemTypes),
      // if no logo is there, use a default logo. or show a message: please upload your shop logo
      this.getBase64FromUrl(oDataSource?.businessDetails?.sLogoLight),
    ]);

    oDataSource.sAdvisedEmpFirstName = this.employee?.sFirstName || 'a';
    oDataSource.sBusinessLogoUrl = _oLogoData.data;
    if (oDataSource.oCustomer && oDataSource.oCustomer.bCounter === true) {
      oDataSource.oCustomer = {};
    } else {
      oDataSource.oCustomer = {
        sFirstName: oDataSource.oCustomer.sFirstName,
        sLastName: oDataSource.oCustomer.sLastName,
        sEmail: oDataSource.oCustomer.sEmail,
        sMobile: oDataSource.oCustomer.oPhone?.sCountryCode + oDataSource.oCustomer.oPhone?.sMobile,
        sLandLine: oDataSource.oCustomer.oPhone?.sLandLine,
        oInvoiceAddress: oDataSource.oCustomer?.oInvoiceAddress
      };
    }
    const aTemplates = _template.data;

    oDialogComponent.contextChanged.next({
      transaction: oDataSource,
      printActionSettings: this.printActionSettings,
      printSettings: this.printSettings,
      aUniqueItemTypes: aUniqueItemTypes,
      nRepairCount: nRepairCount,
      nOrderCount: nOrderCount,
      activityItems: this.activityItems,
      activity: this.activity,
      aTemplates: aTemplates,
      businessDetails: this.businessDetails
    });

    oDialogComponent.close.subscribe(() => { this.clearAll(); });
    oDialogComponent.triggerEvent.subscribe(() => { this.clearAll(); });

    if (bOrderCondition) {
      // print order receipt
      const orderTemplate = aTemplates.filter((template: any) => template.eType === 'order')[0];
      oDataSource.sActivityNumber = oDataSource.activity.sNumber;
      this.sendForReceipt(oDataSource, orderTemplate, oDataSource.activity.sNumber);
    }
    if (bRegularCondition) {
      //print proof of payments receipt
      const template = aTemplates.filter((template: any) => template.eType === 'regular')[0];
      this.sendForReceipt(oDataSource, template, oDataSource.sNumber, 'regular');
    }

    if (bRepairCondition) {
      if (this.bHasIActivityItemId) {
        this.bHasIActivityItemId = false;
        return;
      }
      //use two column layout
      const template = aTemplates.filter((template: any) => template.eType === 'repair')[0];
      oDataSource = this.activityItems.filter((item: any) => item.oType.eKind === 'repair')[0];
      oDataSource.sAdvisedEmpFirstName = this.employee?.sFirstName || 'a';
      const aTemp = oDataSource.sNumber.split("-");
      oDataSource.sPartRepairNumber = aTemp[aTemp.length - 1];
      oDataSource.sBarcodeURI = this.generateBarcodeURI(false, oDataSource.sNumber);
      this.sendForReceipt(oDataSource, template, oDataSource.sNumber);

    }

    if (bRepairAlternativeCondition) {
      // use repair_alternative laYout
      const template = aTemplates.filter((template: any) => template.eType === 'repair_alternative')[0];
      oDataSource = this.activityItems.filter((item: any) => item.oType.eKind === 'repair');
      oDataSource.sAdvisedEmpFirstName = this.employee?.sFirstName || 'a';
      oDataSource.forEach((data: any) => {
        data.sBarcodeURI = this.generateBarcodeURI(false, data.sNumber);
        data.sBusinessLogoUrl = _oLogoData.data;
        data.businessDetails = this.businessDetails;
        this.sendForReceipt(data, template, data.sNumber);
      })
    }


  }

  sendForReceipt(oDataSource: any, template: any, title: any, type?: any) {
    const printActionSettings = this.printActionSettings.filter((pas: any) => pas.eType === type);
    if (printActionSettings?.length) {
      const aActionToPerform = printActionSettings[0].aActionToPerform;
      if (aActionToPerform.includes('PRINT_THERMAL')) {
        // console.log({ oDataSource , b: oDataSource.businessDetails})
        this.receiptService.printThermalReceipt({
          oDataSource: oDataSource,
          printSettings: this.printSettings,
          sAction: 'thermal',
          apikey: this.businessDetails.oPrintNode.sApiKey,
          title: oDataSource.sNumber
        });
      }
      if (aActionToPerform.includes('DOWNLOAD') || aActionToPerform.includes('PRINT_PDF')) {
        const settings = this.printSettings.filter((s: any) => s.sMethod === 'pdf' && s.sType === type && s.iWorkstationId === this.iWorkstationId);

        this.receiptService.exportToPdf({
          oDataSource: oDataSource,
          pdfTitle: title,
          templateData: template,
          printSettings: settings,
          printActionSettings: this.printActionSettings,
          eSituation: 'is_created'
        });
      }
    }
  }

  getPrintSettings(action?: any) {
    let oBody = {
      iLocationId: this.locationId,
      oFilterBy: {}
    }
    if (action) {
      oBody.oFilterBy = { sMethod: 'actions' };
    }
    this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.business._id}`, oBody).subscribe((result: any) => {
      if (action) {
        this.printActionSettings = result?.data[0]?.result[0].aActions;
      } else {
        this.printSettings = result?.data[0]?.result;
      }
    });
  }

  getBase64FromUrl(url: any) {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.business._id}?url=${url}`).toPromise();
  }

  getTemplate(types: any) {
    const body = {
      iBusinessId: this.business._id,
      iLocationId: this.locationId,
      oFilterBy: {
        eType: types
      }
    }
    return this.apiService.postNew('cashregistry', `/api/v1/pdf/templates`, body).toPromise();
  }

  // async processTransactionData() {


  // }

  getBusinessDetails() {
    return this.apiService.getNew('core', '/api/v1/business/' + this.business._id);
    // this.businessDetails = result.data;
    // this.businessDetails.currentLocation = this.businessDetails?.aLocation?.filter((location: any) => location?._id.toString() == this.locationId.toString())[0];
    // this.tillService.selectCurrency(this.businessDetails.currentLocation);

    // this.http.get<any>(this.businessDetails.sLogoLight).subscribe((data: any) => {
    //   // console.log(data)
    // }, (error: any) => {
    //   this.businessDetails.sLogoLight = "local";
    // })
    // });
  }


  fetchBusinessPartnersProductCount(aBusinessPartnerId: any) {
    if (!aBusinessPartnerId.length || 1 > aBusinessPartnerId.length) {
      return;
    }
    var body = {
      iBusinessId: this.getValueFromLocalStorage('currentBusiness'),
      aBusinessPartnerId
    };
    this.apiService.postNew('core', '/api/v1/business/partners/product-count', body).subscribe(
      (result: any) => {
        if (result && result.data) {
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
        // this.partnersList = [];
        console.log(error);
      }
    );
  }

  /* Search API for finding the  common-brands products */
  listShopProducts(searchValue: string | undefined, isFromEAN: boolean | false) {
    let data = {
      iBusinessId: this.business._id,
      skip: 0,
      limit: 10,
      sortBy: '',
      sortOrder: '',
      searchValue: searchValue,
      aProjection: this.aProjection,
      oFilterBy: {
        oStatic: {},
        oDynamic: {}
      }
    }
    this.bSearchingProduct = true;
    this.apiService.postNew('core', '/api/v1/business/products/list', data).subscribe((result: any) => {
      this.bSearchingProduct = false;
      if (result && result.data && result.data.length) {
        const response = result.data[0];
        this.shopProducts = response.result;
      }
    }, (error) => {
      this.bSearchingProduct = false;
    });
  }

  listCommonBrandProducts(searchValue: string | undefined, isFromEAN: boolean | false) {
    let data = {
      iBusinessId: this.business._id,
      skip: 0,
      limit: 10,
      sortBy: '',
      sortOrder: '',
      searchValue: searchValue,
      aProjection: this.aProjection,
      oFilterBy: {
        oStatic: {},
        oDynamic: {}
      }
    };
    this.bSearchingProduct = true;
    this.apiService.postNew('core', '/api/v1/products/commonbrand/list', data).subscribe((result: any) => {
      this.bSearchingProduct = false;
      if (result && result.data && result.data.length) {
        const response = result.data[0];
        this.commonProducts = response.result;
      }
    }, (error) => {
      this.bSearchingProduct = false;
    });
  }

  getBusinessProduct(iBusinessProductId: string): Observable<any> {
    return this.apiService.getNew('core', `/api/v1/business/products/${iBusinessProductId}?iBusinessId=${this.business._id}`)
  }

  getBaseProduct(iProductId: string): Observable<any> {
    return this.apiService.getNew('core', `/api/v1/products/${iProductId}?iBusinessId=${this.business._id}`)
  }

  // Add selected product into purchase order
  async onSelectProduct(product: any, isFrom: string = '', isFor: string = '', source?: any) {

    let price: any = {};
    if (isFrom === 'quick-button') {
      source.loading = true;
      this.onSelectRegular();
      let selectedQuickButton = product;
      this.bSearchingProduct = true;
      this.bSearchingProduct = false;
      price.nPriceIncludesVat = selectedQuickButton.nPrice;
    } else {
      price = product.aLocation ? product.aLocation.find((o: any) => o._id === this.locationId) : 0;
    }
    if (isFor == 'commonProducts') {
      const _oBaseProductDetail = await this.getBaseProduct(product?._id).toPromise();
      product = _oBaseProductDetail.data;
    } else {
      const _oBusinessProductDetail = await this.getBusinessProduct(product?.iBusinessProductId || product?._id).toPromise();
      product = _oBusinessProductDetail.data;
    }
    let name = '';
    name = (product?.oArticleGroup?.oName) ? ((product.oArticleGroup?.oName[this.selectedLanguage]) ? product.oArticleGroup?.oName[this.selectedLanguage] : product.oArticleGroup.oName['en']) : '';
    name += ' ' + (product?.sLabelDescription || '');
    name += ' ' + (product?.sProductNumber || '');
    this.transactionItems.push({
      name: name,
      eTransactionItemType: 'regular',
      type: this.eKind,
      quantity: 1,
      price: (isFor == 'commonProducts') ? product.nSuggestedRetailPrice : (price ? price.nPriceIncludesVat : 0),
      nMargin: 1,
      nPurchasePrice: product.nPurchasePrice,
      paymentAmount: 0,
      oType: { bRefund: false, bDiscount: false, bPrepayment: false },
      nDiscount: product.nDiscount || 0,
      bDiscountOnPercentage: product.bDiscountOnPercentage || false,
      tax: (product?.aLocation?.length) ? product.aLocation.find((l: any) => l._id === this.locationId)?.nVatRate || 0 : 0,
      sProductNumber: product.sProductNumber,
      sArticleNumber: product.sArticleNumber,
      description: '',//product.sLabelDescription,
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
      open: true,
      new: true,
      isFor,
      oBusinessProductMetaData: this.tillService.createProductMetadata(product),
    });
    if (isFrom === 'quick-button') { source.loading = false }
    this.resetSearch();
    this.clearPaymentAmounts();
  }

  resetSearch() {
    this.searchKeyword = '';
    this.shopProducts = [];
    this.commonProducts = [];
  }

  search() {
    this.shopProducts = [];
    this.commonProducts = [];
    this.listShopProducts(this.searchKeyword, false);
    if (!this.isStockSelected) {
      this.listCommonBrandProducts(this.searchKeyword, false); // Searching for the products of common brand
    }
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
    });
  }

  getParkedTransactionBody(): Object {
    const body = {
      aTaxes: this.taxes,
      aTransactionItems: this.transactionItems,
      oCustomer: this.customer,
      // searchKeyword: this.searchKeyword,
      // shopProducts: this.shopProducts,
      iBusinessId: this.businessId,
      iSupplierId: this.supplierId,
      iActivityId: this.iActivityId,
      bIsStockSelected: this.isStockSelected,
      aPayMethods: this.payMethods,
      oBusiness: this.business,
      iLocationId: this.locationId,
      oRequestParams: this.requestParams,
    };
    return body;
  }
  park(): void {
    this.apiService.postNew('cashregistry', `/api/v1/park?iBusinessId=${this.getValueFromLocalStorage('currentBusiness')}`, this.getParkedTransactionBody())
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
    this.apiService.getNew('cashregistry', `/api/v1/park?iBusinessId=${this.business._id}`).subscribe((data: any) => {
      this.parkedTransactions = data;

    }, err => {
      this.toastrService.show({ type: 'danger', text: err.message });
    });
  }

  fetchParkedTransactionInfo() {
    this.parkedTransactionLoading = true;
    this.apiService.getNew('cashregistry', `/api/v1/park/${this.selectedTransaction._id}?iBusinessId=${this.business._id}`)
      .subscribe((transactionInfo: any) => {
        this.taxes = transactionInfo.aTaxes;
        this.transactionItems = transactionInfo.aTransactionItems;
        this.customer = transactionInfo.oCustomer;
        this.businessId = transactionInfo.iBusinessId;
        this.supplierId = transactionInfo.iSupplierId;
        this.iActivityId = transactionInfo.iActivityId;
        this.isStockSelected = transactionInfo.bIsStockSelected;
        this.payMethods = transactionInfo.aPayMethods;
        this.business = transactionInfo.oBusiness;
        this.locationId = transactionInfo.iLocationId;
        this.requestParams = transactionInfo.oRequestParams;
        this.parkedTransactionLoading = false;
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
        this.parkedTransactionLoading = false;
      });
  }

  updateParkedTransaction() {
    this.apiService.putNew('cashregistry', `/api/v1/park/${this.selectedTransaction._id}?iBusinessId=${this.getValueFromLocalStorage('currentBusiness')}`, this.getParkedTransactionBody())
      .subscribe((data: any) => {
        this.toastrService.show({ type: 'success', text: data.message });
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  deleteParkedTransaction() {
    let vm = this;
    this.apiService.deleteNew('cashregistry', `/api/v1/park/${this.selectedTransaction._id}?iBusinessId=${this.getValueFromLocalStorage('currentBusiness')}`)
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
    this.dialogService.openModal(AddExpensesComponent, { cssClass: 'modal-m', context: { paymentMethod, taxes: this.taxes } })
      .instance.close.subscribe(result => {
      });
  }

  openCardsModal(oGiftcard?: any) {
    this.dialogService.openModal(CardsComponent, { cssClass: 'modal-lg', context: { customer: this.customer, oGiftcard } })
      .instance.close.subscribe(result => {
        if (result) {
          if (result.giftCardInfo.nAmount > 0) {
            this.appliedGiftCards.push(result.giftCardInfo);
            this.changeInPayment();
          }
          if (result.redeemedLoyaltyPoints && result.redeemedLoyaltyPoints > 0) {
            this.addReedemedPoints(result.redeemedLoyaltyPoints);
          }
        }
      });
  }


  openMorePaymentMethodModal() {
    this.dialogService.openModal(MorePaymentsDialogComponent, { cssClass: 'modal-l', context: this.allPaymentMethod })
      .instance.close.subscribe(result => {
        if (result) {
          this.payMethods.push(_.clone(result));
        }
      });
  }

  removeGift(index: any) {
    this.appliedGiftCards.splice(index, 1);
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

  addReedemedPoints(redeemedLoyaltyPoints: number) {
    this.transactionItems.push({
      name: 'Loyalty Points',
      type: 'loyalty-points',
      eTransactionType: 'loyalty-points',
      quantity: 1,
      redeemedLoyaltyPoints,
      price: 0,
      nDiscount: 0,
      bDiscountOnPercentage: false,
      tax: 0,
      description: '',
      oArticleGroupMetaData: { aProperty: [], sCategory: '', sSubCategory: '', oName: {}, oNameOriginal: {} },
      open: true,
    });
    this.redeemedLoyaltyPoints = redeemedLoyaltyPoints;
    this.clearPaymentAmounts();
  }

  openDayState() {
    const oBody = {
      iBusinessId: this.business._id,
      iLocationId: this.locationId,
      iWorkstationId: this.iWorkstationId
    }
    this.bIsOpeningDayState = true;
    this.apiService.postNew('cashregistry', `/api/v1/statistics/open/day-state`, oBody).subscribe((result: any) => {
      this.bIsOpeningDayState = false;
      if (result?.message === 'success') {
        this.bIsDayStateOpened = true;
        if (this.bIsDayStateOpened) this.fetchQuickButtons();
        this.toastrService.show({ type: 'success', text: `Day-state is open now` });
      }
    }, (error) => {
      this.bIsOpeningDayState = false;
      this.toastrService.show({ type: 'warning', text: `Day-state is not open` });
    })
  }

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('Discount')
      .subscribe((res: any) => {
        if (1 > res.data.length) {
          this.createArticleGroup();
        } else {
          this.discountArticleGroup = res.data[0].result[0];
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async createArticleGroup() {
    const articleBody = { name: 'Discount', sCategory: 'Discount', sSubCategory: 'Discount' };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.discountArticleGroup = result.data;
  }

  fetchQuickButtons() {
    this.bSearchingProduct = true;
    try {
      this.apiService.getNew('cashregistry', `/api/v1/quick-buttons/${this.requestParams.iBusinessId}?iLocationId=${this.locationId}`).subscribe((result: any) => {

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
      iBusinessId: this.business._id,
      iLocationId: this.locationId,
      iWorkstationId: this.iWorkstationId
    }
    this.bDayStateChecking = true;
    this.dayClosureCheckSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/check`, oBody).subscribe((result: any) => {
      if (result?.data) {
        this.bDayStateChecking = false;
        this.bIsDayStateOpened = result?.data?.bIsDayStateOpened;
        if (this.bIsDayStateOpened) this.fetchQuickButtons();
        if (result?.data?.oStatisticDetail?.dOpenDate) {
          this.dOpenDate = result?.data?.oStatisticDetail?.dOpenDate;

          this.getSettingsSubscription = this.apiService.getNew('cashregistry', `/api/v1/settings/${this.business._id}`).subscribe((result: any) => {
            this.settings = result;
            let nDayClosurePeriodAllowed = 0;
            if (this.settings?.sDayClosurePeriod && this.settings.sDayClosurePeriod === 'week') {
              nDayClosurePeriodAllowed = 3600 * 24 * 7;
            } else {
              nDayClosurePeriodAllowed = 3600 * 24;
            }

            /* Show Close day state warning when Day-state is close according to settings day/week */
            const nOpenTimeSecond = new Date(this.dOpenDate).getTime();
            const nCurrentTimeSecond = new Date().getTime();

            const nDifference = (nCurrentTimeSecond - nOpenTimeSecond) / 1000;
            if (nDifference > nDayClosurePeriodAllowed) this.bIsPreviousDayStateClosed = false;
          }, (error) => {
            console.log(error);
          })

          // /* Show Close day state warning when Day-state is close from last 24hrs */
          // const nOpenTimeSecond = (new Date(this.dOpenDate).getTime());
          // const nCurrentTimeSecond = (new Date().getTime());
          // const nDifferenceInHrs = (nCurrentTimeSecond - nOpenTimeSecond) / 3600000;
          // if (nDifferenceInHrs > 24) this.bIsPreviousDayStateClosed = false;
        }
      }
    }, (error) => {
      console.error('Error here: ', error);
      this.toastrService.show({ type: 'warning', text: `Day-state is not closed` });
    })
  }



  /* When doing */
  assignAllAmount(index: number) {
    this.payMethods[index].amount = -(this.getUsedPayMethods(true) - this.getTotals('price'));
    this.changeInPayment();
    this.createTransaction();
  }

  switchMode() {
    if (this.eKind === 'giftcard' || this.eKind === 'gold-purchase' || this.eKind === 'repair')
      this.eKind = 'regular';
  }

  async startFiskalyTransaction() {
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
    if (!this.businessDetails.currentLocation?.tssInfo) {
      return;
    }
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
        localStorage.removeItem('fiskalyAuth');
        await this.updateFiskalyTransaction(state, payments);
      }
    }
  }

  async cancelFiskalyTransaction() {
    try {
      if (localStorage.getItem('fiskalyTransaction')) {
        await this.fiskalyService.updateFiskalyTransaction(this.transactionItems, [], 'CANCELLED');
        localStorage.removeItem('fiskalyTransaction');
        localStorage.removeItem('tssId');
      } else {
        localStorage.removeItem('tssId');
      }
    } catch (error) {
      localStorage.removeItem('fiskalyTransaction');
      localStorage.removeItem('tssId');
    }
  }

  openWarningPopup(urls: any): void {
    this.dialogService.openModal(SupplierWarningDialogComponent, { cssClass: 'modal-lg', context: { urls } })
      .instance.close.subscribe((data) => {
      })
  }

  async openModal(barcode: any) {
    if (barcode.startsWith('0002'))
      barcode = barcode.substring(4)
    this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })
    if (barcode.startsWith("AI")) {
      let oBody: any = {
        iBusinessId: this.business._id,
        oFilterBy: {
          sNumber: barcode
        }
      }
      const activityItemResult: any = await this.apiService.postNew('cashregistry', `/api/v1/activities/activity-item`, oBody).toPromise();
      if (activityItemResult?.data[0]?.result?.length) {

        oBody = {
          iBusinessId: this.business._id,
        }
        const iActivityId = activityItemResult?.data[0].result[0].iActivityId;
        const iActivityItemId = activityItemResult?.data[0].result[0]._id;
        this.openTransaction({ _id: iActivityId }, 'activity', [iActivityItemId]);
      }
    } else if (barcode.startsWith("T")) {

      const oBody = {
        iBusinessId: this.business._id,
        searchValue: barcode
      }
      const result: any = await this.apiService.postNew('cashregistry', '/api/v1/transaction/search', oBody).toPromise();
      if (result?.transactions?.records?.length) {
        this.openTransaction(result?.transactions?.records[0], 'transaction');
      }
      //transactions.find({sNumber: barcode})
    } else if (barcode.startsWith("A")) {

      const oBody = {
        iBusinessId: this.business._id,
        searchValue: barcode
      }
      const result: any = await this.apiService.postNew('cashregistry', '/api/v1/transaction/search', oBody).toPromise();
      if (result?.activities?.records?.length) {
        this.openTransaction(result?.activities?.records[0], 'activity');
      }
      //activity.find({sNumber: barcode})
    } else if (barcode.startsWith("G")) {
      let oBody: any = {
        iBusinessId: this.business._id,
        oFilterBy: {
          sGiftCardNumber: barcode.substring(2)
        }
      }
      let result: any = await this.apiService.postNew('cashregistry', `/api/v1/activities/activity-item`, oBody).toPromise();
      if (result?.data[0]?.result?.length) {
        const oGiftcard = result?.data[0]?.result[0];
        this.openCardsModal(oGiftcard)
      }
      // activityitem.find({sGiftcardNumber: barcode},{eTransactionItem.eKind : 1})
    } else if (barcode.startsWith("R")) {
      // activityitem.find({sRepairNumber: barcode},{eTransactionItem.eKind : 1})
    }

  }

  openTransaction(transaction: any, itemType: any, aSelectedIds?: any) {
    this.dialogService.openModal(TransactionItemsDetailsComponent, { cssClass: "modal-xl", context: { transaction, itemType, aSelectedIds } })
      .instance.close.subscribe(result => {
        const transactionItems: any = [];
        if (result?.transaction) {
          result.transactionItems.forEach((transactionItem: any) => {
            if (transactionItem.isSelected) {
              const { tType } = transactionItem;
              let paymentAmount = transactionItem.nQuantity * transactionItem.nPriceIncVat - transactionItem.nPaidAmount;
              if (tType === 'refund') {
                paymentAmount = 0;
                transactionItem.oType.bRefund = true;
              } else if (tType === 'revert') {
                paymentAmount = transactionItem.nPaidAmount;
                transactionItem.oType.bRefund = false;
              };
              transactionItems.push({
                name: transactionItem.sProductName || transactionItem.sProductNumber,
                iActivityItemId: transactionItem.iActivityItemId,
                nRefundAmount: transactionItem.nPaidAmount,
                iLastTransactionItemId: transactionItem.iTransactionItemId,
                prePaidAmount: tType === 'refund' ? transactionItem.nPaidAmount : transactionItem.nPaymentAmount,
                type: transactionItem.sGiftCardNumber ? 'giftcard' : transactionItem.oType.eKind,
                eTransactionItemType: 'regular',
                nBrokenProduct: 0,
                tType,
                oType: transactionItem.oType,
                sUniqueIdentifier: transactionItem.sUniqueIdentifier,
                aImage: transactionItem.aImage,
                nonEditable: transactionItem.sGiftCardNumber ? true : false,
                sGiftCardNumber: transactionItem.sGiftCardNumber,
                quantity: transactionItem.nQuantity,
                iBusinessProductId: transactionItem.iBusinessProductId,
                price: transactionItem.nPriceIncVat,
                iRepairerId: transactionItem.iRepairerId,
                oArticleGroupMetaData: transactionItem.oArticleGroupMetaData,
                nRedeemedLoyaltyPoints: transactionItem.nRedeemedLoyaltyPoints,
                iArticleGroupId: transactionItem.iArticleGroupId,
                iEmployeeId: transactionItem.iEmployeeId,
                iAssigneeId: transactionItem.iAssigneeId,
                iBusinessBrandId: transactionItem.iBusinessBrandId,
                nDiscount: transactionItem.nDiscount || 0,
                bDiscountOnPercentage: transactionItem.nDiscount || 0,
                tax: transactionItem.nVatRate,
                oGoldFor: transactionItem.oGoldFor,
                iSupplierId: transactionItem.iSupplierId,
                paymentAmount,
                description: transactionItem.sDescription,
                open: true,
                nMargin: transactionItem.nMargin,
                nPurchasePrice: transactionItem.nPurchasePrice,
                oBusinessProductMetaData: transactionItem.oBusinessProductMetaData,
                sServicePartnerRemark: transactionItem.sServicePartnerRemark,
                eActivityItemStatus: transactionItem.eActivityItemStatus,
                eEstimatedDateAction: transactionItem.eEstimatedDateAction,
                bGiftcardTaxHandling: transactionItem.bGiftcardTaxHandling,
              });
            }
          });
          result.transactionItems = transactionItems;
          this.handleTransactionResponse(result);
        }
      });
  }

  handleTransactionResponse(data: any) {
    this.clearAll();
    const { transactionItems, transaction } = data;
    this.transactionItems = transactionItems;
    this.iActivityId = transaction.iActivityId || transaction._id;
    this.sNumber = transaction?.sNumber;
    if (transaction.iCustomerId) {
      this.fetchCustomer(transaction.iCustomerId);
    }
    this.changeInPayment();
  }

  generateBarcodeURI(displayValue: boolean = true, data: any) {
    var canvas = document.createElement("canvas");
    JsBarcode(canvas, data, { format: "CODE128", displayValue: displayValue });
    return canvas.toDataURL("image/png");
  }

  ngOnDestroy() {
    localStorage.removeItem('fromTransactionPage');
    this.cancelFiskalyTransaction();
    if (this.getSettingsSubscription) this.getSettingsSubscription.unsubscribe();
    if (this.dayClosureCheckSubscription) this.dayClosureCheckSubscription.unsubscribe();
    console.log('cashregister destroy')
    MenuComponent.clearEverything();
  }
}
