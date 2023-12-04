import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { faCopy, faPencilAlt, faSave, faTimes, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
import { DialogService } from '../shared/service/dialog';
import { TerminalService } from '../shared/service/terminal.service';

@Component({
  selector: 'payment-integration',
  templateUrl: './payment-integration.component.html',
  styleUrls: ['./payment-integration.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('0ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class PaymentIntegrationComponent implements OnInit {
  
  businessDetails: any;
  iBusinessId: any = localStorage.getItem('currentBusiness');
  iLocationId: any = localStorage.getItem('currentLocation');
  iWorkstationId = localStorage.getItem('currentWorkstation');
  @Output() openSetting: EventEmitter<any> = new EventEmitter();
  faPencilAlt = faPencilAlt;
  faSave = faSave;
  faCopy = faCopy;
  faXmark = faXmark;
  faTimes = faTimes;
  businessWorkstations: Array<any> = [];

  typeList:any = [
    { name: 'PAYNL', key: 'paynl', enabled: true },
    { name: 'CCV', key: 'ccv', enabled: true },
  ]

  loading: boolean = false;
  tableMaxWidth: number = window.innerWidth - 200;
  workstations: any = [];
  aTerminalList: any = [];
  businessPrintSettings !: Array<any>;
  workStationsCount: number = 0;
  bOpen = false;
  currentOpenSettings:string = "";
  oPaynl:any = {
    sServiceId: '',
    sApiToken: '',
    sApiCode: '',
    aPaymentIntegration: [],
    iPaymentServiceProviderId: ''
  };
  oCCV:any = {
    sApiCode: '',
    sManagementId: '',
    aPaymentIntegration: [],
    iPaymentServiceProviderId: ''
  };
  oBusinessSetting: any = {
    iBusinessSettingId: '',
    aPaymentIntegration: []
  }
  bTerminalsLoading: boolean = false;
  bSavingSettings: boolean = false;
  bPaynlUseForWebshop: boolean = false;
  bCcvUseForWebshop: boolean = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private terminalService: TerminalService
  ) { }
  
  async ngOnInit() {
    this.apiService.setToastService(this.toastService);

    this.fetchTerminals();
    this.getWorkstations();
  }

  getWorkstations() {
    this.workstations = [];
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}/${this.iLocationId}`).subscribe((result: any) => {
      if (result?.data?.length) {
        this.workstations = result.data;
        this.tableMaxWidth = this.workstations.length * 250;
        const current = this.workstations.splice(this.workstations.findIndex((el: any) => el._id === this.iWorkstationId), 1)
        this.workstations = [...current, ...this.workstations]
      }
    });
  }
  
  async fetchTerminals() {
    this.aTerminalList = []
    this.bTerminalsLoading = true;
    this.terminalService.getTerminals().subscribe(async (result: any) => {
      this.bTerminalsLoading = false;
      this.aTerminalList = result.data[0];
      this.fetchPaymentProviderSetting();
    }, (err) => {
      this.bTerminalsLoading = false;
      this.fetchPaymentProviderSetting();
    })

  }

  fetchPaymentProviderSetting() {
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oFilterBy: {
        eName: ['paynl', 'ccv'],
      }
    }
    this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider/list`, oBody).subscribe((result: any) => {
      if (result?.data?.length) {
        const oPaynlData: any = result?.data.find((item: any) => item.eName === 'paynl');
        if (oPaynlData) {
          this.oPaynl = {
            iPaymentServiceProviderId: oPaynlData?._id || '',
            sServiceId: oPaynlData?.oPayNL.sServiceId || '',
            sApiToken: oPaynlData?.oPayNL.sApiToken || '',
            sApiCode: oPaynlData?.oPayNL.sApiCode || '',
            aPaymentIntegration: oPaynlData?.aPaymentIntegration || []
          }
          this.bPaynlUseForWebshop = oPaynlData?.oWebshop?.bUseForWebshop || false;
        }
        const oCcvData = result?.data.find((item: any) => item.eName === 'ccv');
        if (oCcvData) {
          this.oCCV = {
            iPaymentServiceProviderId: oCcvData?._id || '',
            sApiCode: oCcvData?.oCCV.sApiCode || '',
            sManagementId: oCcvData?.oCCV.sManagementId || '',
            aPaymentIntegration: oCcvData?.aPaymentIntegration || []
          };
          this.bCcvUseForWebshop = oCcvData?.oWebshop?.bUseForWebshop || false;
        }
      }
      this.mapWorkstations();
    });
  }

  mapWorkstations() {
    this.workstations.forEach((ws: any) => {
      ws.paynl = { sTerminalId: '', edit: false }
      ws.ccv = { sTerminalId: '', edit: false }
      if (this.oPaynl.aPaymentIntegration?.length) {
        const oAssigned = this.oPaynl.aPaymentIntegration.find((item: any) => item.iWorkstationId == ws._id)
        if (oAssigned) {
          ws.paynl.sTerminalName = this.aTerminalList.find((oTerminal: any) => oTerminal.id == oAssigned.sTerminalId)?.name || '';
          ws.paynl.sTerminalId = oAssigned.sTerminalId || '';
        }
      }

      if (this.oCCV.aPaymentIntegration?.length) {
        const oAssigned = this.oCCV.aPaymentIntegration.find((item: any) => item.iWorkstationId === ws._id)
        if (oAssigned) {
          ws.ccv.sTerminalId = oAssigned.sTerminalId;
        }
      }
    })
  }

  async remove(event: any, provider: any, workstation: any) {
    let oBody: any = {
      iBusinessId: this.iBusinessId,
      aPaymentIntegration: []
    }
    let iPaymentServiceProviderId = '';
    if (provider === 'paynl') {
      iPaymentServiceProviderId = this.oPaynl.iPaymentServiceProviderId;
      const oSavedDataIndex = this.oPaynl.aPaymentIntegration.findIndex((i: any) => i.iWorkstationId === workstation._id);
      this.oPaynl.aPaymentIntegration.splice(oSavedDataIndex, 1);
      oBody.aPaymentIntegration = [...this.oPaynl.aPaymentIntegration];
    } else {
      iPaymentServiceProviderId = this.oCCV.iPaymentServiceProviderId;
      const oSavedDataIndex = this.oCCV.aPaymentIntegration.findIndex((i: any) => i.iWorkstationId === workstation._id);
      this.oCCV.aPaymentIntegration.splice(oSavedDataIndex, 1);
      oBody.aPaymentIntegration = [...this.oCCV.aPaymentIntegration];
    }
    this.apiService.putNew('cashregistry', `/api/v1/payment-service-provider/${iPaymentServiceProviderId}`, oBody).subscribe((result: any) => {
      workstation[provider].sTerminalId = '';
      if (result)
        this.toastService.show({ type: 'success', text: 'DELETED' });
      else
        this.toastService.show({ type: 'danger', text: 'ERROR' });
    });
  }

  toggleSettings(provider: any) {
    if (this.currentOpenSettings === provider) {
      this.currentOpenSettings = "";
    } else {
      this.currentOpenSettings = provider;
    }    
  }

  async savePaymentIntegration(event: any, provider: any, workstation: any) {
    let oBody: any = {
      iBusinessId: this.iBusinessId,
      aPaymentIntegration: []
    }
    
    let iPaymentServiceProviderId = '';
    const oTerminalData = { iWorkstationId: workstation._id, sTerminalId: event };
    
    if (provider === 'paynl') {

      iPaymentServiceProviderId = this.oPaynl.iPaymentServiceProviderId;
      const oSavedDataIndex = this.oPaynl.aPaymentIntegration.findIndex((i: any) => i.iWorkstationId === workstation._id);
      if (oSavedDataIndex > -1) this.oPaynl.aPaymentIntegration.splice(oSavedDataIndex, 1);
      oBody.aPaymentIntegration = [...this.oPaynl.aPaymentIntegration, oTerminalData];
    
    } else {

      iPaymentServiceProviderId = this.oCCV.iPaymentServiceProviderId;
      const oSavedDataIndex = this.oCCV.aPaymentIntegration.findIndex((i: any) => i.iWorkstationId === workstation._id);
      if (oSavedDataIndex > -1) this.oCCV.aPaymentIntegration.splice(oSavedDataIndex, 1);
      oBody.aPaymentIntegration = [...this.oCCV.aPaymentIntegration, oTerminalData];
    
    }

    if (!iPaymentServiceProviderId) {
      this.toastService.show({ type: 'warning', text: `Please set your credentials for ${provider}!` })
      // workstation[provider].edit = false;
      workstation[provider].sTerminalId = '';
      return;
    }
    workstation[provider].sTerminalName = this.aTerminalList.find((el: any) => el.id === event).name;
    this.apiService.putNew('cashregistry', `/api/v1/payment-service-provider/${iPaymentServiceProviderId}`, oBody).subscribe((result:any) => {
      if(result)
        this.toastService.show({ type: 'success', text: 'UPDATED' });
      else
        this.toastService.show({ type: 'danger', text: 'ERROR' });
    });
    this.fetchPaymentProviderSetting();    
  }

  async saveSettings() {
    this.bSavingSettings = true;
    const sType = this.currentOpenSettings;
    const oBody: any = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      eName : sType,
      oWebshop: { bUseForWebshop: false }
    };
    
    let id = '';

    if(sType === 'paynl') {
      id = this.oPaynl?.iPaymentServiceProviderId;
      oBody.oPayNL = {
        sServiceId: this.oPaynl.sServiceId,
        sApiToken: this.oPaynl.sApiToken,
        sApiCode: this.oPaynl.sApiCode,
      }
      oBody.oWebshop.bUseForWebshop = this.bPaynlUseForWebshop;
    } else {
      id = this.oCCV?.iPaymentServiceProviderId;
      oBody.oCCV = {
        sApiCode: this.oCCV.sApiCode,
        sManagementId: this.oCCV.sManagementId
      }
      oBody.oWebshop.bUseForWebshop = this.bCcvUseForWebshop;
    }

    if(id) { ///update
      await this.apiService.putNew('cashregistry', `/api/v1/payment-service-provider/${id}`, oBody).toPromise();
      this.bSavingSettings = false;
      this.toastService.show({ type: 'success', text: 'UPDATED' });
    } else { // create
      const result: any = await this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider/`, oBody).toPromise();
      if (result?.data?._id) {
        this.toastService.show({ type: 'success', text: 'SAVED' });
        if (sType === 'paynl') this.oPaynl.iPaymentServiceProviderId = result.data._id;
        else this.oCCV.iPaymentServiceProviderId = result.data._id;
      }
    }
    this.fetchTerminals();
    this.fetchPaymentProviderSetting();
  }

  trackByFunction(element: any) {
    return element._id;
  }

  onLocationChange(oLocation: any) {
    if (!oLocation?.oPaynl) {
      oLocation.oPaynl = {
        sServiceId: '',
        sApiToken: '',
        sApiCode: '',
        bUseForWebshop: false
      }
    }
  }
}
