import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})

export class ImportGiftCardService {

  constructor(
    private apiService: ApiService,
    private translateService: TranslateService
  ) { }

  defaultImportGiftCardAttribute() {
    const aDefaultAttribute = [
      {
        sColumnHeader: "CREATED_DATE",
        sDataBaseFieldName: "dCreatedDate",
        sName: "dCreatedDate",
      },
      {
        sColumnHeader: "MATCHING_CODE",
        sDataBaseFieldName: "nMatchingCode",
        sName: "nMatchingCode",
      },
      {
        sColumnHeader: "CUSTOMER_NUMBER",
        sDataBaseFieldName: "nClientId",
        sName: "nClientId",
      },
      {
        sColumnHeader: "REMAINING_VALUE",
        sDataBaseFieldName: "nGiftcardRemainingAmount",
        sName: "nGiftcardRemainingAmount",
      },
      {
        sColumnHeader: "GIFT_CARD_NUMBER",
        sDataBaseFieldName: "sGiftCardNumber",
        sName: "sGiftCardNumber",
      },
      {
        sColumnHeader: "VALUE",
        sDataBaseFieldName: "nPriceIncVat",
        sName: "nPriceIncVat",
      },
      {
        sColumnHeader: "TAX",
        sDataBaseFieldName: "nVatRate",
        sName: "nVatRate",
      },
      {
        sColumnHeader: "DESCRIPTION",
        sDataBaseFieldName: "sDescription",
        sName: "sDescription",
      }
    ]

    return aDefaultAttribute;
  }

  async processTransactionItem(oData: any) {
    let { parsedGiftCardData, referenceObj, iBusinessId, iLocationId, iWorkStationId, iEmployeeId } = oData;

    // let _customer: any;
    // let iCustomerId :any ;

    /* mapping the file's field with database name */
    parsedGiftCardData = parsedGiftCardData.map((oGiftCard: any) => {
      if (Object.keys(oGiftCard).length) {
        for (let [key, value] of Object.entries(oGiftCard)) {
          oGiftCard[referenceObj[key]] = value;
          //delete oGiftCard[key];
        }
      }
      return oGiftCard;
    })

    if (!parsedGiftCardData?.length) return [];

    const sProductName = this.translateService.instant('GIFTCARD');

    // if(parsedGiftCardData[0].nMatchingCode || parsedGiftCardData[0].nClientId){
    //   let requestParams = {
    //     iBusinessId: iBusinessId,
    //     searchValue:  parsedGiftCardData[0].nClientId ?  parsedGiftCardData[0].nClientId : parsedGiftCardData[0].nMatchingCode,
    //     skip:0 , 
    //     limit:10,
    //     sortBy: '_id',
    //     sortOrder: -1,
    //     aProjection: ['_id'],
    //     oFilterBy: {
    //       aSearchField: parsedGiftCardData[0].nClientId ? ['nClientId']: ['nMatchingCode'],
    //       aSelectedGroups: []
    //     },
    //     customerType: 'all'
    //   }
      
    //   _customer = await this.getCustomer(requestParams);
    //   if(_customer.data.length && _customer.data[0].result.length){
    //     iCustomerId = _customer.data[0].result[0]._id;
    //   }

    // }

    /* processing Transaction-Item */
    const aTransactionItem = [];
    for (const oData of parsedGiftCardData) {
      if (!oData?.nPriceIncVat) throw ('something went wrong');

      oData.nPriceIncVat = parseFloat((oData?.nPriceIncVat)?.replace(/,/g, '.'));
      const nPurchasePrice = oData?.nPriceIncVat / (1 + (100 / (oData?.nVatRate || 1)));
      const formatdate = new Date(oData?.dCreatedDate.split('/').reverse().join('/'));
      const dCreatedDate = new Date(formatdate).setHours(0, 0, 0, 0);
      const finaldate = new Date(dCreatedDate);
      
      let oCustomer = {
        _id: oData?.iCustomerId,
        nClientId: oData?.nClientId
      }

      const oTransactionItem = {
        iBusinessId: iBusinessId,
        iWorkStationId: iWorkStationId,
        iEmployeeId: iEmployeeId,
        iLocationId: iLocationId,
        /* File */
        nPriceIncVat: oData?.nPriceIncVat,
        nVatRate: oData?.nVatRate,
        /*No matching code is defined in TI schema */
        //nMatchingCode: oData?.nMatchingCode ? parseFloat(oData?.nMatchingCode) : undefined,
        sGiftCardNumber: oData?.sGiftCardNumber,
        dCreatedDate: finaldate,
        nEstimatedTotal: oData?.nPriceIncVat,
        nPaymentAmount: oData?.nPriceIncVat,
        nRevenueAmount: oData?.nPriceIncVat,
        /*No nPaidAmount in TI schema */
        nPaidAmount: oData?.nPriceIncVat,
        nGiftcardRemainingAmount: parseFloat((oData?.nGiftcardRemainingAmount)?.replace(/,/g, '.')) || oData?.nPriceIncVat,
        /* calculated */
        nPurchasePrice: nPurchasePrice,
        nProfit: oData?.nPriceIncVat - nPurchasePrice,
        /* Backend */
        iArticleGroupId: '', /* giftcard */
        iArticleGroupOriginalId: '',
        sUniqueIdentifier: '',
        iCustomerId: oData?.iCustomerId,
        oCustomer: oCustomer,
        // iCustomerId:iCustomerId ? iCustomerId : '', //oData?.nMatchingCode 
        //oCustomer: '', //NOT NEEDED IN TRANSACTION ITEM
        /* default */
        sProductName: sProductName,
        eStatus: "y",
        aImage: [],
        nMargin: 1,
        nQuantity: 1,
        oArticleGroupMetaData: {
          aProperty: [],
          sCategory: "Giftcard",
          sSubCategory: "Repair",
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
          eKind: "giftcard",
          bDiscount: false,
          bPrepayment: false
        },
        nDiscount: 0,
        sDescription: "Imported Giftcard" + "\n" + (oData?.sDescription || ""),
        sServicePartnerRemark: "",
        eEstimatedDateAction: "call_on_ready",
        eActivityItemStatus: "delivered",
        bGiftcardTaxHandling: "true",
        bDiscountOnPercentage: false,
        bImported: true,
        bImportGiftCard: true
      }
      aTransactionItem.push(oTransactionItem);
    }

    return aTransactionItem;
  }

  async mapTheImportGiftCardBody(oData: any) {
    const { parsedGiftCardData, referenceObj, iBusinessId, iLocationId, iWorkStationId, iEmployeeId } = oData;
    const aTransactionItem = await this.processTransactionItem(oData);

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
    };
    return { parsedGiftCardData, oBody };
  }

  /* Mapping the payment for the gift card */
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

  async getCustomer(requestParams: any){
    return this.apiService.postNew('customer', '/api/v1/customer/list', requestParams).toPromise();
  }
}
