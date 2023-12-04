/* eslint-disable @angular-eslint/component-selector */
import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { faTimes, faPlus, faMinus, faCheck, faSpinner, faPrint, faBan, faClone } from "@fortawesome/free-solid-svg-icons";
import * as JsBarcode from 'jsbarcode';
import { Observable } from 'rxjs';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { CreateArticleGroupService } from 'src/app/shared/service/create-article-groups.service';
import { PdfService } from 'src/app/shared/service/pdf.service';
import { ReceiptService } from 'src/app/shared/service/receipt.service';
import { TillService } from 'src/app/shared/service/till.service';
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
  iBusinessId: string = '';
  downloading: boolean = false;
  computerId: number | undefined;
  printerId: number | undefined;
  constructor(
    private apiService: ApiService,
    private receiptService: ReceiptService,
    private pdfService: PdfService,
    private toastrService: ToastService,
    public tillService: TillService,
    private createArticleGroupService: CreateArticleGroupService) { }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.checkNumber();
    this.checkArticleGroups();
    this.changeInPrice();
  }

  deleteItem(): void {
    this.itemChanged.emit('delete');
  }

  checkNumber(): void {
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
    this.createArticleGroupService.checkArticleGroups('Giftcard')
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
    const articleBody = { name: 'Giftcard', sCategory: 'Giftcard', sSubCategory: 'Repair' };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.item.iArticleGroupId = result.data._id;
    this.item.oArticleGroupMetaData.sCategory = result.data.sCategory;
    this.item.oArticleGroupMetaData.sSubCategory = result.data.sSubCategory;
  }

  changeInPrice() {
    this.item.nPurchasePrice = this.item.price / 1.21;
  }

  create(): void {
    this.generatePDF(false);
    this.createGiftCard.emit('create');
  }

  getPrintSetting() {
    this.apiService.getNew('cashregistry', '/api/v1/print-settings/' + '6182a52f1949ab0a59ff4e7b' + '/' + '624c98415e537564184e5614').subscribe(
      (result: any) => {
        this.computerId = result?.data?.nComputerId;
        this.printerId = result?.data?.nPrinterId;
      },
      (error: any) => {
        console.error(error)
      }
    );
  }
  getTemplate(type: string): Observable<any> {
    return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/${this.iBusinessId}?eType=${type}`);
  }

  generateBarcodeURI(data:any) {
    var canvas = document.createElement("canvas");
    JsBarcode(canvas, data, { format: "CODE128" });
    return canvas.toDataURL("image/png");
    // this.getBase64FromUrl('')  
  }

  async generatePDF(print: boolean) {
    const sName = 'Default Giftcard', eType = 'giftcard';
    this.downloading = true;
    const template = await this.getTemplate(eType).toPromise();
    // this.apiService.getNew('cashregistry', '/api/v1/pdf/templates/' + this.iBusinessId + '?&eType=' + eType).subscribe(
    //   (result: any) => {
    const filename = new Date().getTime().toString()
    let printData = null
    if (print) {
      printData = {
        computerId: this.computerId,
        printerId: this.printerId,
        title: filename,
        quantity: 1
      }
    }

    const oDataSource = JSON.parse(JSON.stringify(this.item));
    oDataSource.sBarcodeURI = this.generateBarcodeURI('G-'+oDataSource.sGiftCardNumber);


    this.receiptService.exportToPdf({
      oDataSource: oDataSource,
      templateData: template.data,
      pdfTitle: 'Giftcard'
    })

    return;
  }

  duplicate(): void {
    this.itemChanged.emit('duplicate');
  }
}
