import { Component, OnInit } from '@angular/core';
import { DialogComponent, DialogService } from '../../service/dialog';
import { ViewContainerRef } from '@angular/core';
import { ApiService } from '../../../shared/service/api.service';
import { faTimes, faShare, faMessage, faEnvelope, faEnvelopeSquare, faUser, faUpload, faReceipt, faEuro, faChevronRight, faDownload, faPrint,faPhone, faAt } from "@fortawesome/free-solid-svg-icons";
import { TransactionItemsDetailsComponent } from '../transaction-items-details/transaction-items-details.component';
import { MenuComponent } from '../../_layout/components/common';
import { NavigationEnd, Router } from '@angular/router';
import { TransactionDetailsComponent } from '../../../transactions/components/transaction-details/transaction-details.component';
import { ReceiptService } from '../../service/receipt.service';
import { Observable } from 'rxjs';
import { ToastService } from '../toast';
import { TranslateService } from '@ngx-translate/core';
import { TillService } from '../../service/till.service';
import { AddFavouritesComponent } from '../add-favourites/favourites.component';
import { Clipboard } from '@angular/cdk/clipboard';
import { animate, style, transition, trigger } from '@angular/animations';
import { CustomerDetailsComponent } from '../customer-details/customer-details.component';
import { CustomerSyncDialogComponent } from '../customer-sync-dialog/customer-sync-dialog.component';
import { PdfService } from '../../service/pdf.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { CustomerDialogComponent } from '../customer-dialog/customer-dialog.component';
import * as _ from 'lodash';
@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('500ms', style({ opacity: 0 }))
      ])
    ])
  ]
})

export class ActivityDetailsComponent implements OnInit {
  $element = HTMLInputElement
  dialogRef: DialogComponent;
  customer: any;
  activity: any;
  createrDetail: any;
  webOrders: boolean | undefined;
  items: Array<any> = [];
  from: string;
  mode: string = '';
  showLoader = false;
  activityItems: Array<any> = [];
  imagePlaceHolder: string = '../../../../assets/images/no-photo.svg';
  faTimes = faTimes;
  faMessage = faMessage;
  faUpload = faUpload;
  faPhone = faPhone;
  faAt = faAt;
  faEnvelope = faEnvelope;
  faShare = faShare;
  faEnvelopeSquare = faEnvelopeSquare;
  faUser = faUser;
  faPrint = faPrint;
  faReceipt = faReceipt;
  faEuro = faEuro;
  faChevronRight = faChevronRight;
  faDownload = faDownload;
  submitted = false;
  repairStatus = [
    { key: 'NEW', value: 'new'},
    { key: 'INFO', value: 'info' },
    { key: 'PROCESSING', value: 'processing' },
    { key: 'CANCELLED', value: 'cancelled' },
    { key: 'INSPECTION', value: 'inspection' },
    { key: 'COMPLETED', value: 'completed' },
    { key: 'REFUNDINCASHREGISTER', value: 'refundInCashRegister' },
    { key: 'OFFER', value: 'offer' },
    { key: 'OFFER_IS_OK', value: 'offer-is-ok' },
    { key: 'OFFER_IS_NOT_OK', value: 'offer-is-not-ok' },
    { key: 'TO_REPAIR', value: 'to-repair' },
    { key: 'PART_ARE_ORDER', value: 'part-are-order' },
    { key: 'SHIPPED_TO_REPAIR', value: 'shipped-to-repair' },
    { key: 'DELIVERED', value: 'delivered' },
    { key: 'PRODUCT_ORDERED', value: 'product-ordered' },
    { key: 'ORDER_READY', value: 'order-ready' },
  ]

  tableUsageHistoryHeaders: Array<any> = [
    { key: 'CREATED_DATE', disabled: true},
    { key: 'RECEIPT_NUMBER', disabled: true },
    { key: 'AMOUNT_USED', disabled: true },
    { key: '', disabled: true }
  ]

  carriers = ['PostNL', 'DHL', 'DPD', 'bpost', 'other'];
  printOptions = ['Portrait', 'Landscape'];
  itemType = 'transaction';
  customerReceiptDownloading: Boolean = false;
  loading: Boolean = false;
  bIsVisible: Boolean = false;
  iBusinessId = localStorage.getItem('currentBusiness');
  transactions: Array<any> = [];
  totalPrice: Number = 0;
  quantity: Number = 0;
  userDetail: any;
  business: any;
  oLocationName: any= "";
  businessDetails: any;
  iLocationId: String = '';
  language: any;
  showDetails: Boolean = true;
  loadCashRegister: Boolean = false;
  openActivityId: any;
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
      'iActivityItemId',
      'sBusinessPartnerName',
      'iBusinessPartnerId',
      'iBusinessBrandId',
      'iBrand',
      'iAssigneeId',
      'iBusinessProductId',
      'oCustomer'
    ]
  };
  filteredEmployees: Array<any> = [];
  employeesList: Array<any> = [];
  brandsList: Array<any> = [];
  filteredBrands: Array<any> = [];
  supplierOptions: Array<any> = [];
  suppliersList: Array<any> = [];
  bFetchingTransaction: boolean = false;
  px2mmFactor !: number;
  printSettings: any;
  printActionSettings: any;
  iWorkstationId: string;
  aTemplates: any;
  eKindValue = ['discount', 'loyalty-points-discount', 'loyalty-points'];
  oCurrentCustomer: any = {}; /* We are having the same oCustomer for Activity, ActivityItem and Transaction */
  eKindValueForLayout = [
    'regular',
    'expenses',
    'reservation',
    // below types used in cash register and webshop
    'empty-line',
    // below types only used in cash register
    'repair',
    'order',
    'gold-sell',
    'loyalty-points-discount',
    'giftcard-discount',

    'loyalty-points',
    'discount',
    'payment-discount',
    'offer',
    'refund'
  ];
  // eKindForLayoutHide =['giftcard'];
  translation: any = [];
  bShowOrderDownload: boolean = false;
  routerSub: any;
  bActivityPdfGenerationInProgress: boolean = false;
  bCustomerReceipt: boolean = false;
  bDownloadCustomerReceipt: boolean = false;
  bDownloadReceipt: boolean = false;
  showSystemCustomer:boolean = false;
  aContactOption = [{ key: 'CALL_ON_READY', value: 'call_on_ready' },
  { key: 'EMAIL_ON_READY', value: 'email_on_ready' },
  { key: 'WHATSAPP_ON_READY', value: 'whatsapp_on_ready' }]
  sNumber:any;
  aDiscountRecords: any;
  sMessage:any;
  aArticleGroup: any;
  bShowWarning: boolean = false;
  aCustomerDifferences:  any = [];

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private dialogService: DialogService,
    private routes: Router,
    private receiptService: ReceiptService,
    private pdfService: PdfService,
    private toastService: ToastService,
    private translationService: TranslateService,
    public tillService: TillService,
    private clipboard: Clipboard
  ) {
    const _injector = this.viewContainerRef.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.iWorkstationId = localStorage.getItem("currentWorkstation") || '';
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.language = localStorage.getItem('language') || 'en';
  }

  async ngOnInit() {
    // console.log(this.activity, this.activityItems)
    this.sNumber = (this.from === 'services') ? this.activity.sNumber : '';
    this.getSettings();
    this.apiService.setToastService(this.toastService);
    this.routerSub = this.routes.events.subscribe((event) => {
      if (event instanceof NavigationEnd && !(event.url.startsWith('/business/activity-items') || event.url.startsWith('/business/services'))) {
        this.routerSub.unsubscribe();
        this.close(false);
      }
    });

    let translationKey = ['SUCCESSFULLY_UPDATED', 'NO_DATE_SELECTED', 'NO_PHONE', 'NO_EMAIL','NO_PREFIX', 'PLEASE_ADD_COUNTRY_CODE_IN_CUSTOMER_DATA', 'NO_PHONE_OR_WHATSAPP'];
    this.translationService.get(translationKey).subscribe((res: any) => {
      this.translation = res;
    })
    if (this.activity) {
      this.sNumber = this.activity.sNumber;
      this.bShowOrderDownload = true;
      this.fetchTransactionItems(this.activity._id);
    } else {
      if(this.activityItems && this.activityItems.length>0){
        this.sNumber = this.activityItems[0].sNumber;
        this.oLocationName = this.businessDetails?.aLocation.find((location: any) => location._id === this.activityItems[0].iLocationId)?.sName;
      } else {
        this.oLocationName ="";
      }
      if(this.activityItems[0].bMigrate || this.activityItems[0].bImported) this.bShowWarning = true;
      if(!(this.activityItems[0].bMigrate || this.activityItems[0].bImported) || this.activityItems[0]?.eActivityItemStatus != 'delivered'){
        this.fetchActivity(this.activityItems[0].iActivityId);
      }
      this.fetchTransactionItems(this.activityItems[0]._id);
      if(this.activityItems[0]?.iCustomerId) this.getSystemCustomer(this.activityItems[0]?.iCustomerId);
    }

    this.getBusinessLocations();
    this.getListSuppliers()
    this.getBusinessBrands();
    this.getAllArticleGroups();

    const [_printActionSettings, _printSettings]: any = await Promise.all([
      this.getPdfPrintSetting({ oFilterBy: { sMethod: 'actions' } }),
      this.getPdfPrintSetting({ oFilterBy: { sType: ['repair', 'order', 'repair_alternative', 'giftcard'] } }),
    ]);
    this.printActionSettings = _printActionSettings?.data[0]?.result[0].aActions;
    this.printSettings = _printSettings?.data[0]?.result;
  }

  getAllArticleGroups() {
    const oBody = {
      iBusinessId: this.iBusinessId,
    }
    this.apiService.postNew('core', '/api/v1/business/article-group/list', oBody).subscribe((result:any) => {
      if(result?.data?.length && result.data[0]?.result?.length){
        this.aArticleGroup = result.data[0]?.result;

        this.aArticleGroup.forEach((articleGroup:any) => {
            if(articleGroup.oName != undefined){
              articleGroup.oName = articleGroup.oName[this.language];
            }
        });
      }
    });
  }


  getSettings() {
    this.apiService.getNew('customer', `/api/v1/customer/settings/get/${this.iBusinessId}`).subscribe((result: any) => {
      if (result?.sMessage) {
        this.sMessage = result?.sMessage;
      }
    }, (error) => {
      console.log(error);
    })
  }
  
  getSystemCustomer(iCustomerId: string) {
    this.apiService.getNew('customer', `/api/v1/customer/${this.iBusinessId}/${iCustomerId}`).subscribe((result: any) => {
      if (result?.data) {
        this.customer = result?.data;
        this.matchSystemAndCurrentCustomer(this.customer, this.oCurrentCustomer);
      }
    })
  }

  fetchActivity(_id: any) {
    this.apiService.getNew('cashregistry', `/api/v1/activities/${_id}?iBusinessId=${this.requestParams.iBusinessId}`).subscribe((result: any) => {
      if (result?.data?._id)
        this.activity = result.data;
    });
  }

  openImageModal(activityindex: any) {
    this.dialogService.openModal(ImageUploadComponent, { cssClass: "modal-m", context: { mode: 'create' } })
      .instance.close.subscribe(result => {
        if (result.url)
          this.activityItems[activityindex].aImage.push(result.url);
      });
  }

  getBusinessProduct(iProductId: any) {
    return this.apiService.getNew('core', `/api/v1/business/products/${iProductId}?iBusinessId=${this.iBusinessId}`);
  }

  getListEmployees() {
    if (this.activity?.iEmployeeId) {
      let createerIndex = this.employeesList.findIndex((employee: any) => employee._id == this.activity.iEmployeeId);
      if (createerIndex != -1) {
        this.createrDetail = this.employeesList[createerIndex];
        this.activity.sAdvisedEmpFirstName = this.createrDetail?.sFirstName || 'a';
      }
    }

    this.employeesList.map(o => o.sName = `${o.sFirstName} ${o.sLastName}`);
    if (this.activityItems[0]?.iEmployeeId) {
      let createerIndex = this.employeesList.findIndex((employee: any) => employee._id == this.activityItems[0].iEmployeeId);
      if (createerIndex != -1) {
        this.createrDetail = this.employeesList[createerIndex]
      }
    }
    this.activityItems.forEach((items: any, index: any) => {
      let employee = this.employeesList.find((employee: any) => employee._id === items.iAssigneeId);
      if (employee) {
        this.activityItems[index] = { ...items, "employeeName": employee.sName }
      }
    })
  }

  getListSuppliers() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    let url = '/api/v1/business/partners/supplierList';
    this.apiService.postNew('core', url, oBody).subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.suppliersList = result.data[0].result;
      }
    }, (error) => {
    });
  }

  getBusinessBrands() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    this.apiService.postNew('core', '/api/v1/business/brands/list', oBody).subscribe((result: any) => {
      if (result.data && result.data.length > 0) {
        this.brandsList = result.data[0].result;
        this.activityItems.forEach((items: any, index: any) => {
          let brandIndex = this.brandsList.findIndex((brand: any) => brand._id == items.iBusinessBrandId);
          if (brandIndex != -1) {
            this.activityItems[index] = { ...items, "brandName": this.brandsList[brandIndex].sName }
          }
        })
      }
    })
  }
  // Function for search suppliers
  searchSuppliers(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.supplierOptions = this.suppliersList.filter((supplier: any) => {
        return supplier.sName && supplier.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  // Function for search suppliers
  searchEmployees(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredEmployees = this.employeesList.filter((employee: any) => {
        return employee.sName && employee.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }

  }

  // Function for search suppliers
  searchBrands(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredBrands = this.brandsList.filter((brands: any) => {
        return brands.sName && brands.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  removeBrands(index: any) {
    this.activityItems[index].brandName = null;
    this.activityItems[index].iBusinessBrandId = null;
  }

  removeSuppliers(index: any) {
    this.activityItems[index].iBusinessPartnerId = null;
    this.activityItems[index].sBusinessPartnerName = null;
  }

  removeEmployeees(index: any) {
    this.activityItems[index].iAssigneeId = null;
    this.activityItems[index].employeeName = null;
  }
  onEmployeeChange(e: any, index: any) {
    this.activityItems[index].iAssigneeId = e._id;
    this.activityItems[index].employeeName = e.sName;
    // this.employee = e.sName
  }
  onSupplierChange(e: any, index: any) {
    this.activityItems[index].iBusinessPartnerId = e._id;
    this.activityItems[index].sBusinessPartnerName = e.sName;
    // this.supplier = e.sName
  }
  onBrandChange(e: any, index: any) {
    this.activityItems[index].brandName = e.sName;
    this.activityItems[index].iBusinessBrandId = e._id;
    this.activityItems[index].iBrand = e.iBrandId;
  }

  downloadOrder() { }

  changeStatusForAll(type: string) {
    this.activityItems.forEach((obj: any) => {
      obj.eRepairStatus = type;
      this.updateActivityItem(obj)
    })
  }

  changeTrackingNumberForAll(sTrackingNumber: string) {
    this.activityItems.forEach((obj: any) => {
      obj.sTrackingNumber = sTrackingNumber;
      this.updateActivityItem(obj)
    })
  }

  changeCarrierForAll(eCarrier: string) {
    this.activityItems.forEach((obj: any) => {
      obj.eCarrier = eCarrier;
      this.updateActivityItem(obj)
    })
  }

  updateActivityItem(item: any) {
    item.iBusinessId = this.iBusinessId;
    this.apiService.putNew('cashregistry', '/api/v1/activities/items/' + item?.iActivityItemId, item)
      .subscribe((result: any) => {
      },
        (error) => {
        })
  }

  removeImage(activityindex: any, imageIndex: any) {
    this.activityItems[activityindex].aImage.splice(imageIndex, 1);
  }
  openImage(activityindex: any, imageIndex: any) {
    const url = this.activityItems[activityindex].aImage[imageIndex];
    window.open(url, "_blank");
  }

  openCustomer(customer: any) {
    this.dialogService.openModal(CustomerDetailsComponent,
      { cssClass: "modal-xl position-fixed start-0 end-0", context: { customerData: customer, mode: 'details', editProfile: false } }).instance.close.subscribe(result => { });
  }

  getBusinessLocations() {
    this.apiService.getNew('core', '/api/v1/business/user-business-and-location/list')
      .subscribe((result: any) => {
        if (result.message == "success" && result?.data) {
          this.userDetail = result.data;
          if (this.userDetail.aBusiness) {
            this.userDetail.aBusiness.map(
              (business: any) => {
                if (business._id == this.iBusinessId) {
                  this.business = business;
                  // this.businessDetails = business;
                  this.tillService.selectCurrency(this.business?.aInLocation?.filter((location: any) => location?._id.toString() == this.iLocationId.toString())[0]);
                }
              })
          }
        }

      }, (error) => {
        console.log('error: ', error);
      });
  }

  selectBusiness(index: number, location?: any) {
    if (location?._id) {
      this.transactions[index].locationName = location.sName;
      this.transactions[index].iStockLocationId = location._id;
    }
    this.updateTransaction(this.transactions[index]);
  }

  updateTransaction(transaction: any) {
    transaction.iBusinessId = this.iBusinessId;
    this.apiService.putNew('cashregistry', '/api/v1/transaction/item/StockLocation/' + transaction?._id, transaction)
      .subscribe((result: any) => {
      },
        (error) => {
        })
  }

  setSelectedBusinessLocation(locationId: string, index: number) {
    this.business.aInLocation.map(
      (location: any) => {
        if (location._id == locationId)
          this.transactions[index].locationName = location.sName;
      })
  }

  async assignOrderProduct(activity: any, index: any) {
    this.dialogService.openModal(AddFavouritesComponent, { cssClass: 'modal-lg', context: { "mode": "assign", "oActivityItem": activity }, hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true }).instance.close.subscribe((result: any) => {
      if (result?.action != false) {
        activity.iBusinessProductId = result.action.iBusinessProductId
        this.processTransactionItems()
      }
    })
  }

  openTransaction(transaction: any, itemType: any) {
    transaction.iActivityId = this.activity._id;
    this.dialogService.openModal(TransactionItemsDetailsComponent, { cssClass: "modal-xl",
      context: { transaction: this.activity, itemType, selectedId: transaction._id },
      hasBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEsc: false
    }).instance.close.subscribe((result: any) => {
        if (result?.action) {
          const data = this.tillService.processTransactionSearchResult(result);
          localStorage.setItem('fromTransactionPage', JSON.stringify(data));
          localStorage.setItem('recentUrl', '/business/transactions');
          setTimeout(() => {
            if (this.loadCashRegister) {
              this.close({close: true, action: 'openTransaction'});
              this.routes.navigate(['/business/till']);
            }
          }, 100);
        }
      }, (error) => {
        console.log('error: ', error);
      });
  }
  // getBusinessDetails(): Observable<any> {
  //   return this.apiService.getNew('core', '/api/v1/business/' + this.business._id);
  // }

  async downloadCustomerReceipt(index: number, receipt: any, sAction:any, sType?:string) {
    if (receipt == 'customerReceipt') {
      this.bCustomerReceipt = true;
    } else if (receipt == 'downloadCustomerReceipt') {
      this.bDownloadCustomerReceipt = true;
    }

    let oDataSource = JSON.parse(JSON.stringify(this.activityItems[index]));
    let type: any;
    let sBarcodeURI: any;
    if (oDataSource?.oType?.eKind === 'giftcard') {
      type = oDataSource.oType.eKind;
      oDataSource.nTotal = oDataSource.nPaidAmount;
    }
    else {
      type = (oDataSource?.oType?.eKind === 'regular' || (sType && sType === 'alternative')) ? 'repair_alternative' : 'repair';
    }
    const sEDA = oDataSource.eEstimatedDateAction;

    if (sEDA === 'call_on_ready')
      oDataSource.eEstimatedDateAction = this.translationService.instant('CALL_ON_READY');
    else if (sEDA === 'email_on_ready')
      oDataSource.eEstimatedDateAction = this.translationService.instant('EMAIL_ON_READY');
    else
      oDataSource.eEstimatedDateAction = this.translationService.instant('WHATSAPP_ON_READY');

    oDataSource.businessDetails = this.tillService.processBusinessDetails(this.businessDetails);
    const aPromises = [];
    let bBusinessLogo = false, bTemplate = false;
    if (this.businessDetails?.sBusinessLogoUrl) {
      oDataSource.sBusinessLogoUrl = this.businessDetails?.sBusinessLogoUrl;
    } else {
      if (oDataSource?.businessDetails?.sLogoLight) {
        aPromises.push(this.getBase64FromUrl(oDataSource?.businessDetails?.sLogoLight).toPromise())
        bBusinessLogo = true;
      }
    }

    aPromises.push(this.getTemplate(['repair', 'order', 'repair_alternative', 'giftcard']));
    const aResultPromises: any = await Promise.all(aPromises);

    if (bBusinessLogo) {
      oDataSource.sBusinessLogoUrl = aResultPromises[0].data;
      this.businessDetails.sBusinessLogoUrl = aResultPromises[0].data;
    }

    this.aTemplates = (bBusinessLogo) ? aResultPromises[1].data : aResultPromises[0].data;

    const template = this.aTemplates.filter((t: any) => t.eType === type)[0];
    oDataSource.oCustomer = this.tillService.processCustomerDetails(this.customer);

    if (!oDataSource.dEstimatedDate) {
      oDataSource.dEstimatedDate = this.translation['NO_DATE_SELECTED'];
    }
    if (oDataSource?.iEmployeeId) {
      const employeeIndex: any = this.employeesList.findIndex((employee: any) => employee._id == oDataSource.iEmployeeId);
      if (employeeIndex != -1) {
        oDataSource.sEmployeeName = this.employeesList[employeeIndex]['sName'];
        oDataSource.sAdvisedEmpFirstName = this.employeesList[employeeIndex]['sFirstName'] || 'a';
      }
    }
    oDataSource.sBarcodeURI = sBarcodeURI;
    const aTemp = oDataSource.sNumber.split("-");
    oDataSource.sPartRepairNumber = aTemp[aTemp.length - 1];
    this.sendForReceipt(oDataSource, template, oDataSource.sNumber, receipt, type, sAction);
  }

  getBase64FromUrl(url: any): Observable<any> {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.iBusinessId}?url=${url}`);
  }

  getTemplate(types: any) {
    const body = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oFilterBy: {
        eType: types
      }
    }
    return this.apiService.postNew('cashregistry', `/api/v1/pdf/templates`, body).toPromise();
  }

  fetchCustomer(customerId: any, index: number) {
    if (!customerId) return;
    this.apiService.getNew('customer', `/api/v1/customer/${customerId}?iBusinessId=${this.iBusinessId}`).subscribe(
      (result: any) => {
        if (index > -1) this.transactions[index].customer = result;
        this.customer = result;
      },
      (error: any) => {
        console.error(error)
      }
    );
  }

  matchSystemAndCurrentCustomer(systemCustomer: any, currentCustomer: any) {
    /**
     * IF SYSTEM CUSTOMER PROPERTY IS EMPTY THEN I WANT TO UPDATE SYSTEM CUSTOMER WITH CURRENT CUSTOMER
     * OTHERWISE I WANT TO SEE THE DIFFERENCE BETWEEN DATA
    */
    this.showSystemCustomer = false;
    this.aCustomerDifferences = [];
    if (systemCustomer && currentCustomer) {
      let currentCustomerData: any;
      const aCurrentCustomerKeys: any = ['oInvoiceAddress', 'oPhone', '_id', 'sFirstName', 'sLastName', 'sPrefix', 'sGender', 'sEmail', 'sVatNumber', 'sCompanyName', 'sCocNumber', 'bIsCompany', 'oContactPerson', 'nClientId', 'sSalutation', 'oShippingAddress'];
      aCurrentCustomerKeys.forEach((keys: any) => {
        currentCustomerData = { ...currentCustomerData, [keys]: currentCustomer[keys] }
      })

      if (this.from == 'activity-items' && !systemCustomer?.bCounter) {
        for (const key of Object.keys(currentCustomerData)) {

          //If key is invoice address, shipping address or phone iterate the object to check the value
          if(key == 'oInvoiceAddress' || key == 'oShippingAddress' || key == 'oPhone' || key == 'oContactPerson'){
            Object.keys(currentCustomer[key]).forEach(prop => {
              // Uppdate the system customer with current customer data if system data is empty/undefined
             
              if((currentCustomer[key][prop] && currentCustomer[key][prop] != "") && (systemCustomer[key][prop] == "" || !systemCustomer[key][prop])){
                this.aCustomerDifferences.push('UPDATE');
                systemCustomer[key][prop] = currentCustomer[key][prop];
              }
            });

            if (systemCustomer[key] != "" && (currentCustomer[key] != undefined ||  currentCustomer[key] == "") && !(_.isEqual(systemCustomer[key], currentCustomer[key]))) {

              this.aCustomerDifferences.push({
                key,
                "valueSystem":  systemCustomer[key],
                "valueCurrent": currentCustomer[key]
              })
            }

          }else{
            //If value of system customer is not empty and current customer value is empty or not empty I want to show warning.
            if ( systemCustomer[key] != "" && systemCustomer[key] && (currentCustomer[key] != undefined ||  currentCustomer[key] == "") &&  !(_.isEqual(systemCustomer[key], currentCustomer[key]))) {
              this.aCustomerDifferences.push({
                key,
                "valueSystem":  systemCustomer[key],
                "valueCurrent": currentCustomer[key]
              })

            }else if((currentCustomer[key] && currentCustomer[key] != "") && (systemCustomer[key] == "" || !systemCustomer[key])){

              this.aCustomerDifferences.push('UPDATE');
              systemCustomer[key] = currentCustomer[key];

            }
          }
        }

        if(this.aCustomerDifferences.length > 0){
          if(this.aCustomerDifferences.every((el:any) => el==='UPDATE')){
            this.apiService.putNew('customer', '/api/v1/customer/update/' + this.iBusinessId + '/' + systemCustomer._id, systemCustomer).subscribe(
              (result: any) => {
                this.getSystemCustomer(systemCustomer._id);
              },
              (error: any) => {console.log(error.message);}
            );
            this.showSystemCustomer = false;
          }else{
            this.showSystemCustomer = true;
          }
        }
      }
    }
  }

  async processTransactionItems() {
    // console.log('aDiscou+ntRecords',JSON.parse(JSON.stringify(this.aDiscountRecords)))
    this.activityItems = this.activityItems.filter((el: any) => ![...this.tillService.aDiscountTypes, 'loyalty-points'].includes(el.oType.eKind));
    this.processDiscounts(this.activityItems);
    // console.log(749, this.activityItems);
    this.oCurrentCustomer = this.activityItems[0].oCustomer;
    //this.matchSystemAndCurrentCustomer(this.customer , this.oCurrentCustomer);
    this.oLocationName = this.activityItems[0].oLocationName;
    this.transactions = [];
    for (const obj of this.activityItems) {
      if (obj.oType.eKind == 'order' && obj?.iBusinessProductId) {
        const _productData: any = await this.getBusinessProduct(obj.iBusinessProductId).toPromise();
        const productDetail = _productData.data;
        obj.sArticleNumber = productDetail.sArticleNumber
        obj.sProductNumber = productDetail.sProductNumber
        obj.sArticleName = productDetail?.oArticleGroup?.oName[this.language]
        obj.sEan = productDetail?.sEan
      }
      for (const item of obj.receipts) {
        this.transactions.push({ ...item, ...obj });
      }
    }
    for (let i = 0; i < this.transactions.length; i++) {
      const obj = this.transactions[i];
      this.totalPrice += obj.nPaymentAmount;
      this.quantity += obj.bRefund ? (- obj.nQuantity) : obj.nQuantity
      if (obj.iStockLocationId) this.setSelectedBusinessLocation(obj.iStockLocationId, i)
      this.fetchCustomer(obj?.iCustomerId, i);
    }
    this.getListEmployees()
    this.loading = false;
    setTimeout(() => {
      MenuComponent.reinitialization();
    }, 200);
  }

  processDiscounts(aData:any){
    aData.forEach((item: any) => {
      // console.log({ item })
      const oBrand = this.brandsList.find((brand: any) => brand._id === item.iBusinessBrandId);
      if (oBrand) item.brandName = oBrand.sName;
      const aDiscounts = this.aDiscountRecords.filter((el: any) => item.sUniqueIdentifier === el.sUniqueIdentifier);

      item.nPriceIncVatAfterDiscount = item.nPriceIncVat * item.nQuantity;
      item.nDiscountToShow = 0;

      aDiscounts.forEach((el: any) => {
        let nDiscountAmount = 0;
        if (el.oType.eKind === 'discount') {
          nDiscountAmount = +((el.bDiscountOnPercentage ? this.tillService.getPercentOf(item.nPriceIncVat, el?.nDiscount || 0) : el.nDiscount).toFixed(2));
          item.nDiscountToShow = nDiscountAmount;
        } else if (el.oType.eKind === 'loyalty-points-discount') {
          nDiscountAmount = el.nRedeemedLoyaltyPoints
        }

        item.nPriceIncVatAfterDiscount -= nDiscountAmount;
        item.nTotalAmount -= nDiscountAmount;
        item.nPaidAmount -= nDiscountAmount;
        // console.log({
        //   nDiscountAmount,
        //   nPriceIncVatAfterDiscount: item.nPriceIncVatAfterDiscount,
        //   nTotalAmount: item.nTotalAmount,
        //   nPaidAmount: item.nPaidAmount,
        // })

      });
      item.nPriceIncVatAfterDiscount = +(item.nPriceIncVatAfterDiscount.toFixed(2));
      item.nTotalAmount = +(item.nTotalAmount.toFixed(2));
      return item;
    });
  }

  fetchTransactionItems(_id: any) {
    // console.log('fetchTransactionItems', _id, this.from)
    this.loading = true;
    const url = (this.from === 'services') ? `/api/v1/activities/items/${_id}` : `/api/v1/activities/activity-item/${_id}`;
    this.apiService.postNew('cashregistry', url, this.requestParams).subscribe((result: any) => {
      this.loading = false;
      if(result?.data?.length && result?.data[0]?.result?.length){
        this.activityItems = result?.data[0]?.result;
        /* sorting by dRedeemedDate for aGiftcardRedeemedTransactionData */
        if(this.activityItems[0]?.aGiftcardRedeemedTransactionData?.length) this.activityItems[0]?.aGiftcardRedeemedTransactionData.sort((a:any, b:any) => (a.dRedeemedDate < b.dRedeemedDate) ? 1: -1);
        this.aDiscountRecords = this.activityItems.filter((el: any) => this.tillService.aDiscountTypes.includes(el.oType.eKind));
      }
      this.processTransactionItems()
    });
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  submit(oActivityItem:any) {
    this.submitted = true;
    const oItem = JSON.parse(JSON.stringify(oActivityItem));
    oItem.nPriceIncVat = +(((oItem.nPriceIncVatAfterDiscount + oItem.nDiscountToShow)/oItem.nQuantity).toFixed(2));
    oItem.nTotalAmount = oItem.nPriceIncVat * oItem.nQuantity;
    oItem.nPaidAmount = +((oItem.nPaidAmount + oItem.nDiscountToShow).toFixed(2));
    oItem.iBusinessId = this.iBusinessId;
    // return;
    this.apiService.putNew('cashregistry', '/api/v1/activities/items/' + oItem._id, oItem)
      .subscribe((result: any) => {
        if (result.message == 'success') {
          this.submitted = false;
          this.apiService.activityItemDetails.next(oItem);
          this.toastService.show({ type: "success", text: this.translation['SUCCESSFULLY_UPDATED'] });
          this.close(true);
        } else {
          this.submitted = false;
          let errorMessage = "";
          this.translationService.get(result.message).subscribe((res: any) => {
            errorMessage = res;
          })
          this.toastService.show({ type: "warning", text: errorMessage });
        }
      }, (error) => {
        this.submitted = false;
        console.log('error: ', error);
        let errorMessage = "";
        this.translationService.get(error.message).subscribe((res: any) => {
          errorMessage = res;
        })
        this.toastService.show({ type: "warning", text: errorMessage });
      })
  }

  // Function for show transaction details
  async showTransaction(transactionItem: any, event: any) {
    const oBody = {
      iBusinessId: this.iBusinessId,
      oFilterBy: {
        _id: transactionItem.iTransactionId
      },
      bIsDetailRequire: true // to fetch the extra details
    }
    transactionItem.bFetchingTransaction = true;
    event.target.disabled = true;
    const _oTransaction: any = await this.apiService.postNew('cashregistry', `/api/v1/transaction/list`, oBody).toPromise();
    const transaction = _oTransaction?.data?.result[0];
    transactionItem.bFetchingTransaction = false;
    event.target.disabled = false;
    this.dialogService.openModal(TransactionDetailsComponent, { cssClass: "w-fullscreen mt--5", context: { transaction: transaction, eType: 'cash-register-revenue', from: 'activity-details' }, hasBackdrop: true })
      .instance.close.subscribe(
        (res: any) => {
        });
  }

  async downloadReceipt(event: any, receipt: any, bPrint:boolean = false) {
    if (receipt == 'downloadReceipt') {
      this.bDownloadReceipt = true;
    }
    this.bActivityPdfGenerationInProgress = true;
    event.target.disabled = true;

    const oDataSource = JSON.parse(JSON.stringify(this.activity));
    oDataSource.businessDetails = this.tillService.processBusinessDetails(this.businessDetails);
    const aPromises = [];
    let bBusinessLogo = false, bTemplate = false;
    if (this.businessDetails?.sBusinessLogoUrl) {
      oDataSource.sBusinessLogoUrl = this.businessDetails?.sBusinessLogoUrl;
    } else {
      if (oDataSource?.businessDetails?.sLogoLight) {
        aPromises.push(this.getBase64FromUrl(oDataSource?.businessDetails?.sLogoLight).toPromise())
        bBusinessLogo = true;
      }
    }

    if (!this.aTemplates?.length) {
      aPromises.push(this.getTemplate(['repair', 'order', 'repair_alternative', 'giftcard']));
      bTemplate = true;
    }

    const aResultPromises: any = await Promise.all(aPromises);

    if (bBusinessLogo) {
      oDataSource.sBusinessLogoUrl = aResultPromises[0].data;
      this.businessDetails.sBusinessLogoUrl = aResultPromises[0].data;
    }

    if (bTemplate) {
      this.aTemplates = (bBusinessLogo) ? aResultPromises[1].data : aResultPromises[0].data;
    }

    const template = this.aTemplates.filter((t: any) => t.eType === 'order')[0];
    oDataSource.businessDetails.sMobile = this.businessDetails.oPhone.sMobile;
    oDataSource.businessDetails.sLandLine = this.businessDetails?.oPhone?.sLandLine;
    const locationIndex = this.businessDetails.aLocation.findIndex((location: any) => location._id == this.iLocationId);
    const currentLocation = this.businessDetails.aLocation[locationIndex];
    oDataSource.businessDetails.sAddressline1 = currentLocation.oAddress.street + " " + currentLocation.oAddress.houseNumber + " " + currentLocation.oAddress.houseNumberSuffix + " ,  " + currentLocation.oAddress.postalCode + " " + currentLocation.oAddress.city;
    oDataSource.businessDetails.sAddressline2 = currentLocation.oAddress.country;
    oDataSource.oCustomer = this.tillService.processCustomerDetails(this.customer);

    oDataSource.sActivityNumber = oDataSource.sNumber;
    let nTotalPaidAmount = 0;
    oDataSource.activityitems.forEach((item: any) => {
      nTotalPaidAmount += item.nPaidAmount;
      item.sActivityItemNumber = item.sNumber;
      item.sOrderDescription = item.sProductName + '\n' + item.sDescription;
    });
    oDataSource.nTotalPaidAmount = nTotalPaidAmount;

    this.sendForReceipt(oDataSource, template, oDataSource.sNumber, receipt, 'order', (bPrint)?'print':'download');
    this.bActivityPdfGenerationInProgress = false;
    event.target.disabled = false;
  }

  async sendForReceipt(oDataSource: any, template: any, title: any, receipt: any, sType:any, sAction:any) {
    const oPdfSetting = template.aSettings.find((el: any) => el.sParameter === 'pdfMethod');
    if (oPdfSetting && oPdfSetting.value === 'Javascript') {
      await this.pdfService.createPdf(JSON.stringify(template), oDataSource, oDataSource.sNumber, true, null, this.iBusinessId, null);
    } else {
      const oSettings = this.printSettings.find((s: any) => s.sType === sType && s.sMethod === 'pdf' && s.iWorkstationId === this.iWorkstationId)
      if (!oSettings && (sAction === 'PRINT_PDF' || sAction === 'print')) {
        this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
        return;
      }

      await this.receiptService.exportToPdf({
        oDataSource: oDataSource,
        pdfTitle: title,
        templateData: template,
        printSettings: oSettings,
        printActionSettings: this.printActionSettings,
        eSituation: 'is_created',
        sAction,
        sApiKey: this.businessDetails?.oPrintNode?.sApiKey
      }).toPromise();
    }

    if (receipt == 'customerReceipt') {
      this.bCustomerReceipt = false;
    } else if (receipt == 'downloadCustomerReceipt') {
      this.bDownloadCustomerReceipt = false;
    } else if (receipt == 'downloadReceipt') {
      this.bDownloadReceipt = false;
    }
  }

  getPdfPrintSetting(oFilterBy?: any) {
    const oBody = {
      iLocationId: this.iLocationId,
      ...oFilterBy
    }
    return this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, oBody).toPromise();
  }

  copyToClipboard(activity: any) {
    this.clipboard.copy(activity.sNumber);
    activity.bActivityNumberCopied = true;
    setTimeout(() => {
      activity.bActivityNumberCopied = false;
    }, 3000);
  }

  /* Update customer in [T, A, AI] */
  updateCurrentCustomer(oData: any) {
    const oBody = {
      oCustomer: oData.oCustomer,
      iBusinessId: this.iBusinessId,
      iActivityItemId: this.activityItems[0]._id
    }
    this.apiService.postNew('cashregistry', '/api/v1/transaction/update-customer', oBody).subscribe((result: any) => {
      this.oCurrentCustomer = oData?.oCustomer;
      this.getSystemCustomer(oData?.oCustomer?._id);
      this.toastService.show({ type: "success", text: this.translation['SUCCESSFULLY_UPDATED'] });
    }, (error) => {
      console.log('update customer error: ', error);
      this.toastService.show({ type: "warning", text: `Something went wrong` });
    });
  }

  selectCustomer() {
    this.dialogService.openModal(CustomerDialogComponent, { cssClass: 'modal-xl' })
      .instance.close.subscribe((data) => {
        if (!data?.customer?._id || !this.activityItems?.length || !this.activityItems[0]?._id) return;
        this.updateCurrentCustomer({ oCustomer: data?.customer });
        this.customer = data?.customer;
      }, (error) => {
        console.log('selectCustomer error: ', error);
        this.toastService.show({ type: "warning", text: `Something went wrong` });
      })
  }

  /* Here the current customer means from the Transaction/Activity/Activity-Items */
  openCurrentCustomer(oCurrentCustomer: any) {
    const bIsCounterCustomer = (oCurrentCustomer?.sEmail === "balieklant@prismanote.com" || !oCurrentCustomer?._id) ? true : false /* If counter customer used then must needs to change */
    if (bIsCounterCustomer || oCurrentCustomer.bCounter) {
      this.selectCustomer();
      return;
    }
    this.dialogService.openModal(CustomerDetailsComponent,
      {
        cssClass: "modal-xl position-fixed start-0 end-0",
        context: {
          customerData: oCurrentCustomer,
          mode: 'details',
          editProfile: true,
          bIsCurrentCustomer: true, /* We are only going to change in the A/T/AI */
        }
      }).instance.close.subscribe(result => {
        if (result?.bChangeCustomer){
          this.selectCustomer();
        }else if (result?.bShouldUpdateCustomer){
          this.updateCurrentCustomer({ oCustomer: result?.oCustomer });
        }
      }, (error) => {
        console.log("Error in customer: ", error);
        this.toastService.show({ type: "warning", text: `Something went wrong` });
      });
  }

  syncCustomerData(currentCustomer: any, systemCustomer: any) {

    this.dialogService.openModal(CustomerSyncDialogComponent,
      {
        cssClass: "modal-md",
        context: {
          activityItems: this.activityItems,
          aCustomerDifference: this.aCustomerDifferences,
          currentCustomer: currentCustomer,
          systemCustomer: systemCustomer
        }
      }).instance.close.subscribe(result => {
        if (result) {
          if(result?.currentCustomer){
            this.oCurrentCustomer = result?.currentCustomer;
            this.getSystemCustomer(result?.currentCustomer?._id);
          }else if(result?.systemCustomer){
            this.getSystemCustomer(result?.systemCustomer?._id)
          }
        }
      }, (error) => {
        console.log("Error in customer: ", error);
        this.toastService.show({ type: "warning", text: `Something went wrong` });
      });
  }

  contactCustomer(action: any) {
    if (this.oCurrentCustomer) {
      switch (action) {
        case 'call_on_ready':
          if (!this.oCurrentCustomer?.bIsCounterCustomer && !this.oCurrentCustomer?.oPhone?.sPrefixLandline && !this.oCurrentCustomer?.oPhone?.sPrefixMobile) {
            this.toastService.show({ type: "warning", title: this.translation['NO_PREFIX'], text: this.translation['PLEASE_ADD_COUNTRY_CODE_IN_CUSTOMER_DATA'] });
            return;
          }

          if (this.oCurrentCustomer?.oPhone?.sLandLine && this.oCurrentCustomer?.oPhone?.sPrefixLandline) {
            window.location.href = "tel:" + this.oCurrentCustomer?.oPhone?.sPrefixLandline + this.oCurrentCustomer?.oPhone?.sLandLine;
          } else {
            this.toastService.show({ type: "warning", text: this.translation['NO_PHONE'] });
          }
          break;

        case 'email_on_ready':
          if (this.oCurrentCustomer?.sEmail) {
            window.location.href = "mailto:" + this.oCurrentCustomer?.sEmail
          } else {
            this.toastService.show({ type: "warning", text: this.translation['NO_EMAIL'] });
          }
          break;

        case 'whatsapp_on_ready':
          if (!this.oCurrentCustomer?.bIsCounterCustomer && !this.oCurrentCustomer?.oPhone?.sPrefixLandline && !this.oCurrentCustomer?.oPhone?.sPrefixMobile) {
            this.toastService.show({ type: "warning", title: this.translation['NO_PREFIX'], text: this.translation['PLEASE_ADD_COUNTRY_CODE_IN_CUSTOMER_DATA'] });
            return;
          }

          if (this.oCurrentCustomer?.oPhone?.sMobile && this.oCurrentCustomer?.oPhone?.bWhatsApp && this.oCurrentCustomer?.oPhone?.sPrefixMobile) {
            if (this.sMessage) window.open("https://wa.me/" + this.oCurrentCustomer?.oPhone?.sPrefixMobile + this.removeSpaces(this.oCurrentCustomer?.oPhone?.sMobile) + '?text=' + this.sMessage);
            else window.open("https://wa.me/" + this.oCurrentCustomer?.oPhone?.sPrefixMobile + this.removeSpaces(this.oCurrentCustomer?.oPhone?.sMobile));
          } else {
            this.toastService.show({ type: "warning", text: this.translation['NO_PHONE_OR_WHATSAPP'] });
          }
          break;
      }
    }
  }

  removeSpaces(string: string){
    return string?.replace(/\s/g, '');
  }

  updatePriceIncVatWithoutDiscount(oActivity:any){
    this.processDiscounts([oActivity]);
  }

  async printThermalReceipt(oActivity:any, type?:string) {
    // console.log('printThermalReceipt', {type})
    oActivity.businessDetails = this.businessDetails;
    if(!type) type = oActivity.oType.eKind;
    // console.log({oActivity, type}, this.businessDetails);
    const oEmployee = this.employeesList.find((el: any) => el._id === oActivity.iEmployeeId);
    if(type == 'giftcard') {
      const oReceipt = oActivity.receipts.find((el:any) => el._id == oActivity.iTransactionItemId);
      if (oReceipt && oReceipt?.aTransactions?.length) {
        oActivity.sReceiptNumber = oReceipt?.aTransactions[0]?.sReceiptNumber || '';
      }
    }
    oActivity.sAdvisedEmpFirstName = (oEmployee) ? oEmployee.sFirstName : 'a';
    const vat = (oActivity.nVatRate * oActivity.nPriceIncVatAfterDiscount / (100 + parseFloat(oActivity.nVatRate)));
    oActivity.vat = (oActivity.nVatRate > 0) ? +(vat.toFixed(2)) : 0;
    await this.receiptService.printThermalReceipt({
      currency: this.tillService.currency,
      oDataSource: JSON.parse(JSON.stringify(oActivity)),
      printSettings: this.printSettings,
      apikey: this.businessDetails.oPrintNode.sApiKey,
      title: oActivity.sNumber,
      sType: type,
      sTemplateType: type
    }).toPromise();;
  }
}
