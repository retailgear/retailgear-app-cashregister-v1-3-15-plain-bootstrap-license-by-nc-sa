import { Component, OnInit } from '@angular/core';
// import {BarcodeService} from "../shared/service/barcode.service";

@Component({
  selector: 'app-barcode',
  templateUrl: './barcode.component.html',
  styleUrls: ['./barcode.component.scss']
})
export class BarcodeComponent implements OnInit {

  constructor(
    // private barcodeScanner: BarcodeService
  ) { }
  barcode: string = ""
  scannerUsed: boolean = false



  ngOnInit(): void {
    // this.barcodeScanner.barcodeScanned.subscribe( (barcode: string) => {
    //   this.barcode = barcode
    //   this.scannerUsed = true
    // })
  }

  onInputChange(): void {
    this.scannerUsed = false
  }


}
