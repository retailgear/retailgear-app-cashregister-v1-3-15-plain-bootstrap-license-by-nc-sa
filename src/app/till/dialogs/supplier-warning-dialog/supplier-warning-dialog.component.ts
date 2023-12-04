import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DialogComponent } from "../../../shared/service/dialog";
import { faTimes, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { PriceService } from "../../../shared/service/price.service";
import { StringService } from "../../../shared/service/string.service";

@Component({
  selector: 'app-supplier-warning-dialog',
  templateUrl: './supplier-warning-dialog.component.html',
  styleUrls: ['./supplier-warning-dialog.component.scss']
})
export class SupplierWarningDialogComponent implements OnInit, AfterViewInit {
  @Input() item: any
  @ViewChild("customDiscountRef") customDiscountRef!: ElementRef
  faTimes = faTimes
  dialogRef: DialogComponent
  urls: any = [];
  constructor(
    private viewContainer: ViewContainerRef,
    private priceService: PriceService,
  ) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.urls = this.dialogRef.context?.urls
  }
  ngAfterViewInit(): void {
    if (this.customDiscountRef) this.customDiscountRef.nativeElement.focus()
  }

  close(): void {
    this.dialogRef.close.emit({ action: false })
  }

  save(): void {
    this.dialogRef.close.emit({ action: true, item: this.item })
  }

  ngOnInit(): void {
  }
}
