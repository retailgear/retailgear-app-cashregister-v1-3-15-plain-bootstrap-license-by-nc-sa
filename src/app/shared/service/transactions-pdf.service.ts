import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import * as moment from 'moment';
import { PdfService } from '../service/pdf2.service';
import { TillService } from '../service/till.service';
import { ApiService } from './api.service';
import { ToastService } from '../components/toast';
import { TranslateService } from '@ngx-translate/core';
import { assign } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class TransactionsPdfService {

  styles: any =
    {
      dateStyle: {
        alignment: 'right',
        fontSize: 9,
        margin: [0, 0, 0, 0]
      },
      tableExample: {
        border: 0,
        fontSize: 8,
      },
      tableExample2: {
        fontSize: 8,
      },
      supplierName: {
        alignment: 'right',
        fontSize: 12,
        margin: [0, -10, 0, 10]
      },
      normal: {
        fontSize: 9,
        margin: 5, //[0, 5, 0, 5]
      },
      header: {
        fontSize: 15,
        alignment: 'center',
        bold: false,
        margin: [0, 10, 20, 20]
      },
      businessName: {
        fontSize: 12,
      },
      afterLine: {
        margin: [0, 0, 0, 10]
      },
      afterLastLine: {
        margin: [0, 20, 0, 20]
      },
    };
  translations: any = [];

  constructor(private pdf: PdfService,
    private apiService: ApiService,
    public tillService: TillService,
    private toastService: ToastService,
    private transalteService: TranslateService) {
    const translate = ['ACTIVITY_NO', 'CUSTOMER', 'STATUS', 'REM_AMOUNT','GIFTCARD_NUMBER','CITY', 'COMMENT','REPAIR_NUMBER', 'TOTAL_PRICE', 'CREATION_DATE', 'ESTIMATED_DATE', 'DELIVERED_DATE', 'EMPLOYEE',
      'CREATE_MIN_DATE', 'CREATE_MAX_DATE', 'ESTIMATE_MIN_DATE', 'ESTIMATE_MAX_DATE', 'REPAIR_STATUS', 'EMPLOYEES', 'LOCATION', 'WORKSTATION', 'ASSIGNEE',
      'BUSINESS_PARTNER', 'E_KIND', 'IMPORT_STATUS'];
    this.transalteService.get(translate).subscribe((res: any) => {
      this.translations = res;
    })
  }
  getTableWidth(header: number) {
    let value = 100 / header + '%';
    let aTableWidth = [];
    for (let i = 1; i <= header; i++) aTableWidth.push("" + value);
    return aTableWidth;
  };

  async exportToPdf({ requestParams, customerHeader, page, businessDetail, aWorkstation, aLocation, aAssignee, aBusinessPartner }: any) {
    let aTableBody: Array<any> = [];
    // this.downloading = true;
    let aActivityItem: any[] = [];

    let tableWidth: any = [];
    let tableHeader: any = [];
    let headerObj: any = {};
    let totalRemainingAmount: any = 0;
    let totalAmount :any = 0;


    customerHeader.forEach((header: any) => {
      tableWidth.push(header.width);
      tableHeader.push({ text: this.translations[header.key], bold: true });
      headerObj = { ...headerObj, [header.value]: header.key }
    })
    tableWidth = this.getTableWidth(tableWidth.length);
    const result: any = await this.fetchActivityItem(requestParams);
    if (result && result?.data && result?.data?.length) {
      aActivityItem = result.data;
      aActivityItem.forEach((activityItem: any, index: Number) => {
        let obj: any = {};
        let aEmployeeName: any;
        const nTotalPrice = activityItem?.nTotalAmount || 0;
        const nTotalRemainingPrice = activityItem?.nGiftcardRemainingAmount || 0;
        if (activityItem?.sEmployeeName) aEmployeeName = activityItem?.sEmployeeName.split(' ');
        if (headerObj['sNumber']) obj['sNumber'] = activityItem && activityItem.sNumber ? activityItem.sNumber : '-';
        if (headerObj['oCustomer.sLastName']) obj['oCustomer.sLastName'] = activityItem && activityItem.oCustomer?.sLastName ? activityItem.oCustomer?.sLastName : '-';
        if (headerObj['oCustomer.oInvoiceAddress.sCity']) obj['oCustomer.oInvoiceAddress.sCity'] = activityItem && activityItem?.oCustomer?.sCity ? activityItem?.oCustomer?.sCity : '-';
        if (headerObj['sBagNumber']) obj['sBagNumber'] = activityItem && activityItem?.sBagNumber ? activityItem?.sBagNumber : '-';
        if (headerObj['sDescription']){
          if(activityItem?.sDescription?.length <= 15) obj['sDescription'] = activityItem && activityItem?.sDescription ? activityItem?.sDescription.substring(0,14) : '-';
          else obj['sDescription'] = activityItem && activityItem?.sDescription ? activityItem?.sDescription.substring(0,11).concat(" ...") : '-';
        } 
        if (headerObj['nTotalAmount']) obj['nTotalAmount'] = activityItem && this.tillService.currency + activityItem?.nTotalAmount ? this.tillService.currency + activityItem?.nTotalAmount : '-';
        if (headerObj['dCreatedDate']) obj['dCreatedDate'] = activityItem && activityItem.dCreatedDate ? moment(activityItem.dCreatedDate).format('DD-MM-yyyy') : '-';
        if (headerObj['dEstimatedDate']) obj['dEstimatedDate'] = activityItem && activityItem?.dEstimatedDate ? moment(activityItem?.dEstimatedDate).format('DD-MM-yyyy') : '-';
        if (headerObj['dActualFinishDate']) obj['dActualFinishDate'] = activityItem && activityItem.dActualFinishDate ? moment(activityItem.dActualFinishDate).format('DD-MM-yyyy') : '-';
        if (headerObj['sEmployeeName']) obj['sEmployeeName'] = (aEmployeeName && aEmployeeName[0].charAt(0) ? aEmployeeName[0].charAt(0) : '-') + (aEmployeeName && aEmployeeName[1].charAt(0) ? aEmployeeName[1].charAt(0) : '-');
        if (headerObj['nGiftcardRemainingAmount']) obj['nGiftcardRemainingAmount'] = activityItem && this.tillService.currency + activityItem?.nGiftcardRemainingAmount ? this.tillService.currency + activityItem?.nGiftcardRemainingAmount : '0';
        if (headerObj['eActivityItemStatus']) obj['eActivityItemStatus'] = activityItem && activityItem?.eActivityItemStatus ? activityItem?.eActivityItemStatus : '-';
        if (headerObj['sGiftCardNumber']) obj['sGiftCardNumber'] = activityItem && activityItem?.sGiftCardNumber ? activityItem?.sGiftCardNumber : '-';
        if (headerObj['nTotalAmount']) totalAmount = parseFloat(totalAmount) + parseFloat(nTotalPrice);
        if (headerObj['nGiftcardRemainingAmount']) totalRemainingAmount = parseFloat(totalRemainingAmount) + parseFloat(nTotalRemainingPrice);
        aTableBody.push(obj);
      })

      let date: any = Date.now();
      date = moment(date).format('DD-MM-yyyy');

      let bodyData: Array<any> = [];
      aTableBody.forEach((singleRecord: any) => {
        bodyData.push(Object.values(singleRecord));
      })

      let repairStatus = '-';
      let employee = '-';
      let sWorkStation = '-';
      let sLocation = '';
      let sAssignee = '-';
      let sBusinessPartner = '-';
      let ekind = '-';
      let importStatus = '-';

      const fromCreationDate = requestParams?.create?.minDate ? moment(requestParams.create.minDate).format('DD-MM-yyyy') : '-';
      const toCreationDate = requestParams?.create?.maxDate ? moment(requestParams.create.maxDate).format('DD-MM-yyyy') : '-';
      const fromEndDate = requestParams?.estimate?.minDate ? moment(requestParams.estimate.minDate).format('DD-MM-yyyy') : '-';
      const toEndDate = requestParams?.estimate?.maxDate ? moment(requestParams.estimate.maxDate).format('DD-MM-yyyy') : '-';

      if (requestParams?.selectedRepairStatuses?.length) repairStatus = requestParams.selectedRepairStatuses.join(" ,");
      if (requestParams?.employee) employee = requestParams?.employee?.sFirstName + " " + requestParams?.employee?.sLastName;
      if (requestParams?.selectedWorkstations?.length) {
        // aWorkStation = [];
        sWorkStation = aWorkstation
          .filter((workstation: any) => requestParams?.selectedWorkstations.includes(workstation._id))
          .map((workstation: any) => workstation.sName)
          .join(', ');
      }
      if (requestParams?.selectedLocations?.length) {
        // aWorkStation = [];
        sLocation = aLocation
          .filter((location: any) => requestParams?.selectedLocations.includes(location._id))
          .map((location: any) => location.sName)
          .join(', ');
      }
      if (requestParams?.iAssigneeId) {
        sAssignee = aAssignee.filter((assign: any) => requestParams?.iAssigneeId == assign._id)
          .map((assign: any) => assign.sFirstName + " " + assign.sLastName)
      }
      if (requestParams?.aSelectedBusinessPartner?.length) {
        sBusinessPartner = aBusinessPartner
          .filter((businessPartner: any) => requestParams?.aSelectedBusinessPartner.includes(businessPartner.iBusinessPartnerId))
          .map((businessPartner: any) => businessPartner.sBusinessPartnerName)
          .join(', ');
      }
      if (requestParams?.selectedKind?.length) ekind = requestParams?.selectedKind.join(" ,");
      if (requestParams?.importStatus) importStatus = requestParams?.importStatus == 'true' ? 'Imported' : 'Created'

      let content = [
        { text: date, style: 'dateStyle' },
        { text: 'Activity Item Overview', style: 'header' },
        { text: businessDetail?.sName, style: 'businessName' },
        {
          columns: [
            { text: this.translations['CREATE_MIN_DATE'] + ': ', style: ['left', 'normal'], width: 100 },
            { text: fromCreationDate, style: ['left', 'normal'], width: 150 },
            { width: '*', text: '' },
            { text: this.translations['CREATE_MAX_DATE'] + ': ', style: ['right', 'normal'], width: 100 },
            { text: toCreationDate, style: ['right', 'normal'], width: 150 },
          ],
        },
        {
          columns: [
            { text: this.translations['ESTIMATE_MIN_DATE'] + ': ', style: ['left', 'normal'], width: 100 },
            { text: fromEndDate, style: ['left', 'normal'], width: 150 },
            { width: '*', text: '' },
            { text: this.translations['ESTIMATE_MAX_DATE'] + ': ', style: ['right', 'normal'], width: 100 },
            { text: toEndDate, style: ['right', 'normal'], width: 150 },
          ],
        },
        {
          columns: [
            { text: this.translations['REPAIR_STATUS'] + ': ', style: ['left', 'normal'], width: 100 },
            { text: repairStatus, style: ['left', 'normal'], width: 150 },
            { width: '*', text: '' },
            { text: this.translations['EMPLOYEES'] + ': ', style: ['right', 'normal'], width: 100 },
            { text: employee, style: ['right', 'normal'], width: 150 },
          ],
        },
        {
          columns: [
            { text: this.translations['WORKSTATION'] + ': ', style: ['left', 'normal'], width: 100 },
            { text: sWorkStation, style: ['left', 'normal'], width: 150 },
            { width: '*', text: '' },
            { text: this.translations['LOCATION'] + ': ', style: ['right', 'normal'], width: 100 },
            { text: sLocation, style: ['right', 'normal'], width: 150 },
          ],
        },
        {
          columns: [
            { text: this.translations['ASSIGNEE'] + ': ', style: ['left', 'normal'], width: 100 },
            { text: sAssignee, style: ['left', 'normal'], width: 150 },
            { width: '*', text: '' },
            { text: this.translations['BUSINESS_PARTNER'] + ': ', style: ['right', 'normal'], width: 100 },
            { text: sBusinessPartner, style: ['right', 'normal'], width: 150 },
          ],
        },
        {
          columns: [
            { text: this.translations['E_KIND'] + ': ', style: ['left', 'normal'], width: 100 },
            { text: ekind, style: ['left', 'normal'], width: 150 },
            { width: '*', text: '' },
            { text: this.translations['IMPORT_STATUS'] + ': ', style: ['right', 'normal'], width: 100 },
            { text: importStatus, style: ['right', 'normal'], width: 150 },
          ],
        },
        // { text: supplierDetailsName, style: 'supplierName' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }], margin: [0, 0, 20, 0], style: 'afterLine' },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: tableWidth,
            // widths: [70, 75, 85, 50, 30, 40, 40, 50, 50],
            // widths: [ 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto','auto' ],
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
            // widths: [ 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto','auto' ],
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
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }], margin: [0, 0, 20, 0], style: 'afterLastLine' },
        {
          style: 'tableExample2',
          table: {
            headerRows: 1,
            widths: ['20%', '20%', '20%', '20%','20%'],
            body: [
              ['','','', 'Total', 'Remaining'],
              ['','','', this.tillService.currency + totalAmount, this.tillService.currency +totalRemainingAmount.toFixed(2)]
            ]
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

      this.pdf.getPdfData({ styles: this.styles, content: content, orientation: 'portrait', pageSize: 'A4', pdfTitle: "ActivityItem" + '-' + date })
      // this.downloading = false;
    } else {
      this.toastService.show({ type: 'warning', text: 'Activity Item data not found' });
    }
  }

  fetchActivityItem(requestParams: any) {
    return this.apiService.postNew('cashregistry', '/api/v1/activities/items', requestParams).toPromise()
  }
}
