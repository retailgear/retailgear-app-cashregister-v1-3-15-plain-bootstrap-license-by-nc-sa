import { Component, OnInit } from '@angular/core';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
import { FiskalyService } from '../shared/service/fiskaly.service';

@Component({
  selector: 'app-fiskaly-settings',
  templateUrl: './fiskaly-settings.component.html',
  styleUrls: ['./fiskaly-settings.component.scss']
})
export class FiskalySettingsComponent implements OnInit {

  locationList: any = [];
  userDetails: any;
  businessDetails: any;
  iBusinessId = localStorage.getItem('currentBusiness');
  fetchingTss = false;
  constructor(
    private apiService: ApiService,
    private fiskalyService: FiskalyService,
    private toastrService: ToastService,
  ) { }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastrService)
    this.fetchLocationList();
    // this.fetchTSSList();
  }

  async fetchLocationList() {
    this.fetchingTss = true;
    const _result: any = await this.apiService.getNew('core', '/api/v1/business/user-business-and-location/list').toPromise();
    this.userDetails = _result.data;
    if (this.userDetails.aBusiness) {
      this.businessDetails = this.userDetails.aBusiness.find((o: any) => o._id === this.iBusinessId);
      this.fetchTSSList();
    }
  }

  async fetchTSSList(){
    if(!this.fiskalyService.fiskalyAuth) {
      await this.fiskalyService.loginToFiskaly();
    }
    const res: any = await this.fiskalyService.getTSSList();
    this.businessDetails.aLocation.forEach((location: any) => {
      const tssData = res.find((o: any) => o.iLocationId === location._id);
      location.tssInfo = null;
      if (tssData) {
        location.tssInfo = tssData.tssInfo;
        location.iTssId = tssData._id;
        location.tssEnabled = tssData.bEnabled;
      };
    });
    this.fetchingTss = false;

  }

  async createTSS(location: any, index: number) {
    try {
      location.bUpdatingState = true;
      const result: any = await this.fiskalyService.createTSS(location._id);
      this.businessDetails.aLocation[index].tssInfo = result.tssInfo;
      this.businessDetails.aLocation[index].iTssId = result._id;
      this.businessDetails.aLocation[index].tssEnabled = result.bEnabled;
      location.bUpdatingState = false;
      this.toastrService.show({ type: 'success', text: 'TSS has been created!' });
    } catch (error) {
      console.log(error);
    }
  }

  async removeTSS(location:any){
    location.bUpdatingState = true;
    const result: any = await this.fiskalyService.changeTSSState(location, false, true); // tssid, bEnabled, bRemoveFromLive
    location.tssInfo = null;
    location.bUpdatingState = false;

  }

  async changeState(location: any, state: boolean, index: number) {
    try {
      location.bUpdatingState = true;
      await this.fiskalyService.changeTSSState(location, state);
      location.bUpdatingState = false;
      this.toastrService.show({ type: 'success', text: 'Status updated!' });
    } catch (error) {
      this.businessDetails.aLocation[index].tssEnabled = !state;
    }
  }

}
