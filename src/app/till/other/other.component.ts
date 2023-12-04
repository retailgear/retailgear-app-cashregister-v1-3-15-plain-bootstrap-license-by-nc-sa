import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'
import { PriceService } from '../../shared/service/price.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-other]',
  templateUrl: './other.component.html',
  encapsulation: ViewEncapsulation.None
})
export class OtherComponent {
  @Input() item: any
  @Input() taxes: any
  @Output() itemChanged = new EventEmitter<any>();

  faTimes = faTimes
  faPlus = faPlus
  faMinus = faMinus
  typeArray = ['regular', 'broken', 'return'];
  constructor(private priceService: PriceService) { }

  deleteItem(): void {
    this.itemChanged.emit({type: 'delete'})
  }
  getDiscount(item: any): string {
    return this.priceService.getDiscount(item.nDiscount)
  }

  getColorCode(item: any): string {
    const { eTransactionItemType } = item;
    switch (eTransactionItemType) {
      case 'regular':
        return '#4ab69c';
      case 'broken':
        return '#f0e959';
      case 'return':
        return '#f7422e';
      default:
        return '#4ab69c';
    }
  }

  getTotalDiscount(item: any): string {
    return this.priceService.getDiscountValue(item);
  }

  getTotalPrice(item: any): string {
    return this.priceService.getArticlePrice(item)
  }
}
