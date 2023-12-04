import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ToastService } from '../components/toast/toast.service';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import { PrintService } from './print.service';
import pdfActions from "pdf-actions";
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  iBusinessId: string;
  iWorkstationId: any;

  constructor(private printService: PrintService, private toastrService: ToastService) {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation') || ''
  }

  /** Method to set PDF Title */
  setTitle(logo: any, title: string, page: any, pageSize: string): any {
    // let companyDetail = '';
    let margin;
    let fontSize;

    if (pageSize === 'A6') {
      margin = [15, 10, 0, 10];
      fontSize = 8;
    } else {
      margin = [15, 10, 0, 10];
      fontSize = 10;
    }

    return [
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            [{
              image: logo,
              width: 60,
              height: 30,
              border: 1
            }],
            [{ text: title, fontSize, margin: [100, -20, 0, 0] }],
          ],
        },
        layout: 'noBorders',
      },

    ];
  }

  /**  Method for creating PDF table header */
  createTableHeader(header: string[]): any {
    const pageHeader = { fila_0: {} };
    header.forEach((attribute, i) => {
      // pageHeader.fila_0['col_' + (+i + 1)] = { text: attribute, style: 'tableHeader', margin: [0, 8, 0, 0] };
    });
    return pageHeader;
  }

  createBody(headers: any, records: object[]): any {
    const body = [];
    for (const key in headers) {
      const row = [];
      for (let headerKey in headers[key]) {
        row.push(headers[key][headerKey]);
      }
      body.push(row);
    }

    records.forEach((record: any) => {
      const row = [];
      for (const key in record) {
        row.push(record[key]);
      }
      body.push(row);
    });
    return body;
  }

  getDocDefinition(styles: any, content: any, orientation: string, pageSize?: any, footer?: any, pageMargins?: any, defaultStyle?: any, addPageBreakBefore?:any) {
    // console.log(pageSize)
    // let pageMargin;
    // let headerFont;
    // let contentFont;
    // if (pageSize === 'A6') {
    //   pageMargin = [10, 110, 10, 10];
    //   headerFont = 10;
    //   contentFont = 7;
    // } else {
    //   headerFont = 16;
    //   contentFont = 10;
    //   pageMargin = [10, 10, 10, 10];
    // }
    const docDefinition: any = {
      pageSize,
      pageMargins: pageMargins,
      content: content,
      styles: styles,
      defaultStyle,
      footer,
    };
    if(addPageBreakBefore) docDefinition.pageBreakBefore = (currentNode:any, followingNodesOnPage:any, nodesOnNextPage:any, previousNodesOnPage:any) => {
            // console.log({currentNode, followingNodesOnPage})
            return currentNode.headlineLevel === 1;
        }
    if (typeof pageSize === 'string') docDefinition.pageOrientation = orientation; 
    if (footer) docDefinition.footer = footer;
    if (pageMargins) docDefinition.pageMargins = pageMargins;
    if (defaultStyle) docDefinition.defaultStyle = defaultStyle;
    // console.log({docDefinition});
    return docDefinition;
  }

  generatePdf(docDefinition: any) {
    return pdfMake.createPdf(docDefinition);

  }

  getPdfData({ styles, content, orientation, pageSize, pdfTitle, footer, pageMargins, defaultStyle,
    printSettings, printActionSettings, eType, sAction, sApiKey, addPageBreakBefore }: any):Promise<any> {
    return new Promise(async (resolve, reject) => {
      // console.log('getPdfData', {
      //   styles, content, orientation, pageSize, pdfTitle, footer, pageMargins, defaultStyle,
      //   printSettings, printActionSettings, eType, eSituation, sAction, sApiKey })
      const docDefinition = this.getDocDefinition(styles, content, orientation, pageSize, footer, pageMargins, defaultStyle, addPageBreakBefore);
      const pdfObject = this.generatePdf(docDefinition);
      if (sAction == 'sentToCustomer') {
        pdfObject.getBase64(async (response: any) => resolve(response));
      } else if (((printSettings && printActionSettings) || sAction == 'print') && sAction != 'download') {
        this.processPrintAction(pdfObject, pdfTitle, printSettings, printActionSettings, eType, sAction, sApiKey).then(() => {
          resolve(true);
        });
      } else {
        this.download(pdfObject, pdfTitle, printSettings?.nRotation);
        resolve(true)
      }
    });
  }
  
  download(pdfObject:any, pdfTitle:string, nRotation:number = 0) {
    // console.log({pdfObject,nRotation})
    if(nRotation == 0) {
      pdfObject.download(pdfTitle);
    } else {
      pdfObject.getBuffer(async (buffer: any) => {
        const PDFDocument = await pdfActions.createPDF.PDFDocumentFromPDFArray(buffer);
        const RotatedPDFDocument = await pdfActions.rotatePDF(PDFDocument, nRotation);
        const pdfBytes = await RotatedPDFDocument.save()
        const blob = await pdfActions.pdfArrayToBlob(pdfBytes)
        saveAs(blob, pdfTitle)
      });
    }
  }

  processPrintAction(pdfObject: any, pdfTitle: any, printSettings: any, printActionSettings: any, eType: any, sAction: any, sApiKey: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // console.log('processPrintAction', { printSettings, printActionSettings, eType, sAction })
      if (!printActionSettings && !sAction) {
        this.download(pdfObject, pdfTitle, printSettings?.nRotation);
        resolve(true);
        return;
      }
      // else if (printActionSettings) {
      //   printActionSettings = printActionSettings.find((s: any) => s.eType === eType && s.eSituation === eSituation);
      // }

      // console.log({ printActionSettings })
      if (sAction && sAction === 'print') {
        await this.handlePrint(pdfObject, printSettings, pdfTitle, sApiKey).toPromise();
        resolve(true);
      } else {
        // console.log({printActionSettings})
        if (printActionSettings && printActionSettings.aActionToPerform.includes('PRINT_PDF')) {
          if (!printSettings?.nPrinterId) {
            this.toastrService.show({ type: 'danger', text: `Printer is not selected for PDF - ${eType}` });
            return;
          }
          // console.log('action to perform handlePrint printpdf')
          await this.handlePrint(pdfObject, printSettings, pdfTitle, sApiKey).toPromise();
        }

        if (printActionSettings && printActionSettings.aActionToPerform.includes('DOWNLOAD')) {
          // console.log('action to perform autodownload')
          this.download(pdfObject, pdfTitle, printSettings?.nRotation);
        }
        resolve(true);
      }
    });
  }

  handlePrint(pdfObject: any, printSettings: any, pdfTitle: any, sApiKey: any): Observable<any> {
    return new Observable((observer: any) => {
      if (!printSettings?.nPrinterId) {
        this.toastrService.show({ type: 'danger', text: `Printer is not selected for ${printSettings.sType}` });
        return;
      }

      if (!printSettings?.nRotation || printSettings?.nRotation == 0) {
        pdfObject.getBase64(async (data: any) =>{
          await this.sendToPrint(data, printSettings, pdfTitle, sApiKey).toPromise();
          observer.complete();
        });
      } else {
        pdfObject.getBuffer(async (buffer: any) => {
          const PDFDocument = await pdfActions.createPDF.PDFDocumentFromPDFArray(buffer);
          const RotatedPDFDocument = await pdfActions.rotatePDF(PDFDocument, printSettings?.nRotation);
          const pdfBytes = await RotatedPDFDocument.save()
          const blob = await pdfActions.pdfArrayToBlob(pdfBytes)
          const data: any = await this.blobToBase64(blob);
          await this.sendToPrint(data, printSettings, pdfTitle, sApiKey).toPromise()
          observer.complete();
        });
      }
    });
  }

  sendToPrint(data: any, printSettings: any, pdfTitle: string, sApiKey: any):Observable<any> {
    return new Observable((observer: any) => {
      this.printService.printPDF(
        this.iBusinessId,
        data,
        printSettings.nPrinterId,
        printSettings.nComputerId,
        1,
        '',
        pdfTitle,
        {
          rotate: printSettings?.nRotation || 0,
          paper: printSettings?.sPrinterPageFormat,
          tray: printSettings?.sPaperTray,
          title: pdfTitle
        }
      ).then((response: any) => {
        this.handlePrintRespoinse(response, sApiKey)
        observer.complete();
      })
    });
  }

  handlePrintRespoinse(response:any, sApiKey:any) {
    if (response.status == "PRINTJOB_NOT_CREATED") {
      let message = '';
      if (response.computerStatus != 'online') {
        message = 'Your computer status is : ' + response.computerStatus + '.';
      } else if (response.printerStatus != 'online') {
        message = 'Your printer status is : ' + response.printerStatus + '.';
      }
      this.toastrService.show({ type: 'warning', title: 'PRINTJOB_NOT_CREATED', text: message });
    } else {
      this.toastrService.show({ type: 'success', text: 'PRINTJOB_CREATED', apiUrl: '/api/v1/printnode/print-job', templateContext: { apiKey: sApiKey, id: response.id } });
    }
  }

  blobToBase64 = (blob:any) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  };
}
