import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus, faArrowDown, faArrowUp, faUpload } from '@fortawesome/free-solid-svg-icons'
import { ImageUploadComponent } from 'src/app/shared/components/image-upload/image-upload.component';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { CreateArticleGroupService } from 'src/app/shared/service/create-article-groups.service';
import { DialogService } from 'src/app/shared/service/dialog';
import { PriceService } from 'src/app/shared/service/price.service';
import { TillService } from 'src/app/shared/service/till.service';
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
  goldFor = [{ type: 'goods', name: 'giftcard' },
  { type: 'goods', name: 'repair' },
  { type: 'goods', name: 'order' },
  { type: 'goods', name: 'stock' },
  { type: 'payment', name: 'cash' },
  { type: 'payment', name: 'bank' }];
  // goldFor = ['giftcard', 'repair', 'order', 'stock', 'cash', 'bankpayment'];
  propertyOptions: Array<any> = [];
  selectedProperties: Array<any> = [];
  articleGroups: Array<any> = [];
  articleGroupDetails: any = {
    iBusinessId: "",
    sCategory: "",
    sSubCategory: "",
    oName: {},
    bShowInOverview: false,
    bShowOnWebsite: false,
    bInventory: false,
    aProperty: []
  };
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
    this.itemChanged.emit('delete')
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

  assignArticleGroupMetadata(articlegroup: any) {
    this.item.iArticleGroupId = articlegroup._id;
    this.item.oArticleGroupMetaData.oName = articlegroup.oName;
    this.item.oArticleGroupMetaData.sCategory = articlegroup.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = articlegroup.sSubCategory;
  }

  assignArticleGroup(value: string) {
    const goldFor = this.goldFor.find(o => o.name === value);
    this.item.oGoldFor = goldFor;
    const artGroup = this.articleGroups.find((o: any) => o.sSubCategory === this.item.oGoldFor.name);
    if (!artGroup) {
      this.createArticleGroup();
    } else {
      this.assignArticleGroupMetadata(artGroup);
    }
  }

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('Gold purchase')
      .subscribe((res: any) => {
        if (1 > res.data.length) {
          this.createArticleGroup();
        } else {
          this.articleGroups = res.data[0].result;
          this.assignArticleGroup(this.item.oGoldFor.name);
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async createArticleGroup() {
    const articleBody = { name: 'Gold purchase', sCategory: 'Gold purchase', sSubCategory: this.item.oGoldFor.name };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.assignArticleGroupMetadata(result.data);
  }

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
  changeTotalAmount() {
    this.item.paymentAmount = -1 * this.item.quantity * this.item.price;
    this.item.nPurchasePrice = this.item.price / 1.21;
  }
  changeTypeArray() {
    if (!this.item.oType.refund) {
      this.item.price = -this.item.price;
    }
  }
}
