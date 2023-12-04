import { Component, OnInit } from '@angular/core';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../shared/service/api.service';
import { MenuComponent } from '../shared/_layout/components/common';

@Component({
  selector: 'app-saving-points',
  templateUrl: './saving-points.component.html',
  styleUrls: ['./saving-points.component.sass']
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

  constructor(
    private apiService: ApiService,

  ) { }

  ngOnInit(): void {
    // this.business._id = localStorage.getItem('currentBusiness');
    this.fetchSetting();
  }
  // /api/v1/points-settings
  fetchSetting() {
    this.apiService.getNew('cashregistry', `/api/v1/points-settings?iBusinessId=${this.iBusinessId}`).subscribe((result: any) => {
      this.savingPointsSettings = result;
      // if (result.data && result.data.length > 0) {
      // this.brandsList = result.data[0].result;
      // if (this.item.iBrandId) {
      //   const tempsupp = this.brandsList.find(o => o._id === this.item.iBrandId);
      //   this.brand = tempsupp.sName;
      // }
      // }
    });
  }

  updateSettings() {
    this.apiService.putNew('cashregistry', `/api/v1/points-settings/${this.savingPointsSettings._id}?iBusinessId=${this.iBusinessId}`, this.savingPointsSettings).subscribe((result: any) => {
    });
  }

}
