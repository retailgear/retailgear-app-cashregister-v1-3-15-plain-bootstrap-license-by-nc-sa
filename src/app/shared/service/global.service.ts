import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GlobalService {

    constructor() { }

    oBusinessSetting: any;
    aModule: any = [
        {
            "sModuleName": "DASHBOARD",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "CASH_REGISTER",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "COMPANY_INFO",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "ADVICED_STOCK",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "CLIENT_GROUPS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "DAY_CLOSURE",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "TEXT_HEAD_CUSTOMERS_RETAILER_HOME",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "TEXT_HEAD_SUPPLIERS_RETAILER_HOME",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "REPAIRS_AND_SPECIAL_ORDERS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "TRANSACTIONS_AND_OFFERS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "WEBORDERS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "WEBSITE_BUILDER",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "STATISTICS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "ALL_PURCHASE_ORDERS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "ASSORTMENT",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "STORE_SETTINGS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "EMPLOYEES",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "TRANSACTION_AUDIT",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "STYLING_GUIDE",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "ARTICLE_GROUPS",
            "bIsModalAlwaysOpen": false,
            "aSubModule": []
        },
        {
            "sModuleName": "BULK_UPDATES",
            "bIsModalAlwaysOpen": false,
            "aSubModule": [
                {
                    "sSubModuleName": "PRODUCT_IMPORT",
                    "bIsModalAlwaysOpen": false
                },
                {
                    "sSubModuleName": "VARIANT_IMPORT",
                    "bIsModalAlwaysOpen": false
                },
                {
                    "sSubModuleName": "CONNECT_PRODUCTS",
                    "bIsModalAlwaysOpen": false
                },
                {
                    "sSubModuleName": "CUSTOMER_IMPORT",
                    "bIsModalAlwaysOpen": false
                },
                {
                    "sSubModuleName": "TRANSACTION_IMPORT",
                    "bIsModalAlwaysOpen": false
                }
            ]
        }];
    hasUpdate = new Subject<boolean>();
    workspaceDetailsUpdated = new Subject<any>();

    public get getBusinessSetting(): any {
        return this.oBusinessSetting;
    }

    updateAvailable() {
        this.hasUpdate.next(true);
    }
}
