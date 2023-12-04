import { Injectable } from '@angular/core';
import { ToastService } from '../components/toast';
import { TillService } from './till.service';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class PaymentDistributionService {

  toastService: ToastService;

  constructor(private tillService:TillService) { }

  roundToXDigits(value: number) {
    const digits = 2;
    value = value * Math.pow(10, digits);
    value = Math.round(value);
    value = value / Math.pow(10, digits);
    return value;
  }

  setToastService(toastService: ToastService) {
    this.toastService = toastService;
  }

  distributeAmount(oData: any) {
    let { transactionItems, availableAmount, nGiftcardAmount = 0, nRedeemedLoyaltyPoints = 0, payMethods }:any = oData;
    const bTesting = false;
    if (bTesting) console.log('distributeAmount before', { availableAmount, nGiftcardAmount, nRedeemedLoyaltyPoints, original: JSON.parse(JSON.stringify(transactionItems))})

    const nSavingsPointRatio = this.tillService.oSavingPointSettings.nPerEuro1 / this.tillService.oSavingPointSettings.nPerEuro

    transactionItems = transactionItems.filter((i: any) => !['loyalty-points'].includes(i.type))
    transactionItems.forEach((i: any) => {
      if(i.type == 'empty-line') return;
      // if (bTesting) console.log(31, i, i.nTotal);

      const nPrice = parseFloat((typeof i.price === 'string') ? i.price.replace(',', '.') : i.price);
      if(nPrice > 0) i.paymentAmount = 0
      i.nTotal = nPrice * i.quantity;
      let nDiscount = 0;
      if(i?.new) nDiscount = (i.bDiscountOnPercentage ? this.tillService.getPercentOf(nPrice, i.nDiscount || 0) : i.nDiscount) * i.quantity;
      nDiscount = +(nDiscount.toFixed(2));
      i.amountToBePaid = i.nTotal - nDiscount - (i.prePaidAmount || 0);
      i.amountToBePaid = +(i.amountToBePaid.toFixed(2))
      if (bTesting) console.log(38, { nPrice, nDiscount, amountToBePaid: i.amountToBePaid, qty: i.quantity, paymentAmount: i.paymentAmount, prePaidAmount: i.prePaidAmount })

      if (i.type === 'gold-purchase') i.amountToBePaid = -(i.amountToBePaid) ;

      if (i?.tType && i.tType === 'refund'){

        if(i?.new) {
          i.amountToBePaid = -(nPrice * i.quantity - nDiscount - (i?.nGiftcardDiscount || 0) - (i?.nRedeemedLoyaltyPoints || 0));
          i.paymentAmount = i.amountToBePaid;
          if (bTesting) console.log('refund item is new amountToBePaid', i.amountToBePaid, 'paymentAmount', i.paymentAmount)
        } else {
          // i.amountToBePaid = -(i.nRevenueAmount * i.quantity).toFixed(2);//-(i.nTotal);
          i.amountToBePaid = -i.nRefundAmount.toFixed(2);//-(i.nTotal);
          this.calculateSavingsPoints(i, nSavingsPointRatio);
        }
        if (bTesting) console.log('refund amountToBePaid', i.amountToBePaid)
        // availableAmount += -i.amountToBePaid;
      }
      i.nGiftcardDiscount = 0;
      i.nRedeemedLoyaltyPoints = 0;

      if (bTesting) console.log({ nTotal: i.nTotal, i: JSON.parse(JSON.stringify(i)) })

      // if (bTesting)  console.log('46 paymentAmount before', i.paymentAmount, 'amountToBePaid', i.amountToBePaid);
      if (i.paymentAmount > i.amountToBePaid){
        if (bTesting) console.log('i.paymentAmount > i.amountToBePaid', i.paymentAmount, i.amountToBePaid)
        i.paymentAmount = i.amountToBePaid;
      } 
      if (i.paymentAmount < 0 && i.type !== 'gold-purchase') {
        if (bTesting) console.log('payment amount is < 0 so addig that to available amount before', {availableAmount})
        availableAmount += -i.amountToBePaid;
        if (bTesting) console.log('after', { availableAmount })
      }
      // if (bTesting) console.log('48 paymentAmount after', i.paymentAmount)
    });

    const arrToUpdate = transactionItems.filter((item:any) => !item?.manualUpdate && !item?.isExclude);
    const arrNotToUpdate = transactionItems.filter((item:any) => item?.manualUpdate || item?.isExclude);

    const aEligibleForSavingPoints = payMethods.filter((p: any) => p.amount > 0 && p.bAssignSavingPoints);
    if (bTesting) console.log({ aEligibleForSavingPoints }, this.tillService.oSavingPointSettings)

    let nEligibleAmount = _.sumBy(aEligibleForSavingPoints, 'amount');
    if (bTesting) console.log({ nEligibleAmount });

    if (bTesting)  console.log({arrToUpdate, arrNotToUpdate})

    const assignedAmountToManual = _.sumBy(arrNotToUpdate, 'paymentAmount')
    availableAmount -= assignedAmountToManual;

    if (bTesting) console.log({assignedAmountToManual, availableAmount})

    if (arrToUpdate?.length) {
      let totalAmountToBePaid = +(_.sumBy(arrToUpdate.filter((el:any) => el.amountToBePaid > 0), 'amountToBePaid').toFixed(2));
      if(nEligibleAmount > totalAmountToBePaid) nEligibleAmount = totalAmountToBePaid;
      if (bTesting) console.log({totalAmountToBePaid})

      const aGiftcards = arrToUpdate.filter((el: any) => el.type === 'giftcard');
      const aItems = arrToUpdate.filter((el: any) => el.type !== 'giftcard' && !el.oType.bRefund);

      if (bTesting) console.log({ aGiftcards })
      if (aGiftcards?.length) {
        aGiftcards.forEach((i: any) => {
          if(i?.tType=== 'refund') {
            const nPrice = parseFloat((typeof i.price === 'string') ? i.price.replace(',', '.') : i.price);
            i.nSavingsPoints = -Math.floor(nPrice * nSavingsPointRatio)
          } else {
            nEligibleAmount = this.calculateSavingsPoints(i, nSavingsPointRatio, nEligibleAmount, totalAmountToBePaid);
          }
        });
        const { nAvailable, nPoints }:any = this.assignPaymentToGiftcardFirst(aGiftcards, availableAmount, totalAmountToBePaid, bTesting, nRedeemedLoyaltyPoints);
        if (bTesting) console.log({ nAvailable, nPoints, aItems })
        availableAmount = nAvailable;
        nRedeemedLoyaltyPoints = nPoints;

        totalAmountToBePaid = _.sumBy(aItems, 'amountToBePaid');
        if (bTesting) console.log('now we have available', { availableAmount, totalAmountToBePaid, nRedeemedLoyaltyPoints })
      }

      if (totalAmountToBePaid && nGiftcardAmount){
        this.handleGiftcardDiscount(totalAmountToBePaid, aItems, nGiftcardAmount, bTesting);
        totalAmountToBePaid = +(_.sumBy(aItems, 'amountToBePaid').toFixed(2));
        if (bTesting) console.log('processed giftcard discount, new totalAmountToBePaid', totalAmountToBePaid)
      }

      if (totalAmountToBePaid && nRedeemedLoyaltyPoints) {
        this.handleLoyaltyPointsDiscount(aItems, totalAmountToBePaid, nRedeemedLoyaltyPoints, bTesting);
        totalAmountToBePaid = _.sumBy(aItems, 'amountToBePaid');
      }

      if (bTesting) console.log('still yet to pay',{ totalAmountToBePaid, availableAmount })
      if (totalAmountToBePaid !== 0) {
        if(availableAmount > totalAmountToBePaid) availableAmount = totalAmountToBePaid;
        let nAssignedUntillNow = 0;
        if (bTesting) console.log({ availableAmount })
        aItems.forEach((i:any) => {
          if (bTesting) console.log(107, { tType: i.tType, availableAmount });
          if (i.amountToBePaid > 0 && (!i?.tType || i.tType !== 'refund')) {
            const nCalculatedAmount = i.amountToBePaid * availableAmount / totalAmountToBePaid;
            i.paymentAmount = ((nAssignedUntillNow + nCalculatedAmount) > availableAmount) ? availableAmount - nAssignedUntillNow : nCalculatedAmount;
            i.paymentAmount = +(i.paymentAmount.toFixed(2))
            if (bTesting) console.log('set to payment',i.paymentAmount)
            nAssignedUntillNow += i.paymentAmount;

            if(i.tType != 'refund') nEligibleAmount = this.calculateSavingsPoints(i, nSavingsPointRatio, nEligibleAmount, totalAmountToBePaid);
          }
        });
      }
      const nDistributedAmount = +(_.sumBy(aItems.filter((el:any) => el.amountToBePaid > 0), 'paymentAmount').toFixed(2))
      availableAmount -= nDistributedAmount;
      availableAmount = +(availableAmount.toFixed(2));
      if (bTesting) console.log('after assigning amounts, remaining availableAmount is', availableAmount);

      let assignedAmount = +(_.sumBy(aItems, 'paymentAmount').toFixed(2));
      if (bTesting) console.log('assignedAmount', assignedAmount, 'availableAmount', availableAmount)

      if(availableAmount > 0 && assignedAmount != 0) {
        if (bTesting) console.log('availableAmount > 0', availableAmount)
        if(assignedAmount > 0) {
          if (bTesting) console.log('assignedAmount > 0', assignedAmount)
          arrToUpdate[arrToUpdate.length - 1].paymentAmount += availableAmount;
          if (bTesting) console.log("updated last item's paymentAmount to ", arrToUpdate[arrToUpdate.length - 1].paymentAmount, { availableAmount })
        } else {
          if (bTesting) console.log('assignedAmount < 0', assignedAmount)
          assignedAmount = -assignedAmount;
          arrToUpdate.forEach((i:any) => {
            if (i.type !== 'giftcard' && i.tType !== 'refund') {
              const a = +((i.amountToBePaid * availableAmount / assignedAmount).toFixed(2));
              if (bTesting) console.log('125 set to payment', a)
              i.paymentAmount = a;
            }
          });
        }
      }
      // console.log('last item is ', arrToUpdate[arrToUpdate.length - 1])
    }
    const bShowGiftcardDiscountField = arrToUpdate.some((el:any) => el.nGiftcardDiscount);
    const bShowLoyaltyPointsDiscountField = arrToUpdate.some((el:any) => el.nRedeemedLoyaltyPoints);
    if (bTesting) console.log({ bShowGiftcardDiscountField, bShowLoyaltyPointsDiscountField })
    arrToUpdate.forEach((i:any) => {
      i.bShowGiftcardDiscountField = bShowGiftcardDiscountField;
      i.bShowLoyaltyPointsDiscountField = bShowLoyaltyPointsDiscountField;

      if (i.paymentAmount >= i.nTotal){
        i.paymentAmount = i.nTotal;
        i.oType.bPrepayment = false;
      } else if (i.paymentAmount < i.nTotal){
        i.oType.bPrepayment = true;
      }
    });
    if(bTesting) console.log('final',transactionItems)
    return transactionItems;
  }

  calculateSavingsPoints(oItem: any, nSavingsPointRatio:number, nEligibleAmount:number = 1, totalAmountToBePaid:number = 1) {
    const bTesting = false;
    if(bTesting) console.log('calculateSavingsPoints', {nSavingsPointRatio, nEligibleAmount, totalAmountToBePaid, oItem})
    if (!this.tillService.oSavingPointSettings.aExcludedArticleGroups.includes(oItem.iArticleGroupId)) {
      if (bTesting) console.log('updating the saving points')
      const nAmountConsideredForSavingPoint = +((oItem.amountToBePaid * nEligibleAmount / totalAmountToBePaid).toFixed(2)) * nSavingsPointRatio;
      oItem.nSavingsPoints = (oItem?.tType == 'refund') ? Math.ceil(nAmountConsideredForSavingPoint) : Math.floor(nAmountConsideredForSavingPoint)
      if (bTesting) console.log({ nSavingsPoints: oItem.nSavingsPoints, nAmountConsideredForSavingPoint })
    } else {
      if (bTesting) console.log('this article group is excluded from saving points so setting it to 0')
      oItem.nSavingsPoints = 0;
    }

    if (oItem.type === 'giftcard') nEligibleAmount -= (oItem.nSavingsPoints / nSavingsPointRatio);

    return nEligibleAmount;
  }

  assignPaymentToGiftcardFirst(aGiftcards: any, availableAmount: any, totalAmountToBePaid: any, bTesting: boolean, nRedeemedLoyaltyPoints:number) {
    if (bTesting) console.log('assignPaymentToGiftcardFirst', { availableAmount, nRedeemedLoyaltyPoints, aGiftcards })

    aGiftcards.forEach((i: any) => {
      if (bTesting) console.log({ i: i })

      if (nRedeemedLoyaltyPoints > 0) {

        if (bTesting) console.log('nRedeemedLoyaltyPoints > 0')

        if (nRedeemedLoyaltyPoints >= i.amountToBePaid) {
          if (bTesting) console.log('nRedeemedLoyaltyPoints >= i.amountToBePaid')
          i.nRedeemedLoyaltyPoints = i.amountToBePaid;
          nRedeemedLoyaltyPoints -= i.amountToBePaid;
          i.amountToBePaid = 0;
        } else {
          if (bTesting) console.log('else', { nRedeemedLoyaltyPoints })
          i.nRedeemedLoyaltyPoints = nRedeemedLoyaltyPoints;
          i.amountToBePaid -= nRedeemedLoyaltyPoints
          nRedeemedLoyaltyPoints = 0;
        }

        if (bTesting) console.log('after redeemed loyalty points', { main: nRedeemedLoyaltyPoints, paymentAmount: i.paymentAmount, amountToBePaid: i.amountToBePaid, nRedeemedLoyaltyPoints: i.nRedeemedLoyaltyPoints })
      }
      // else {
      //   console.log('else 176 setting redeemed point to 0 for', i.name)
      //   i.nRedeemedLoyaltyPoints = 0;
      // }

      if(availableAmount > 0) {
        if (availableAmount >= i.amountToBePaid) {
          if (bTesting) console.log('if 156 availableAmount >= i.amountToBePaid', { availableAmount, amountToBePaid: i.amountToBePaid})
          i.paymentAmount = i.amountToBePaid;
          availableAmount -= i.amountToBePaid;
          // totalAmountToBePaid -= i.amountToBePaid;
          if (bTesting) console.log('giftcard full payment amount', i.paymentAmount);
        } else {
          if (bTesting) console.log('else 162')
          i.paymentAmount = availableAmount;
          availableAmount -= i.paymentAmount;
          if (bTesting) console.log('73 giftcard part payment amount', i.paymentAmount);
        };
      }
    })
    return { nAvailable: availableAmount, nPoints: nRedeemedLoyaltyPoints };
  }

  handleGiftcardDiscount(totalAmountToBePaid: any, arrToUpdate: any, nGiftcardAmount: any, bTesting: boolean) {
    if (bTesting) console.log('handling giftcard discount')
    let nRemaining = nGiftcardAmount;
    arrToUpdate.forEach((i: any) => {
      if (nGiftcardAmount > 0 && i?.tType !== 'refund') {
        const nAmount = +((i.amountToBePaid * nGiftcardAmount / totalAmountToBePaid).toFixed(3));
        i.nGiftcardDiscount = +(nAmount.toFixed(2));
        if (nRemaining < i.nGiftcardDiscount) {
          i.nGiftcardDiscount = +(nRemaining.toFixed(3).slice(0,-1));
        } else {
          nRemaining -= nAmount;
        }

        if (bTesting) console.log('nGiftcardDiscount', i.nGiftcardDiscount, nRemaining)

        i.amountToBePaid -= i.nGiftcardDiscount;
        if (bTesting) console.log('reduced amountToBePaid', i.amountToBePaid);
      }

      if (i?.tType === 'refund') i.nGiftcardDiscount = 0;
    });
  }

  handleLoyaltyPointsDiscount(arrToUpdate:any, totalAmountToBePaid:any, nRedeemedLoyaltyPoints:any, bTesting:boolean){
    if (bTesting) console.log('handleLoyaltyPointsDiscount', { totalAmountToBePaid, nRedeemedLoyaltyPoints, arrToUpdate: JSON.parse(JSON.stringify(arrToUpdate)) })
    arrToUpdate.forEach((i: any) => {
      if (nRedeemedLoyaltyPoints > 0 && i?.tType !== 'refund') {

        i.nRedeemedLoyaltyPoints = +((i.amountToBePaid * nRedeemedLoyaltyPoints / totalAmountToBePaid).toFixed(2));
        if (bTesting) console.log({ amountToBePaid : i.amountToBePaid })

        i.amountToBePaid -= i.nRedeemedLoyaltyPoints;
        i.amountToBePaid = +(i.amountToBePaid.toFixed(2))
        if (bTesting) console.log('reduced amountToBePaid', i.amountToBePaid);
      }

      if (i?.tType === 'refund') i.nRedeemedLoyaltyPoints = 0;
    });
  }

  updateAmount(transactionItems: any[], availableAmount: any, index: number): any[] {
    transactionItems.map((i: any) => {
      // i.amountToBePaid = i.price * i.quantity - (i.prePaidAmount || 0);
      if (i.tType && i.tType === 'refund') {
        availableAmount += i.prePaidAmount;
        if (i.amountToBePaid === 0) {
          i.amountToBePaid = -1 * i.prePaidAmount;
        }
      }
      if (i.paymentAmount > i.amountToBePaid) {
        i.paymentAmount = i.amountToBePaid;
      };
      return i;
    });
    transactionItems[index].manualUpdate = true;
    const arrNotToUpdate = transactionItems.filter(item => item.manualUpdate && !item.isExclude);
    const assignedAmountToManual = arrNotToUpdate.reduce((n, { paymentAmount }) => n + paymentAmount, 0);
    availableAmount -= assignedAmountToManual;
    const arrToUpdate = transactionItems.filter(item => !item.manualUpdate && !item.isExclude);

    if (arrToUpdate.length > 0) {
      const totalAmountToBePaid = arrToUpdate.reduce((n, { amountToBePaid }) => n + amountToBePaid, 0);
      arrToUpdate.map(i => (i.paymentAmount = this.roundToXDigits(i.amountToBePaid * availableAmount / Math.abs(totalAmountToBePaid))));
      const assignedAmount = arrToUpdate.reduce((n, { paymentAmount }) => n + paymentAmount, 0);
      arrToUpdate[arrToUpdate.length - 1].paymentAmount += (availableAmount - assignedAmount);
    }
    arrToUpdate.forEach(element => {
      if (element.paymentAmount > element.nTotal) {
        element.paymentAmount = element.nTotal;
      }
    });
    return transactionItems;
  }
}
