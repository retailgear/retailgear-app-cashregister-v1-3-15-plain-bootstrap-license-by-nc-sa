import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faCopy, faPencilAlt, faSave, faXmark } from '@fortawesome/free-solid-svg-icons';
import { throwError } from 'rxjs';
import { AddEditWorkstationComponent } from '../../shared/components/add-edit-workstation/add-edit-workstation.component';
import { PrintSettingsEditorComponent } from '../../shared/components/print-settings-editor/print-settings-editor.component';
import { SelectPrintPaperDialogComponent } from '../../shared/components/select-print-paper-dialog/select-print-paper-dialog.component';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { DialogService } from '../../shared/service/dialog';

@Component({
  selector: 'print-workstation',
  templateUrl: './print-workstation.component.html',
  styleUrls: ['./print-workstation.component.scss']
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
        { name: 'REPAIR_ALTERNATIVE_RECEIPT', key: 'repair_alternative', enabled: true },
        { name: 'CERTIFICATE', key: 'certificate', enabled: true },
        { name: 'WEBSHOP', key: 'webshop-revenue', enabled: true }
      ]
    },
    {
      name: 'THERMAL',
      typeList: [
        { name: 'BUSINESS_RECEIPT', key: 'regular', enabled: false },
        { name: 'ORDER_RECEIPT', key: 'order', enabled: false },
        { name: 'REPAIR_RECEIPT', key: 'repair', enabled: false },
        { name: 'REPAIR_ALTERNATIVE_RECEIPT', key: 'repair_alternative', enabled: false },
        { name: 'WARRANTY_RECEIPT', key: 'warranty-receipt', enabled: false },
        { name: 'GIFTCARD_RECEIPT', key: 'giftcard', enabled: false }
      ]
    },
    {
      name: 'LABEL',
      typeList: [
        { name: 'ZPL', key: 'zpl', enabled: false },
        { name: 'TSPL', key: 'tspl', enabled: false }
      ]
    }
  ];
  loading: boolean = false;
  tableMaxWidth: number = window.innerWidth - 200;
  workstations !: Array<any>;
  computersList !: Array<any>;
  printersList !: Array<any>;
  oSelectedPrinter :any;
  businessPrintSettings !: Array<any>;
  workStationsCount: number = 0;
  iWorkstationId = localStorage.getItem('currentWorkstation');
  
  async ngOnInit() {
    this.loading = true;

    const [_workstationsResult, _printSettings, _allPrintersList, _computersList]: any = await Promise.all([
      this.getWorkstations(),
      this.fetchPrintSettings(),
      this.getAllPrintersList(),
      this.getComputersList(),
    ]);
    
    
    this.computersList = _computersList;
    // console.log('computersList',this.computersList);   
    
    if (_printSettings?.data[0]?.result?.length) {
      this.businessPrintSettings = _printSettings.data[0].result;
      // console.log('fetchPrintSettings', this.businessPrintSettings);
    }
    
    if (_allPrintersList?.length) {
      this.printersList = _allPrintersList.map((printer: any) => {
        printer.keyValue = printer.computer.id + '/id/' + printer.id;
        // console.log(printer.keyValue, printer.name);
        return printer;
      });
      // console.log('printersList', this.printersList);
      
    }
    
    this.processWorkstations(_workstationsResult);
  }

  createWorkstation(workstation: any) {
    workstation.iBusinessId = this.businessDetails._id;
    workstation.iLocationId = this.iLocationId;
    this.loading = true;
    this.apiService.postNew('cashregistry', '/api/v1/workstations/create', workstation).subscribe(async (result: any) => {
      this.loading = false;
      this.processWorkstations(await this.getWorkstations());
    }), (error: any) => {
      this.loading = false;
      console.error(error)
    }
  }

  // Function for get workstations list
  getWorkstations() {
    this.workstations = [];
    return this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.businessDetails._id}/${this.iLocationId}`).toPromise();
  }

  processWorkstations(result: any) {
    if (result?.data?.length > 0) {
      this.workstations = result.data;
      this.tableMaxWidth = this.workstations.length * 250;
      this.workstations.forEach(async (workstation: any) => {
        if (workstation.nPrintNodeComputerId) {
          // let computers: any = await this.getComputerDetails(workstation.nPrintNodeComputerId).toPromise();
          workstation.computer = this.computersList.find((computer: any) => computer.id === workstation.nPrintNodeComputerId);
          // console.log('printers for', workstation.nPrintNodeComputerId, this.printersList.filter((p: any) => p.computer.id === workstation.nPrintNodeComputerId))
        }
      });

      //  bring the current workstaion to front of the list 
      const current = this.workstations.splice(this.workstations.findIndex((el: any) => el._id === this.iWorkstationId), 1)
      this.workstations = [...current, ...this.workstations]
      // END
      // console.log('processWorkstations', this.workstations);
    }
  }

  // Function for get computers list
  getComputersList() {
    let nAccountId = this.businessDetails?.oPrintNode?.nAccountId
    if (!nAccountId) {
      this.toastService.show({ type: 'warning', text: 'PrintNode not configured for you business contact admin.' });
      return;
    }
    let urlParams = `?id=${nAccountId}&APIKEY=${this.businessDetails?.oPrintNode?.sApiKey}`;
    return this.apiService.getNew('cashregistry', '/api/v1/printnode/computers' + urlParams).toPromise();
  }

  // Function for get all printers list
  getAllPrintersList() {
    let nAccountId = this.businessDetails?.oPrintNode?.nAccountId
    if (!nAccountId) {
      this.toastService.show({ type: 'warning', text: 'PrintNode not configured for you business contact admin.' });
      return
    }
    let urlParams = `?id=${nAccountId}&APIKEY=${this.businessDetails?.oPrintNode?.sApiKey}`
    return this.apiService.getNew('cashregistry', '/api/v1/printnode/printers' + urlParams).toPromise();
  }

  // Get printer details for display on view
  getPrinterDetails(details: any) {
    let ids = this.getSelectedValue(details);
    return ids;
  }
  
  openEditSetting(format: any) {
    console.log('openEditSetting', {format})
    this.dialogService.openModal(PrintSettingsEditorComponent, { cssClass: "modal-xl", context: { format }, hasBackdrop: true })
      .instance.close.subscribe(result => {

      });
  }

  editWorkstation(workstation?: any) {
    // console.log('Edit Workstation', workstation);
    if (!workstation) {
      workstation = {
        sName: '',
        sDescription: '',
        iBusinessId: this.businessDetails._id,
        iLocationId: this.iLocationId,
        nPrintNodeComputerId: undefined,
      }
    }
    this.dialogService.openModal(AddEditWorkstationComponent, {
      cssClass: "modal-xl",
      context: {
        workstation: JSON.parse(JSON.stringify(workstation)),
        printNodeAccountId: this.businessDetails?.oPrintNode?.nAccountId,
        apikey: this.businessDetails?.oPrintNode?.sApiKey
      },
      hasBackdrop: true
    }).instance.close.subscribe(async (result: any) => {
      // console.log({ result });
      if (result == "fetchWorkstations") this.processWorkstations(await this.getWorkstations());
    });
  }

  // Function for create or update print settings
  savePrintSetting(type: any, printer?: any, sPrinterPageFormat?: any, sPaperTray?: any, nRotation?:any) {
    // console.log(type, printer, sPrinterPageFormat);
    if (!printer) printer = this.printersList.filter((printer: any) => printer.id == type.workstation[type.name][type.type]?.nPrinterId)[0];
    // if (printer.length == 1) {
    let reqData = {
      sPrinterName: printer.name,
      sMethod: type.name == 'LABEL' ? 'labelDefinition' : type.name.toLowerCase(),
      sUser: 'customer',
      nComputerId: printer.computer.id,
      nPrinterId: printer.id,
      sType: type.type,
      iBusinessId: this.businessDetails._id,
      iLocationId: this.iLocationId,
      iWorkstationId: type.workstation._id,
      sPrinterPageFormat: sPrinterPageFormat,
      sPaperTray: sPaperTray,
      nRotation: nRotation,
    };
    if (!type.workstation[type.name][type.type]) {
      type.workstation[type.name][type.type] = { printerName : '', printSetting: {}};
    }
    type.workstation[type.name][type.type].printerName = printer.name;
    type.workstation[type.name][type.type].sPrinterPageFormat = sPrinterPageFormat;
    type.workstation[type.name][type.type].sPaperTray = sPaperTray;
    type.workstation[type.name][type.type].nRotation = nRotation;
    this.apiService.postNew('cashregistry', '/api/v1/print-settings/create', reqData).subscribe(async (result: any) => {
     console.log("save result", result);
      if (result.message == 'success') {
        if (result?.data?._id) {
          type.workstation[type.name][type.type].printSetting = result.data;
          // if (result.data?.sPrinterPageFormat) type.workstation[type.name][type.type].sPrinterPageFormat = result.data.sPrinterPageFormat;
        }
        if (this.workStationsCount > 0) {
          if (this.workStationsCount == 1) {
            this.processWorkstations(await this.getWorkstations());
            this.fetchPrintSettings();
          }
          --this.workStationsCount;
        }
        this.toastService.show({ type: 'success', text: 'Print settings updated!' });
      }else{
        this.toastService.show({ type: 'warning', text: 'Failed!' });
      }
    }
    )
    // }
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
    // console.log('getSelectedValue', event);
    let computerId = event.workstation && event.workstation[event.name] && event.workstation[event.name][event.type] ? event.workstation[event.name][event.type]?.nComputerId : '';
    let printerId = event.workstation && event.workstation[event.name] && event.workstation[event.name][event.type] ? event.workstation[event.name][event.type]?.nPrinterId : '';
    if ((computerId == '' || printerId == '') && this.businessPrintSettings?.length > 0) {
      let method = event.name == 'LABEL' ? 'labelDefinition' : event.name.toLowerCase()
      let selectedSetting = this.businessPrintSettings.filter((setting: any) => setting.iWorkstationId == event.workstation._id &&
        setting?.sMethod == method && setting?.sType == event.type);
      // console.log(selectedSetting);
      computerId = selectedSetting[0]?.nComputerId || '';
      printerId = selectedSetting[0]?.nPrinterId || '';
      const sPrinterPageFormat = selectedSetting[0]?.sPrinterPageFormat || '';
      const sPaperTray = selectedSetting[0]?.sPaperTray || '';
      const nRotation = selectedSetting[0]?.nRotation || 0;
      if (printerId != '') {
        if (!event.workstation[event.name]) {
          event.workstation[event.name] = {};
        }
        event.workstation[event.name][event.type] = {
          nPrinterId: printerId,
          nComputerId: computerId,
          sPrinterPageFormat: sPrinterPageFormat,
          sPaperTray: sPaperTray,
          nRotation: nRotation,
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
    return this.apiService.postNew('cashregistry', '/api/v1/print-settings/list/' + this.businessDetails._id, reqData).toPromise();
      // (result: any) => {
        // if (result?.data[0]?.result?.length > 0) {
        //   this.businessPrintSettings = result.data[0].result;
        //   console.log('fetchPrintSettings', this.businessPrintSettings);
        // }
      // }
    // )
  }

  // Function for group printers by computer name
  // groupByFn = (item: any) => { console.log('groupby'); return item.computer.name };

  // Function for remove print setting
  removePrintSetting(details: any) {
    let printSetting = details.workstation[details.name][details.type]?.printSetting;
    this.apiService.deleteNew('cashregistry', `/api/v1/print-settings/${this.businessDetails._id}/${printSetting._id}`).subscribe(
      (result: any) => {
        if (result.message == 'success') {
          this.toastService.show({ type: 'success', text: 'Print settings removed!' });
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

  openSelectPrintPaperDialog(type: any, workstation: any, template: any) {
    if (!workstation[template]) workstation[template] = {};
    if (!workstation[template][type]) workstation[template][type] = {};
    if (!workstation[template][type]['sPrinterPageFormat']) workstation[template][type]['sPrinterPageFormat'] = '';
    if (!workstation[template][type]['sPaperTray']) workstation[template][type]['sPaperTray'] = '';
    if (!workstation[template][type]['nRotation']) workstation[template][type]['nRotation'] = 0;
    const nPrinterId = workstation[template][type]?.nPrinterId;
    const index = this.printersList.findIndex((printer: any) => printer.id == nPrinterId);
    if (index >= 0) {
      this.oSelectedPrinter = { ...this.printersList[index] };
      this.oSelectedPrinter.name = workstation[template][type]?.printerName;
    }
    this.dialogService.openModal(SelectPrintPaperDialogComponent,
      {
        cssClass: "modal-lg",
        context: {
          oSelectedPrinter: this.oSelectedPrinter,
          printersList: this.printersList,
          oWorkstation: workstation,
          sPrinterPageFormat: workstation[template][type]['sPrinterPageFormat'],
          sPaperTray: workstation[template][type]['sPaperTray'],
          nRotation: workstation[template][type]['nRotation'],
          type,
          template
        },
        hasBackdrop: true
      }).instance.close.subscribe(result => {
        if (result.action) {
          this.savePrintSetting(
            {
              name: template,
              type: type,
              workstation: workstation
            },
            result?.oSelectedPrinter,
            result?.sPrinterPageFormat,
            result?.sPaperTray,
            result?.nRotation || 0);
        }
      });
  }
}
