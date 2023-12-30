import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { faCopy, faPencilAlt, faSave, faTimes, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
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
  typeList: any = [
    { name: 'PAYNL', key: 'paynl', enabled: true },
    { name: 'CCV', key: 'ccv', enabled: false },
  ];
  loading: boolean = false;
  tableMaxWidth: number = window.innerWidth - 200;
  workstations: any = [];
  aTerminalList: any = [];
  businessPrintSettings !: Array<any>;
  workStationsCount: number = 0;
  bOpen = false;
  currentOpenSettings: string = "paynl";
  oBusinessSetting: any = {
    iBusinessSettingId: '',
    aPaymentIntegrations: []
  }
  bTerminalsLoading: boolean = false;
  bSavingSettings: boolean = false;
  bPaynlUseForWebshop: boolean = false;
  bCcvUseForWebshop: boolean = false;
  bMollieUseForWebshop: boolean = false;
  bStripeUseForWebshop: boolean = false;

  iPaymentServiceProviderId: string = '';
  oPaymentServiceProviders: any = {
    paynl: {
      oDefault: {
        sServiceId: '',
        sApiToken: '',
        sApiCode: '',
        aPaymentIntegrations: [],
      },
      oWebShop: {
        sServiceId: '',
        sApiToken: '',
        sApiCode: '',
        aPaymentIntegrations: [],
      },
      bIsWebShop: false
    },
    ccv: {
      oDefault: {
        sApiCode: '',
        eManagementId: '',
        aPaymentIntegrations: [],
      },
      oWebShop: {
        sApiCode: '',
        eManagementId: '',
        aPaymentIntegrations: [],
      },
      bIsWebShop: false
    },
    mollie: {
      oDefault: {
        sApiToken: '',
      },
      oWebShop: {
        sApiToken: '',
      },
      bIsWebShop: false
    },
    stripe: {
      oDefault: {
        sSecret: '',
        sSignature: ''
      },
      oWebShop: {
        sSecret: '',
        sSignature: ''
      },
      bIsWebShop: false
    },
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private terminalService: TerminalService
  ) { }

  async ngOnInit() {
    this.apiService.setToastService(this.toastService);

    if(this.iBusinessId && this.iLocationId){
      this.fetchTerminals();
      this.getWorkstations();
    }
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
      this.bSavingSettings = false;
      this.fetchPaymentProviderSetting();
    })
  }

  fetchPaymentProviderSetting() {
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oFilterBy: { eName: ['paynl', 'ccv', 'mollie', 'stripe'] }
    }
    this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider/list`, oBody).subscribe((result: any) => {
      if (result?.data && result.data._id) {
        const paynlDefault = this.oPaymentServiceProviders['paynl'].oDefault;
        this.iPaymentServiceProviderId = result.data._id;
        if (!result.data.oCredentials.paynl.oWebShop) this.oPaymentServiceProviders['paynl'].oWebShop = paynlDefault;
        for (let key of Object.keys(result.data.oCredentials)) {
          let obj = result.data.oCredentials[key];
          if (!obj.oWebShop) {
            obj['oWebShop'] = this.oPaymentServiceProviders[key].oDefault;
            if (['paynl', 'ccv'].includes(key)) obj['oWebShop']['aPaymentIntegrations'] = [];
          }
          if (!obj.bIsWebShop) obj['bIsWebShop'] = false;
          this.oPaymentServiceProviders[key] = obj;
        }
        this.mapWorkstations();
      }
    });
  }

  mapWorkstations() {
    this.workstations.forEach((ws: any) => {
      ws.paynl = { sTerminalId: '', edit: false }
      ws.ccv = { sTerminalId: '', edit: false }
      if (this.oPaymentServiceProviders.paynl.oDefault?.aPaymentIntegrations?.length) {
        const oAssigned = this.oPaymentServiceProviders.paynl.oDefault.aPaymentIntegrations.find((item: any) => item.iWorkstationId == ws._id)
        if (oAssigned) {
          ws.paynl.sTerminalName = this.aTerminalList.find((oTerminal: any) => oTerminal.id == oAssigned.sTerminalId)?.name || '';
          ws.paynl.sTerminalId = oAssigned.sTerminalId || '';
        }
      }
      if (this.oPaymentServiceProviders.ccv.oDefault?.aPaymentIntegrations?.length) {
        const oAssigned = this.oPaymentServiceProviders.ccv.oDefault.aPaymentIntegrations.find((item: any) => item.iWorkstationId === ws._id)
        if (oAssigned) ws.ccv.sTerminalId = oAssigned.sTerminalId;
      }
    });
  }

  async remove(event: any, provider: any, workstation: any) {
    let iPaymentServiceProviderId = '';
    if (provider === 'paynl') {
      iPaymentServiceProviderId = this.oPaymentServiceProviders[provider].oDefault.iPaymentServiceProviderId;
      const oSavedDataIndex = this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations.findIndex((i: any) => i.iWorkstationId === workstation._id);
      this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations.splice(oSavedDataIndex, 1);
      this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations = [...this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations];
    } else {
      iPaymentServiceProviderId = this.oPaymentServiceProviders[provider].oDefault.iPaymentServiceProviderId;
      const oSavedDataIndex = this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations.findIndex((i: any) => i.iWorkstationId === workstation._id);
      this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations.splice(oSavedDataIndex, 1);
      this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations = [...this.oPaymentServiceProviders[provider].oDefault.aPaymentIntegrations];
    }
    const payload = {
      iPaymentServiceProviderId: this.iPaymentServiceProviderId,
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oCredentials: this.oPaymentServiceProviders
    }
    this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider`, payload).subscribe((result: any) => {
      workstation[provider].sTerminalId = '';
      if (result) {
        this.toastService.show({ type: 'success', text: 'DELETED' });
        this.fetchPaymentProviderSetting();
      } else this.toastService.show({ type: 'danger', text: 'ERROR' });
    });
  }

  toggleSettings(provider: any) {
    if (this.currentOpenSettings === provider) this.currentOpenSettings = "";
    else this.currentOpenSettings = provider;
  }

  async savePaymentIntegration(event: any, provider: any, workstation: any) {
    const oTerminalData = { iWorkstationId: workstation._id, sTerminalId: event };
    if (provider === 'paynl') {
      const oSavedDataIndex = this.oPaymentServiceProviders.paynl.oDefault.aPaymentIntegrations.findIndex((i: any) => i.iWorkstationId === workstation._id);
      if (oSavedDataIndex > -1) this.oPaymentServiceProviders.paynl.oDefault.aPaymentIntegrations.splice(oSavedDataIndex, 1);
      this.oPaymentServiceProviders.paynl.oDefault.aPaymentIntegrations = [...this.oPaymentServiceProviders.paynl.oDefault.aPaymentIntegrations, oTerminalData];
    } else {
      const oSavedDataIndex = this.oPaymentServiceProviders.ccv.oDefault.aPaymentIntegrations.findIndex((i: any) => i.iWorkstationId === workstation._id);
      if (oSavedDataIndex > -1) this.oPaymentServiceProviders.ccv.oDefault.aPaymentIntegrations.splice(oSavedDataIndex, 1);
      this.oPaymentServiceProviders.paynl.oDefault.aPaymentIntegrations = [...this.oPaymentServiceProviders.ccv.oDefault.aPaymentIntegrations, oTerminalData];
    }
    if (!this.iPaymentServiceProviderId) {
      this.toastService.show({ type: 'warning', text: `Please set your credentials for ${provider}!` })
      workstation[provider].sTerminalId = '';
      return;
    }
    const payload = {
      iPaymentServiceProviderId: this.iPaymentServiceProviderId,
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oCredentials: this.oPaymentServiceProviders
    }
    this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider`, payload).subscribe((result: any) => {
      if (result) {
        this.toastService.show({ type: 'success', text: 'UPDATED' });
        this.fetchPaymentProviderSetting();
      } else this.toastService.show({ type: 'danger', text: 'ERROR' });
    });
  }

  async saveSettings() {
    this.bSavingSettings = true;
    // const sType = this.currentOpenSettings;
    const payload = {
      iPaymentServiceProviderId: this.iPaymentServiceProviderId,
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oCredentials: this.oPaymentServiceProviders
    }
    this.apiService.postNew('cashregistry', `/api/v1/payment-service-provider/`, payload).subscribe((result: any) => {
      if (result?.data) {
        this.bSavingSettings = false;
        this.fetchTerminals();
        this.fetchPaymentProviderSetting();
        this.toastService.show({ type: 'success', text: 'SAVED' });
      }
    }, err => this.bSavingSettings = false);
  }

  trackByFunction(element: any) {
    return element._id;
  }

  onUseForWebshop(event: any, type: string) {
    this.oPaymentServiceProviders[type].bIsWebShop = event.target.checked;
    if (this.oPaymentServiceProviders[type].bIsWebShop) {
      this.oPaymentServiceProviders[type].oWebShop = this.oPaymentServiceProviders[type].oDefault;
    }
    // else {
    //   this.oPaymentServiceProviders[type]['oWebShop'] = (object: any) => {
    //     for (const name in object) {
    //       if (object.hasOwnProperty(name)) {
    //         delete object[name];
    //       }
    //     }
    //   };
    // }
  }

}
