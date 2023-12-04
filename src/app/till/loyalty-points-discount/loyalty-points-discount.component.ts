import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'
import { ToastService } from '../../shared/components/toast';
import { CreateArticleGroupService } from '../../shared/service/create-article-groups.service';
import { PriceService } from '../../shared/service/price.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-loyalty-points-discount]',
  templateUrl: './loyalty-points-discount.component.html',
  encapsulation: ViewEncapsulation.None
})
export class LoyaltyPointsDiscountComponent implements OnInit {
  @Input() item: any
  @Input() taxes: any
  @Output() itemChanged = new EventEmitter<any>();

  faTimes = faTimes
  faPlus = faPlus
  faMinus = faMinus
  typeArray = ['regular', 'broken', 'return'];
  constructor(private priceService: PriceService,
    private createArticleGroupService: CreateArticleGroupService,
    private toastrService: ToastService,) { }

  ngOnInit(): void {
    this.checkArticleGroups();
  }

  deleteItem(): void {
    this.itemChanged.emit({ type: 'delete'})
  }
  getDiscount(item: any): string {
    return this.priceService.getDiscount(item.nDiscount)
  }

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('loyalty-points')
      .subscribe((res: any) => {
        if (1 > res.data.length) {
          this.createArticleGroup();
        } else {
          this.item.iArticleGroupId = res.data[0].result[0]._id;
          this.item.oArticleGroupMetaData.sCategory = res.data[0].result[0].sCategory;
          this.item.oArticleGroupMetaData.sSubCategory = res.data[0].result[0].sSubCategory;
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async createArticleGroup() {
    const articleBody = { name: 'Loyalty Points', sCategory: 'Loyalty Points', sSubCategory: 'Loyalty Points' };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.item.iArticleGroupId = result.data._id;
    this.item.oArticleGroupMetaData.sCategory = result.data.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = result.data.sSubCategory;
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
