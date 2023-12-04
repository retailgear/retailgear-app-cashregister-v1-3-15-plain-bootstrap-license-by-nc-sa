export interface View {
    sKey: string;
    sValue: string;
    children: ViewMenuChild[];
}

export interface ViewMenuChild {
    sKey?: string;
    sValue?: string;
    children: ChildChild[];
}

export interface ChildChild {
    sKey: string;
    sValue: string;
    data?: {
        displayMethod?: eDisplayMethodKeysEnum,
        modeFilter?: 'supplier' | 'businessOwner',
        levelFilter?: 'articleGroup' | 'product'
    }
}

export enum eDisplayMethodKeysEnum {
    revenuePerBusinessPartner = 'revenuePerBusinessPartner',
    revenuePerArticleGroupAndProperty = 'revenuePerArticleGroupAndProperty',
    revenuePerSupplierAndArticleGroup = 'revenuePerSupplierAndArticleGroup',
    revenuePerProperty = 'revenuePerProperty',
    revenuePerArticleGroup = 'revenuePerArticleGroup',
    aVatRates = 'aVatRates',

}
export interface DisplayMethod {
    sKey: eDisplayMethodKeysEnum | string;
    sValue: string;
}