import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

/**
 * General API Service to send all requests to the server. An HTTP interceptor will encrypt the request when needed
 */
export class ImportService {

    processImportCustomer(data: any) {
        const { customer } = data;

        const processCustomer = { 
            nClientId: customer?.['nClientId'] ? customer['nClientId'] : "do-nothing",
            sSalutation: customer?.['sSalutation'] ? customer['sSalutation'] : "do-nothing",
            sFirstName: customer?.['sFirstName'] ? customer['sFirstName'] : "do-nothing",
            sPrefix: customer?.['sPrefix'] ? customer['sPrefix'] : "do-nothing",
            sLastName: customer?.['sLastName'] ? customer['sLastName'] : "do-nothing",
            sGender: customer?.['sGender'] ? customer['sGender'] : "do-nothing",
            sEmail: customer?.['sEmail'] ? customer['sEmail'] : "do-nothing",

            oPhone: {
                sMobile: customer?.['sMobile'] ? customer['sMobile'] : "do-nothing",
                sLandLine: customer?.['sLandLine'] ? customer['sLandLine'] : "do-nothing",
    
                /*Overwrite prefixes only if numbers and country code are passed */
                sPrefixMobile: customer?.['sMobile'] && customer?.['sCountryCode'] ? "overwrite" : "do-nothing",
                sPrefixLandline: customer?.['sLandLine'] && customer?.['sCountryCode']? "overwrite" : "do-nothing",

                bWhatsApp: customer?.['bWhatsApp'] ? customer['bWhatsApp'] : "do-nothing",
                sFax: customer?.['sFax'] ? customer['sFax'] : "do-nothing",
            },

            oShippingAddress: {
                attn: {
                    sSalutation: customer?.['sSalutation'] ? customer['sSalutation'] : "do-nothing",
                    sFirstName: customer?.['sFirstName'] ? customer['sFirstName'] : "do-nothing",
                    sLastName: customer?.['sLastName'] ? customer['sLastName'] : "do-nothing",
                },
                sStreet: customer?.['sStreet'] ? customer['sStreet'] : "do-nothing",
                sHouseNumber: customer?.['sHouseNumber'] ? customer['sHouseNumber'] : "do-nothing",
                sHouseNumberSuffix: customer?.['sHouseNumberSuffix'] ? customer['sHouseNumberSuffix'] : "do-nothing",
                sPostalCode: customer?.['sPostalCode'] ? customer['sPostalCode'] : "do-nothing",
                sCity: customer?.['sCity'] ? customer['sCity'] : "do-nothing",
                sCountry: customer?.['sCountry'] ? customer['sCountry'] : "overwrite",
                sCountryCode: customer?.['sCountryCode'] ? customer['sCountryCode'] : "overwrite"
            },

            oInvoiceAddress: {
                attn: {
                    sSalutation: customer?.['sSalutation'] ? customer['sSalutation'] : "do-nothing",
                    sFirstName: customer?.['sFirstName'] ? customer['sFirstName'] : "do-nothing",
                    sLastName: customer?.['sLastName'] ? customer['sLastName'] : "do-nothing",
                },
                sStreet: customer?.['sStreet'] ? customer['sStreet'] : "do-nothing",
                sHouseNumber: customer?.['sHouseNumber'] ? customer['sHouseNumber'] : "do-nothing",
                sHouseNumberSuffix: customer?.['sHouseNumberSuffix'] ? customer['sHouseNumberSuffix'] : "do-nothing",
                sPostalCode: customer?.['sPostalCode'] ? customer['sPostalCode'] : "do-nothing",
                sCity: customer?.['sCity'] ? customer['sCity'] : "do-nothing",
                sCountry: customer?.['sCountry'] ? customer['sCountry'] : "overwrite",
                sCountryCode: customer?.['sCountryCode'] ? customer['sCountryCode'] : "overwrite"
            },
            nPoints: customer?.['nPoints'] ? customer['nPoints'] : "do-nothing",
            sComment: customer?.['sComment'] ? customer['sComment'] : "do-nothing",
            sNote: customer?.['sNote'] ? customer['sNote'] : "do-nothing",
            nMatchingCode: customer?.['nMatchingCode'] ? customer['nMatchingCode'] : "do-nothing",
            bNewsletter: customer?.['bNewsletter'] ? customer['bNewsletter'] : "do-nothing",
            dDateOfBirth: customer?.['dDateOfBirth'] ? customer['dDateOfBirth'] : "do-nothing"
        }

        return processCustomer;
    }

    processImportProduct(data: any) {
        const { product } = data;
        const processProduct = {
            nPriceIncludesVat: product?.['priceIncVat'] ? product['priceIncVat'] : "do-nothing",
            nMinStock: product?.['minStock'] ? product['minStock'] : "do-nothing",
            oName: product?.['en name'] ? product['en name'] : "do-nothing",
            bShowSuggestion: product?.['showSuggestion'] ? product['showSuggestion'] : "do-nothing",
            bEntryMethodCustomerValue: product?.['entrymethodcustomervalue'] ? product['entrymethodcustomervalue'] : "do-nothing",
            sProductNumber: product?.['productNumber'] ? product['productNumber'] : "do-nothing",
            iBusinessBrandId: product?.['brand_name'] ? product['brand_name'] : "do-nothing",
            iSupplier: product?.['supplier_name'] ? product['supplier_name'] : "do-nothing",
            sEan: product?.['ean'] ? product['ean'] : "do-nothing",
            nVatRate: product?.['priceVat'] ? product['priceVat'] : "do-nothing",
            nDiscount: product?.['discount'] ? product['discount'] : "do-nothing",
            bBestseller: product?.['bestseller'] ? product['bestseller'] : "do-nothing",
            aImage: product?.['image'] ? product['image'] : "do-nothing",
            bDiscountOnPercentage: product?.['discountOnPercentage'] ? product['discountOnPercentage'] : "do-nothing",
            eOwnerShip: product?.['ownership'] ? product['ownership'] : "do-nothing",
            sLabelDescription: product?.['labelDescription'] ? product['labelDescription'] : "do-nothing",
            nSortingNumber: product?.['sortingNumber'] ? product['sortingNumber'] : "do-nothing",
            eGender: product?.['gender'] ? product['gender'] : "do-nothing",
            oNameSlug: product?.['en nameslug'] ? product['en nameslug'] : "do-nothing",
            nPurchasePrice: product?.['purchasePrice'] ? product['purchasePrice'] : "do-nothing",
            nSupplierSuggestedRetailPrice: product?.['nSupplierSuggestedRetailPrice'] ? product['nSupplierSuggestedRetailPrice'] : "do-nothing",
            nSuggestedRetailPrice: product?.['nSuggestedRetailPrice'] ? product['nSuggestedRetailPrice'] : "do-nothing",
            bHasStock: product?.['hasStock'] ? product['hasStock'] : "do-nothing"
        }

        return processProduct;
    }

    processConnectProductData(oData: any) {
        const { aBusinessProducts, aConnectProducts } = oData;

        const oPocessObject = {
            aBusinessProducts: aBusinessProducts.map((businessProduct: any) => {
                return {
                    iBusinessProductId: businessProduct.iBusinessProductId,
                    sArticleNumber: businessProduct.article,
                    oBusinessBrand: businessProduct.oBusinessBrand,
                    sProductNumber: businessProduct.productNumber,
                    selected: false,
                    status: 0, // status is used to check that productNumber is valid or not
                    isInvalid: false
                }
            }),
            aConnectProducts: aConnectProducts.map((connectProduct: any) => {
                return connectProduct;
            }),
        }

        return oPocessObject;
    }

    processImportTransaction(data: any) {
        const { transaction } = data;
        const processTransaction = {
            sCreatedBy: transaction?.['createdBy'] ? transaction['createdBy'] : "overwrite",
            oCustomer: transaction?.['customer'] ? transaction['customer'] : "overwrite",
            dCreatedDate: transaction?.['dateCreated'] ? transaction['dateCreated'] : "overwrite",
            aDetails: transaction?.['details'] ? transaction['details'] : "overwrite",
            bHas_sold_products: transaction?.['has_sold_products'] ? transaction['has_sold_products'] : "overwrite",
            sNumber: transaction?.['number'] ? transaction['number'] : "overwrite",
            sReceiptNumber: transaction?.['receiptNumber'] ? transaction['receiptNumber'] : "overwrite",
            nTransactionTotal: transaction?.['transactionTotal'] ? transaction['transactionTotal'] : "overwrite",
            eType: transaction?.['type'] ? transaction['type'] : "overwrite"
        }
        return processTransaction;
    }
}