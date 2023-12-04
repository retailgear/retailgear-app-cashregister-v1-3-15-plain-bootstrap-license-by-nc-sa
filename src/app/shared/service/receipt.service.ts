import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Observable } from "rxjs";
import { ApiService } from "./api.service";
import { CommonPrintSettingsService } from "./common-print-settings.service";
import { PdfService as PdfServiceNew } from "./pdf2.service";
import { PdfService as PdfService } from "./pdf.service";
import { ToastService } from "../components/toast";
import { Pn2escposService } from "./pn2escpos.service";
import { PrintService } from "./print.service";
import * as _moment from 'moment';
const moment = (_moment as any).default ? (_moment as any).default : _moment;
import * as JsBarcode from 'jsbarcode';
@Injectable({
    providedIn: 'root'
})
export class ReceiptService {
    iBusinessId: string;
    businessDetails: any;
    iLocationId: string;
    iWorkstationId: string;
    DIVISON_FACTOR: number = 1;

    content: any = [];
    styles: any = {
        businessLogo: {
            alignment: 'left',
        },
        right: {
            alignment: 'right',
        },
        left: {
            alignment: 'left',
        },
        center: {
            alignment: 'center',
        },
        bold: {
            bold: true,
        },
        header: {
            fontSize: 12,
            bold: false,
            margin: 5, //[0, 5, 0, 10]
        },
        businessName: {
            fontSize: 12,
            margin: 5, //[0, 5, 0, 10]
        },
        // normal: {
        //     fontSize: 8,
        //     margin: 5, //[0, 5, 0, 5]
        // },
        tableExample: {
            // border: 0,
            fontSize: 8,
        },
        headerStyle: {
            fontSize: 10,
            bold: true,
            color: '#333',
            margin: [0, 10, 0, 10]
        },
        supplierName: {
            alignment: 'right',
            fontSize: 12,
            margin: [0, -10, 0, 10],
        },
        afterLine: {
            margin: [0, 0, 0, 10],
        },
        separatorLine: {
            color: '#ccc',
        },
        afterLastLine: {
            margin: [0, 20, 0, 20],
        },
        th: {
            // fontSize: 8,
            bold: true,
            // margin: [5, 10],
        },

        td: {
            // fontSize: 8,
            // margin: [5, 10],
        },
        articleGroup: {
            fillColor: '#F5F8FA',
        },
        property: {
            // color: "#ccc",
        },
        border_bottom: [false, false, false, true],
        border_top: [false, true, false, false],
        border_top_bottom: [false, true, false, true],
    };

    oOriginalDataSource: any;
    // logoUri: any;
    pageSize: any = 'A5';
    orientation: string = 'portrait';
    translations: any;
    bRemoveTopMargin: boolean = false;

    // pn2escposService: any;
    constructor(
        private pdfServiceNew: PdfServiceNew,
        private apiService: ApiService,
        private commonService: CommonPrintSettingsService,
        private pdfService: PdfService,
        private toastService: ToastService,
        private printService: PrintService,
        private pn2escposService: Pn2escposService,
        private translateService: TranslateService) {

        this.iBusinessId = localStorage.getItem('currentBusiness') || '';
        this.iLocationId = localStorage.getItem('currentLocation') || '';
        this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
        this.fetchBusinessDetails();
        // this.pn2escposService = new Pn2escposService(Object);
    }

    exportToPdf({ oDataSource, templateData, pdfTitle, printSettings, printActionSettings, sAction, sApiKey }: any): Observable<any> {
        return new Observable<any>((observer: any) => {
            // console.log({ oDataSource, templateData, printSettings, printActionSettings, sAction, sApiKey });
            if(oDataSource.oCustomer && oDataSource.oCustomer?.sSalutation){
                this.translateService.get(oDataSource.oCustomer?.sSalutation?.toUpperCase()).subscribe((res) => {
                    if(res != oDataSource.oCustomer?.sSalutation?.toUpperCase())
                        oDataSource.oCustomer.sSalutation = res;
                });
            }
            this.oOriginalDataSource = oDataSource;
            const oCurrentLocation = oDataSource?.currentLocation || oDataSource?.businessDetails?.currentLocation;
            if (oCurrentLocation?.eCurrency) this.pdfService.currency = oCurrentLocation.eCurrency;
            if (oCurrentLocation?.eCurrencySeparator) this.pdfService.separator = oCurrentLocation.eCurrencySeparator;

            this.commonService.pdfTitle = pdfTitle;
            this.commonService.mapCommonParams(templateData.aSettings);
            this.content = [];
            this.processTemplate(templateData.layout);
            // console.log(this.content)
            const pageMargins = this.commonService.oCommonParameters.pageMargins;
            if(this.bRemoveTopMargin) pageMargins[1] = 5;
            this.pdfServiceNew.getPdfData({
                styles: this.styles,
                content: this.content,
                orientation: this.commonService.oCommonParameters.orientation,
                pageSize: this.commonService.oCommonParameters.pageSize,
                pdfTitle: this.commonService.pdfTitle,
                footer: this.commonService.footer,
                pageMargins,
                defaultStyle: this.commonService.oCommonParameters.defaultStyle,
                printSettings,
                printActionSettings,
                eType: templateData.eType,
                sAction: sAction,
                sApiKey: sApiKey
            }).then((response) => {
                if (sAction == 'sentToCustomer'){
                    observer.next(response);
                }
                observer.complete();

            });
        });
    }

    processTemplate(layout: any) {
        for (const item of layout) {
            if (item.type === 'columns') {
                this.processColumns(item.row, item?.styles, item);
            } else if (item.type === 'simple') {
                this.processSimpleData(item.row, item?.object);
            } else if (item.type === 'table') {
                this.content.push(this.processTableData(item));
            } else if (item.type === 'absolute') {
                this.processAbsoluteData(item.absoluteElements);
            } else if (item.type === 'dashedLine', item.type === 'line') {
                this.content.push(this.addLine(item));
            } else if (item.type === 'textAsTables') {
                this.content.push(this.processTextAsTableData(item));
            }
        }
    }

    processTextAsTableData(item: any) {
        const rows = item.rows;
        const layout = item?.layout;
        let tableWidths: any = [];
        let texts: any = [];
        let tables: any = [];
        let nSize = 0;
        rows.forEach((row: any) => {
            if (row?.type === 'dashedLine' || row?.type === 'line') {
                this.content.push(this.addLine(row));
            } else if (row?.type === 'rect') {
                texts.push(this.addRect(row.coordinates, row?.absolutePosition));
                tableWidths.push(this.getWidth(row.size));
            } else {
                let object = row?.object;
                if (row?.ifAnd) {
                    let bTestResult = true;
                    let field, target;
                    bTestResult = row.ifAnd.every((rule: any) => {
                        field = (object) ? object[rule.field] : this.oOriginalDataSource[rule.field];
                        target = (rule?.targetMode === 'fetch') ? object[rule.target] : rule.target;
                        return (field != null) ? this.commonService.comparators[rule.compare](field, target) : false;
                    })
                    if (bTestResult) {
                        let text = this.pdfService.replaceVariables(row.html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource);
                        let obj = { text: text };
                        if (row?.styles) obj = { ...obj, ...row.styles };
                        texts.push(obj);
                        tableWidths.push(this.getWidth(row.size));
                        nSize += Number(row.size);
                        if (nSize >= 12) {
                            let data: any = {
                                table: {
                                    widths: tableWidths,
                                    body: [texts],
                                },
                                layout: (layout) ? this.getLayout(layout) : 'noBorders'
                            };
                            tables.push(data);
                            tableWidths = [];
                            nSize = 0;
                            texts = [];
                        }
                    }
                } else {

                    let text = this.pdfService.replaceVariables(row.html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource);
                    let obj = { text: text };
                    if (row?.styles) obj = { ...obj, ...row.styles };
                    texts.push(obj);
                    tableWidths.push(this.getWidth(row.size));
                    nSize += Number(row.size);
                    if (nSize >= 12) {
                        let data: any = {
                            table: {
                                widths: tableWidths,
                                body: [texts],
                            },
                            layout: (layout) ? this.getLayout(layout) : 'noBorders'
                        };
                        tables.push(data);
                        tableWidths = [];
                        nSize = 0;
                        texts = [];
                    }
                }

            }


        });
        if (tableWidths?.length) { //we have table, so push it
            let data: any = {
                table: {
                    widths: tableWidths,
                    body: [texts],
                },
                layout: (layout) ? this.getLayout(layout) : 'noBorders'
            };
            tables.push(data);
        }

        return tables;
    }

    getLayout(layout: any) {
        return (['noBorders', 'headerLineOnly', 'lightHorizontalLines'].includes(layout)) ? layout : this.commonService.layouts[layout];
    }

    processAbsoluteData(absoluteElements: any) {
        for (const el of absoluteElements) {
            if (el.type === 'text') {
                let object = el?.object;
                let text = this.pdfService.replaceVariables(el.html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource);
                this.content.push({ text: text, absolutePosition: { x: el.position.x * this.commonService.MM_TO_PT_CONVERSION_FACTOR, y: el.position.y * this.commonService.MM_TO_PT_CONVERSION_FACTOR } })
            } else if (el.type === 'image') {
                const img = this.addImage(el);
                this.content.push(img);
            } else if (el.type === 'barcode') {
                const img = this.addBarcode(el);
                this.content.push(img);
            }
        }
    }

    processTableData(element: any) {
        const rows = element.rows;
        const columns = element.columns;
        const forEach = element.forEach;
        const layout = element.layout;
        const styles = element.styles;
        let nReduceWidthByMargin = 0;
        if(styles && styles?.margin?.length) {
            nReduceWidthByMargin = styles.margin[0] + styles.margin[2];
        }

        let tableWidths: any = [];
        let tableHeadersList: any = [];
        let bWidthsPushedFromColumns = false;
        if (columns) { // parsing columns if present
            // console.log('has columns')
            columns.forEach((column: any) => {
                let bInclude: boolean = true;
                if (column?.condition) {
                    bInclude = this.checkCondition(column.condition, this.oOriginalDataSource);
                }
                if (bInclude) {
                    let text = this.pdfService.replaceVariables(column.html, this.oOriginalDataSource) || '';
                    let obj: any = { text: text };
                    if (column?.alignment) obj.alignment = column.alignment;
                    if (column?.styles) {
                        obj = { ...obj, ...column.styles };
                    }
                    tableHeadersList.push(obj);
                    const nWidth = (column.size === '*') ? this.getWidth(column.size) : this.getWidth(column.size) - nReduceWidthByMargin;
                    tableWidths.push(nWidth);
                }
            });
            bWidthsPushedFromColumns = true;
        }
        let currentDataSource = this.oOriginalDataSource;
        let texts: any = [];

        if (forEach) { //if we have forEach (nested array) then loop through it
            currentDataSource = this.oOriginalDataSource[forEach]; //take nested array as currentDataSource
            let bWidthPushed = false;
            if (currentDataSource?.length) {
                currentDataSource.forEach((dataSource: any) => {

                    let dataRow: any = [];
                    rows.forEach((row: any) => {
                        // console.log('311, row', row.size, row.size - nReduceWidthByMargin, this.getWidth(row.size - nReduceWidthByMargin), this.getWidth(row.size) - nReduceWidthByMargin);
                        if (row?.type === 'image') {
                            let img = this.addImage(row);
                            dataRow.push(img);
                            tableWidths.push(this.getWidth(row.size));
                        } else if (row?.type === 'stack') {
                            dataRow.push(this.processStack(row, dataSource));
                            if (!bWidthPushed && !bWidthsPushedFromColumns) {
                                const nWidth = (row.size === '*') ? this.getWidth(row.size) : this.getWidth(row.size) - nReduceWidthByMargin;
                                tableWidths.push(nWidth);
                            }
                        } else {
                            // console.log(330, 'else');
                            let bInclude: boolean = true;
                            if (row?.condition) {
                                bInclude = this.checkCondition(row.condition, dataSource);
                            }
                            
                            if (bInclude) {
                                // console.log('adding row', { bWidthPushed, bWidthsPushedFromColumns })
                                this.addRow(dataRow, row, dataSource, tableWidths);
                                if (!bWidthPushed && !bWidthsPushedFromColumns) {
                                    const nWidth = (row.size === '*') ? this.getWidth(row.size) : this.getWidth(row.size) - nReduceWidthByMargin;
                                    tableWidths.push(nWidth);
                                }
                            }
                        }
                    });
                    texts.push(dataRow);
                    // console.log({texts, tableWidths})
                    bWidthPushed = true;

                });
            }
        } else { //we don't have foreach so only parsing single row
            let dataRow: any = [];
            rows.forEach((row: any) => { //parsing rows
                if (row?.type === 'image') {
                    let img = this.addImage(row);
                    dataRow.push(img);
                    tableWidths.push(this.getWidth(row.size));
                } else if (row?.type === 'barcode') {
                    let img = this.addBarcode(row);
                    dataRow.push(img);
                    tableWidths.push(this.getWidth(row.size));
                } else if (row?.type === 'stack') {
                    currentDataSource = (row?.object) ? this.oOriginalDataSource[row.object] : this.oOriginalDataSource;
                    dataRow.push(this.processStack(row, currentDataSource));
                    const nWidth = (row.size === '*') ? this.getWidth(row.size) : this.getWidth(row.size) - nReduceWidthByMargin;
                    tableWidths.push(nWidth);
                } else {
                    currentDataSource = (row?.object) ? this.oOriginalDataSource[row.object] : this.oOriginalDataSource;

                    let bInclude: boolean = true;
                    if (row?.condition) {
                        bInclude = this.checkCondition(row.condition, currentDataSource);
                    }

                    if (bInclude) {
                        this.addRow(dataRow, row, currentDataSource, tableWidths);
                        const nWidth = (row.size === '*') ? this.getWidth(row.size) : this.getWidth(row.size) - nReduceWidthByMargin;
                        tableWidths.push(nWidth);
                    }
                }
            });
            texts.push(dataRow);
        }
        let finalData: any = [];
        if (tableHeadersList?.length)
            finalData = [[...tableHeadersList], ...texts];
        else
            finalData = texts;

        let data: any = {
            table: {
                widths: tableWidths,
                body: finalData,
                dontBreakRows: true,
            },
        };
        if (styles) {
            data = { ...data, ...styles };
        }

        if (layout) {
            data.layout = (['noBorders', 'headerLineOnly', 'lightHorizontalLines'].includes(layout)) ? data.layout = layout : this.commonService.layouts[layout];
        }
        return data;
    }

    processSimpleData(row: any, object?: any) {
        row.forEach((el: any) => {
            if (el?.html) {

                let html = el.html || '';

                if (el?.ifAnd) {
                    const bTestResult = el.ifAnd.every((rule: any) => {
                        let field = (object) ? object[rule.field] : this.oOriginalDataSource[rule.field];
                        return (field) ? this.commonService.comparators[rule.compare](field, rule.target) : false;
                    })
                    if (bTestResult) {
                        if (typeof html === 'string') {
                            let text = this.pdfService.replaceVariables(html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource) || html;
                            let obj: any = { text: text };
                            if (el?.alignment) obj.alignment = el.alignment;
                            if (el?.size) obj.width = this.getWidth(el.size);
                            if (el?.styles) {
                                obj = { ...obj, ...el.styles }
                            }
                            this.content.push(obj);
                        }
                    }
                } else {
                    let text = this.pdfService.replaceVariables(html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource) || html;
                    let obj: any = { text: text };
                    if (el?.alignment) obj.alignment = el.alignment;
                    if (el?.size) obj.width = this.getWidth(el.size);
                    if (el?.styles) {
                        obj = { ...obj, ...el.styles }
                    }
                    this.content.push(obj);
                }

            } else if (el?.type === 'image') {
                let img = this.addImage(el);
                this.content.push(img);
            } else if (el?.type === 'barcode') {
                let img = this.addBarcode(el);
                this.content.push(img);
            } else if(el?.qr) {
                const sQRString = this.pdfService.replaceVariables(el.qr, this.oOriginalDataSource);
                if (sQRString) this.content.push(this.addQR(sQRString, el?.options, el?.styles));
            }
        });
    }

    addQR(data: any, options?: any, styles?:any){
        // console.log('qr', {options, data})
        return {
            qr: data,
            ...options,
            ...styles
        }
    }

    processColumns(row: any, styles?: any, item?:any) {
        let columns: any = [];
        if(item?.if) {
            const bTestResult = item.if.every((rule: any) => {
                if (this.oOriginalDataSource.bForMail && rule?.field == 'bForMail' && row?.some((el: any) => el?.url == "sBusinessLogoUrl")){
                    this.bRemoveTopMargin = true;
                } 
                const field = this.oOriginalDataSource[rule.field];
                const value = rule.target;
                return (field) ? this.commonService.comparators[rule.compare](field, value) : false;
            })
            if (!bTestResult) return;
        }
        row.forEach((el: any) => {
            let columnData: any;
            if (el?.type === 'image') {
                let img = this.addImage(el);
                columnData = img;
            } else if(el?.type === 'columns') {
                columnData = this.processColumns(el.row);
            } else if (el?.type === 'barcode') {
                let img = this.addBarcode(el);
                columnData = img;
            } else if (el?.type === 'dashedLine' || el?.type === 'line') {
                columnData = this.addLine(el);
                // columns.push()
            } else if (el?.type === 'table') {
                columnData = this.processTableData(el);
                // columns.push();
            } else if (el?.type === 'textAsTables') {
                this.DIVISON_FACTOR = row.length;
                // columns.push();
                columnData = this.processTextAsTableData(el);
                this.DIVISON_FACTOR = 1;
            } else if (el?.type === 'stack') {
                if(el?.ifAnd) {
                    let bTestResult = true;
                    let field, target;
                    bTestResult = el.ifAnd.every((rule: any) => {
                        if(rule?.targetMode === 'object') {
                            field = this.oOriginalDataSource[rule.field];
                            target = rule.target == "{}" ? {} : rule.target;
                            return this.commonService.comparators[rule.compare](JSON.stringify(field), JSON.stringify(target)) 
                        } else {
                            field = (el.object) ? el.object[rule.field] : this.oOriginalDataSource[rule.field];
                            target = (rule?.targetMode === 'fetch') ? el.object[rule.target] : rule.target;
                            return (field != null) ? this.commonService.comparators[rule.compare](field, target) : false;
                        }
                    })
                    if(bTestResult) {
                        columnData = this.processStack(el, (el?.object) ? this.oOriginalDataSource[el?.object] : null);
                    }
                } else {
                    columnData = this.processStack(el, (el?.object) ? this.oOriginalDataSource[el?.object] : null);
                }
            } else if (el?.type === 'parts') {
                columnData = this.addParts(el)
            } else {
                let html = el.html || '';
                let object = el?.object;
                let text = '';
                if (el?.ifAnd) {
                    let bTestResult = true;
                    let field, target;
                    bTestResult = el.ifAnd.every((rule: any) => {
                        if (rule?.targetMode === 'object') {
                            field = this.oOriginalDataSource[rule.field];
                            target = rule.target == "{}" ? {} : rule.target;
                            return this.commonService.comparators[rule.compare](JSON.stringify(field), JSON.stringify(target))
                        } else {
                            console.log('else')
                            field = (el?.object) ? el.object[rule.field] : this.oOriginalDataSource[rule.field];
                            target = (rule?.targetMode === 'fetch') ? el.object[rule.target] : rule.target;
                            return (field != null) ? this.commonService.comparators[rule.compare](field, target) : false;
                        }
                    })
                    if (bTestResult) {
                        if (object && Object.keys(object)?.length) {
                            text = this.pdfService.replaceVariables(html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource) || '';
                        } else {
                            text = this.pdfService.replaceVariables(html, this.oOriginalDataSource) || html;
                        }
                        columnData = { text: text };
                    }
                } else {
                    if (object && Object.keys(object)?.length) {
                        text = this.pdfService.replaceVariables(html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource) || '';
                    } else {
                        text = this.pdfService.replaceVariables(html, this.oOriginalDataSource) || html;
                    }
                    columnData = { text: text };
                }
                if (columnData && el?.width) columnData.width = el?.width;
                if (columnData && el?.alignment) columnData.alignment = el?.alignment;
            }
            if(columnData) {
                if (el?.alignment) columnData.alignment = el?.alignment;
                if (el?.styles) columnData = { ...columnData, ...el.styles }
                if (el?.width) columnData.width = el?.width;
                if (el?.pageBreak) columnData.pageBreak = el?.pageBreak;
                columns.push(columnData)
            }
        });
        let obj = { columns: columns };
        if (styles) obj = { ...obj, ...styles };
        this.content.push(obj);
    }

    getBase64FromUrl(url: any): Observable<any> {
        return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.iBusinessId}?url=${url}`);
    }

    addImage(el: any) {
        if(!el?.url) return;
        let img: any = {
            image: this.oOriginalDataSource[el.url],
        };
        if (el?.margin) img.margin = el.margin;
        if (el?.fit) img.fit = el.fit;
        if (el?.alignment) img.alignment = el.alignment;
        if (el?.width) img.width = el.width;
        if (el?.absolutePosition) img.absolutePosition = { x: el.position.x * this.commonService.MM_TO_PT_CONVERSION_FACTOR, y: el.position.y * this.commonService.MM_TO_PT_CONVERSION_FACTOR };
        if (el?.styles) img = { ...img, ...el.styles };
        return img;
    }

    addBarcode(el: any) {
        if (!el?.data) return;
        let img: any = {
            image: this.generateBarcodeURI(this.oOriginalDataSource[el.data], el?.barcodeOptions),// this.logoUri,
        };
        if (el?.margin) img.margin = el.margin;
        if (el?.fit) img.fit = el.fit;
        if (el?.alignment) img.alignment = el.alignment;
        if (el?.width) img.width = el.width;
        if (el?.absolutePosition) img.absolutePosition = { x: el.position.x * this.commonService.MM_TO_PT_CONVERSION_FACTOR, y: el.position.y * this.commonService.MM_TO_PT_CONVERSION_FACTOR };
        if (el?.styles) img = { ...img, ...el.styles };
        return img;
    }

    addLine(el:any) {
        const coordinates = el?.coordinates;
        const oLine: any = {
            canvas: [
                {
                    type: 'line',
                    x1: coordinates.x1, y1: coordinates.y1, x2: coordinates.x2, y2: coordinates.y2,
                    lineWidth: el?.lineWidth || 1,
                    lineColor: el?.lineColor || '#000'
                }
            ],
            ...el?.styles
        };
        if (el?.type === 'dashedLine') {
            oLine.canvas[0]['dash'] = {
                length: el?.dashLength || 2,
                space: el?.dashSpace || 4
            };
        }
        

        if (el?.absolutePosition) {
            oLine.absolutePosition = el?.absolutePosition;
        }
        return oLine;
    }

    addRect(coordinates: any, absolutePosition?: any, config?: any) {
        let obj: any = {
            canvas: [
                {
                    type: 'rect',
                    x: coordinates.x,
                    y: coordinates.y,
                    w: coordinates.w,
                    h: coordinates.h,
                    r: coordinates.r,
                    lineWidth: config?.lineWidth || 1,
                    lineColor: config?.lineColor || '#000',
                }
            ]
        };
        if (absolutePosition) {
            obj.absolutePosition = absolutePosition;
        }
        return obj;
    }

    getWidth(size: any) {
        return ['auto', '*'].includes(size) ? size : this.commonService.calcColumnWidth(size / this.DIVISON_FACTOR);
    }

    checkCondition(aConditions: any, dataSource: any) {
        return aConditions.every((condition: any) => {
            switch (condition.operator) {
                case '>':
                    if (dataSource[condition.field])
                        return dataSource[condition.field] > condition.value;
                    else return this.oOriginalDataSource[condition.field] > condition.value;
                case '===':
                    if (condition?.value) {
                        return dataSource[condition.field] === condition.value;
                    } else {
                        return dataSource[condition.field1] === dataSource[condition.field2];
                    }
                case '==':
                    if (condition?.value) {
                        return dataSource[condition.field] == condition.value;
                    } else {
                        return dataSource[condition.field1] == dataSource[condition.field2];
                    }
                default:
                    return false;
            }
        });
    }

    addRow(dataRow: any, row: any, dataSource: any, tableWidths: any) {
        // console.log({dataRow, row, dataSource})
        if (row?.html || row?.conditionalHtml) {
            // console.log('row?.conditionalHtml', {dataRow, row, dataSource})
            let html = row.html;
            let bCheck;
            if (row?.conditionalHtml) {
                bCheck = this.checkCondition(row.conditions, dataSource);
                html = (bCheck) ? row.htmlIf : row.htmlElse
                // console.log('after check conditions', bCheck, html)
            }

            let text = '';
            if (dataSource?.oType?.eKind == 'empty-line') {
                text = (html.includes('sProductName') && dataSource?.sProductName?.length) ? dataSource?.sProductName : '\n';
            } else {
                text = this.pdfService.replaceVariables(html, dataSource) || '';
            }
            // console.log({ text }, html);
            let obj: any = { text: text };
            if (text?.indexOf('<strike>') != -1) {
                obj = this.addStrikenData(obj, text, row);
            }
            let styles = {};
            if (row?.conditionalStyles?.length) {
                // console.log('522 has conditional styles', row.conditionalStyles)
                row.conditionalStyles.forEach((condition: any) => {
                    const field = dataSource[condition.if.field];
                    // console.log({ field }, 'checking condition', condition)
                    const bApplyStyles = this.commonService.comparators[condition.if.compare](field, condition.if.target);
                    // console.log({bApplyStyles})
                    if (bApplyStyles) {
                        styles = { ...styles, ...condition.styles }
                    }
                })
            }
            // console.log(533, {styles})
            if (row?.alignment) obj.alignment = row.alignment;
            if(row?.styles && row?.styles.border) {
                obj = { ...obj, border: this.styles.border_bottom}
                delete row.styles.border;
            }
            obj = { ...obj, ...row?.styles, ...styles };
            dataRow.push(obj);
        } else if (row?.type) {
            if (row?.type === 'stack') {
                dataRow.push(this.processStack(row, dataSource));
            }
        }
    }

    processStack(item: any, object?: any) {
        // console.log('processStack', item, object);
        const stack: any = [];
        item.elements.forEach((el: any) => {
            if(el?.type) {
                stack.push(this.handleNestedTypes(el, object))
            // if (el?.type === 'image') {
            //     stack.push(this.addImage(el))
            // } else if (el?.type === 'barcode') {
            //     stack.push(this.addBarcode(el))
            // } else if (el?.type === 'parts') {
            //     // console.log('add parts with el, object', el, object)
            //     stack.push(this.addParts(el, object))
            // } else if (el?.type === 'table') {
            //     stack.push(this.processTableData(el));
            // } else if (el?.type === 'stack') {
            //     console.log('process stack', el, object)
            //     stack.push(this.processStack(el, object))
            } else {
                let bTestResult = true;
                if (el?.ifAnd) {
                    let field, target;
                    bTestResult = true;
                    bTestResult = el.ifAnd.every((rule: any) => {
                        field = (object) ? object[rule.field] : this.oOriginalDataSource[rule.field];
                        target = (rule?.targetMode === 'fetch') ? object[rule.target] : rule.target;
                        return (field != null) ? this.commonService.comparators[rule.compare](field, target) : false;
                    });
                    if (bTestResult) {
                        // console.log('replacing', el.html)
                        let text = this.pdfService.replaceVariables(el.html, (object) ? object : this.oOriginalDataSource)
                        // console.log({text})
                        let obj: any = { text: text, alignment: el?.alignment };
                        let styles = {};
                        if (el?.conditionalStyles?.length) {
                            el.conditionalStyles.forEach((condition: any) => {
                                // console.log(condition)
                                const bApplyStyles = this.commonService.comparators[condition.if.compare](text, condition.if.target);
                                // console.log({bApplyStyles})
                                if (bApplyStyles) {
                                    styles = { ...styles, ...condition.styles }
                                }
                            })
                        }

                        obj = { ...obj, ...styles, ...el?.styles };
                        // console.log({obj})
                        stack.push(obj);
                    }

                } else if (el?.ifOr) {
                    bTestResult = el.ifOr.some((rule: any) => {
                        let field = (object) ? object[rule.field] : this.oOriginalDataSource[rule.field];
                        return (field) ? this.commonService.comparators[rule.compare](field, rule.target) : false;
                    })
                    if (bTestResult) {
                        let text = this.pdfService.replaceVariables(el.html, (object) ? object : this.oOriginalDataSource)
                        stack.push({ text: text, alignment: el?.alignment });
                    }
                } else {
                    let text;
                    if(el?.object) {
                        text = this.pdfService.replaceVariables(el.html, (object) ? object[el.object] : this.oOriginalDataSource) || '';
                    } else {
                        text = this.pdfService.replaceVariables(el.html, (object) ? object : this.oOriginalDataSource) || '';
                    }
                    if (text.trim() != '') {
                        let obj: any = { text: text };
                        if (el?.alignment) obj.alignment = el.alignment;
                        if (el?.width) obj.width = el.width;
                        if (el?.styles) {
                            obj = { ...obj, ...el.styles }
                        }
                        stack.push(obj)
                    }
                }
            }
        });
        let obj:any = {
            "stack": stack
        };
        if (item?.width) obj.width = item.width;
        if (item?.alignment) obj.alignment = item.alignment;
        if (item?.styles && item?.styles.border) {
            obj = { ...obj, border: this.styles.border_bottom }
            delete item.styles.border;
        }
        return obj;
    }

    cleanUp() {
        this.oOriginalDataSource = null;
        this.content = [];
        // this.styles = {};
    }

    printThermalReceipt({ oDataSource, printSettings, apikey, title, sType, sTemplateType }: any): Observable<any> {
        return new Observable(subscriber => {
            oDataSource = JSON.parse(JSON.stringify(oDataSource));
            // console.log({oDataSource})
            if (oDataSource?.oFiskalyData?.sQRCodeData) oDataSource.sQRCodeData = oDataSource?.oFiskalyData?.sQRCodeData;
            
            if (oDataSource?.aPayments?.length) {
                // console.log(oDataSource?.aPayments);
                // oDataSource?.aPayments?.forEach((payment: any) => {
                //     payment.dCreatedDate = moment(payment.dCreatedDate).format('DD-MM-yyyy HH:mm:ss');
                // })
            }
            let thermalPrintSettings: any;
            if (printSettings?.length > 0) {
                thermalPrintSettings = printSettings.find((p: any) => p.iWorkstationId == this.iWorkstationId && p.sMethod == 'thermal' && p.sType == sType);
            }
            // console.log({ printSettings, sType, thermalPrintSettings, sTemplateType })
            if (!thermalPrintSettings?.nPrinterId || !thermalPrintSettings?.nComputerId) {
                const sText = this.translateService.instant('THERMAL_PRINT_SETTINGS_NOT_CONFIGURED_FOR') + sType
                this.toastService.show({ type: 'danger', text: sText });
                return;
            }
            // oDataSource.dCreatedDate = moment(oDataSource.dCreatedDate).format('DD-MM-yyyy HH:mm:ss');

            this.apiService.getNew('cashregistry', `/api/v1/print-template/${sTemplateType}/${this.iBusinessId}/${this.iLocationId}`).subscribe((result: any) => {
                // console.log({result})
                if (result?.data?.aTemplate?.length > 0) {
                    // console.log("transactionDetails", oDataSource);
                    oDataSource.businessDetails = {
                        ...oDataSource.businessDetails,
                        ...oDataSource.businessDetails?.oPhone,
                        ...oDataSource.businessDetails?.currentLocation?.oAddress,
                    }
                    oDataSource.oCustomer = {
                        ...oDataSource.oCustomer,
                        ...oDataSource.oCustomer?.oPhone,
                        ...oDataSource.oCustomer?.oInvoiceAddress
                    };
                    if (oDataSource.sBusinessPartnerName) oDataSource.sRepairByName = oDataSource.sBusinessPartnerName;

                    let command;
                    try {
                        const oParameters: any = {
                            nLineLength_large: result.data?.nLineLength_large,
                            nLineLength_normal: result.data?.nLineLength_normal
                        }

                        command = this.pn2escposService.generate(JSON.stringify(result.data.aTemplate), JSON.stringify(oDataSource), oParameters);
                        // console.log(command);
                        // console.log({command});
                        //  return;
                    } catch (e) {
                        this.toastService.show({ type: 'danger', text: 'Template not defined properly. Check browser console for more details' });
                        console.log(e);
                        return;
                    }

                    this.printService.createPrintJob(this.iBusinessId, command, thermalPrintSettings?.nPrinterId, thermalPrintSettings?.nComputerId, apikey, title).then((response: any) => {
                        if (response.status == "PRINTJOB_NOT_CREATED") {
                            let message = '';
                            if (response.computerStatus != 'online') {
                                message = 'Your computer status is : ' + response.computerStatus + '.';
                            } else if (response.printerStatus != 'online') {
                                message = 'Your printer status is : ' + response.printerStatus + '.';
                            }
                            this.toastService.show({ type: 'warning', title: 'PRINTJOB_NOT_CREATED', text: message });
                        } else {
                            this.toastService.show({ type: 'success', text: 'PRINTJOB_CREATED', apiUrl: '/api/v1/printnode/print-job', templateContext: { apiKey: this.businessDetails.oPrintNode.sApiKey, id: response.id } });
                        }
                        subscriber.complete();
                    })
                } else if (result?.data?.aTemplate?.length == 0) {
                    this.toastService.show({ type: 'danger', text: 'TEMPLATE_NOT_FOUND' });
                } else {
                    this.toastService.show({ type: 'danger', text: 'Error while fetching print template' });
                }
            });
        });
    }

    fetchBusinessDetails() {
        this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId)
            .subscribe(
                (result: any) => {
                    this.businessDetails = result.data;
                    this.businessDetails.currentLocation = this.businessDetails?.aLocation?.filter((location: any) => location?._id.toString() == this.iLocationId.toString())[0];
                    
                })
    }

    addStrikenData(obj: any, text: any, row: any) {
        let testResult = text.match('(<strike>(.*)</strike>)(.*)');
        // console.log({testResult});
        if (text.indexOf('<strike>') > 1) {
            // console.log('if')
            obj = [
                { text: testResult[1], alignment: row?.alignment || '' },
                {
                    columns: [
                        { text: testResult[3], decoration: 'lineThrough' },
                        { text: '', width: 1 },
                        { text: testResult[4], width: 'auto' },
                    ],
                    alignment: row?.alignment || ''
                }
            ];
        } else {
            // console.log('else')
            obj = {
                columns: [
                    { text: testResult[2], decoration: 'lineThrough' },
                    { text: '', width: 1 },
                    { text: testResult[3], width: 'auto' },
                ],
                alignment: row?.alignment || ''
            };
        }
        return obj;
    }

    addParts(el: any, object?:any) {
        // console.log('addparts', el, object);
        let oDS:any;
        if(object) {
            oDS = object;
        } else {
            if(el?.object) {
                oDS = this.oOriginalDataSource[el.object];
            } else {
                oDS = this.oOriginalDataSource;
            }
        }
        // console.log({oDS})
        let obj: any = [];
        el.parts.forEach((part: any) => {
            if (part?.ifAnd) {
                part.ifAnd.forEach((rule: any) => {
                    // console.log(rule);
                    let field = oDS[rule.field];
                    let target = (rule?.targetMode === 'fetch') ? oDS[rule.target] : rule.target;
                    let bTestResult = this.commonService.comparators[rule.compare](field, target)
                    // console.log({field, bTestResult, target})
                    if (bTestResult) {
                        let text = this.pdfService.replaceVariables(part?.text, oDS)
                        let oContent = { text: text, alignment: el?.alignment };
                        if (text?.indexOf('<strike>') != -1) {
                            oContent = this.addStrikenData(obj, text, part);
                        }
                        obj.push(oContent);
                    }
                })
            } else {
                let text = this.pdfService.replaceVariables(part?.text,oDS)
                obj.push({ text: text, alignment: el?.alignment });
            }
        })
        return obj;
    }

    openDrawer(sApiKey: any, nPrinterId: any, nComputerId: any,) {
        const drawerJob = this.pn2escposService.epOpenDrawer()
        return this.printService.openDrawer(this.iBusinessId, drawerJob, nPrinterId, nComputerId, sApiKey);
    }

    generateBarcodeURI(data: any, options: any = {}) {
        // console.log('generateBarcodeURI', data, options)
        var canvas = document.createElement("canvas");
        JsBarcode(canvas, data, { format: "CODE128", ...options });
        // console.log(canvas.toDataURL("image/png"))
        return canvas.toDataURL("image/png");
    }

    handleNestedTypes(el: any, object: any) {
        switch (el.type) {
            case 'image':
                return this.addImage(el);
            case 'barcode':
                return this.addBarcode(el);
            case 'parts':
                return this.addParts(el, object);
            case 'table':
                return this.processTableData(el);
            case 'stack':
                return this.processStack(el, object);
            case 'columns':
                return this.processColumns(el.row, el?.styles);
        }
    }
}
