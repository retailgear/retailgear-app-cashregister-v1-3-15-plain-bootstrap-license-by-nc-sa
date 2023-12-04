import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { TransactionItem } from 'src/app/till/models/transaction-item.model';
import { Transaction } from 'src/app/till/models/transaction.model';
import { ApiService } from './api.service';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as _moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
const moment = (_moment as any).default ? (_moment as any).default : _moment;
@Injectable({
  providedIn: 'root'
})
export class TillService {

  currency: string = "€";

  iBusinessId = localStorage.getItem('currentBusiness');
  constructor(
    private apiService: ApiService,
    private translateService: TranslateService) { }

  selectCurrency(oLocation: any) {
    // console.log('oLocation? currency selection', oLocation?.eCurrency)
    if (oLocation?.eCurrency) {
      switch (oLocation?.eCurrency) {
        case 'euro':
          this.currency = "€";
          break;
        case 'pound':
          this.currency = "£";
          break;
        case 'swiss':
          this.currency = "₣";
          break;
        default:
          this.currency = "€";
          break;
      }
    }
    // console.log('this.currency succesfully selected', this.currency)
  }


  getUsedPayMethods(total: boolean, payMethods: any): any {
    console.log(45, 'getUsedPayMethods', payMethods)
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
    console.log('result: ', result);
    switch (type) {
      case 'price':
        transactionItems.forEach((i: any) => {
          if (!i.isExclude) {
            if (i.tType === 'refund') {
              result -= i.prePaidAmount;
            } else {
              let _nDiscount = 0;
              if (i.nDiscount > 0 && !i.bDiscountOnPercentage) _nDiscount = i.nDiscount
              else if (i.nDiscount > 0 && i.bDiscountOnPercentage) _nDiscount = i.price * (i.nDiscount / 100)


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
    const transaction = new Transaction(
      null,
      null,
      null,
      this.getValueFromLocalStorage('currentBusiness'),
      null,
      'cash-register-revenue',
      'y',
      this.getValueFromLocalStorage('currentWorkstation'),
      this.getValueFromLocalStorage('currentUser').userId,
      this.getValueFromLocalStorage('currentLocation'),
      null,
      null,
    )

    const body = {
      iBusinessId: this.getValueFromLocalStorage('currentBusiness'),
      iLocationId: this.getValueFromLocalStorage('currentLocation'),
      iWorkstationId: this.getValueFromLocalStorage('currentWorkstation'),
      transactionItems: transactionItems,
      oTransaction: transaction,
      payments: this.getUsedPayMethods(false, payMethods),
      redeemedLoyaltyPoints,
    };

    body.payments.forEach((payment: any) => payment.amount = parseFloat(payment.amount.toFixed(2)))

    if (customer && customer._id) {
      body.oTransaction.iCustomerId = customer._id;
      body.oTransaction.oCustomer = {
        _id: customer._id,
        sFirstName: customer.sFirstName,
        sLastName: customer.sLastName,
        sPrefix: customer.sPrefix,
        oInvoiceAddress: customer.oInvoiceAddress,
        nClientId: customer.nClientId,
        sGender: customer.sGender,
        bCounter: customer.bCounter,
        oPhone: customer.oPhone,
        sVatNumber: customer.sVatNumber,
        sCocNumber: customer.sCocNumber,
        sEmail: customer.sEmail
      }
    };
    console.log('length 115: ', transactionItems?.length);
    body.transactionItems = transactionItems.map((i: any) => {
      console.log(i)
      console.log('i.nDiscount: ', i.nDiscount, i.price, i.oType, i.paymentAmount);
      const bRefund =
        i.oType?.bRefund /* Indication from the User */
        || i.nDiscount.quantity < 0 /* Minus Discount (e.g. -10 discount) [TODO: Remove the quantity as its not exist at all] */
        || i.price < 0; /* PriceIncVat is minus; Should we not add the nQuantity as a required the positive number here */
      const bPrepayment =
        (bRefund && i.oType?.bPrepayment) /* User indicates it is refund or negative amount */
        // || (i.paymentAmount > 0 /* Whenever the prepayment-field is filled */
        || (this.getUsedPayMethods(true, payMethods) - this.getTotals('price', transactionItems) < 0)
        || (i.paymentAmount !== i.amountToBePaid)

      console.log('i.paymentAmount: ', i.paymentAmount);
      console.log('i.bRefund: ', bRefund);
      console.log('UsedPaymentMethod: ', this.getUsedPayMethods(true, payMethods));//0.02
      console.log('getTotal: ', this.getTotals('price', transactionItems));//0.03
      console.log('Last condition: ', i.paymentAmount, i.amountToBePaid);
      console.log('bPrepayment: ', bPrepayment, bRefund && i.oType?.bPrepayment, (this.getUsedPayMethods(true, payMethods) - this.getTotals('price', transactionItems) < 0), (i.paymentAmount !== i.amountToBePaid));

      const oItem = new TransactionItem();
      oItem.sProductName = i.name;
      oItem.sComment = i.comment;
      oItem.sProductNumber = i.sProductNumber;
      oItem.nPriceIncVat = (i.type === 'gold-purchase') ? - (i.price) : i.price;
      oItem.nPurchasePrice = i.nPurchasePrice;
      oItem.nProfit = i.price - i.nPurchasePrice;
      oItem.nVatRate = i.tax;
      oItem.nQuantity = i.quantity;
      oItem.iProductId = i._id;
      oItem.sEan = i.ean;
      oItem.sArticleNumber = i.sArticleNumber;
      oItem.aImage = i.aImage;
      oItem.nMargin = i.nMargin;
      oItem.iBusinessPartnerId = i.iBusinessPartnerId;
      oItem.sBusinessPartnerName = i.sBusinessPartnerName;
      oItem.iBusinessId = this.getValueFromLocalStorage('currentBusiness');
      oItem.iArticleGroupId = i.iArticleGroupId;
      oItem.iArticleGroupOriginalId = i.iArticleGroupOriginalId || i.iArticleGroupId;
      oItem.oArticleGroupMetaData = i?.oArticleGroupMetaData;
      oItem.bPayLater = false;
      oItem.bDeposit = false;
      oItem.sProductCategory = 'CATEGORY';
      oItem.sGiftCardNumber = i?.sGiftCardNumber;
      oItem.sGiftCardNumber = i?.sGiftCardNumber;
      oItem.nEstimatedTotal = i?.nTotal;
      oItem.nPaymentAmount = i?.paymentAmount || 0;
      oItem.nPaidLaterAmount = 0;
      oItem.bDiscount = i.nDiscount.value > 0;
      oItem.bDiscountPercent = i.nDiscount.percent;
      oItem.nDiscountValue = i.nDiscount.value;
      oItem.nRefundAmount = i.nRefundAmount;
      oItem.dEstimatedDate = i.dEstimatedDate;
      oItem.iBusinessBrandId = i.iBusinessBrandId;
      oItem.iBusinessProductId = i.iBusinessProductId;
      oItem.oBusinessProductMetaData = i.oBusinessProductMetaData;
      oItem.eStatus = 'y';
      oItem.iWorkstationId = this.getValueFromLocalStorage('currentWorkstation');
      oItem.iEmployeeId = i.iEmployeeId || this.getValueFromLocalStorage('currentUser').userId;
      oItem.iAssigneeId = i.iAssigneeId;
      oItem.iLocationId = this.getValueFromLocalStorage('currentLocation');
      oItem.sBagNumber = i.sBagNumber;
      oItem.iSupplierId = i.iSupplierId; // repairer id
      // 50
      oItem.iLastTransactionItemId = i.iLastTransactionItemId;
      oItem.oType = {
        eTransactionType: i.eTransactionType || 'cash-registry', // TODO
        bRefund,
        nStockCorrection: i.eTransactionItemType === 'regular' ? i.quantity : i.quantity - (i.nBrokenProduct || 0),
        eKind: i.type, // TODO // repai
        bDiscount: i.nDiscount > 0,
        bPrepayment: bPrepayment
      };
      oItem.iActivityItemId = i.iActivityItemId;
      oItem.oGoldFor = i.oGoldFor;
      oItem.nDiscount = i.nDiscount;
      oItem.nRedeemedLoyaltyPoints = i.redeemedLoyaltyPoints;
      oItem.sUniqueIdentifier = i.sUniqueIdentifier || uuidv4();
      oItem.nRevenueAmount = i.paymentAmount / i.quantity;
      oItem.sDescription = i.description;

      oItem.sServicePartnerRemark = i.sServicePartnerRemark;
      oItem.eEstimatedDateAction = i.eEstimatedDateAction;
      oItem.eActivityItemStatus = i.eActivityItemStatus;
      oItem.bGiftcardTaxHandling = i.bGiftcardTaxHandling;
      oItem.bDiscountOnPercentage = i.bDiscountOnPercentage || false

      return oItem;
    });
    console.log('iPayment 201: ', JSON.parse(JSON.stringify(body?.transactionItems)));
    const originalTItemsLength = length = body.transactionItems.filter((i: any) => i.oType.eKind !== 'loyalty-points').length;
    body.transactionItems.map((i: any) => {
      let discountRecords: any = localStorage.getItem('discountRecords');
      if (discountRecords) {
        discountRecords = JSON.parse(discountRecords);
      }
      let _nDiscount = i?.bDiscountOnPercentage ? (i.nPriceIncVat * (i.nDiscount / 100)) : i.nDiscount;
      console.log('-------------------_nDiscount-----------------------------------: ', _nDiscount);
      if (i.oType.bRefund && _nDiscount !== 0) {
        console.log('IN IF CONDITION: ');
        i.nPaymentAmount -= _nDiscount * i.nQuantity;
        i.nRevenueAmount = i.nPaymentAmount;
        const records = discountRecords.filter((o: any) => o.sUniqueIdentifier === i.sUniqueIdentifier);
        records.forEach((record: any) => {
          console.log('IN IF CONDITION record: ', record);
          i.nPaymentAmount += record.nPaymentAmount;
          record.nPaymentAmount = -1 * record.nPaymentAmount;
          record.nRevenueAmount = -1 * record.nRevenueAmount;
          record.nPaidAmount = -1 * record.nPaidAmount;
          record.oType.bRefund = true;
          record.nRedeemedLoyaltyPoints = -1 * record.nRedeemedLoyaltyPoints;
          body.transactionItems.push(record);
          if (i.oType.eKind === 'loyalty-points-discount') {
            body.redeemedLoyaltyPoints += record.nRedeemedLoyaltyPoints;
          }
        });
      } else {
        if (_nDiscount && _nDiscount > 0 && !i.oType.bRefund && !i.iActivityItemId) {
          console.log('IN ELSE: ', i, _nDiscount, i.nQuantity);
          i.nPaymentAmount += _nDiscount * i.nQuantity;
          i.nRevenueAmount += _nDiscount;
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
          body.transactionItems.push(tItem1);
        }
      }
    });
    localStorage.removeItem('discountRecords');
    if (redeemedLoyaltyPoints && redeemedLoyaltyPoints > 0) {
      let nDiscount = Math.round(redeemedLoyaltyPoints / originalTItemsLength);
      const reedemedTItem = body.transactionItems.find((o: any) => o.oType.eTransactionType === "loyalty-points");
      body.transactionItems.map((i: any) => {
        if (i.oType.eKind !== 'discount' && i.oType.eKind !== 'loyalty-points' && nDiscount > 0) {
          if (nDiscount > redeemedLoyaltyPoints) {
            nDiscount = redeemedLoyaltyPoints;
            redeemedLoyaltyPoints = 0;
          } else {
            redeemedLoyaltyPoints = redeemedLoyaltyPoints - nDiscount;
          }
          const tItem1 = JSON.parse(JSON.stringify(i));
          tItem1.iArticleGroupId = reedemedTItem.iArticleGroupId;
          tItem1.oArticleGroupMetaData.sCategory = discountArticleGroup.sCategory;
          tItem1.oArticleGroupMetaData.sSubCategory = discountArticleGroup.sSubCategory;
          tItem1.oType.eTransactionType = 'cash-registry';
          tItem1.oType.eKind = 'loyalty-points-discount';
          tItem1.nPaymentAmount = -1 * nDiscount;
          tItem1.nRevenueAmount = -1 * nDiscount;
          tItem1.nRedeemedLoyaltyPoints = nDiscount;
          body.transactionItems.push(tItem1);
          i.nDiscount += nDiscount;
        }
      });
    }
    console.log('finaly body: ', body);
    return body;
  }

  createGiftcardTransactionItem(body: any, discountArticleGroup: any) {
    const originalTItems = length = body.transactionItems.filter((i: any) => i.oType.eKind !== 'loyalty-points-discount' && i.oType.eKind !== 'discount' && i.oType.eKind !== 'loyalty-points' && i.oType.eKind !== 'giftcard-discount');
    const gCard = body.payments.find((payment: any) => payment.sName === 'Giftcards' && payment.type === 'custom');
    let nDiscount = 0;
    if (gCard?.amount) nDiscount = (Math.round((gCard?.amount || 0) / (originalTItems?.length || 1))) || 0;
    originalTItems.map((item: any) => {
      if (gCard) {
        if (nDiscount > gCard.amount) {
          nDiscount = gCard.amount;
          gCard.amount = 0;
        } else {
          gCard.amount = gCard.amount - nDiscount;
        }
      }
      const tItem1 = JSON.parse(JSON.stringify(item));
      tItem1.iArticleGroupId = discountArticleGroup._id;
      tItem1.oArticleGroupMetaData.sCategory = discountArticleGroup.sCategory;
      tItem1.oArticleGroupMetaData.sSubCategory = discountArticleGroup.sSubCategory;
      tItem1.oType.eTransactionType = 'cash-registry';
      tItem1.oType.eKind = 'giftcard-discount';
      tItem1.sProductName = 'Giftcard redeemed';
      tItem1.sDescription = '';
      tItem1.nPaymentAmount = -1 * nDiscount;
      tItem1.nRevenueAmount = -1 * nDiscount;
      tItem1.nPriceIncVat = -1 * nDiscount;
      tItem1.nPurchasePrice = -1 * nDiscount;
      tItem1.nDiscount = 0;
      body.transactionItems.push(tItem1);
    });
    console.log(329, body);
  }

  checkArticleGroups(): Observable<any> {
    let data = {
      skip: 0,
      limit: 1,
      searchValue: 'Ordered products',
      oFilterBy: {
      },
      iBusinessId: localStorage.getItem('currentBusiness'),
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
    console.log(JSON.parse(JSON.stringify(result)));
    const transactionItems: any = [];
    if (result.transaction) {
      result.transactionItems.forEach((transactionItem: any) => {
        if (transactionItem.isSelected) {
          const { tType } = transactionItem;
          let paymentAmount = transactionItem.nQuantity * transactionItem.nPriceIncVat - transactionItem.nPaidAmount;
          // console.log(400, 'paymentAmount',paymentAmount)
          if (tType === 'refund') {
            // paymentAmount = -1 * transactionItem.nPaidAmount;
            paymentAmount = 0;
            // console.log(404, 'paymentAmount', paymentAmount)
            transactionItem.oType.bRefund = true;
          } else if (tType === 'revert') {
            paymentAmount = transactionItem.nPaidAmount;
            // console.log(408, 'paymentAmount', paymentAmount)
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
            iBusinessBrandId: transactionItem.iBusinessBrandId,
            nDiscount: 0, //transactionItem.nDiscount ||
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
      return result;
    }
  }

  async processTransactionForPdfReceipt(transaction: any) {
    // console.log('processTransactionForPdfReceipt original', transaction);
    const relatedItemsPromises: any = [];
    let language: any = localStorage.getItem('language')
    let dataObject = JSON.parse(JSON.stringify(transaction));

    dataObject.aPayments.forEach((obj: any) => {
      obj.dCreatedDate = moment(obj.dCreatedDate).format('DD-MM-yyyy hh:mm:ss');
    });

    const aLoyaltyPointsItems = transaction.aTransactionItems.filter((item: any) => item?.oType?.eKind == 'loyalty-points-discount');

    dataObject.aTransactionItems = [];
    transaction.aTransactionItems.map((item: any) => {
      if (item.oType?.eKind != 'discount' || item?.oType?.eKind != 'loyalty-points-discount') {
        item.nRedeemedLoyaltyPoints = 0;
        for (let i = 0; i < aLoyaltyPointsItems.length; i++) {
          if (aLoyaltyPointsItems[i].iBusinessProductId === item.iBusinessProductId) {
            item.nRedeemedLoyaltyPoints = aLoyaltyPointsItems[i].nRedeemedLoyaltyPoints;
            item.nDiscount = aLoyaltyPointsItems[i].nDiscount;
            break;
          }
        }
      }
    })

    dataObject.aTransactionItems = transaction.aTransactionItems.filter((item: any) =>
      !(item.oType?.eKind == 'discount' || item?.oType?.eKind == 'loyalty-points-discount' || item.oType.eKind == 'loyalty-points'));

    dataObject.total = 0;
    let total = 0, totalAfterDisc = 0, totalVat = 0, totalDiscount = 0, totalSavingPoints = 0, totalRedeemedLoyaltyPoints = 0;
    dataObject.aTransactionItems.forEach((item: any, index: number) => {
      if (item.oType.eKind === 'giftcard') {
        item.sDescription = this.translateService.instant('VOUCHER_SALE');
      }
      item.bRegular = !item.oType.bRefund;
      if (item?.oArticleGroupMetaData?.oName && Object.keys(item?.oArticleGroupMetaData?.oName)?.length) {
        item.sArticleGroupName = (item?.oArticleGroupMetaData?.oName[language] || item?.oArticleGroupMetaData?.oName['en'] || item?.oArticleGroupMetaData?.oName['nl'] || '') + ' ';
      }
      // if (item?.oBusinessProductMetaData?.sLabelDescription){
      //   item.description = item.description + item?.oBusinessProductMetaData?.sLabelDescription + ' ' + item?.sProductNumber;
      // }
      totalSavingPoints += item.nSavingsPoints;
      totalRedeemedLoyaltyPoints += item?.nRedeemedLoyaltyPoints || 0;
      let disc = parseFloat(item.nDiscount);
      if (item.bDiscountOnPercentage) {
        disc = this.getPercentOf(disc, item.nPriceIncVat)
        item.nDiscountToShow = disc;//.toFixed(2);
      } else { item.nDiscountToShow = disc }
      // console.log('item.nDiscountToShow', item.nDiscountToShow)
      // item.priceAfterDiscount = parseFloat(item.nRevenueAmount.toFixed(2)) - parseFloat(item.nDiscountToShow);
      item.nPriceIncVatAfterDiscount = (parseFloat(item.nPriceIncVat) - parseFloat(item.nDiscountToShow)) - item.nRedeemedLoyaltyPoints;
      if (item.oType.bRefund === true && item.oType.eKind != 'gold-purchase') item.nPriceIncVatAfterDiscount = -(item.nPriceIncVatAfterDiscount)
      // console.log('item.nPriceIncVatAfterDiscount', item.nPriceIncVatAfterDiscount)
      item.totalPaymentAmount = (parseFloat(item.nRevenueAmount) - parseFloat(item.nDiscountToShow)) * item.nQuantity - item.nRedeemedLoyaltyPoints;
      item.totalPaymentAmount = parseFloat(item.totalPaymentAmount.toFixed(2));
      // console.log('item.totalPaymentAmount', item.totalPaymentAmount)
      // item.totalPaymentAmountAfterDisc = parseFloat(item.priceAfterDiscount.toFixed(2)) * parseFloat(item.nQuantity);
      item.bPrepayment = item?.oType?.bPrepayment || false;
      const vat = (item.nVatRate * item.totalPaymentAmount / (100 + parseFloat(item.nVatRate)));
      item.vat = (item.nVatRate > 0) ? parseFloat(vat.toFixed(2)) : 0;
      totalVat += vat * item.nQuantity;
      total = total + item.totalPaymentAmount;
      // console.log('total', total)
      totalAfterDisc += (item.nPriceIncVatAfterDiscount * item.nQuantity);
      // console.log('totalAfterDisc', totalAfterDisc)
      item.ntotalDiscountPerItem = (item.oType.bRefund === true) ? 0 : (item.nDiscountToShow * item.nQuantity)
      totalDiscount += item.ntotalDiscountPerItem;
      // console.log('totalDiscount', totalDiscount)

      relatedItemsPromises[index] = this.getRelatedTransactionItem(item?.iActivityItemId, item?._id, index);
    })
    await Promise.all(relatedItemsPromises).then(result => {
      // console.log(result);
      result.forEach((item: any, index: number) => {
        transaction.aTransactionItems[index].related = item.data || [];
      })
    });
    transaction.aTransactionItems.forEach((item: any) => {
      if (item?.related?.length) {
        item.related.forEach((relatedItem: any) => {
          if (relatedItem.nPriceIncVat > item.nPriceIncVat) item.nPriceIncVat = relatedItem.nPriceIncVat;
          item.nDiscount = relatedItem.nDiscount || 0;
          item.bDiscountOnPercentage = relatedItem?.bDiscountOnPercentage || false;

          if (relatedItem?.bDiscountOnPercentage) {
            item.nDiscountToShow = (item.oType.bRefund === true) ? 0 : this.getPercentOf(relatedItem.nPriceIncVat, relatedItem.nDiscount);
            totalDiscount += (item.oType.bRefund === true) ? 0 : item.nDiscountToShow;
            relatedItem.nRevenueAmount = relatedItem.nRevenueAmount.toFixed(2) - this.getPercentOf(relatedItem.nPriceIncVat, relatedItem.nDiscount);
          } else {
            item.nDiscountToShow = (item.oType.bRefund === true) ? 0 : relatedItem.nDiscount;
            totalDiscount += (item.oType.bRefund === true) ? 0 : item.nDiscountToShow;
            relatedItem.nRevenueAmount = relatedItem.nRevenueAmount.toFixed(2) - relatedItem.nDiscount;
          }

          relatedItem.nRevenueAmount = relatedItem.nRevenueAmount.toFixed(2);
        })
      }
    })
    dataObject.totalAfterDisc = parseFloat(totalAfterDisc.toFixed(2));
    dataObject.total = parseFloat(total.toFixed(2));
    dataObject.totalVat = parseFloat(totalVat.toFixed(2));
    dataObject.totalDiscount = parseFloat(totalDiscount.toFixed(2));
    dataObject.totalSavingPoints = totalSavingPoints;
    dataObject.totalRedeemedLoyaltyPoints = totalRedeemedLoyaltyPoints;
    dataObject.nTotalExcVat = dataObject.totalAfterDisc - dataObject.totalVat;
    dataObject.dCreatedDate = moment(dataObject.dCreatedDate).format('DD-MM-yyyy hh:mm:ss');
    const [_relatedResult, _loyaltyPointSettings]: any = await Promise.all([ //_empResult
      this.getRelatedTransaction(dataObject?.iActivityId, dataObject?._id).toPromise(),
      this.apiService.getNew('cashregistry', `/api/v1/points-settings?iBusinessId=${this.iBusinessId}`).toPromise()
    ])
    dataObject.bSavingPointsSettings = _loyaltyPointSettings?.bEnabled;
    dataObject.aTransactionItems.forEach((item: any) => item.bSavingPointsSettings = _loyaltyPointSettings?.bEnabled)
    dataObject.related = _relatedResult.data || [];
    dataObject.related.forEach((relatedobj: any) => {
      relatedobj.aPayments.forEach((obj: any) => {
        obj.dCreatedDate = moment(obj.dCreatedDate).format('DD-MM-yyyy hh:mm:ss');
      });
      dataObject.aPayments = dataObject.aPayments.concat(relatedobj.aPayments);
    })
    transaction = dataObject;
    // console.log('processTransactionForPdfReceipt after processing', transaction);
    return transaction;
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
}
