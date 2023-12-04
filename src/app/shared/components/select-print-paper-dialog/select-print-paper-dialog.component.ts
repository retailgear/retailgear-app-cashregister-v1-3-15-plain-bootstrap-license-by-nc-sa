import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';
import { ToastService } from '../toast';

@Component({
  selector: 'app-select-print-paper-dialog',
  templateUrl: './select-print-paper-dialog.component.html',
  styleUrls: ['./select-print-paper-dialog.component.scss']
})
export class SelectPrintPaperDialogComponent implements OnInit {

  dialogRef: DialogComponent;
  faTimes = faTimes;
  iBusinessId: any = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem('currentLocation');
  printersList:any;
  oWorkstation:any;
  oSelectedPrinter:any;
  
  sPrinterPageFormat:any;
  aPapers:any;
  
  sPaperTray:any;
  aPaperTray:any;

  aRotation = [0,90,180,270];
  nRotation:any;
  
  type:any;
  template:any;
  
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
  ) { 
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit() {
      this.oSelectedPrinter = this.dialogRef.context.oSelectedPrinter;
      if (this.oSelectedPrinter){
        if (!this.sPrinterPageFormat) this.selectedPrinterChange();
        else this.aPapers = Object.keys(this.oSelectedPrinter?.capabilities?.papers) || [];
        this.aPaperTray = this.oSelectedPrinter?.capabilities?.bins || [];
      }
  }

  selectedPrinterChange(){
    this.aPapers = [];
    this.sPrinterPageFormat = null;
    this.aPapers = Object.keys(this.oSelectedPrinter?.capabilities?.papers) || [];
    
    this.aPaperTray = [];
    this.sPaperTray = null;
    this.aPaperTray = this.oSelectedPrinter?.capabilities?.bins || [];
  }
  
  groupByFn = (item: any) => item.computer.name;
 
  close(data: any) {
    if(data) {
      this.dialogRef.close.emit({ 
        action:data, 
        oSelectedPrinter: this.oSelectedPrinter, 
        sPrinterPageFormat: this.sPrinterPageFormat,
        sPaperTray: this.sPaperTray,
        nRotation: this.nRotation,
      });
    } else {
      this.dialogRef.close.emit({action: data});
    }
  }
}
