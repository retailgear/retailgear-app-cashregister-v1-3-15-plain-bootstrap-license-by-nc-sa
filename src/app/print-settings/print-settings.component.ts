import { Component, OnInit } from '@angular/core';
import { faPencilAlt, faRefresh, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LabelTemplateModelComponent } from 'src/app/print-settings/lable-template-model/label-template-model.component';
import { PrinterToolComponent } from 'src/app/print-settings/printer-tool/printer-tool.component';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { ActionSettingsComponent } from '../shared/components/actions-settings/action-settings.component';
import { PrintSettingsDetailsComponent } from '../shared/components/print-settings-details/print-settings-details.component';
import { PrintSettingsEditorComponent } from '../shared/components/print-settings-editor/print-settings-editor.component';
import { DialogService } from '../shared/service/dialog';
import { MenuComponent } from '../shared/_layout/components/common';
import { Js2zplService } from 'src/app/shared/service/js2zpl.service';
import { PrintService } from '../shared/service/print.service';
@Component({
  selector: 'app-print-settings',
  templateUrl: './print-settings.component.html',
  styleUrls: ['./print-settings.component.sass']
})
export class PrintSettingsComponent implements OnInit {

  faRefresh = faRefresh;
  faPencilAlt = faPencilAlt;
  faXmark = faXmark;
  loading: boolean = false;
  businessDetails: any;
  device: any = {
    name: 'Shubham`s device'
  };
  newLabel: boolean = false;
  newPrinter: boolean = false;
  oldLabelList: Array<any> = [
    'Any'
  ]
  newLabelList: Array<any> = [
    'Any'
  ]
  layouts: Array<any> = [
    'Any'
  ]
  printers: Array<any> = [
    'Any'
  ]
  pageFormats: any = [
    { key: 'transaction', value: 'Transaction receipt' },
    { key: 'activity', value: 'Activity receipt' },
    { key: 'giftcard', value: 'Giftcard receipt' },
  ];

  aActionSettings:any = [];

  
  iBusinessId: string = '';
  iLocationId: string = '';
  isLoadingDefaultLabel: boolean = false;
  isLoadingTemplatesLabel: boolean = false;
  defaultLabelsData: Array<TemplateJSON> = []
  LabelTemplatesData: Array<TemplateJSON> = []
  bShowActionSettingsLoader: boolean = false;
  labelPrintSettings: any;
  iWorkstationId: any;

  constructor(
    private dialogService: DialogService,
    private toastService: ToastService,
    private apiService: ApiService,
    private printService: PrintService,
  ) { }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
    this.isLoadingDefaultLabel = true
    this.isLoadingTemplatesLabel = true
    this.getLabelTemplate();
    this.fetchBusinessDetails();
    this.fetchActionSettings();
    this.getLabelPrintSetting();

    setTimeout(() => {
      MenuComponent.reinitialization();
    }, 200);

    
  }

  createPrintSettings() {
    this.dialogService.openModal(PrintSettingsDetailsComponent, { cssClass: "modal-xl", context: { mode: 'create' } }).instance.close.subscribe(result => { });
  }

  // Function for fetch business details
  fetchBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId)
      .subscribe((result: any) => {
        this.businessDetails = result.data;
      });
  }

  trackByFun(index: any, item: any) {
    return index;
  }
  openToolsModal() {
    const dialogRef = this.dialogService.openModal(PrinterToolComponent, {
      cssClass: "modal-lg w-100",
      context: {}
    })

    dialogRef.instance.close.subscribe(async (result) => {
      if (result) { }
    })
  }

  openLabelTemplateModal(jsonData: TemplateJSON, mode: 'create' | 'edit') {
    if (mode === 'create') {
      jsonData.readOnly = false
      jsonData.iBusinessId = this.iBusinessId
      jsonData.iLocationId = this.iLocationId
      delete jsonData.dCreatedDate
      delete jsonData.dUpdatedDate
      delete jsonData._id
      delete jsonData.__v
    }
    const dialogRef = this.dialogService.openModal(LabelTemplateModelComponent, {
      cssClass: "modal-xl w-100",
      context: {
        mode,
        jsonData
      }
    })

    dialogRef.instance.close.subscribe(async (result) => {
      if (result) {

        this.isLoadingTemplatesLabel = true

        if (mode === 'create') {
          await this.createLabelTemplate(result)
          this.getLabelTemplate()
        }
        if (mode === 'edit') {
          await this.updateLabelTemplate(result._id.toString(), result)
          this.getLabelTemplate()
          // this.toastService.show({ type: 'warning', text: 'TODO: add put api in backend' });
        }
      }

    });
  }

  async getLabelTemplate(): Promise<any[]> {
    // await this.postLabelTemplate()
    return new Promise((resolve, reject) => {
      this.apiService.getNew('cashregistry', `/api/v1/label/templates/${this.iBusinessId}`).subscribe((result: any) => {
        this.defaultLabelsData = result.data.filter((lable: any) => lable.readOnly)
        this.LabelTemplatesData = result.data.filter((lable: any) => !lable.readOnly).map((template:any)=> {
          template.elements.map((element: any, i: number) => {
            template.elements[i]['type'] = element.sType
          })
          return template
        })
        console.log(this.LabelTemplatesData)
        this.isLoadingTemplatesLabel = false
        this.isLoadingDefaultLabel = false

        resolve(result.data)
      }, (error) => {
        this.isLoadingTemplatesLabel = false
        this.isLoadingDefaultLabel = false
        console.log('error: ', error);
        resolve(error)
      })
    });
  }

  createLabelTemplate(jsonData: TemplateJSON) {
    const oBody = {
      "iBusinessId": jsonData.iBusinessId,
      "iLocationId": jsonData.iLocationId,
      "template": jsonData
    }
    return new Promise(resolve => {

      this.apiService.postNew('cashregistry', `/api/v1/label/templates`, oBody).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: 'label created successfully' });
        resolve(result);
      }, (error) => {
        resolve(error);
        console.log('error: ', error);
        this.toastService.show({ type: 'warning', text: 'Something went wrong' });
      })
    })
  }

  updateLabelTemplate(id: string, jsonData: TemplateJSON) {
    const oBody = {
      "iBusinessId": jsonData.iBusinessId,
      "iLocationId": jsonData.iLocationId,
      "template": jsonData
    }
    return new Promise(resolve => {

      this.apiService.putNew('cashregistry', `/api/v1/label/templates/${id.toString()}`, oBody).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: 'label updated successfully' });
        resolve(result);
      }, (error) => {
        resolve(error);
        console.log('error: ', error);
        this.toastService.show({ type: 'warning', text: 'Something went wrong' });
      })
    })
  }

  deleteLabelTemplate(id: any) {
    const buttons = [
      { text: 'YES', value: true, status: 'success', class: 'btn-primary ml-auto mr-2' },
      { text: 'NO', value: false, class: 'btn-danger ' }
    ]
    this.dialogService.openModal(ConfirmationDialogComponent, {
      context: {
        header: 'REMOVE_LABEL_TEMPLATE',
        bodyText: 'ARE_YOU_SURE_TO_REMOVE_THIS_LABEL_TEMPLATE',
        buttonDetails: buttons
      }
    })
      .instance.close.subscribe(
        (result) => {
          if (result) {
            this.isLoadingTemplatesLabel = true

            this.apiService.deleteNew('cashregistry', `/api/v1/label/templates/${id.toString()}`).subscribe((result: any) => {
              this.getLabelTemplate()
              this.toastService.show({ type: 'success', text: 'label deleted successfully' });

            }, (error) => {
              console.log('error: ', error);
              this.toastService.show({ type: 'warning', text: 'Something went wrong' });
              this.isLoadingTemplatesLabel = false

            })
          }

        }
      )
  }

  saveTemplateSettings() {

  }

  openSettingsEditor(format: any) {
    this.dialogService.openModal(PrintSettingsEditorComponent, { cssClass: "modal-xl", context: { format: format } })
      .instance.close.subscribe(result => {

      });
  }

  async fetchActionSettings(){
    this.bShowActionSettingsLoader = true;
    const data = {
      iLocationId: this.iLocationId,
      oFilterBy: {
        sMethod: 'actions'
      }
    }
    const result:any = await this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, data).toPromise();
    this.bShowActionSettingsLoader = false;
    if(result?.data[0]?.result?.length){
      this.aActionSettings = result?.data[0]?.result[0];
    }
  }

  openActionSetting(mode: string = 'create', index:number = 0){
    let obj :any = {
      mode: mode  
    }
    if(mode === 'update'){
      const item = this.aActionSettings.aActions[index];
      if (item?.eType) obj.eType = item?.eType;
      if (item?.eSituation) obj.eSituation = item?.eSituation;
      if (item?.aActionToPerform) obj.aActions = item?.aActionToPerform;
      obj._id = this.aActionSettings._id
      obj.iActionId = item._id
    }

    this.dialogService.openModal(ActionSettingsComponent, { cssClass: "modal-lg", context: {...obj} })
      .instance.close.subscribe(result => {
        if(result){
          this.aActionSettings = [];
          this.fetchActionSettings();
        }
      });
  }

  async removeActionSetting(index:number){
    const iPrintSettingsId = this.aActionSettings._id;
    const iActionId = this.aActionSettings.aActions[index]._id;
    await this.apiService.deleteNew('cashregistry', `/api/v1/print-settings/${this.iBusinessId}/${iPrintSettingsId}/${iActionId}`).toPromise();
    this.fetchActionSettings();
    // this.aActionSettings.splice(index, 1);
  }

  getLabelPrintSetting() {
    this.apiService.getNew('cashregistry', `/api/v1/print-settings/${this.iBusinessId}/${this.iWorkstationId}/labelDefinition/default`).subscribe(
      (result: any) => {
        if (result?.data?._id) {
          this.labelPrintSettings = result?.data;
        } else {
          this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
        }
      },
      (error: any) => {
        console.error(error)
      }
    );
  }

  async sentToLayout(template:any){
    console.log(319, template)
    const js2zplService = new Js2zplService(template);
    let layoutCommand: any = js2zplService.generateCommand(template, {}, false)
    const response: any = await this.printService.printRawContent(
      this.iBusinessId,
      layoutCommand,
      this.labelPrintSettings?.nPrinterId,
      this.labelPrintSettings?.nComputerId,
      1,
      { title: 'Set layout' },
      this.businessDetails.oPrintNode.sApiKey
    )

    if (response.status == "PRINTJOB_NOT_CREATED") {
      let message = '';
      if (response.computerStatus != 'online') {
        message = 'Your computer status is : ' + response.computerStatus + '.';
      } else if (response.printerStatus != 'online') {
        message = 'Your printer status is : ' + response.printerStatus + '.';
      }
      this.toastService.show({ type: 'warning', title: 'PRINTJOB_NOT_CREATED', text: message });
    } else {
      this.toastService.show({ type: 'success', text: 'PRINTJOB_CREATED', apiUrl: '/api/v1/printnode/print-job/' + response.id });
    }
  }

  async printSample(template:any){
    const js2zplService = new Js2zplService(template);
    
    const sampleObject = {
      '%%PRODUCT_NAME%%': 'Ring Diamant',
      '%%SELLING_PRICE%%': '1234',
      '%%PRODUCT_NUMBER%%': 'KA123456',
      '%%ARTICLE_NUMBER%%': '000001234',
      '%%BRAND_NAME%%': 'Kasius',
      '%%EAN%%': '8718834442003',
      '%%DIAMONDINFO%%': 'DI,SI2,H,0.13',
      '%%PRODUCT_WEIGHT%%': '3.02',
      '%%DESCRIPTION%%': 'Ring diamant 0.13ct',
      '%%MY_OWN_COLLECTION%%': 'Ringen',
      '%%VARIANTS_COLLECTION%%': 'Ringen',
      '%%BRAND_COLLECTION1%%': 'Ringen',
      '%%BRAND_COLLECTION2%%': 'Goud',
      '%%TOTALCARATWEIGHT%%': '0.13',
      '%%LAST_DELIVIERY_DATE%%': '08-05-2020',
      '%%SUPPLIER_NAME%%': 'Kasius NL',
      '%%SUPPLIER_CODE%%': 'KAS',
      '%%SUGGESTED_RETAIL_PRICE%%': '5678',
      '%%PRODUCT_CATEGORY%%': 'RINGEN',
      '%%PRODUCT_SIZE%%': '20',
      '%%JEWEL_TYPE%%': 'RING',
      '%%JEWEL_MATERIAL%%': 'Goud',
      '%%STRAP_WIDTH%%': '30mm',
      '%%STRAP_MATERIAL%%': 'Staal',
      '%%QUANTITY%%' :'1'
    }

    let layoutCommand: any = js2zplService.generateCommand(template, sampleObject, true)
    const response: any = await this.printService.printRawContent(
      this.iBusinessId,
      layoutCommand,
      this.labelPrintSettings?.nPrinterId,
      this.labelPrintSettings?.nComputerId,
      1,
      { title: 'Sample print' },
      this.businessDetails.oPrintNode.sApiKey
    )

    if (response.status == "PRINTJOB_NOT_CREATED") {
      let message = '';
      if (response.computerStatus != 'online') {
        message = 'Your computer status is : ' + response.computerStatus + '.';
      } else if (response.printerStatus != 'online') {
        message = 'Your printer status is : ' + response.printerStatus + '.';
      }
      this.toastService.show({ type: 'warning', title: 'PRINTJOB_NOT_CREATED', text: message });
    } else {
      this.toastService.show({ type: 'success', text: 'PRINTJOB_CREATED', apiUrl: '/api/v1/printnode/print-job/' + response.id });
    }
  }



}
// Generated by https://quicktype.io

export interface TemplateJSON {
  _id?: String;
  __v?: String;
  readOnly: boolean;
  inverted: boolean;
  encoding: number;
  media_darkness: number;
  media_type: string;
  disable_upload: boolean; 
  can_rotate: boolean;
  alternative_price_notation: boolean;
  dpmm: number;
  height: number;
  width: number;
  labelleft: number;
  labeltop: number;
  offsetleft: number;
  offsettop: number;
  elements: TemplateJSONElement[];
  layout_name: string;
  name: string;
  iBusinessId: string;
  iLocationId: string;
  dCreatedDate?: string;
  dUpdatedDate?: string;
}

export interface TemplateJSONElement {
  _id?: string;
  sType: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  visible?: string;
  pnfield?: string;
  charwidth?: number;
  charheight?: number;
  euro_prefix?: boolean;
}
