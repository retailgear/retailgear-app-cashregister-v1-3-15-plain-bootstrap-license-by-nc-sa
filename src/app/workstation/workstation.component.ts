import { Component, OnInit } from '@angular/core';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../shared/service/api.service';
import { MenuComponent } from '../shared/_layout/components/common';

@Component({
  selector: 'app-workstation',
  templateUrl: './workstation.component.html',
  styleUrls: ['./workstation.component.sass']
})
export class WorkstationComponent implements OnInit {

  addNew: boolean = false;
  faPencilAlt = faPencilAlt;
  faTrash = faTrash;
  workstation: any = {
    sName: '',
    sDescription: ''
  }
  business: any = {};
  loading: boolean = false;
  workstations: Array<any> = [];
  settings: Array<any> = [];
  iLocationId: string = '';

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

  constructor(
    private apiService: ApiService,

  ) { }

  ngOnInit(): void {
    // MenuComponent.reinitialization();
    this.business._id = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.getWorkstations();
  }

  selectDropDown(key: String){
    if (key){
      switch (key){
        case'CSV_DOWNLOAD':
          this.getWorkstations();
          break;
        case'PDF_DOWNLOAD':
          this.getWorkstations();
          break;
      }
    }
  }

  getWorkstationSettings(iWorkstationId: any, i: number){
    this.apiService.getNew('cashregistry', '/api/v1/workstation-settings/list/'+ this.business._id + '/' + iWorkstationId).subscribe(
      (result : any) => {
        this.settings = result.data;
        this.workstations[i].settings = this.settings;
      }),
      (error: any) => {
        this.loading = false;
        console.error(error)
      }
  }

  createWorkstationSettings(workstation: any){
    const data = {
      iBusinessId: this.business._id,
      iLocationId: localStorage.getItem('currentLocation'),
      iWorkstationId: workstation._id,
      iDeviceId: '624e98bd8f532d15180f2d75'
    }
    this.workstation.iBusinessId = this.business._id;
    this.loading = true;
    this.addNew = false;
    this.apiService.postNew('cashregistry', '/api/v1/workstation-settings/create', data).subscribe(
      (result : any) => {
        this.loading = false;
        this.getWorkstations();
      }),
      (error: any) => {
        this.loading = false;
        console.error(error)
      }
  }

  createWorkstation(){
    this.workstation.iBusinessId = this.business._id;
    this.workstation.iLocationId = this.iLocationId;
    this.loading = true;
    this.addNew = false;
    this.apiService.postNew('cashregistry', '/api/v1/workstations/create', this.workstation).subscribe(
      (result : any) => {
        this.loading = false;
        this.getWorkstations();
      }),
      (error: any) => {
        this.loading = false;
        console.error(error)
      }
  }

  getWorkstations(){
    this.loading = true;
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.business._id}/${this.iLocationId}`).subscribe(
      (result : any) => {
       if(result && result.data){
        this.workstations = result.data;
        for(let i = 0; i < this.workstations.length; i++){
          this.getWorkstationSettings(this.workstations[i]._id, i);
        }
        setTimeout(() => {
          MenuComponent.createInstances('[data-kt-menu="true"]');
        }, 1000);;
       }       
        this.loading = false;
      }),
      (error: any) => {
        this.loading = false;
      }
  }

}
