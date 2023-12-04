import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _moment from 'moment';
import { PdfService } from '../service/pdf2.service';
import { ApiService } from './api.service';
import { TillService } from './till.service';
import { CommonPrintSettingsService } from './common-print-settings.service';
const moment = (_moment as any).default ? (_moment as any).default : _moment;

@Injectable()
export class TransactionAuditUiPdfService {
    
    aActivityItems: any;
    aTransactionItems: any;
    iBusinessId: any = localStorage.getItem('currentBusiness');
    iLocationId: any = localStorage.getItem('currentLocation');
    iWorkstationId: any = localStorage.getItem('currentWorkstation');
    content: any = [];
    currency: string = "€";
    aFieldsToInclude = ['oShopPurchase', 'oWebShop'];
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

        td_no_margin: {
            fontSize: 9,
        },
        td: {
            fontSize: 9,
            margin: [0, 5],
        },
        "margin-5": {
            margin: [0, 5],
        },
        bgGray:{
            fillColor: '#F5F8FA',
        },
        doubleHeaderLines: {
            hLineWidth: (i:any) => {
                return (i === 0 || i === 1) ? 1 : 0;
            },
            vLineWidth: () => {
                return 0
            },
            // defaultBorder: false,
        },
        horizontalLinesSlim: {
            hLineWidth: (i: any) => {
                return (i === 1) ? 1 : 0;
            },
            vLineWidth: () => {
                return 0
            },
            // defaultBorder: false,
        },
        horizontalLinesSlimWithTotal: {
            hLineWidth: (i: any, node:any) => {
                return (i === 1 || i === node.table.body.length - 1) ? 1 : 0;
            },
            vLineWidth: () => {
                return 0
            },
            // defaultBorder: false,
        },
        border_bottom:[false, false, false, true],
        border_top:[false, true, false, false],
        border_top_bottom: [false, true, false, true],
        tableLayout : {
            hLineWidth: function (i: number, node: any) {
                return i === 0 || i === node.table.body.length ? 0.5 : 0.5;
            },
            vLineWidth: function (i: number, node: any) {
                return i === 0 || i === node.table.widths.length ? 0 : 0.5;
            },
            hLineColor: function (i: number, node: any) {
                return i === 0 || i === node.table.body.length ? '#999' : '#999';
            },
        }
    };
    
    sDisplayMethod: any;
    pageMargins: any = [10, 10,10,10];
    pageSize: any = 'A4';
    oEmployee: any = {};

    aAmount: any = [
        { sLabel: '500.00', nValue: 500, nQuantity: 0, key: 'nType500' },
        { sLabel: '200.00', nValue: 200, nQuantity: 0, key: 'nType200' },
        { sLabel: '100.00', nValue: 100, nQuantity: 0, key: 'nType100' },
        { sLabel: '50.00', nValue: 50, nQuantity: 0, key: 'nType50' },
        { sLabel: '20.00', nValue: 20, nQuantity: 0, key: 'nType20' },
        { sLabel: '10.00', nValue: 10, nQuantity: 0, key: 'nType10' },
        { sLabel: '5.00', nValue: 5, nQuantity: 0, key: 'nType5' },
        { sLabel: '2.00', nValue: 2, nQuantity: 0, key: 'nType2' },
        { sLabel: '1.00', nValue: 1, nQuantity: 0, key: 'nType1' },
        { sLabel: '0.50', nValue: 0.5, nQuantity: 0, key: 'nType0_5' },
        { sLabel: '0.20', nValue: 0.2, nQuantity: 0, key: 'nType0_2' },
        { sLabel: '0.10', nValue: 0.1, nQuantity: 0, key: 'nType0_1' },
        { sLabel: '0.05', nValue: 0.05, nQuantity: 0, key: 'nType0_05' },
        { sLabel: '0.02', nValue: 0.02, nQuantity: 0, key: 'nType0_02' },
        { sLabel: '0.01', nValue: 0.01, nQuantity: 0, key: 'nType0_01' },
    ];
    sLocations: string = '';
    sWorkstation: string = '';
    bDetailedMode: boolean = false;
    aPaymentItems: any = [];
    aSelectedLocation: any;
    aStatisticsIds: any;
    oFilterData: any;

    constructor(
        private pdf: PdfService,
        private apiService: ApiService,
        private translateService: TranslateService,
        private tillService: TillService,
        private commonPrintSettingsService: CommonPrintSettingsService
        ) {}

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
        bIsDynamicState,
        aLocation,
        aSelectedWorkStation,
        aWorkStation,
        sBusinessName,
        sDisplayMethod,
        sDisplayMethodString,
        aStatistic,
        oStatisticsDocument,
        aStatisticsDocuments,
        aPaymentMethods,
        bIsArticleGroupLevel,
        bIsSupplierMode,
        aEmployee,
        aStatisticsIds,
        oFilterData
    }: any) {
        this.pageSize = this.tillService.settings.oStatisticsSettings.sPageSize;
        this.commonPrintSettingsService.oCommonParameters['pageMargins'] = this.pageMargins;
        this.commonPrintSettingsService.oCommonParameters['pageSize'] = this.pageSize;
        this.commonPrintSettingsService.pageWidth = this.commonPrintSettingsService.pageSizes[this.pageSize].pageWidth
        this.aSelectedLocation = aSelectedLocation;
        this.aStatisticsIds = aStatisticsIds;
        this.oFilterData = oFilterData;
        
        // console.log('PDF service: exportToPDF: ', {
        //     aSelectedLocation,
        //     oFilterData,
        //     bIsDynamicState,
        //     aLocation,
        //     aSelectedWorkStation,
        //     aWorkStation,
        //     sBusinessName,
        //     sDisplayMethod,
        //     sDisplayMethodString,
        //     aStatistic,
        //     oStatisticsDocument,
        //     aStatisticsDocuments,
        //     aPaymentMethods,
        //     bIsArticleGroupLevel,
        //     bIsSupplierMode,
        //     aEmployee,
        //     aStatisticsIds });

        const columnWidths = ['*', 60, 80, 80, 100];
        
        this.prepareLocationAndWorkstationNames({ aSelectedLocation, aLocation, aSelectedWorkStation, aWorkStation });

        this.prepareEmployeeList(aEmployee);

        this.addTopInfoSection({ bIsDynamicState, sBusinessName, sDisplayMethodString, sComment: oStatisticsDocument?.sComment});
        
        if (oFilterData.mode === 'detailed') this.bDetailedMode = true;
        
        if (this.bDetailedMode) {
            const [_aTransactionItems, _aActivityItems, _oPaymentItems]: any = await Promise.all([ //, 
                this.fetchTransactionItems(bIsArticleGroupLevel, bIsSupplierMode),
                this.fetchActivityItems(),
                // this.fetchGoldPurchaseItems(),
                this.fetchPaymentItems(aStatisticsDocuments)
            ]);
            if (_oPaymentItems?.data?.length && _oPaymentItems?.data[0]?.result?.length) 
                this.aPaymentItems = _oPaymentItems?.data[0]?.result;
            
            this.aTransactionItems = (_aTransactionItems?.data?.length && _aTransactionItems?.data[0]?.result?.length) ? _aTransactionItems?.data[0]?.result : [];
    
            if (_aActivityItems?.data?.length) {
                this.aActivityItems = _aActivityItems?.data;
            }
        } else if (sDisplayMethod === 'aRevenuePerTurnoverGroup') {
            const _aTransactionItems: any = await this.fetchTransactionItems(bIsArticleGroupLevel, bIsSupplierMode);
            this.aTransactionItems = (_aTransactionItems?.data?.length && _aTransactionItems?.data[0]?.result?.length) ? _aTransactionItems?.data[0]?.result : [];
        }

        if (sDisplayMethod != "aVatRates" && this.bDetailedMode) {
            if(!bIsDynamicState) this.processCashCountings(oStatisticsDocument);
            this.processVatRates(oStatisticsDocument?.aVatRates);
        } else if (!this.bDetailedMode && this.tillService.settings.oStatisticsSettings.bShowVatInCompactMode) {
            this.processVatRates(oStatisticsDocument?.aVatRates);
        }
        this.sDisplayMethod = sDisplayMethod;
        
        this.handleDisplayMethod({ sDisplayMethod, aStatistic, columnWidths });

        this.processPaymentMethods(aPaymentMethods);
        if(this.bDetailedMode) {
            if (this.tillService.settings.oStatisticsSettings.bIncludeRefunds) this.addRefundToPdf();
            if (this.tillService.settings.oStatisticsSettings.bIncludeDiscounts) this.addDiscountToPdf();
            if (this.tillService.settings.oStatisticsSettings.bIncludeRepairs) this.addRepairsToPdf();
            if (this.tillService.settings.oStatisticsSettings.bIncludeGiftcards) this.addGiftcardsToPdf();
            if (this.tillService.settings.oStatisticsSettings.bIncludeGoldpurchase) this.addGoldPurchasesToPdf();
        }
        
        this.pdf.getPdfData({
            styles: this.styles,
            content: this.content,
            orientation: 'portrait',
            pageSize: this.pageSize,
            pdfTitle: sBusinessName + '-' + this.translateService.instant('TRANSACTION_AUDIT_REPORT'),
            defaultStyle:{
                fontSize: 5
            },
            pageMargins: this.pageMargins,
            addPageBreakBefore: true
        });
    }

    handleDisplayMethod({ sDisplayMethod, aStatistic, columnWidths }:any){
        switch (sDisplayMethod.toString()) {
            case 'revenuePerBusinessPartner':
                this.processPdfByRevenuePerBusinessPartner(columnWidths, aStatistic);
                break;
            case 'revenuePerSupplierAndArticleGroup':
                this.processPdfByRevenuePerSupplierAndArticleGroup(columnWidths, aStatistic);
                break;
            case 'revenuePerArticleGroupAndProperty':
                this.processPdfByRevenuePerArticleGroupAndProperty(columnWidths, aStatistic);
                break;
            case 'revenuePerProperty':
                this.processPdfByRevenuePerProperty(columnWidths, aStatistic);
                break;
            case 'revenuePerArticleGroup':
                if (this.tillService.settings?.bShowDayStatesBasedOnTurnover) {
                    this.processRevenuePerTurnoverGroupCompact(aStatistic);
                } else {
                    this.processPdfByRevenuePerArticleGroup(columnWidths, aStatistic);
                }
                break;
            case 'aVatRates':
                aStatistic.forEach((oStatistic: any) => {
                    this.processVatRates(oStatistic?.aVatRates);
                });
                break;
            case 'aRevenuePerTurnoverGroup':
                if (this.bDetailedMode) {
                    this.processRevenuePerTurnoverGroup(aStatistic);
                } else {
                    this.processRevenuePerTurnoverGroupCompact(aStatistic);
                }
                break;
        }
    }

    prepareLocationAndWorkstationNames({ aSelectedLocation, aLocation, aSelectedWorkStation, aWorkStation }:any) {
        // get selected locaions
        let aLocations: any = [];
        if (aSelectedLocation?.length) {
            aSelectedLocation.forEach((el: any) => {
                aLocations.push(aLocation.filter((location: any) => location._id == el).map((location: any) => location.sName));
            });
            this.sLocations = aLocations.join(', ');
        } else {
            this.sLocations = aLocation.map((location: any) => location.sName).join(', ');
        }

        //get selected workstations
        if (this.tillService.settings.sDayClosureMethod === 'workstation') {
            if (aSelectedWorkStation?.length) {
                // aWorkStation = [];
                this.sWorkstation = aWorkStation
                    .filter((workstation: any) => aSelectedWorkStation.includes(workstation._id))
                    .map((workstation: any) => workstation.sName)
                    .join(', ');
                if (!this.sWorkstation) {
                    const temp = aWorkStation.filter((workstation: any) => workstation._id === aSelectedWorkStation);
                    if (temp?.length) {
                        this.sWorkstation = temp[0].sName;
                    } else {
                        this.sWorkstation = aSelectedWorkStation;
                    }
                }
            } else {
                this.sWorkstation = aWorkStation.map((workstation: any) => workstation.sName).join(', ');
            }
        } else {
            this.sWorkstation = aWorkStation.map((workstation: any) => workstation.sName).join(', ');
        }
    }

    addTopInfoSection({ bIsDynamicState, sBusinessName, sDisplayMethodString, sComment }:any){
        
        const dataType = bIsDynamicState ? this.translateService.instant('DYANAMIC_DATA') : this.translateService.instant('STATIC_DATA');
        const dataFromTo =
            '( ' + this.translateService.instant('FROM') + ': ' + moment(this.oFilterData.oFilterDates.startDate).format('DD-MM-yyyy hh:mm A') + " " + this.translateService.instant('TO') + " " +
            moment(this.oFilterData.oFilterDates.endDate).format('DD-MM-yyyy hh:mm A') + ')';

        this.content = [
            { text: moment(Date.now()).format('DD-MM-yyyy'), style: ['right', 'normal'] },
            { text: this.translateService.instant('TRANSACTION_AUDIT_REPORT'), style: ['header', 'center'] },
            { text: dataFromTo, style: ['center', 'normal'] },
            { text: sBusinessName, style: 'businessName' },
            {
                columns: [
                    { text: this.translateService.instant('LOCATION(S)') + ': ', style: ['left', 'normal'], width: '15%' },
                    { text: this.sLocations, style: ['left', 'normal'], width: '35%' },
                    { width: '*', text: '' },
                    { text: this.translateService.instant('DISPLAY_METHOD') + ': ', style: ['right', 'normal'], width: '15%' },
                    { text: sDisplayMethodString, style: ['right', 'normal'], width: '35%' },
                ],
            },
            {
                columns: [
                    { text: this.translateService.instant('WORKSTATION(S)') + ': ', style: ['left', 'normal'], width: '15%' },
                    { text: this.sWorkstation, style: ['left', 'normal'], width: '35%' },
                    { width: '*', text: '' },
                    { text: this.translateService.instant('TYPE_OF_DATA') + ': ', style: ['right', 'normal'], width: '15%' },
                    { text: dataType, style: ['right', 'normal'], width: '35%' },
                ],
            },
            {
                columns: [
                    { text: this.translateService.instant('COMMENT') + ': ', style: ['left', 'normal'], width: '15%' },
                    { text: sComment, style: ['left', 'normal'], width: '35%' },
                    { width: '*', text: '' },
                    { text: this.translateService.instant('TYPE') + ': ', style: ['right', 'normal'], width: '15%' },
                    { text: this.oFilterData.sType, style: ['right', 'normal'], width: '35%' },
                ],
            },

        ];
    }

    addTableHeading(text:string){
        this.content.push({ text: this.translateService.instant(text), style: ['normal'], margin: [0, 30, 0, 10], });
    }
    
    processPaymentMethods(aPaymentMethods: any) {
        // console.log({ aPaymentItems })
        this.addTableHeading('PAYMENT_METHODS');

        const aHeaders = [
            { key: 'METHOD', weight:6  },
            { key: 'TOTAL_AMOUNT', weight:3 },
            { key: 'QUANTITY', weight:3 },
        ];
        const aWidths = [...aHeaders.map((el: any) => this.commonPrintSettingsService.calcColumnWidth(el.weight))];
        const oSafe = aPaymentMethods.find((el:any) => el.sMethod === 'cash_in_safe');
        if(oSafe) {
            const oCash = aPaymentMethods.find((el:any) => el.sMethod === 'cash');
            oCash.nOriginalAmount = oCash.nAmount + oSafe.nAmount;
        }

        const aHeaderList: any = [];
        aHeaders.forEach((el: any, index:number) => {
            const obj: any = {
                text: (el?.key) ? this.translateService.instant(el.key) : '',
                style: ['th', 'bgGray'],
                border: this.styles.border_top_bottom
            };
            if(index == 0) obj.style.push('left')
            aHeaderList.push(obj)
        })


        const aTexts:any = [aHeaderList];
        if (aPaymentMethods?.length) {
            // console.log({ aPaymentMethods })
            let nTotalAmount = 0, nTotalQuantity = 0;
            aPaymentMethods.forEach((oPayment: any) => {
                nTotalAmount += +oPayment.nAmount;
                nTotalQuantity += +oPayment.nQuantity;
                let sMethod = oPayment.sMethod;
                if(oPayment?.nOriginalAmount) sMethod += ' ('+this.translateService.instant('ORIGINAL_AMOUNT') + ': ' + oPayment.nOriginalAmount.toFixed(2) + ')';
                aTexts.push([
                    { text: this.translateService.instant(sMethod), style: ['td', 'margin-5', 'bgGray'] },
                    { text: oPayment.nAmount.toFixed(2), style: ['td', 'margin-5', 'center', 'bgGray'] },
                    { text: oPayment.nQuantity, style: ['td', 'margin-5', 'center', 'bgGray'] },
                ]);
                const aItems = this.aPaymentItems.filter((el:any) => el.iPaymentMethodId === oPayment.iPaymentMethodId)
                aItems.forEach((oItem:any) => {
                    aTexts.push([
                        { text: this.translateService.instant(oItem.sComment), style: ['td'], margin: [20,5] },
                        { text: oItem.nAmount.toFixed(2), style: ['td', 'margin-5', 'center'] },
                        { text: '', style: ['td', 'margin-5'] },
                    ]);
                })
            });
            aTexts.push([
                { text: this.translateService.instant('TOTAL'), style: ['td', 'bold', 'bgGray', 'center'], border: this.styles.border_top },
                { text: nTotalAmount.toFixed(2), style: ['td', 'bold', 'bgGray', 'center'], border: this.styles.border_top },
                { text: nTotalQuantity, style: ['td', 'bold', 'bgGray', 'center'], border: this.styles.border_top },
            ])


        } else {
            aTexts.push([
                { text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 3, style: ['td', 'center'] },
                {},
                {}
            ]);
        }
        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim, aWidths);
    }

    

    processCashCountings(oStatisticsDocument:any){
        const oCountings = oStatisticsDocument?.oCountings;

        const tableHeadersList: any = [
            { text: this.translateService.instant('PARTICULARS'), style: ['th', 'bgGray'] },
            { text: this.translateService.instant('AMOUNT'), style: ['th', 'bgGray'], }
        ];

        let texts: any = [
            [
                { text: this.translateService.instant('CASH_LEFTOVER'), style: ['td'] },
                { text: this.convertToMoney(oCountings?.nCashAtStart), style: ['td'] },
            ],
            [
                { text: this.translateService.instant('CASH_MUTATION'), style: ['td'] },
                { text: this.convertToMoney(0), style: ['td'] },
            ],
            [
                { text: this.translateService.instant('CASH_IN_TILL'), style: ['td'] },
                { text: this.convertToMoney(oCountings?.nCashInTill || 0), style: ['td'] },
            ],
            [
                { text: this.translateService.instant('CASH_COUNTED'), style: ['td'] },
                { text: this.convertToMoney(oCountings?.nCashCounted), style: ['td'] },
            ],
            [
                { text: this.translateService.instant('TREASURY_DIFFERENCE'), style: ['td'] },
                { text: this.convertToMoney(oCountings?.nCashDifference || 0) , style: ['td'] }
            ],
            [
                { text: this.translateService.instant('SKIM'), style: ['td'] },
                { text: this.convertToMoney(oCountings?.nSkim), style: ['td'] },
            ],
            [
                { text: this.translateService.instant('AMOUNT_TO_LEFT_IN_CASH'), style: ['td'] },
                { text: this.convertToMoney(oCountings?.nCashRemain), style: ['td'] }
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
                layout: this.styles.tableLayout,
            }
        );

    }

    
    processRevenuePerTurnoverGroup(aStatistic: any) {
        
        this.addTableHeading('REVENUE_PER_TURNOVER_GROUP');
        
        const aHeaders = [
            { key: 'RECEIPT_NO', weight: 1 },
            { key: 'ARTICLE_NUMBER', weight: 1 },
            { key: 'QUANTITY', weight: 1 },
            { key: 'DESCRIPTION', weight: 1, colSpan: 2 },//
            { key: '', weight: 1 },
            { key: 'PRODUCT_NUMBER', weight: 1 },
            { key: 'PRICE', weight: 1 },
            { key: 'DISCOUNT', weight: 1 },
            { key: 'REVENUE', weight: 1 },
            { key: 'VAT', weight: 1 },
            { key: 'EMPLOYEE', weight: 1 },
            { key: 'DATE', weight: 1 },
        ]; 

        
        const aWidths = [...aHeaders.map((el:any) => this.commonPrintSettingsService.calcColumnWidth(el.weight))];

        const aHeaderList: any = [];
        aHeaders.forEach((el:any) => {
            const obj:any =  { 
                text: (el?.key) ? this.translateService.instant(el.key) : '', 
                style: ['td'], 
                border: this.styles.border_top_bottom 
            };
            if(el?.colSpan) obj.colSpan = el?.colSpan;
            aHeaderList.push(obj) 
        })
        const aTexts = [aHeaderList];
        
        const aDummy = [...aHeaderList];
        aTexts.push([...aDummy.fill(' ')]);
        let nTotalDiscount = 0, nTotalRevenue = 0, nTotalVat = 0;
        aStatistic.forEach((oStatistic: any) => {
            // console.log({oStatistic})
            oStatistic.individual.forEach((oSupplier: any) => {
                let sCategory = oSupplier.sCategory;
                if(sCategory && sCategory != ""){
                    sCategory = this.translateService.instant(sCategory);
                }
                // console.log({ oSupplier })
                let nSubTotalDiscount = 0, nSubTotalRevenue = 0, nSubTotalVat = 0, nSubTotalQuantity = 0;
                const aArticleGroupsToSkip:any = [];
                const aTransactionItems = this.aTransactionItems.filter((oItem: any) => {
                    if(oItem.oType.eKind === 'expenses' && (oItem.sComment == 'TRANSFERRED_FROM_CASH' || oItem.sComment == 'TRANSFER_TO_CASH_SAFE')) {
                        aArticleGroupsToSkip.push(oItem.iArticleGroupOriginalId);
                    } else return oItem;
                })
                let nAddedCount = 0;
                // console.log({aArticleGroupsToSkip});
                oSupplier.aArticleGroups.filter((el: any) => !aArticleGroupsToSkip.includes(el._id)).forEach((oArticleGroup: any) => {
                    // console.log('adding',{oArticleGroup})
                    
                    const aItems = aTransactionItems.filter((item:any) => item.iArticleGroupOriginalId === oArticleGroup._id)
                    if(aItems?.length) {
                        nAddedCount++;
                        aTexts.push([
                            { text: '', style: ['td', 'bold'], headlineLevel: 1 },
                            { text: this.translateService.instant('TURNOVER_GROUP') + ': ' + sCategory, style: ['td', 'bold'], colSpan: 2, border: this.styles.border_bottom }, //+ ': group number'
                            { text: '', style: ['td', 'bold'], border: this.styles.border_bottom },
                            { text: oArticleGroup.sName, style: ['td'], border: this.styles.border_bottom },
                            { text: this.translateService.instant('TRANSACTIONS'), style: ['td', 'bold'], border: this.styles.border_bottom }, //colSpan: 2,
                            { text: '', style: ['td', 'bold'] },
                            { text: '', style: ['td', 'bold'] },
                            { text: '', style: ['td', 'bold'] },
                            { text: '', style: ['td', 'bold'] },
                            { text: '', style: ['td', 'bold'] },
                            { text: '', style: ['td', 'bold'] },
                            { text: '', style: ['td', 'bold'] }
                        ]);
                        aItems.forEach((oItem: any) => {
                            const nVat = +((oItem.nRevenueAmount - (oItem.nRevenueAmount / (1 + oItem.nVatRate / 100))).toFixed(2));
                            let nDiscount = 0;
                            if(oItem.nDiscount) nDiscount = +(((oItem.bDiscountOnPercentage) ? (oItem.nPriceIncVat * oItem.nQuantity * oItem.nDiscount / 100) : oItem.nDiscount).toFixed(2))
                            nSubTotalDiscount += nDiscount;
                            nSubTotalRevenue += +(oItem.nRevenueAmount.toFixed(2));
                            nSubTotalVat += +(nVat.toFixed(2));
                            nSubTotalQuantity += oArticleGroup.nQuantity;
    
                            nTotalDiscount += nDiscount;
                            nTotalRevenue += oItem.nRevenueAmount;
                            nTotalVat += nVat;
                            
                            aTexts.push([
                                { text: oItem?.sReceiptNumber, style: ['td', 'property'] },
                                { text: oItem?.sArticleNumber || '', style: ['td', 'property'] },
                                { text: oItem.nQuantity, style: ['td', 'property'] },
                                { text: oItem.sProductName + '\n' + oItem?.sDescription, style: ['td', 'property'], colSpan: 2 },
                                { },
                                { text: oItem?.sProductNumber || '', style: ['td', 'property'] }, //'product number'
                                { text: oItem?.nPriceIncVat, style: ['td', 'property'] },
                                { text: nDiscount, style: ['td', 'property'] },
                                { text: (oItem?.nRevenueAmount * oItem.nQuantity).toFixed(2), style: ['td', 'property'] },
                                { text: nVat, style: ['td', 'property'] },
                                { text: this.oEmployee[oItem.iEmployeeId], style: ['td', 'property'] },
                                { text: moment(oItem.dCreatedDate).format('hh:mm'), style: ['td', 'property'] },
                            ]);
                        });
                    }
                    // console.log({ aItems })
                });
                if (nAddedCount) {
                    // console.log('adding subtotal row')
                    aTexts.push([
                        { text: '', style: ['td', 'bold'] },
                        { text: this.translateService.instant('SUBTOTAL'), style: ['td'], colSpan: 2, border: this.styles.border_top },
                        { text: '', style: ['td'], border: this.styles.border_top },
                        { text: '', style: ['td'], border: this.styles.border_top },
                        { text: nSubTotalQuantity, style: ['td', 'bold'], border: this.styles.border_top },
                        { text: '', style: ['td', 'bold'] },
                        { text: '', style: ['td', 'bold'] },
                        { text: nSubTotalDiscount.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top },
                        { text: nSubTotalRevenue.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top },
                        { text: nSubTotalVat.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top },
                        { text: '', style: ['td', 'bold'] },
                        { text: '', style: ['td', 'bold'] }
                    ])
                    aTexts.push([...aDummy.fill(' ')]);
                }
            });
        });

        aTexts.push([
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], colSpan: 2, border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: nTotalDiscount.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top_bottom },
            { text: nTotalRevenue.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top_bottom },
            { text: nTotalVat.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
            { text: '', style: ['td'], border: this.styles.border_top_bottom },
        ]);

        const data = {
            table: {
                headerRows: 1,
                widths: aWidths,
                body: aTexts,
                dontBreakRows: true,
                keepWithHeaderRows: true
            },
            layout: {
                defaultBorder: false
            },
            
        };
        // console.log(data, aTexts)
        this.content.push(data);
    }

    processRevenuePerTurnoverGroupCompact(aStatistic: any) {

        this.addTableHeading('REVENUE_PER_TURNOVER_GROUP_COMPACT');

        const aHeaders = [
            { key: 'TURNOVER_GROUP', weight: 4 },
            { key: 'QUANTITY', weight: 2 },
            { key: 'DISCOUNT', weight: 2 },
            { key: 'AMOUNT', weight: 2 },
            { key: 'VAT', weight: 2 },
        ];


        const aWidths = [...aHeaders.map((el: any) => this.commonPrintSettingsService.calcColumnWidth(el.weight))];

        const aHeaderList: any = [];
        aHeaders.forEach((el: any) => {
            const obj: any = {
                text: (el?.key) ? this.translateService.instant(el.key) : '',
                style: ['td'],
                border: this.styles.border_top_bottom
            };
            if (el?.colSpan) obj.colSpan = el?.colSpan;
            aHeaderList.push(obj)
        })
        const aTexts = [aHeaderList];

        const aDummy = [...aHeaderList];
        aTexts.push([...aDummy.fill(' ')]);
        let nTotalDiscount = 0, nTotalRevenue = 0, nTotalVat = 0, nTotalQuantity = 0;
        aStatistic.forEach((oStatistic: any) => {
            // console.log({oStatistic})
            oStatistic.individual.forEach((oSupplier: any) => {
                // console.log({ oSupplier })
                let nTurnOverGroupDiscount = 0, nTurnOverGroupRevenue = 0, nTurnOverGroupVat = 0, nTurnOverGroupQuantity = 0;
                oSupplier.aArticleGroups.forEach((oArticleGroup: any) => {
                    // console.log({ oArticleGroup }, nTurnOverGroupRevenue)
                    nTurnOverGroupQuantity += oArticleGroup.nQuantity;
                    nTurnOverGroupRevenue += oArticleGroup.nTotalRevenue;
                    nTotalRevenue += oArticleGroup.nTotalRevenue;
                    const aItems = this.aTransactionItems.filter((item: any) => item.iArticleGroupId === oArticleGroup._id)
                    // console.log({ aItems }, nTurnOverGroupRevenue)
                    aItems.forEach((oItem: any) => {
                        const nVat = +((oItem.nRevenueAmount - (oItem.nRevenueAmount / (1 + oItem.nVatRate / 100))).toFixed(2));
                        if (oItem.nDiscount) nTurnOverGroupDiscount += +(((oItem.bDiscountOnPercentage) ? (oItem.nPriceIncVat * oItem.nQuantity * oItem.nDiscount / 100) : oItem.nDiscount).toFixed(2))

                        nTurnOverGroupVat += nVat;
                        nTotalDiscount += nTurnOverGroupDiscount;
                        nTotalVat += nVat;
                        nTotalQuantity += oArticleGroup.nQuantity;
                    });
                });
                aTexts.push([
                    { text: oSupplier.sCategory, style: ['td'] },
                    { text: nTurnOverGroupQuantity, style: ['td'] },
                    { text: nTurnOverGroupDiscount.toFixed(2), style: ['td'] },
                    { text: nTurnOverGroupRevenue.toFixed(2), style: ['td'] },
                    { text: nTurnOverGroupVat.toFixed(2), style: ['td'] },
                ]);
            });
        });

        aTexts.push([
            { text: '', style: ['td'], border: this.styles.border_top_bottom }, //colSpan: 2,
            { text: nTotalQuantity, style: ['td', 'bold'], border: this.styles.border_top_bottom },
            { text: nTotalDiscount.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top_bottom },
            { text: nTotalRevenue.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top_bottom },
            { text: nTotalVat.toFixed(2), style: ['td', 'bold'], border: this.styles.border_top_bottom },
        ]);

        const data = {
            table: {
                headerRows: 1,
                widths: aWidths,
                body: aTexts,
                dontBreakRows: true,
                keepWithHeaderRows: true
            },
            layout: {
                defaultBorder: false
            },

        };
        // console.log(data)
        this.content.push(data);
    }

    processVatRates(aVatRates: any) {
        const aHeaders = [
            { key: 'VAT_TYPE', weight: 4 },
            { key: 'PRICE_WITH_VAT', weight: 2 },
            { key: 'PURCHASE_PRICE_EX_VAT', weight: 2 },
            { key: 'GROSS_PROFIT', weight: 2 },
            { key: 'VAT_AMOUNT', weight: 2 },
        ]

        const aWidths = [...aHeaders.map((el: any) => this.commonPrintSettingsService.calcColumnWidth(el.weight))];

        const aHeaderList: any = [];
        aHeaders.forEach((el: any) => {
            const obj: any = {
                text: (el?.key) ? this.translateService.instant(el.key) : '',
                style: ['th'],
                border: this.styles.border_top_bottom
            };
            if (el?.colSpan) obj.colSpan = el?.colSpan;
            aHeaderList.push(obj)
        })
        const aTexts = [aHeaderList];

        if (aVatRates?.length) {
            let nOverallTotalRevenue = 0, nOverallTotalPurchaseValue = 0, nOverallTotalProfit = 0, nOverallTotalVatAmount = 0;
            aVatRates.forEach((oItem: any) => {
                let nTotalRevenue = 0, nTotalPurchaseValue = 0, nTotalProfit = 0, nTotalVatAmount = 0;
                aTexts.push([{ text: this.translateService.instant('VAT_RATE') + ((oItem?.nVat) ? oItem?.nVat : ''), colSpan: 5, style: ['bgGray', 'center', 'td'] }, {}, {}, {}, {}]);
                this.aFieldsToInclude.forEach((field: any) => {
                    nTotalRevenue += oItem[field].nTotalRevenue;
                    nTotalPurchaseValue += oItem[field].nPurchaseValue;
                    nTotalProfit += oItem[field].nProfit;
                    nTotalVatAmount += oItem[field].nVatAmount;
                    aTexts.push([
                        { text: field, style: ['td'] },
                        { text: oItem[field].nTotalRevenue.toFixed(2), style: ['td', 'center'] },
                        { text: oItem[field].nPurchaseValue.toFixed(2), style: ['td', 'center'] },
                        { text: oItem[field].nProfit.toFixed(2), style: ['td', 'center'] },
                        { text: oItem[field].nVatAmount.toFixed(2), style: ['td', 'center'] },
                    ])
                });
                nOverallTotalRevenue += nTotalRevenue;
                nOverallTotalPurchaseValue += nTotalPurchaseValue;
                nOverallTotalProfit += nTotalProfit;
                nOverallTotalVatAmount += nTotalVatAmount;

                aTexts.push([
                    { text: this.translateService.instant('TOTAL_OF_VAT_RATE') + ' ' + oItem?.nVat + '%', style: ['td', 'bold'] },
                    { text: nTotalRevenue.toFixed(2), style: ['td', 'center', 'bold'] },
                    { text: nTotalPurchaseValue.toFixed(2), style: ['td', 'center', 'bold'] },
                    { text: nTotalProfit.toFixed(2), style: ['td', 'center', 'bold'] },
                    { text: nTotalVatAmount.toFixed(2), style: ['td', 'center', 'bold'] },
                ])
            });

            aTexts.push([
                { text: this.translateService.instant('TOTAL_OF_ALL_VAT_RATE'), style: ['td', 'bold', 'bgGray'], border: this.styles.border_top },
                { text: nOverallTotalRevenue.toFixed(2), style: ['td', 'center', 'bold', 'bgGray'], border: this.styles.border_top },
                { text: nOverallTotalPurchaseValue.toFixed(2), style: ['td', 'center', 'bold', 'bgGray'], border: this.styles.border_top },
                { text: nOverallTotalProfit.toFixed(2), style: ['td', 'center', 'bold', 'bgGray'], border: this.styles.border_top },
                { text: nOverallTotalVatAmount.toFixed(2), style: ['td', 'center', 'bold', 'bgGray'], border: this.styles.border_top },
            ])
        } else {
            aTexts.push([{ text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 5, style: ['td', 'center'] }, {}, {}, {}, {}]);
        }

        const data = {
            table: {
                headerRows: 1,
                widths: aWidths,
                body: aTexts,
                dontBreakRows: true,
                keepWithHeaderRows: true
            },
            layout: this.styles.horizontalLinesSlimWithTotal
        };
        this.content.push(data);
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
        this.addTableHeading('REFUND');

        const aHeaderList = [
            { text: this.translateService.instant('DESCRIPTION'), style: ['th', 'bgGray'] },
            { text: this.translateService.instant('PRICE'), style: ['th', 'bgGray'] },
            { text: this.translateService.instant('TAX'), style: ['th', 'bgGray'] },
            { text: this.translateService.instant('TOTAL'), style: ['th', 'bgGray'] }
        ];
        const aTexts: any = [aHeaderList];

        const aItems = this.aTransactionItems.filter((el: any) => el.oType.bRefund);
        if (aItems?.length) {
            aItems.forEach((item: any) => {
                let itemDescription = item.nQuantity;
                if (item.sComment) {
                    itemDescription += 'x' + item.sComment;
                }
                aTexts.push([
                    { text: itemDescription, style: ['td', 'center'] },
                    { text: item.nPriceIncVat, style: ['td', 'center'] },
                    { text: item.nVatRate, style: ['td', 'center'] },
                    { text: item.nTotal, style: ['td', 'center'] },
                ]);

            });
        } else {
            aTexts.push([
                { text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 4, style: ['td', 'center'] }, 
                {}, 
                {}, 
                {}, 
            ]);
        }
        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim);
    }

    addDiscountToPdf() {
        this.addTableHeading('DISCOUNT(S)');

        const aHeaderList = [
            { text: this.translateService.instant('PRODUCT_NAME'),style: ['th', 'bgGray']}, 
            { text: this.translateService.instant('QUANTITY'),style: ['th', 'bgGray']}, 
            { text: this.translateService.instant('DISCOUNT'),style: ['th', 'bgGray']}, 
            { text: this.translateService.instant('PRICE'),style: ['th', 'bgGray']}, 
            { text: this.translateService.instant('TAX'),style: ['th', 'bgGray']},
        ];

        const aTexts: any = [aHeaderList];

        const aItems = this.aTransactionItems.filter((el: any) => el.oType.bDiscount);
        if (aItems?.length) {
            aItems.forEach((item: any) => {
                aTexts.push([
                    { text: item.sProductName, style: 'td' },
                    { text: item.nQuantity, style: ['td', 'center'] },
                    { text: item.nDiscount, style: ['td', 'center'] },
                    { text: item.nPriceIncVat, style: ['td', 'center'] },
                    { text: item.nVatRate, style: ['td', 'center'] },
                ]);    
            });
            
        } else {

            aTexts.push([
                { text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 5 , style: ['td', 'center'] }, 
                {}, 
                {}, 
                {}, 
                {}
            ]);
        }

        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim);
    }

    addRepairsToPdf() {
        this.addTableHeading('REPAIR(S)');
        const aHeaders = ['PRODUCT_NAME', 'COMMENT', 'QUANTITY', 'EMPLOYEE', 'TOTAL']
        const aHeaderList: any = [];
        aHeaders.forEach((el: any) => aHeaderList.push({ text: this.translateService.instant(el), style: ['th', 'bgGray'] }))
        const aTexts: any = [aHeaderList];
        const aItems = this.aActivityItems?.filter((el: any) => el.oType.eKind == 'repair');
        if (aItems?.length) {
            aItems.forEach((item: any) => {
                aTexts.push([
                    { text: item.sProductName, style: 'td' },
                    { text: item.sCommentVisibleCustomer, style: ['td', 'center'] },
                    { text: item.nQuantity, style: ['td', 'center'] },
                    { text: item.sEmployeeName, style: ['td', 'center'] },
                    { text: item.nTotalAmount, style: ['td', 'center'] },
                ]);
            });
            
        } else {
            aTexts.push([
                { text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 5, style: ['td', 'center'] },
                {},
                {},
                {},
                {},
            ],
            );
        }

        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim);
    }

    addGiftcardsToPdf() {
        this.addTableHeading('GIFTCARD(S)');
        const aHeaders = ['GIFT_CARD_NUMBER','COMMENT','QUANTITY','EMPLOYEE','TOTAL'];
        const aHeaderList: any = [];
        aHeaders.forEach((el: any) => aHeaderList.push({ text: this.translateService.instant(el), style: ['th', 'bgGray'] }))
        const aTexts: any = [aHeaderList];
        const aItems = this.aActivityItems?.filter((el: any) => el.oType.eKind == 'giftcard');
        if (aItems?.length) {
            aItems.forEach((item: any) => {
                aTexts.push([
                    { text: item.sGiftCardNumber, style: ['td', 'center'] },
                    { text: item.sCommentVisibleCustomer, style: ['td', 'center'] },
                    { text: item.nQuantity, style: ['td', 'center'] },
                    { text: item.sEmployeeName, style: ['td', 'center'] },
                    { text: item.nTotalAmount, style: ['td', 'center'] },
                ]);
            });
        } else {
            aTexts.push([
                { text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 5, style: ['td', 'center'] },
                {},
                {},
                {},
                {},
            ]);
        }

        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim);
    }

    addGoldPurchasesToPdf() {
        this.addTableHeading('GOLD_PURCHASE(S)');
        const widths = [100, 70, 50, 50, 50, '*', 80];
        const aHeaders = ['NUMBER', 'DATE', 'QUANTITY', 'PRICE', 'TOTAL', 'PAYMENT_TRANSACTION_NUMBER', 'PAYMENT_TYPE'];
        const aHeaderList: any = [];
        aHeaders.forEach((el: any) => aHeaderList.push({ text: this.translateService.instant(el), style: ['th', 'bgGray'] }))
        const aTexts: any = [aHeaderList];
        const aItems = this.aTransactionItems.filter((el:any) => el.oType.eKind == 'gold-purchase');
        if (aItems?.length) {
            aItems.forEach((item: any, index: number) => {
                let fillColor = index % 2 === 0 ? '#ccc' : '#fff';
                const payments = item.aPayments.map((el: any) => el.sMethod).join(', ');
                const oActivityItem = this.aActivityItems.find((el:any) => el.iTransactionItemId === item._id)
                aTexts.push([
                    { text: oActivityItem?.sNumber || '', style: ['td', 'center'], fillColor: fillColor },
                    { text: moment(item.dCreatedDate).format('DD-MM-yyyy'), style: ['td', 'center'], fillColor: fillColor },
                    { text: item.nQuantity, style: ['td', 'center'], fillColor: fillColor },
                    { text: item.nPriceIncVat, style: ['td', 'center'], fillColor: fillColor },
                    { text: item.nTotalAmount, style: ['td', 'center'], fillColor: fillColor },
                    { text: item.sTransactionNumber, style: ['td', 'center'], fillColor: fillColor },
                    { text: payments, style: ['td', 'center'], fillColor: fillColor },
                ]);
            });
        } else {
            aTexts.push([
                { text: this.translateService.instant('NO_RECORDS_FOUND'), colSpan: 7, alignment: 'center', style: ['td'] },
                {},
                {},
                {},
                {},
                {},
                {}
            ]);
        }

        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim, widths);
    }

    processPdfByRevenuePerBusinessPartner(columnWidths: any,aStatistic:any) {
        this.addTableHeading('REVENUE_PER_BUSINESS_PARTNER');

        const aHeader = ['SUPPLIER', 'QUANTITY','PRICE_WITH_VAT','PURCHASE_PRICE','GROSS_PROFIT'];
        const aHeaderList: any = [];
        aHeader.forEach((el: any) => aHeaderList.push({ text: this.translateService.instant(el), style: ['th'] }));

        const aTexts = [aHeaderList];
        
        aStatistic[0].individual.forEach((oBusinessPartner: any) => {
            aTexts.push([
                { text: oBusinessPartner.sBusinessPartnerName, style: 'th' },
                { text: oBusinessPartner.nQuantity, style: 'th' },
                { text: oBusinessPartner.nTotalRevenue.toFixed(2), style: 'th' },
                { text: oBusinessPartner.nTotalPurchaseAmount.toFixed(2), style: 'th' },
                { text: oBusinessPartner.nProfit.toFixed(2), style: 'th' },
            ]);
            
            oBusinessPartner.aArticleGroups.forEach((oArticleGroup: any) => {
                aTexts.push([
                    { text: oArticleGroup.sName, style: ['td', 'bgGray'] },
                    { text: oArticleGroup.nQuantity, style: ['td', 'bgGray', 'center'] },
                    { text: oArticleGroup.nTotalRevenue.toFixed(2), style: ['td', 'bgGray', 'center'] },
                    { text: oArticleGroup.nTotalPurchaseAmount.toFixed(2), style: ['td', 'bgGray', 'center'] },
                    { text: oArticleGroup.nProfit.toFixed(2), style: ['td', 'bgGray', 'center'] },
                ]);

                oArticleGroup.aRevenueByProperty.forEach((oProperty: any) => {
                    aTexts.push([
                        { text: oProperty.aCategory.join(' | '), style: ['td', 'property'] },
                        { text: oProperty.nQuantity, style: ['td', 'property', 'center'] },
                        { text: oProperty.nTotalRevenue.toFixed(2), style: ['td', 'property', 'center'] },
                        { text: oProperty.nTotalPurchaseAmount.toFixed(2), style: ['td', 'property', 'center'] },
                        { text: oProperty.nProfit.toFixed(2), style: ['td', 'property', 'center'] },
                    ]);
                });
            });
        });

        aTexts.push([
            { text: this.translateService.instant('TOTAL'), style: 'th' },
            { text: aStatistic[0].overall[0].nQuantity, style: 'th' },
            { text: aStatistic[0].overall[0].nTotalRevenue.toFixed(2), style: 'th' },
            { text: aStatistic[0].overall[0].nTotalPurchaseAmount.toFixed(2), style: 'th' },
            { text: Math.round(aStatistic[0].overall[0].nProfit).toFixed(2), style: 'th' },
        ]);

        this.addTableToContent(aTexts, this.styles.horizontalLinesSlimWithTotal, columnWidths);
    }

    processPdfByRevenuePerArticleGroupAndProperty(columnWidths: any,aStatistic:any) {
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
                { text: singleRecord.sName, style: ['td', 'bgGray'] },
                { text: singleRecord.nQuantity, style: ['td', 'bgGray'] },
                { text: singleRecord.nTotalRevenue, style: ['td', 'bgGray'] },
                {
                    text: singleRecord.nTotalPurchaseAmount,
                    style: ['td', 'bgGray'],
                },
                { text: singleRecord.nProfit, style: ['td', 'bgGray'] },
                // { text: singleRecord.nMargin, style: ['td', 'bgGray'] },
            ];
            const data = {
                table: {
                    headerRows: 1,
                    widths: columnWidths,
                    heights: [30],
                    body: [texts],
                },
                layout: this.styles.tableLayout,
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
                    layout: this.styles.tableLayout,
                };
                this.content.push(data);
            });
        });
    }

    processPdfByRevenuePerSupplierAndArticleGroup(columnWidths: any,aStatistic: any) {
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
                layout: this.styles.tableLayout,
            };
            this.content.push(data);
            singleRecord.aArticleGroups.forEach((articleGroup: any) => {
                let texts: any = [
                    { text: articleGroup.sName, style: ['td', 'bgGray'] },
                    { text: articleGroup.nQuantity, style: ['td', 'bgGray'] },
                    { text: articleGroup.nTotalRevenue, style: ['td', 'bgGray'] },
                    {
                        text: articleGroup.nTotalPurchaseAmount,
                        style: ['td', 'bgGray'],
                    },
                    { text: articleGroup.nProfit, style: ['td', 'bgGray'] },
                    // { text: articleGroup.nMargin, style: ['td', 'bgGray'] },
                ];
                const data = {
                    table: {
                        headerRows: 0,
                        widths: columnWidths,
                        body: [texts],
                    },
                    layout: this.styles.tableLayout,
                };
                this.content.push(data);
            });
        });
    }

    processPdfByRevenuePerProperty(columnWidths: any,aStatistic: any) {
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
                layout: this.styles.tableLayout,
            };
            this.content.push(data);
        });
    }

    processPdfByRevenuePerArticleGroup(columnWidths: any,aStatistic: any) {
        this.addTableHeading('REVENUE_PER_ARTICLE_GROUP');

        let arr: Array<any> = [];
        const aHeaders = ['ARTICLE', 'QUANTITY', 'PRICE_WITH_VAT', 'PURCHASE_PRICE_EX_VAT', 'GROSS_PROFIT']
        const aHeaderList: any = [];
        aHeaders.forEach((el: any) => aHeaderList.push({ text: this.translateService.instant(el), style: ['th', 'bgGray'] }))
        const aTexts: any = [aHeaderList];

        let nTotalRevenue=0, nTotalQuantity=0, nTotalPurchaseAmount=0, nTotalProfit = 0;
        aStatistic[0].individual.forEach((item: any) => {
            nTotalRevenue += item.nTotalRevenue;
            nTotalQuantity += item.nQuantity;
            nTotalPurchaseAmount += item.nTotalPurchaseAmount;
            nTotalProfit += parseFloat(item.nProfit);
            aTexts.push([
                { text: item.sName, style: ['td'] },
                { text: item.nQuantity, style: ['td', 'center'] },
                { text: item.nTotalRevenue.toFixed(2), style: ['td', 'center'] },
                { text: item.nTotalPurchaseAmount.toFixed(2),style: ['td', 'center']},
                { text: item.nProfit.toFixed(2), style: ['td', 'center'] },
            ]);
        });
        aTexts.push([
            { text: this.translateService.instant('TOTAL'), style: ['td', 'bold','bgGray'] },
            { text: nTotalQuantity, style: ['td', 'center', 'bold','bgGray'] },
            { text: parseFloat(nTotalRevenue.toFixed(2)), style: ['td', 'center', 'bold','bgGray'] },
            { text: parseFloat(nTotalPurchaseAmount.toFixed(2)), style: ['td', 'center', 'bold','bgGray'] },
            { text: parseFloat(nTotalProfit.toFixed(2)), style: ['td', 'center', 'bold','bgGray'] },
        ]);
        
        this.addTableToContent(aTexts, this.styles.horizontalLinesSlim, columnWidths);
    }

    fetchTransactionItems(bIsArticleGroupLevel: boolean, bIsSupplierMode: boolean){
        let data:any = {
            iTransactionId: 'all',
            sFrom:'audit',
            oFilterBy: {
                dStartDate: this.oFilterData.oFilterDates.startDate,
                dEndDate: this.oFilterData.oFilterDates.endDate,
                bIsArticleGroupLevel: bIsArticleGroupLevel,
                bIsSupplierMode: bIsSupplierMode,
                iLocationId: this.aSelectedLocation
            },
            iBusinessId: this.iBusinessId,
            iWorkstationId: this.iWorkstationId,
        };
        if (this.oFilterData.sTransactionType === 'SALES') data.sTransactionType = 'cash-registry';
        if (this.aStatisticsIds?.length) data.oFilterBy.aStatisticsIds = this.aStatisticsIds;
        

        return this.apiService.postNew('cashregistry','/api/v1/transaction/item/list',data).toPromise();
    }

    fetchActivityItems() {
        let data = {
            startDate: this.oFilterData.oFilterDates.startDate,
            endDate: this.oFilterData.oFilterDates.endDate,
            iBusinessId: this.iBusinessId,
            selectedWorkstations: [this.iWorkstationId],
        };

        return this.apiService.postNew('cashregistry','/api/v1/activities/items',data).toPromise();
    }

    fetchGoldPurchaseItems() {
        let data = {
            oFilterBy: {
                startDate: this.oFilterData.oFilterDates.startDate,
                endDate: this.oFilterData.oFilterDates.endDate,
            },
            iBusinessId: this.iBusinessId,
        };
        return this.apiService.postNew('cashregistry','/api/v1/activities/gold-purchases-payments/list',data).toPromise();
    }

    convertToMoney(val: any) {
        const nNum = +(val.toFixed(2)); 
        if (val % 1 === 0) {
            //no decimals
            return (val) ? ((val < 0) ? String('-' + this.currency + Math.abs(val) + ',00') : String(this.currency + val + ',00')) : this.currency + '0,00';
        } else {
            val = val.toFixed(2);
            let parts = val.split('.');
            if (parts[1].length === 1) {
                val = (nNum < 0) ? ('-' + this.currency + Math.abs(nNum) + '0') : (this.currency + val + '0');
            }
            val = (nNum < 0) ? '-' + this.currency + Math.abs(nNum) : this.currency + nNum

            const t = val.replace('.', ',')
            return t
        }
    }

    summingUpCounting(oData: any) {
        try {
            const { oCountings, oProcessCountings } = oData;
            oProcessCountings.nCashAtStart += (oCountings?.nCashAtStart || 0);
            oProcessCountings.nCashCounted += (oCountings?.nCashCounted || 0);
            oProcessCountings.nSkim += (oCountings?.nSkim || 0);
            oProcessCountings.nCashRemain += (oCountings?.nCashRemain || 0);
            oProcessCountings.nCashDifference += (oCountings?.nCashDifference || 0);
            oProcessCountings.nCashInTill += (oCountings?.nCashInTill || 0);
            return oProcessCountings;
        } catch (error) {
            console.log('Error: ', error);
            return oData?.oProcessCountings?.length ? oData?.oProcessCountings : [];
        }
    }

    summingUpVatRate(oData: any) {
        try {
            const { aVatRates, aProcessVatRates } = oData;
            if (aVatRates?.length) {
                aVatRates.forEach((oItem: any) => {
                    const oFoundVat = aProcessVatRates.find((oProcessVat: any) => oProcessVat.nVat == oItem?.nVat);
                    if (!oFoundVat) {
                        aProcessVatRates.push(oItem);
                        return;
                    }
                    this.aFieldsToInclude.forEach((field: any) => {
                        oFoundVat[field].nTotalRevenue += (oItem[field].nTotalRevenue || 0);
                        oFoundVat[field].nPurchaseValue += (oItem[field].nPurchaseValue || 0);
                        oFoundVat[field].nProfit += (oItem[field].nProfit || 0);
                        oFoundVat[field].nVatAmount += (oItem[field].nVatAmount || 0);
                    });
                })
            }

            return aProcessVatRates;
        } catch (error) {
            return oData?.aProcessVatRates?.length ? oData?.aProcessVatRates : [];
        }
    }

    processingMultipleStatisticsBySummingUp(oBody: any) {
        try {
            const { aStatisticsDocuments } = oBody;
            if (!aStatisticsDocuments?.length) return {};
            if (aStatisticsDocuments?.length === 1) return aStatisticsDocuments[0];
            const oProcessedStatisticData = {
                aPaymentMethods: [],
                aVatRates: [],
                oCountings: {
                    nCashAtStart: 0,
                    nCashCounted: 0,
                    nSkim: 0,
                    nCashRemain: 0,
                    nCashDifference: 0,
                    nCashInTill: 0
                }
            }
            for (const oStatisticsDocument of aStatisticsDocuments) {
                oProcessedStatisticData.oCountings = this.summingUpCounting({ oCountings: oStatisticsDocument.oCountings, oProcessCountings: oProcessedStatisticData?.oCountings });
                oProcessedStatisticData.aVatRates = this.summingUpVatRate({ aVatRates: oStatisticsDocument.aVatRates, aProcessVatRates: oProcessedStatisticData?.aVatRates });
            }
            return oProcessedStatisticData;
        } catch (error) {
            console.log('Error in processingMultipleStatisticsInOne: ', error);
            return oBody?.aStatisticsDocuments?.length ? oBody?.aStatisticsDocuments[0] : {};
        }
    }

    prepareEmployeeList(aEmployee:any){
        // console.log('prepareEmployeeList', aEmployee);
        aEmployee.forEach((e:any) => this.oEmployee[e._id] = (String((e.sFirstName[0] || '') + (e.sLastName[0] || ''))).toUpperCase())
        // console.log(this.oEmployee);

    }

    async fetchPaymentItems(aStatisticsDocuments:any) {
        // console.log({aStatisticsDocuments}, this.aStatisticsIds);
        let aOpenDates:any = [], aCloseDates:any = [];

        if(this.oFilterData.sFrom == 'sales-list') {
            aOpenDates = [new Date(this.oFilterData.oFilterDates.startDate)]
            aCloseDates = [new Date(this.oFilterData.oFilterDates.endDate)]
        } else {
            aOpenDates = [...aStatisticsDocuments?.map((el: any) => new Date(el.dOpenDate))];
            aCloseDates = [...aStatisticsDocuments?.map((el: any) => new Date(el.dCloseDate))];
        }
        // console.log({ aOpenDates, aCloseDates })
        const dStartDate = new Date(Math.min(...aOpenDates));
        const dEndDate = new Date(Math.max(...aCloseDates));
        const oBody: any = {
            iBusinessId: this.iBusinessId,
            iWorkstationId: this.iWorkstationId,
            iLocationId: this.iLocationId,
            oFilterBy: {
                dStartDate,
                dEndDate
            }
        }

        if (this.aStatisticsIds?.length){
            oBody.oFilterBy.aStatisticsIds = this.aStatisticsIds;
            delete oBody.oFilterBy.dStartDate;
            delete oBody.oFilterBy.dEndDate;
        } 

        return this.apiService.postNew('cashregistry', '/api/v1/payments/list', oBody).toPromise()
        
    }

    addTableToContent(aTexts: any, layout: any, widths: any = '*') {
        const data = {
            table: {
                headerRows: 1,
                widths: widths,
                body: aTexts,
                dontBreakRows: true,
                keepWithHeaderRows: true
            },
            layout: layout
        };
        this.content.push(data);
    }
}
