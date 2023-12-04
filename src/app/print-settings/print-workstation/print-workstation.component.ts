import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faPencilAlt, faCopy, faXmark, faSave } from '@fortawesome/free-solid-svg-icons';
import { AddEditWorkstationComponent } from 'src/app/shared/components/add-edit-workstation/add-edit-workstation.component';
import { PrintSettingsEditorComponent } from 'src/app/shared/components/print-settings-editor/print-settings-editor.component';
import { ApiService } from 'src/app/shared/service/api.service';
import { DialogService } from 'src/app/shared/service/dialog';
import { ToastService } from 'src/app/shared/components/toast';
import { Observable, observable, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'print-workstation',
  templateUrl: './print-workstation.component.html',
  styleUrls: ['./print-workstation.component.sass']
})
export class PrintWorkstationComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private toastService: ToastService
  ) { }

  @Input() businessDetails: any;
  @Input() iLocationId: any;
  @Output() openSetting: EventEmitter<any> = new EventEmitter();
  faPencilAlt = faPencilAlt;
  faSave = faSave;
  faCopy = faCopy;
  faXmark = faXmark;
  businessWorkstations: Array<any> = [];
  templates: Array<any> = [
    {
      name: 'PDF',
      typeList: [
        { name: 'BUSINESS_RECEIPT', key: 'regular', enabled: true },
        { name: 'ORDER_RECEIPT', key: 'order', enabled: true },
        { name: 'REPAIR_RECEIPT', key: 'repair', enabled: true },
        { name: 'GIFTCARD_RECEIPT', key: 'giftcard', enabled: true },
        { name: 'REPAIR_ALTERNATIVE_RECEIPT', key: 'repair_alternative', enabled: true }
      ]
    },
    {
      name: 'THERMAL',
      typeList: [
        { name: 'BUSINESS_RECEIPT', key: 'regular', enabled: false },
        { name: 'REPAIR_RECEIPT', key: 'repair', enabled: false }
      ]
    },
    {
      name: 'LABEL',
      typeList: [
        { name: 'LABEL', key: 'default', enabled: false }
      ]
    }
  ];
  loading: boolean = false;
  tableMaxWidth: number = window.innerWidth - 200;
  workstations !: Array<any>;
  computersList !: Array<any>;
  printersList !: Array<any>;
  businessPrintSettings !: Array<any>;
  workStationsCount: number = 0;

  ngOnInit(): void {
    this.getWorkstations();
    this.fetchPrintSettings();
    this.getAllPrintersList();
  }

  createWorkstation(workstation: any) {
    workstation.iBusinessId = this.businessDetails._id;
    workstation.iLocationId = this.iLocationId;
    this.loading = true;
    this.apiService.postNew('cashregistry', '/api/v1/workstations/create', workstation).subscribe(
      (result: any) => {
        this.loading = false;
        this.getWorkstations();
      }),
      (error: any) => {
        this.loading = false;
        console.error(error)
      }
  }

  // Function for get workstations list
  getWorkstations() {
    this.loading = true;
    this.workstations = [];
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.businessDetails._id}/${this.iLocationId}`).subscribe(
      (result: any) => {
        if (result?.data?.length > 0) {
          this.tableMaxWidth = result.data.length * 250;
          let workstations: any = [];
          result.data.map(async (workstation: any) => {
            if (workstation.nPrintNodeComputerId) {
              let computers: any = await this.getComputerDetails(workstation.nPrintNodeComputerId).toPromise();
              workstation.computer = computers[0] || undefined;
              workstations.unshift(workstation);
            } else {
              workstations.push(workstation);
            }
          });
          this.workstations = workstations;
        }
        this.loading = false;
      }),
      (error: any) => {
        this.loading = false;
      }
  }

  // Function for get computers list
  getComputersList() {
    let nAccountId = this.businessDetails?.oPrintNode?.nAccountId
    if (!nAccountId) {
      this.toastService.show({ type: 'warning', text: 'PrintNode not configured for you business contact admin.' });
      return;
    }
    let urlParams = `?id=${nAccountId}&APIKEY=${this.businessDetails?.oPrintNode?.sApiKey}`
    this.apiService.getNew('cashregistry', '/api/v1/printnode/computers' + urlParams).subscribe(
      (result: any) => {
        if (result?.length > 0) {
          this.computersList = [];
          let self = this;
          result.map(async (computer: any) => {
            computer.printers = await this.getPrintersList(computer.id).toPromise();
            self.computersList.push(computer);
          });
        }
      }
    )
  }

  // Function for get computer details
  getComputerDetails(computerId: number) {
    let nAccountId = this.businessDetails?.oPrintNode?.nAccountId
    if (!nAccountId) {
      this.toastService.show({ type: 'warning', text: 'PrintNode not configured for you business contact admin.' });
      return throwError('');
    }
    let urlParams = `?id=${nAccountId}&deviceId=${computerId}&APIKEY=${this.businessDetails?.oPrintNode?.sApiKey}`
    return this.apiService.getNew('cashregistry', '/api/v1/printnode/computers' + urlParams);
  }

  // Function for get computers list
  getPrintersList(computerId: number) {
    let nAccountId = this.businessDetails?.oPrintNode?.nAccountId
    let urlParams = `?id=${nAccountId}&deviceId=${computerId}&APIKEY=${this.businessDetails?.oPrintNode?.sApiKey}`
    return this.apiService.getNew('cashregistry', '/api/v1/printnode/printers' + urlParams);
  }

  // Function for get all printers list
  getAllPrintersList() {
    let nAccountId = this.businessDetails?.oPrintNode?.nAccountId
    if (!nAccountId) {
      this.toastService.show({ type: 'warning', text: 'PrintNode not configured for you business contact admin.' });
      return
    }
    let urlParams = `?id=${nAccountId}&APIKEY=${this.businessDetails?.oPrintNode?.sApiKey}`
    this.apiService.getNew('cashregistry', '/api/v1/printnode/printers' + urlParams).subscribe(
      (result: any) => {
        if (result?.length > 0) {
          this.printersList = result.map((printer: any) => {
            printer.keyValue = printer.computer.id + '/id/' + printer.id;
            return printer;
          });
        }
      }
    );
  }

  // Get printer details for display on view
  getPrinterDetails(details: any) {
    let ids = this.getSelectedValue(details);
    return ids;
  }
  // Function for edit template
  openEditSetting(format: any) {
    this.dialogService.openModal(PrintSettingsEditorComponent, { cssClass: "modal-xl", context: { format } })
      .instance.close.subscribe(result => {

      });
  }

  // Function for edit workstation
  editWorkstation(workstation?: any) {
    if (!workstation) {
      workstation = {
        sName: '',
        sDescription: '',
        iBusinessId: this.businessDetails._id,
        iLocationId: this.iLocationId,
        nPrintNodeComputerId: undefined,
      }
    }
    workstation = JSON.parse(JSON.stringify(workstation));
    this.dialogService.openModal(AddEditWorkstationComponent, { cssClass: "modal-xl", context: { workstation, printNodeAccountId: this.businessDetails?.oPrintNode?.nAccountId, apikey: this.businessDetails?.oPrintNode?.sApiKey  } })
      .instance.close.subscribe(result => {
        if (result == "fetchWorkstations") {
          this.getWorkstations();
        }
      });
  }

  // Function for create or update print settings
  savePrintSetting(type: any) {
    let printer = this.printersList.filter((printer: any) => printer.id == type.workstation[type.name][type.type]?.nPrinterId);
    if (printer.length == 1) {
      let reqData = {
        sPrinterName: printer[0].name,
        sMethod: type.name == 'LABEL' ? 'labelDefinition' : type.name.toLowerCase(),
        sUser: 'customer',
        nComputerId: printer[0].computer.id,
        nPrinterId: printer[0].id,
        sType: type.type,
        iBusinessId: this.businessDetails._id,
        iLocationId: this.iLocationId,
        iWorkstationId: type.workstation._id,
      };
      type.workstation[type.name][type.type].printerName = printer[0].name;
      this.apiService.postNew('cashregistry', '/api/v1/print-settings/create', reqData).subscribe(
        (result: any) => {
          if (result.message == 'success') {
            if (result?.data?._id) {
              type.workstation[type.name][type.type].printSetting = result.data;
            }
            if (this.workStationsCount > 0) {
              if (this.workStationsCount == 1) {
                this.getWorkstations();
                this.fetchPrintSettings();
              }
              --this.workStationsCount;
            }
          }
        }
      )
    }
  }

  trackByFunction(element: any) {
    return element._id;
  }

  onChange(event: any, type: any) {
    if (!type.workstation[type.name]) {
      type.workstation[type.name] = {};
    }
    let ids = event.split('/id/');
    type.workstation[type.name][type.type] = {
      nPrinterId: parseInt(ids[1]),
      nComputerId: parseInt(ids[0])
    };
    this.savePrintSetting(type);
  }

  // Function for get selected print setting for workstation
  getSelectedValue(event: any) {
    let computerId = event.workstation && event.workstation[event.name] && event.workstation[event.name][event.type] ? event.workstation[event.name][event.type]?.nComputerId : '';
    let printerId = event.workstation && event.workstation[event.name] && event.workstation[event.name][event.type] ? event.workstation[event.name][event.type]?.nPrinterId : '';
    if ((computerId == '' || printerId == '') && this.businessPrintSettings?.length > 0) {
      let method = event.name == 'LABEL' ? 'labelDefinition' : event.name.toLowerCase()
      let selectedSetting = this.businessPrintSettings.filter((setting: any) => setting.iWorkstationId == event.workstation._id &&
        setting?.sMethod == method && setting?.sType == event.type);
      computerId = selectedSetting[0]?.nComputerId || '';
      printerId = selectedSetting[0]?.nPrinterId || '';
      if (printerId != '') {
        if (!event.workstation[event.name]) {
          event.workstation[event.name] = {};
        }
        event.workstation[event.name][event.type] = {
          nPrinterId: printerId,
          nComputerId: computerId,
          printerName: selectedSetting[0]?.sPrinterName || '',
          printSetting: selectedSetting[0]
        };
      }
    }
    return (computerId != '' && printerId != '') ? computerId + '/id/' + printerId : '';
  }

  // Function for get print settings 
  fetchPrintSettings() {
    let reqData = { iBusinessId: this.businessDetails._id, iLocationId: this.iLocationId };
    this.apiService.postNew('cashregistry', '/api/v1/print-settings/list/' + this.businessDetails._id, reqData).subscribe(
      (result: any) => {
        if (result?.data[0]?.result?.length > 0) {
          this.businessPrintSettings = result.data[0].result;
        }
      }
    )
  }

  // Function for group printers by computer name
  groupByFn = (item: any) => item.computer.name;

  // Function for remove print setting
  removePrintSetting(details: any) {
    let printSetting = details.workstation[details.name][details.type]?.printSetting;
    this.apiService.deleteNew('cashregistry', `/api/v1/print-settings/${this.businessDetails._id}/${printSetting._id}`).subscribe(
      (result: any) => {
        if (result.message == 'success') {
          this.businessPrintSettings = this.businessPrintSettings.filter((pSetting: any) => pSetting._id != printSetting._id);
          details.workstation[details.name][details.type] = undefined;
        }
      }
    )

  }

  // Function for copy print setting
  copyPrintSetting(details: any) {
    let printSetting = details.workstation[details.name][details.type]?.printSetting;
    this.workStationsCount = this.workstations.length;
    this.workstations.forEach((workstation: any) => {
      if (!workstation[details.name]) {
        workstation[details.name] = {}
      }
      workstation[details.name][details.type] = details.workstation[details.name][details.type];
      this.savePrintSetting({ name: details.name, type: details.type, workstation });
    });
  }
}
