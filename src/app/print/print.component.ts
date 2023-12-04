import {Component, OnInit} from '@angular/core';
import {PdfService} from "../shared/service/pdf.service";
import {JsonEditorOptions} from "ang-jsoneditor";
import { ApiService } from '../shared/service/api.service';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss']
})
export class PrintComponent implements OnInit {
  dataString: any
  templateString: any
  editorOptions: JsonEditorOptions = new JsonEditorOptions()
  pdfGenerating: boolean = false

  computerId: number | undefined;
  printerId: number | undefined;
  transactionId: string = '5c2f276e86a7527e67a45e9d'
  business: any = {};
  location: any = {};
  workstation: any = {};
  translationsResults: any = [];
  translationsKey: Array<string> = ['CREATED_BY', 'ART_NUMBER', 'QUANTITY', 'DESCRIPTION', 'DISCOUNT', 'AMOUNT', 'SAVINGS_POINTS'];

  constructor(
    private pdfService: PdfService,
    private apiService: ApiService,
    private translateService: TranslateService) {
    this.editorOptions.mode = 'view'
  }


  ngOnInit() {
    this.business._id = '6182a52f1949ab0a59ff4e7b'
    this.location._id = localStorage.getItem('currentLocation')
    this.workstation._id = '623b6d840ed1002890334456'
    this.getPrintSetting();

    this.translateService.get(this.translationsKey).subscribe((result) => {
      this.translationsResults = result;
    });

    const translationsObj = {
      "__CREATED_BY": this.translationsResults.CREATED_BY,
      "__ART_NUMBER": this.translationsResults.ART_NUMBER,
      "__QUANTITY": this.translationsResults.QUANTITY,
      "__DESCRIPTION": this.translationsResults.DESCRIPTION,
      "__DISCOUNT": this.translationsResults.DISCOUNT,
      "__AMOUNT": this.translationsResults.AMOUNT,
      "__SAVINGS_POINTS": this.translationsResults.SAVINGS_POINTS
    };

    const dataString = {
      "_id": "62a1f98405adcc35b88ed713",
      "aTransactionItemType": [
        "regular"
      ],
      "eStatus": "y",
      "bImported": false,
      "bInvoiced": false,
      "iBusinessId": "6182a52f1949ab0a59ff4e7b",
      "iLocationId": "623b6d840ed1002890334456",
      "iBusinessPartnerId": null,
      "iDeviceId": "623b6d840ed1002890334456",
      "eType": "cash-register-revenue",
      "sNumber": "T0279-090622-1545",
      "oCustomer": {
        "oPhone": {
          "bWhatsApp": true,
          "sCountryCode": "+91",
          "sMobile": "9970149807",
          "sLandLine": "9970149807",
          "sFax": ""
        },
        "oInvoiceAddress": {
          "sStreet": "middlewerg",
          "sHouseNumber": "9a",
          "sPostalCode": "442001",
          "sCity": "Asperen"
        },
        "oPoints": {
          "spendable": 0,
          "history": []
        },
        "oIdentity": {
          "documentName": "Passport",
          "documentNumber": "324788353"
        },
        "bIsEmailVerified": false,
        "bCounter": false,
        "sEmail": "Jolmerekeren02@gmail.com",
        "bNewsletter": true,
        "_id": "62420be55777d556346a9484",
        "iBusinessId": "6182a52f1949ab0a59ff4e7b",
        "sSalutation": "Mr",
        "sFirstName": "Jolmer",
        "sPrefix": "Van",
        "sLastName": "Ekeren2",
        "dDateOfBirth": "1999-12-31T23:00:00.000Z",
        "sGender": "male",
        "sCompanyName": "Prisma note",
        "dCreatedDate": "2022-03-28T19:26:29.523Z"
      },
      "sReceiptNumber": "0000562",
      "sInvoiceNumber": "0000562",
      "aPayments": [
        {
          "_id": "6243ff1a0ab1c8da110423f4",
          "sMethod": "cash"
        },
        {
          "_id": "6243ff1a0ab1c8da110423f4",
          "sMethod": "cash"
        }
      ],
      "iActivityId": "62a1f98405adcc35b88ed714",
      "dCreatedDate": "2022-06-09T13:45:40.775Z",
      "dUpdatedDate": "2022-06-09T13:45:40.775Z",
      "aTransactionItems": [
        {
          "_id": "62a1f98405adcc35b88ed717",
          "nQuantity": 1,
          "nAppliedStock": 0,
          "aImage": [
            "https://prismanote.s3.amazonaws.com/products/prisma-p1700-heren-horloge-edelstaal-rekband-ljpg.JPG"
          ],
          "eStatus": "y",
          "sProductName": "Prisma P.1700 gents watch all stainless steel 10 ATM",
          "sProductNumber": "P1700",
          "nPriceIncVat": 69,
          "nPurchasePrice": 100,
          "nVatRate": 0,
          "nReceivedQuantity": null,
          "sArticleNumber": "000069725",
          "iBusinessProductId": "627abbb74a2a1175a06bc0bc",
          "iTransactionId": "62a1f98405adcc35b88ed713"
        }
      ],
      "oEmployee": {
        "sName":"Erik"
      },
      "oBusiness": {
        "sName": "RichRabbit New 1",
        "sEmail": "neworg@neworg.com",
        "oPhone": {
          "bWhatsApp": true,
          "sCountryCode": "+91",
          "sMobile": "123123123",
          "sLandLine": "1123123323",
          "sFax": ""
        },
        "oAddress": {
          "attn": {
              "salution": "Hon",
              "firstName": "Jolmer",
              "lastNamePrefix": "Van",
              "lastName": "Ekeren"
          },
          "street": "Middleweg",
          "houseNumber": "8",
          "houseNumberSuffix": "B",
          "postalCode": "1456G",
          "city": "Asperen",
          "country": "Holland",
          "countryCode": "41",
          "state": "Utrech"
        }
      }
    }

    this.dataString = { ...dataString, ...translationsObj };

    const templateString = {
      "barcodeheight":"10",
      "barcodetext":false,
      "barcodewidth":"auto",
      "currency":"€",
      "debug":false,
      "defaultElement":"span",
      "fontSize":"10px",
      "margins":[5,5],
      "momentjs_dateformat":"",
      "name":"Transaction with VAT",
      "orientation":"landscape",
      "paperSize":"A5",
      "pixelsPerMm":"3.76",
      "rotation":"0",
      "layout":[
        {
          "row":[
            {
              "size":"4",
              "html":"<img src=\"https://lirp.cdn-website.com/2568326e/dms3rep/multi/opt/Juwelier-Bos-208w.png\" />"
            },
            {
              "size":4,
              "html":[
                {"element":"span","content": "[[oBusiness.sName]]" },
                {"element":"span","content": "[[oBusiness.sEmail]]" },
                {"element":"span","content": "[[oBusiness.oPhone.sMobile]]" },
                {"element":"span","content": "[[oBusiness.oPhone.sLandline]]" },
                {"element":"span","content":"<make function to combine address into single variable!!>"}

              ],
              "css":{
                "text-align":"right"
              }
            },
            {
              "size":"4",
              "html":[
                {"element":"span", "content":"(iban)"},{"element":"br","content":""},
                {"element":"span", "content":"(invoiceNumber)"},{"element":"br"},
                {"element":"span", "content":"(coc number)"}
              ],
              "css":{
                "text-align":"right"
              }        
            }
          ],
          "css" :{
            "padding":[0,0,5,0]
          },
          "section":"meta"
        },
        {
          "row":[
            {
              "size":"12",
              "float":"left",
              "html":"Datum: [[dCreatedDate]]<br/>Bonnummer: [[sReceiptNumber]]"
            }
          ],
          "css":{
            "padding":[0,0,5,0]
          },
          "section":"meta"
        },
        {
          "row":[
            {
              "size":"12",
              "float":"left",
              "html": "[[__CREATED_BY]] [[oEmployee.sName]]"
            }
          ],
          "css":{
            "padding":[0,0,5,0]
          },
          "section":"meta"
        },
        {
          "row":[
            {"size":2, "html": "[[__ART_NUMBER]]"},
            {"size":1, "html": "[[__QUANTITY]]"},
            {"size":3, "html": "[[__DESCRIPTION]]"},
            {"size":2, "html": "[[__DISCOUNT]]"},
            {"size":2, "html": "[[__AMOUNT]]", "css":{"text-align":"right"}}
          ],
          "css":{
            "font-weight":"bold",
            "margin-bottom":"2mm"
          }
        },
        {
          "row":[
            {
              "size":"6",
              "element":"table",
              "htmlBefore":"<tr><th>Betalingen:</th><th></th></tr>",
              "forEach":"aTransactionItems",
              "html":"<tr><td>[[sMethod]]</td><td>(amount)</td></tr>"
            },
            {
              "size":"6"
            }
          ],
          "css":{
            "padding":[3,0,0,0]
          },
          "section":"payment"
        },
        {
          "row":[
            {
              "size":2,
              "html":[
                {
                  "element":"span",
                  "content": "[[sProductNumber]]"
                }
              ]
            },
            {
              "size":1,
              "html":[
                {
                  "element":"span",
                  "content": "[[nQuantity]]"
                }
              ]
            },
            {
              "size":"5",
              "html":[
                {
                  "element":"span",
                  "content": "[[sProductName]]",
                  "css":{
                    "margin":[0,0,1,0]
                  }
                }
              ]
            },
            {
              "size":2,
              "html":[
                {
                  "element":"p",
                  "content":"€ [[nPriceIncVat|money]]"
                }
              ]
            },
            {
              "size":2,
              "html":[
                {
                  "element":"p",
                  "content":"€ [[nPriceIncVat|money]]"
                }
              ],
              "css":{
                "text-align":"right"
              }
            }
          ],
          "htmlBefore":"",
          "htmlAfter":"",
          "forEach":"aTransactionItems",
          "section":"products",
          "css":{
            "margin-bottom":"2mm"
          }
        },
        {
          "row":[
            {
              "size":"12",
              "html":"<hr/>"
            }
          ],
          "section":"payment"
        },
        {
          "row":[
            {
              "size":"6",
              "html":[
                {
                  "element":"h3",
                  "content":"Totaal"
                }
              ]
            },
            {
              "size":"6",
              "html":[
                {
                  "element":"h3",
                  "content":"€ (total of transaction)",
                  "css":{
                    "text-align":"right"
                  }
                }
              ]
            }
          ],
          "css":{
            "padding":[2,0,0,0],
            "flex":"1"
          },
          "section":"payment"
        },
        {
          "row":[
            {
              "size":"6",
              "element":"table",
              "htmlBefore":"<tr><th>Betalingen:</th><th></th></tr>",
              "forEach":"aPayments",
              "html":"<tr><td>[[sMethod]]</td><td>(amount)</td></tr>"
            },
            {
              "size":"6"
            }
          ],
          "css":{
            "padding":[3,0,0,0]
          },
          "section":"payment"
        },
        {
          "row":[
            {
              "size":"12",
              "html":"<small><table><tr><td>TODO!</td><td>Ex. BTW</td><td>BTW</td><td>Totaal</td></tr><tr><td>0% BTW</td><td>€ 75,00</td><td>€ 0,00</td><td>€ 75,00</td></tr></table></small>"
            }
          ],
          "css":{
            "padding":[3,0,0,0]
          },
          "section":"payment"
        },
        {
          "row":[
            {
              "size":"12",
              "html":"Spaarpunten! TODO!"
            }
          ],
          "css":{
            "padding":[3,0,0,0]
          }
        },
        {
          "row":[
            {
              "size":"12",
              "html":"Ruilen binnen 8 dagen op vertoon van deze bon.<br/>Dank voor uw bezoek."
            }
          ],
          "css":{
            "padding":[3,0,0,0]
          }
        }
      ]
    }

    this.templateString = templateString
  }

  getPrintSetting(){
    this.apiService.getNew('cashregistry', '/api/v1/print-settings/' + '6182a52f1949ab0a59ff4e7b' + '/' + '624c98415e537564184e5614').subscribe(
      (result : any) => {
        this.computerId = result?.data?.nComputerId;
        this.printerId = result?.data?.nPrinterId;
       },
      (error: any) => {
        console.error(error)
      }
    );
  }


  generatePDF(print: boolean): void {
    this.pdfGenerating = true
    const filename = new Date().getTime().toString()
    let printData = null
    if (print) {
      printData = {
        computerId: this.computerId,
        printerId: this.printerId,
        title: filename,
        quantity: 1
      }
    }
    const transactionId = this.transactionId
    const businessId = localStorage.getItem('currentBusiness')
    this.pdfService.createPdf(JSON.stringify(this.templateString), this.dataString, filename, print, printData, businessId, transactionId)
      .then( () => {
        this.pdfGenerating = false
      })
      .catch( (e) => {
        this.pdfGenerating = false
        console.error('err', e)
      })
  }

}
