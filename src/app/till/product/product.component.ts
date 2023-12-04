import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faArrowDown, faArrowUp, faMinus } from '@fortawesome/free-solid-svg-icons'
import { DialogService } from '../../shared/service/dialog';
import { DiscountDialogComponent } from "../dialogs/discount-dialog/discount-dialog.component";
import { PriceService } from '../../shared/service/price.service';
import { ApiService } from 'src/app/shared/service/api.service';
import { ToastService } from 'src/app/shared/components/toast';
import { formatCurrency } from '@angular/common';
import { TillService } from 'src/app/shared/service/till.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-product]',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.sass'],
})
export class ProductComponent implements OnInit{
  @Input() item: any
  @Input() taxes: any
  @Output() itemChanged = new EventEmitter<any>();

  faMinus = faMinus;
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;
  typeArray = [
    { key: 'regular', value: false, title: 'REGULAR' },
    { key: 'return', value: true, title: 'RETURN' }
  ];
  collapsedBtn: Boolean = false;
  totalDiscount = 0;

  constructor(private dialogService: DialogService,
    private priceService: PriceService,
    private apiService: ApiService,
    private toastrService: ToastService,
    public tillService: TillService) { }
    
    ngOnInit(): void {
      this.fetchArticleGroupInfo();
      this.getTotalDiscount(this.item)
    }

  fetchArticleGroupInfo() {
    const iBusinessId = localStorage.getItem('currentBusiness');
    this.apiService.getNew('core', `/api/v1/business/article-group/${this.item.iArticleGroupId}?iBusinessId=${iBusinessId}`).
      subscribe((res: any) => {
        this.item.oArticleGroupMetaData.aProperty = res.data.aProperty;
        this.item.oArticleGroupMetaData.oName = res.data.oName;
        this.item.oArticleGroupMetaData.oNameOriginal = res.data.oName;
        this.item.oArticleGroupMetaData.sCategory = res.data.sCategory;
        this.item.oArticleGroupMetaData.sSubCategory = res.data.sSubCategory;
        if (res.data.aBusinessPartner) {
          const marginData = res.data.aBusinessPartner.find((o: any) => o.iBusinessPartnerId === this.item.iSupplierId);
          this.item.nMargin = marginData?.nMargin || 1;
          this.item.nPurchasePrice = this.item.nPurchasePrice || 0;
          this.changeInMargin();
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  deleteItem(): void {
    this.itemChanged.emit('delete')
  }

  getDiscount(item: any): string {
    return this.priceService.getDiscount(item.nDiscount || 0);
  }

  changeInMargin() {
    // this.item.nPurchasePrice = this.item.price / this.item.nMargin || 1;
  }

  getTotalDiscount(item: any): string {
    this.totalDiscount = (item?.discount) ? this.priceService.getDiscountValue(item) : formatCurrency(item.nDiscount, 'en-GB', this.tillService.currency) ;
    return String(this.totalDiscount);
  }

  getTotalPrice(item: any): string {
    return this.priceService.getArticlePrice(item)
  }

  changeInbrokenAmount(item: any) {
    if (item.nBrokenProduct < 0) {
      item.nBrokenProduct = 0;
    }
    if (item.quantity < item.nBrokenProduct) {
      item.nBrokenProduct = item.quantity;
    }
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

  changeTypeArray() {
    if (!this.item.oType.refund) {
      this.item.price = -this.item.price;
    }
    this.updatePayments();
  }

  openDiscountDialog(): void {
    this.dialogService.openModal(DiscountDialogComponent, { context: { item: JSON.parse(JSON.stringify(this.item)) } })
      .instance.close.subscribe((data) => {
        if (data.item) {
          this.item.nDiscount = data.item.nDiscount;
          this.item.bDiscountOnPercentage = data.item?.discount?.percent || false;
          this.getTotalDiscount(data.item)
          this.itemChanged.emit(this.item);
        }
      })
  }

  updatePayments(): void {
    this.itemChanged.emit('update');
  }

  quantityChangeHandler(nQuantity: number) {
    this.itemChanged.emit('update');
    // console.log('changeQuantity: ', nQuantity, this.item?.paymentAmount, this.item);
  }

  changePrePayment(item: any) {
    // console.log('changePrePayment', item)
    if (item.paymentAmount < 0 && item.paymentAmount > item.nTotal) item.oType.bPrepayment = true;
    else if (item.paymentAmount >= 0 && item.nTotal > item.paymentAmount) item.oType.bPrepayment = true;
    else if (item.paymentAmount >= 0 && item.nTotal == item.paymentAmount) item.oType.bPrepayment = false;
    else if (item.nTotal > 0 && item.paymentAmount < 0) throw ('strange transaction A');
    else if (item.nTotal <= 0 && item.paymentAmount > 0) throw ('strange transaction B');

    item.prepaymentTouched = true;
    // item.manualUpdate = true;
    //  this.updatePayments();
    this.itemChanged.emit('prepaymentChange');
  }
}
