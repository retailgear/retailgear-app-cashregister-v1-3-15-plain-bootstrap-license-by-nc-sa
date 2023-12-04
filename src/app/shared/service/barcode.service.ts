import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
declare const onScan: any;

@Injectable({
  providedIn: 'root'
})
export class BarcodeService implements OnDestroy {

  barcodeScanned = new EventEmitter<String>()

  constructor() {
    // see full doc at https://github.com/axenox/onscan.js
    onScan.attachTo(document, {
      suffixKeyCodes: [13], // after sending a key 13 (enter) always stop collecting data
      reactToPaste: false, // react to scanner which has a copy/past function
      avgTimeByChar: 20, // time between chars in ms, higher value make slower scanners compatible, but also higher the risk that a fast typing human will be detected as scanner
      // I tested this value after 20 is the highest at this moment
      onScan: (code: any) => {
        this.barcodeScanned.emit(code);
      },
      keyCodeMapper: (oEvent: any) => {
        if (oEvent.key === '-') {
          return '-'
        }
        return onScan.decodeKeyEvent(oEvent);
      }
    });
  }

  ngOnDestroy(): void {
    onScan.detachFrom(document);
  }
}
