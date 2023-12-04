import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "./api.service";
import { CommonPrintSettingsService } from "./common-print-settings.service";
import { PdfService } from "./pdf2.service";

@Injectable({
    providedIn: 'root',
})
export class ActivityReceiptService {
    iBusinessId: string;
    iLocationId !: string;
    iWorkstationId !: string;

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
    onlyHorizontalLineLayout = {
        hLineWidth: function (i: number, node: any) {
            // return (i === node.table.body.length ) ? 0 : 1;
            return 0.5;
        },
        vLineWidth: function (i: number, node: any) {
            return 0;
        },
    };

    tableLayout = {
        hLineWidth: function (i: number, node: any) {
            return i === 0 || i === node.table.body.length ? 0 : 0.5;
        },
        vLineWidth: function (i: number, node: any) {
            return i === 0 || i === node.table.widths.length ? 0 : 0;
        },
        hLineColor: function (i: number, node: any) {
            return i === 0 || i === node.table.body.length ? '#999' : '#999';
        },
        // paddingLeft: function (i: number, node: any) {
        //     return i === 0 ? 0 : 20;
        // },
        // paddingRight: function (i: number, node: any) {
        //     return i === node.table.widths.length ? 20 : 0;
        // },
    };

    activity: any;
    customer: any;
    barcodeUri: any;
    businessLogoUri: any;
    
    

    constructor(
        private pdf: PdfService,
        private apiService: ApiService,
        private commonService: CommonPrintSettingsService) {
        this.iBusinessId = localStorage.getItem('currentBusiness') || '';
        this.iLocationId = localStorage.getItem('currentLocation') || '';
        // this.iWorkstationId = localStorage.getItem('currentWorkstation') || '';
    }

    async exportToPdf({ activity, customer, barcodeUri, templateData, pdfTitle }:any){
        this.activity = activity;
        this.customer = customer;
        this.barcodeUri = barcodeUri;
        this.commonService.pdfTitle = pdfTitle;
        this.commonService.mapCommonParams(templateData.aSettings);
        this.processTemplate(templateData.layout);
        
        this.content.push({
            image: this.barcodeUri,
            fit: [200, 200],
        });
        
        this.addCustomerDetails();
        this.addActivityDetails();
        const result = await this.getBase64FromUrl(this.activity.businessDetails.sLogoLight).toPromise();
        this.businessLogoUri = result.data;
        this.processFooter();

        this.pdf.getPdfData(
            this.styles,
            this.content,
            this.commonService.oCommonParameters.orientation,
            this.commonService.oCommonParameters.pageSize,
            this.commonService.pdfTitle,
            this.commonService.footer,
            this.commonService.oCommonParameters.pageMargins,
            this.commonService.oCommonParameters.defaultStyle
        );
        this.cleanUp();
    }

    processTemplate(templateData:any){

    }
    

    addCustomerDetails(){
        this.content.push(
            [this.customer.sFirstName + ' ' + this.customer.sLastName],
            [this.customer?.sEmail || ''],
            [this.customer?.oPhone?.sMobile || ''],
            '\n\n'
        )
    };

    addActivityDetails() {
        this.content.push(
            ['Product: '+this.activity.sProductName],
            ['Intake date: ' + this.activity.dCreatedDate],
            ['\n\n'],
            [this.activity.sDescription]
        )
    }

    processFooter() {
        const columns: any = [];

        let businessDetails = this.activity.businessDetails?.sName + '\n';

        if (this.activity.businessDetails?.oAddress?.street) businessDetails += this.activity.businessDetails?.oAddress?.street + '\n';
        if (this.activity.businessDetails?.oPhone?.sMobile) businessDetails += this.activity.businessDetails?.oPhone?.sMobile + '\n';
        if (this.activity.businessDetails?.sEmail) businessDetails += this.activity.businessDetails?.sEmail + '\n';
        if (this.activity.oBusiness?.oPhone?.sLandline) businessDetails += this.activity.oBusiness?.oPhone?.sLandline + '\n';

        columns.push(
            {
                image: this.businessLogoUri,
                width: 150,
            },
            { text: businessDetails, width: '40%', alignment:'right'},
        );

        this.commonService.footer.columns = columns;
        this.commonService.footer.margin = [20, 0, 0, 80];
    }
    
    getBase64FromUrl(url: any): Observable<any> {
        return this.apiService.getNew('cashregistry', `/api/v1/pdf/templates/getBase64/${this.iBusinessId}?url=${url}`);
    }


    cleanUp(){
        this.activity = null;
        this.content = [];
        this.styles = {};
    }
}