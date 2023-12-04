import { Injectable } from '@angular/core';
import { liveQuery } from 'dexie';
import { db } from '../../indexDB/db';

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  constructor() { }

  getTaxRates(): any[] {
    // TODO: Get real taxes based on shop country
    return [
      {
        rate: 21,
        name: 'BTW Hoog'
      },
      {
        rate: 9,
        name: 'BTW Laag'
      },
      {
        rate: 0,
        name: 'Geen BTW'
      }
    ]
  }

  // Function for get location specific tax 
  async getLocationTax(request?: any) {
    if (request) {
      return await db.taxRates.get({ iLocationId: request.iLocationId });
    } else {
      return liveQuery(() => db.taxRates.toArray());
    }
  }

  async fetchDefaultVatRate(oBody: any) {
    let nVatRate = 21;
    const oTax: any = await this.getLocationTax({ iLocationId: oBody.iLocationId });
    if (oTax?.aRates?.length === 1) {
      nVatRate = oTax.aRates[0].nRate;
    } else if (oTax?.aRates?.length) {
      const _aVatRate = oTax?.aRates.map((oVat: any) => oVat.nRate);
      let nLargestVat = 0;
      for (let i = 0; i < _aVatRate?.length; i++) {
        if (_aVatRate[i] > nLargestVat) nLargestVat = _aVatRate[i]
      }
      if (nLargestVat) nVatRate = nLargestVat;
    }
    return nVatRate;
  }
}
