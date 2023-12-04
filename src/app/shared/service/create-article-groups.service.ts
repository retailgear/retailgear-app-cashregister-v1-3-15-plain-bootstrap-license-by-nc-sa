import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CreateArticleGroupService {

  constructor(private apiService: ApiService) { }

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
    let supplierId;
    const body = {
      oFilterBy: {
        bInternal: true,
      },
      iBusinessId,
    };
    let internalBusinessPartner: any = await this.getSupplierList(body).toPromise();
    if (internalBusinessPartner && internalBusinessPartner.data && internalBusinessPartner.data.length > 0) {
      const supplier = internalBusinessPartner.data[0].result;
      supplierId = supplier[0]._id;
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
      supplierId = internalBusinessPartner.data._id;
    }

    return supplierId;
  }

  async createArticleGroup(articleData: { name: string, sCategory: string, sSubCategory: string }) {
    const { name } = articleData;
    const iBusinessId = localStorage.getItem('currentBusiness')
    const iBusinessPartnerId = await this.fetchInternalBusinessPartner(iBusinessId);
    let data = {
      ...articleData,
      iBusinessId,
      nMargin: 0,
      iBusinessPartnerId,
      oName: { nl: name, en: name, de: name, fr: name },
      bShowInOverview: false,
      bShowOnWebsite: false,
      bInventory: false,
      aProperty: []
    };
    return await this.apiService.postNew('core', '/api/v1/business/article-group/general', data).toPromise();
  }

  checkArticleGroups(searchValue: string): Observable<any> {
    let data = {
      skip: 0,
      limit: 20,
      searchValue,
      oFilterBy: {
      },
      iBusinessId: localStorage.getItem('currentBusiness'),
    };
    return this.apiService.postNew('core', '/api/v1/business/article-group/list', data).pipe(retry(1), catchError(this.processError));
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
}
