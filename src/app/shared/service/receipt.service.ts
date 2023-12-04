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
    };



    oOriginalDataSource: any;
    // logoUri: any;
    pageSize: any = 'A5';
    orientation: string = 'portrait';
    translations: any;

    pn2escposService: any;
    constructor(
        private pdfServiceNew: PdfServiceNew,
        private apiService: ApiService,
        private commonService: CommonPrintSettingsService,
        private pdfService: PdfService,
        private toastService: ToastService,
        private printService: PrintService,
        private translateService: TranslateService,) {

        this.iBusinessId = localStorage.getItem('currentBusiness') || '';
        this.iLocationId = localStorage.getItem('currentLocation') || '';
        this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
        this.fetchBusinessDetails();
        this.pn2escposService = new Pn2escposService(Object, this.translateService);
    }

    async exportToPdf({ oDataSource, templateData, pdfTitle, printSettings, printActionSettings, eSituation, sAction }: any) {
        this.oOriginalDataSource = oDataSource;
        this.pdfService.getTranslations();

        // console.log(this.oOriginalDataSource)

        this.commonService.pdfTitle = pdfTitle;
        this.commonService.mapCommonParams(templateData.aSettings);
        this.processTemplate(templateData.layout);
        // console.log(this.content)
        const response = await this.pdfServiceNew.getPdfData({
            styles: this.styles,
            content: this.content,
            orientation: this.commonService.oCommonParameters.orientation,
            pageSize: this.commonService.oCommonParameters.pageSize,
            pdfTitle: this.commonService.pdfTitle,
            footer: this.commonService.footer,
            pageMargins: this.commonService.oCommonParameters.pageMargins,
            defaultStyle: this.commonService.oCommonParameters.defaultStyle,
            printSettings,
            printActionSettings,
            eType: templateData.eType,
            eSituation,
            sAction: sAction
        });
        this.cleanUp();
        if (sAction == 'sentToCustomer') return response;
    }

    processTemplate(layout: any) {
        for (const item of layout) {
            if (item.type === 'columns') {
                this.processColumns(item.row, item?.styles);
            } else if (item.type === 'simple') {
                this.processSimpleData(item.row, item?.object);
            } else if (item.type === 'table') {
                this.content.push(this.processTableData(item));
            } else if (item.type === 'absolute') {
                this.processAbsoluteData(item.absoluteElements);
            } else if (item.type === 'dashedLine') {
                this.content.push(this.addDashedLine(item.coordinates, item.absolutePosition));
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
            if (row?.type === 'dashedLine') {
                this.content.push(this.addDashedLine(row.coordinates, row.absolutePosition));
            } else if (row?.type === 'rect') {
                texts.push(this.addRect(row.coordinates, row?.absolutePosition));
                tableWidths.push(this.getWidth(row.size));
            } else {
                let object = row?.object;
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
                let text = this.pdfService.replaceVariables(el.html, this.oOriginalDataSource);
                this.content.push({ text: text, absolutePosition: { x: el.position.x * this.commonService.MM_TO_PT_CONVERSION_FACTOR, y: el.position.y * this.commonService.MM_TO_PT_CONVERSION_FACTOR } })
            } else if (el.type === 'image') {
                const img = this.addImage(el);
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

        let tableWidths: any = [];
        let tableHeadersList: any = [];
        let bWidthsPushedFromColumns = false;
        if (columns) { // parsing columns if present
            columns.forEach((column: any) => {
                let bInclude: boolean = true;
                if (column?.condition) {
                    bInclude = this.checkCondition(column.condition, this.oOriginalDataSource);
                }
                if (bInclude) {
                    let text = this.pdfService.replaceVariables(column.html, this.oOriginalDataSource) || '';
                    let obj: any = { text: this.pdfService.translations[text] || text };
                    if (column?.alignment) obj.alignment = column.alignment;
                    if (column?.styles) {
                        obj = { ...obj, ...column.styles };
                    }
                    tableHeadersList.push(obj);
                    tableWidths.push(this.getWidth(column.size));
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
                        let bInclude: boolean = true;
                        if (row?.condition) {
                            bInclude = this.checkCondition(row.condition, dataSource);
                        }

                        if (bInclude) {
                            this.addRow(dataRow, row, dataSource, tableWidths);
                            if (!bWidthPushed && !bWidthsPushedFromColumns) {
                                tableWidths.push(this.getWidth(row.size));
                            }
                        }

                    });
                    texts.push(dataRow);
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
                } else {
                    currentDataSource = (row?.object) ? this.oOriginalDataSource[row.object] : this.oOriginalDataSource;

                    let bInclude: boolean = true;
                    if (row?.condition) {
                        bInclude = this.checkCondition(row.condition, currentDataSource);
                    }

                    if (bInclude) {
                        this.addRow(dataRow, row, currentDataSource, tableWidths);
                        tableWidths.push(this.getWidth(row.size));
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
            } else if (el?.type === 'image') {
                let img = this.addImage(el);
                this.content.push(img);
            }
        });
    }

    processColumns(row: any, styles?: any) {
        let columns: any = [];
        row.forEach((el: any) => {
            let columnData: any;
            if (el?.type === 'image') {
                let img = this.addImage(el);
                columnData = img;
            } else if (el?.type === 'dashedLine') {
                columnData = this.addDashedLine(el.coordinates, el?.absolutePosition);
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
                let obj: any = {
                    "stack": this.processStack(el)
                };
                if (el?.width) obj.width = el.width;
                columnData = obj;
            } else if (el?.type === 'parts') {
                columnData = this.addParts(el)
            } else {
                let html = el.html || '';
                let object = el?.object;
                let text = '';
                if (object && Object.keys(object)?.length) {
                    text = this.pdfService.replaceVariables(html, (object) ? this.oOriginalDataSource[object] : this.oOriginalDataSource) || '';
                } else {
                    text = this.pdfService.replaceVariables(html, this.oOriginalDataSource) || html;
                }
                columnData = { text: text };
                if (el?.width) columnData.width = el?.width;
                if (el?.alignment) columnData.alignment = el?.alignment;
            }
            if (el?.alignment) columnData.alignment = el?.alignment;
            if (el?.styles) columnData = { ...columnData, ...el.styles }
            if (el?.width) columnData.width = el?.width;

            columns.push(columnData)
        });
        let obj = { columns: columns };
        if (styles) obj = { ...obj, ...styles };
        this.content.push(obj);
    }

    getBase64FromUrl(url: any): Observable<any> {
        return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.iBusinessId}?url=${url}`);
    }

    addImage(el: any) {
        let img: any = {
            image: this.oOriginalDataSource[el.url],// this.logoUri,
        };
        if (el?.margin) img.margin = el.margin;
        if (el?.fit) img.fit = el.fit;
        if (el?.alignment) img.alignment = el.alignment;
        if (el?.width) img.width = el.width;
        if (el?.absolutePosition) img.absolutePosition = { x: el.position.x * this.commonService.MM_TO_PT_CONVERSION_FACTOR, y: el.position.y * this.commonService.MM_TO_PT_CONVERSION_FACTOR };
        if (el?.styles) img = { ...img, ...el.styles };
        return img;
    }

    addDashedLine(coordinates: any, absolutePosition?: any, config?: any) {
        let obj: any = {
            canvas: [
                {
                    type: 'line',
                    x1: coordinates.x1, y1: coordinates.y1, x2: coordinates.x2, y2: coordinates.y2,
                    dash: {
                        length: config?.dashLength || 2,
                        space: config?.dashSpace || 4
                    },
                    lineWidth: config?.lineWidth || 1,
                    lineColor: config?.lineColor || '#ccc'
                }
            ]
        };
        if (absolutePosition) {
            obj.absolutePosition = absolutePosition;
        }
        return obj;
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
                default:
                    return false;
            }
        });
    }

    addRow(dataRow: any, row: any, dataSource: any, tableWidths: any) {
        if (row?.html || row?.conditionalHtml) {
            let html = row.html;
            let bCheck;
            if (row?.conditionalHtml) {
                bCheck = this.checkCondition(row.conditions, dataSource);
                html = (bCheck) ? row.htmlIf : row.htmlElse
            }

            let text = this.pdfService.replaceVariables(html, dataSource) || html;
            // console.log({ text }, html, dataSource);
            let obj: any = { text: text };
            if (text?.indexOf('<strike>') != -1) {
                obj = this.addStrikenData(obj, text, row);
            }

            if (row?.alignment) obj.alignment = row.alignment;
            if (row?.styles) obj = { ...obj, ...row.styles };
            dataRow.push(obj);
        } else if (row?.type) {
            if (row?.type === 'stack') {
                let obj = {
                    "stack": this.processStack(row, dataSource)
                };
                dataRow.push(obj);
            }
        }
    }

    processStack(item: any, object?: any) {
        const stack: any = [];
        item.elements.forEach((el: any) => {
            if (el?.type === 'image') {
                stack.push(this.addImage(el))
            } else {
                let bTestResult: boolean = true;
                if (el?.ifAnd) {
                    bTestResult = el.ifAnd.every((rule: any) => {
                        let field = (object) ? object[rule.field] : this.oOriginalDataSource[rule.field];
                        return this.comparators[rule.compare](field, rule.target)
                    });
                    if (bTestResult) {
                        let text = this.pdfService.replaceVariables(el.html, (object) ? object : this.oOriginalDataSource)
                        stack.push({ text: text, alignment: el?.alignment });
                    }

                } else if (el?.ifOr) {
                    bTestResult = el.ifOr.some((rule: any) => {
                        let field = (object) ? object[rule.field] : this.oOriginalDataSource[rule.field];
                        return (field) ? this.comparators[rule.compare](field, rule.target) : false;
                    })
                    if (bTestResult) {
                        let text = this.pdfService.replaceVariables(el.html, (object) ? object : this.oOriginalDataSource)
                        stack.push({ text: text, alignment: el?.alignment });
                    }
                } else {
                    let text = this.pdfService.replaceVariables(el.html, (object) ? object : this.oOriginalDataSource) || '';
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
        return stack;
    }

    cleanUp() {
        this.oOriginalDataSource = null;
        this.content = [];
        this.styles = {};
    }

    async printThermalReceipt({ oDataSource, printSettings, sAction, apikey, title }: any) {
        let thermalPrintSettings: any;
        if (printSettings?.length > 0) {
            thermalPrintSettings = printSettings.filter((p: any) => p.iWorkstationId == this.iWorkstationId && p.sMethod == 'thermal' && p.sType == 'regular')[0];
        }
        if (!thermalPrintSettings?.nPrinterId || !thermalPrintSettings?.nComputerId) {
            this.toastService.show({ type: 'danger', text: 'Check your business -> printer settings' });
            return;
        }
        this.apiService.getNew('cashregistry', `/api/v1/print-template/business-receipt/${this.iBusinessId}/${this.iLocationId}`).subscribe((result: any) => {
            if (result?.data?.aTemplate?.length > 0) {
                let transactionDetails = { business: this.businessDetails, ...oDataSource };
                let command;
                try {
                    command = this.pn2escposService.generate(JSON.stringify(result.data.aTemplate), JSON.stringify(transactionDetails));
                } catch (e) {
                    this.toastService.show({ type: 'danger', text: 'Template not defined properly. Check browser console for more details' });
                    // console.log(e);
                    return;
                }

                this.printService.openDrawer(this.iBusinessId, command, thermalPrintSettings?.nPrinterId, thermalPrintSettings?.nComputerId, apikey, title).then((response: any) => {
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
                })
            } else if (result?.data?.aTemplate?.length == 0) {
                this.toastService.show({ type: 'danger', text: 'TEMPLATE_NOT_FOUND' });
            } else {
                this.toastService.show({ type: 'danger', text: 'Error while fetching print template' });
            }
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

    addParts(el: any) {
        let obj: any = [];
        el.parts.forEach((part: any) => {
            if (part?.ifAnd) {
                part.ifAnd.forEach((rule: any) => {
                    let field = (el?.object) ? this.oOriginalDataSource[el.object][rule.field] : this.oOriginalDataSource[rule.field];
                    let bTestResult = this.comparators[rule.compare](field, rule.target)
                    if (bTestResult) {
                        let text = this.pdfService.replaceVariables(part?.text, (el?.object) ? this.oOriginalDataSource[el.object] : this.oOriginalDataSource)
                        obj.push({ text: text, alignment: el?.alignment });
                    }
                })
            }
        })
        return obj;
    }

    comparators: any = {
        "eq": (a: any, b: any) => a === b,
        "ne": (a: any, b: any) => a !== b,
        "gt": (a: any, b: any) => a > b
    };
}
