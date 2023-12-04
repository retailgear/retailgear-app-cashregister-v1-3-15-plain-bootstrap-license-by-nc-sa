import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { TransactionItem } from '../../till/models/transaction-item.model';
import { Transaction } from '../../till/models/transaction.model';
import { ApiService } from './api.service';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
// import * as _moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { TaxService } from './tax.service';
import * as JsBarcode from 'jsbarcode';
// const moment = (_moment as any).default ? (_moment as any).default : _moment;
@Injectable({
  providedIn: 'root'
})
export class TillService {

  currency: string = "€";
  separator: string = ",";

  iBusinessId = localStorage.getItem('currentBusiness') || '';
  iLocationId = localStorage.getItem('currentLocation') || '';
  iWorkstationId = localStorage.getItem('currentWorkstation') || '';

  settings:any;
  taxes:any;
  aDiscountTypes = ['loyalty-points-discount', 'discount', 'giftcard-discount'];
  oSavingPointSettings:any;
  iStatisticsId: any;
  ledgerDescriptions = [
    { title: 'drinks', type: 'negative', eDefaultArticleType: 'expense-drinks' },
    { title: 'food', type: 'negative', eDefaultArticleType: 'expense-food' },
    { title: 'cleaning costs', type: 'negative', eDefaultArticleType: 'expense-cleaning-cost' },
    { title: 'office supplies', type: 'negative', eDefaultArticleType: 'expense-office-supplies' },
    { title: 'promotional material', type: 'negative', eDefaultArticleType: 'expense-promotional-material' },
    { title: 'shipping costs', type: 'negative', eDefaultArticleType: 'expense-shipping-cost' },
    { title: 'car costs', type: 'negative', eDefaultArticleType: 'expense-car-cost' },
    { title: 'Add money to cash register', type: 'positive', eDefaultArticleType: 'expense-add-to-cash' },
    { title: 'Lost money/money difference', type: 'negative', eDefaultArticleType: 'expense-lost-money' },
  ];

  constructor(
    private apiService: ApiService,
    private translateService: TranslateService,
    private taxService: TaxService) {
    this.fetchTaxes();
    this.fetchPointsSettings();
  }

  fetchPointsSettings() {
    // if(this.oSavingPointSettings?._id) return;
    this.apiService.getNew('cashregistry', `/api/v1/points-settings?iBusinessId=${this.iBusinessId}`).subscribe((result:any) => {
      this.oSavingPointSettings = result;
    });
  }

  async fetchTaxes() {
    if(this.taxes?.length) return;
    let taxDetails: any = await this.taxService.getLocationTax({ iLocationId: this.iLocationId });
    if (taxDetails) {
      this.taxes = taxDetails?.aRates || [];
    } else {
      setTimeout(async () => {
        taxDetails = await this.taxService.getLocationTax({ iLocationId: this.iLocationId });
        this.taxes = taxDetails?.aRates || [];
      }, 1000);
    }
  }

  selectCurrency(oLocation: any) {
    if (oLocation?.eCurrency) {
      switch (oLocation?.eCurrency) {
        case 'pound':
          this.currency = "£";
          break;
        case 'swiss':
          this.currency = "₣";
          break;
        case 'euro':
          this.currency = "€";
          break;
      }
    }
  }


  getUsedPayMethods(total: boolean, payMethods: any): any {
    // console.log(45, 'getUsedPayMethods', payMethods)
    if (!payMethods) {
      return 0
    }
    if (total) {
      return _.sumBy(payMethods, 'amount') || 0;
    }
    return payMethods.filter((p: any) => p.amount !== 0 || p.nExpectedAmount !== 0) || 0
  }

  getTotals(type: string, transactionItems: any): number {
    if (!type) {
      return 0
    }
    let result = 0
    switch (type) {
      case 'price':
        transactionItems.forEach((i: any) => {
          if (!i.isExclude) {
            if (i.tType === 'refund') {
              result -= i.prePaidAmount;
            } else {
              let _nDiscount = 0;
              if(i.nDiscount > 0) {
                _nDiscount = (i.bDiscountOnPercentage) ? i.price * (i.nDiscount / 100) : i.nDiscount;
              }
              // if (i.nDiscount > 0 && !i.bDiscountOnPercentage) _nDiscount =
              // else if (i.nDiscount > 0 && i.bDiscountOnPercentage) _nDiscount =


              // console.log(46, i)
              result += i.quantity * (i.price - _nDiscount) - (i.prePaidAmount || 0);
              // console.log(48, result);
              // result += type === 'price' ? i.quantity * i.price - i.prePaidAmount || 0 : i[type]
            }
          } else {
            i.paymentAmount = 0;
          }
        });
        break;
      case 'quantity':
        result = _.sumBy(transactionItems, 'quantity') || 0
        break;
      case 'discount':
        result = _.sumBy(transactionItems, 'nDiscount') || 0
        break;
      default:
        result = 0;
        break;
    }
    return result
  }

  getValueFromLocalStorage(key: string): any {
    if (key === 'currentUser') {
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

  createTransactionBody(transactionItems: any, payMethods: any, discountArticleGroup: any, redeemedLoyaltyPoints: number, customer: any): any {
    const bTesting = false;
    // console.log('createTransactionBody transactionItems: ', transactionItems);
    this.updateVariables();

    const iLocationId = transactionItems?.length && transactionItems[0].iLocationId ? transactionItems[0].iLocationId : this.iLocationId; /* If we changed the location from the drop-down then it would change */
    // const transaction = new Transaction()
    // transaction.iBusinessId =  this.iBusinessId;
    // transaction.iLocationId = iLocationId,
    // transaction.iWorkstationId = this.iWorkstationId
    // transaction.eType = 'cash-register-revenue'
    // transaction.eStatus = 'y'
    // transaction.iEmployeeId = this.getValueFromLocalStorage('currentUser').userId,
    // transaction.sDayClosureMethod = this.settings?.sDayClosureMethod || 'workstation'

    const body:any = {
      iBusinessId: this.iBusinessId,
      iLocationId,
      iWorkstationId: this.iWorkstationId,
      // transactionItems,
      oTransaction: {
        iBusinessId: this.iBusinessId,
        iLocationId,
        iWorkstationId: this.iWorkstationId,
        eType: 'cash-register-revenue',
        eStatus: 'y',
        iEmployeeId: this.getValueFromLocalStorage('currentUser').userId,
        sDayClosureMethod: this.settings?.sDayClosureMethod || 'workstation'
      },
      payments: payMethods,
      redeemedLoyaltyPoints,
      sDayClosureMethod: this.settings?.sDayClosureMethod || 'workstation',
    };

    body.payments.forEach((payment: any) => payment.amount = parseFloat(payment.amount.toFixed(2)))

    if (customer?._id) {
      body.oTransaction.iCustomerId = customer._id;
      body.oTransaction.oCustomer = {
        _id: customer._id,
        sSalutation: customer?.sSalutation,
        sFirstName: customer.sFirstName,
        sLastName: customer.sLastName,
        sPrefix: customer.sPrefix,
        oInvoiceAddress: customer.oInvoiceAddress,
        oShippingAddress: customer?.oShippingAddress,
        nClientId: customer.nClientId,
        sGender: customer.sGender,
        bCounter: customer.bCounter,
        oPhone: customer.oPhone,
        sVatNumber: customer.sVatNumber,
        sCompanyName: customer.sCompanyName,
        sCocNumber: customer.sCocNumber,
        bIsCompany:customer?.bIsCompany,
        sEmail: customer.sEmail,
        oContactPerson: customer?.oContactPerson
      }
    };
    body.transactionItems = transactionItems.map((i: any) => {
      // console.log(i)
      const bRefund = i.oType?.bRefund || i.nDiscount.quantity < 0 || i.price < 0;
      const bPrepayment = (bRefund && i.oType?.bPrepayment) || (i.paymentAmount !== i.amountToBePaid)

      i.price = +(Number(String(i.price).replace(',', '.')).toFixed(2));
      i.nPurchasePrice = +(i.nPurchasePrice?.toFixed(2) || 0);
      if (bTesting) console.log('before creating item', JSON.parse(JSON.stringify(i)));

      const oItem: any = {
        sProductName: i.name,
        sComment: i.comment,
        sProductNumber: i.sProductNumber,
        nPriceIncVat: (i.type === 'gold-purchase') ? - (i.price) : i.price,
        nPurchasePrice: i.nPurchasePrice,
        nProfit: i.price - i.nPurchasePrice,
        nVatRate: i.tax,
        nQuantity: i.quantity,
        iProductId: i._id,
        sEan: i.ean,
        sArticleNumber: i.sArticleNumber,
        aImage: i.aImage,
        nMargin: i.nMargin,
        iBusinessPartnerId: i.iBusinessPartnerId,
        sBusinessPartnerName: i.sBusinessPartnerName,
        iBusinessId: this.iBusinessId,
        iArticleGroupId: i.iArticleGroupId,
        iArticleGroupOriginalId: i.iArticleGroupOriginalId || i.iArticleGroupId,
        oArticleGroupMetaData: i?.oArticleGroupMetaData,
        bPayLater: i?.isExclude,
        bDeposit: false,
        sProductCategory: 'CATEGORY',
        sGiftCardNumber: i?.sGiftCardNumber,
        nEstimatedTotal: +(i?.nTotal?.toFixed(2)) || 0,
        nPaidLaterAmount: 0,
        bDiscount: i.nDiscount.value > 0,
        bDiscountPercent: i.nDiscount.percent,
        nDiscountValue: i.nDiscount.value,
        nRefundAmount: +((i?.nRefundAmount || 0).toFixed(2)),
        dEstimatedDate: i.dEstimatedDate,
        iBusinessBrandId: i.iBusinessBrandId,
        iBusinessProductId: i.iBusinessProductId,
        oBusinessProductMetaData: i.oBusinessProductMetaData,
        eStatus: 'y',
        iWorkstationId: this.iWorkstationId,
        iEmployeeId: i.iEmployeeId || this.getValueFromLocalStorage('currentUser').userId,
        iAssigneeId: i.iAssigneeId,
        iLastTransactionItemId: i.iLastTransactionItemId,
        iLocationId: iLocationId,
        sBagNumber: i.sBagNumber,
        iSupplierId: i.iSupplierId, // repairer id
        oType: {
          eTransactionType: i.eTransactionType || 'cash-registry',
          bRefund,
          nStockCorrection: i.eTransactionItemType === 'regular' ? i.quantity : i.quantity - (i.nBrokenProduct || 0),
          eKind: i.type,
          bDiscount: i.nDiscount > 0,
          bPrepayment: bPrepayment
        },
        iActivityItemId: i.iActivityItemId,
        oGoldFor: i.oGoldFor,
        nDiscount: i.nDiscount,
        nGiftcardDiscount: i?.nGiftcardDiscount,
        nRedeemedLoyaltyPoints: i.nRedeemedLoyaltyPoints,
        sUniqueIdentifier: i.sUniqueIdentifier || uuidv4(),
        sDescription: i.description,
        sServicePartnerRemark: i.sServicePartnerRemark,
        sCommentVisibleServicePartner: i.sCommentVisibleServicePartner,
        sCommentVisibleColleagues: i.sCommentVisibleColleagues,
        eEstimatedDateAction: i.eEstimatedDateAction,
        eActivityItemStatus: i.eActivityItemStatus,
        bGiftcardTaxHandling: i.bGiftcardTaxHandling,
        bDiscountOnPercentage: i.bDiscountOnPercentage || false,
        nSavingsPoints: (this.oSavingPointSettings.bEnabled) ? i.nSavingsPoints : 0,
      }

      if (i.type === 'repair' || i.type === 'order') oItem.nActualCost = oItem.nPurchasePrice;
      /*Commented because need to create stock correction always.*/
      // if (i.bHasStock && (i.oCurrentLocation?.nStock == 0 || !i.oCurrentLocation?.nStock) ) oItem.oType.nStockCorrection = 0; 
     
      /* COMMENTED BELOW LINE BECAUSE IT IS CALCULATING INCORRECT PAYMENT AMOUNT WHEN DOING SPLIT PAYMENT WITH TERMINALS */
      // const nTotal = +(i.price.toFixed(2) * i.quantity);
      // oItem.nPaymentAmount = ((nTotal - i.paymentAmount) > 0.05) ? +(i.paymentAmount.toFixed(2)) : nTotal;
      
      oItem.nPaymentAmount = +(i.paymentAmount.toFixed(2));
      oItem.nRevenueAmount = +((oItem.nPaymentAmount / i.quantity));
      // console.log(nTotal, oItem.nPaymentAmount, oItem.nRevenueAmount, i.quantity, i.price);
      if (i.type === 'giftcard') {
        oItem.eActivityItemStatus = 'delivered';
        oItem.nGiftcardRemainingAmount = oItem.nPriceIncVat;
      } else if (i.type === 'repair') {
        oItem.eActivityItemStatus = ((i.amountToBePaid === 0 && i.paymentAmount === 0 && !i?.isExclude) || i.amountToBePaid === i.paymentAmount && !i?.isExclude) ? 'delivered' : i.eActivityItemStatus;
      }

      if (i?.sSerialNumber) oItem.sSerialNumber = i.sSerialNumber;

      return oItem;
    });
    const aToBeAddedItems: any = []
    
    body.transactionItems.forEach((i: any) => {
      let _nDiscount = +((i?.bDiscountOnPercentage ? (i.nPriceIncVat * i.nDiscount / 100) : i.nDiscount)); //.toFixed(2)
      if (bTesting) console.log({ _nDiscount }, JSON.parse(JSON.stringify(i)));
      if (i.oType.bRefund && _nDiscount !== 0) i.nDiscount = 0;

      if (_nDiscount && _nDiscount > 0 && !i.iActivityItemId) {
        if (bTesting) console.log('IN ELSE: ', i, _nDiscount, i.nQuantity);
        i.nPaymentAmount += (_nDiscount * i.nQuantity);
        i.nRevenueAmount += _nDiscount;

        if (bTesting) console.log(327, { nPaymentAmount: i.nPaymentAmount, nRevenueAmount: i.nRevenueAmount })

        const tItem1 = JSON.parse(JSON.stringify(i));
        tItem1.iArticleGroupId = discountArticleGroup._id;
        tItem1.iArticleGroupOriginalId = i.iArticleGroupId;
        tItem1.oArticleGroupMetaData.sCategory = discountArticleGroup.sCategory;
        tItem1.oArticleGroupMetaData.sSubCategory = discountArticleGroup.sSubCategory;
        tItem1.oType.eTransactionType = 'cash-registry';
        tItem1.oType.eKind = 'discount';
        tItem1.nPaymentAmount = -1 * _nDiscount * i.nQuantity;
        tItem1.nRevenueAmount = -1 * _nDiscount;
        tItem1.nPriceIncVat = tItem1.nPaymentAmount;
        tItem1.nPurchasePrice = tItem1.nPriceIncVat * i.nPurchasePrice / i.nPriceIncVat;
        aToBeAddedItems.push(tItem1);
      }
      // console.log(324, i.nPaymentAmount)
      i.nPaymentAmount += i?.nGiftcardDiscount || 0;
      i.nRevenueAmount += i?.nGiftcardDiscount || 0;

      if (bTesting) console.log(328, { nPaymentAmount: i.nPaymentAmount, nRevenueAmount: i.nRevenueAmount })
    });

    if (redeemedLoyaltyPoints > 0) {
      const reedemedTItem = body.transactionItems.find((o: any) => o.oType.eTransactionType === "loyalty-points");
      body.transactionItems.forEach((i: any) => {
        if (i.oType.eKind !== 'loyalty-points') {
          let nDiscount = i?.nRedeemedLoyaltyPoints || 0;
          if (bTesting) console.log(369, {nDiscount});
          i.nPaymentAmount += nDiscount;
          i.nRevenueAmount += (nDiscount / i.nQuantity);

          if (bTesting) console.log(362, { nPaymentAmount: i.nPaymentAmount, nRevenueAmount: i.nRevenueAmount })

          const tItem1 = JSON.parse(JSON.stringify(i));
          tItem1.iArticleGroupId = reedemedTItem.iArticleGroupId;
          tItem1.oArticleGroupMetaData.sCategory = discountArticleGroup.sCategory;
          tItem1.oArticleGroupMetaData.sSubCategory = discountArticleGroup.sSubCategory;
          tItem1.oType.eTransactionType = 'cash-registry';
          tItem1.oType.eKind = 'loyalty-points-discount';
          tItem1.nPaymentAmount = -1 * nDiscount;
          tItem1.nRevenueAmount = +((-1 * nDiscount/i.nQuantity).toFixed(2));
          tItem1.nRedeemedLoyaltyPoints = nDiscount / i.nQuantity;
          aToBeAddedItems.push(tItem1);
        }
      });
    }
    body.transactionItems = [...body.transactionItems, ...aToBeAddedItems];
    
    body.transactionItems.forEach((i: any) => {
      if(this.aDiscountTypes.includes(i.oType.eKind)) i.nSavingsPoints = 0;
      i.nPaymentAmount = +(i.nPaymentAmount.toFixed(2));
      i.nRevenueAmount = +(i.nRevenueAmount.toFixed(2));
    });
    if (bTesting) console.log('finaly body: ', body);
    return body;
  }

  createGiftcardTransactionItem(body: any, discountArticleGroup: any) {
    const originalTItems = body.transactionItems.filter((i: any) => !this.aDiscountTypes.includes(i.oType.eKind));
    const gCard = body.giftCards[0];//.find((payment: any) => payment.sName === 'Giftcards' && payment.type === 'custom');
    let nDiscount = 0;
    if (gCard?.nAmount) nDiscount = (Math.round((gCard?.nAmount || 0) / (originalTItems?.length || 1))) || 0;
    originalTItems.map((item: any) => {
      // if (gCard) {
      //   if (nDiscount > gCard.amount) {
      //     nDiscount = gCard.amount;
      //     gCard.amount = 0;
      //   } else {
      //     gCard.amount = gCard.amount - nDiscount;
      //   }
      // }
      const tItem1 = JSON.parse(JSON.stringify(item));
      tItem1.iArticleGroupId = discountArticleGroup._id;
      tItem1.oArticleGroupMetaData.sCategory = discountArticleGroup.sCategory;
      tItem1.oArticleGroupMetaData.sSubCategory = discountArticleGroup.sSubCategory;
      tItem1.oType.eTransactionType = 'cash-registry';
      tItem1.oType.eKind = 'giftcard-discount';
      tItem1.sProductName = 'Giftcard redeemed';
      tItem1.sDescription = '';
      tItem1.nPaymentAmount = -1 * item.nGiftcardDiscount;
      tItem1.nRevenueAmount = -1 * item.nGiftcardDiscount;
      tItem1.nPriceIncVat = -1 * item.nGiftcardDiscount;
      tItem1.nPurchasePrice = -1 * item.nGiftcardDiscount;
      tItem1.nDiscount = 0;
      body.transactionItems.push(tItem1);
    });
    // console.log(329, body);
  }

  createExpenseTransactionItem(oData:any) {
    const { oArticleGroup, oPaymentMethod, oExpenseType, sDescription, nAmount, nTax }:any = oData;

    const oArticleGroupMetaData = {
      aProperty: oArticleGroup?.aProperty,
      sCategory: oArticleGroup?.sCategory,
      sSubCategory: oArticleGroup?.sSubCategory,
      oName: oArticleGroup?.oName
    }
    const oPayment = {
      iPaymentMethodId: oPaymentMethod._id,
      sMethod: oPaymentMethod.sName.toLowerCase(),
      nAmount: (oExpenseType?.type === 'negative') ? -(nAmount) : nAmount,
      sComment: sDescription
    };
    const oItem: any = {
      sProductName: oExpenseType?.title,
      sComment: sDescription,
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      oArticleGroupMetaData,
      iEmployeeId: this.getValueFromLocalStorage('currentUser').userId,
      nVatRate: nTax,
      oType: {
        eTransactionType: 'expenses',
        bRefund: false,
        eKind: 'expenses',
        bDiscount: false,
      },
      oPayment,
      sDayClosureMethod: this.settings?.sDayClosureMethod || 'workstation',
    };
    oItem.iArticleGroupId = oItem.iArticleGroupOriginalId = oArticleGroup?._id,
    oItem.nPriceIncVat = oItem.nPurchasePrice = oItem.nTotal = oItem.nPaymentAmount = oItem.nRevenueAmount = nAmount;

    if (oExpenseType?.type === 'negative') {
      oItem.nTotal = -oItem.nTotal;
      oItem.nPaymentAmount = -oItem.nPaymentAmount;
      oItem.nRevenueAmount = -oItem.nRevenueAmount;
    }
    return oItem;
  }

  checkArticleGroups(): Observable<any> {
    let data = {
      skip: 0,
      limit: 1,
      searchValue: 'Ordered products',
      oFilterBy: {
      },
      iBusinessId: this.iBusinessId,
    };
    return this.apiService.postNew('core', '/api/v1/business/article-group/list', data).pipe(retry(1), catchError(this.processError));
  }

  processError(err: any) {
    let message = '';
    if (err.error instanceof ErrorEvent) {
      message = err.error.message;
    } else {
      message = `Error Code: ${err.status}\nMessage: ${err.message}`;
    }
    return throwError(() => {
      message;
    });
  }

  createProductMetadata(product: any) {
    const metadata = {
      iSupplierId: product.iBusinessPartnerId, // from business collection with type supplier (Optional)
      iBusinessPartnerId: product.iBusinessPartnerId,
      iBusinessBrandId: product.iBusinessBrandId || product.iBrandId,
      sLabelDescription: product.sLabelDescription,
      bBestseller: product.bBestseller,
      bHasStock: product.bHasStock,
      bShowSuggestion: product.bShowSuggestion,
      aProperty: product.aProperty,
      aImage: product.aImage, // "url;alt"
      oName: product.oName,
      oShortDescription: product.oShortDescription,
      eGender: product.eGender,
      eOwnerShip: product.eOwnerShip,
      sProductNumber: product.sProductNumber,
    }
    return metadata
  }

  processTransactionSearchResult(result: any) {
    // console.log('processTransactionSearchResult', JSON.parse(JSON.stringify(result)));
    const transactionItems: any = [];
    if (result.transaction) {
      result.transactionItems.forEach((item: any) => {
        if (item.isSelected) {
          const { tType } = item;
          // const nTotalDiscount = (item?.nRedeemedLoyaltyPoints || 0) - (item?.nGiftcardDiscount || 0);

          let paymentAmount = (item.nQuantity * item.nPriceIncVat) - item.nPaymentAmount;

            // - nTotalDiscount;
          // console.log(436, {paymentAmount})
          if (tType === 'refund') {
            // paymentAmount = -1 * item.nPaidAmount;
            paymentAmount = 0;
            // console.log(404, 'paymentAmount', paymentAmount)
            item.oType.bRefund = true;
            item.bShowGiftcardDiscountField = false;
            item.bShowLoyaltyPointsDiscountField = false;
          } else if (tType === 'revert') {
            paymentAmount = item.nPaidAmount;
            // console.log(408, 'paymentAmount', paymentAmount)
            item.oType.bRefund = false;
          } else {
            item.bShowGiftcardDiscountField = item.nRedeemedGiftcardAmount > 0;
            item.bShowLoyaltyPointsDiscountField = item.nRedeemedLoyaltyPoints > 0;
          }
          transactionItems.push({
            name: item.sProductName || item.sProductNumber,
            iActivityItemId: item.iActivityItemId,
            nRefundAmount: item.nPaidAmount,
            nRevenueAmount: item.nRevenueAmount,
            iLastTransactionItemId: item.iTransactionItemId,
            prePaidAmount: tType === 'refund' ? item.nPaidAmount : item.nPaymentAmount,
            type: item.sGiftCardNumber ? 'giftcard' : item.oType.eKind,
            eTransactionItemType: 'regular',
            nBrokenProduct: 0,
            tType,
            oType: item.oType,
            sUniqueIdentifier: item.sUniqueIdentifier,
            aImage: item.aImage,
            nonEditable: item.sGiftCardNumber ? true : false,
            sGiftCardNumber: item.sGiftCardNumber,
            quantity: item.nQuantity,
            iBusinessProductId: item.iBusinessProductId,
            price: (item.nPriceIncVat), //- nTotalDiscount
            iRepairerId: item.iRepairerId,
            oArticleGroupMetaData: item.oArticleGroupMetaData,
            nRedeemedLoyaltyPoints: item.nRedeemedLoyaltyPoints,
            iArticleGroupId: item.iArticleGroupId,
            iEmployeeId: item.iEmployeeId,
            iBusinessBrandId: item.iBusinessBrandId,
            nDiscount: item?.nDiscount || 0,
            // nDiscount: (item?.new) ? (item.nDiscount || 0) : 0,
            tax: item.nVatRate,
            oGoldFor: item.oGoldFor,
            iSupplierId: item.iSupplierId,
            paymentAmount,
            description: item.sDescription,
            open: false,
            nMargin: item.nMargin,
            nPurchasePrice: item.nPurchasePrice,
            oBusinessProductMetaData: item.oBusinessProductMetaData,
            sServicePartnerRemark: item.sServicePartnerRemark,
            sCommentVisibleServicePartner:item.sCommentVisibleServicePartner,
            eActivityItemStatus: item.eActivityItemStatus,
            eEstimatedDateAction: item.eEstimatedDateAction,
            bGiftcardTaxHandling: item.bGiftcardTaxHandling,
            sArticleNumber: item?.sArticleNumber,
            iLocationId: item?.iLocationId,
            sBagNumber: item?.sBagNumber,
            bShowGiftcardDiscountField: item?.bShowGiftcardDiscountField,
            bShowLoyaltyPointsDiscountField:  item?.bShowLoyaltyPointsDiscountField,
            bDiscountOnPercentage: item?.bDiscountOnPercentage || false
          });
        }
      });
      result.transactionItems = transactionItems;
      return result;
    }
  }

  async processTransactionForPdfReceipt(transaction: any) {
    const bTesting = false;
    if(bTesting) console.log('processTransactionForPdfReceipt original', JSON.parse(JSON.stringify(transaction)));
    const relatedItemsPromises: any = [];
    let language: any = localStorage.getItem('language')
    let dataObject = JSON.parse(JSON.stringify(transaction));

    this.processBusinessDetails(dataObject.businessDetails, 'pdf');

    if (dataObject?.oFiskalyData?.sQRCodeData) dataObject.sQRCodeData = (dataObject?.oFiskalyData?.sQRCodeData);

    dataObject.oCustomer = this.processCustomerDetails(dataObject.oCustomer);

    const aDiscountRecords = transaction.aTransactionItems.filter((item: any) => this.aDiscountTypes.includes(item.oType?.eKind));
    dataObject.aTransactionItems = transaction.aTransactionItems.filter((item: any) => ![...this.aDiscountTypes, 'loyalty-points'].includes(item.oType?.eKind));
    if (bTesting) console.log({ aDiscountRecords: aDiscountRecords, aTransactionItems: dataObject.aTransactionItems })
    let total = 0,
      totalAfterDisc = 0,
      totalVat = 0,
      totalDiscount = 0,
      totalSavingPoints = 0,
      totalRedeemedLoyaltyPoints = 0,
      totalGiftcardDiscount = 0,
      nTotalQty = 0;
    const aToFetchPayments:any = [];

    dataObject.aTransactionItems.forEach((item: any, index: number) => {
      if(item.oType.eKind == 'empty-line') return;
      nTotalQty += item?.nQuantity;
      if (item?.aPayments?.some((payment: any) => payment.sMethod === 'card')) {
        aToFetchPayments.push(item.iTransactionId);
      }

      if (item.oType.eKind === 'giftcard') item.sDescription = this.translateService.instant('VOUCHER_SALE');

      item.bRegular = !item.oType.bRefund;

      if (item?.oArticleGroupMetaData?.oName && Object.keys(item?.oArticleGroupMetaData?.oName)?.length) {
        item.sArticleGroupName = (item?.oArticleGroupMetaData?.oName[language] || item?.oArticleGroupMetaData?.oName['en'] || item?.oArticleGroupMetaData?.oName['nl'] || '') + ' ';
      }
      // if (item?.oBusinessProductMetaData?.sLabelDescription){
      //   item.description = item.description + item?.oBusinessProductMetaData?.sLabelDescription + ' ' + item?.sProductNumber;
      // }
      let nDiscountSavingsPoints = 0;

      if(aDiscountRecords?.length) {
        const aDiscounts = aDiscountRecords.filter((s:any) => s.sUniqueIdentifier === item.sUniqueIdentifier);
        if(aDiscounts.length) {
          nDiscountSavingsPoints = _.sumBy(aDiscounts, 'nSavingsPoints');
        }
      }
      item.nSavingsPoints += nDiscountSavingsPoints;
      totalSavingPoints += (item?.nSavingsPoints || 0);
      item.nRedeemedPointsPerQty = +((item?.nRedeemedLoyaltyPoints / item.nQuantity).toFixed(2));
      totalRedeemedLoyaltyPoints += item?.nRedeemedLoyaltyPoints || 0;

      this.calculateDiscount(item);

      if(bTesting) console.log({
        nDiscountToShow: item.nDiscountToShow,
        nPriceIncVat: item.nPriceIncVat,
        nQuantity:item.nQuantity,
        nRedeemedLoyaltyPoints: item.nRedeemedLoyaltyPoints,
        nGiftcardDiscount: item.nGiftcardDiscount});

      item.nTotalPriceIncVat = item.nPriceIncVat * item.nQuantity;
      item.nTotalDiscountPerItem = item.nDiscountToShow * item.nQuantity;

      item.nPriceIncVatAfterDiscount = +(((item.nTotalPriceIncVat - item.nTotalDiscountPerItem) / item.nQuantity)) - (item?.nRedeemedLoyaltyPoints || 0) - (item?.nGiftcardDiscount || 0);
      item.nPriceIncVatAfterDiscount = +(item.nPriceIncVatAfterDiscount.toFixed(2));
      if (bTesting) console.log({
        nPriceIncVatAfterDiscount: item.nPriceIncVatAfterDiscount,
        nTotalPriceIncVat: item.nTotalPriceIncVat,
        nTotalDiscountPerItem: item.nTotalDiscountPerItem});

      if (item.oType.bRefund && item.oType.eKind != 'gold-purchase') item.nPriceIncVatAfterDiscount = -(item.nPriceIncVatAfterDiscount)
      // console.log('item.nPriceIncVatAfterDiscount', item.nPriceIncVatAfterDiscount)
      // item.nRevenueAmount = (+(item.nRevenueAmount.toFixed(2)) - item.nDiscount) * item.nQuantity;
      if (bTesting) console.log(648, { nRevenueAmount: item.nRevenueAmount, nTotalDiscountPerItem: item.nTotalDiscountPerItem });

      item.totalPaymentAmount = +(((item.nRevenueAmount * item.nQuantity) - item.nTotalDiscountPerItem - (item?.nRedeemedLoyaltyPoints || 0) - (item?.nGiftcardDiscount || 0)).toFixed(2));
      total += item.totalPaymentAmount;

      if (bTesting) console.log('item.totalPaymentAmount', item.totalPaymentAmount)
      item.bPrepayment = item?.oType?.bPrepayment || false;
      
      this.calculateVat(item);
      totalVat += (item.vat * item.nQuantity);

      if (item.oType.bRefund) {
        totalAfterDisc += item.totalPaymentAmount;
        item.nTotalDiscountPerItem = 0;
      } else {
        totalAfterDisc += (item.nPriceIncVatAfterDiscount * item.nQuantity);
      }
      totalDiscount += item.nTotalDiscountPerItem;
      totalGiftcardDiscount += item?.nGiftcardDiscount || 0;

      if(!item?.bMigrate) relatedItemsPromises[index] = this.getRelatedTransactionItem(item?.iActivityItemId, item?._id, index);
    })
    if (bTesting) console.log({ total, totalAfterDisc, totalDiscount })
    await Promise.all(relatedItemsPromises).then(result => {
      // console.log(result);
      result.forEach((item: any, index: number) => {
        transaction.aTransactionItems[index].related = item?.data || [];
      })
    });

    transaction.aTransactionItems.filter((el: any) => !['loyalty-points', 'discount', 'loyalty-points-discount','giftcard-discount'].includes(el.oType.eKind)).forEach((item: any) => {
      item.bShowGiftcardDiscountField = false;
      item.bShowLoyaltyPointsDiscountField = false;

      if (!item?.oType?.bRefund) {
        if (item?.nGiftcardDiscount && totalGiftcardDiscount > 0) item.bShowGiftcardDiscountField = true;
        if (item?.nRedeemedLoyaltyPoints && totalRedeemedLoyaltyPoints > 0) item.bShowLoyaltyPointsDiscountField = true;
      }
      let description = '';
      let sRelatedDescription = '';
      item.eKind = item.oType.eKind;
      if (item?.related?.length) {
        // console.log({item})
        if ((item.nPriceIncVatAfterDiscount !== item.nRevenueAmount) || item.oType.bRefund) {
          sRelatedDescription += `${this.translateService.instant('ALREADY_PAID')}: \n${item.sTransactionNumber} | ${item.totalPaymentAmount} (${this.translateService.instant('THIS_RECEIPT')})\n`;
        }

        item.related.forEach((relatedItem: any) => {

          if(relatedItem?.aPayments?.some((payment: any) => payment.sMethod === 'card')){
            aToFetchPayments.push(relatedItem.iTransactionId);
          }
          // relatedItem.aPayments = relatedItem?.aPayments.filter((payment: any) => payment?.sRemarks !== 'CHANGE_MONEY');
          // if (relatedItem.nPriceIncVat > item.nPriceIncVat) item.nPriceIncVat = relatedItem.nPriceIncVat;
          // item.nDiscount = relatedItem.nDiscount || 0;
          // item.bDiscountOnPercentage = relatedItem?.bDiscountOnPercentage || false;

          if(relatedItem.oType?.bRefund) {
            if (relatedItem?.bDiscountOnPercentage) {
              relatedItem.totalPaymentAmount = +(relatedItem.nRevenueAmount.toFixed(2)) - this.getPercentOf(relatedItem.nPriceIncVat, relatedItem.nDiscount);
            } else {
              relatedItem.totalPaymentAmount = (relatedItem.nRevenueAmount > 0) ? (+(relatedItem.nRevenueAmount.toFixed(2)) - relatedItem.nDiscount) * relatedItem.nQuantity : 0;
            }
          } else {
            if (relatedItem?.bDiscountOnPercentage) {
              item.nDiscountToShow = (item.oType.bRefund === true) ? 0 : this.getPercentOf(relatedItem.nPriceIncVat, relatedItem.nDiscount);
              item.nTotalPriceIncVat += (item.nDiscountToShow) + (relatedItem?.nRedeemedLoyaltyPoints || 0) + (relatedItem?.nGiftcardDiscount || 0);
              item.bDiscountOnPercentage = true;
              item.nDiscount = relatedItem.nDiscount;
              totalDiscount += (item.oType.bRefund === true) ? 0 : item.nDiscountToShow;
              relatedItem.totalPaymentAmount = (+(relatedItem.nRevenueAmount.toFixed(2)) - this.getPercentOf(relatedItem.nPriceIncVat, relatedItem.nDiscount)) * relatedItem.nQuantity;
            } else {
              if(relatedItem.oType.bPrepayment) {
                item.nDiscountToShow = relatedItem.nDiscount;
                item.nTotalPriceIncVat += item.nDiscountToShow + (relatedItem?.nRedeemedLoyaltyPoints || 0) + (relatedItem?.nGiftcardDiscount || 0);
                totalDiscount += relatedItem.nDiscountToShow;
              }
              relatedItem.totalPaymentAmount = (relatedItem.nRevenueAmount > 0) ? (+(relatedItem.nRevenueAmount.toFixed(2)) - relatedItem.nDiscount) * relatedItem.nQuantity : 0;
            }
            relatedItem.totalPaymentAmount -= ((relatedItem?.nRedeemedLoyaltyPoints || 0) + (relatedItem?.nGiftcardDiscount || 0));
          }
          item.nDiscountToShow = +(item.nDiscountToShow.toFixed(2));
          relatedItem.totalPaymentAmount = +(relatedItem.totalPaymentAmount.toFixed(2));
          if (relatedItem.totalPaymentAmount > 0) {
            sRelatedDescription += `${relatedItem.sTransactionNumber} | ${relatedItem.totalPaymentAmount}\n`;
          }
        })
      }
      description = item.bPrepayment ? `${this.translateService.instant('ORIGINAL_AMOUNT_INC_DISC')}: ${item.nPriceIncVatAfterDiscount}\n` : '';
      if(item.nPriceIncVatAfterDiscount == item.totalPaymentAmount) description = '';

      item.description = description + sRelatedDescription;
      // console.log(item);
      item.nPriceIncVatAfterDiscount = +((item?.nPriceIncVatAfterDiscount || 0).toFixed(2));
    })
    if (aToFetchPayments?.length) {
      const oBody = {
        iBusinessId: this.iBusinessId,
        oFilterBy: {
          iTransactionId: [...aToFetchPayments]
        }
      }
      const _payments: any = await this.apiService.postNew('cashregistry', `/api/v1/payments/list`, oBody).toPromise()
      if (_payments?.data?.length && _payments?.data[0]?.result?.length) {
        dataObject.aCardPayments = _payments?.data[0]?.result;
      }
    }

    dataObject.totalAfterDisc = +(totalAfterDisc.toFixed(2));
    dataObject.total = +(total.toFixed(2));
    dataObject.totalVat = +(totalVat.toFixed(2));
    dataObject.totalDiscount = +(totalDiscount.toFixed(2));
    dataObject.totalGiftcardDiscount = +(totalGiftcardDiscount.toFixed(2));
    dataObject.totalSavingPoints = totalSavingPoints;
    dataObject.totalRedeemedLoyaltyPoints = totalRedeemedLoyaltyPoints;
    dataObject.nTotalExcVat = +((dataObject.totalAfterDisc - dataObject.totalVat).toFixed(2));
    dataObject.nTotalQty = nTotalQty;
    // dataObject.dCreatedDate = moment(dataObject.dCreatedDate).format('DD-MM-yyyy hh:mm');
    let _relatedResult:any;

    if(!dataObject?.bMigrate){
      const [_relatedResultTemp]: any = await Promise.all([
        this.getRelatedTransaction(dataObject?.iActivityId, dataObject?._id).toPromise(),
      ])
      _relatedResult = _relatedResultTemp;
    }

    dataObject.bSavingPointsSettings = this.oSavingPointSettings?.bEnabled;
    dataObject.aTransactionItems.forEach((item: any) => item.bSavingPointsSettings = this.oSavingPointSettings?.bEnabled)
    dataObject.related = _relatedResult?.data || [];
    if(dataObject.related.length){
      dataObject.related.forEach((relatedobj: any) => {
        relatedobj.aPayments.forEach((obj: any) => {
          if (!obj?.sRemarks) obj.sRemarks = "";
          obj.bIgnore = true;
        });
        dataObject.aPayments = dataObject.aPayments.concat(relatedobj.aPayments);
      })
    }

    dataObject.nPaymentMethodTotal = 0;

    dataObject.aPayments.forEach((oPayment: any) => {
      oPayment.bIgnore = false;
      oPayment.nNewAmount = oPayment?.nAmount || 0;
      dataObject.nPaymentMethodTotal += oPayment.nAmount;
      if (!oPayment?.sRemarks) oPayment.sRemarks = "";
      else if (oPayment?.sRemarks === 'CHANGE_MONEY') oPayment.bIgnore = true;

      if (oPayment.sMethod == 'bankpayment') {
        oPayment.sMethod = (oPayment?.bConfirmed) ? this.translateService.instant('BANKPAYMENT_CONFIRMED') : this.translateService.instant('BANKPAYMENT_OUTSTANDING')
      } else oPayment.sMethod = this.translateService.instant(oPayment.sMethod.toUpperCase());
      // obj.dCreatedDate = moment(obj.dCreatedDate);//.format('DD-MM-yyyy hh:mm');
    });
    dataObject.nNewPaymentMethodTotal = dataObject.nPaymentMethodTotal;


    transaction = dataObject;
    transaction.bCompletedProcessing = true;
    // console.log('processTransactionForPdfReceipt after processing', transaction);
    return transaction;
  }

  calculateDiscount(item: any){    
    item.nDiscountToShow = +((item?.nDiscount || 0).toFixed(2));
    if (item?.nDiscount && item.bDiscountOnPercentage) {
      item.nDiscountToShow = +(this.getPercentOf(item.nPriceIncVat, item.nDiscount).toFixed(2));
    }
  }
  calculateVat(item:any) {
    const vat = (item.nVatRate * item.totalPaymentAmount / (100 + parseFloat(item.nVatRate)));
    item.vat = (item.nVatRate > 0) ? parseFloat(vat.toFixed(2)) : 0;
  }

  processCustomerDetails(customer:any) {
    return {
      ...customer,
      ...customer?.oPhone,
      ...customer?.oInvoiceAddress,
    };
  }

  getPercentOf(nNumber: any, nPercent: any) {
    return parseFloat(nNumber) * parseFloat(nPercent) / 100;
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

  async fetchSettings() {
    // if(this.settings) return this.settings;
    this.settings = await this.apiService.getNew('cashregistry', `/api/v1/settings/${this.iBusinessId}`).toPromise();
    const oBagNumberSettings = {
      iLocationId: this.iLocationId,
      bAutoIncrementBagNumbers: true,
      sPrefix: "",
      nLastBagNumber: 0,
    };

    const oPrefillSettings = {
      iLocationId: this.iLocationId,
      bArticleGroup: true,
      bProductNumber: true,
      bProductName: true,
      bLabelDescription: true
    }
    const oStatisticsSettings = {
      bIncludeRefunds:true,
      bIncludeDiscounts:true,
      bIncludeRepairs:true,
      bIncludeGiftcards:true,
      bIncludeGoldpurchase:true,
    }
    if (!this.settings) this.settings = { ...oBagNumberSettings, ...oPrefillSettings, ...oStatisticsSettings };
    let oMergedSettings: any = {};
    if (!this.settings?.aBagNumbers?.length) {
      oMergedSettings = { ...oBagNumberSettings };
    } else {
      oMergedSettings = { ...(this.settings.aBagNumbers.find((el: any) => el.iLocationId === this.iLocationId) || oBagNumberSettings) };
    }

    if (!this.settings?.aCashRegisterPrefill?.length) {
      oMergedSettings = { ...oMergedSettings, ...oPrefillSettings };
      this.settings.aCashRegisterPrefill = [{ ...oPrefillSettings }];
    } else {
      oMergedSettings = { ...oMergedSettings, ...(this.settings.aCashRegisterPrefill.find((el: any) => el.iLocationId === this.iLocationId) || oPrefillSettings) };
    }

    if(!this.settings?.oStatisticsSettings) this.settings.oStatisticsSettings = oStatisticsSettings;

    this.settings.currentLocation = oMergedSettings;
    return this.settings;
  }

  async updateSettings() {
    if (this.settings?.aBagNumbers?.length) {
    this.settings.aBagNumbers = [...this.settings?.aBagNumbers.filter((el: any) => el.iLocationId !== this.iLocationId), this.settings.currentLocation];
    }
    const body = {
      aBagNumbers: this.settings.aBagNumbers
    };

    this.apiService.putNew('cashregistry', `/api/v1/settings/update/bagNumbers/${this.iBusinessId}`, body).subscribe((result:any)=> {
      // console.log('settings result', result);
    });
  }

  updateVariables() {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
  }

  prepareDataForOrderReceipt(activity:any, activityItems:any, transaction:any) {
    // console.log('prepareDataForOrderReceipt',{activity, activityItems, transaction})
    const oDataSource = {
      ...activity,
      activityitems: activityItems.filter((el: any) => !['loyalty-points', ...this.aDiscountTypes].includes(el.oType.eKind)),
      aTransactionItems: transaction.aTransactionItems,
    }
    oDataSource.activityitems.forEach((item:any) => {
      let nDiscount = ((item?.bDiscountOnPercentage) ? this.getPercentOf(item.nPriceIncVat, item.nDiscount) : item.nDiscount) * item.nQuantity;
      nDiscount += item.nRedeemedLoyaltyPoints;
      item.nRevenueAmount -= nDiscount;
      item.nPaidAmount -= nDiscount;
      item.nPriceIncVat -= nDiscount

    });
    oDataSource.oCustomer = transaction.oCustomer
    oDataSource.businessDetails = transaction.businessDetails;
    oDataSource.sBusinessLogoUrl = transaction.sBusinessLogoUrl;
    oDataSource.sAdvisedEmpFirstName = transaction?.sAdvisedEmpFirstName || 'a';

    let nTotalPaidAmount = 0;
    oDataSource.activityitems.forEach((item: any) => {
      item.sActivityItemNumber = item.sNumber;
      item.sOrderDescription = item.sProductName + '\n' + item.sDescription;
      nTotalPaidAmount += item.nPaidAmount;
    });
    oDataSource.nTotalPaidAmount = nTotalPaidAmount;
    oDataSource.sActivityNumber = activity.sNumber;
    // console.log({oDataSource})
    return oDataSource;
  }

  prepareDataForRepairReceipt(oItem: any, transaction: any, employee:any) {
    const oDS = JSON.parse(JSON.stringify(oItem));
    oDS.oCustomer = transaction.oCustomer
    oDS.businessDetails = transaction.businessDetails;
    oDS.sAdvisedEmpFirstName = employee?.sFirstName || transaction?.sAdvisedEmpFirstName || 'a';
    const aParts = oDS.sNumber.split("-");
    oDS.sPartRepairNumber = aParts[aParts.length - 1];
    oDS.sBusinessLogoUrl = transaction.sBusinessLogoUrl;

    const sEDA = oDS.eEstimatedDateAction;

    if (sEDA === 'call_on_ready')
      oDS.eEstimatedDateAction = this.translateService.instant('CALL_ON_READY');
    else if (sEDA === 'email_on_ready')
      oDS.eEstimatedDateAction = this.translateService.instant('EMAIL_ON_READY');
    else
      oDS.eEstimatedDateAction = this.translateService.instant('WHATSAPP_ON_READY');

    return oDS;
  }

  prepareDataForGiftcardReceipt(oItem:any, transaction:any) {
    const oDS = {...oItem };
    oDS.businessDetails = transaction.businessDetails;
    oDS.nTotal = oDS.nGiftcardRemainingAmount;
    oDS.sReceiptNumber = transaction.sReceiptNumber;
    oDS.sBarcodeURI = this.generateBarcodeURI(true, 'G-' + oDS.sGiftCardNumber);
    return oDS;
  }

  processBusinessDetails(businessDetails: any, isFor: string = 'activity') {
    if (isFor == 'activity') {
      const oLocation = businessDetails.aLocation.find((l: any) => l._id === this.iLocationId);
      businessDetails.sBusinessAddress = (oLocation.oAddress?.street || '') + ' ' + (oLocation.oAddress?.houseNumber || '') + ' ' +
        (oLocation.oAddress?.postalCode || '') + ' ' + (oLocation.oAddress?.city || '');
    } else if (isFor == 'pdf') {
      businessDetails = {
        ...businessDetails,
        ...businessDetails?.oPhone
      }
      const oAddress = businessDetails?.currentLocation?.oAddress;
      businessDetails.sAddressline1 = (`${oAddress?.street || ''} ${oAddress?.houseNumber || ''} ${oAddress?.houseNumberSuffix || ''} ${oAddress?.postalCode || ''} ${oAddress?.city || ''}`).trim();
      businessDetails.sAddressline2 = oAddress?.country || '';
    }
    return businessDetails;
  }

  getNameWithPrefillingSettings(oProduct:any, lang:string) {
    let name = ''
    if (this.settings.currentLocation.bArticleGroup)
      name += (oProduct?.oArticleGroup?.oName) ? ((oProduct.oArticleGroup?.oName[lang]) ? oProduct.oArticleGroup?.oName[lang] : oProduct.oArticleGroup.oName['en']) : '';

    name += ' ' + (oProduct?.sLabelDescription || '');

    let bPrefillConditionViaBusinessBrand = true;
    if (oProduct.iBusinessBrandId && oProduct.oBusinessBrand?.sAlias) bPrefillConditionViaBusinessBrand = false;
    if (this.settings.currentLocation.bProductNumber && bPrefillConditionViaBusinessBrand) name += ' ' + (oProduct.sProductNumber || '');
    if (this.settings.currentLocation?.bProductName) name += ' ' + (oProduct.oName[lang] || '');

    return name;
  }

  getDescriptionWithGemDetails(oProduct:any) {
    let sDescription = '';
    if (this.settings.currentLocation.bDiamondDetails) {
      const aGemDetails = oProduct.aProperty.filter((details: any) => details?.sPropertyName?.startsWith('GEM_1'));
      const aFields = ['KIND', 'PURITY', 'COLOR', 'CUT', 'WEIGHT', 'QUANTITY'];
      aFields.forEach((sField: string) => {
        const oDetail = aGemDetails.find((el: any) => el.sPropertyName === 'GEM_1_' + sField);
        if (oDetail) {
          sDescription += (sField == 'QUANTITY') ? '(' + oDetail.sPropertyOptionName + ') ' : oDetail.sPropertyOptionName + ' ';
        }
      })
    }
    return sDescription;
  }

  generateBarcodeURI(displayValue: boolean = true, data: any) {
    var canvas = document.createElement("canvas");
    JsBarcode(canvas, data, { format: "CODE128", displayValue: displayValue });
    return canvas.toDataURL("image/png");
  }

  getName(oName:any, language:string = 'en', isFor:string = 'business-product') {
    if (isFor === 'business-product' && oName && Object.keys(oName)?.length) {
      return oName[language] || oName['en'] || this.translateService.instant('NO_NAME');
    }
  }

  getSum(aArray: any, key: string) {
    const nSum = _.sumBy(aArray, key) || 0;
    return +(nSum?.toFixed(2));
  }

  prepareExpenseBody(oArticleGroup: any, oCashPaymentMethod: any, oExpenseType:any, nAmount:number, nTax:number) {
    const oBody = {
      oArticleGroup,
      oPaymentMethod: oCashPaymentMethod,
      oExpenseType,
      nTax,
      sDescription: oExpenseType?.title,
      nAmount
    }
    return { oTransactionItem: this.createExpenseTransactionItem(oBody), ...oBody };
  }

  adjustEmptyLineItems(aTransactionItems:any, aOriginalTransactionItems:any) {
    if(aOriginalTransactionItems.some((el:any) => el.oType.eKind == 'empty-line')) {
      aOriginalTransactionItems.forEach((el:any, index:number) => {
        if (el.oType.eKind == 'empty-line') {
          // console.log('empty line adding at', index)
          aTransactionItems.splice(index, 0, el)
        }
      })
    }
    // console.log(aTransactionItems);
  }

  dataURItoBlob(dataURI: string) {
    // convert base64 to raw binary data held in a string
    const byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    const ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], { type: mimeString });
    return blob;
  }
}
