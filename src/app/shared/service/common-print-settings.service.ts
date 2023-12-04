import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class CommonPrintSettingsService {
    MM_TO_PT_CONVERSION_FACTOR = 2.837; //convert mm into points

    oCommonParameters: any = {
        pageSize: 'A5',
        orientation: 'portrait',
        pageMargins: [10, 0, 0, 10],
        defaultStyle: {
            fontSize: 10
        }
    };
    pageWidth:number = 0;
    
    pdfTitle !: string;
    footer: any = {};
    pageSizes: any = { // unitis mm
        A4:{
            pageWidth:210,
            pageHeight:297
        },
        A5: {
            pageWidth: 148,
            pageHeight: 210
        }
    };

    layouts: any = {
        onlyHorizontalLineLayout: {
            hLineWidth: function (i: number, node: any) {
                // return (i === node.table.body.length ) ? 0 : 1;
                return 0.5;
            },
            vLineWidth: function (i: number, node: any) {
                return 0;
            },
        },
        onlyHorizontalLineLayoutExceptFirst: {
            hLineWidth: function (i: number, node: any) {
                return (i === 0 ) ? 0 : 0.5;
            },
            vLineWidth: function (i: number, node: any) {
                return 0;
            },
        },

        tableLayout: {
            hLineWidth: function (i: number, node: any) {
                return i === 0 || i === node.table.body.length ? 0 : 0.5;
            },
            vLineWidth: function (i: number, node: any) {
                return i === 0 || i === node.table.widths.length ? 0 : 0;
            },
            hLineColor: function (i: number, node: any) {
                return i === 0 || i === node.table.body.length ? '#999' : '#999';
            }
        }
    };

    mapCommonParams(commonParams: any) {
        commonParams.forEach((param: any) => {
            switch (param.sParameter) {
                case 'orientation':
                    this.oCommonParameters[param.sParameter] = param.value;
                    break;
                case 'fontSize':
                    this.oCommonParameters['defaultStyle'][param.sParameter] = param.value;
                    break;
                case 'pageSize':
                    if (param.value === 'custom'){
                        this.oCommonParameters[param.sParameter] = { width: param.nWidth, height: param.nHeight };
                        this.pageWidth = param.nWidth;
                    } else {
                        this.oCommonParameters[param.sParameter] = param.value;
                        // this.pageWidth = this.pageSizes[param.value].pageWidth;
                    }
                    break;
                case 'pageMargins':
                    this.oCommonParameters[param.sParameter] = param.aValues;
                    break;
                }
            });

            if (this.oCommonParameters['orientation'] === 'portrait') {
                this.pageWidth = this.pageSizes[this.oCommonParameters['pageSize']].pageWidth;
            } else {
                this.pageWidth = this.pageSizes[this.oCommonParameters['pageSize']].pageHeight;
            }
    }

    calcColumnWidth(size: number): number {
        size = (size === null || size > 12 || size === undefined) ? 12 : size;
        let totalMargin = this.oCommonParameters['pageMargins'][0] + this.oCommonParameters['pageMargins'][2];
        let num = size * ((this.pageWidth * this.MM_TO_PT_CONVERSION_FACTOR - totalMargin) / 12);
        return parseFloat(num.toFixed(2)) - 9;
    }
}