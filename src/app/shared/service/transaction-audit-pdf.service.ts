import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _moment from 'moment';
import { PdfService } from 'src/app/shared/service/pdf2.service';
import { ApiService } from './api.service';
const moment = (_moment as any).default ? (_moment as any).default : _moment;

@Injectable()
export class TransactionAuditUiPdfService {
    
    aRefundItems: any;
    aDiscountItems: any;
    aRepairItems: any;
    aGoldPurchases: any;
    aGiftItems: any;
    iBusinessId: any = '';
    iLocationId: any = '';
    iWorkstationId: any = '';
    content: any = [];
    currency: string = "€";

    styles:any = {
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
            fontSize: 15,
            bold: false,
            margin: 5, //[0, 5, 0, 10]
        },
        businessName: {
            fontSize: 12,
            margin: 5, //[0, 5, 0, 10]
        },
        normal: {
            fontSize: 10,
            margin: 5, //[0, 5, 0, 5]
        },
        tableExample: {
            // border: 0,
            fontSize: 9,
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
            fontSize: 10,
            bold: true,
            margin: [0, 5],
            alignment:'center'
        },

        td: {
            fontSize: 9,
            margin: [0, 5],
        },
        articleGroup: {
            fillColor: '#F5F8FA',
        },
        bgGray:{
            fillColor: '#F5F8FA',
        },
    };
    translations: any;

    constructor(
        private pdf: PdfService,
        private apiService: ApiService,
        private translateService: TranslateService,
        ) {
        this.iBusinessId = localStorage.getItem('currentBusiness') || '';
        this.iLocationId = localStorage.getItem('currentLocation') || '';
        this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';

        const aKeywords: any = [
            'CASH_LEFTOVER', 
            'CASH_MUTATION', 
            'CASH_IN_TILL', 
            'CASH_COUNTED',
            'TREASURY_DIFFERENCE',
            'SKIM',
            'AMOUNT_TO_LEFT_IN_CASH' ,
            'AMOUNT',
            'DYANAMIC_DATA',
            'STATIC_DATA',
            'TRANSACTION_AUDIT_REPORT',
            'LOCATION(S)',
            'DISPLAY_METHOD',
            'WORKSTATION(S)',
            'TYPE_OF_DATA',
            'COMMENT',
            'TYPE' ,
            'PAYMENT_METHODS',
            'METHOD',
            'TOTAL_AMOUNT',
            'QUANTITY',
            'TOTAL' ,
            'REFUND' ,
            'PRICE' ,
            'TAX',
            'DESCRIPTION' ,
            'DISCOUNT(S)',
            'DISCOUNT',
            'PRODUCT_NAME' ,
            'REPAIR(S)',
            'NO_RECORDS_FOUND',
            'EMPLOYEE',
            'GIFTCARD(S)',
            'PAYMENT_TYPE',
            'DATE',
            'VAT_RATE',
            'NUMBER',
            'PAYMENT_TRANSACTION_NUMBER' ,
            'GOLD_PURCHASE(S)',
            'GIFT_CARD_NUMBER',
            'VAT_TYPE',
            'PRICE_WITH_VAT',
            'PURCHASE_PRICE_EX_VAT',
            'TOTAL_OF_VAT_RATE',
            'TOTAL_OF_ALL_VAT_RATE',
            'GROSS_PROFIT',
            'VAT_AMOUNT',
            'FROM',
            'TO' ,
            'PURCHASE_PRICE',
            'PARTICULARS',
            'PRICE_INCL_VAT',
            'SUPPLIER' ,
            'ARTICLE'           ]
        this.translateService.get(aKeywords).subscribe(
            (result: any) => {aKeywords
                this.translations = result
            }
        )

    }

    selectCurrency(oLocation: any) {
        if (oLocation?.eCurrency) {
            switch (oLocation?.eCurrency) {
                case 'euro':
                    this.currency = "€";
                    break;
                case 'pound':
                    this.currency = "£";
                    break;
                case 'swiss':
                    this.currency = "₣";
                    break;
                default:
                    this.currency = "€";
                    break;
            }
        }
    }

    async exportToPDF({ 
        aSelectedLocation, 
        sOptionMenu, 
        bIsDynamicState, 
        aLocation, 
        aSelectedWorkStation, 
        aWorkStation, 
        oFilterDates, 
        oBusinessDetails, 
        sDisplayMethod,
        sDisplayMethodString,
        aStatistic,
        oStatisticsDocument,
        aPaymentMethods,
        bIsArticleGroupLevel,
        bIsSupplierMode
    }:any) {

        // console.log({ aStatistic, oStatisticsDocument, aSelectedWorkStation, aWorkStation });

        const date = moment(Date.now()).format('DD-MM-yyyy');
        const columnWidths = ['*', 60, 80, 80, 100];
        const tableLayout = {
            hLineWidth: function (i: number, node: any) {
                return i === 0 || i === node.table.body.length ? 0.5 : 0.5;
            },
            vLineWidth: function (i: number, node: any) {
                return i === 0 || i === node.table.widths.length ? 0 : 0.5;
            },
            hLineColor: function (i: number, node: any) {
                return i === 0 || i === node.table.body.length ? '#999' : '#999';
            },
        };
        let sType = sOptionMenu.parent.sValue
        let dataType = bIsDynamicState ? this.translations['DYANAMIC_DATA']: this.translations['STATIC_DATA'];

        // get selected locaions
        let sLocations = '';
        let aLocations: any = [];
        if (aSelectedLocation?.length) {
            aSelectedLocation.forEach((el: any) => {
                aLocations.push(
                    aLocation
                        .filter((location: any) => location._id == el)
                        .map((location: any) => location.sName)
                );
            });
            sLocations = aLocations.join(', ');
        } else {
            sLocations = aLocation
                .map((location: any) => location.sName)
                .join(', ');
        }

        //get selected workstations
        let sWorkstation = '';
        
        if (aSelectedWorkStation?.length) {
            // aWorkStation = [];
            sWorkstation = aWorkStation
                .filter((workstation: any) => aSelectedWorkStation.includes(workstation._id))
                .map((workstation: any) => workstation.sName)
                .join(', ');
            if (!sWorkstation){
                const temp = aWorkStation.filter((workstation: any) => workstation._id === aSelectedWorkStation);
                if(temp?.length){
                    sWorkstation = temp[0].sName;
                } else {
                    sWorkstation = aSelectedWorkStation;
                }
            }
        } else {
            sWorkstation = aWorkStation.map((workstation: any) => workstation.sName).join(', ');
        }

        let dataFromTo =
            '( ' + this.translations['FROM'] + ': ' + moment(oFilterDates.startDate).format('DD-MM-yyyy hh:mm A') + " "+  this.translations['TO']  + " " +
            moment(oFilterDates.endDate).format('DD-MM-yyyy hh:mm A') + ')';

        this.content = [
            { text: date, style: ['right', 'normal'] },
            { text: this.translations['TRANSACTION_AUDIT_REPORT'], style: ['header', 'center'] },
            { text: dataFromTo, style: ['center', 'normal'] },
            { text: oBusinessDetails.sName, style: 'businessName' },
            {
                columns: [
                    { text: this.translations['LOCATION(S)'] + ': ', style: ['left', 'normal'], width: 100 },
                    { text: sLocations, style: ['left', 'normal'], width: 150 },
                    { width: '*', text: '' },
                    { text: this.translations['DISPLAY_METHOD'] + ': ', style: ['right', 'normal'], width: 100 },
                    { text: sDisplayMethodString, style: ['right', 'normal'], width: 150 },
                ],
            },
            {
                columns: [
                    { text: this.translations['WORKSTATION(S)'] + ': ', style: ['left', 'normal'], width: 100 },
                    { text: sWorkstation, style: ['left', 'normal'], width: 200 },
                    { width: '*', text: '' },
                    { text: this.translations['TYPE_OF_DATA']+': ', style: ['right', 'normal'], width: 100 },
                    { text: dataType, style: ['right', 'normal'], width: 150 },
                ],
            },
            {
                columns: [
                    { text: this.translations['COMMENT']+ ': ', style: ['left', 'normal'], width: 100 },
                    { text: oStatisticsDocument.sComment, style: ['left', 'normal'], width: 200 },
                    { width: '*', text: '' },
                    { text: this.translations['TYPE']+ ': ', style: ['right', 'normal'], width: 100 },
                    { text: sType, style: ['right', 'normal'], width: 150 },
                ],
            },
            
        ];

        const [_aTransactionItems, _aActivityItems, _aGoldPurchases]:any = await Promise.all([
            this.fetchTransactionItems(oFilterDates,bIsArticleGroupLevel,bIsSupplierMode),
            this.fetchActivityItems(oFilterDates),
            this.fetchGoldPurchaseItems(oFilterDates)
        ]);

        const aTransactionItems = _aTransactionItems?.data[0]?.result;

        this.aRefundItems = aTransactionItems.filter(
            (item: any) => item.oType.bRefund
        );
        this.aDiscountItems = aTransactionItems.filter(
            (item: any) => item.oType.bDiscount
        );

        if (_aActivityItems?.data?.length) {
            this.aRepairItems = _aActivityItems?.data.filter((item: any) => item.oType.eKind == 'repair');
            this.aGiftItems = _aActivityItems?.data.filter((item: any) => item.oType.eKind == 'giftcard');
        }

        this.aGoldPurchases = _aGoldPurchases?.data[0]?.result.filter((item: any) => item.oType.eKind == 'gold-purchase');

        if (sDisplayMethod != "aVatRates"){
            this.processCashCountings(tableLayout, oStatisticsDocument, aStatistic);
            this.processVatRates(columnWidths, tableLayout, oStatisticsDocument?.aVatRates);
        }


        switch (sDisplayMethod.toString()) {
            case 'revenuePerBusinessPartner':
                this.processPdfByRevenuePerBusinessPartner(columnWidths,tableLayout,aStatistic);
                break;
            case 'revenuePerSupplierAndArticleGroup':
                this.processPdfByRevenuePerSupplierAndArticleGroup(columnWidths,tableLayout,aStatistic);
                break;
            case 'revenuePerArticleGroupAndProperty':
                this.processPdfByRevenuePerArticleGroupAndProperty(columnWidths,tableLayout,aStatistic);
                break;
            case 'revenuePerProperty':
                this.processPdfByRevenuePerProperty(columnWidths, tableLayout, aStatistic);
                break;
            case 'revenuePerArticleGroup':
                this.processPdfByRevenuePerArticleGroup(columnWidths,tableLayout,aStatistic);
                break;
            case 'aVatRates':
                aStatistic.forEach((oStatistic:any)=> {
                    this.processVatRates(columnWidths, tableLayout, oStatistic?.aVatRates);
                })
        }

        this.content.push({text: this.translations['PAYMENT_METHODS'] ,style: ['left', 'normal'],margin: [0, 30, 0, 10],});

        const tableHeaders = [this.translations['METHOD'], this.translations['TOTAL_AMOUNT'], this.translations['QUANTITY']];

        const tableHeadersList: Array<any> = [];
        tableHeaders.forEach((header: any) => {
            tableHeadersList.push({
                text: header,
                style: ['th', 'articleGroup'],
            });
        });

        if (aPaymentMethods?.length) {
            let texts: any = [];
            let nTotalAmount = 0, nTotalQuantity = 0;
            aPaymentMethods.forEach((paymentMethod: any) => {
                nTotalAmount += parseFloat(paymentMethod.nAmount);
                nTotalQuantity += parseFloat(paymentMethod.nQuantity);

                texts.push([
                    { text: paymentMethod.sMethod, style: ['td'] },
                    { text: paymentMethod.nAmount, style: ['td'] },
                    { text: paymentMethod.nQuantity, style: ['td'] },
                ]);
                
            });
            texts.push([
                {text: this.translations['TOTAL'], style:['td', 'bold','bgGray']},
                {text: nTotalAmount, style:['td', 'bold','bgGray']},
                {text: nTotalQuantity, style:['td', 'bold','bgGray']},
            ])
            const finalData = [[...tableHeadersList], ...texts];
            this.content.push({
                table: {
                    widths: '*',
                    body: finalData,
                    dontBreakRows: true,
                },
            });

        } else {
            this.content.push({
                table: {
                    widths: '*',
                    body: [
                        [...tableHeadersList],
                        [
                            { text: this.translations['NO_RECORDS_FOUND'], colSpan: 3, alignment: 'center', style: ['td'] },
                            {},
                            {},
                        ],
                    ],
                    dontBreakRows: true,
                }
            });
        }

        this.addRefundToPdf();
        this.addDiscountToPdf();
        this.addRepairsToPdf();
        this.addGiftcardsToPdf();
        this.addGoldPurchasesToPdf();

        this.pdf.getPdfData({
            styles: this.styles,
            content: this.content,
            orientation: 'portrait',
            pageSize: 'A4',
            pdfTitle: oBusinessDetails.sName + '-' + this.translations['TRANSACTION_AUDIT_REPORT']
        });
    }

    processCashCountings(tableLayout: any, oStatisticsDocument:any, aStatistic:any){
        const oCountings = oStatisticsDocument.oCountings;

        const tableHeadersList: any = [
            { text: this.translations['PARTICULARS'], style: ['th', 'articleGroup'] },
            { text: this.translations['AMOUNT'], style: ['th', 'articleGroup'], }
        ];

        let texts: any = [
            [
                { text: this.translations['CASH_LEFTOVER'], style: ['td'] },
                { text: this.convertToMoney(oCountings.nCashAtStart), style: ['td'] },
            ],
            [
                { text: this.translations['CASH_MUTATION'], style: ['td'] },
                { text: this.convertToMoney(0), style: ['td'] },
            ],
            [
                { text: this.translations['CASH_IN_TILL'], style: ['td'] },
                { text: this.convertToMoney((aStatistic[0]?.overall?.length) ? aStatistic[0].overall[0].nTotalRevenue : 0 + (-oCountings.nCashDifference)), style: ['td'] },
            ],
            [
                { text: this.translations['CASH_COUNTED'], style: ['td'] },
                { text: this.convertToMoney(oCountings.nCashCounted), style: ['td'] },
            ],
            [
                { text: this.translations['TREASURY_DIFFERENCE'], style: ['td'] },
                { text: this.convertToMoney(oCountings?.nCashDifference || 0) , style: ['td'] }
            ],
            [
                { text: this.translations['SKIM'], style: ['td'] },
                { text: this.convertToMoney(oCountings.nSkim), style: ['td'] },
            ],
            [
                { text: this.translations['AMOUNT_TO_LEFT_IN_CASH'], style: ['td'] },
                { text: this.convertToMoney(oCountings.nCashRemain), style: ['td'] }
            ],
        ];

        // this.pushSeparatorLine();

        this.content.push(
            {
                table: {
                    widths: '*',
                    body: [[...tableHeadersList], ...texts],
                    dontBreakRows: true,
                },
                margin:[0,20],
                layout: tableLayout,
            }
        );

    }

    processVatRates(columnWidths: any, tableLayout: any, aVatRates:any){
        const tableHeaders = [
            this.translations['VAT_TYPE'],
            this.translations['PRICE_WITH_VAT'],
            this.translations['PURCHASE_PRICE_EX_VAT'],
            this.translations['GROSS_PROFIT'],
            this.translations['VAT_AMOUNT'],
        ]
        const tableHeadersList: any = [];
        tableHeaders.forEach((header: any) => {
            tableHeadersList.push({
                text: header,
                style: ['th', 'articleGroup'],
            });
        });
        let texts: any = [];
        const aFieldsToInclude = ['oShopPurchase', 'oWebShop'];

        if (aVatRates?.length) {
            let nOverallTotalRevenue = 0, nOverallTotalPurchaseValue =0, nOverallTotalProfit=0, nOverallTotalVatAmount=0;
            aVatRates.forEach((oItem: any) => {
                let nTotalRevenue = 0, nTotalPurchaseValue =0, nTotalProfit=0, nTotalVatAmount=0;
                texts.push([{ text: this.translations['VAT_RATE'] + ((oItem?.nVat) ? oItem?.nVat : ''), colSpan: 5, style: ['articleGroup', 'center', 'td'] }, {}, {}, {}, {}]);
                aFieldsToInclude.forEach((field: any) => {
                    nTotalRevenue += oItem[field].nTotalRevenue;
                    nTotalPurchaseValue += oItem[field].nPurchaseValue;
                    nTotalProfit += oItem[field].nProfit;
                    nTotalVatAmount += oItem[field].nVatAmount;
                    texts.push([
                        { text: field, style: ['td'] },
                        { text: parseFloat(oItem[field].nTotalRevenue.toFixed(2)), style: ['td'] },
                        { text: parseFloat(oItem[field].nPurchaseValue.toFixed(2)), style: ['td'] },
                        { text: parseFloat(oItem[field].nProfit.toFixed(2)), style: ['td'] },
                        { text: parseFloat(oItem[field].nVatAmount.toFixed(2)), style: ['td'] },
                    ])
                });
                nOverallTotalRevenue += nTotalRevenue; 
                nOverallTotalPurchaseValue += nTotalPurchaseValue; 
                nOverallTotalProfit += nTotalProfit; 
                nOverallTotalVatAmount += nTotalVatAmount;

                texts.push([
                    { text: this.translations['TOTAL_OF_VAT_RATE'] + ' '+ oItem?.nVat + '%', style: ['td', 'bold'] },
                    { text: parseFloat(nTotalRevenue.toFixed(2)), style: ['td', 'bold'] },
                    { text: parseFloat(nTotalPurchaseValue.toFixed(2)), style: ['td', 'bold'] },
                    { text: parseFloat(nTotalProfit.toFixed(2)), style: ['td', 'bold'] },
                    { text: parseFloat(nTotalVatAmount.toFixed(2)), style: ['td', 'bold'] },
                ])
            });

            texts.push([
                { text: this.translations['TOTAL_OF_ALL_VAT_RATE'] , style: ['td', 'bold', 'bgGray'] },
                { text: parseFloat(nOverallTotalRevenue.toFixed(2)), style: ['td', 'bold', 'bgGray'] },
                { text: parseFloat(nOverallTotalPurchaseValue.toFixed(2)), style: ['td', 'bold', 'bgGray'] },
                { text: parseFloat(nOverallTotalProfit.toFixed(2)), style: ['td', 'bold', 'bgGray'] },
                { text: parseFloat(nOverallTotalVatAmount.toFixed(2)), style: ['td', 'bold', 'bgGray'] },
            ])


            const finalData = [[...tableHeadersList], ...texts];
            this.content.push({
                table: {
                    widths: columnWidths,
                    body: finalData,
                    dontBreakRows: true,
                },
                margin: [0, 0,0,20],
                layout: tableLayout,
            });
        } else {
            this.content.push({
                table: {
                    widths: columnWidths,
                    body: [
                        [...tableHeadersList],
                        [{ text: this.translations['NO_RECORDS_FOUND'], colSpan: 5, alignment: 'center', style: ['td'] }, {}, {}, {}, {}]
                    ],
                    dontBreakRows: true,
                },
                margin: [0, 0, 0, 20],
                layout: tableLayout,
            });
        }
        // this.pushSeparatorLine();
    }

    pushSeparatorLine() {
        this.content.push({
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }],
            margin: [0, 0, 20, 0],
            style: ['afterLine'],
        });
    }

    addRefundToPdf() {
        this.content.push({
            text: this.translations['REFUND'],
            style: ['left', 'normal'],
            margin: [0, 30, 0, 10],
        });

        const refundHeaders = [this.translations['DESCRIPTION'], this.translations['PRICE'], this.translations['TAX'], this.translations['TOTAL']];

        const tableHeadersList: any = [];
        refundHeaders.forEach((header: any) => {
            tableHeadersList.push({text: header,style: ['th', 'articleGroup']});
        });

        if (this.aRefundItems?.length) {
            let texts: any = [];
            this.aRefundItems.forEach((item: any) => {
                let itemDescription = item.nQuantity;
                if (item.sComment) {
                    itemDescription += 'x' + item.sComment;
                }
                texts.push([
                    { text: itemDescription, style: 'td' },
                    { text: item.nPriceIncVat, style: 'td' },
                    { text: item.nVatRate, style: 'td' },
                    { text: item.nTotal, style: 'td' },
                ]);
                
            });
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList], ...texts],
                    dontBreakRows: true,
                }
            });
        } else {
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList],
                        [
                            { text: this.translations['NO_RECORDS_FOUND'], colSpan: 4, alignment: 'center', style: ['td'] },
                            {},
                            {},
                            {},
                        ],
                    ],
                }
            });
        }
    }

    addDiscountToPdf() {
        this.content.push({
            text: this.translations['DISCOUNT(S)'],
            style: ['left', 'normal'],
            margin: [0, 30, 0, 10],
        });

        const aHeaders = [this.translations['PRODUCT_NAME'], this.translations['QUANTITY'], this.translations['DISCOUNT'], this.translations['PRICE'], this.translations['TAX']];

        const tableHeadersList: any = [];
        aHeaders.forEach((header: any) => {
            tableHeadersList.push({text: header,style: ['th', 'articleGroup', 'bold'],});
        });

        if (this.aDiscountItems?.length) {
            let texts: any = [];
            this.aDiscountItems.forEach((item: any) => {
                texts.push([
                    { text: item.sProductName, style: 'td' },
                    { text: item.nQuantity, style: 'td' },
                    { text: item.nDiscount, style: 'td' },
                    { text: item.nPriceIncVat, style: 'td' },
                    { text: item.nVatRate, style: 'td' },
                ]);    
            });
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList], ...texts],
                    dontBreakRows: true,
                }
            });
        } else {
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList],
                    [
                        { text: this.translations['NO_RECORDS_FOUND'], colSpan: 5, alignment: 'center', style: ['td'] },
                        {},
                        {},
                        {},
                        {},
                    ],
                    ],
                }
            });
        }
    }

    addRepairsToPdf() {
        this.content.push({
            text: this.translations['REPAIR(S)'],
            style: ['left', 'normal'],
            margin: [0, 30, 0, 10],
        });

        const aHeaders = [
            this.translations['PRODUCT_NAME'],
            this.translations['COMMENT'],
            this.translations['QUANTITY'],
            this.translations['EMPLOYEE'],
            this.translations['TOTAL'],
        ];

        const tableHeadersList: any = [];
        aHeaders.forEach((header: any) => {
            tableHeadersList.push({ text: header, style: ['th', 'articleGroup'] });
        });

        if (this.aRepairItems?.length) {
            let texts: any = [];
            this.aRepairItems.forEach((item: any) => {
                texts.push([
                    { text: item.sProductName, style: 'td' },
                    { text: item.sCommentVisibleCustomer, style: 'td' },
                    { text: item.nQuantity, style: 'td' },
                    { text: item.sEmployeeName, style: 'td' },
                    { text: item.nTotalAmount, style: 'td' },
                ]);
            });
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList], ...texts],
                    dontBreakRows: true,
                }
            });
        } else {
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList],
                    [
                        { text: this.translations['NO_RECORDS_FOUND'], colSpan: 5, alignment: 'center', style: ['td'] },
                        {},
                        {},
                        {},
                        {},
                    ],
                    ],
                }
            });
        }
    }

    addGiftcardsToPdf() {
        this.content.push({
            text: this.translations['GIFTCARD(S)'],
            style: ['left', 'normal'],
            margin: [0, 30, 0, 10],
        });
        const aHeaders = [
            this.translations['GIFT_CARD_NUMBER'],
             this.translations['COMMENT'],
             this.translations['QUANTITY'],
             this.translations['EMPLOYEE'],
             this.translations['TOTAL'],
        ];

        const tableHeadersList: any = [];
        aHeaders.forEach((header: any) => {
            tableHeadersList.push({ text: header, style: ['th', 'articleGroup'] });
        });

        if (this.aGiftItems?.length) {
            let texts: any = [];
            this.aGiftItems.forEach((item: any) => {
                texts.push([
                    { text: item.sGiftCardNumber, style: 'td' },
                    { text: item.sCommentVisibleCustomer, style: 'td' },
                    { text: item.nQuantity, style: 'td' },
                    { text: item.sEmployeeName, style: 'td' },
                    { text: item.nTotalAmount, style: 'td' },
                ]);
            });
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList], ...texts],
                    dontBreakRows: true,
                }
            });
        } else {
            this.content.push({
                table: {
                    widths: '*',
                    body: [[...tableHeadersList],
                    [
                        { text: this.translations['NO_RECORD_FOUND'], colSpan: 5, alignment: 'center', style: ['td'] },
                        {},
                        {},
                        {},
                        {},
                    ],
                    ],
                }
            });
        }
    }

    addGoldPurchasesToPdf() {
        this.content.push({
            text: this.translations['GOLD_PURCHASE(S)'],
            style: ['left', 'normal'],
            margin: [0, 30, 0, 10],
        });
        const widths = [100, 70, 50, 50, 50, '*', 80];
        const aHeaders = [
            this.translations['NUMBER'],
            this.translations['DATE'],
            this.translations['QUANTITY'],
            this.translations['PRICE'],
            this.translations['TOTAL'],
            this.translations['PAYMENT_TRANSACTION_NUMBER'],
            this.translations['PAYMENT_TYPE'],
        ];

        const tableHeadersList: any = [];
        aHeaders.forEach((header: any) => {
            tableHeadersList.push({ text: header, style: ['th', 'articleGroup'] });
        });

        const oHeaderData = {
            table: {
                widths: widths,
                body: [tableHeadersList],
            },
        };
        this.content.push(oHeaderData);
        if (this.aGoldPurchases?.length) {
            this.aGoldPurchases.forEach((item: any, index: number) => {
                const date = moment(item.dCreatedDate).format('DD-MM-yyyy');
                let fillColor = index % 2 === 0 ? '#ccc' : '#fff';
                let texts: any = [
                    { text: item.sNumber, style: 'td', fillColor: fillColor },
                    { text: date, style: 'td', fillColor: fillColor },
                    { text: item.nQuantity, style: 'td', fillColor: fillColor },
                    { text: item.nPriceIncVat, style: 'td', fillColor: fillColor },
                    { text: item.nTotalAmount, style: 'td', fillColor: fillColor },
                    { text: '', style: 'td', fillColor: fillColor },
                    { text: '', style: 'td', fillColor: fillColor },
                ];
                this.content.push({
                    table: {
                        widths: widths,
                        body: [texts],
                    },
                    layout: {
                        hLineWidth: function (i: any) {
                            return i === 0 ? 0 : 1;
                        },
                    },
                });
                item.aTransactionItems.forEach((transaction: any) => {
                    const payments = transaction.aPayments
                        .map((el: any) => el.sMethod)
                        .join(', ');
                    let texts: any = [
                        { text: '', style: 'td', fillColor: fillColor },
                        { text: '', style: 'td', fillColor: fillColor },
                        { text: '', style: 'td', fillColor: fillColor },
                        { text: '', style: 'td', fillColor: fillColor },
                        { text: '', style: 'td', fillColor: fillColor },
                        {
                            text: transaction.sTransactionNumber,
                            style: 'td',
                            fillColor: fillColor,
                        },
                        { text: payments, style: 'td', fillColor: fillColor },
                    ];
                    this.content.push({
                        table: {
                            widths: widths,
                            body: [texts],
                        },
                        layout: {
                            hLineWidth: function (i: any, node: any) {
                                return i === 0 ? 0 : 1;
                            },
                        },
                    });
                });
            });
        } else {
            this.content.push({
                table: {
                    widths: widths,
                    body: [[{ text:this.translations['NO_RECORDS_FOUND'], colSpan: 7, alignment: 'center', style: ['td'] }, {}, {}, {}, {}, {}, {},],],
                },
                layout: {
                    hLineWidth: function (i: any) {
                        return i === 0 ? 0 : 1;
                    },
                },
            });
        }
    }

    processPdfByRevenuePerBusinessPartner(columnWidths: any,tableLayout: any,aStatistic:any) {
        let arr: Array<any> = [];
        const header: Array<any> = [
           this.translations['SUPPLIER'],
           this.translations['QUANTITY'],
           this.translations['PRICE_INCL_VAT'],
           this.translations['PURCHASE_PRICE'],
           this.translations['GROSS_PROFIT']
        ];
        const headerList: Array<any> = [];
        header.forEach((singleHeader: any) => {
            headerList.push({ text: singleHeader, bold: true });
        });


        aStatistic[0].individual.forEach((el: any) => {
            var obj: any = {};
            obj['sBusinessPartnerName'] = el.sBusinessPartnerName;
            obj['nQuantity'] = el.nQuantity;
            obj['nTotalRevenue'] = el.nTotalRevenue;
            obj['nTotalPurchaseAmount'] = el.nTotalPurchaseAmount;
            obj['nProfit'] = el.nProfit;
            // obj['nMargin'] = el.nMargin;
            obj['aArticleGroups'] =
                el.aArticleGroups.map((article: any) => {
                    let data = {
                        sName: article.sName,
                        nQuantity: article.nQuantity,
                        nTotalRevenue: article.nTotalRevenue,
                        nTotalPurchaseAmount: article.nTotalPurchaseAmount,
                        nProfit: article.nProfit,
                        // nMargin: article.nMargin,
                        aRevenueByProperty: article?.aRevenueByProperty.map(
                            (property: any) => {
                                let revenue = {
                                    aCategory: property.aCategory.join(' | '),
                                    nQuantity: property.nQuantity || 0,
                                    nTotalRevenue: property.nTotalRevenue,
                                    nTotalPurchaseAmount: property.nTotalPurchaseAmount,
                                    nProfit: property.nProfit || 0,
                                    // nMargin: property.nMargin || 0,
                                };
                                return revenue;
                            }
                        ),
                    };
                    return data;
                }) || [];

            arr.push(obj);
        });
        arr.forEach((singleRecord: any) => {
            let texts: any = [
                { text: singleRecord.sBusinessPartnerName, style: 'th' },
                { text: singleRecord.nQuantity, style: 'th' },
                { text: singleRecord.nTotalRevenue, style: 'th' },
                { text: singleRecord.nTotalPurchaseAmount, style: 'th' },
                { text: singleRecord.nProfit, style: 'th' },
                // { text: singleRecord.nMargin, style: 'th' },
            ];
            const data = {
                table: {
                    headerRows: 1,
                    widths: columnWidths,
                    heights: [30],
                    body: [[...headerList],texts],
                },
                layout: tableLayout,
            };
            this.content.push(data);
            singleRecord.aArticleGroups.forEach((articleGroup: any) => {
                let texts: any = [
                    { text: articleGroup.sName, style: ['td', 'articleGroup'] },
                    { text: articleGroup.nQuantity, style: ['td', 'articleGroup'] },
                    { text: articleGroup.nTotalRevenue, style: ['td', 'articleGroup'] },
                    {
                        text: articleGroup.nTotalPurchaseAmount,
                        style: ['td', 'articleGroup'],
                    },
                    { text: articleGroup.nProfit, style: ['td', 'articleGroup'] },
                    // { text: articleGroup.nMargin, style: ['td', 'articleGroup'] },
                ];
                const data = {
                    table: {
                        headerRows: 0,
                        widths: columnWidths,
                        body: [texts],
                    },
                    layout: tableLayout,
                };
                this.content.push(data);

                articleGroup.aRevenueByProperty.forEach((property: any) => {
                    let texts: any = [
                        { text: property.aCategory, style: ['td', 'property'] },
                        { text: property.nQuantity, style: ['td', 'property'] },
                        { text: property.nTotalRevenue, style: ['td', 'property'] },
                        { text: property.nTotalPurchaseAmount, style: ['td', 'property'] },
                        { text: property.nProfit, style: ['td', 'property'] },
                        // { text: property.nMargin, style: ['td', 'property'] },
                    ];
                    const data = {
                        table: {
                            widths: columnWidths,
                            body: [texts],
                            dontBreakRows: true,
                        },
                        layout: tableLayout,
                    };
                    this.content.push(data);
                });
            });
            // this.content.push({
            //     canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }],
            //     margin: [0, 0, 20, 0],
            //     style: ['afterLine', 'separatorLine'],
            // });
        });

        let texts: any = [
            { text: 'Total', style: 'th' },
            { text: aStatistic[0].overall[0].nQuantity, style: 'th' },
            { text: aStatistic[0].overall[0].nTotalRevenue, style: 'th' },
            { text: aStatistic[0].overall[0].nTotalPurchaseAmount, style: 'th' },
            { text: Math.round(aStatistic[0].overall[0].nProfit).toFixed(2), style: 'th' },
            // { text: Math.round(aStatistic[0].overall[0].nMargin).toFixed(2), style: 'th' },
        ];

        this.pushSeparatorLine();
        this.content.push({
            style: 'headerStyle',
            table: {
                headerRows: 1,
                widths: columnWidths,
                body: [headerList],
            },
            layout: tableLayout,
        });
        this.pushSeparatorLine();
        this.content.push({
            table: {
                widths: columnWidths,
                body: [texts],
            },
            layout: tableLayout,
        });
        this.pushSeparatorLine();
    }

    processPdfByRevenuePerArticleGroupAndProperty(columnWidths: any,tableLayout: any,aStatistic:any) {
        let arr: Array<any> = [];

        aStatistic[0].individual.forEach((el: any) => {
            var obj: any = {};
            obj['sName'] = el.sName;
            obj['nQuantity'] = el.nQuantity;
            obj['nTotalRevenue'] = el.nTotalRevenue;
            obj['nTotalPurchaseAmount'] = el.nTotalPurchaseAmount;
            obj['nProfit'] = el.nProfit;
            // obj['nMargin'] = el.nMargin;
            obj['aRevenueByProperty'] =
                el.aRevenueByProperty.map((property: any) => {
                    let revenue = {
                        aCategory: property.aCategory.join(' | '),
                        nQuantity: property.nQuantity || 0,
                        nTotalRevenue: property.nTotalRevenue,
                        nTotalPurchaseAmount: property.nTotalPurchaseAmount,
                        nProfit: property.nProfit || 0,
                        // nMargin: property.nMargin || 0,
                    };
                    return revenue;
                }) || [];

            arr.push(obj);
        });
        arr.forEach((singleRecord: any) => {
            let texts: any = [
                { text: singleRecord.sName, style: ['td', 'articleGroup'] },
                { text: singleRecord.nQuantity, style: ['td', 'articleGroup'] },
                { text: singleRecord.nTotalRevenue, style: ['td', 'articleGroup'] },
                {
                    text: singleRecord.nTotalPurchaseAmount,
                    style: ['td', 'articleGroup'],
                },
                { text: singleRecord.nProfit, style: ['td', 'articleGroup'] },
                // { text: singleRecord.nMargin, style: ['td', 'articleGroup'] },
            ];
            const data = {
                table: {
                    headerRows: 1,
                    widths: columnWidths,
                    heights: [30],
                    body: [texts],
                },
                layout: tableLayout,
            };
            this.content.push(data);
            singleRecord.aRevenueByProperty.forEach((property: any) => {
                let texts: any = [
                    { text: property.aCategory, style: ['td', 'property'] },
                    { text: property.nQuantity, style: ['td', 'property'] },
                    { text: property.nTotalRevenue, style: ['td', 'property'] },
                    { text: property.nTotalPurchaseAmount, style: ['td', 'property'] },
                    { text: property.nProfit, style: ['td', 'property'] },
                    // { text: property.nMargin, style: ['td', 'property'] },
                ];
                const data = {
                    table: {
                        widths: columnWidths,
                        body: [texts],
                    },
                    layout: tableLayout,
                };
                this.content.push(data);
            });
        });
    }

    processPdfByRevenuePerSupplierAndArticleGroup(columnWidths: any,tableLayout: any,aStatistic: any) {
        let arr: Array<any> = [];

        aStatistic[0].individual.forEach((el: any) => {
            var obj: any = {};
            obj['sBusinessPartnerName'] = el.sBusinessPartnerName;
            obj['nQuantity'] = el.nQuantity;
            obj['nTotalRevenue'] = el.nTotalRevenue;
            obj['nTotalPurchaseAmount'] = el.nTotalPurchaseAmount;
            obj['nProfit'] = el.nProfit;
            // obj['nMargin'] = el.nMargin;
            obj['aArticleGroups'] =
                el.aArticleGroups.map((article: any) => {
                    let data = {
                        sName: article.sName,
                        nQuantity: article.nQuantity,
                        nTotalRevenue: article.nTotalRevenue,
                        nTotalPurchaseAmount: article.nTotalPurchaseAmount,
                        nProfit: article.nProfit,
                        // nMargin: article.nMargin,
                    };
                    return data;
                }) || [];

            arr.push(obj);
        });
        arr.forEach((singleRecord: any) => {
            let texts: any = [
                { text: singleRecord.sBusinessPartnerName, style: 'th' },
                { text: singleRecord.nQuantity, style: 'th' },
                { text: singleRecord.nTotalRevenue, style: 'th' },
                { text: singleRecord.nTotalPurchaseAmount, style: 'th' },
                { text: singleRecord.nProfit, style: 'th' },
                // { text: singleRecord.nMargin, style: 'th' },
            ];
            const data = {
                table: {
                    headerRows: 1,
                    widths: columnWidths,
                    heights: [30],
                    body: [texts],
                },
                layout: tableLayout,
            };
            this.content.push(data);
            singleRecord.aArticleGroups.forEach((articleGroup: any) => {
                let texts: any = [
                    { text: articleGroup.sName, style: ['td', 'articleGroup'] },
                    { text: articleGroup.nQuantity, style: ['td', 'articleGroup'] },
                    { text: articleGroup.nTotalRevenue, style: ['td', 'articleGroup'] },
                    {
                        text: articleGroup.nTotalPurchaseAmount,
                        style: ['td', 'articleGroup'],
                    },
                    { text: articleGroup.nProfit, style: ['td', 'articleGroup'] },
                    // { text: articleGroup.nMargin, style: ['td', 'articleGroup'] },
                ];
                const data = {
                    table: {
                        headerRows: 0,
                        widths: columnWidths,
                        body: [texts],
                    },
                    layout: tableLayout,
                };
                this.content.push(data);
            });
        });
    }

    processPdfByRevenuePerProperty(columnWidths: any,tableLayout: any,aStatistic: any) {
        let arr: Array<any> = [];

        aStatistic[0].individual.forEach((property: any) => {
            let revenue = {
                aCategory: property.aCategory.join(' | '),
                nQuantity: property.nQuantity || 0,
                nTotalRevenue: property.nTotalRevenue,
                nTotalPurchaseAmount: property.nTotalPurchaseAmount,
                nProfit: property.nProfit || 0,
                // nMargin: property.nMargin || 0,
            };

            arr.push(revenue);
        });
        arr.forEach((property: any) => {
            let texts: any = [
                {
                    text: property.aCategory.length ? property.aCategory : '-',
                    style: ['td', 'property'],
                },
                { text: property.nQuantity, style: ['td', 'property'] },
                { text: property.nTotalRevenue, style: ['td', 'property'] },
                { text: property.nTotalPurchaseAmount, style: ['td', 'property'] },
                { text: property.nProfit, style: ['td', 'property'] },
                // { text: property.nMargin, style: ['td', 'property'] },
            ];
            const data = {
                table: {
                    widths: columnWidths,
                    body: [texts],
                },
                layout: tableLayout,
            };
            this.content.push(data);
        });
    }

    processPdfByRevenuePerArticleGroup(columnWidths: any,tableLayout: any,aStatistic: any) {
        let arr: Array<any> = [];

        const tableHeaders = [
            this.translations['ARTICLE'],
            this.translations['QUANTITY'],
            this.translations['PRICE_WITH_VAT'],
            this.translations['PURCHASE_PRICE_EX_VAT'],
            this.translations['GROSS_PROFIT'],
        ];

        const tableHeadersList: any = [];
        tableHeaders.forEach((header: any, index:number) => {
            tableHeadersList.push({
                text: header,
                style: ['th', 'articleGroup'],
            });
        });
        aStatistic[0].individual.forEach((el: any) => {
            var obj: any = {};
            obj['sName'] = el.sName;
            obj['nQuantity'] = el.nQuantity;
            obj['nTotalRevenue'] = el.nTotalRevenue;
            obj['nTotalPurchaseAmount'] = el.nTotalPurchaseAmount;
            obj['nProfit'] = Math.round(el.nProfit).toFixed(2);
            // obj['nMargin'] = Math.round(el.nMargin).toFixed(2);
            
            arr.push(obj);
        });
        let texts:any = [];
        let nTotalRevenue=0, nTotalQuantity=0, nTotalPurchaseAmount=0, nTotalProfit = 0;
        arr.forEach((item: any) => {
            nTotalRevenue += item.nTotalRevenue;
            nTotalQuantity += item.nQuantity;
            nTotalPurchaseAmount += item.nTotalPurchaseAmount;
            nTotalProfit += parseFloat(item.nProfit);
            texts.push([
                { text: item.sName, style: ['td'] },
                { text: item.nQuantity, style: ['td'] },
                { text: parseFloat(item.nTotalRevenue.toFixed(2)), style: ['td'] },
                {
                    text: parseFloat(item.nTotalPurchaseAmount.toFixed(2)),
                    style: ['td'],
                },
                { text: parseFloat(item.nProfit), style: ['td'] },
            ]);
        });
        texts.push([
            { text: this.translations['TOTAL'], style: ['td', 'bold','bgGray'] },
            { text: nTotalQuantity, style:['td', 'bold','bgGray'] },
            { text: parseFloat(nTotalRevenue.toFixed(2)), style:['td', 'bold','bgGray'] },
            { text: parseFloat(nTotalPurchaseAmount.toFixed(2)), style:['td', 'bold','bgGray'] },
            { text: parseFloat(nTotalProfit.toFixed(2)), style:['td', 'bold','bgGray'] },
        ]);
        this.content.push(
            {
                table: {
                    headerRows: 1,
                    widths: columnWidths,
                    // heights: [30],
                    body: [[...tableHeadersList], ...texts],
                },
                margin: [0, 20],
                layout: tableLayout,
            });
    }

    fetchTransactionItems(oFilterDates: any, bIsArticleGroupLevel: boolean, bIsSupplierMode:boolean){
        let data = {
            iTransactionId: 'all',
            oFilterBy: {
                dStartDate: oFilterDates.startDate,
                dEndDate: oFilterDates.endDate,
                bIsArticleGroupLevel: bIsArticleGroupLevel,
                bIsSupplierMode: bIsSupplierMode
            },
            iBusinessId: this.iBusinessId,
            iLocationId: this.iLocationId,
            iWorkstationId: this.iWorkstationId,
        };

        return this.apiService.postNew('cashregistry','/api/v1/transaction/item/list',data).toPromise();
    }

    fetchActivityItems(oFilterDates: any) {
        let data = {
            startDate: oFilterDates.startDate,
            endDate: oFilterDates.endDate,
            iBusinessId: this.iBusinessId,
            selectedWorkstations: [this.iWorkstationId],
        };

        return this.apiService.postNew('cashregistry','/api/v1/activities/items',data).toPromise();
    }

    fetchGoldPurchaseItems(oFilterDates: any) {
        let data = {
            oFilterBy: {
                startDate: oFilterDates.startDate,
                endDate: oFilterDates.endDate,
            },
            iBusinessId: this.iBusinessId,
        };
        return this.apiService.postNew('cashregistry','/api/v1/activities/gold-purchases-payments/list',data).toPromise();
    }

    convertToMoney(val: any) {
        const nNum = val; 
        if (val % 1 === 0) {
            //no decimals
            return (val) ? ((val < 0) ? String('-' + this.currency + Math.abs(val) + ',00') : String(this.currency + val + ',00')) : this.currency + '0,00';
        } else {
            val = String(val);
            let parts = val.split('.');

            if (parts[1].length === 1) {
                val = (nNum < 0) ? ('-' + this.currency + Math.abs(nNum) + '0') : (this.currency + val + '0');
            }
            val = (nNum < 0) ? '-' + this.currency + Math.abs(nNum) : this.currency + nNum

            const t = val.replace('.', ',')
            return t
        }
    }
}