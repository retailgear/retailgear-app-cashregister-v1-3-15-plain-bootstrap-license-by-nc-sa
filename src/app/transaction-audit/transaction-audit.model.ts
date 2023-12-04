export interface View {
    sKey: string;
    sValue: string;
    children: ViewMenuChild[];
    bDisable: boolean;
}

export interface ViewMenuChild {
    sKey?: string;
    sValue?: string;
    children: ChildChild[];
    bDisable: boolean
}

export interface ChildChild {
    sKey: string;
    sValue: string;
    bDisable: boolean;
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
    aRevenuePerTurnoverGroup = 'aRevenuePerTurnoverGroup'
}

export interface DisplayMethod {
    sKey: eDisplayMethodKeysEnum | string;
    sValue: string;
}