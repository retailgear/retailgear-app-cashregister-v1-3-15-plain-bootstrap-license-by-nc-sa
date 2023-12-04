import { Component, OnInit } from '@angular/core';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeviceDetailsComponent } from '../shared/components/device-details/device-details.component';
import { ApiService } from '../shared/service/api.service';
import { DialogService } from '../shared/service/dialog';

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.sass']
})
export class DeviceComponent implements OnInit {

  requestParams: any = {
    searchValue: '',
    iBusinessId: ''
  }
  devices: Array<any> = [];
  loading: boolean = false;

  constructor(
    private dialogService: DialogService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness')
    this.getDevices();
  }

  removeDevice(device: any){
    const buttons = [
      {text: "YES", value: true, status: 'success', class: 'btn-primary ml-auto mr-2'},
      {text: "NO", value: false, class: 'btn-warning'}
    ]
    this.dialogService.openModal(ConfirmationDialogComponent, {
      context: {
        header: 'REMOVE_DEVICE',
        bodyText: 'ARE_YOU_SURE_TO_REMOVE_THIS_DEVICE?',
        buttonDetails: buttons
      }
    })
      .instance.close.subscribe(
      result => {
        if (result) {
           this.apiService.deleteNew('cashregistry', '/api/v1/devices/' + device._id + '/' + this.requestParams.iBusinessId).subscribe((result: any) => {
            this.getDevices()
            }, (error) => {
          })
        }
      }
    )
  }

  getDevices(){
    this.devices = [];
    this.loading = true;
    this.apiService.getNew('cashregistry', '/api/v1/devices/list/' + this.requestParams.iBusinessId + '?searchValue=' + this.requestParams.searchValue).subscribe(
      (result : any) => {
        if(result && result.data){
          this.devices = result.data;
         } 
         this.loading = false;
       },
      (error: any) => {
        this.loading = false;
      }
    );
  }

  addNewDevice(){
    this.dialogService.openModal(DeviceDetailsComponent, { cssClass:"", context: { mode: 'create' } }).instance.close.subscribe(result =>{ 
     if(result.action) { this.getDevices(); }
    });
  }

  editDevice(device: any){
    this.dialogService.openModal(DeviceDetailsComponent, { cssClass:"", context: { mode: 'edit', device: device } }).instance.close.subscribe(result =>{ 
     if(result.action) { this.getDevices(); }
    });
  }
}
