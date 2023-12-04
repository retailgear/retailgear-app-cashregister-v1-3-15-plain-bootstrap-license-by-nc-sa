import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';

@Component({
  selector: 'app-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss']
})
export class DeviceDetailsComponent implements OnInit {

  dialogRef: DialogComponent;
  faTimes = faTimes
  device: any = {
    sName: '',
    sDescription: ''
  }
  business: any = {}
  mode: string = '';

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService
  ) { 
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.business._id = localStorage.getItem('currentBusiness')
  }

  close(data: any){
    this.dialogRef.close.emit(data);
  }

  editDevice(){
    this.device.iBusinessId = this.business._id;
    this.apiService.putNew('cashregistry', '/api/v1/devices/update', this.device).subscribe(
      (result : any) => {
        this.close({ action: true, device: this.device });
       },
      (error: any) => {
        console.error(error)
      }
    );
  }

  addNewDevice(){
    this.device.iBusinessId = this.business._id;
    this.apiService.postNew('cashregistry', '/api/v1/devices/create', this.device).subscribe(
      (result : any) => {
        this.close({ action: true, device: this.device });
       },
      (error: any) => {
        console.error(error)
      }
    );
  }

}
