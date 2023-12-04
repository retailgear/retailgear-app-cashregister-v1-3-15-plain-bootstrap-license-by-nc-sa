import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { DialogComponent } from 'src/app/shared/service/dialog';
import { PrintService } from 'src/app/shared/service/print.service';

@Component({
  selector: 'app-printer-tool',
  templateUrl: './printer-tool.component.html',
  styleUrls: ['./printer-tool.component.sass']
})
export class PrinterToolComponent implements OnInit {
  dialogRef: DialogComponent;
  faTimes = faTimes;
  zplCode = ''
  commands = {
    Start: '~PS',
    Stop: '~PP',
    Calibrate: '~jc',
    BlancLabel: '^XA^FD0^XZ',
    QuePrinterCleanUp: '~JA',
    MediaDarkness: '^XA~SD18^XZ',
    AlignmentFixGK420t: '^XA^JSA^XZ',
  }
  iBusinessId = ''
  iLocationId = ''
  iWorkstationId !: any;
  labelPrintSettings !: any;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private toastService: ToastService,
    private printService: PrintService,
    private apiService: ApiService
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }
  ngOnInit() {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem("currentWorkstation") || '';
    this.getPrintSetting()
  }
  close(data: any) {
    this.dialogRef.close.emit(data);
  }
  async save() {
    if (!this.zplCode) return;
    if (!this.labelPrintSettings?.nPrinterId || !this.labelPrintSettings?.nComputerId) {
      this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
      return;
    }
    const printRawContentResult: any = await this.printService.printRawContent(this.iBusinessId, this.zplCode, this.labelPrintSettings?.nPrinterId, this.labelPrintSettings?.nComputerId, 1, { title: 'Print label' }, '')
    if (printRawContentResult) {
      this.toastService.show({
        type: 'success',
        title: 'deviceStatus: ' + printRawContentResult?.deviceStatus,
        text: printRawContentResult?.status
      })
    }
  }
  clear() {
    this.zplCode = ''
  }
  prefillCommand(command: string) {
    this.zplCode = command;
  }

  // Function for get print settings
  getPrintSetting() {
    this.apiService.getNew('cashregistry', `/api/v1/print-settings/${this.iBusinessId}/${this.iWorkstationId}/labelDefinition/default`).subscribe(
      (result: any) => {
        if (result?.data?._id) {
          this.labelPrintSettings = result?.data;
        } else {
          this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
        }
      },
      (error: any) => {
        console.error(error)
      }
    );
  }
}
