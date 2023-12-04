import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CreateArticleGroupService {
  oInternalBusinessPartner:any;
  iBusinessId:any = localStorage.getItem('currentBusiness');
  aSuppliersList:any;
  org = localStorage.getItem('org');
  aLanguage:any;
  aArticleGroupWiseCategory:any = [
    { sArticleGroup: 'order', sCategory: 'Ordered products'},
    { sArticleGroup: 'repair', sCategory: 'Repairs'},
    { sArticleGroup: 'giftcard', sCategory: 'Giftcards'},
    { sArticleGroup: 'expense', sCategory: 'Costs'},
    { sArticleGroup: 'gold-purchase', sCategory: 'Gold purchase'},
    { sArticleGroup: 'expense-drinks', sCategory: 'Costs'},
    { sArticleGroup: 'expense-food', sCategory: 'Costs'},
    { sArticleGroup: 'expense-cleaning-cost', sCategory: 'Costs'},
    { sArticleGroup: 'expense-office-supplies', sCategory: 'Costs'},
    { sArticleGroup: 'expense-promotional-material', sCategory: 'Costs'},
    { sArticleGroup: 'expense-shipping-cost', sCategory: 'Costs'},
    { sArticleGroup: 'expense-car-cost', sCategory: 'Costs'}, 
    { sArticleGroup: 'expense-add-to-cash', sCategory: 'Costs'},
    { sArticleGroup: 'expense-lost-money', sCategory: 'Costs'}, 
    { sArticleGroup: 'payment-method-change', sCategory: 'Payment method change'} 
  ]

  aSelectedProperties: any = [];
  aAllProperties: any = [];
  aArticleGroupValidations: any = [];

  constructor(private apiService: ApiService, private translateService: TranslateService) {
    if(this.org)
    this.aLanguage = JSON.parse(this.org)['aLanguage']
  }

  getSupplierList(body: any): Observable<any> {
    return this.apiService.postNew('core', '/api/v1/business/partners/supplierList', body)
  }

  // createInternalBusinessPartner(iBusinessId: string): Observable<any> {
  //   const body = {
  //     oFilterBy: {
  //       bInternal: true,
  //     },
  //     iBusinessId,
  //   };
  //   return this.apiService.postNew('core', '/api/v1/business/partners', body)
  // }

  getBusiness(iBusinessId: string): Observable<any> {
    return this.apiService.getNew('core', `/api/v1/business/${iBusinessId}`)
  }

  async fetchInternalBusinessPartner(iBusinessId: any) {
    if (this.oInternalBusinessPartner) return this.oInternalBusinessPartner;
    else {
      const body = {
        oFilterBy: {
          bInternal: true,
        },
        iBusinessId,
      };
      let internalBusinessPartner: any = await this.getSupplierList(body).toPromise();
      if (internalBusinessPartner?.data?.length) {
        const supplier = internalBusinessPartner.data[0].result;
        this.oInternalBusinessPartner = supplier[0];
        return this.oInternalBusinessPartner;
      } else {
        const businessDetails: any = await this.getBusiness(iBusinessId).toPromise();
        const { data } = businessDetails;
        const order = {
          iBusinessId, // creator of the internal businessPartner
          iSupplierId: iBusinessId, // creator of the internal businessPartner
          iClientGroupId: null,
          sEmail: data.sEmail, // business.sEmail
          sName: `${data.sName} internal supplier`, // business.sName + ' internal supplier',
          sWebsite: data.sWebsite, // business.website
          oPhone: data.oPhone,
          oAddress: data.oAddress,
          nPurchaseMargin: 2,
          bPreFillCompanySettings: false,
          aBankDetail: data.aBankDetail,
          aProperty: data.aProperty,
          aRetailerComments: [],
          eFirm: 'private',
          eAccess: 'n',
          eType: 'supplier',
          bInternal: true,
        };
        // internalBusinessPartner = this.createInternalBusinessPartner(order).toPromise();
        internalBusinessPartner = await this.apiService.postNew('core', '/api/v1/business/partners', order).toPromise();
        this.oInternalBusinessPartner = internalBusinessPartner.data;
        return this.oInternalBusinessPartner;
      }
    }
  }

  saveInternalBusinessPartnerToArticleGroup(oArticleGroup:any) {
    // console.log('saveInternalBusinessPartnerToArticleGroup')
    const oBody = {
      aBusinessPartner: [{
        iBusinessPartnerId: this.oInternalBusinessPartner._id,
        nMargin: this.oInternalBusinessPartner.nPurchaseMargin
      }]
    }
    return this.apiService.putNew('core', `/api/v1/business/article-group/${oArticleGroup._id}?iBusinessId=${oArticleGroup.iBusinessId}`, oBody);
  }

  async createArticleGroup(articleData: { name: string, sCategory: string, sSubCategory: string }) {
    const { name } = articleData;
    const iBusinessId = localStorage.getItem('currentBusiness')
    const oBusinessPartner = await this.fetchInternalBusinessPartner(iBusinessId);
    const org = JSON.parse(localStorage.getItem('org') || '');
    // console.log(org);
    const oName:any = {};
    if(org) {
      const aTranslations = this.translateService.translations;
      // console.log(82, aTranslations);
      org.aLanguage.forEach((lang:any) => {
          oName[lang] = aTranslations[lang][name.toUpperCase()] || name;
      })
    }
    let data = {
      ...articleData,
      iBusinessId,
      nMargin: 0,
      aBusinessPartner: [{
          iBusinessPartnerId: oBusinessPartner._id,
          nMargin: oBusinessPartner.nPurchaseMargin || 0
        }],
      oName: { ...oName },
      bShowInOverview: false,
      bShowOnWebsite: false,
      bInventory: false,
      aProperty: []
    };
    return await this.apiService.postNew('core', '/api/v1/business/article-group/general', data).toPromise();
  }

  checkArticleGroups(eDefaultArticleGroup: string, sGoldForName?:string): Observable<any> {
    const data:any = {
      eDefaultArticleGroup,
      aLanguage: this.aLanguage,
      iBusinessId: localStorage.getItem('currentBusiness')
    };
    const obj = this.aArticleGroupWiseCategory.find((el: any) => el.sArticleGroup === eDefaultArticleGroup);
    if(obj){
      data.sCategory = obj.sCategory;
      data.sSubCategory = obj.sCategory;
    } 
    if(eDefaultArticleGroup === 'gold-purchase') data.sSubCategory = sGoldForName;
    return this.apiService.postNew('core', '/api/v1/business/article-group/get/default-article', data);
  }

  getArticleGroupData(sType:string) {
    return new Promise(async (resolve, reject) => {
      const result = await this.checkArticleGroups(sType).toPromise();
      if(result) resolve(result.data)
    })  
  }

  processError(err: any) {
    let message = '';
    if (err.error instanceof ErrorEvent) {
      message = err.error.message;
    } else {
      message = `Error Code: ${err.status}\nMessage: ${err.message}`;
    }
    return throwError(() => {
      message;
    });
  }

  fetchArticleGroupValidations() {
    const oBody = {
      iBusinessId: this.iBusinessId
    }

    return this.apiService.postNew('core', `/api/v1/business/article-group-validation/list`, oBody).toPromise();
  }

  fetchAllProperties() {
    let data = {
      bForArticleGroup: true,
      "iBusinessId": this.iBusinessId
    }
    
    return this.apiService.postNew('core', '/api/v1/properties/list', data).toPromise();
  }

  setFlags(status:any, element:any) {
    let s:any = {};
    switch(status){
      case 'requiredNotDivergent':
        s = { required: true, disabled: true, canRemove: false};
        
        break;
      case 'requiredButDivergent':
        s = { required: true, disabled: false, canRemove: false};
        break;
      case 'advisedDivergentRemovable':
        s = { required: false, disabled: false, canRemove: true};
    }

    element.required = s.required;
    element.disabled = s.disabled;
  }

  //Fetch default properties
  async fetchDefaultProperties(){
    const [_articleGroupValidations, _allPropertiesData, ]: any = await Promise.all([
      this.fetchArticleGroupValidations(),
      this.fetchAllProperties()
    ]);
    if (_articleGroupValidations?.data?.length) {
      this.aArticleGroupValidations = _articleGroupValidations.data;
    }
    let aAllData: any = [];
    if (_allPropertiesData.data && _allPropertiesData.data.length > 0) {
      _allPropertiesData.data[0].result.map((el: any) => {
        let data = {
          sName: el.sName,
          disabled: false,
          required: false,
          canRemove: true,
          iPropertyId: el._id,
          aOptions: el.aOptions.map((opt: any) => {
            return {
              sPropertyOptionName: opt.sKey,
              iPropertyOptionId: opt._id,
              sCode: opt.sCode,
              disabled: false,
              required: false,
              canRemove: true
            }
          }),
          oSelectedOption: {}
        }
        aAllData.push(data);
      });
    }

    this.aAllProperties = [...new Map(aAllData.map((v: any) => [JSON.stringify(v), v])).values()];
    this.aAllProperties.forEach((property:any)=> {
      property.aOptions = [{ sPropertyOptionName: 'ANY', iPropertyOptionId: null, sCode: 'ANY' }].concat(property.aOptions);
    })

    this.aArticleGroupValidations.forEach((el: any) => {
      this.aAllProperties.forEach((property: any) => {
        if (el.iPropertyId === property.iPropertyId) {
          property.aOptions.forEach((option: any) => {
            if (el.iPropertyOptionId === option.iPropertyOptionId) {
              if (el?.eStatusPropertyOption) {
                this.setFlags(el.eStatusPropertyOption, option);
              }
              property.oSelectedOption = option;
            } 
          });
          if (el?.eStatusProperty) {
            this.setFlags(el.eStatusProperty, property);
          }
          this.aSelectedProperties.push(property);
        }
      })
    });
  }

  // Create new article group
  async createNewArticleGroup(newArticleGroup: any) : Promise<Observable<any>> {
    await this.fetchDefaultProperties();

    const org = JSON.parse(localStorage.getItem('org') || '');
    const oName:any = {};
    if(org) {
      const aTranslations = this.translateService.translations;
      org.aLanguage.forEach((lang:any) => {
          oName[lang] = aTranslations[lang][newArticleGroup.name.toUpperCase()] || newArticleGroup.name;
      })
    }

    let data = {
      ...newArticleGroup,
      oName,
      bShowInOverview: false,
      bShowOnWebsite: false,
      bInventory: false,
      aProperty: []
    }
  
    this.aSelectedProperties.map((property: any, index: number) => {
      let opt: any = {
        iPropertyId: property.iPropertyId,
        sPropertyName: property.sName,
        iPropertyOptionId: property.oSelectedOption?.iPropertyOptionId,
        sPropertyOptionName: property.oSelectedOption?.sPropertyOptionName,
        sCode: property.oSelectedOption?.sCode,
        eStatusProperty: this.aArticleGroupValidations[index]?.eStatusProperty,
        eStatusPropertyOption: this.aArticleGroupValidations[index]?.eStatusPropertyOption,
      };
      data.aProperty.push(opt);
    });

    return this.apiService.postNew('core', '/api/v1/business/article-group', data);
  }


}
