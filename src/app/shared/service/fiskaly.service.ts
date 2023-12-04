import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { retry } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FiskalyService {
  fiskalyURL = environment.fiskalyURL;
  iBusinessId = localStorage.getItem('currentBusiness');
  iLocationId = localStorage.getItem('currentLocation');
  iWorkstationId = localStorage.getItem('currentWorkstation');
  tssId: any;
  fiskalyAuth: any;
  client: any;

  constructor(
    private apiService: ApiService,
    private httpClient: HttpClient) { }


  async loginToFiskaly() {
    this.fiskalyAuth = await this.apiService.postNew('fiskaly', '/api/v1/fiskaly/login', { iBusinessId: this.iBusinessId }).toPromise();
  }

  setTss(id: any) {
    this.tssId = id;
  }

  async startTransaction() {
    if (!this.fiskalyAuth) await this.loginToFiskaly();

    const guid = uuidv4();
    if (!this.tssId) this.fetchTSS();

    const clientId = await this.getClientId();
    const body = {
      'state': 'ACTIVE',
      'client_id': clientId
    };
    const finalUrl = `${this.fiskalyURL}/tss/${this.tssId}/tx/${guid}?tx_revision=1`;
    let httpHeaders = {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.fiskalyAuth.access_token}` }
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
      let vat_amount = '0.00';
      let amount = (element.priceInclVat || element.price) - ((element.priceInclVat || element.price) / (1 + (element.tax / 100))) * element.quantity;
      if (amount) {
        vat_amount = String(this.roundToXDigits(amount));
      }
      amounts_per_vat_rate.push({
        vat_rate: 'NORMAL',
        amount: vat_amount,
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
    if (!this.fiskalyAuth) await this.loginToFiskaly();


    if (!this.tssId) this.fetchTSS();

    const schema = this.createSchema(transactionItems);
    const fiskalyTransaction: any = JSON.parse(localStorage.getItem('fiskalyTransaction') || '');
    if (state === 'FINISHED') {
      const paymentObj = this.paymentObject(payments);
      schema.standard_v1.receipt.amounts_per_payment_type = paymentObj;
    }

    const clientId = await this.getClientId();
    const body = {
      state,
      client_id: clientId,
      schema
    };
    const finalUrl = `${this.fiskalyURL}/tss/${this.tssId}/tx/${fiskalyTransaction._id}?tx_revision=${fiskalyTransaction.revision + 1}`;
    let httpHeaders = {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.fiskalyAuth.access_token}` }
    }
    return this.httpClient.put<any>(finalUrl, body, httpHeaders).toPromise();
  }

  async getClientId() {
    if (this.client?.clientInfo?._id) {
      return this.client?.clientInfo?._id;
    }
    await this.createClient();
    return this.client.clientInfo._id;
  }

  async createTSS(location: string) {
    if (!this.fiskalyAuth) await this.loginToFiskaly();
    return this.apiService.postNew('fiskaly', `/api/v1/tss/create/${this.iBusinessId}`, { fiskalyToken: this.fiskalyAuth.access_token, location }).toPromise();
  }

  fetchTSS() {
    this.apiService.getNew('fiskaly', `/api/v1/tss/get/${this.iBusinessId}/${this.iLocationId}`).subscribe((result: any) => {
      if (result?._id) {
        this.setTss(result._id)
      }
    });
  }

  async createClient() {
    // console.log('fs create client')
    if (!this.fiskalyAuth) {
      await this.loginToFiskaly();
    }
    const body = {
      fiskalyToken: this.fiskalyAuth.access_token,
      location: this.iLocationId,
      currentWorkstation: this.iWorkstationId,
      tssId: this.tssId
    };
    this.client = await this.apiService.postNew('fiskaly', `/api/v1/tss/fetch-client/${this.iBusinessId}`, body).toPromise();
  }

  async getTSSList() {
    // if(!this.fiskalyAuth) await this.loginToFiskaly();
    return this.apiService.getNew('fiskaly', `/api/v1/tss/list/${this.iBusinessId}`).toPromise();
  }

  async changeTSSState(location: any, bEnabled: boolean, bRemoveFromLive: boolean = false) {
    const body = {
      bEnabled,
      iTssId: location.iTssId,
      bRemoveFromLive,
      sLiveTssId: '',
      fiskalyToken: '',
      admin_puk: ''
    };
    if (bRemoveFromLive) {
      body.fiskalyToken = this.fiskalyAuth.access_token;
      body.sLiveTssId = location.tssInfo._id;
      body.admin_puk = location.tssInfo.admin_puk;
    }
    return await this.apiService.putNew('fiskaly', `/api/v1/tss/change-state/${this.iBusinessId}`, body).toPromise();
  }

  clearAll() {
    this.tssId = null;
    this.fiskalyAuth = null;
    this.client = null;
  }
}
