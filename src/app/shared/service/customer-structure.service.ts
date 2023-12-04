import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerStructureService {

  constructor(private apiService: ApiService,
    private translateService: TranslateService) { }


  makeCustomerName = (customer: any) => {
    if (!customer) {
      return '';
    }
    let result = '';
    if (customer.sSalutation) {
      this.translateService.get(customer.sSalutation.toUpperCase()).subscribe((res) => {
        result += res + ' ';
      });
    }
    if (customer.sFirstName) {
      result += customer.sFirstName + ' ';
    }
    if (customer.sPrefix) {
      result += customer.sPrefix + ' ';
    }

    if (customer.sLastName) {
      result += customer.sLastName;
    }

    return result;
  }


  makeCustomerAddress(address: any, includeCountry: boolean) {
    if (!address) {
      return '';
    }
    let result = '';
    if (address.sStreet) {
      result += address.sStreet + ' ';
    }
    if (address.sHouseNumber) {
      result += address.sHouseNumber + (address.sHouseNumberSuffix ? '' : ' ');
    }
    if (address.sHouseNumberSuffix) {
      result += address.sHouseNumberSuffix + ' ';
    }
    if (address.sPostalCode) {
      result += this.formatZip(address.sPostalCode) + ' ';
    }
    if (address.sCity) {
      result += address.sCity;
    }
    if (includeCountry && address.sCountry) {
      result += address.sCountry;
    }
    return result;
  }

  formatZip(zipcode: string) {
    if (!zipcode) {
      return '';
    }
    return zipcode.replace(/([0-9]{4})([a-z]{2})/gi, (original, group1, group2) => {
      return group1 + ' ' + group2.toUpperCase();
    });
  }

}