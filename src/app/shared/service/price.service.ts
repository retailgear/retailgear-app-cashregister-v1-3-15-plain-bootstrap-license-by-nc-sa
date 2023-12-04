import { Injectable } from '@angular/core';
import { formatCurrency } from "@angular/common";
import { TillService } from './till.service';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

  constructor(private tillService: TillService) {}

  roundPrice(price: number): number {
    return Math.round((price + Number.EPSILON) * 100) / 100;
  }

  getDiscount(discount: { value: number, percent: boolean, itemPrice: number }, format = true): any {
    console.log('getDiscount 16: ', discount);
    if (discount?.percent) {
      return this.roundPrice(discount.value) + '%'
    } else {
      if (!format) {
        return this.roundPrice(discount?.value)
      } else {
        return formatCurrency(this.roundPrice(discount?.value), 'en-GB', this.tillService.currency)
      }
    }
  }

  getDiscountValue(article: any, format = true): any {
    if (article.discount) {
      if (article.discount.percent) {
        return this.roundPrice(article.discount.value) + '%'
      } else {
        if (!format) {
          return this.roundPrice(article.quantity * article.discount.value)
        } else {
          return formatCurrency(this.roundPrice(article.quantity * article.discount.value), 'en-GB', this.tillService.currency)
        }
      }

    } else {
      if (!format) {
        return this.roundPrice(0)
      } else {
        return formatCurrency(0, 'en-GB', this.tillService.currency)
      }
    }
  }

  getArticlePrice(article: any, total: boolean = false): any {
    if (!article.discount || article.discount.value === 0) {
      if (total) {
        return formatCurrency(this.roundPrice(article.price * article.quantity), 'en-GB', this.tillService.currency)
      }
      return formatCurrency(this.roundPrice(article.quantity * article.price), 'en-GB', this.tillService.currency)
    } else {
      if (total) {
        let price
        if (article.discount.percent) {
          price = (article.quantity * article.price) - (article.quantity * article.price * (article.discount.value / 100))
        } else {
          price = article.quantity * article.price - (article.quantity * article.discount.value)
        }
        return formatCurrency(this.roundPrice(price), 'en-GB', this.tillService.currency)
      } else {
        return formatCurrency(this.roundPrice((article.price - this.getDiscount(article.discount, false)) * article.quantity), 'en-GB', this.tillService.currency)
      }
    }
  }

  calculateItemPrice(item: any): any {
    if (item.amountToBePaid && item.tType !== 'refund') {
      return formatCurrency(item.amountToBePaid, 'en-GB', this.tillService.currency);
    }
    if (item.tType === 'refund') {
      return formatCurrency(-item.prePaidAmount, 'en-GB', this.tillService.currency);
    }
    return formatCurrency(item.quantity * item.price, 'en-GB', this.tillService.currency);
  }
}
