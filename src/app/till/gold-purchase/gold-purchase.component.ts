import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus, faArrowDown, faArrowUp, faUpload } from '@fortawesome/free-solid-svg-icons'
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { CreateArticleGroupService } from '../../shared/service/create-article-groups.service';
import { DialogService } from '../../shared/service/dialog';
import { PriceService } from '../../shared/service/price.service';
import { TillService } from '../../shared/service/till.service';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-goldpurchase]',
  templateUrl: './gold-purchase.component.html',
  styleUrls: ['./gold-purchase.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GoldPurchaseComponent implements OnInit {
  @Input() item: any
  @Input() taxes: any
  @Output() itemChanged = new EventEmitter<any>();

  faTimes = faTimes
  faPlus = faPlus
  faMinus = faMinus
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;
  faUpload = faUpload;
  aGoldFor = [{ type: 'goods', name: 'giftcard' },
  { type: 'goods', name: 'repair' },
  { type: 'goods', name: 'order' },
  { type: 'goods', name: 'stock' },
  { type: 'payment', name: 'cash' },
  { type: 'payment', name: 'bank' }];
  // goldFor = ['giftcard', 'repair', 'order', 'stock', 'cash', 'bankpayment'];
  propertyOptions: Array<any> = [];
  selectedProperties: Array<any> = [];
  articleGroup:any;

  brand: any = null;
  brandsList: Array<any> = [];
  filteredBrands: Array<any> = [];
  supplier: any;
  supplierOptions: Array<any> = [];
  suppliersList: Array<any> = [];
  showDeleteBtn: boolean = false;
  aProperty: any = [];
  typeArray = [
    { key: 'regular', value: false, title: 'REGULAR' },
    { key: 'return', value: true, title: 'RETURN' }
  ];
  constructor(
    private priceService: PriceService,
    private createArticleGroupService: CreateArticleGroupService,
    private toastrService: ToastService,
    public tillService: TillService) { }

  ngOnInit(): void {
    this.checkArticleGroups();
    this.item.nPurchasePrice = this.item.price / 1.21;
  }
  deleteItem(): void {
    this.itemChanged.emit({type: 'delete'})
  }
  getDiscount(item: any): string {
    return this.priceService.getDiscount(item.nDiscount)
  }

  getColorCode(item: any): string {
    const { eTransactionItemType } = item;
    if (item.tType === 'refund') {
      return '#f7422e';
    }
    
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

  notAllowedCommaAndSemiColon(event: any) {
    let keyCode = (event.which) ? event.which : event.keyCode
    if (keyCode == 59 || keyCode == 44) return false; /* 44=comma & 59= semicolon */
    else return true;
  }

  assignArticleGroupMetadata() {
    this.item.iArticleGroupId = this.articleGroup._id;
    this.item.oArticleGroupMetaData.oName = this.articleGroup.oName;
    this.item.oArticleGroupMetaData.sCategory = this.articleGroup.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = this.articleGroup.sSubCategory;
  }

  // assignArticleGroup(value: string) {
  //   const goldFor = this.goldFor.find(o => o.name === value);
  //   this.item.oGoldFor = goldFor;
  //   this.checkArticleGroups();//.find((o: any) => o.sSubCategory === this.item.oGoldFor.name);
  //   this.assignArticleGroupMetadata(this.articleGroup);
    
  // }

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('gold-purchase', this.item.oGoldFor.name).subscribe((res: any) => {
      this.articleGroup = res.data;
      this.assignArticleGroupMetadata();
    }, err => {
      this.toastrService.show({ type: 'danger', text: err.message });
    });
  }

  // async createArticleGroup() {
  //   const articleBody = { name: 'gold-purchase', sCategory: 'gold-purchase', eDefaultArticleGroup: 'gold-purchase', sSubCategory: this.item.oGoldFor.name };
  //   const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
  //   this.assignArticleGroupMetadata(result.data);
  // }

  constisEqualsJson(obj1: any, obj2: any) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    return keys1.length === keys2.length && Object.keys(obj1).every(key => obj1[key] == obj2[key]);
  }

  changeInbrokenAmount(item: any) {
    if (item.nBrokenProduct < 0) {
      item.nBrokenProduct = 0;
    }
    if (item.quantity < item.nBrokenProduct) {
      item.nBrokenProduct = item.quantity;
    }
  }

  getTotalDiscount(item: any): string {
    return this.priceService.getDiscountValue(item);
  }

  getTotalPrice(item: any): string {
    return this.priceService.getArticlePrice(item);
  }

  removeImage(index: number): void {
    this.item.aImage.splice(index, 1);
  }
  changeTotalAmount(price?:any) {
    if(price) this.item.price = price;
    this.item.paymentAmount = -1 * this.item.quantity * this.item.price;
    this.item.nPurchasePrice = this.item.price / 1.21;
    this.itemChanged.emit({ type: 'item', data: this.item });
  }
  changeTypeArray() {
    if (!this.item.oType.refund) {
      this.item.price = -this.item.price;
    }
  }
}
