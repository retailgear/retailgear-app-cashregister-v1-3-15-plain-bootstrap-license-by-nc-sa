import { Component, OnInit, Input, ViewContainerRef } from '@angular/core';
import { ApiService } from '../../../shared/service/api.service';
import { JsonToCsvService } from '../../../shared/service/json-to-csv.service';
import { ExportsService } from '../../../shared/service/exports.service';
import * as _moment from 'moment';
import _, { head } from 'lodash';
import { DialogService } from '../../service/dialog';
import { DialogComponent } from '../../service/dialog';
import { CustomerStructureService } from '../../service/customer-structure.service';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
const moment = (_moment as any).default ? (_moment as any).default : _moment;
import { PdfService } from '../../../shared/service/pdf2.service';
@Component({
  selector: 'app-exports',
  templateUrl: './exports.component.html',
  styleUrls: ['./exports.component.scss']
})
export class ExportsComponent implements OnInit {
  @Input() requestParams: any = {};
  @Input() headerList: Array<any> = [];
  @Input() valuesList: Array<any> = [];
  @Input() separator: String = '';
  @Input() socialMedia: Boolean = false;
  @Input() customerHeaderList: Array<any> = [];
  customerList: Array<any> = [];
  secondHeaderList: Array<any> = [];
  secondValuesList: Array<any> = [];
  secondAProjection: Array<any> = [];
  aProperty: Array<any> = [];
  expand: Boolean = false;
  loader: Boolean = false;
  useSameFilter: Boolean = true;
  articleGroupNames: Array<any> = [];
  secondAG: String = '';
  firstAG: String = '';
  secondAGId: String = '';
  firstAGId: String = '';
  iBusinessId: any;
  bAllSelected = true;
  isPdfLoading: boolean = false;
  isCsvLoading: boolean = false;

  fieldsToAdd: Array<any> = [];
  dataForCSV: Array<any> = [];
  fieldObject: any = {};
  faTimes = faTimes;
  customerTypes: any = [
    { key: 'ALL', value: 'all' },
    { key: 'PRIVATE', value: 'private' },
    { key: 'COMPANY', value: 'company' }
  ]

  dialogRef: DialogComponent;
  customerGroupList: any = [];

  bNormalOrder: boolean = true;
  sBusinessCountry: string = '';
  businessDetails: any;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private jsonToCsvService: JsonToCsvService,
    private exportsService: ExportsService,
    private dialogService: DialogService,
    private pdf: PdfService,
    private customerStructureService: CustomerStructureService
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness');
    // this.fetchSecondHeaderList();
    this.getCustomerGroups();
    this.getBusinessDetails();
  }
  
  getBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId).subscribe((response: any) => {
      const currentLocation = localStorage.getItem('currentLocation');
      if (response?.data) this.businessDetails = response.data;
      if (this.businessDetails?.aLocation?.length) {
        const locationIndex = this.businessDetails.aLocation.findIndex((location: any) => location._id == currentLocation);

        if (locationIndex != -1) {
          const currentLocationDetail = this.businessDetails?.aLocation[locationIndex];

          /*Needed to change fields order*/
          this.sBusinessCountry = currentLocationDetail?.oAddress?.countryCode;
          //console.log(this.sBusinessCountry);
          if(this.sBusinessCountry == 'UK' || this.sBusinessCountry == 'GB'|| this.sBusinessCountry == 'FR'){
            this.bNormalOrder = false;
          }
        }
      }
    });
  }

  getCustomerGroups(){
    this.apiService.postNew('customer', '/api/v1/group/list', { iBusinessId: this.requestParams.iBusinessId, iLocationId: localStorage.getItem('currentLocation') }).subscribe((res: any) => {
      if (res?.data?.length) {
        this.customerGroupList = res?.data[0]?.result;
      }
    }, (error) => {})
  }

  fetchSecondHeaderList() {
    var data = {
      iBusinessId: this.iBusinessId
    };
    this.apiService.postNew('core', '/api/v1/property/settings/list', data).subscribe(
      (result: any) => {
        this.loader = false;
        for (let index in result.data) {
          if (this.secondHeaderList.indexOf(result.data[index].property.sName) < 0) this.secondHeaderList.push(result.data[index].property.sName);
        }
      })
  }

  addToSecondHeaderList(data: String) {
    if (this.secondAProjection.indexOf(data) < 0 && data) this.secondAProjection.push(data);
  }

  selectAll(event: any) {
    this.bAllSelected = event.checked;
    this.customerHeaderList.forEach(element => {
      element.isSelected = event.checked;
    });
  }

  close(flag: Boolean) {
    var data = this.fieldsToAdd;
    this.fieldsToAdd = [];
    if (flag) this.dialogRef.close.emit({ action: true, data });
    else this.dialogRef.close.emit({ action: false })
  }

  getTableWidth(header: number) {
    let value = 100 / header + '%';
    let aTableWidth = [];
    for (let i = 1; i <= header; i++) aTableWidth.push("" + value);
    return aTableWidth;
  };
 
  getExportPDF() {
    var body = this.requestParams;
    let aTableBody: Array<any> = [];
    this.isPdfLoading = true;
    var arr:any = [];
    let tableWidth: any = [];
    let tableHeader: any = [];
    let headerObj: any = {};

    if (this.bAllSelected && !this.fieldsToAdd.length) this.fieldsToAdd = this.customerHeaderList;
    this.fieldsToAdd.forEach((header: any) => {
      tableWidth.push(header.width);
      tableHeader.push({ text: header.value, bold: true });
      headerObj = { ...headerObj, [header.key]: header.value }
    })
    tableWidth = this.getTableWidth(tableWidth.length);
    
    this.apiService.postNew('customer', '/api/v1/customer/exports', body).subscribe(
      (result: any) => {
        this.customerList = result.data[0].result;
        this.customerList?.forEach((customer: any, index: Number) => {
          let ShippingAddress =  this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
          let InvoiceAddress =  this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
          let Mobile = customer?.oPhone?.sMobile;
          if(customer?.oPhone?.sPrefixMobile) Mobile = customer?.oPhone?.sPrefixMobile + customer?.oPhone?.sMobile;
          let Landline = customer?.oPhone?.sLandLine;
          if(customer?.oPhone?.sPrefixLandline) Landline =  customer?.oPhone?.sPrefixLandline + customer?.oPhone?.sLandLine;
          var obj: any = {};
          if (headerObj['sSalutation'])obj['Salutation'] = customer?.sSalutation ? customer?.sSalutation : '';
          if (headerObj['sFirstName'])obj['First name'] = customer?.sFirstName ? customer?.sFirstName : '';
          if (headerObj['sPrefix'])obj['Prefix'] = customer?.sPrefix ? customer?.sPrefix : '';
          if (headerObj['sLastName'])obj['Last name'] = customer?.sLastName ? customer?.sLastName : '';
          if (headerObj['dDateOfBirth'])obj['Date of birth'] = customer?.dDateOfBirth ? moment(customer?.dDateOfBirth).format('DD-MM-yyyy') : '';
          if (headerObj['sGender'])obj['Gender'] = customer?.sGender ? customer?.sGender : '';
          if (headerObj['sEmail'])obj['Email'] = customer?.sEmail ? customer?.sEmail : '';
          if (headerObj['oPhone.sLandLine'])obj['Landline'] = Landline ? Landline : '';
          if (headerObj['oPhone.sMobile'])obj['Mobile'] = Mobile ? Mobile : '';
          if (headerObj['oShippingAddress'])obj['ShippingAddress'] = ShippingAddress ? ShippingAddress : '';
          if (headerObj['oInvoiceAddress'])obj['InvoiceAddress'] = InvoiceAddress ? InvoiceAddress : '';
          if (headerObj['sCompanyName'])obj['Company name'] = customer?.sCompanyName ? customer?.sCompanyName : '';
          if (headerObj['sVatNumber'])obj['Vat number'] = customer?.sVatNumber ? customer?.sVatNumber : '';
          if (headerObj['sCocNumber'])obj['Coc number'] = customer?.sCocNumber ? customer?.sCocNumber : '';
          if (headerObj['nPaymentTermDays'])obj['Payment term days'] = customer?.nPaymentTermDays ? customer?.nPaymentTermDays : 0;
          if (headerObj['nMatchingCode'])obj['Matching code'] = customer?.nMatchingCode ? customer?.nMatchingCode : 0;
          if (headerObj['nClientId'])obj['Client id'] = customer?.nClientId ? customer?.nClientId : '';
          if (headerObj['sNote'])obj['Note'] = customer?.sNote ? customer?.sNote : '';
          if (headerObj['oPoints'])obj['Points'] =  0;
          if (headerObj['bNewsletter'])obj['Newsletter'] = customer?.bNewsletter ? customer?.bNewsletter : '';
          aTableBody.push(obj);
        })
       
        let date: any = Date.now();
      date = moment(date).format('DD-MM-yyyy');

      let bodyData: Array<any> = [];
      aTableBody.forEach((singleRecord: any) => {
        bodyData.push(Object.values(singleRecord));
      })
        
        var content = [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }], margin: [0, 0, 20, 0], style: 'afterLine' },
          {
            style: 'tableExample',
            table: {
              headerRows: 1,
              widths: tableWidth,
             body: [tableHeader]
            },
            layout: {
              hLineStyle: function () {
                return { dash: { length: 0.001, space: 40 * 20 } };
              },
              vLineStyle: function () {
                return { dash: { length: 0.001, space: 40 * 20 } };
              },
            }
          },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }], margin: [0, 0, 20, 0], style: 'afterLine' },
          {
            style: 'tableExample',
            table: {
              headerRows: 0,
              widths: tableWidth,
              body: bodyData
            },
            layout: {
              hLineStyle: function () {
                return { dash: { length: 0.001, space: 40 * 20 } };
              },
              vLineStyle: function () {
                return { dash: { length: 0.001, space: 40 * 20 } };
              },
            }
          }
          
        ]

        var styles =
        {
          dateStyle: {
            alignment: 'right',
            fontSize: 9,
            margin: [0, 0, 0, 0]
          },
          tableExample: {
            border: 0,
            fontSize: 9,
          },
          tableExample2: {
            fontSize: 8,
          },
          supplierName: {
            alignment: 'right',
            fontSize: 12,
            margin: [0, -10, 0, 10]
          },
          header: {
            fontSize: 15,
            bold: false,
            margin: [0, 10, 20, 20]
          },
          businessName: {
            fontSize: 12
          },
          afterLine: {
            margin: [0, 0, 0, 10]
          },
          afterLastLine: {
            margin: [0, 20, 0, 20]
          },
        };

        this.pdf.getPdfData({styles, content, orientation: 'portrait', pageSize: 'A4', pdfTitle: "Customer" + '-' + date })
        this.isPdfLoading = false;
      },
      (error: any) => {
        this.dataForCSV = [];
        this.isPdfLoading = false;
      }
    );
  }

  getExportData() {
    this.isCsvLoading = true;
    //this.separator = separator;
    for (let index in this.secondAProjection) {
      if (this.requestParams.aProjection.indexOf(this.secondAProjection[index]) < 0) this.requestParams.aProjection.push(this.secondAProjection[index]);
    }
    if (this.bAllSelected && !this.fieldsToAdd.length) this.fieldsToAdd = this.customerHeaderList;
    this.fieldsToAdd.forEach((header: any) => {
      this.headerList.push(header.value);
      this.valuesList.push(header.key);
    })
    this.requestParams.aProjection = this.valuesList;
    this.requestParams.aProjection.push('oPhone.sPrefixMobile', 'oPhone.sPrefixLandline');
    if (!this.useSameFilter) { this.requestParams.oFilterBy.oDynamic = {}; this.requestParams.oFilterBy.oStatic = {}; }
    var body = this.requestParams;
    this.apiService.postNew('customer', '/api/v1/customer/exports', body).subscribe(
      (result: any) => {
        if (result?.data?.length) {
          this.dataForCSV = result?.data;
        }
        for (const customer of this.dataForCSV) {
          if (customer.dDateOfBirth) customer.dDateOfBirth = moment(customer.dDateOfBirth).format('DD-MM-yyyy');
          if (typeof (customer['oPoints']) == 'number') {
            customer['oPoints'] = (customer.oPoints ? customer.oPoints : '-')
          } else {
            customer['oPoints'] = '-'
          }
          customer['sEmail'] = customer.sEmail;
          if (customer?.oPhone?.sPrefixLandline) {
            customer['oPhone.sLandLine'] = customer?.oPhone?.sPrefixLandline + customer?.oPhone?.sLandLine;
          } else {
            customer['oPhone.sLandLine'] = (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '')
          }
          if (customer?.oPhone?.sPrefixMobile) {
            customer['oPhone.sMobile'] = customer?.oPhone?.sPrefixMobile + customer?.oPhone?.sMobile;
          } else {
            customer['oPhone.sMobile'] = (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '')
          }

          let ShippingAddress =  this.customerStructureService.makeCustomerAddress(customer.oShippingAddress, false, this.bNormalOrder);
          let InvoiceAddress =  this.customerStructureService.makeCustomerAddress(customer.oInvoiceAddress, false, this.bNormalOrder);
          
          customer['oShippingAddress'] = ShippingAddress || "-";
          customer['oInvoiceAddress'] = InvoiceAddress || "-";
          
        }
        for (let index in this.headerList) {
          this.fieldObject[this.headerList[index]] = this.valuesList[index]
        }
        this.download();
      },
      (error: any) => {
        this.dataForCSV = [];
        this.isCsvLoading = false;
      }
    );
  }
  download() {
    var data = { from: 'Customers-export' };
    this.jsonToCsvService.convertToCSV(this.dataForCSV, this.headerList, this.valuesList, 'Customers', this.separator, data)
    this.isCsvLoading = false;
    this.dialogRef.close.emit({ action: false });
  }
  removeFields(obj: any, event: any) {
    if (event?.target?.checked) {
      this.fieldsToAdd.push(obj);
    } else {
      var index = this.fieldsToAdd.findIndex((field) => field.value == obj.value);
      if (index > -1) this.fieldsToAdd.splice(index, 1);
    }
  }
}
