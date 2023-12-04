import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentDistributionService {

  constructor() { }

  roundToXDigits(value: number) {
    const digits = 2;
    value = value * Math.pow(10, digits);
    value = Math.round(value);
    value = value / Math.pow(10, digits);
    return value;
  }
  
  distributeAmount(transactionItems: any[], availableAmount: any): any[] {
    // console.log('initial availableAmount',availableAmount)
    transactionItems.map((i: any) => {
      // console.log('i.paymentAmount',i.paymentAmount)
      let _nDiscount = 0;
      if (i.nDiscount > 0 && !i.bDiscountOnPercentage) _nDiscount = i.nDiscount
      else if (i.nDiscount > 0 && i.bDiscountOnPercentage) _nDiscount = i.price * (i.nDiscount / 100)
      
      i.amountToBePaid = i.price * i.quantity - (i.prePaidAmount || 0) - (_nDiscount * i.quantity || 0);
      if (i.type === 'gold-purchase') {
        i.amountToBePaid = -1 * i.amountToBePaid;
      }
      if (i.tType && i.tType === 'refund') {
        i.amountToBePaid = -1 * i.prePaidAmount;
      }
      if (i.paymentAmount > i.amountToBePaid) {
        i.paymentAmount = i.amountToBePaid;
      };
      return i;
    });
    const setAmount = transactionItems.filter(item => item.isExclude);
    setAmount.map(i => (i.paymentAmount = 0));
    // console.log(transactionItems)
    const arrToUpdate = transactionItems.filter(item => (!item.manualUpdate && !item.isExclude) || item?.prepaymentTouched===false);
    const arrNotToUpdate = transactionItems.filter(item => (item.manualUpdate && !item.isExclude) || item?.prepaymentTouched===true);
    
    // console.log({update: arrToUpdate, notToUpdate: arrNotToUpdate})
    
    const assignedAmountToManual = arrNotToUpdate.reduce((n, { paymentAmount }) => n + paymentAmount, 0);
    availableAmount -= assignedAmountToManual
    
    
    // console.log('assignedAmountToManual', assignedAmountToManual)
    // console.log('availableAmount', availableAmount)

    if (arrToUpdate.length > 0) {
      const totalAmountToBePaid = arrToUpdate.reduce((n, { amountToBePaid }) => n + amountToBePaid, 0) + assignedAmountToManual;
      // console.log('totalAmountToBePaid', totalAmountToBePaid)
      if (totalAmountToBePaid !== 0) {
        arrToUpdate.map(i => (i.paymentAmount = this.roundToXDigits(i.amountToBePaid * availableAmount / totalAmountToBePaid)));
      }
      const assignedAmount = arrToUpdate.reduce((n, { paymentAmount }) => n + paymentAmount, 0);
      // console.log('assignedAmount', assignedAmount)
      arrToUpdate[arrToUpdate.length - 1].paymentAmount += (availableAmount - assignedAmount);
      // console.log("updated last item's paymentAmount to ", (availableAmount - assignedAmount))
      // console.log('last item is ', arrToUpdate[arrToUpdate.length - 1])
    }
    arrToUpdate.forEach(element => {
      if (element.paymentAmount > element.nTotal) {
        element.paymentAmount = element.nTotal;
      }
      if (element.paymentAmount < element.nTotal) element.oType.bPrepayment = true;
      else if (element.paymentAmount == element.nTotal) element.oType.bPrepayment = false;
    });
    return transactionItems;
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
