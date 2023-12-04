import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { faPencilAlt, faRefresh, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LabelTemplateModelComponent } from '../print-settings/lable-template-model/label-template-model.component';
import { PrinterToolComponent } from '../print-settings/printer-tool/printer-tool.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
import { ActionSettingsComponent } from '../shared/components/actions-settings/action-settings.component';
import { PrintSettingsDetailsComponent } from '../shared/components/print-settings-details/print-settings-details.component';
import { PrintSettingsEditorComponent } from '../shared/components/print-settings-editor/print-settings-editor.component';
import { DialogService } from '../shared/service/dialog';
import { MenuComponent } from '../shared/_layout/components/common';
import { Js2zplService } from '../shared/service/js2zpl.service';
import { TSCLabelService } from '../shared/service/js2tspl.service';
import { PrintService } from '../shared/service/print.service';
@Component({
  selector: 'app-print-settings',
  templateUrl: './print-settings.component.html',
  styleUrls: ['./print-settings.component.scss']
})
export class PrintSettingsComponent implements OnInit, AfterViewInit {

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

  aActionSettings: any = [];


  iBusinessId: string = '';
  iLocationId: string = '';
  isLoadingDefaultLabel: boolean = false;
  isLoadingTemplatesLabel: boolean = false;
  // defaultLabelsData: Array<TemplateJSON> = []
  // LabelTemplatesData: Array<TemplateJSON> = []
  bShowActionSettingsLoader: boolean = false;
  labelPrintSettings: any;
  iWorkstationId: any;
  aWorkstations: any = [];

  aTsplTemplates: any;
  aZplTemplates: any;
  oSettings: any;
  aDefaultZplTemplates: any;
  aDefaultTsplTemplates: any;
  oDefaultTsplTemplate: any = {
    tspl_iID: 1,
    tspl_iDpi: 8,
    tspl_iDefaultFontSize: 5,
    tspl_iMediaDarkness: 6,
    tspl_iHeightMm: 10,
    tspl_iWidthMm: 72,
    tspl_iPaddingLeft: 0,
    tspl_iPaddingTop: 0,
    tspl_iMarginLeft: 0,
    tspl_iMarginTop: 0,
    tspl_aInversion: [1, 0],
    tspl_iPrintSpeed: 2,
    tspl_iOffsetMm: -4,
    tspl_iGapMm: 2.7,
    tspl_bTear: true,
    tspl_bCut: false,
    aTemplate: [
      {
        type: 'rectangle',
        x1: 2,
        y1: 2,
        x2: 158,
        y2: 78,
        border_width: 1
      },
      {
        type: 'barcode',
        x: 8,
        y: 8,
        content: '000000123'
      },
      {
        type: 'text',
        x: 8,
        y: 24,
        text_align: 'left',
        content: '000000123'
      },
      {
        type: 'text',
        x: 8,
        y: 42,
        font_size: 7,
        text_align: 'left',
        content: '%%SELLING_PRICE%%',
        filter: 'money2'
      },
      {
        type: 'text',
        x: 180,
        y: 8,
        text_align: 'left',
        content: '%%PRODUCT_NUMBER%%'
      },
      {
        type: 'textblock',
        x: 180,
        y: 40,
        width: 176,
        height: 40,
        text_align: 'left',
        line_height: 15,
        font_size: 5,
        content: '%%DESCRIPTION%% en nog meer',
        max: 10,
        suffix: ',,'
      }
    ]
  };

  constructor(
    private dialogService: DialogService,
    private toastService: ToastService,
    private apiService: ApiService,
    private printService: PrintService,
    private cdr: ChangeDetectorRef
  ) { }
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
    this.isLoadingDefaultLabel = true
    this.isLoadingTemplatesLabel = true
    this.fetchWorkstations();
    this.getLabelTemplate();
    this.fetchBusinessDetails();
    this.fetchActionSettings();
    this.getLabelPrintSetting();

    setTimeout(() => {
      MenuComponent.reinitialization();
    }, 200);


  }

  createPrintSettings() {
    this.dialogService.openModal(PrintSettingsDetailsComponent, { cssClass: "modal-xl", context: { mode: 'create' }, hasBackdrop: true }).instance.close.subscribe(result => { });
  }

  // Function for fetch business details
  fetchBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId)
      .subscribe((result: any) => {
        this.businessDetails = result.data;
      });
  }

  fetchWorkstations() {
    this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}/${this.iLocationId}`)
      .subscribe(
        (result: any) => {
          if (result && result.data) {
            this.aWorkstations = result.data;
          }
        });
  }


  trackByFun(index: any, item: any) {
    return index;
  }
  openToolsModal() {
    const dialogRef = this.dialogService.openModal(PrinterToolComponent, {
      cssClass: "modal-lg w-100",
      context: { businessDetails: this.businessDetails },
      hasBackdrop: true
    })

    dialogRef.instance.close.subscribe(async (result) => {
      if (result) { }
    })
  }

  openLabelTemplateModal(jsonData: any, mode: 'create' | 'edit', eType: string = 'zpl') {
    // console.log(jsonData);
    if (mode === 'create') {
      jsonData.readOnly = false
      jsonData.iBusinessId = this.iBusinessId
      jsonData.iLocationId = this.iLocationId
      delete jsonData.dCreatedDate
      delete jsonData.dUpdatedDate
      delete jsonData._id
      delete jsonData.__v
    }
    let oData: any = {};
    const _id = (mode === 'edit') ? jsonData._id : '';
    if (eType === 'tspl') {
      Object.keys(jsonData).forEach(key => {
        if (key.startsWith('tspl') || key === 'aTemplate' || key === 'name') {
          oData[key] = jsonData[key];
        }
      })
    } else {
      Object.keys(jsonData).forEach(key => {
        if (!key.startsWith('tspl') && !['eType', 'iBusinessId', 'iLocationId', 'aTemplate'].includes(key)) {
          oData[key] = jsonData[key];
        }
      })
    }
    oData = JSON.parse(JSON.stringify(oData));
    this.dialogService.openModal(LabelTemplateModelComponent, {
      cssClass: "modal-xl w-100",
      context: {
        mode,
        jsonData: oData,
        eType,
        iTemplateId: _id
      },
      hasBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEsc: false
    }).instance.close.subscribe(async (result) => {
      // console.log(result)
      if (result) {
        if (mode === 'create') {
          this.createLabelTemplate(result, eType)
        } else {
          this.updateLabelTemplate(_id, result, eType)
        }
      }

    });
  }

  async getLabelTemplate() {
    this.apiService.getNew('cashregistry', `/api/v1/label/templates/${this.iBusinessId}?iLocationId=${this.iLocationId}`).subscribe((result: any) => {

      this.aDefaultZplTemplates = result.data.filter((label: any) => label.readOnly && label.eType === 'zpl')
      this.aZplTemplates = result.data.filter((label: any) => !label.readOnly && label.eType === 'zpl').map((template: any) => {
        template.elements.map((element: any, i: number) => {
          template.elements[i]['type'] = element.sType
        })
        return template;
      });

      this.aDefaultTsplTemplates = result.data.filter((label: any) => label.readOnly && label.eType === 'tspl');
      this.aTsplTemplates = result.data.filter((label: any) => !label.readOnly && label.eType === 'tspl');

      this.isLoadingTemplatesLabel = false
      this.isLoadingDefaultLabel = false

    }, (error) => {
      this.isLoadingTemplatesLabel = false
      this.isLoadingDefaultLabel = false
      console.log('error: ', error);
    })
  }

  shiftLabelButton(type: string, index: number, eType: string = 'zpl') {
    if (eType == 'zpl') {
      if (type == 'up') {
        if (this.aZplTemplates[index - 1])
          [this.aZplTemplates[index - 1], this.aZplTemplates[index]] = [this.aZplTemplates[index], this.aZplTemplates[index - 1]]
      } else {
        if (this.aZplTemplates[index + 1])
          [this.aZplTemplates[index + 1], this.aZplTemplates[index]] = [this.aZplTemplates[index], this.aZplTemplates[index + 1]]
      }

    } else {
      if (type == 'up') {
        if (this.aTsplTemplates[index - 1])
          [this.aTsplTemplates[index - 1], this.aTsplTemplates[index]] = [this.aTsplTemplates[index], this.aTsplTemplates[index - 1]]
      } else {
        if (this.aTsplTemplates[index + 1])
          [this.aTsplTemplates[index + 1], this.aTsplTemplates[index]] = [this.aTsplTemplates[index], this.aTsplTemplates[index + 1]]
      }

    }
  }

  markDefault(label: any, eType: string = 'zpl') {
    try {
      const oBody = {
        _id: label._id,
        iBusinessId: this.iBusinessId,
        iLocationId: this.iLocationId
      }
      this.apiService.postNew('cashregistry', '/api/v1/label/templates/changeDefaultLabel', oBody).subscribe((result: any) => {
        if (result?.message == 'success') {
          this.aZplTemplates.forEach((label: any) => {
            if (label.bDefault) label.bDefault = false;
          })
          label.bDefault = true;

          this.toastService.show({ type: 'success', text: 'Default label updated successfully' });
        }
      })
    } catch (error) {
      console.log(error);
    }

  }

  updateLabelSequence(event: any) {
    event.target.disabled = true;
    this.isLoadingDefaultLabel = true;
    try {
      this.apiService.putNew('cashregistry', '/api/v1/label/templates/updateSequence/' + this.iBusinessId, this.aZplTemplates).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: `Label button order saved successfully` });
        this.isLoadingDefaultLabel = false;
        event.target.disabled = false;
      }, (error) => {
        this.isLoadingDefaultLabel = false;
        event.target.disabled = false;
      })
    } catch (e) {
      this.isLoadingDefaultLabel = false;
      event.target.disabled = false;
    }
  }

  createLabelTemplate(jsonData: any, eType: string = 'zpl') {
    // console.log({jsonData});
    const oBody = {
      iBusinessId: jsonData?.iBusinessId || this.iBusinessId,
      iLocationId: jsonData?.iLocationId || this.iLocationId,
      template: jsonData,
      eType: eType
    }
    this.isLoadingTemplatesLabel = true;
    this.apiService.postNew('cashregistry', `/api/v1/label/templates`, oBody).subscribe((result: any) => {
      if (result?.data) {
        this.toastService.show({ type: 'success', text: 'Label created successfully' });
        this.getLabelTemplate();
      }
    }, (error) => {
      console.log('error: ', error);
      this.toastService.show({ type: 'warning', text: 'Something went wrong' });
    })
  }

  updateLabelTemplate(id: string, jsonData: any, eType: string) {
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      template: jsonData,
      eType
    }
    this.apiService.putNew('cashregistry', `/api/v1/label/templates/${id}`, oBody).subscribe((result: any) => {
      if (result?.data) {
        this.toastService.show({ type: 'success', text: 'Label updated successfully' });
        this.getLabelTemplate();
      }
    }, (error) => {
      console.log('error: ', error);
      this.toastService.show({ type: 'warning', text: 'Something went wrong' });
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
      },
      hasBackdrop: true
    }).instance.close.subscribe((result) => {
      if (result) {
        this.isLoadingTemplatesLabel = true

        this.apiService.deleteNew('cashregistry', `/api/v1/label/templates/${id.toString()}?iBusinessId=${this.iBusinessId}`).subscribe((result: any) => {
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

  openSettingsEditor(format: any) {
    this.dialogService.openModal(PrintSettingsEditorComponent, { cssClass: "modal-xl", context: { format: format }, hasBackdrop: true })
      .instance.close.subscribe(result => {

      });
  }

  async fetchActionSettings() {
    this.bShowActionSettingsLoader = true;
    const data = {
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      oFilterBy: {
        sMethod: 'actions',
      }
    }
    const result: any = await this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, data).toPromise();
    this.bShowActionSettingsLoader = false;
    if (result?.data[0]?.result?.length) {
      this.aActionSettings = result?.data[0]?.result;
      // console.log('aActionSettings',this.aActionSettings)
      this.aActionSettings.forEach((action: any) => {
        const workStationName = this.aWorkstations.find((workStation: any) => workStation._id == action.iWorkstationId)
        if (workStationName) {
          action.sWorkStationName = workStationName.sName;
        }
      })
    }
  }

  openActionSetting(mode: string = 'create', actionSettingsIndex: number = 0, index: number = 0) {
    let obj: any = {
      mode: mode
    }
    if (mode === 'update') {
      const item = this.aActionSettings[actionSettingsIndex].aActions[index];
      if (item?.eType) obj.eType = item?.eType;
      if (item?.eSituation) obj.eSituation = item?.eSituation;
      if (item?.aActionToPerform) obj.aActions = item?.aActionToPerform;
      obj._id = this.aActionSettings[actionSettingsIndex]._id
      obj.iActionId = item._id
    }

    this.dialogService.openModal(ActionSettingsComponent, { cssClass: "modal-lg", context: { ...obj }, hasBackdrop: true })
      .instance.close.subscribe(result => {
        if (result) {
          this.aActionSettings = [];
          this.fetchActionSettings();
        }
      });
  }

  async removeActionSetting(actionSettingsIndex: number, index: number) {
    const iPrintSettingsId = this.aActionSettings[actionSettingsIndex]._id;
    const iActionId = this.aActionSettings[actionSettingsIndex].aActions[index]._id;
    await this.apiService.deleteNew('cashregistry', `/api/v1/print-settings/${this.iBusinessId}/${iPrintSettingsId}/${iActionId}`).toPromise();
    this.fetchActionSettings();
    // this.aActionSettings.splice(index, 1);
  }

  getLabelPrintSetting() {
    const oBody = {
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      oFilterBy: {
        sMethod: ['labelDefinition', 'settings']
      }
    }
    this.apiService.postNew('cashregistry', `/api/v1/print-settings/list/${this.iBusinessId}`, oBody).subscribe(
      (result: any) => {
        if (result?.data?.length && result?.data[0]?.result?.length) {
          this.labelPrintSettings = result.data[0].result.filter((el: any) => el.sMethod === 'labelDefinition');
          const aSettings = result.data[0].result.filter((el: any) => el.sMethod === 'settings');
          //const oLabelMethodSettings = result.data[0].result.find((el: any) => el.sMethod === 'settings');
          //console.log('Here', this.labelPrintSettings);
          //console.log(aSettings.oSettings);
          if (aSettings.oSettings) {
            this.oSettings = aSettings.oSettings;
          } else {
            this.oSettings = {
              bUseZpl: true,
              bUseTspl: false
            }
          }
          this.cdr.detectChanges();
        } else {
          this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
        }
      },
      (error: any) => {
        console.error(error)
      }
    );
  }

  updateSettings() {
    // this.createLabelTemplate(this.oDefaultTsplTemplate, 'tspl')
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      oSettings: this.oSettings,
      iWorkstationId: this.iWorkstationId,
      sMethod: 'settings'
    }
    this.apiService.putNew('cashregistry', `/api/v1/print-settings/update`, oBody).subscribe((result: any) => {
      if (result?.data) {
        this.toastService.show({ type: 'success', text: 'Settings updated successfully!' });
      }
    });

  }

  async sentToLayout(template: any, eType: string = 'zpl') {
    const oTemplate = JSON.parse(JSON.stringify(template));
    const oPrintSettings = this.labelPrintSettings.find((s: any) => s.sType === eType && s.iWorkstationId === this.iWorkstationId)
    if (!oPrintSettings) {
      this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
      return;
    }
    let layoutCommand: any;
    if (eType === 'zpl') {
      const js2zplService = new Js2zplService(oTemplate);
      layoutCommand = js2zplService.generateCommand(oTemplate, {}, false)
    } else {
      const js2tsplService = new TSCLabelService(oTemplate);
      layoutCommand = js2tsplService.buildLayoutJob();
    }
    this.handlePrintNode(oPrintSettings, layoutCommand);
  }

  async printSample(template: any, eType: string = 'zpl') {
    const oTemplate = JSON.parse(JSON.stringify(template));
    const oPrintSettings = this.labelPrintSettings.find((s: any) => s.sType === eType && s.iWorkstationId === this.iWorkstationId)
    if (!oPrintSettings) {
      this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
      return;
    }
    let layoutCommand: any;
    if (eType === 'zpl') {
      const js2zplService = new Js2zplService(oTemplate);
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
        '%%LAST_DELIVERY_DATE%%': '08-05-2020',
        '%%SUPPLIER_NAME%%': 'Kasius NL',
        '%%SUPPLIER_CODE%%': 'KAS',
        '%%SUGGESTED_RETAIL_PRICE%%': '5678',
        '%%PRODUCT_CATEGORY%%': 'RINGEN',
        '%%PRODUCT_SIZE%%': '20',
        '%%JEWEL_TYPE%%': 'RING',
        '%%JEWEL_MATERIAL%%': 'Goud',
        '%%STRAP_WIDTH%%': '30mm',
        '%%STRAP_MATERIAL%%': 'Staal',
        '%%QUANTITY%%': '1'
      }
      layoutCommand = js2zplService.generateCommand(oTemplate, sampleObject, true)
    } else {
      const js2tsplService = new TSCLabelService(oTemplate);
      const sampleObject = {
        '%%PRODUCT_NAME%%': 'Ring Diamant',
        '%%SELLING_PRICE%%': '12.345,67',
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
        '%%STRAP_MATERIAL%%': 'Staal'
      }
      layoutCommand = js2tsplService.buildPrintJob(1, sampleObject, 1);
    }
    this.handlePrintNode(oPrintSettings, layoutCommand);
  }

  async handlePrintNode(oPrintSettings: any, layoutCommand: any) {
    const response: any = await this.printService.printRawContent(
      this.iBusinessId,
      layoutCommand,
      oPrintSettings?.nPrinterId,
      oPrintSettings?.nComputerId,
      1,
      'Set layout',
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

  addDefaultZplTemplate() {
    const oDefaultJson: any = {
      "readOnly": true,
      "inverted": false,
      "encoding": 28,
      "media_darkness": 4,
      "media_type": "T",
      "disable_upload": false,
      "can_rotate": true,
      "alternative_price_notation": false,
      "dpmm": 8,
      "elements": [
        {
          "sType": "",
          "x": 1,
          "y": 1,
          "width": 176,
          "height": 79
        },
      ],
      "height": 10,
      "labelleft": 0,
      "labeltop": 0,
      "layout_name": "LAYOUT_"+(this.aZplTemplates?.length || 0),
      "name": this.businessDetails?.sName+' Template' || "",
      "width": 72,
      "offsetleft": 0,
      "offsettop": 0,
      "bDefault": false,
      "nSeqOrder": 1,
    }
    this.dialogService.openModal(LabelTemplateModelComponent, { cssClass: "modal-xl w-100", context: { mode: 'create', jsonData: oDefaultJson, eType: 'zpl' }, hasBackdrop: true }).instance.close
      .subscribe(async (result) => {
        if (result) {
          this.createLabelTemplate(result)
        }
      });
  }
}

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
  bDefault: boolean,
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
  pound_prefix?: boolean;
}
