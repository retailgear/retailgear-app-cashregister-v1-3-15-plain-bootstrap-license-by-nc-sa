import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';
import { ToastService } from '../toast';
@Component({
  selector: 'app-action-settings',
  templateUrl: './action-settings.component.html',
  styleUrls: ['./action-settings.component.scss']
})
export class ActionSettingsComponent implements OnInit {

  dialogRef: DialogComponent;
  faTimes = faTimes;
  oTemplate: any = {
    layout: {}
  };

  iBusinessId: any = '';
  iLocationId: any = '';
  layout: any;

  mode !: string;
  aTypeOptions: any = [
    { key: 'repair', aSituations: ['is_created', 'is_ready'] },
    { key: 'giftcard', aSituations: ['is_created', 'partly_redeemed'] },
    { key: 'order', aSituations: ['is_created', 'is_ready'] },
    { key: 'regular', aSituations: ['is_created', 'is_ready'] },
    { key: 'expense', aSituations: ['is_created'] }
  ];

  aActionToPerform: any = [
    'DOWNLOAD',
    'PRINT_PDF',
    'PRINT_PDF_ALTERNATIVE',
    'PRINT_THERMAL',
    'PRINT_THERMAL_ALTERNATIVE',
    'EMAIL'
  ];

  eType: any = 'repair';
  eSituation: string = 'is_created';
  aActions: Array<string> = ['DOWNLOAD'];
  iWorkstationId: string | null;
  _id: any;
  iActionId: any;
  bDisableSubmit: boolean = false;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.iBusinessId = localStorage.getItem('currentBusiness')
    this.iLocationId = localStorage.getItem('currentLocation')
    this.iWorkstationId = localStorage.getItem('currentWorkstation')
  }

  ngOnInit(): void {

  }

  async saveSettings() {
    const data = {
      eType: this.eType,
      eSituation: this.eSituation,
      aActionToPerform: this.aActions
    }
    let oBody: any = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      sMethod: 'actions',
      aActions: [
        { ...data }
      ]
    }
    try {
      if (this.mode === 'create') {
        await this.apiService.postNew('cashregistry', '/api/v1/print-settings/create', oBody).toPromise()
        this.toastService.show({ type: 'success', text: 'New setting created successfully' });
      } else {
        oBody._id = this._id;
        oBody.iActionId = this.iActionId;
        await this.apiService.putNew('cashregistry', '/api/v1/print-settings/update', oBody).toPromise();
        this.toastService.show({ type: 'success', text: 'Your setting updated successfully' });
      }
      this.reset()
      this.close(true);
    } catch (error: any) {
      if (error.status === 409) {
        this.toastService.show({ type: 'warning', text: 'Already exists. Please choose different combination' });
      }
    }
  }
  reset() {
    this.eType = 'repair';
    this.eSituation = 'is_created';
    this.aActionToPerform = ['DOWNLOAD']
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  checkActionToPerform() {
    this.bDisableSubmit = (this.aActions?.length) ? false : true;
  }
}
