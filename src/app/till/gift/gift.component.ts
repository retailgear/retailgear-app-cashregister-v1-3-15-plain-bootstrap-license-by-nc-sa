/* eslint-disable @angular-eslint/component-selector */
import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faBan, faCheck, faClone, faMinus, faPlus, faPrint, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import * as JsBarcode from 'jsbarcode';
import { Observable } from 'rxjs';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { CreateArticleGroupService } from '../../shared/service/create-article-groups.service';
import { ReceiptService } from '../../shared/service/receipt.service';
import { TillService } from '../../shared/service/till.service';
// import { TaxService } from "../../shared/service/tax.service";

@Component({
  selector: '[till-gift]',
  templateUrl: './gift.component.html',
  styleUrls: ['./gift.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GiftComponent implements OnInit {
  @Input() item: any
  @Input() transactionItems: any;
  @Input() taxes: any
  @Output() itemChanged = new EventEmitter<any>();
  @Output() createGiftCard = new EventEmitter<any>();
  faTimes = faTimes;
  faPlus = faPlus;
  faMinus = faMinus;
  numberIcon = faSpinner;
  faPrint = faPrint;
  faBan = faBan;
  faClone = faClone;
  checkingNumber: boolean = false
  iBusinessId: any = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem('currentLocation');
  downloading: boolean = false;
  computerId: number | undefined;
  printerId: number | undefined;
  constructor(
    private apiService: ApiService,
    private receiptService: ReceiptService,
    private toastrService: ToastService,
    public tillService: TillService,
    private createArticleGroupService: CreateArticleGroupService) { }

  ngOnInit(): void {
    this.checkNumber();
    this.checkArticleGroups();
    this.updatePayments();
  }

  deleteItem(): void {
    this.itemChanged.emit({type:'delete'});
  }

  checkNumber() {
    this.item.isGiftCardNumberValid = false;
    const checkAvailabilty = this.transactionItems.find((o: any) => String(o.sGiftCardNumber) === String(this.item.sGiftCardNumber) && o.index !== this.item.index);
    if (this.item.sGiftCardNumber.toString().length < 4 || checkAvailabilty) {
      this.numberIcon = faBan;
      return;
    }
    this.numberIcon = faSpinner;
    this.checkingNumber = true;

    this.apiService.getNew('cashregistry', `/api/v1/till/check-availability?sGiftCardNumber=${this.item.sGiftCardNumber}`)
      .subscribe(data => {
        if (!data) {
          this.numberIcon = faCheck;
          this.item.isGiftCardNumberValid = true;
        } else {
          this.numberIcon = faBan;
        }
        this.checkingNumber = false;
      }, err => {
        this.checkingNumber = false;
      });
  }

  checkArticleGroups() {
    this.createArticleGroupService.checkArticleGroups('giftcard')
      .subscribe((res: any) => {
        if (!res.data?._id) {
          this.createArticleGroup();
        } else {
          this.item.iArticleGroupId = res.data._id;
          this.item.iArticleGroupOriginalId = res.data._id;
          this.item.oArticleGroupMetaData.sCategory = res.data?.sCategory;
          this.item.oArticleGroupMetaData.sSubCategory = res.data?.sSubCategory;
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async createArticleGroup() {
    const articleBody = { name: 'Giftcard', sCategory: 'Giftcard', sSubCategory: 'Repair' };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.item.iArticleGroupId = result.data._id;
    this.item.oArticleGroupMetaData.sCategory = result.data.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = result.data.sSubCategory;
  }
  
  updatePayments(price?:any) {
    if(price) this.item.price = price;
    this.item.nPurchasePrice = this.item.price / 1.21;
    this.itemChanged.emit({type: 'item', data: this.item});
  }

  create() {
    this.generatePDF(false);
    this.createGiftCard.emit('create');
  }

  getTemplate(type: string): Observable<any> {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/${this.iBusinessId}?eType=${type}&iLocationId=${this.iLocationId}`);
  }

  async generatePDF(print: boolean) {
    this.downloading = true;
    const template = await this.getTemplate('giftcard').toPromise();
    let printData = null
    if (print) {
      printData = {
        computerId: this.computerId,
        printerId: this.printerId,
        title: this.item.sGiftCardNumber,
        quantity: 1
      }
    }

    const oDataSource = JSON.parse(JSON.stringify(this.item));
    oDataSource.sBarcodeURI = this.tillService.generateBarcodeURI(false, 'G-'+oDataSource.sGiftCardNumber);
    oDataSource.nPriceIncVat = oDataSource.price;
    oDataSource.dCreatedDate = new Date();

    await this.receiptService.exportToPdf({
      oDataSource: oDataSource,
      templateData: template.data,
      pdfTitle: oDataSource.sGiftCardNumber
    }).toPromise();

    return;
  }

  duplicate(): void {
    this.itemChanged.emit({type:'duplicate'});
  }
}
