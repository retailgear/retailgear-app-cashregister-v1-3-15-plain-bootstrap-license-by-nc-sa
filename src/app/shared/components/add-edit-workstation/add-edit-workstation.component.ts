import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';

@Component({
  selector: 'app-add-edit-workstation',
  templateUrl: './add-edit-workstation.component.html',
  styleUrls: ['./add-edit-workstation.component.sass']
})
export class AddEditWorkstationComponent implements OnInit {

  dialogRef: DialogComponent;
  faTimes = faTimes;

  workstation !: any;
  printNodeAccountId !: number;
  computers !: Array<any>;
  apikey: any;
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.getComputersList();
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  // Function for get computers list
  getComputersList() {
    let urlParams = `?id=${this.printNodeAccountId}&APIKEY=${this.apikey}`
    this.apiService.getNew('cashregistry', '/api/v1/printnode/computers' + urlParams).subscribe(
      (result: any) => {
        if (result?.length > 0) {
          this.computers = result;
        }
      }
    )
  }

  // Function for create new or update existing workstation
  updateWorkstation() {
    if (this.workstation?._id) {
      this.apiService.putNew('cashregistry', '/api/v1/workstations/update', this.workstation).subscribe(
        (result: any) => {
          this.dialogRef.close.emit("fetchWorkstations");
        });
    } else {
      this.apiService.postNew('cashregistry', '/api/v1/workstations/create', this.workstation).subscribe(
        (result: any) => {
          this.dialogRef.close.emit("fetchWorkstations");
        })
    }
  }
}
