import { Injectable } from '@angular/core';
import { retry } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import * as _ from 'lodash';

import { ApiService } from './api.service';
import { StringService } from './string.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FiskalyService {
  fiskalyURL = environment.fiskalyURL;
  constructor(
    private apiService: ApiService,
    private stringService: StringService,
    private httpClient: HttpClient) { }


  async loginToFiskaly() {
    const iBusinessId = localStorage.getItem('currentBusiness');
    const result = await this.apiService.postNew('fiskaly', '/api/v1/fiskaly/login', {iBusinessId}).toPromise();
    localStorage.setItem('fiskalyAuth', JSON.stringify(result));
    return result;
  }

  async startTransaction() {
    console.log("-----------service fiskaly----------------");
    let fiskalyAuth: any = localStorage.getItem('fiskalyAuth');
    if (!fiskalyAuth) {
      fiskalyAuth = await this.loginToFiskaly();
    }
    fiskalyAuth = JSON.parse(fiskalyAuth);
    const guid = uuidv4();
    let tssId = await this.fetchTSS();
    if (!tssId) {
      return;
    }
    const clientId = await this.getClientId(tssId);
    const body = {
      'state': 'ACTIVE',
      'client_id': clientId
    };
    const finalUrl = `${this.fiskalyURL}/tss/${tssId}/tx/${guid}?tx_revision=1`;
    let httpHeaders = {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fiskalyAuth.access_token}` }
    }
    return await this.httpClient.put<any>(finalUrl, body, httpHeaders)
      .pipe(retry(1)).toPromise();
  }

  roundToXDigits(value: number) {
    const digits = 2;
    value = value * Math.pow(10, digits);
    value = Math.round(value);
    value = value / Math.pow(10, digits);
    return value.toFixed(2);
  }

  transactionItemObject(transactionItems: any) {
    const amounts_per_vat_rate: any = [];
    transactionItems.forEach((element: any) => {
      const amount = (element.priceInclVat || element.price) - ((element.priceInclVat || element.price) / (1 + (element.tax / 100))) * element.quantity;
      amounts_per_vat_rate.push({
        vat_rate: 'NORMAL',
        amount: String(this.roundToXDigits(amount)),
      });
    });
    return amounts_per_vat_rate;
  }

  paymentObject(payment: any) {
    const amounts_per_payment_type: any = [];
    const cashArr = payment.filter((o: any) => o.sName.toLowerCase() === 'cash');
    const nCashArr = payment.filter((o: any) => o.sName.toLowerCase() !== 'cash');
    amounts_per_payment_type.push({
      payment_type: 'CASH',
      amount: String(this.roundToXDigits(_.sumBy(cashArr, 'amount') || 0)),
    });
    amounts_per_payment_type.push({
      payment_type: 'NON_CASH',
      amount: String(this.roundToXDigits(_.sumBy(nCashArr, 'amount') || 0)),
    });
    return amounts_per_payment_type;
  }

  createSchema(transactionItems: any) {
    const amounts_per_vat_rate = this.transactionItemObject(transactionItems);
    const schema = {
      standard_v1: {
        receipt: {
          receipt_type: 'RECEIPT',
          amounts_per_vat_rate,
          amounts_per_payment_type: [
            {
              payment_type: 'NON_CASH',
              amount: '0.00'
            }, {
              payment_type: 'CASH',
              amount: '0.00'
            }
          ]
        }
      }
    }
    return schema;
  }
  async updateFiskalyTransaction(transactionItems: any, payments: any, state: string) {
    let fiskalyAuth: any = localStorage.getItem('fiskalyAuth');
    if (!fiskalyAuth) {
      fiskalyAuth = await this.loginToFiskaly();
    }
    let tssId = await this.fetchTSS();
    if (!tssId) {
      return;
    };
    fiskalyAuth = JSON.parse(fiskalyAuth);

    const schema = this.createSchema(transactionItems);
    let fiskalyTransaction: any = localStorage.getItem('fiskalyTransaction');
    if (state === 'FINISHED') {
      const paymentObj = this.paymentObject(payments);
      schema.standard_v1.receipt.amounts_per_payment_type = paymentObj;
    }
    fiskalyTransaction = JSON.parse(fiskalyTransaction);
    const clientId = await this.getClientId(tssId);
    const body = {
      state,
      client_id: clientId,
      schema
    };
    const finalUrl = `${this.fiskalyURL}/tss/${tssId}/tx/${fiskalyTransaction._id}?tx_revision=${fiskalyTransaction.revision + 1}`;
    let httpHeaders = {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fiskalyAuth.access_token}` }
    }
    return await this.httpClient.put<any>(finalUrl, body, httpHeaders).toPromise();
  }

  async getClientId(tssId: string) {
    const clientId = localStorage.getItem('clientId');
    if (clientId) {
      return clientId;
    }
    const client: any = await this.createClient(tssId);
    localStorage.setItem('clientId', client.clientInfo._id);
    return client.clientInfo._id;
  }

  async createTSS(location: string) {
    let fiskalyAuth: any = localStorage.getItem('fiskalyAuth');
    fiskalyAuth = JSON.parse(fiskalyAuth);
    if (!fiskalyAuth) {
      fiskalyAuth = await this.loginToFiskaly();
    }
    const iBusinessId = localStorage.getItem('currentBusiness');
    return this.apiService.postNew('fiskaly', `/api/v1/tss/create/${iBusinessId}`, { fiskalyToken: fiskalyAuth.access_token, location }).toPromise();
  }

  async fetchTSS() {
    let tssId = localStorage.getItem('tssId');
    if (!tssId) {
      const location = localStorage.getItem('currentLocation') || 'asperen';
      const iBusinessId = localStorage.getItem('currentBusiness');
      const result: any = await this.apiService.getNew('fiskaly', `/api/v1/tss/get/${iBusinessId}/${location}`).toPromise();
      if (result) {
        localStorage.setItem('tssId', result._id);
        tssId = result._id;
      }
    }
    return tssId;
  }

  async createClient(tssId: string) {
    let fiskalyAuth: any = localStorage.getItem('fiskalyAuth');
    fiskalyAuth = JSON.parse(fiskalyAuth);
    const iBusinessId = localStorage.getItem('currentBusiness');
    if (!fiskalyAuth) {
      fiskalyAuth = await this.loginToFiskaly();
    }
    const body = {
      fiskalyToken: fiskalyAuth.access_token,
      location: localStorage.getItem('currentLocation') || 'asperen',
      currentWorkstation: localStorage.getItem('currentWorkstation'),
      tssId
    };
    return await this.apiService.postNew('fiskaly', `/api/v1/tss/fetch-client/${iBusinessId}`, body).toPromise();
  }

  getTSSList() {
    const iBusinessId = localStorage.getItem('currentBusiness');
    return this.apiService.getNew('fiskaly', `/api/v1/tss/list/${iBusinessId}`);
  }

  async changeTSSState(iTssId: string, bEnabled: boolean) {
    const iBusinessId = localStorage.getItem('currentBusiness');
    const body = {
      bEnabled,
      iTssId
    };
    return await this.apiService.putNew('fiskaly', `/api/v1/tss/change-state/${iBusinessId}`, body).toPromise();

  }
}