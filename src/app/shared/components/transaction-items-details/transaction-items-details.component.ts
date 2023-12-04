import { Component, OnInit } from '@angular/core';
import { DialogComponent } from '../../service/dialog';
import { ViewContainerRef } from '@angular/core';
import { ApiService } from '../../../shared/service/api.service';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../toast';
import { TranslateService } from '@ngx-translate/core';
import { TillService } from '../../service/till.service';

@Component({
  selector: 'app-transaction-items-details',
  templateUrl: './transaction-items-details.component.html',
  styleUrls: ['./transaction-items-details.component.scss']
})

export class TransactionItemsDetailsComponent implements OnInit {
  $element = HTMLInputElement
  dialogRef: DialogComponent;
  transaction: any;
  mode: string = '';
  showLoader = false;
  translation :any =[];
  transactionColumns :any= []
  activityColumns: any = ['ACTIVITY_ITEM_NUMBER', 'PRODUCT_NAME', 'BAG_NUMBER', 'TOTAL_AMOUNT', 'TOTAL_DICOUNT', 'PAID_AMOUNT', 'IS_PREPAYMENT', 'CREATED_ON', 'ACTIONS']
  transactionItems: Array<any> = [];
  faTimes = faTimes;
  itemType = 'transaction';
  selectedId: any;
  status = true;
  bIsAnyGiftCardDiscount: boolean = false;
  aSelectedIds:any = [];
  isFor: any;
  bIsDisable:Boolean=false;
  oShowWarning = {
    bIsMoreTransaction: false,
    sMessage: ''
  }

  requestParams: any = {
    iBusinessId: "",
    aProjection: [
      '_id',
      'iBusinessId',
      'iProductId',
      'iSupplierId',
      'nQuantity',
      'sProductName',
      'nPriceIncVat',
      'nPurchasePrice',
      'nVatRate',
      'nPaymentAmount',
      'nRefundAmount',
      'oType',
      'sArticleNumber',
      'dCreatedDate',
      'dUpdatedDate',
      'iActivityItemId',
      'oArticleGroupMetaData',
      'sDescription',
      'sArticleNumber',
      'iLocationId'
    ]
  };
  bPriceEditMode = false;
  bAllSelected = false;
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private toastrService: ToastService,
    public tillService: TillService
    ) {
      const _injector = this.viewContainerRef.parentInjector;
      this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
      this.isFor = this.route?.snapshot?.queryParams?.isFor;
    }

  ngOnInit() {
    this.apiService.setToastService(this.toastrService);
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness');
    this.fetchTransactionItems();
  }

  getRelatedTransactionItem(iTransactionItemId: string) {
    return this.apiService.getNew('cashregistry', `/api/v1/transaction/item/related/${iTransactionItemId}?iBusinessId=${this.requestParams.iBusinessId}`).toPromise();
  }

  async fetchTransactionItems() {
    // console.log('TransactionItemsDetailsComponent fetchTransactionItems', this.transaction);
    this.requestParams.iTransactionId = this.transaction._id;
    let url = `/api/v1/transaction/item/transaction-items`;
    let aRelatedTransactionItem:any;
    if (this.itemType === 'activity') {
      delete this.requestParams.iTransactionId;
      let id;
      if (this.transaction?.iActivityId) id = this.transaction.iActivityId
      else id = this.transaction._id
      url = `/api/v1/activities/items/${id}`;
      /* If comes from the Activity-item then URL will change and it will fetch the AI */
      if (this.isFor !== 'activity' && this.transaction?.iActivityItemId) url = `/api/v1/activities/activity-item/${this.transaction.iActivityItemId}`;
    } else {
      /* fetching the related transaction-item detail if there is any mutiple pre-payment then need to change the payment-amount */
      aRelatedTransactionItem = await this.getRelatedTransactionItem(this.transaction?._id);

      if (aRelatedTransactionItem?.data?.length > 1) {
        // console.log('oShowWarning: ', this.oShowWarning);
        this.oShowWarning.bIsMoreTransaction = true;
        this.oShowWarning.sMessage = `THERE_IS_MORE_PREPAYMENT`;
      }
    }
    this.apiService.postNew('cashregistry', url, this.requestParams).subscribe((result: any) => {
      this.transactionItems = result.data[0].result;
      // console.log('orignal items', JSON.parse(JSON.stringify(this.transactionItems)))
      this.bIsAnyGiftCardDiscount = this.transactionItems.some((el: any) => el?.oType?.eKind === 'giftcard-discount')
      this.transactionItems = this.transactionItems.filter(o => !this.tillService.aDiscountTypes.includes(o.oType?.eKind));
      this.transactionItems.forEach(element => {
        if(!element.bIsRefunded && !element.oType?.bRefund){
          this.bIsDisable = true;
          element.isSelected = true;
        }
        // element.nDiscount = 0;
        // if (aRelatedTransactionItem?.data?.length && element.oType.eKind==='regular') element.nRevenueAmount = 0;
        // const elementDiscount = discountRecords.filter(o => o.sUniqueIdentifier === element.sUniqueIdentifier);
        // let nRedeemedLoyaltyPoints = 0;
        // let nDiscountnPaymentAmount  = 0;

        // elementDiscount.forEach(dElement => {
        //   // console.log({ dElement })
        //   if (dElement.oType.eKind === 'loyalty-points-discount' || dElement.oType.eKind === "discount" || dElement.oType.eKind === 'giftcard-discount'){
        //     nDiscountnPaymentAmount += dElement.nPaymentAmount || 0;
        //     // console.log('increased nDiscountnPaymentAmount', nDiscountnPaymentAmount)
        //   }
        // });
        // element.nDiscountnPaymentAmount = nDiscountnPaymentAmount;
        // if(!elementDiscount?.length) {
          //in original transaction, we have some with discounts so need to adjust them

          /* AS WE ARE NOW STORING DISCOUNT ON AN ACTIVITY ITEM ITSELF SO NO NEEDED TO LOOK INTO RELATED ITEMS */
          // const relatedItem = aRelatedTransactionItem?.data?.find((relatedItem:any)=>
          //   relatedItem.oType?.eKind === 'regular' &&
          //   relatedItem.nDiscount > 0 &&
          //   relatedItem._id !== element._id &&
          //   relatedItem.sUniqueIdentifier === element.sUniqueIdentifier);
          // if(relatedItem) {
          //   element.nDiscount = -(relatedItem.nDiscount);
          //   element.nPaidAmount += element.nDiscount;
          // }
        // }
        // console.log('before', { element, nQuantity: element.nQuantity, nPaidAmount: element.nPaidAmount, nPriceIncVat: element.nPriceIncVat, nDiscount: element.nDiscount})
        // element.nRedeemedLoyaltyPoints = nRedeemedLoyaltyPoints;
        const nDiscountAmount = +((element.bDiscountOnPercentage ? this.tillService.getPercentOf(element.nPriceIncVat, element?.nDiscount || 0) : element.nDiscount).toFixed(2));
        element.nDiscountToShow = (nDiscountAmount * element.nQuantity) + (element.nRedeemedLoyaltyPoints || 0) + (element?.nRedeemedGiftcardAmount || 0);
        // console.log({ nDiscountAmount, nDiscountToShow: element.nDiscountToShow })
        element.nPaymentAmount -= element.nDiscountToShow;
        element.nPaidAmount -= element.nDiscountToShow;
        // element.nPriceIncVat -= nDiscountAmount;
        // element.nRevenueAmount -= element.nDiscountToShow;
        element.nPaidAmount = +(element.nPaidAmount.toFixed(2));
        element.nPaymentAmount = +(element.nPaymentAmount.toFixed(2));
        element.nPriceIncVat = +(element.nPriceIncVat.toFixed(2));
        element.nRevenueAmount = +(element.nRevenueAmount.toFixed(2));
        // console.log('after', { nQuantity: element.nQuantity, nPaidAmount: element.nPaidAmount, nPriceIncVat: element.nPriceIncVat })
      });
      // this.transactionItems = this.transactionItems.map(v => ({ ...v }));
      if(this.transactionItems.every((item:any)=> item.isSelected)) this.bAllSelected = true;
      // console.log('this.transactionItems 168: ', JSON.parse(JSON.stringify(this.transactionItems)));
      this.transactionItems.forEach(item => {
        // console.log(168, {item})
        // const nTotalDiscount = (+((item?.bDiscountOnPercentage ? (item.nTotalAmount * item.nDiscount / 100) : item.nDiscount).toFixed(2)) * item.nQuantity)
        //                         + (item?.nRedeemedLoyaltyPoints || 0)
        //                         + (item?.nRedeemedGiftcardAmount || 0);
        // console.log('total amount', item.nTotalAmount, 'priceIncVat', item.nPriceIncVat, 'discount to show', item.nDiscountToShow, 'paid amount', item.nPaidAmount)
        item.sNumber = item.sNumber?.split('-')[0];
        const nTotalAmount = +(((item.nPriceIncVat * item.nQuantity) - item.nDiscountToShow).toFixed(2));
        item.nTotalAmount = nTotalAmount;
        // console.log(174, {nTotalAmount}, item.nTotalAmount)
        if (nTotalAmount == 0){
          // console.log('173 tType = empty')
          item.tType = '';
        } else if (item.nPaidAmount < nTotalAmount) {
          // console.log('175 setting to pay - paid amount', item.nPaidAmount, 'total amount', nTotalAmount, 'n discount to show', item.nDiscountToShow)
          item.tType = 'pay';
        } else if(item.nPaidAmount === nTotalAmount){
          // console.log('178 setting to refund - paid amount', item.nPaidAmount, 'total amount', item.nTotalAmount, 'n discount to show', item.nDiscountToShow)
          item.tType = 'refund';
        }
        if (item.oType?.bRefund) {
          // console.log('182 bRefund flag true setting item.tType refunded')
          item.tType = 'refunded';
        }
        if (this.aSelectedIds?.length && this.aSelectedIds.includes(item._id) || (this.selectedId && this.selectedId === item._id) &&  !item?.bIsRefunded) {
          item.isSelected = true;
        }
        if (this.itemType === 'transaction') { item.tType = 'refund'; }
      });
      if (this.dialogRef.context?.sBarcodeStartString == 'AI') {
        this.transactionItems = this.transactionItems.filter(item => this.aSelectedIds.includes(item._id));
      }
      // console.log(198, this.transactionItems)
    });
  }



  selectAll(event: any) {
    // this.transactionItems = this.transactionItems.map(v => ({ ...v, isSelected: $event.checked }));
    this.transactionItems.forEach(element => {
      if (element.bIsRefunded || element?.oType?.bRefund){
        element.isSelected = false;
        this.bIsDisable = false
      }else{
        element.isSelected = event.checked;
        if(event.checked) this.bIsDisable = true;
        else this.bIsDisable = false;
      }
    });
  }

  checkSelectedItem(index:any){
      for(const item of this.transactionItems){
        if(item?.isSelected){
          this.bIsDisable= true;
          break;
        }else{
          this.bIsDisable= false;
        }
      }
  }

  close(data: any, sFrom:string = '') {
    // console.log(201, 'closing from transaction item details', data);
    if(sFrom === 'close') {
      this.dialogRef.close.emit(data);
    } else {
      if(!data?.transactionItems?.filter((item:any)=> item.isSelected)?.length) {
        this.toastrService.show({ type: 'warning', text: 'Please select at least one item!' });
      } else {
        // console.log('here data', data?.transactionItems?.filter((item:any)=> item))
        if(data?.transactionItems?.filter((item:any)=> item.tType == '' && item.isSelected)?.length){
          this.toastrService.show({ type: 'warning', text: 'Please select action!' });
        }else{
          this.dialogRef.close.emit(data);
        }

      }
    }
  }

  saveEditedPrice(item:any){
    this.bPriceEditMode = false;
    item.bUpdating = true;

    const oBody = {
      iBusinessId: this.requestParams.iBusinessId,
      nPriceIncVat: parseFloat(item.nPriceIncVat),
      nTotalAmount: parseFloat(item.nPriceIncVat),
    }
    this.apiService.putNew('cashregistry', `/api/v1/activities/items/${item._id}`, oBody).subscribe((result:any) => {
      if(result?.data){
        item.bUpdating = false;
        this.toastrService.show({ type: 'success', text: 'Updated price successfully!' });
        if (item.nPaidAmount < ((item.nPriceIncVat - item.nDiscount) * item.nQuantity)) {
          item.tType = 'pay';
          this.bIsDisable = true;
        }
      }
    });
  }
}
