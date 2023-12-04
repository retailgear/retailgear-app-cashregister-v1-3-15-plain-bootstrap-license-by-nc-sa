import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/service/api.service';
import { FiskalyService } from '../shared/service/fiskaly.service';

@Component({
  selector: 'app-fiskaly-settings',
  templateUrl: './fiskaly-settings.component.html',
  styleUrls: ['./fiskaly-settings.component.sass']
})
export class FiskalySettingsComponent implements OnInit {

  locationList: any = [];
  userDetails: any;
  businessDetails: any;
  iBusinessId = localStorage.getItem('currentBusiness');
  constructor(
    private apiService: ApiService,
    private fiskalyService: FiskalyService
  ) { }

  ngOnInit(): void {
    this.fetchLocationList();
    // this.fetchTSSList();
  }

  fetchLocationList(): void {
    this.apiService.getNew('core', '/api/v1/business/user-business-and-location/list')
      .subscribe((result: any) => {
        this.userDetails = result.data;
        if (this.userDetails.aBusiness) {
          this.businessDetails = this.userDetails.aBusiness.find((o: any) => o._id === this.iBusinessId);
          this.fetchTSSList();
        }
      }, (error) => {
        console.log('error: ', error);
      });
  }

  fetchTSSList(): void {
    this.fiskalyService.getTSSList()
      .subscribe((res: any) => {
        this.businessDetails.aLocation.forEach((location: any) => {
          const tssData = res.find((o: any) => o.iLocationId === location._id);
          location.tssInfo = null;
          if (tssData) {
            location.tssInfo = tssData.tssInfo;
            location.iTssId = tssData._id;
            location.tssEnabled = tssData.bEnabled;
          };
        });
      })
  }

  async createTSS(locationId: string, index: number) {
    try {
      const result: any = await this.fiskalyService.createTSS(locationId);
      this.businessDetails.aLocation[index].tssInfo = result.tssInfo;
      this.businessDetails.aLocation[index].iTssId = result._id;
      this.businessDetails.aLocation[index].tssEnabled = result.bEnabled;
    } catch (error) {
      console.log(error);
    }
  }

  async changeState(location: any, state: boolean, index: number) {
    try {
      await this.fiskalyService.changeTSSState(location.iTssId, state);
    } catch (error) {
      this.businessDetails.aLocation[index].tssEnabled = !state;
    }
  }

}
