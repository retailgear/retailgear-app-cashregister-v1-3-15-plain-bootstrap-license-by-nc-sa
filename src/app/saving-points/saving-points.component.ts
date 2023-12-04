import { Component, OnInit } from '@angular/core';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../shared/service/api.service';
import { TillService } from '../shared/service/till.service';
import { ToastService } from '../shared/components/toast';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-saving-points',
  templateUrl: './saving-points.component.html',
  styleUrls: ['./saving-points.component.scss']
})
export class SavingPointsComponent implements OnInit {

  addNew: boolean = false;
  faPencilAlt = faPencilAlt;
  faTrash = faTrash;
  workstation: any = {
    sName: '',
    sDescription: ''
  }
  loading: boolean = false;
  workstations: Array<any> = [];
  settings: Array<any> = [];
  iBusinessId = localStorage.getItem('currentBusiness')
  downloadOptions = [
    {
      title: 'CSV_DOWNLOAD',
      key: 'CSV_DOWNLOAD'
    },
    {
      title: 'PDF_DOWNLOAD',
      key: 'PDF_DOWNLOAD'
    }
  ];
  expiry: Array<any> = [
    'Year', 'Month', 'Day'
  ];
  savingPointsSettings: any = {};
  aArticleGroups:any;

  aPaymentMethods:any;


  constructor(
    private apiService: ApiService,
    public tillService: TillService,
    private toastService: ToastService,
    private translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService)
    // this.business._id = localStorage.getItem('currentBusiness');
    this.fetchSetting();
    this.fetchArticleGroup();
    this.fetchPaymentMethods();
  }

  fetchArticleGroup() {
    const data = {
      iBusinessId: this.iBusinessId,
    }
    this.apiService.postNew('core', '/api/v1/business/article-group/list', data).subscribe((result:any) => {
      if(result?.data?.length && result?.data[0].result?.length) {
        const lang = this.translateService.currentLang;
        this.aArticleGroups = result?.data[0].result.map((el:any) => {
          if (el.oName[lang]) {
            el.sName = el.oName[lang]
          } else if (Object.keys(el.oName)?.length) {
            el.sName = el.oName[Object.keys(el.oName)[0]];
          }
          return el;
        });
      };
    });
  }

  fetchPaymentMethods() {
    this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.iBusinessId).subscribe((result: any) => {
      // console.log(result)
      if (result?.data?.length) {
        this.aPaymentMethods = result.data;
      }
    })
  }

  // /api/v1/points-settings
  fetchSetting() {
    this.apiService.getNew('cashregistry', `/api/v1/points-settings?iBusinessId=${this.iBusinessId}`).subscribe((result: any) => {
      this.savingPointsSettings = result;
      if (!this.savingPointsSettings?.aExcludedArticleGroups?.length) {
        this.savingPointsSettings.aExcludedArticleGroups = []
      }
      if (!this.savingPointsSettings?.aExcludedPaymentMethods?.length) {
        this.savingPointsSettings.aExcludedPaymentMethods = []
      }
      
      if(this.savingPointsSettings.bEnabled === 'undefined' || result.bEnabled === undefined){
        localStorage.setItem('savingPoints', 'false');
      }else{
        localStorage.setItem('savingPoints', JSON.stringify(this.savingPointsSettings.bEnabled));
      }
      // if (result.data && result.data.length > 0) {
      // this.brandsList = result.data[0].result;
      // if (this.item.iBrandId) {
      //   const tempsupp = this.brandsList.find(o => o._id === this.item.iBrandId);
      //   this.brand = tempsupp.sName;
      // }
      // }
    });
  }

  async updateSettings() {
    this.apiService.putNew('cashregistry', `/api/v1/points-settings/${this.savingPointsSettings._id}?iBusinessId=${this.iBusinessId}`, this.savingPointsSettings).subscribe((result: any) => {
      if(result?._id) {
        this.toastService.show({ type: 'success', text: this.translateService.instant('UPDATED') + '!' });
        localStorage.setItem('savingPoints', this.savingPointsSettings.bEnabled);
      }
    });
  }

}
