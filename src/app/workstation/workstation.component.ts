import { Component, OnInit } from '@angular/core';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../shared/service/api.service';
import { MenuComponent } from '../shared/_layout/components/common';
import { DialogService } from '../shared/service/dialog';
import { AddEditWorkstationComponent } from '../shared/components/add-edit-workstation/add-edit-workstation.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../shared/components/toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-workstation',
  templateUrl: './workstation.component.html',
  styleUrls: ['./workstation.component.scss']
})
export class WorkstationComponent implements OnInit {

  addNew: boolean = false;
  faPencilAlt = faPencilAlt;
  faTrash = faTrash;
  workstation: any = {
    sName: '',
    sDescription: ''
  }
  businessDetails: any = {};
  loading: boolean = false;
  workstations: Array<any> = [];
  settings: Array<any> = [];
  computers: Array<any> = [];
  iLocationId: string = '';
  workstationLoading: boolean = false;
  setOrderSubscription !: Subscription;

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
    private dialogService: DialogService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // MenuComponent.reinitialization();
    this.businessDetails._id = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.getWorkstations();
    this.fetchBusinessDetails();
  }

  // Function for fetch business details
  fetchBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + this.businessDetails._id)
      .subscribe((result: any) => {
        this.businessDetails = result.data;
      });
  }
  shiftWorkstation(type: string, index: number) {
    if (type == 'up') {
      if (this.workstations[index - 1])
        [this.workstations[index - 1], this.workstations[index]] = [this.workstations[index], this.workstations[index - 1]]

    } else {
      if (this.workstations[index + 1])
        [this.workstations[index + 1], this.workstations[index]] = [this.workstations[index], this.workstations[index + 1]]
    }
  }

  setOrder(event: any) {
    event.target.disabled = true;
    this.workstationLoading = true;
    try {
      this.setOrderSubscription = this.apiService.putNew('cashregistry', '/api/v1/workstations/updateSequence/' + this.businessDetails._id, this.workstations).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: `workstations order saved successfully` });
        this.workstationLoading = false;
        event.target.disabled = false;
      }, (error) => {
        this.workstationLoading = false;
        event.target.disabled = false;
      })
    } catch (e) {
      this.workstationLoading = false;
      event.target.disabled = false;
    }

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
    this.apiService.getNew('cashregistry', '/api/v1/workstation-settings/list/'+ this.businessDetails._id + '/' + iWorkstationId).subscribe(
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
      iBusinessId: this.businessDetails._id,
      iLocationId: localStorage.getItem('currentLocation'),
      iWorkstationId: workstation._id,
      iDeviceId: '624e98bd8f532d15180f2d75'
    }
    this.workstation.iBusinessId = this.businessDetails._id;
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
    this.workstation.iBusinessId = this.businessDetails._id;
    this.workstation.iLocationId = this.iLocationId;
    this.loading = true;
    this.addNew = false;
    this.apiService.postNew('cashregistry', '/api/v1/workstations/create', this.workstation).subscribe(
      (result : any) => {
        this.loading = false;
        this.toastService.show({ type: 'success', text: 'WORKSTATION_CREATED_SUCCESSFULLY' });
        this.getWorkstations();
      }),
      (error: any) => {
        this.loading = false;
        console.error(error)
      }
  }

  getWorkstations(){
    this.loading = true;
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.businessDetails._id}/${this.iLocationId}`).subscribe(
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

  deleteWorkstation(workstation : any){
    let self = this;
    const buttons = [
      { text: 'YES', value: true, status: 'success', class: 'btn-primary ml-auto mr-2' },
      { text: 'NO', value: false, class: 'btn-danger ' }
    ];
    this.dialogService.openModal(ConfirmationDialogComponent, {
      context: {
        header: 'REMOVE_WORKSTATION',
        bodyText: 'ARE_YOU_SURE_TO_REMOVE_THIS_WORKSTATION',
        buttonDetails: buttons
      }
    })
    .instance.close.subscribe(
      (result) => {
        if (result) {
          self.apiService.deleteNew('cashregistry', `/api/v1/workstations/${workstation.iBusinessId}/${workstation._id}`).subscribe(
            (result : any) => {
              if(result.message == "success"){
                self.toastService.show({ type: 'success', text: 'WORKSTATION_DELETED_SUCCESSFULLY' });
                self.getWorkstations();
              } else {
                self.toastService.show({ type: 'success', text: 'ERROR_WHILE_DELETING_WORKSTATION' });
              }
            }
          );
        }
      }
    );
  }

  editWorkstation(workstation ?: any){
    if (!workstation) {
      workstation = {
        sName: '',
        sDescription: '',
        iBusinessId: this.businessDetails._id,
        iLocationId: this.iLocationId,
        nPrintNodeComputerId: undefined,
      }
    }
    workstation = JSON.parse(JSON.stringify(workstation));
    this.dialogService.openModal(AddEditWorkstationComponent, { cssClass: "modal-xl", context: { workstation, printNodeAccountId: this.businessDetails?.oPrintNode?.nAccountId, apikey: this.businessDetails?.oPrintNode?.sApiKey  } })
      .instance.close.subscribe(result => {
        if (result == "fetchWorkstations") {
          this.getWorkstations();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.setOrderSubscription) this.setOrderSubscription.unsubscribe();
  }
}
