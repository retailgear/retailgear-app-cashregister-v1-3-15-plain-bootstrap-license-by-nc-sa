import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DialogComponent } from "../../../shared/service/dialog";
import { faTimes, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { PriceService } from "../../../shared/service/price.service";
import { StringService } from "../../../shared/service/string.service";
import { TillService } from 'src/app/shared/service/till.service';

@Component({
  selector: 'app-discount-dialog',
  templateUrl: './discount-dialog.component.html',
  styleUrls: ['./discount-dialog.component.sass']
})
export class DiscountDialogComponent implements OnInit, AfterViewInit {
  @Input() item: any
  faTimes = faTimes
  dialogRef: DialogComponent
  mode: string = 'fixed';
  customDiscount: number = 0
  discountTooHigh: string = ""
  discountIsTooLow: string = ""
  alertMessage: string = ""
  showDiscountAlert: boolean = false
  showCurrentDiscount: boolean = false
  currentDiscount: string = ""
  customDiscountValuePercent: number = 0
  @ViewChild("customDiscountRef") customDiscountRef!: ElementRef
  selectedDiscount: any = 'custom'
  discount: any

  amounts: any = {
    fixed: [
      {
        amount: 5,
        disabled: false
      }, {
        amount: 10,
        disabled: false
      },
      {
        amount: 20,
        disabled: false
      },
      {
        amount: 50,
        disabled: false
      }
    ],
    percent: [
      {
        amount: 10,
        disabled: false
      }, {
        amount: 15,
        disabled: false
      },
      {
        amount: 20,
        disabled: false
      },
      {
        amount: 30,
        disabled: false
      },
      {
        amount: 50,
        disabled: false
      }
    ]
  }
  discounts: any = []


  constructor(
    private viewContainer: ViewContainerRef,
    private priceService: PriceService,
    private stringService: StringService,
    public tillService: TillService
  ) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent)


  }
  ngAfterViewInit(): void {
    if (this.customDiscountRef) this.customDiscountRef.nativeElement.focus()
  }

  close(): void {
    this.dialogRef.close.emit({ action: false })
  }

  save(): void {
    const _nDiscount  = (this.mode === 'fixed') ? this.selectedDiscount : (this.item.price * (this.selectedDiscount / 100));
    this.item.discount = {
      percent: this.mode === 'percent',
      itemPrice: this.calculateDiscountPrice(),
      value: this.discount // _nDiscount,
      // value: _nDiscount
    };
    this.item.nDiscount = this.discount;
    this.dialogRef.close.emit({ action: true, item: this.item })
  }

  ngOnInit(): void {


    this.showCurrentDiscount = this.item.discount && this.item.discount.value > 0
    this.currentDiscount = this.priceService.getDiscount(this.item.discount)

    this.calculatePrices()
    this.switchMode('fixed')
    this.discountTooHigh = this.stringService.translate("DISCOUNT_TOO_HIGH")
    this.discountIsTooLow = this.stringService.translate("DISCOUNT_IS_ZERO_OR_LOWER")
  }

  showAlert(message: string): void {
    this.showDiscountAlert = true
    this.alertMessage = message
  }

  switchMode(mode: string): void {
    this.mode = mode;
    this.calculatePrices();
    this.discounts = this.amounts[mode];
    this.resetDiscount()
  }

  calculateDiscountPrice(): number {
    if (this.mode === 'fixed') {
      return this.priceService.roundPrice(this.item.price - this.discount)
    } else {
      return this.priceService.roundPrice(this.item.price - (this.item.price * (this.discount / 100)))
    }
  }

  calculatePrices(): void {
    for (let i = 0; i < this.amounts[this.mode].length; i++) {
      if (this.mode === 'fixed') {
        if (this.amounts.fixed[i].amount > this.item.price) {
          this.amounts.fixed[i].disabled = true
          this.amounts.fixed[i].price = null
        } else {
          this.amounts.fixed[i].price = this.priceService.roundPrice(this.item.price - this.amounts.fixed[i].amount)
        }
      } else {
        const itemPrice = this.item.price - (this.item.price * (this.amounts.percent[i].amount / 100))
        if (itemPrice < 0) {
          this.amounts.percent[i].disabled = true
          this.amounts.percent[i].price = null
        } else {
          this.amounts.percent[i].price = this.priceService.roundPrice(itemPrice)
        }
      }
    }
  }

  resetDiscount(): void {
    this.selectedDiscount = 0;
    this.discount = 0
    this.customDiscount = 0
    this.item.discount = {
      value: 0,
      percent: false
    }
  }

  setDiscount(_nDiscount?: any): void {
    this.showDiscountAlert = false
    if (this.selectedDiscount !== 'custom') {
      this.discount = this.selectedDiscount
      this.customDiscount = 0
    }

    if (this.discount < 0) {
      this.showAlert(this.discountIsTooLow);
      return
    }

    this.item.discount = {
      value: this.discount,
      percent: this.mode === 'percent'
    }
  }

  getTotalPrice(): any {
    return this.priceService.getArticlePrice(this.item, true)
  }

  setCustomDiscount(): void {
    this.resetDiscount()
    this.selectedDiscount = 'custom'
  }

  enterCustomDiscount(): void {
    this.discount = Number(this.customDiscount)
    this.showDiscountAlert = false

    if (
      (this.mode === 'fixed' && this.discount > this.item.price) ||
      (this.mode === 'percent' && this.discount > 100)) {
      this.showAlert(this.discountTooHigh);
      return
    }

    this.setDiscount()
    if (this.mode === 'percent') {
      this.customDiscountValuePercent = this.calculateDiscountPrice()
    }
  }

  removeDiscount(): void {
    this.resetDiscount();
    this.save()
  }

}
