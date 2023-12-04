import { ComponentFactoryResolver, Injectable } from '@angular/core';
import * as moment from 'moment';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { StringService } from "./string.service";
import { FileSaverService } from "ngx-filesaver";
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from './api.service';

interface StaticPaperSize {
  type: string,
  width: string,
  height: string
}

interface Margins {
  top: number
  bottom: number,
  left: number,
  right: number
}

interface PaperSize {
  width: number,
  height: number,
  type: string
}

interface BarcodeOptions {
  bcid: string,
  scale: number,
  height: number,
  width: string,
  includetext: boolean,
  textalign: string,
  text: string
}

@Injectable({
  providedIn: 'root'
})

export class PdfService {

  private data: any = {};
  private css: string = "";
  
  oCurrencies:any = {
    pound: "£",
    swiss: "₣",
    euro: "€"
  }
  currency: string = "euro";
  separator: string = "dot";
  oSeparator:any = {
    dot: '.',
    comma: ','  
  }

  private defaultElement: string = "span";
  private fontSize: string = "10pt";
  private layout: any[] = [];
  private margins: number[] = [0];
  private dateFormat: string = "DD-MM-yyyy hh:mm";
  private dateOnlyFormat: string = "DD-MM-yyyy";
  private orientation: string = "portrait";
  private paperSize: string | PaperSize = "A4";
  private pixelsPerMm: number = 3.76;
  private rotation: number = 0;
  private debug: boolean = false;
  private barcodeOptions: BarcodeOptions = {
    bcid: "code128",
    scale: 2,
    height: 10,
    width: '100%',
    includetext: false,
    textalign: 'center',
    text: ''
  }
  private staticPaperSize: StaticPaperSize[] = [
    {
      type: "A4",
      width: "210",
      height: "297"
    },
    {
      type: "A5",
      width: "148",
      height: "210"
    },
    {
      type: "A6",
      width: "105",
      height: "148"
    },
    {
      type: "custom",
      width: "0",
      height: "0"
    }
  ]

  private totalPageCount: number = 0
  private pdfContainer: any;
  private parsedPaperSize: PaperSize = {
    height: 0,
    width: 0,
    type: 'A4'
  }

  translations:any;

  constructor(
    private factoryResolver: ComponentFactoryResolver,
    private httpClient: HttpClient,
    private stringService: StringService,
    private translateService: TranslateService,
    private fileSaver: FileSaverService,
    private apiService: ApiService) {
  }

  private addRowToPageWrap(page: any, row: any) {
    let wrapper = page.getElementsByClassName('wrapper')[0];
    wrapper.appendChild(row);
    return page;
  }

  private createWrapInPage(page: any, margins: Margins) {
    let wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');
    wrapper.style.padding = margins.top + 'mm ' + margins.right + 'mm ' + margins.bottom + 'mm ' + margins.left + 'mm';
    page.appendChild(wrapper);

    return page;
  }

  private isValidJson(json: string): boolean {
    try {
      if (json) {
        JSON.parse(json)
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  }

  private isDefined(obj: any): boolean {
    //return typeof obj !== 'undefined'
    if (Array.isArray(obj)) {
      return Boolean(obj.length > 0 && obj[0] !== "")
    } else {
      return Boolean(obj)
    }
  }

  private calcSectionPage(rows: any): any {
    for (let r = 0; r < rows.length; r++) {
      let row = rows[r];
      let rowData = row.dataset;

      if (rowData.sectionHeight > 0 && rowData.sectionRemaingSpace > 0 && rowData.sectionHeight >= rowData.sectionRemaingSpace) {
        rowData.sectionToNewPage = true;
      }
    }
    return rows;
  }

  // private calcNewProductTotal(price: number, quantity: number, discountPercent: number, discountValue: number): number {
  //   if (discountPercent && discountValue) {
  //     return (price * (100 / (100 - discountValue))) * quantity;
  //   } else if (!discountPercent && discountValue) {
  //     return (price + discountValue) * quantity;
  //   } else {
  //     return price * quantity
  //   }
  // }

  private createRandomString(len: number = 5): string {
    let text = "";
    const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private formatContent(val: any, type: string): any {
    // console.log('formatContent', {val, type})
    switch (type) {
      case 'money':
        return this.convertStringToMoney(val);
      case 'barcode':
        return this.convertValueToBarcode(val);
      case 'date':
        return (val === '' || val === 'NO_DATE_SELECTED' || moment(val).format(this.dateFormat) == 'Invalid date') ? val : moment(val).format(this.dateFormat);
      case 'dateonly':
        return (val === '' || val === 'NO_DATE_SELECTED' || moment(val).format(this.dateOnlyFormat) == 'Invalid date') ? val : moment(val).format(this.dateOnlyFormat);
      case 'uppercase':
        return val.toUpperCase();
      case 'lowercase':
        return val.toLowerCase();
      case 'translate':
        return this.translateService.instant(val.replaceAll('-','_').toUpperCase());
      default:
        return val;
    }
  }

  private convertHtmlToElement(htmlString: string): any {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  private convertStringToMoney(val: any): any {
    const sCurrency = this.oCurrencies[this.currency];
    const sSeparator = this.oSeparator[this.separator];
    if (val % 1 === 0) { //no decimals
      if (val) {
        val = (val >= 0) ?
          sCurrency + val :
          '-' + sCurrency + Math.abs(val);
        val = String(val + sSeparator + '00');
      } else {
        val = sCurrency + '0' + sSeparator + '00';
      }
    } else { // has decimals
      val = String(val);
      const parts = val.split('.');
      if (parts[1].length === 1) val = val + '0';
      if (val >= 0) {
        val = sCurrency + val
      } else {
        val = '-' + sCurrency + Math.abs(val)
      }
    }
    return val.replace('.', sSeparator);
  }

  private convertValueToBarcode(val: string): any {
    let canvas = document.createElement('canvas');
    let resultImg = document.createElement('img');

    try {
      let options = this.barcodeOptions;
      options.text = val;


      const queryString = new URLSearchParams(JSON.parse(JSON.stringify(options)))
      resultImg.src = 'https://bwipjs-api.metafloor.com/?' + queryString;
      resultImg.style.width = options.width;
    } catch (e) {
      console.error('Error creating barcode', e)
    }
    return resultImg.outerHTML;
  }

  private htmlDefaultStyling(): string {
    return `
		@page { margin: 0 }
		body { margin: 0 }
		p { margin: 0 }
		.sheet {
			margin: 0;
			overflow: hidden;
			position: relative;
			box-sizing: border-box;
			page-break-after: always;
			display: flex;
			flex-direction: column;
		}

		hr {
			width: 100%;
			margin: 1mm 0;
			height:1px;
		}

		h1,h2,h3,h4 {
			font-weight: 500;
		}

		img { max-width: 100%; }

		/** Paper sizes **/
		body.A3               .sheet { width: 297mm; height: 419mm }
		body.A3.landscape     .sheet { width: 420mm; height: 296mm }
		body.A4               .sheet { width: 210mm; height: 296mm }
		body.A4.landscape     .sheet { width: 297mm; height: 209mm }
		body.A5               .sheet { width: 148mm; height: 209mm }
		body.A5.landscape     .sheet { width: 210mm; height: 147mm }

		body.A6               .sheet { width: 105mm; height: 147mm }
		body.A6.landscape     .sheet { width: 147mm; height: 105mm }

		/** Padding area **/
		.sheet.padding-5mm  { padding: 5mm }
		.sheet.padding-10mm { padding: 10mm }
		.sheet.padding-15mm { padding: 15mm }
		.sheet.padding-20mm { padding: 20mm }
		.sheet.padding-25mm { padding: 25mm }

		/** For screen preview **/
		@media screen {
			body { background: white; }
			.sheet {
				background: white;
				margin: 5mm auto;
			}
		}

		/** Fix for Chrome issue #273306 **/
		@media print {
			body.A3.landscape { width: 420mm }
			body.A3, body.A4.landscape { width: 297mm }
			body.A4, body.A5.landscape { width: 210mm }
			body.A5, body.A6.landscape { width: 148mm }
			body.letter, body.legal    { width: 216mm }
			body.letter.landscape      { width: 280mm }
			body.legal.landscape       { width: 357mm }
		}

		.rotate-90 {
			-moz-transform: rotate(90deg);
			-webkit-transform: rotate(90deg);
			-o-transform: rotate(90deg);
			-ms-transform: rotate(90deg);
			transform: rotate(90deg);
		}

		.rotate-180 {
			-moz-transform: rotate(180deg);
			-webkit-transform: rotate(180deg);
			-o-transform: rotate(180deg);
			-ms-transform: rotate(180deg);
			transform: rotate(180deg);
		}

		.rotate-270 {
			-moz-transform: rotate(270deg);
			-webkit-transform: rotate(270deg);
			-o-transform: rotate(270deg);
			-ms-transform: rotate(270deg);
			transform: rotate(270deg);
		}

		body {
			font: ` + this.fontSize + ` "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
		}

		h1,h2,h3,h4,h5 {
			display: block;
			margin: 0;
		}

		th { text-align: left;}
		td { padding-right: 5mm;}


		* {
			box-sizing: border-box;
			-moz-box-sizing: border-box;
			-webkit-box-sizing: border-box;
			-webkit-print-color-adjust: exact;
		}

		.pnrow {
			display: flex;
			flex-wrap: wrap;
		}

		.pncol {
			overflow-x: hidden;
			overflow-y: auto;
		}

		.debug-true div {
			-webkit-box-shadow:inset 0px 0px 0px 1px #f00;
	    	-moz-box-shadow:inset 0px 0px 0px 1px #f00;
	    	box-shadow:inset 0px 0px 0px 1px #f00;
	    }

		` + this.css;
  }

  private createPageBody(content: string, paperSize: PaperSize): string {
    return '<body class="' + paperSize.type + ` ` + this.orientation + ' debug-' + this.debug + ' rotate-' + this.rotation + '" >' + content + '</body>'
  }

  private htmlPageEnd(): string {
    return '</html>'
  }

  private createPage(margins: Margins) {
    let newPage = document.createElement('div');
    newPage.classList.add('sheet');
    newPage = this.createWrapInPage(newPage, margins);
    return newPage;
  }

  private convertPagesToHtml(pages: any, paperSize: PaperSize): string {
    let html = '';
    let pdfBody = '';

    for (let p = 0; p < pages.length; p++) {
      if (this.isDefined(pages[p].childNodes[0].childNodes[0])) {
        pdfBody += pages[p].outerHTML;
      }
    }
    html += this.htmlPageHead(paperSize)
    html += this.createPageBody(pdfBody, paperSize);
    html += this.htmlPageEnd();

    return html;
  }

  private htmlPageHead(paperSize: PaperSize): string {
    const title = this.createRandomString(10);
    let html = `
		<!DOCTYPE html><html lang="en">
		<head>
			<meta charset="utf-8">
			<title>` + title + `</title>
			<style>` + this.htmlDefaultStyling() + `</style>`;

    if (paperSize.type === 'custom-papersize') {
      html += '<style>' + this.htmlCustomPaperSize(paperSize) + '</style>';
    }

    html += '</head>';

    return html;
  }

  private htmlCustomPaperSize(paperSize: PaperSize): string {
    return `
			body.custom-papersize               .sheet { width: ` + paperSize.width + `mm; height: ` + paperSize.height + `mm }
			body.custom-papersize.landscape     .sheet { width: ` + paperSize.height + `mm; height: ` + paperSize.width + `mm }

			@media print {
				body.custom-papersize.landscape { width: ` + paperSize.height + `mm }
				body.custom-papersize           { width: ` + paperSize.width + `mm }
			}
		`;
  }

  private convertSpacingArrayToObject(margins: number[]): Margins {
    let calculatedSpace = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
    switch (margins.length) {
      case 0:
        break;
      case 1:
        calculatedSpace = {
          top: margins[0],
          right: margins[0],
          bottom: margins[0],
          left: margins[0],
        }
        break;
      case 2:
        calculatedSpace = {
          top: margins[0],
          right: margins[1],
          bottom: margins[0],
          left: margins[1],
        }
        break;
      case 4:
        calculatedSpace = {
          top: margins[0],
          right: margins[1],
          bottom: margins[2],
          left: margins[3],
        }
        break;
      default:
        break;
    }

    return calculatedSpace;
  }

  private definePaperSize(paperSize: string | PaperSize, margins: number[]): PaperSize {
    let definedPaperSize: any

    if (typeof paperSize === 'string') {

      if (this.orientation === 'portrait' || this.orientation === 'landscape') {


        definedPaperSize = this.staticPaperSize.find((size) => size.type === paperSize)

        if (this.orientation === 'landscape') {
          let definedPaperSizeOldWidth = definedPaperSize.width
          definedPaperSize.width = definedPaperSize.height
          definedPaperSize.height = definedPaperSizeOldWidth
        }

      } else {
        console.error('Invalid paper orientation! Choose portrait or landscape"');
      }




      // if (template.orientation !== 'portrait') {
      //   if (this.paperSize.width > this.paperSize.height) {
      //     console.error('The paper height is already in landscape. Decrease the paper or change orientation to "portrait"');
      //     return Promise.reject('INVALID_PAPER_SIZE');
      //   }
      //   // Flip page sizes to make it landscape
      //   this.paperSize.height = this.paperSize.width;
      //   this.paperSize.width = this.paperSize.height;
      // }

    } else if (typeof paperSize === 'object') {
      let pageWidth = paperSize.width
      let pageHeight = paperSize.height

      let totalHorizontalMargin = 0, totalVerticalMargin = 0

      if (margins.length > 0) {
        const definedMargins = this.convertSpacingArrayToObject(margins);
        totalHorizontalMargin = (definedMargins.left + definedMargins.right);
        totalVerticalMargin = (definedMargins.top + definedMargins.bottom);
      }

      if ((pageWidth - totalHorizontalMargin) < 100) {
        console.error("Paper size is too low, we changed it from " + (pageWidth - totalHorizontalMargin) + ' to ' + (100 + totalHorizontalMargin))
        pageWidth = 100
      }

      if ((pageHeight - totalVerticalMargin) < 100) {
        console.error("Paper height is too low, we changed it from " + (pageHeight) + " to 100");
        pageHeight = 100
      }

      definedPaperSize = {
        type: "custom-papersize",
        width: pageWidth,
        height: pageHeight
      }
    }
    return definedPaperSize
  }

  private setProperties(template: any, data: any): void {
    if (data) {
      this.data = data;
    }
    if (template.css) {
      this.css = template.css
    }
    // if (template.currency) {
    //   this.currency = template.currency
    // }
    if (template.defaultElement) {
      this.defaultElement = template.defaultElement
    }
    if (template.fontSize) {
      this.fontSize = template.fontSize
    }
    if (template.layout) {
      this.layout = template.layout
    }
    if (template.margins) {
      this.margins = template.margins
    }
    if (template.dateFormat) {
      this.dateFormat = template.dateFormat
    }
    if (template.orientation) {
      this.orientation = template.orientation
    }
    if (template.paperSize) {
      this.paperSize = template.paperSize
    }
    if (template.pixelsPerMm) {
      this.pixelsPerMm = template.pixelsPerMm
    }
    if (template.rotation) {
      this.rotation = template.rotation
    }
    if (template.debug) {
      this.debug = template.debug
    }
    if (this.barcodeOptions) {
      this.barcodeOptions = template.barcodeOptions
    }
  }

  private createRows(cols: any, currentRow: any, printableArea: any, gutter: any, dataSourceObject?: any) {
    let rowsToBeCreated = 1;
    dataSourceObject = dataSourceObject || this.data;
    let createdRows = [];
    let foreachActive = false;

    if (this.isDefined(currentRow.forEach)) {
      foreachActive = true;
      dataSourceObject = this.defineDataSource(currentRow.forEach, dataSourceObject);
      rowsToBeCreated = dataSourceObject.length;
    }
    
    for (let r = 0; r < rowsToBeCreated; r++) {
      let finalDataSourceObject = dataSourceObject;
      if (typeof dataSourceObject.length === 'number') {
        finalDataSourceObject = Object.values(dataSourceObject)[r];
      }

      let rowElement = (this.isDefined(currentRow.element)) ? currentRow.element : 'div';
      let newRow = document.createElement(rowElement);
      newRow.classList.add('pnrow');

      newRow.dataset.inForeach = foreachActive;

      if (this.isDefined(currentRow.section)) {
        newRow.dataset.section = String(currentRow.section);
      }

      if (currentRow.htmlBefore) {
        newRow.appendChild(this.convertHtmlToElement(String(currentRow.htmlBefore)));
      }

      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        let colsize = col.size;
        let gutterSize = this.calcColumnGutter(colsize, gutter);
        let newRowWidth = this.calcRowWidth(printableArea.width, colsize, gutterSize);
        if (col?.object) finalDataSourceObject = finalDataSourceObject[col.object];
        let newCol = this.createCol(i, cols.length, newRowWidth, gutter, col, finalDataSourceObject, colsize, printableArea);
        if (this.isDefined(col.css)) {
          newCol = this.applyCss(newCol, col.css);
        }

        if (this.isDefined(newCol.newContent)) {
          for (let c = 0; c < newCol.newContent.length; c++) {
            let newData = newCol.newContent[c];
            let oldData = newCol.innerHTML;
            let newString = oldData.replace(newData[0], newData[1]);
            newCol.innerHTML = newString;
          }
        }

        newRow.appendChild(newCol);

        if (col.break) {
          const clearBoth = document.createElement('div');
          clearBoth.style.clear = 'both';
          newRow.appendChild(clearBoth);
        }

        // if (this.isDefined(col.forEach)){
        //   // let gutterSizeNew = this.calcColumnGutter(colsize, gutter);
        //   this.createRows(col.row, col, printableArea, 12);
        // }
      }

      if (currentRow.htmlAfter) {
        newRow.appendChild(this.convertHtmlToElement(String(currentRow.htmlAfter)));
      }
      createdRows.push(newRow);
    }

    if (currentRow.container) {
      const container = document.createElement(currentRow.container)
      for (let r = 0; r < createdRows.length; r++) {
        const row = createdRows[r];
      }
      createdRows = [container]
    }
    return createdRows;
  }

  private createRowsFromLayout(paperSize: PaperSize): any {
    let margins = this.convertSpacingArrayToObject(this.margins);

    const printableWidth = (paperSize.width - (margins.left + margins.right));
    const printableHeight = (paperSize.height - (margins.top + margins.bottom));
    const printableArea = {
      x: margins.left,
      y: margins.top,
      width: printableWidth,
      height: printableHeight,
      maxHeight: Math.floor(printableHeight * this.pixelsPerMm)
    };

    this.pdfContainer = document.getElementById('pdfGenerator');
    let newContentHeight = 0;
    let maxContentHeight = printableArea.maxHeight;
    let pageNumber = 1;
    let rows = [];
    let rowCounter = 1;
    let currentSection = "";
    let currentSectionHeight = 0;
    let previousSection = "";
    let sectionRemainingSpace = 0;

    for (let r = 0; r < this.layout.length; r++) {
      const currentRow = this.layout[r];

      currentSection = currentRow.section;
      let newSection = false;
      if (this.isDefined(currentRow.section)) {
        if (currentSection !== previousSection) {
          newSection = true;
          sectionRemainingSpace = 0;
          currentSectionHeight = 0;
        }
      } else {
        sectionRemainingSpace = 0;
        currentSectionHeight = 0;
      }

      rowCounter++

      const cols = currentRow['row'];
      const gutterSize = 1;
      let totalRowHeight = 0;

      let newRows = this.createRows(cols, currentRow, printableArea, gutterSize);
      for (let i = 0; i < newRows.length; i++) {
        let newRow = newRows[i];

        if (this.isDefined(currentRow.css)) {
          newRow = this.applyCss(newRow, currentRow.css);
        }

        this.pdfContainer.innerHTML += newRow.outerHTML;
        newContentHeight = this.pdfContainer.clientHeight;
        totalRowHeight = newContentHeight;

        let remainingSpace = (maxContentHeight - newContentHeight);

        if (newContentHeight >= maxContentHeight) {
          newRow.contentHeight = newContentHeight;

          if (newContentHeight > remainingSpace) {
            pageNumber++;
            newRow.pageNumber = pageNumber;
          } else {
            newRow.pageNumber = pageNumber;
            pageNumber++;
          }

          newContentHeight = 0;
          this.pdfContainer.innerHTML = "";
        } else if (newSection && newContentHeight >= (maxContentHeight * 0.075)) {
          pageNumber++;
          newRow.pageNumber = pageNumber;
          newContentHeight = 0;
          this.pdfContainer.innerHTML = "";
        } else {
          newRow.pageNumber = pageNumber;
        }

        newRow.section = currentRow.section;
        newRow.rowHeight = totalRowHeight;

        if (newSection) {
          sectionRemainingSpace = remainingSpace;
        }

        newRow.dataset.sectionRemainingSpace = sectionRemainingSpace;
        newRow.dataset.sectionHeight = currentSectionHeight;
        newRow.dataset.contentHeight = totalRowHeight;
        newRow.dataset.maxContentHeight = maxContentHeight;

        currentSectionHeight = totalRowHeight;
        totalRowHeight = 0;
        previousSection = currentSection;

        rows.push(newRow)
      }
    }

    this.totalPageCount = pageNumber;
    rows = this.calcSectionPage(rows);

    return rows;
  }

  private checkConditions(conditions: any, dataSourceObject: any): boolean {
    let counter = 0;
    let inverted = false;
    let result = false;

    if (typeof conditions === 'object') {
      for (let c = 0; c < conditions.length; c++) {
        let condition = conditions[c];

        if (condition.indexOf('!') > -1) {
          inverted = true;
          condition = condition.replace('!', '')
        }

        let dataValue = dataSourceObject[condition];

        if (inverted) {
          if (dataValue === false || dataValue === 0 || dataValue === '') {
            counter++
          }
        } else {
          if (dataValue) {
            counter++
          }
        }
      }
    }

    return counter === conditions.length
  }

  private getVariables(text: string): RegExpMatchArray | null {
    return text.match(/\[\[(.*?)]]/ig) || null
  }

  removeBrackets(textWithBrackets: string): string {
    return textWithBrackets.replace(/\s/g, '').replace(' ', '').replace('[[', '').replace(']]', '');
  }

  processConditions(originalText: any, dataSourceObject ?: any) {
    if (originalText.indexOf('<if') !== -1) {
      let sConditionalString = originalText.substring(originalText.indexOf('<if'), originalText.indexOf('/if>') + 4);
      let sCondition = sConditionalString.substring(sConditionalString.indexOf('<if') + 4, sConditionalString.indexOf('|') - 1).trim();
      let contentString = sConditionalString.substring(sConditionalString.indexOf('|') + 1, sConditionalString.indexOf('/if>'));
      if (dataSourceObject && dataSourceObject[sCondition]) return originalText.replace(sConditionalString, contentString);
      else return originalText.replace(sConditionalString, '');
    } else {
      return originalText;
    }
  }

  replaceVariables(originalText: string, dataSourceObject: any) {
    const bTesting = false;
    if(bTesting) console.log('replaceVariables', {originalText});
    if (!this.isDefined(originalText)) {
      return;
    }
    
    originalText = this.processConditions(originalText, dataSourceObject);

    let extractedVariables = this.getVariables(originalText);
    if (bTesting) console.log({extractedVariables})
    let providedData = dataSourceObject;
    if (bTesting) console.log({ providedData })
    let finalString = originalText;

    if (extractedVariables) {
      for (let a = 0; a < extractedVariables.length; a++) {
        let currentMatch = extractedVariables[a];
        if (bTesting) console.log({ currentMatch })

        const matchedMatch = currentMatch.match(/\[/g)

        if (matchedMatch && matchedMatch.length === 2) {
          let currentMatchClean = this.removeBrackets(currentMatch);

          let variableStringFiltered = currentMatchClean;
          if (bTesting) console.log({ variableStringFiltered })
          let format = '';

          if (currentMatchClean.match(/\|/g) !== null) {
            let stringAndFormat = currentMatchClean.split('|');
            variableStringFiltered = stringAndFormat[0];
            format = stringAndFormat[1];
          }

          if (variableStringFiltered.match(/\./g)) {
            let layer1
            let layer2
            const filterMatches = variableStringFiltered.match(/\./g);
            let nrOfLevels = filterMatches ? filterMatches.length : 0;
            let parts = variableStringFiltered.split('.');
            // console.info('nrOfLevels',nrOfLevels)
            // console.info('variableStringFiltered',variableStringFiltered)
            // console.info('this.data',this.data)

            switch (nrOfLevels) {
              case 1:
                if (this.isDefined(this.data[parts[0]])) {
                  providedData = this.data[parts[0]];
                  variableStringFiltered = parts[1];
                } else {
                  providedData = '';
                  variableStringFiltered = 'no match';
                }
                break;
              case 2:
                if (this.isDefined(this.data[parts[0]])) {
                  layer1 = this.data[parts[0]];
                  if (this.isDefined(layer1[parts[1]])) {
                    providedData = layer1[parts[1]];
                    variableStringFiltered = parts[2];
                  } else {
                    providedData = '';
                    variableStringFiltered = 'no match';
                  }
                } else {
                  providedData = '';
                  variableStringFiltered = 'no match';
                }

                // if (!this.isDefined(providedData[variableStringFiltered])) {
                //   providedData = providedData[0];
                // }

                break;
              case 3:
                if (this.isDefined(this.data[parts[0]])) {
                  layer1 = this.data[parts[0]];
                  if (this.isDefined(layer1[parts[1]])) {
                    layer2 = layer1[parts[1]]
                    if (this.isDefined(layer2[parts[2]])) {
                      providedData = layer2[parts[2]];
                      variableStringFiltered = parts[3];
                    } else {
                      providedData = '';
                      variableStringFiltered = 'no match';
                    }
                  } else {
                    providedData = '';
                    variableStringFiltered = 'no match';
                  }
                } else {
                  providedData = '';
                  variableStringFiltered = 'no match';
                }

                break;
              default:
                providedData = '';
                variableStringFiltered = 'no match';
                break;
            }
          } //else {
            // variableStringFiltered = currentMatchClean
          //}

          // let matched = false;
          let newText = '';
          if (this.isDefined(providedData)) {
            if (bTesting) console.log(926, 'providedData[variableStringFiltered]',providedData[variableStringFiltered])
            if (providedData[variableStringFiltered]) {
              newText = providedData[variableStringFiltered];
              if (bTesting) console.log(928, { newText })
            } else if (variableStringFiltered.startsWith("__")) {
              newText = this.translateService.instant(variableStringFiltered.substring(2));
            } else {
              newText = '';
            }
            if(bTesting) console.log(959, { newText })
            if (this.isDefined(format) && format !== '') {
              newText = this.formatContent(newText, format);
              if (bTesting) console.log(962, {newText})
            }
            finalString = finalString.replace(currentMatch, newText);
            if (bTesting) console.log(964, { finalString })
            // for (const key of Object.keys(providedData)) {
            //   if (key === variableStringFiltered) {
            //     if (String(providedData[variableStringFiltered]).length > 0) {
            //       matched = true;
            //       newText = String(providedData[variableStringFiltered]);

            //       if (this.isDefined(format) && format !== '') {
            //         newText = this.formatContent(newText, format);
            //       }
            //     }
            //     break;
            //   }
            // }

            // Object.keys(providedData).forEach((key, index) => {
            //   if (key === variableStringFiltered) {
            //     if (String(providedData[variableStringFiltered]).length > 0) {
            //       matched = true;
            //       newText = String(providedData[variableStringFiltered]);

            //       if (this.isDefined(format) && format !== '') {
            //         newText = this.formatContent(newText, format);
            //       }
            //     }
            //   }
            // });
          } else {
            console.warn('No match found for', currentMatch)
          }

          // if (matched) {
          //   finalString = finalString.replace(currentMatch, newText);
          // } else {
          //   console.warn(finalString + " could not be matched with the provided data.", currentMatch)
          //   finalString = '';
          // }
        } else {
          console.error('A variable in "' + currentMatch + '" is not closed properly', currentMatch)
        }
      }
    }
    return finalString;
  }

  private applyCss(obj: any, css: string): any {
    let extractedCss = Object.entries(css);
    for (let r = 0; r < extractedCss.length; r++) {
      const rule = extractedCss[r];

      if (rule[0] === 'padding' || rule[0] === 'margin') {
        let convertedValues;
        if (typeof rule[1] === 'object') {

          let containsInvalidValues = Object.values(rule[1]).filter(function (item: any, index) {
            return isNaN(item) // || (item % 1 != 0)
          })

          if (containsInvalidValues.length > 0) {
            console.error('The ' + rule[0] + ' array can only contain numeric values (millimeters)');
          }

          convertedValues = this.convertSpacingArrayToObject(rule[1]);

        } else {
          convertedValues = this.convertSpacingArrayToObject([parseInt(rule[1])]);
        }

        obj.style[rule[0].toLowerCase() + '-top'] = String(convertedValues.top) + 'mm';
        obj.style[rule[0].toLowerCase() + '-right'] = String(convertedValues.right) + 'mm';
        obj.style[rule[0].toLowerCase() + '-bottom'] = String(convertedValues.bottom) + 'mm';
        obj.style[rule[0].toLowerCase() + '-left'] = String(convertedValues.left) + 'mm';
      } else {
        obj.style[rule[0]] = rule[1];
      }
    }
    return obj;
  }

  private defineVisibility(elementIndex: number, element: any, template: any, newContent: any): any {
    for (let c = 0; c < newContent.length; c++) {
      if (template.content === newContent[c][0] && elementIndex === c) {
        const visibility = newContent[c][2];
        if (this.isDefined(visibility)) {
          if (!visibility) {
            element.style.display = 'none';
          }
        }
      }
    }
    return element;
  }

  private insertElementsInCol(col: any, html: any, newContent: any): any {
    for (let a = 0; a < html.length; a++) {
      const part = html[a];
      if (!this.isDefined(part.element)) {
        part.element = this.defaultElement;
      }

      let element = document.createElement(part.element);

      if (this.isDefined(newContent)) {
        element = this.defineVisibility(a, element, part, newContent);
      }
      if (this.isDefined(part.css)) {
        element = this.applyCss(element, part.css);
      }
      if (this.isDefined(part.content)) {
        if (part.element === 'img') {
          element.src = part.content;
        } else {
          element.innerHTML = part.content;
        }
      }

      col.appendChild(element);

      if (part.break) {
        let clearBoth = document.createElement('div');
        clearBoth.style.clear = 'both';
        col.appendChild(clearBoth);
      }
    }
    return col;
  }

  private defineDataSource(key: string, dataSourceObject?: any): any {

    let layer1, layer2, layer3
    dataSourceObject = dataSourceObject || [];
    if (key.match(/\./g)) {

      let parts = key.split('.');
      switch (parts.length) {
        case 0:
          dataSourceObject = this.data[key]
          break;
        case 1:
          layer1 = this.data[parts[0]];
          dataSourceObject = layer1[parts[1]];
          break;
        case 2:
          layer1 = this.data[parts[0]];
          layer2 = layer1[parts[1]];
          dataSourceObject = layer2[parts[2]];
          break;
        case 3:
          layer1 = this.data[parts[0]];
          layer2 = layer1[parts[1]];
          layer3 = layer2[parts[2]];
          dataSourceObject = layer3[parts[3]];
          break;
        default:
          break;
      }
    } else {
      if (dataSourceObject[key] !== undefined || this.data[key] !== undefined) {
        dataSourceObject = dataSourceObject[key] || this.data[key];
      } else {
        dataSourceObject = [];
        console.error('The provided key "' + key + '" does not exist in the data')
      }
    }

    return dataSourceObject;
  }

  private calcColumnWidth(size: number, rowWidth: number): number {
    size = (size === null || size > 12 || size === undefined) ? 12 : size;
    return (size * (rowWidth / 12)) * 0.990;
  }

  private calcRowWidth(printableAreaWidth: any, currentSize: any, gutter: any) {
    let newRowWidth;
    if (currentSize < 12 && currentSize > 1) {
      newRowWidth = printableAreaWidth - gutter;
    } else {
      newRowWidth = printableAreaWidth;
    }
    return newRowWidth;
  }

  private calcColumnGutter(currentSize: any, gutter: any) {
    return ((12 - currentSize) * gutter) / currentSize;
  }

  private createCol(i: number, nrOfCols: number, newRowWidth: number, gutterSize: string, colObject: any, dataSourceObject: any = null, currentSize: number = 12, printableArea: any) {
    let html = (colObject.html || '');
    let element = (colObject.element || 'div');
    let forEach = (colObject.forEach || '');
    let htmlBefore = (colObject.htmlBefore || '');
    let htmlAfter = (colObject.htmlAfter || '');
    let col = document.createElement(element);
    let newContent = [];
    if (html.length > 0) {
      if (typeof html[0] === 'object') {
        for (let e = 0; e < html.length; e++) {
          if(this.isDefined(html[e].if) && !this.checkConditions(html[e].if, dataSourceObject)) {
            html.splice(e,1);
            e--; 
          } else {
            html[e].content = typeof html[e].content !== 'undefined' ? html[e].content.replace('/>', '>') : "";

            if (this.isDefined(html[e].if)) {
              newContent.push([
                html[e].content,
                this.replaceVariables(html[e].content, dataSourceObject),
                this.checkConditions(html[e].if, dataSourceObject)
              ]);
            } else {
              newContent.push([
                html[e].content,
                this.replaceVariables(html[e].content, dataSourceObject)
              ])
              
            }
          }

          if (html[e]?.row) {
            let finalNestedContent = [];
            const nestedRowObject = { ...html[e] };
            delete nestedRowObject.element;
            delete nestedRowObject.content;

            if (nestedRowObject?.forEach != '') {
              dataSourceObject = this.defineDataSource(nestedRowObject.forEach, dataSourceObject);
                
                for (let k = 0; k < nestedRowObject.row.length; k++) {

                  let html2 = (nestedRowObject.row[k].html || '');
                  
                  if (typeof html2[0] === 'object') {
                    for (let e = 0; e < html2.length; e++) {
                      html2[e].content = typeof html2[e].content !== 'undefined' ? html2[e].content.replace('/>', '>') : "";
                      
                      if (this.isDefined(html2[e].if)) {
                        newContent.push([
                          html2[e].content,
                          this.replaceVariables(html2[e].content, dataSourceObject[0]),
                          this.checkConditions(html2[e].if, dataSourceObject[0])
                        ]);
                      } else {
                        newContent.push([
                          html2[e].content,
                          this.replaceVariables(html2[e].content, dataSourceObject[0])
                        ])
                      }
                      html.push(html2[e]);
                    }
                  } else {
                    let template = html2.replace('/>', '>');
                    html2 = this.replaceVariables(template, dataSourceObject[0]);
                  }
                  finalNestedContent.push(html2);
                }
            }
          }
        }
        col = this.insertElementsInCol(col, html, newContent);
      } else {
        let template = html.replace('/>', '>');
        html = '';
        if (forEach !== '') {
          html += this.replaceVariables(template, dataSourceObject);
          let relatedSourceObject = JSON.parse(JSON.stringify(dataSourceObject));
          dataSourceObject = this.defineDataSource(forEach);
          for (let d = 0; d < dataSourceObject.length; d++) {
            let entry = dataSourceObject[d];
            let extractedVariables = this.getVariables(template);
            let htmlConcept = '';
            if (this.isDefined(colObject.forEach)) {
              let newRows = this.createRows(colObject.row, colObject, printableArea, 12, relatedSourceObject);
              for (let i = 0; i < newRows.length; i++) {
                let newRow = newRows[i];
                if (this.isDefined(colObject.row.css)) {
                  newRow = this.applyCss(newRow, colObject.row.css);
                }

                html += newRow.outerHTML;
              }
            }
            html += htmlConcept
          }
        } else {
          html += this.replaceVariables(template, dataSourceObject);
        }
        col.innerHTML = html;
      }
    }

    

    col.classList.add('pncol');
    col.classList.add('pncol-' + currentSize);

    let thisColWidth = this.calcColumnWidth(currentSize, newRowWidth);

    if ((i + 1) < nrOfCols) {
      col.style.marginRight = gutterSize + 'mm';
    }

    col.style.width = String(thisColWidth) + 'mm';
    col.newContent = newContent;

    if (colObject.htmlBefore) {
      col.innerHTML = htmlBefore + col.innerHTML + htmlAfter;
    }
    return col;
  }

  private makePdf(templateString: string, dataString: string): Promise<string> {
    if (!this.isValidJson(templateString)) {
      console.error('Template is geen geldige JSON');
      return Promise.reject('TEMPLATE_NOT_VALID');
    }
    if (!this.isValidJson(dataString)) {
      console.error('Data is geen geldige JSON');
      return Promise.reject('DATA_NOT_VALID');
    }

    const template = JSON.parse(templateString);
    const dataObject = JSON.parse(dataString);

    this.setProperties(template, dataObject);
    this.paperSize = this.definePaperSize(this.paperSize, this.margins);
    this.parsedPaperSize = this.paperSize;

    let margins = this.convertSpacingArrayToObject(this.margins);
    let rows = this.createRowsFromLayout(this.paperSize);

    this.pdfContainer.innerHTML = "";

    let pages = [];
    let page = this.createPage(margins);
    let lastPageNumber = 1;
    let foreachStarted = false;

    for (let r = 0; r < rows.length; r++) {
      let row = rows[r];

      if (row.dataset.inForeach === 'true') {
        if (!foreachStarted) {
          foreachStarted = true
        }
      } else {
        foreachStarted = false
      }

      let nextRow = rows[r + 1];
      if (this.isDefined(nextRow)) {
        if (foreachStarted && nextRow.outerHTML.indexOf('in-foreach') < 1) {
          if (row.pageNumber < this.totalPageCount) {
            if (row.dataset.currentContentHeight > (row.dataset.maxContentHeight * 0.085)) {
              row.pageNumber++
            }
          }
        }
      }

      if (row.pageNumber === lastPageNumber) {
        page = this.addRowToPageWrap(page, row);
      } else {
        pages.push(page);
        page = this.createPage(margins);
        page = this.addRowToPageWrap(page, row);
      }

      lastPageNumber = row.pageNumber;
    }

    pages.push(page)

    return Promise.resolve(this.convertPagesToHtml(pages, this.paperSize));
  }

  private generate(templateString: string, dataString: string, fileName: string, print: boolean, printData: any, businessId: string | null, transactionId: string | null) {
    //Set a small timeout to let the component generate and make sure that it will exist
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.makePdf(templateString, dataString)
          .then((htmlString: string) => {
            let headers: any = {
              'Content-Type': 'application/pdf',
            }
            if (localStorage.getItem('authorization') && localStorage.getItem('authorization')?.trim() != '') {
              headers['Authorization'] = localStorage.getItem('authorization');
            }
            if (localStorage.getItem('org') && localStorage.getItem('org')?.trim() != '') {
              let details: any = localStorage.getItem('org');
              let organization = JSON.parse(details);
              headers['db'] = organization.sName
            }

            const encodedString = this.stringService.b2a(htmlString.replace(/€/gi, '+euro+'))

            //uncomment the line below if you want to debug the previous code without actually generating a pdf
            //return resolve('success') 

            return this.httpClient
              .post(
                'https://uzkiljt7h5.execute-api.eu-west-1.amazonaws.com/development/pdf',
                {
                  fileName: fileName,
                  width: this.parsedPaperSize.width,
                  height: this.parsedPaperSize.height,
                  orientation: this.orientation,
                  html: encodedString,
                  printOptions: printData,
                  print: print,
                  businessId: '6182a52f1949ab0a59ff4e7b',
                  transactionId: transactionId,
                  format: this.parsedPaperSize.type,
                },
                {
                  headers: headers,
                  responseType: 'blob'
                })
              .subscribe(
                (result: any) => {
                  this.fileSaver.save((<any>result), fileName + '.pdf')
                  return resolve('success')
                },
                (error: HttpErrorResponse) => {
                  console.error('ERROR', error)
                  return reject(error.message)
                }
              )

          })
          .catch((e: Error) => {
            console.error(e)
            return reject(e.message)
          })
      }, 250)
    })
  }

  getTranslations() {
    let translationsObj: any = {};
    let translationsKey: Array<string> = [
      'CREATED_BY',
      'ART_NUMBER',
      'QUANTITY',
      'DESCRIPTION',
      'DISCOUNT',
      'AMOUNT',
      'VAT',
      'SAVINGS_POINTS',
      'GIFTCARD',
      'TO_THE_VALUE_OF',
      'ISSUED_AT',
      'VALID_UNTIL',
      'CARDNUMBER',
      'Methode',
      'Bedrag',
      'GIFTCARD',
      'TO_THE_VALUE_OF',
      'ISSUED_AT',
      'VALID_UNTIL',
      'EXPECTED_PRICE_PER_PIECE',
      'ACTIVITY_ITEM_NUMBER',
      'LOYALTY_POINTS_REDEEMED',
      'BONNUMMER',
      'TRANSACTION_NUMBER',
      'DATE',
    ];

    this.translateService.get(translationsKey).subscribe((result) => {
      Object.entries(result).forEach((translation: any) => {
        translationsObj[String("__" + translation[0])] = translation[1]
      })
    });
    this.translations = translationsObj;
    return translationsObj;
  }

  async createPdf(templateString: string, dataString: any, fileName: string, print: boolean, printData: any, businessId: string | null, transactionId: string | null): Promise<any> {
    const transactions:any = [];//await this.getTranslations();
    const data = { ...dataString, ...transactions }
    let pdfGenerator = document.createElement('div')
    pdfGenerator.style.display = 'none'
    pdfGenerator.id = 'pdfGenerator'
    document.body.appendChild(pdfGenerator)
    templateString = this.processTemplateString(JSON.parse(templateString));
    return this.generate(templateString, JSON.stringify(data), fileName, print, printData, businessId, transactionId)
  }

  logService(details: string) {
  }

  processTemplateString(template:any) {
    let t:any = {...template};
    
    delete template.dCreatedDate;
    delete template.dUpdatedDate;
    delete template.eStatus;
    delete template.eType;
    delete template.iBusinessId;
    delete template.iLocationId;
    delete template.sName;
    delete template._id;
    delete template.__v;

    template?.aSettings.forEach((setting:any) => {
      switch (setting.sParameter) {
        case 'orientation':
          t.orientation = setting.value;
          break;
        case 'pageSize':
          t.paperSize = (setting.value === 'custom') ? { width: setting.nWidth, height: setting.nHeight, type: 'custom-papersize' } :setting.value;
          break;
        case 'pageMargins':
          console.log({ setting });
          t.margins = { 
            left: setting.aValues[0], 
            top: setting.aValues[1], 
            right: setting.aValues[2], 
            bottom: setting.aValues[3] 
          };
          break;
        case 'fontSize':
          t.fontSize = setting.value;
          break;
      }
      t.css = setting?.css;
      t.defaultElement = "p";
    });
    return JSON.stringify(t);
  }


  async fetchBusinessDetails(iBusinessId: any) {
    return await this.apiService.getNew('core', '/api/v1/business/' + iBusinessId).toPromise();
  }

  veiwObject(dataObj: any) {
    let dataObject = JSON.parse(JSON.stringify(dataObj));

    dataObject.aTransactionItems = [];
    dataObj.aTransactionItems.forEach((item: any, index: number) => {
      if (!(item.oType?.eKind == 'discount' || item?.oType?.eKind == 'loyalty-points-discount')) {
        dataObject.aTransactionItems.push(item);
      }
    })

    let language: any = localStorage.getItem('language');
    dataObject.total = 0;
    let total = 0, totalAfterDisc = 0, totalVat = 0, totalDiscount = 0, totalSavingPoints = 0;
    dataObject.aTransactionItems.forEach((item: any, index: number)=>{
      let name = '';
      if(item && item.oArticleGroupMetaData && item.oArticleGroupMetaData.oName && item.oArticleGroupMetaData.oName[language]) name = item?.oArticleGroupMetaData?.oName[language] + ' ';
      item.description = name;
      if(item?.oBusinessProductMetaData?.sLabelDescription) item.description = item.description + item?.oBusinessProductMetaData?.sLabelDescription + ' ' + item?.sProductNumber;
      totalSavingPoints += item.nSavingsPoints;
      let disc = parseFloat(item.nDiscount);
      if(item.bPaymentDiscountPercent){ 
        disc = (disc * parseFloat(item.nPriceIncVat)/(100 + parseFloat(item.nVatRate)));
        item.nDiscountToShow = disc;
      } else { item.nDiscountToShow = disc; }
      item.priceAfterDiscount = (parseFloat(item.nPaymentAmount) -  parseFloat(item.nDiscountToShow));
      item.totalPaymentAmount = parseFloat(item.nPaymentAmount) * parseFloat(item.nQuantity);
      item.totalPaymentAmountAfterDisc = parseFloat(item.priceAfterDiscount) * parseFloat(item.nQuantity);
      item.bPrepayment = item?.oType?.bPrepayment || false;
      const vat = (item.nVatRate * item.priceAfterDiscount/(100 + parseFloat(item.nVatRate)));
      item.vat = vat.toFixed(2);
      totalVat += vat;
      total = total + item.totalPaymentAmount;
      totalAfterDisc += item.totalPaymentAmountAfterDisc;
      totalDiscount += disc;
    })
    dataObject.totalAfterDisc = parseFloat(totalAfterDisc.toFixed(2));
    dataObject.total = parseFloat(total.toFixed(2));
    dataObject.totalVat = parseFloat(totalVat.toFixed(2));
    dataObject.totalDiscount = parseFloat(totalDiscount.toFixed(2));
    dataObject.totalSavingPoints = totalSavingPoints;
    dataObject.dCreatedDate = moment(dataObject.dCreatedDate).format('DD-MM-yyyy hh:mm');

    dataObject.aPayments.forEach((obj: any) => {
      obj.dCreatedDate = dataObject.dCreatedDate;
    });

    return dataObject;
  }
  async generatePDF(transaction: any ) {
    transaction = this.veiwObject(transaction);
    const iBusinessId = localStorage.getItem('currentBusiness') || '';
    const res: any = await this.fetchBusinessDetails(iBusinessId);
    const businessDetails = res.data;
    const sName = 'Sample', eType = transaction.eType;
    const iLocationId = localStorage.getItem('currentLocation') || '';
    const filename = new Date().getTime().toString()
    transaction.businessDetails = businessDetails;
    for (let i = 0; i < businessDetails?.aLocation.length; i++) {
      if (businessDetails.aLocation[i]?._id.toString() == iLocationId.toString()) {
        transaction.currentLocation = businessDetails.aLocation[i];
      }
    }
    const url = `/api/v1/pdf/templates/${businessDetails._id}?sName=${sName}&eType=${eType}`;
    const result: any = await this.apiService.getNew('cashregistry', url).toPromise();
    return this.createPdf(JSON.stringify(result.data), transaction, filename, false, null, iBusinessId, transaction?._id);
  }
}
