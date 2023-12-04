import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';
import { ToastService } from '../toast';

@Component({
  selector: 'app-print-settings-editor',
  templateUrl: './print-settings-editor.component.html',
  styleUrls: ['./print-settings-editor.component.sass']
})
export class PrintSettingsEditorComponent implements OnInit {

  dialogRef: DialogComponent;
  faTimes = faTimes;
  format:any;
  jsonData:any = {};
  oTemplate: any = {
    layout:{}
  };
  
  iBusinessId: any = '';
  iLocationId: any = '';
  layout: any;
  aDefaultSettings: any = [
    {
      sTitle: 'Business logo',
      sParameter: 'logo',
      bShow: true,
      eType: 'switch'
    },
    {
      sTitle: 'Orientation',
      sParameter: 'orientation',
      eOptions: ['portrait', 'landscape'],
      value: 'portrait',
      eType: 'dropdown'
    },
    {
      sTitle: 'Page size',
      sParameter: 'pageSize',
      eOptions: ['A4', 'A5', 'custom'],
      value: 'A5',
      nWidth: 0,
      nHeight: 0,
      eType: 'dropdown'
    },
    {
      sTitle: 'Page margins',
      sParameter: 'pageMargins',
      eOptions: ['left', 'top', 'right', 'bottom'],
      aValues: [0, 0, 0, 0],
      eType: 'textArray'
    },
    // {
    //   sTitle: 'Font',
    //   sParameter: 'font',
    //   value: 'MyCustom',
    //   eOptions: ['MyCustom'],
    //   eType: 'dropdown'
    // },
    {
      sTitle: 'Font size',
      sParameter: 'fontSize',
      value: 10,
      eType: 'text'
    },
  ];
  mode !: string;
  @ViewChild('jsonEditor') jsonEditor!: any
  
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
  ) { 
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.iBusinessId = localStorage.getItem('currentBusiness')
    this.iLocationId = localStorage.getItem('currentLocation')
  }

  ngOnInit(): void {
    this.fetchSettings();
  }
  fetchSettings(){
    // this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getTemplate/${this.oTemplate._id}?iBusinessId=${this.iBusinessId}`).subscribe((result: any) => {
    this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/${this.iBusinessId}?eType=${this.format.key}&iLocationId=${this.iLocationId}`).subscribe((result: any) => {
      if(result?.data){
        this.mode = 'update';
        this.oTemplate = result.data;
        this.jsonEditor.jsonData = result.data.layout;
        if (!result.data?.aSettings?.length){
          this.oTemplate.aSettings = this.getDefaultSettings();
        } else this.mapWithDefaultSettings();
      } else {
        this.mode = 'create';
        this.oTemplate.aSettings = this.getDefaultSettings();
      }
    });
  }
  mapWithDefaultSettings(){
    this.oTemplate.aSettings.map((setting:any)=>{
      this.aDefaultSettings.forEach((defaultSetting:any) => {
        if (setting.sParameter === defaultSetting.sParameter){
          setting.eOptions = defaultSetting?.eOptions;
          setting.eType = defaultSetting?.eType;
        }
      });
    });
    
  }
  getDefaultSettings(){
    return [...this.aDefaultSettings];
  }

  saveSettings(){
    if (this.mode === 'update') {
      const oBody = {
        layout: this.jsonEditor.jsonData,
        aSettings: this.oTemplate.aSettings,
        iTemplateId: this.oTemplate._id,
        iBusinessId: this.iBusinessId
      }

      this.apiService.putNew('cashregistry', `/api/v1/pdf/templates/${this.oTemplate._id}`, oBody).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: 'Your settings are successfully saved!' });
        // this.close(true);
      }, (err: any) => {
        this.toastService.show({ type: 'danger', text: 'Error occured!' });
      });
    } else {
      const oBody = {
        layout: this.jsonEditor.jsonData,
        aSettings: this.oTemplate.aSettings,
        iTemplateId: this.oTemplate._id,
        iBusinessId: this.iBusinessId,
        iLocationId: this.iLocationId,
        eType: this.format.key,
        sName: this.format.value
      }
      this.apiService.postNew('cashregistry', `/api/v1/pdf/templates/create`, oBody).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: 'Your settings are successfully saved!' });
        // this.close(true);
      }, (err: any) => {
        this.toastService.show({ type: 'danger', text: 'Error occured!' });
      });
    }
  }

  // activeTabsChanged(tab: any) {
  //   switch (tab) {
  //     case 'CONTENT':
  //       if (!this.layout) this.loadTemplate();
  //       break;
  //   }
  // }

  // loadTemplate(){

  // }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }
}
