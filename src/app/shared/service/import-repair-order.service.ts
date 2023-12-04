import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../service/api.service';

@Injectable({
  providedIn: 'root'
})
export class ImportRepairOrderService {
  EmployeeId :any;
  AssigneeId:any;

  aActivityItemStatus: any = [
    'new',
    'processing',
    'inspection',
    'completed',
    'delivered',
    'cancelled',
    'refund',
    'refundInCashRegister',
    'offer',
    'offer-is-ok',
    'offer-is-not-ok',
    'to-repair',
    'part-are-order',
    'shipped-to-repair',
    'product-ordered',
    'order-ready'
  ];

  constructor(
    private translateService: TranslateService,
    private apiService: ApiService,
  ) { }

  // convertToDate(dateString: any) {
  //   let _dDate;
  //   if (dateString) {
  //     const aDateArray = dateString.split('/');
  //     _dDate = new Date(`${aDateArray[2]}/${aDateArray[1] - 1}/${aDateArray[0]}`);
  //   }
  //   return _dDate;
  // }

  defaultImportRepairOrderAttribute() {
    const aDefaultAttribute = [
      {
        sColumnHeader: "CREATED_DATE",
        sDataBaseFieldName: "dCreatedDate",
        sName: "dCreatedDate",
      },
      {
        sColumnHeader: "ESTIMATED_DATE",
        sDataBaseFieldName: "dEstimatedDate",
        sName: "dEstimatedDate",
      },
      {
        sColumnHeader: "MATCHING_CODE",
        sDataBaseFieldName: "nMatchingCode",
        sName: "nMatchingCode",
      },
      // {
      //   sColumnHeader: "REMAINING_VALUE",
      //   sDataBaseFieldName: "nRemainingValue",
      //   sName: "nRemainingValue",
      // },
      {
        sColumnHeader: "PRICE_INC_VAT",
        sDataBaseFieldName: "nPriceIncVat",
        sName: "nPriceIncVat",
      },
      {
        sColumnHeader: "ACTUAL_COST",
        sDataBaseFieldName: "nActualCost",
        sName: "nActualCost",
      },
      {
        sColumnHeader: "QUANTITY",
        sDataBaseFieldName: "nQuantity",
        sName: "nQuantity",
      },
      {
        sColumnHeader: "PAID_AMOUNT",
        sDataBaseFieldName: "nPaymentAmount",
        sName: "nPaymentAmount",
      },
      {
        sColumnHeader: "ESTIMATED_PRICE_UPON_INGESTION",
        sDataBaseFieldName: "nTotalAmount",
        sName: "nTotalAmount",
      },
      {
        sColumnHeader: "TYPE",
        sDataBaseFieldName: "oType.eKind",
        sName: "eKind",
      },
      {
        sColumnHeader: "BAG_NUMBER",
        sDataBaseFieldName: "sBagNumber",
        sName: "sBagNumber",
      },
      {
        sColumnHeader: "TAX",
        sDataBaseFieldName: "nVatRate",
        sName: "nVatRate",
      },
      {
        sColumnHeader: "PHOTOS",
        sDataBaseFieldName: "aImage",
        sName: "aImage",
      },
      {
        sColumnHeader: "CUSTOMER_NAME",
        sDataBaseFieldName: "oCustomer.sFirstName",
        sName: "sFirstname",
      },
      {
        sColumnHeader: "CUSTOMER_NUMBER",
        sDataBaseFieldName: "oCustomer.nClientId",
        sName: "nClientId",
      },
      {
        sColumnHeader: "CUSTOMER_ID",
        sDataBaseFieldName: "iCustomerId",
        sName: "iCustomerId",
      },
      {
        sColumnHeader: "REMARK_FOR_SERVICE_PARTNERS",
        sDataBaseFieldName: "sCommentVisibleServicePartner",
        sName: "sCommentVisibleServicePartner",
      },
      {
        sColumnHeader: "CONTACT_ACTION",
        sDataBaseFieldName: "eEstimatedDateAction",
        sName: "eEstimatedDateActiony",
      },
      {
        sColumnHeader: "STATUS",
        sDataBaseFieldName: "eActivityItemStatus",
        sName: "eActivityItemStatus",
      },
      {
        sColumnHeader: "CUSTOMER_SHIPPING_STREET",
        sDataBaseFieldName: "oCustomer.oShippingAddress.sStreet",
        sName: "oShippingAddress.sStreet",
      },
      {
        sColumnHeader: "CUSTOMER_SHIPPING_HOUSE_NUMBER",
        sDataBaseFieldName: "oCustomer.oShippingAddress.sHouseNumber",
        sName: "oShippingAddress.sHouseNumber",
      },
      {
        sColumnHeader: "CUSTOMER_SHIPPING_COUNTRY_CODE",
        sDataBaseFieldName: "oCustomer.oShippingAddress.sCountryCode",
        sName: "oShippingAddress.sCountryCode",
      },
      {
        sColumnHeader: "CUSTOMER_SHIPPING_POSTAL_CODE",
        sDataBaseFieldName: "oCustomer.oShippingAddress.sPostalCode",
        sName: "oShippingAddress.sPostalCode",
      },
      {
        sColumnHeader: "CUSTOMER_SHIPPING_CITY",
        sDataBaseFieldName: "oCustomer.oShippingAddress.sCity",
        sName: "oShippingAddress.sCity",
      },
      {
        sColumnHeader: "TITLE",
        sDataBaseFieldName: "sProductName",
        sName: "sProductName",
      },
      {
        sColumnHeader: "COMMENT",
        sDataBaseFieldName: "sDescription",
        sName: "sDescription",
      },
      {
        sColumnHeader: "REMARK_FOR_COLLEAGUES",
        sDataBaseFieldName: "sCommentVisibleColleagues",
        sName: "sCommentVisibleColleagues",
      },
      {
        sColumnHeader: "EMPLOYEE",
        sDataBaseFieldName: "iEmployeeId",
        sName: "iEmployeeId",
      },
      {
        sColumnHeader: "REPAIRER",
        sDataBaseFieldName: "iAssigneeId",
        sName: "iAssigneeId",
      }
      // ,
      // {
      //   sColumnHeader: "Estimated price",
      //   sDataBaseFieldName: "nRevenueAmount",
      //   sName: "nRevenueAmount",
      // }
      
    ]

    return aDefaultAttribute;
  }

  processTransactionItem(oData: any): any {
    try {
      let { parsedRepairOrderData, referenceObj, iBusinessId, iLocationId, iWorkStationId, iEmployeeId } = oData;
      /* mapping the file's field with database name */
      parsedRepairOrderData = parsedRepairOrderData.map((oRepairOrder: any) => {
        if (Object.keys(oRepairOrder).length) {
          for (let [key, value] of Object.entries(oRepairOrder)) {
            oRepairOrder[referenceObj[key]] = value;
            // delete oRepairOrder[key];
          }
        }
        return oRepairOrder;
      })

      if (!parsedRepairOrderData?.length) return [];


      /* processing Transaction-Item */
      const aTransactionItem = [];
      for (const oData of parsedRepairOrderData) {
        if (!oData?.nPriceIncVat) throw ('something went wrong');
        const eType = oData['oType.eKind'];
        let street = oData['oCustomer.oShippingAddress.sStreet'];
        let HouseNumber = oData['oCustomer.oShippingAddress.sHouseNumber'];
        let HouseNumberSuffix = oData['oCustomer.oShippingAddress.sHouseNumberSuffix'];
        let PostalCode = oData['oCustomer.oShippingAddress.sPostalCode'];
        let City = oData['oCustomer.oShippingAddress.sCity'];
        let CountryCode = oData['oCustomer.oShippingAddress.sCountryCode'];
        if (street == undefined) street = "";
        if (HouseNumber == undefined) HouseNumber = "";
        if (HouseNumberSuffix == undefined) HouseNumberSuffix = "";
        if (PostalCode == undefined) PostalCode = "";
        if (City == undefined) City = "";
        if (CountryCode == undefined) CountryCode = "";
        let imageArray = "";
        if (oData?.aImage) {
          imageArray = oData?.aImage.split(";");
        }

        oData.nPriceIncVat = parseFloat((oData?.nPriceIncVat)?.replace(/,/g, '.'));
        oData.nActualCost = parseFloat((oData?.nActualCost)?.replace(/,/g, '.'));
        oData.nTotalAmount = parseFloat((oData?.nTotalAmount)?.replace(/,/g, '.'));

        if(!this.aActivityItemStatus.includes(oData?.eActivityItemStatus)){
           oData.sCommentVisibleColleagues = (oData.sCommentVisibleColleagues || "") + 'Status: '+ oData?.eActivityItemStatus + '\n';
           oData.eActivityItemStatus = 'inspection';
        }
        
        // function convertToPlain(rtf) {
        //   rtf = rtf.replace(/\\par[d]?/g, "");
        //   return rtf.replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "").trim();
        // }

        if (oData?.sDescription) {
          // oData.sDescription = this.processRTFData(oData?.sDescription);
          oData.sDescription = oData?.sDescription?.replace(/\\"/g, '');
        }

        if (oData?.iCustomerId == "") {
          oData.iCustomerId = null;
        }

        const oCustomer = {
          _id: oData.iCustomerId,
          nClientId: oData['oCustomer.nClientId'],
          oShippingAddress: {
            sStreet: street,
            sHouseNumber: HouseNumber,
            sHouseNumberSuffix: HouseNumberSuffix,
            sPostalCode: PostalCode,
            sCity: City,
            sCountryCode: CountryCode,
            sCountry: ""

          }, oInvoiceAddress: {
            sStreet: street,
            sHouseNumber: HouseNumber,
            sHouseNumberSuffix: HouseNumberSuffix,
            sPostalCode: PostalCode,
            sCity: City,
            sCountryCode: CountryCode,
            sCountry: ""

          }
        }

        if (oData.contact_when_ready == "Whatsapp") {
          oData.eEstimatedDateAction = "whatsapp_on_ready";
        } else if (oData.contact_when_ready == "Email") {
          oData.eEstimatedDateAction = "email_on_ready";
        } else {
          oData.eEstimatedDateAction = "call_on_ready";
        }

        const formatCdate = new Date(oData?.dCreatedDate?.split('-').reverse().join('/'));
        const dCreatedDate = new Date(formatCdate).setHours(5, 30, 0, 0);
        const finalCdate = new Date(dCreatedDate);

        const formatEdate = new Date(oData?.dEstimatedDate?.split('-').reverse().join('/'));
        const dEstimatedDate = new Date(formatEdate).setHours(5, 30, 0, 0);
        const finalEdate = new Date(dEstimatedDate);
        
        //const sProductName = this.translateService.instant(eType === 'order' ? 'ORDER' : 'REPAIR');
        const nPurchasePrice = oData?.nPriceIncVat / (1 + (100 / (oData?.nVatRate || 1)));
        const oTransactionItem = {
          iBusinessId: iBusinessId,
          iWorkStationId: iWorkStationId,
          iEmployeeId: oData?.iEmployeeId,
          iAssigneeId: oData?.iAssigneeId ? oData?.iAssigneeId : undefined,
          iLocationId: iLocationId,
          /* File */
          sBagNumber: oData?.sBagNumber,
          nPriceIncVat: oData?.nPriceIncVat,
          nTotalAmount: oData?.nTotalAmount,
          nVatRate: oData?.nVatRate,
          nMatchingCode: oData?.nMatchingCode ? parseFloat(oData?.nMatchingCode) : undefined,
          dCreatedDate: finalCdate,
          dEstimatedDate: finalEdate,
          //nEstimatedTotal: Number(oData?.nPriceIncVat),
          nPaidAmount: oData?.nPaymentAmount ?  parseFloat((oData?.nPaymentAmount)?.replace(/,/g, '.')) : (oData.eActivityItemStatus != 'delivered'? 0 : oData?.nPriceIncVat),
          nPaymentAmount: oData?.nPaymentAmount ?  parseFloat((oData?.nPaymentAmount)?.replace(/,/g, '.')) : (oData.eActivityItemStatus != 'delivered'? 0 : oData?.nPriceIncVat),
          nRevenueAmount: oData?.nPriceIncVat,
          nActualCost: oData?.nActualCost,
          //nRemainingValue: oData?.nRemainingValue,
          /* calculated */
          nPurchasePrice:  nPurchasePrice,
          nProfit:  oData?.nPriceIncVat - nPurchasePrice,
          /* Backend */
          iArticleGroupId: '', /* repair-order */
          iArticleGroupOriginalId: '',
          sUniqueIdentifier: '',
          iCustomerId: oData.iCustomerId,
          oCustomer: oCustomer,
          /* default */

          sProductName: oData?.sProductName,
          eStatus: "y",
          aImage: imageArray,
          nMargin: 1,
          nQuantity: oData?.nQuantity ? oData?.nQuantity : 1,
          oArticleGroupMetaData: {
            aProperty: [],
            sCategory: eType,
            sSubCategory: eType,
            oName: {},
            oNameOriginal: {}
          },
          nRefundAmount: 0,
          nPaidLaterAmount: 0,
          bPayLater: false,
          bDeposit: false,
          sProductCategory: "CATEGORY",
          bDiscount: false,
          oType: {
            eTransactionType: "cash-registry",
            bRefund: false,
            nStockCorrection: 1,
            eKind: eType,
            bDiscount: false,
            bPrepayment: false
          },
          nDiscount: 0,
          sDescription: oData.sDescription,
          sCommentVisibleServicePartner: oData?.sCommentVisibleServicePartner,
          sCommentVisibleColleagues: oData?.sCommentVisibleColleagues,
          eEstimatedDateAction: oData?.eEstimatedDateAction,
          eActivityItemStatus: oData?.eActivityItemStatus,
          bDiscountOnPercentage: false,
          bImported: true,
          bImportRepairOrder: true
        }
        aTransactionItem.push(oTransactionItem);
      }

      return aTransactionItem;
    } catch (error) {
      console.log('error : ', error, error?.toString());
    }
  }

  mapTheImportRepairOrderBody(oData: any) {
    try {
      const { parsedRepairOrderData, referenceObj, iBusinessId, iLocationId, iWorkStationId, iEmployeeId } = oData;
      const aTransactionItem = this.processTransactionItem(oData);
      const oBody: any = {
        iBusinessId: iBusinessId,
        iLocationId: iLocationId,
        iWorkstationId: iWorkStationId,
        oTransaction: {
          eStatus: 'y',
          eType: 'cash-register-revenue',
          iBusinessId: iBusinessId,
          iLocationId: iLocationId,
          iWorkstationId: iWorkStationId,
          iEmployeeId: iEmployeeId,
          bImported: true
        },
        
        redeemedLoyaltyPoints: 0,
        transactionItems: aTransactionItem,
        sDefaultLanguage: localStorage.getItem('language') || 'nl',
        bImported: true,
        bImportRepairOrder: true
      };
      return { parsedRepairOrderData, oBody };
    } catch (error: any) {
      console.log('error 394: ', error, error?.toString());
      throw ('something went wrong 401');
    }
  }

  /* Mapping the payment for the repair-order */
  mapPayment(oData: any) {
    const aPayment = [
      {
        bIsDefaultPaymentMethod: true,
        _id: "6243ff1a0ab1c8da110423f4",
        sName: "Cash",
        bStockReduction: true,
        bInvoice: true,
        bAssignSavingPointsLastPayment: true,
        eIntegrationMethod: "other",
        isDisabled: true,
        amount: oData?.nPriceIncVat,
        bImported: true
      },
      {
        bIsDefaultPaymentMethod: true,
        _id: "6243ff1a0ab1c8da110423f4",
        sName: "Cash",
        bStockReduction: true,
        bInvoice: true,
        bAssignSavingPointsLastPayment: true,
        eIntegrationMethod: "other",
        isDisabled: true,
        amount: 0,
        remark: "CHANGE_MONEY",
        bImported: true
      }
    ]

    return aPayment;
  }

  /* RTF PROCESS START */

  isRtfText(text: string): any {
    const lowercaseText = text.toLowerCase(); // Convert the text to lowercase for case-insensitive comparison
    return (
        lowercaseText.includes('rtf') ||
        lowercaseText.includes('{\\') ||
        lowercaseText.includes('\\par')
    );
  }

  convertRtfToPlainText(rtf: string): any {
    // Remove invalid Unicode escape sequences
    const cleanedRtf = rtf.replace(/\\[a-zA-Z]+\d*/, '');

    // Remove RTF control words and tags
    const plainText = cleanedRtf.replace(/\\[^\\]*|{[^}]*}/g, '');

    // Remove line breaks and newline characters
    const withoutLineBreaks = plainText.replace(/\\par/g, '\n');

    // Trim leading and trailing whitespace
    const trimmedText = withoutLineBreaks.trim();

    console.log('convertRtfToPlainText PLAIN TEXT: ', trimmedText);
    return trimmedText;
  }

  processRTFData(input: any): any {
    if (typeof input === 'string') {
      // Check if the input string contains RTF data
      if (this.isRtfText(input)) {
        return this.convertRtfToPlainText(input);
      } else {
        return input; // Return the input as is if it's not RTF
      }
    } else if (Array.isArray(input)) {
      // log.cyan('is any array?', input);
      // If the input is an array, recursively process each item
      return input.map(item => this.processRTFData(item));
    } else if (typeof input === 'object' && input !== null) {
      // If the input is an object, recursively process its properties
      const result: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          result[key] = this.processRTFData(input[key]);
        }
      }
      return result;
    } else {
      // If the input is neither a string nor an object, return it as is
      return input;
    }
  }
  /* RTF PROCESS END */
}
