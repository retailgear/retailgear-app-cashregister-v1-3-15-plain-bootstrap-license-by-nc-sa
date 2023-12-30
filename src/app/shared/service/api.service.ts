import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { catchError, map, retry } from "rxjs/operators";
import { ToastService } from '../components/toast';

type ApiTypes = 'auth' | 'organization' | 'core' | 'cashregistry' | 'customer' | 'bookkeeping' | 'website-builder' | 'backup' | 'oldplatform' | 'log' | 'fiskaly' | 'JEWELS_AND_WATCHES' | 'cron'

@Injectable({
  providedIn: 'root'
})
/**
 * General API Service to send all requests to the server. An HTTP interceptor will encrypt the request when needed
 */
export class ApiService {
  /**
   * endPoint will be loaded from environment config files
   */
  endPoint = environment.apiURL
  secretKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2N1bWVudCI6eyJfaWQiOiI2MTdmYWViNWQyOTNjNzgyOWVjZWFiMjYiLCJzTmFtZSI6IkNvb2x3YXRjaCIsInNFbWFpbCI6ImFua2l0LnBhdGlsQGFudXlhdC5jb20iLCJkRXhwaXJlRGF0ZSI6IjIwMjItMTItMzFUMDY6NDg6NDQuNTE2WiIsImVTdGF0dXMiOiJ5In0sImlhdCI6MTYzNTc1Nzc0OX0.YR1zmxcK_YfMQ_O_e485Lbc5-0UeSoftm_EuPtRNBBg'

  public userDetails: BehaviorSubject<any> = new BehaviorSubject<any>({});
  public businessDetails: BehaviorSubject<any> = new BehaviorSubject<any>({});
  public activityItemDetails: BehaviorSubject<any> = new BehaviorSubject<any>({});
  toastService: ToastService;
  bSuppressFurtherToast: boolean = false;

  constructor(
    private httpClient: HttpClient,
  ) { }

  setToastService(toastService: ToastService) {
    this.toastService = toastService;
  }

  httpHeaders = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
    withCredentials: true
  }

  defaultHeaders: any = { 'Content-Type': 'application/json', observe: 'response' };

  resetDefaultHeaders() {
    this.defaultHeaders = { 'Content-Type': 'application/json', observe: 'response' };
  }
  
  httpError(error: { error: { message: string; }; message: string; status: number, url: string }) {
    let msg = ''
    if (error.error instanceof ErrorEvent) {
      //Client side error
      msg = error?.error?.message
    } else {
      //Server side error
      msg = error?.error?.message
    }
    if (Number(error.status) == 0) {
      let url = error.url.match('.*/v1/(.*)/') || ''
      this.toastService.show({ type: 'danger', text: `Something went wrong while executing this url '${url[1]}'` })
    } else {
      if (error.status == 498) {
        if (!this.bSuppressFurtherToast) this.toastService.show({ type: 'danger', text: msg || 'Something went wrong!' })
        this.bSuppressFurtherToast = true;
      }
      if (!this.bSuppressFurtherToast) this.toastService.show({ type: 'danger', text: msg || 'Something went wrong!' })
    }
    return throwError(new Error(msg))
  }

  //  Function for set headers
  setAPIHeaders() {
    if (localStorage.getItem('authorization') && localStorage.getItem('authorization')?.trim() != '') {
      this.defaultHeaders['Authorization'] = localStorage.getItem('authorization');
    }
    if (localStorage.getItem('org') && localStorage.getItem('org')?.trim() != '') {
      let details: any = localStorage.getItem('org');
      let organization = JSON.parse(details);
      this.defaultHeaders['organization-id'] = organization.sName
    }else{
      this.defaultHeaders['organization-id'] = 'Prismanote2'
    }
  }

  // Function for set user details
  setUserDetails(userDetails: any) {
    this.userDetails.next(userDetails);
  }

  // Function for set business details
  setBusinessDetails(businessDetails: any) {
    this.businessDetails.next(businessDetails);
  }

  /**
   * Sends a GET request to the specified route
   * @param route The endpoint to send the request to. The domain will be added automatically
   * @param options Options for this request, will be send as parameter
   * @param version The version of the backend API to use, will add 'v[version]' in the route if version is higher then 1
   */
  get(route: string, options: object, version: number): Observable<any> {
    route = '/api/' + (version > 1 ? 'v' + version.toString() + '/' : '') + route

    const headerObject: any = {
      ...this.httpHeaders,
      ...(options && Object.keys(options).length > 0 && { params: options })
    }

    return this.httpClient
      .get<any>(this.endPoint + route, headerObject)
      .pipe(
        retry(1),
        catchError(this.httpError.bind(this))
      )
  }

  /**
   * Sends a POST request to the specified route
   * @param route The endpoint to send the data to. The domain will be added automatically
   * @param data The data which needs to be send, will be sent as body
   * @param options Extra options to append to the headers
   * @param version The version of the backend API to use, will add 'v[version]' in the route if version is higher then 1
   */
  post(route: string, data: any, options: object, version: number): Observable<any> {
    route = '/api/' + (version > 1 ? 'v' + version.toString() + '/' : '') + route
    let headerObject: any = this.httpHeaders;
    if (options && Object.keys(options).length > 0) {
      headerObject = { ...this.httpHeaders, ...options };
    }

    return this.httpClient.post<any>(this.endPoint + route, data, headerObject)
      .pipe(
        retry(1),
        catchError(this.httpError.bind(this))
      )
  }

  /**
   * Sends a PUT request to the specified route
   * @param route The endpoint to send the data to. The domain will be added automatically
   * @param data The data which needs to be send, will be sent as body
   * @param options Additional options to send with the headers
   * @param version The version of the backend API to use, will add 'v[version]' in the route if version is higher then 1
   */
  put(route: string, data: any, options: any, version: number): Observable<any> {
    route = '/api/' + (version > 1 ? 'v' + version.toString() + '/' : '') + route
    let headerObject: any = this.httpHeaders;
    if (options && Object.keys(options).length > 0) {
      headerObject = { ...this.httpHeaders, ...options };
    }
    return this.httpClient.put<any>(this.endPoint + route, data, headerObject)
      .pipe(
        retry(1),
        catchError(this.httpError.bind(this))
      )
  }

  /**
   * Send a DELETE request to the specified route
   * @param route The endpoint to send the request to. The domain will be added automatically
   * @param options Additional options to send with the headers
   * @param version The version of the backend API to use, will add 'v[version]' in the route if version is higher then 1
   */
  delete(route: string, options: any, version: number): Observable<any> {
    route = '/api/' + (version > 1 ? 'v' + version.toString() + '/' : '') + route
    let headerObject: any = this.httpHeaders;
    if (options && Object.keys(options).length > 0) {
      headerObject = { ...this.httpHeaders, ...options };
    }
    return this.httpClient.delete<any>(this.endPoint + route, headerObject)
      .pipe(
        retry(1),
        catchError(this.httpError.bind(this))
      )
  }

  getApiBaseUrl(apiType: ApiTypes): any {
    let oldplatform = environment.oldPlatformUrl;
    switch (apiType) {
      case 'auth':
        return environment.AUTH_URL;
      case 'organization':
        return environment.ORGANIZATION_URL;
      case 'core':
        return environment.CORE_URL;
      case 'cashregistry':
        return environment.CASH_URL;
      case 'customer':
        return environment.CUSTOMER_URL;
      case 'bookkeeping':
        return environment.BOOKKEEPING_URL;
      case 'website-builder':
        return environment.WEBSITE_URL;
      case 'backup':
        return environment.BACKUP_URL;
      case 'log':
        return environment.LOG_URL;
      case 'fiskaly':
        return environment.FISKALY_URL;
      case 'JEWELS_AND_WATCHES':
        return environment.JEWELS_AND_WATCHES_URL;
      case 'cron':
        return environment.CRON_URL;
      case 'oldplatform':
        return oldplatform += ':3000';
    }
  }

  getNew(apiType: ApiTypes, url: string, header?: any): Observable<HttpResponse<any>> {
    this.setAPIHeaders();
    let finalUrl = this.getApiBaseUrl(apiType) + url;
    let finalHeaders = header && Object.keys(header).length > 0 ? header : this.defaultHeaders;
    let httpHeaders = {
      headers: new HttpHeaders(finalHeaders),
    }

    return this.httpClient.get<any>(finalUrl, httpHeaders)
      .pipe(
        catchError(this.httpError.bind(this)),
      );
  }

  // getNew(apiType: ApiTypes, url: string, header?: any): Observable<HttpResponse<any>> {
  //   let finalUrl = this.getApiBaseUrl(apiType) + url;
  //   let finalHeaders = header && Object.keys(header).length > 0 ? header : this.defaultHeaders;
  //   let httpHeaders = {
  //     headers: new HttpHeaders(finalHeaders),
  //   }

  //   return this.httpClient.get<any>(finalUrl, httpHeaders)
  //     .pipe(
  //       map(response => {
  //         return response;
  //       }),
  //       catchError(this.httpError.bind(this))
  //     );
  // }

  postNew(apiType: ApiTypes, url: string, data: any, header?: any): Observable<HttpResponse<any>> {
    let finalUrl = this.getApiBaseUrl(apiType) + url;
    let finalHeaders = header && Object.keys(header).length > 0 ? header : this.defaultHeaders;
    let httpHeaders = {
      headers: new HttpHeaders(finalHeaders),
    }
    return this.httpClient.post<any>(finalUrl, data, httpHeaders)
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.httpError.bind(this))
      );
  }
  fileUpload(apiType: ApiTypes, url: string, data: any, header?: any): Observable<HttpResponse<any>> {
    this.setAPIHeaders();
    let finalUrl = this.getApiBaseUrl(apiType) + url;
    let finalHeaders = header && Object.keys(header).length > 0 ? header : this.defaultHeaders;
    delete finalHeaders['Content-Type'];
    let httpHeaders = {
      headers: new HttpHeaders(finalHeaders),
    }
    return this.httpClient.post<any>(finalUrl, data, httpHeaders);
  }

  putNew(apiType: ApiTypes, url: string, data: any, header?: any): Observable<HttpResponse<any>> {
    this.setAPIHeaders();
    let finalUrl = this.getApiBaseUrl(apiType) + url;
    let finalHeaders = header && Object.keys(header).length > 0 ? header : this.defaultHeaders;
    let httpHeaders = {
      headers: new HttpHeaders(finalHeaders),
    }
    return this.httpClient.put<any>(finalUrl, data, httpHeaders)
      .pipe(catchError(this.httpError.bind(this)))
  }

  deleteNew(apiType: ApiTypes, url: string, header?: any): Observable<HttpResponse<any>> {
    this.setAPIHeaders();
    let finalUrl = this.getApiBaseUrl(apiType) + url;
    let finalHeaders = header && Object.keys(header).length > 0 ? header : this.defaultHeaders;
    let httpHeaders = {
      headers: new HttpHeaders(finalHeaders),
    }
    return this.httpClient.delete<any>(finalUrl, httpHeaders)
      .pipe(
        catchError(this.httpError.bind(this))
      );
  }
}
