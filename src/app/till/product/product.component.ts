import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faArrowDown, faArrowUp, faMinus } from '@fortawesome/free-solid-svg-icons'
import { DialogService } from '../../shared/service/dialog';
import { DiscountDialogComponent } from "../dialogs/discount-dialog/discount-dialog.component";
import { PriceService } from '../../shared/service/price.service';
import { ApiService } from '../../shared/service/api.service';
import { ToastService } from '../../shared/components/toast';
import { TillService } from '../../shared/service/till.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[till-product]',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit{
  @Input() item: any
  @Input() taxes: any
  @Input() bSerialSearchMode: any
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
  iSelectedLocationId: string;

  @Input() disablePrepayment: any;
  @Input() availableAmount: any;

  constructor(private dialogService: DialogService,
    private priceService: PriceService,
    private apiService: ApiService,
    private toastrService: ToastService,
    public tillService: TillService) { }
    
    ngOnInit(): void {
      this.fetchArticleGroupInfo();
      this.iSelectedLocationId = this.item.oCurrentLocation?._id;
      if(this.item.bQuickButton && this.item.bQuickButton) this.changeTypeArray();
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

  notAllowedCommaAndSemiColon(event: any) {
    let keyCode = (event.which) ? event.which : event.keyCode
    if (keyCode == 59 || keyCode == 44) return false; /* 44=comma & 59= semicolon */
    else return true;
  }

  numericOnly(event:any): boolean { 
    let patt = /[0-9\,\.\ ]/;
    let result = patt.test(event.key);
    var itemprice = this.item?.price.toString();
    itemprice = itemprice.includes(",");
    if(itemprice==true && event.keyCode==44){
      result = false;
    }
    return result;
  }

  deleteItem(): void {
    this.itemChanged.emit({type: 'delete'})
  }

  getDiscount(item: any): string {
    return this.priceService.getDiscount(item.nDiscount || 0);
  }

  changeInMargin() {
    // this.item.nPurchasePrice = this.item.price / this.item.nMargin || 1;
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
    if (this.item.oType.bRefund) {
      this.item.tType = 'refund';
      this.item.eTransactionItemType = 'return'
      if(this.item.new) this.item.nDiscount = 0; // NOTE: removing discount when toggling to return for new items
    } else {
      this.item.tType = 'pay';
      this.item.eTransactionItemType = 'regular'
    }
    this.updatePayments();
  }

  openDiscountDialog(): void {
    this.dialogService.openModal(DiscountDialogComponent, { context: { item: JSON.parse(JSON.stringify(this.item)) }, hasBackdrop: true })
      .instance.close.subscribe((data) => {
        if (data.item) {
          // console.log('data.item: ', data.item);
          this.item.nDiscount = data.item.nDiscount;
          this.item.bDiscountOnPercentage = data.item?.discount?.percent || false;
          this.itemChanged.emit({ type: 'item', data: this.item});
        }
      })
  }

  updatePayments(price?:any) {
    if(price) this.item.price = price;
    this.item.iLocationId = this.iSelectedLocationId; /* in case, we changed the location from the drop-down */
    this.itemChanged.emit({type: 'item', data: this.item});
  }

  // onChangeLocation() {
  //   this.item.iLocationId = this.iSelectedLocationId;
  //   this.itemChanged.emit(this.item);
  // }

  quantityChangeHandler(nQuantity: number) {
    this.itemChanged.emit({type: 'update'});
    // console.log('changeQuantity: ', nQuantity, this.item?.paymentAmount, this.item);
  }

  changePrePayment(item: any) {
    // console.log('changePrePayment', item)
    if (item.paymentAmount < 0 && item.paymentAmount > item.nTotal) item.oType.bPrepayment = true;
    else if (item.paymentAmount >= 0 && item.nTotal > item.paymentAmount) item.oType.bPrepayment = true;
    else if (item.paymentAmount >= 0 && item.nTotal == item.paymentAmount) item.oType.bPrepayment = false;
    else if (item.nTotal > 0 && item.paymentAmount < 0) throw ('strange transaction A');
    else if (item.nTotal <= 0 && item.paymentAmount > 0) throw ('strange transaction B');

    if (item.paymentAmount > this.availableAmount) {
      this.toastrService.show({ type: 'warning', text: `Can't assign more than available money!` });
      // return;
    }

    item.manualUpdate = true;
    item.prepaymentTouched = true;
    this.itemChanged.emit({type: 'prepaymentChange'});
  }
}
