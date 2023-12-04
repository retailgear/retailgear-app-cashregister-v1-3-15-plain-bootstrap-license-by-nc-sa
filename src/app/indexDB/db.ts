import Dexie, { Table } from 'dexie';
import { environment } from '../../environments/environment';

export interface SupplierListInfo {
    indexDBId?: number;
    title: string;
}

export interface SupplierList {
    indexDBId?: number;
    result: [
        {
            _id: any,
            oPhone: {
                bWhatsApp: boolean,
                sCountryCode: any,
                sMobile: any,
                sLandLine: string,
                sFax: string
            },
            oAddress: {
                attn: {
                    salution: any,
                    firstName: any,
                    lastNamePrefix: any,
                    lastName: any
                },
                street: any,
                houseNumber: any,
                houseNumberSuffix: string,
                postalCode: string,
                city: string,
                country: string,
                countryCode: string,
                state: string
            },
            eFirm: string,
            eStatus: any,
            aBankDetail: [],
            iBusinessId: any,
            iSupplierId: any,
            sName: string,
            aRetailerComments: [],
            bEntryMethodCustomerValue: boolean,
            bPreFillCompanySettings: boolean,
            nPurchaseMargin: number,
            eAccess: any
        }
    ],
    count: {
        totalData: number
    }
}

export interface BusinessPartners {
    indexDBId?: number;
    _id: any,
    aBankDetail: [],
    aRetailerComments: [],
    bEntryMethodCustomerValue: boolean,
    bPreFillCompanySettings: boolean,
    brands: [],
    eFirm: string,
    eStatus: any,
    iBusinessId: any,
    iSupplierId: any,
    nPurchaseMargin: number,
    oAddress: {
        attn: {
            salution: any,
            firstName: any,
            lastNamePrefix: any,
            lastName: any
        },
        street: any,
        houseNumber: any,
        houseNumberSuffix: string,
        postalCode: string,
        city: string,
        country: string,
        countryCode: string,
        state: string
    },
    oPhone: {
        bWhatsApp: boolean,
        sCountryCode: any,
        sMobile: any,
        sLandLine: string,
        sFax: string
    },
    sEmail: string,
    sName: string,
    sNameSlug: string,
    sWebsite: string,
}

export interface ProductList {
    indexDBId?: number,
    aImage: any,
    aProperty: any,
    bIsFeatured: boolean,
    bBestseller: boolean,
    bDiscountOnPercentage: boolean,
    bEntryMethodCustomerValue: boolean,
    bHasStock: boolean,
    bShowOnWebBusiness: boolean,
    bShowSuggestion: boolean,
    dCreatedDate: Date,
    dDateLastPurchased: any
    dUpdatedDate: Date,
    eGender: string,
    eOwnerShip: string,
    iArticleGroupId: any,
    iBusinessId: any,
    iBusinessPartnerId: any,
    iProductId: any,
    iSupplierId: any,
    nDiscount: number,
    nMinStock: number,
    nPriceIncludesVat: number,
    nSortingNumber: number,
    nVatRate: number,
    oName: {
        en: string,
    },
    sArticleNumber: string,
    sInsertedProductNumber: any,
    sLabelDescription: any,
    sProductNumber: string,
    _id: any,
}

export interface CreateTransactions {
    indexDBId?: number,
    url: string,
    method: string,
    productDetails: any,
}

export interface PropertySettings {
    indexDBId?: number,
    eRole: string,
    eStatus: string,
    nPriority: number,
    oUpdateTemplate: any,
    property: any,
    sFunctionName: string,
    sSectionName: string,
    _id: string
}

export interface TaxRates {
    indexDBId?: number,
    iLocationId: Array<any>,
    aRates: Array<any>,
    aStates?: Array<any>,
    sCountry?: string,
    sName?: string
}
export class AppDB extends Dexie {
    supplierList!: Table<SupplierList, number>;
    productList !: Table<ProductList, number>;
    createTransactions !: Table<CreateTransactions, number>;
    businessPartners !: Table<BusinessPartners, number>;
    propertySettings !: Table<PropertySettings, number>;
    taxRates !: Table<TaxRates, number>;
    constructor() {
        super(environment.indexedDBName);
        // navigator.storage.persist();
        this.version(3).stores({
            supplierList: '++indexDBId',
            productList: '++indexDBId',
            createTransactions: '++indexDBId',
            businessPartners: '++indexDBId',
            propertySettings: '++indexDBId',
            taxRates: '++indexDBId, iLocationId'
        });
        this.on('populate', () => this.populate());
    }

    async populate() {
    }

    async resetDatabase() {
        await db.transaction('rw', ['supplierList', 'productList', 'createTransactions', 'businessPartners', 'propertySettings', 'taxRates'], () => {
            this.supplierList.clear();
            this.productList.clear();
            this.createTransactions.clear();
            this.businessPartners.clear();
            this.propertySettings.clear();
            this.taxRates.clear();
        });
    }

    async showEstimatedQuota() {
        return await navigator.storage && navigator.storage.estimate ?
            navigator.storage.estimate() :
            undefined;
    }
}

export const db = new AppDB();
