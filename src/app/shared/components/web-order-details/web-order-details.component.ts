import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faDownload, faEnvelope, faLongArrowAltDown, faLongArrowAltUp, faReceipt, faTimes, faUndoAlt } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent, DialogService } from '../../service/dialog';
import { ReceiptService } from '../../service/receipt.service';
import { MenuComponent } from '../../_layout/components/common';
import { TransactionItemsDetailsComponent } from '../transaction-items-details/transaction-items-details.component';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from '../toast';
import { TillService } from '../../service/till.service';
@Component({
  selector: 'app-web-order-details',
  templateUrl: './web-order-details.component.html',
  styleUrls: ['./web-order-details.component.scss']
})
export class WebOrderDetailsComponent implements OnInit {

  $element = HTMLInputElement
  dialogRef: DialogComponent;
  activityItems: Array<any> = [];
  business: any;
  
  iBusinessId = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem("currentLocation");
  webLocation: any = localStorage.getItem("webLocation") || this.iLocationId;
  iWorkstationId: any = localStorage.getItem("currentWorkstation");

  statuses = [
    { key: 'NEW', value: 'new' ,disabled: false,text:""},
    { key: 'PROCESSING', value: 'processing' ,disabled: false,text:""},
    { key: 'CANCELLED', value: 'cancelled' ,disabled: false,text:""},
    { key: 'COMPLETED', value: 'completed' ,disabled: false,text:""},
    { key: 'REFUND', value: 'refund' ,disabled: true,text:" (REFUND_NOT_POSSIBLE_YET_USE_REFUND_IN_STORE_INSTEAD)"},
    { key: 'REFUND_IN_CASH_REGISTER', value: 'refundInCashRegister',disabled: false ,text:""},
    { key: 'PAY_IN_CASH_REGISTER', value: 'payInCashRegister',disabled: false,text:"" }
  ]

  statusesForItems = [
    { key: 'NEW', value: 'new' },
    { key: 'PROCESSING', value: 'processing'},
    { key: 'CANCELLED', value: 'cancelled' },
    { key: 'COMPLETED', value: 'completed'},
   
  ]

  // statuses = ['new', 'processing', 'cancelled', 'completed', 'refund', 'refundInCashRegister', 'payInCashRegister'];
  //statusesForItems = ['new', 'processing', 'cancelled', 'completed'];
  FeStatus = '';
  
  carriers = ['PostNL', 'DHL', 'DPD', 'bpost','UPS','GLS','Amazon Logistics','DPD Local','Royal Mail','Parcelforce Woldwide',
  'CollectPlus',
  'Fedex',
  'APC Overnight', 'other'];
  faTimes = faTimes;
  faDownload = faDownload;
  faReceipt = faReceipt;
  faEnvelope = faEnvelope;
  faUndoAlt = faUndoAlt;
  faArrowUp = faLongArrowAltUp;
  faArrowDown = faLongArrowAltDown;
  customer: any;
  activity: any;
  transaction: any;
  loading: Boolean = false;
  
  transactions: Array<any> = [];
  nTotalPaidAmount: number = 0;
  nTotalGiftcardDiscount: number = 0;
  nTotalCouponDiscount:number = 0;
  nTotalDiscount: number = 0;

  quantity: number = 0;
  userDetail: any;
  showDeliverBtn: Boolean = false;
  showDetails: Boolean = true;
  downloading: Boolean = false;
  businessDetails: any;
  computerId: number | undefined;
  printerId: number | undefined;
  from: String = '';
  imagePlaceHolder: string = '../../../../assets/images/no-photo.svg';
  // printActionSettings: any;
  printSettings: any;
  aTemplates: any;
  requestParams: any = {
    iBusinessId: this.iBusinessId,
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
      'iActivityItemId']
  };
  selectedLanguage: string;
  //bIsSaving: boolean = false;
  oExtraServicesData: any;
  nTotalVat: number = 0;
  translate: any = [];
  bShowCompletedFields = false;
  
    
    constructor(
      private viewContainerRef: ViewContainerRef,
      private apiService: ApiService,
      private receiptService: ReceiptService,
      private dialogService: DialogService,
      private translateService: TranslateService,
      private toastService: ToastService,
    public tillService: TillService,
    private translationService: TranslateService
  ) {
    const _injector = this.viewContainerRef.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.selectedLanguage = this.translateService.currentLang;
  }

  async ngOnInit() {
    const translate = ['UPDATED_SUCCESSFULLY', 'SET_TRACKING_NUMBER_AND_CARRIER','MAIL_SEND_TO_CUSTOMER','SOMETHING_WENT_WRONG']
    this.translationService.get(translate).subscribe((res) => {
      this.translate = res;
    })
    // this.activity = this.dialogRef.context.activity;
    this.selectedLanguage = localStorage.getItem('language')?.toString() || navigator.language.substring(0, 2);
    if (this.from == 'web-orders' || this.from == 'web-reservations') {
      const index = this.statuses.findIndex((status: any) => status.value == 'cancelled');
      if (index > -1) this.statuses.splice(index, 1);
      const index2 = this.statusesForItems.findIndex((status: any) => status.value == 'cancelled');
      if (index2 > -1) this.statusesForItems.splice(index2, 1);
    }
    if (this.activity?.iCustomerId) this.fetchCustomer(this.activity.iCustomerId, -1);
    if (this.activity?.eActivityStatus != 'completed') this.showDeliverBtn = true;
    this.getPrintSetting();
    this.getBusinessLocations();
    this.fetchTransactionDetails();
    this.getPdfPrintSetting()
    // console.log(this.activity)
  }

  deliver(type: string) {
    const transactions = []
    for (const item of this.activityItems) {
      for (const receipt of item.receipts) { transactions.push({ ...receipt, iActivityItemId: item._id }) }
    }
    if (type == 'sentToCustomer') {
      if (!this.activity.eCarrier || this.activity.eCarrier == '') { //!this.activity.sTrackingNumber || this.activity.sTrackingNumber == '' THIS IS OPTIONAL SO COMMENTED
        this.toastService.show({ type: 'warning', text: this.translate['SET_TRACKING_NUMBER_AND_CARRIER'] });
        return;
      }
      this.generatePDF(false, 'sentToCustomer');
    }
    this.createStockCorrections(transactions, type)
  }

  createStockCorrections(transactions: any, type: string) {
    transactions.iBusinessId = this.iBusinessId;
    const data = {
      transactions,
      type,
      activity: this.activity,
      iBusinessId: this.iBusinessId
    }
    this.apiService.postNew('cashregistry', '/api/v1/transaction/item/stockCorrection/' + this.activity?._id, data)
      .subscribe((result: any) => {
        this.activityItems.forEach((item) => {
          item.eActivityItemStatus = 'completed';
        })
        this.showDeliverBtn = false;
      },
        (error) => {
          console.log(error);
        })
  }

  getPrintSetting() {
    let iWorkstationId = localStorage.getItem("currentWorkstation");
    this.apiService.getNew('cashregistry', `/api/v1/print-settings/${this.iBusinessId}/${iWorkstationId}`).subscribe(
      (result: any) => {
        this.computerId = result?.data?.nComputerId;
        this.printerId = result?.data?.nPrinterId;
      },
      (error: any) => {
        console.error(error)
      }
    );
  }

  // fetchBusinessDetails() {
  //   this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId)
  //     .subscribe(
  //       (result: any) => {
  //         this.businessDetails = result.data;
  //         console.log(173, this.businessDetails)

  //       })
  // }

  openTransaction(transaction: any, itemType: any) {
    transaction.iActivityId = this.activity._id;
    this.dialogService.openModal(TransactionItemsDetailsComponent, { cssClass: "modal-xl", context: { transaction, itemType } })
      .instance.close.subscribe((result: any) => {
        const transactionItems: any = [];
        if (result.transaction) {
          result.transactionItems.forEach((transactionItem: any) => {
            if (transactionItem.isSelected) {
              const { tType } = transactionItem;
              let paymentAmount = transactionItem.nQuantity * transactionItem.nPriceIncVat - transactionItem.nPaidAmount;
              if (tType === 'refund') {
                paymentAmount = -1 * transactionItem.nPaidAmount;
                transactionItem.oType.bRefund = true;
              } else if (tType === 'revert') {
                paymentAmount = transactionItem.nPaidAmount;
                transactionItem.oType.bRefund = false;
              };
              transactionItems.push({
                name: transactionItem.sProductName || transactionItem.sProductNumber,
                iActivityItemId: transactionItem.iActivityItemId,
                nRefundAmount: transactionItem.nPaidAmount,
                iLastTransactionItemId: transactionItem.iTransactionItemId,
                prePaidAmount: tType === 'refund' ? transactionItem.nPaidAmount : transactionItem.nPaymentAmount,
                type: transactionItem.sGiftCardNumber ? 'giftcard' : transactionItem.oType.eKind,
                eTransactionItemType: 'regular',
                nBrokenProduct: 0,
                tType,
                oType: transactionItem.oType,
                aImage: transactionItem.aImage,
                nonEditable: transactionItem.sGiftCardNumber ? true : false,
                sGiftCardNumber: transactionItem.sGiftCardNumber,
                iArticleGroupId: transactionItem.iArticleGroupId,
                quantity: transactionItem.nQuantity,
                price: transactionItem.nPriceIncVat,
                iRepairerId: transactionItem.iRepairerId,
                oArticleGroupMetaData: transactionItem.oArticleGroupMetaData,
                iEmployeeId: transactionItem.iEmployeeId,
                iBrandId: transactionItem.iBrandId,
                discount: 0,
                tax: transactionItem.nVatRate,
                paymentAmount,
                description: '',
                open: true,
              });
            }
          });
          result.transactionItems = transactionItems;
          localStorage.setItem('fromTransactionPage', JSON.stringify(result));
          localStorage.setItem('recentUrl', '/business/transactions');

          this.activityItems.forEach((obj: any) => {
            obj.eActivityItemStatus = this.activity.eActivityStatus;
          })
          // Need to find out some other option to change the status in this case.
          // this.updateActivity()

          setTimeout(() => {
            this.close(true);
          }, 100);
        }
      });
  }

  async getBusinessLocations() {
    const [oLocationResult, oExtraServicesResult]: any = await Promise.all([
      this.apiService.getNew('core', '/api/v1/business/user-business-and-location/list').toPromise(),
      this.apiService.getNew('cashregistry', `/api/v1/extra-services/${this.webLocation}?iBusinessId=${this.iBusinessId}`).toPromise()
    ]);
    this.oExtraServicesData = oExtraServicesResult.data;
    if (oLocationResult?.data) {
      this.userDetail = oLocationResult.data;
      if (this.userDetail?.aBusiness?.length) {
        // const oBusiness = this.userDetail.aBusiness.find((el: any) => el._id == this.iBusinessId);
        // if (oBusiness) this.business = oBusiness;
        this.fetchTransactionItems();
      }
    }
  }

  getTemplates(types: any) {
    const body = {
      iBusinessId: this.business._id,
      oFilterBy: {
        eType: types
      }
    }
    return this.apiService.postNew('cashregistry', `/api/v1/pdf/templates`, body);
  }

  getTemplate(type: string): Observable<any> {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/${this.iBusinessId}?eType=${type}&iLocationId=${this.iLocationId}`);
  }

  async generatePDF(print: boolean, sAction?: string) {
    const eType = this.activity.eType == 'webshop-reservation' ? 'webshop-revenue' : this.activity.eType;
    this.downloading = true;
    this.activity.businessDetails = this.businessDetails;
    this.activity.currentLocation = this.businessDetails.currentLocation;
    
    const [_template, _businessLogoUrl]: any = await Promise.all([
      this.getTemplate(eType).toPromise(),
      this.getBase64FromUrl(this.businessDetails?.sLogoLight).toPromise()
    ]);

    this.transaction.sBusinessLogoUrl = _businessLogoUrl.data;
    const template = _template.data;

    const oDataSource = {
      ...JSON.parse(JSON.stringify(this.transaction)),
      nTotalVat: +(this.nTotalVat.toFixed(2)),
      nTotalDiscount: +(this.nTotalDiscount.toFixed(2)),
      nTotalRedeemedLoyaltyPoints: 0,
      nTotalSavingPoints: 0,
      nTotalPaidAmount: +(this.nTotalPaidAmount.toFixed(2)),
      nTotalGiftcardDiscount: this.nTotalGiftcardDiscount,
      nTotalCouponDiscount: this.nTotalCouponDiscount,

    };

    oDataSource.businessDetails = this.tillService.processBusinessDetails(this.businessDetails, 'pdf');
    oDataSource.oCustomer = this.tillService.processCustomerDetails(this.customer);
    // {
    //   sFirstName: this.customer?.sFirstName || '',
    //   sLastName: this.customer?.sLastName || '',
    //   sEmail: this.customer?.sEmail || '',
    //   sMobile: this.customer?.oPhone?.sCountryCode || '' + this.customer?.oPhone?.sMobile || '',
    //   sLandLine: this.customer?.oPhone?.sLandLine || '',
    // };

    oDataSource.aTransactionItems = this.activityItems;//.filter((item:any) => !this.tillService.aDiscountTypes.includes(item.oType.eKind));
    oDataSource.sActivityNumber = this.activity.sNumber;
    oDataSource.aTransactionItems.forEach((item: any) => {
      // console.log({item})
      // item.sProductName = item?.receipts[0]?.sProductNumber || this.getName(item);
      // item.sArticleGroupName = '';
      // const aLang = Object.keys(item?.oArticleGroupMetaData?.oName || {});
      // console.log(aLang, 'selectedLanguage',this.selectedLanguage)
      // if (aLang?.length && aLang.includes(this.selectedLanguage)) item.sArticleGroupName = item.oArticleGroupMetaData?.oName[this.selectedLanguage];
      
      item.sActivityItemNumber = item.sNumber;
      // item.nSavingsPoints = this.getSavingPoint(item);
      // item.sOrderDescription = item.sProductName + '\n' + item?.sDescription || '';
      
      // oDataSource.totalRedeemedLoyaltyPoints += item?.nRedeemedLoyaltyPoints || 0;
      // oDataSource.totalSavingPoints += parseFloat(item.nSavingsPoints);
    });
    // oDataSource.totalVat = +(oDataSource.totalVat.toFixed(2))
    const oSettings = this.printSettings?.find((s: any) => s.sType === 'regular' && s.sMethod === 'pdf')
    // console.log(363, {oDataSource})
    oDataSource?.aPayments?.forEach((oPayment:any)=>{
      oPayment.sMethod = this.translateService.instant(oPayment.sMethod.toUpperCase());
      if(!oPayment?.sRemarks) oPayment.sRemarks = "";
    });
    const response = await this.receiptService.exportToPdf({
      oDataSource,
      pdfTitle: oDataSource.sNumber,
      templateData: template,
      printSettings: oSettings,
      // printActionSettings: this.printActionSettings,
      // eSituation: 'is_created',
      sAction: (sAction) ? sAction : (print) ? 'print' : 'download',
      sApiKey: this.businessDetails?.oPrintNode?.sApiKey
    }).toPromise();

    if (sAction == 'sentToCustomer') {
      this.sendMailToCustomer(response);
    }
  }

  async fetchTransactionItems() {
    this.loading = true;
    const result:any = await this.apiService.postNew('cashregistry', `/api/v1/activities/items/${this.activity._id}`, this.requestParams).toPromise();
    if (result.data?.length && result.data[0].result?.length) this.processWebItems(result.data[0].result);
    this.loading = false;
    
    setTimeout(() => {
      MenuComponent.reinitialization();
    }, 200);

  }

  processWebItems(aItems: any) {
    // console.log(JSON.parse(JSON.stringify(aItems)));
    let completed = 0, refunded = 0;
    const aDiscountTypes = ['discount', 'giftcard-discount', 'coupon-discount'];
    // aItems.sort((item1: any, item2: any) => !item1?.iBusinessProductId ? -1 : (!item2?.iBusinessProductId ? -1 : (item2.iBusinessProductId - item1.iBusinessProductId)))
    // const aDiscountItems = aItems.filter((el: any) => aDiscountTypes.includes(el.oType.eKind));
    // console.log({ aDiscountTypes });
    this.activityItems = this.reOrderItems(aItems.filter((el: any) => !aDiscountTypes.includes(el.oType.eKind)));
    // console.log(JSON.parse(JSON.stringify(this.activityItems)));
    this.activityItems.forEach((oItem: any) => {
      // console.log(oItem.oType.eKind);
      oItem.bRegular = oItem.oType.eKind == 'regular';
      if (oItem.bRegular) this.tillService.calculateDiscount(oItem);
      if (!oItem?.nDiscountToShow) oItem.nDiscountToShow = 0;
      if (!oItem?.nCouponDiscount) oItem.nCouponDiscount = 0;
      if (!oItem?.nRedeemedGiftcardAmount) oItem.nRedeemedGiftcardAmount = 0;

      this.nTotalDiscount += (oItem.nDiscountToShow * oItem.nQuantity);
      this.nTotalCouponDiscount += oItem.nCouponDiscount;
      this.nTotalGiftcardDiscount += oItem.nRedeemedGiftcardAmount;
      
      oItem.nPriceIncVatAfterDiscount = (oItem.nPriceIncVat - oItem.nDiscountToShow) * oItem.nQuantity - oItem?.nCouponDiscount - oItem?.nRedeemedGiftcardAmount;
      oItem.nPaymentAmount -= (oItem?.nCouponDiscount + oItem?.nRedeemedGiftcardAmount)
      
      this.tillService.calculateVat(oItem);
      this.nTotalVat += oItem.vat;
      // console.log({ 
      //   nTotalDiscount: this.nTotalDiscount, 
      //   nTotalCouponDiscount: this.nTotalCouponDiscount, 
      //   nTotalGiftcardDiscount: this.nTotalGiftcardDiscount, 
      //   nTotalVat: this.nTotalVat})
      oItem.sProductName = '';
      if (oItem.bRegular) {
        if (oItem.oBusinessProductMetaData?.oName && Object.keys(oItem.oBusinessProductMetaData?.oName)?.length) {
          oItem.sProductName = oItem.oBusinessProductMetaData?.oName[this.selectedLanguage] || oItem.oBusinessProductMetaData?.oName['en'];
        }
        oItem.nPaymentAmount -= oItem.nDiscountToShow;
      }
      oItem.sArticleGroupName = '';
      if (oItem.oArticleGroupMetaData?.oName && Object.keys(oItem.oArticleGroupMetaData?.oName)?.length){
        oItem.sArticleGroupName = oItem.oArticleGroupMetaData?.oName[this.selectedLanguage] || oItem.oArticleGroupMeta?.oName['en'] || '';
      }

      if (oItem.oType.eKind == 'engraving') {
        oItem.sArticleGroupName = this.translateService.instant(this.oExtraServicesData.sTermForEngraving.toUpperCase());
        oItem.eKindName = oItem.sArticleGroupName;
      } else {
        oItem.eKindName = oItem.oType.eKind.replace('-', '_').toUpperCase();
      }

      // console.log(oItem.eKindName, oItem.oType.eKind)

      if (['completed', 'refund', 'refundInCashRegister'].includes(oItem.eActivityItemStatus)) completed += 1;
      if (['refund', 'refundInCashRegister'].includes(oItem.eActivityItemStatus)) refunded += 1;


      oItem.receipts?.forEach((oReceipt: any) => {
        // if (!oReceipt?.iStockLocationId && oReceipt?.iLocationId) {
        //   oReceipt.iStockLocationId = oReceipt.iLocationId;
        // }

        if (oReceipt?.iStockLocationId) {
          const oLocation = this.businessDetails.aLocation.find((el: any) => el._id == oReceipt.iStockLocationId);
          if (oLocation) oReceipt.locationName = oLocation.sName;
          // this.setSelectedBusinessLocation(item.iStockLocationId, i, j)
        }

        this.nTotalPaidAmount += oItem.nPaymentAmount * oReceipt.nQuantity;
        this.quantity += oReceipt.bRefund ? (- oReceipt.nQuantity) : oReceipt.nQuantity
      });

    });
    if (completed == this.activityItems?.length) { this.FeStatus = `completed (Refunded: ${refunded}/${this.activityItems?.length})` }
    else if (completed) { this.FeStatus = `Partly Completed (Refunded: ${refunded}/${this.activityItems?.length})` }
    else this.FeStatus = 'New';
    this.checkShowCompletedFields();
    // console.log('final - ', this.activityItems);
  }

  reOrderItems(aItems:any){
    const aOrderedItems:any = [];
    const aRegularItems = aItems.filter((el: any) => el.oType.eKind == 'regular');
    aRegularItems.forEach((oRegular: any) => {
      // console.log('oRegular', JSON.parse(JSON.stringify(oRegular)))
      const aRelatedItems = aItems.filter((oRelated: any) => oRelated.sUniqueIdentifier == oRegular.sUniqueIdentifier && !['regular','shipping-cost'].includes(oRelated.oType.eKind));
      aOrderedItems.push(oRegular, ...aRelatedItems);
      // console.log('aRelatedItems',JSON.parse(JSON.stringify(aRelatedItems)))
    });
    
    // console.log('after', JSON.parse(JSON.stringify(aOrderedItems)))
    const oShippingCostItem = aItems.find((el: any) => el.oType.eKind == 'shipping-cost');
    // console.log({ oShippingCostItem })
    if (oShippingCostItem) {
      // console.log('pushing now shipping cost')
      aOrderedItems.push(oShippingCostItem);
    }
    return aOrderedItems;
  }

  //  Function for fetch transaction details for print receipt
  fetchTransactionDetails() {
    this.apiService.postNew('cashregistry', `/api/v1/transaction/activity/${this.activity._id}`, { iBusinessId: this.iBusinessId }).subscribe(async (result: any) => {
        if (result?.data?.length) {
          this.transaction = result.data[0];
          this.transaction.businessDetails = this.businessDetails;
          this.transaction.currentLocation = this.businessDetails.currentLocation;
          this.checkShowCompletedFields();
          // console.log(this.transaction)
          // this.transaction = await this.tillService.processTransactionForPdfReceipt(this.transaction);
          // console.log(427, this.transaction)
        }
      }
    );
  }
  
  // setSelectedBusinessLocation(locationId: string, parentIndex: number, index: number) {
  //   console.log('setSelectedBusinessLocation', this.activityItems, {locationId, parentIndex, index})
  //   this.business.aInLocation.map(
  //     (location: any) => {
  //       if (location._id == locationId)
  //         this.activityItems[parentIndex].receipts[index].locationName = location.sName;
  //     })
  // }

  // togglePayInCashRegister(event: any){}

  checkAllLocations() {
    let flag = false;
    for (let i = 0; i < this.activityItems.length; i++) {
      const obj = this.activityItems[i];
      for (let j = 0; j < obj.receipts.length; j++) {
        const item = obj.receipts[j];
        if (!item.iStockLocationId && item?.iBusinessProductId) flag = true;
      }
    }
    return flag;
  }

  getName(item: any) {
    if (item?.oArticleGroupMetaData?.oName?.en == 'product shipping') return 'Shipping costs';
    if (item?.oArticleGroupMetaData?.oName?.en == 'product engraving') return 'product engraving';
    if (item?.oArticleGroupMetaData?.oName?.en == 'product Basic gift wrap') return 'Basic gift wrap';
    return '';
  }

  selectBusiness(index: number, location?: any) {
    if (location?._id) {
      this.activityItems[index].receipts[0].locationName = location.sName;
      this.activityItems[index].receipts[0].iStockLocationId = location._id;
    }
    this.updateTransaction(this.activityItems[index].receipts[0]);
  }

  updateTransaction(transaction: any) {
    this.loading = true;
    transaction.iBusinessId = this.iBusinessId;
    this.apiService.putNew('cashregistry', '/api/v1/transaction/item/StockLocation/' + transaction?._id, transaction)
    .subscribe((result: any) => {
      this.loading = false;
      this.toastService.show({ type: 'success', text: this.translate['UPDATED_SUCCESSFULLY'] });
      this.checkShowCompletedFields();
    },
      (error) => {
        this.loading = false;
        this.toastService.show({ type: 'warning', text: this.translate['SOMETHING_WENT_WRONG'] });
      })
  }


  fetchCustomer(customerId: any, parentIndex: number) {
    this.apiService.getNew('customer', `/api/v1/customer/${customerId}?iBusinessId=${this.iBusinessId}`).subscribe(
      (result: any) => {
        if (parentIndex > -1) this.activityItems[parentIndex].customer = result;
        else this.customer = result;
      },
      (error: any) => {
        console.error(error)
      }
    );
  }


  changeStatusForAll(status: string) {
    if (status == 'refundInCashRegister' || status == 'payInCashRegister') {
      this.openTransaction(this.activity, 'activity');
    } else if (status == 'completed') {
    } else {
      this.activityItems.forEach((obj: any) => {
        obj.eActivityItemStatus = status;
      })
      this.updateActivity()
    }
  }

  changeTrackingNumberForAll(sTrackingNumber: string) {
    this.activityItems.forEach((obj: any) => {
      obj.sTrackingNumber = sTrackingNumber;
    })
    this.updateActivity();
  }

  changeCarrierForAll(eCarrier: string) {
    this.activityItems.forEach((obj: any) => {
      obj.eCarrier = eCarrier;
    })
    this.updateActivity();
  }

  updateActivityItem(item: any) {
    this.loading = true;
    item.iBusinessId = this.iBusinessId;
    this.apiService.putNew('cashregistry', '/api/v1/activities/items/' + item?.iActivityItemId, item)
      .subscribe((result: any) => {
        this.loading = false;
        this.toastService.show({ type: 'success', text: this.translate['UPDATED_SUCCESSFULLY'] });
      },
        (error) => {
          this.loading = false;
          this.toastService.show({ type: 'warning', text: this.translate['SOMETHING_WENT_WRONG'] });
        })
  }

  updateActivity() {
    this.loading = true;
    this.apiService.putNew('cashregistry', '/api/v1/activities/' + this.activity?._id, this.activity)
      .subscribe(
        (result: any) => {
          this.loading = false;
          this.toastService.show({ type: 'success', text: this.translate['UPDATED_SUCCESSFULLY'] });
          this.checkShowCompletedFields();
        },
        (error) => {
          this.loading = false;
          this.toastService.show({ type: 'warning', text: this.translate['SOMETHING_WENT_WRONG'] });
        }
      )
  }
  checkShowCompletedFields() {
    let bCondition1 = true;
    this.activityItems.forEach((oItem:any) => {
      if (oItem.oType.eKind == 'regular' && !oItem.receipts[0].iStockLocationId) {
        bCondition1 = false;
      }
    })
    const bCondition2 = this.activity.eActivityItemStatus == 'completed';
    
    // console.log(639, this.activity, this.activityItems, {bCondition1, bCondition2});
    this.bShowCompletedFields = bCondition1 && bCondition2;
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  // submit(event: any) {
  //   event.target.disabled = true;
  //   this.bIsSaving = true;
  // }

  getPdfPrintSetting() {
    const oBody = {
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId
    }
    this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, oBody).subscribe((result:any) => {
      if(result?.data?.length && result?.data[0]?.result?.length) {
        this.printSettings = result?.data[0]?.result;
      }
    });
  }

  getBase64FromUrl(url: any): Observable<any> {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.iBusinessId}?url=${url}`);
  }

  getSavingPoint(item: any) {
    let activityDetails = this.activity.activityitems.filter((aItem: any) => aItem._id == item._id)[0];
    return activityDetails.nSavingsPoints || '0';
  }

  async thermalPrintWebOrder() {
    const oDataSource = JSON.parse(JSON.stringify(this.transaction));
    oDataSource.businessDetails = this.businessDetails;
    oDataSource.businessDetails.sMobile = this.businessDetails?.oPhone?.sMobile || '';
    // const locationIndex = this.businessDetails.aLocation.findIndex((location: any) => location._id == this.iLocationId);
    // const currentLocation = this.businessDetails.aLocation[locationIndex];
    oDataSource.sAddressline1 = this.transaction.currentLocation.oAddress.street + " " + 
      this.transaction.currentLocation.oAddress.houseNumber + " " + 
      this.transaction.currentLocation.oAddress.houseNumberSuffix + " ,  " + 
      this.transaction.currentLocation.oAddress.postalCode + " " + 
      this.transaction.currentLocation.oAddress.city;

    oDataSource.sAddressline2 = this.transaction.currentLocation.oAddress.country;

    oDataSource.oCustomer = {
      sFirstName: this.customer?.sFirstName || '',
      sLastName: this.customer?.sLastName || '',
      sEmail: this.customer?.sEmail || '',
      sMobile: this.customer?.oPhone?.sCountryCode || '' + this.customer?.oPhone?.sMobile || '',
      sLandLine: this.customer?.oPhone?.sLandLine || '',
    };

    oDataSource.sBusinessLogoUrl = (await this.getBase64FromUrl(oDataSource?.businessDetails?.sLogoLight).toPromise()).data;
    oDataSource.aTransactionItems = this.activityItems;
    oDataSource.sActivityNumber = oDataSource.sNumber;
    await this.receiptService.printThermalReceipt({
      oDataSource: oDataSource,
      printSettings: this.printSettings,
      sAction: 'thermal',
      apikey: this.businessDetails.oPrintNode.sApiKey
    }).toPromise();
  }

  sendMailToCustomer(pdfContent: any) {
    const body = {
      pdfContent,
      iTransactionId: this.transaction._id,
      iActivityId: this.activity._id,
      sTrackingNumber: this.activity.sTrackingNumber,
      eCarrier: this.activity.eCarrier,
      businessDetails: this.businessDetails
    }

    this.apiService.postNew('cashregistry', '/api/v1/till/send-to-customer', body).subscribe(
      (result: any) => {
        if (result) {
          this.toastService.show({ type: 'success', text: this.translate['MAIL_SEND_TO_CUSTOMER'] });
        }
      }, (error: any) => {
        this.toastService.show({ type: 'warning', text: this.translate['SOMETHING_WENT_WRONG'] });

      }
    )
  }
}
