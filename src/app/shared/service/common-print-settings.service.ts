import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class CommonPrintSettingsService {
    MM_TO_PT_CONVERSION_FACTOR = 2.835; //convert mm into points

    oCommonParameters: any = {
        pageSize: 'A5',
        orientation: 'portrait',
        pageMargins: [10, 0, 0, 10],
        defaultStyle: {
            fontSize: 7
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
        },
        A6: {
            pageWidth: 105,
            pageHeight: 148
        },
        custom: {
            pageWidth: 0,
            pageHeight: 0
        }
    };

    layouts: any = {
        noDefaultBorders: {
            defaultBorder: false
        },
        onlyHorizontalLineLayout: {
            hLineWidth: function (i: number, node: any) {
                // return (i === node.table.body.length ) ? 0 : 1;
                return 0.5;
            },
            vLineWidth: function (i: number, node: any) {
                return 0;
            },
        },
        horizontalLinesSlimWithTotal: {
            hLineWidth: (i: any, node: any) => {
                return (i === 1 || i === node.table.body.length - 1) ? 1 : 0;
            },
            vLineWidth: () => {
                return 0
            },
            // defaultBorder: false,
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
                        // this.pageWidth = param.nWidth;
                        // this.pageSizes[param.value].pageWidth = param.nWidth;
                        // this.pageSizes[param.value].pageHeight = param.nHeight;

                    } else {
                        this.oCommonParameters[param.sParameter] = param.value;
                        this.pageWidth = this.pageSizes[param.value].pageWidth;
                    }
                    break;
                case 'pageMargins':
                    this.oCommonParameters[param.sParameter] = param.aValues;
                    break;
                }
            });

        if (typeof this.oCommonParameters['pageSize'] == 'string' && this.oCommonParameters['pageSize'] != 'custom') {
            this.pageWidth = (this.oCommonParameters['orientation'] === 'portrait') ? 
                                this.pageSizes[this.oCommonParameters['pageSize']].pageWidth : 
                                this.pageSizes[this.oCommonParameters['pageSize']].pageHeight ;
        } else {
            this.pageWidth = this.oCommonParameters['pageSize'].width
        }
        // console.log(this.pageWidth)
        
    }

    calcColumnWidth(size: number): number {
        // console.log(this.oCommonParameters['pageSize'])
        size = (size === null || size > 12 || size === undefined) ? 12 : size;
        let totalMargin = this.oCommonParameters['pageMargins'][0] + this.oCommonParameters['pageMargins'][2];
        let num = 0;
        if (typeof this.oCommonParameters['pageSize'] == 'string' && this.oCommonParameters['pageSize'] != 'custom') {
            num = size * ((this.pageWidth * this.MM_TO_PT_CONVERSION_FACTOR - totalMargin) / 12);
            num = +(num.toFixed(2)) - 9;
        } else {
            num = size * ((this.pageWidth - totalMargin) / 12);
            num = +(num.toFixed(2)) - 12;
        }
        // console.log({ totalMargin, size, num, pageWidth: this.pageWidth })
        return num;
    }

    comparators: any = {
        "eq": (a: any, b: any) => a == b,
        "teq": (a: any, b: any) => a === b,
        "ne": (a: any, b: any) => a !== b,
        "gt": (a: any, b: any) => a > b,
        "lt": (a: any, b: any) => a < b
    };
}