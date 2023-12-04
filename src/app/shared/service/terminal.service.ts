import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TerminalService {

  constructor(private apiService: ApiService) { }

  getTerminals(): Observable<any> {
    const iBusinessId = localStorage.getItem('currentBusiness');
    return this.apiService.getNew('cashregistry', `/api/v1/pin-terminal/get-terminals?iBusinessId=${iBusinessId}`).pipe(retry(1));
  }

  startTerminalPayment(amount: number): Observable<any> {
    const iBusinessId = localStorage.getItem('currentBusiness');
    return this.apiService.postNew('cashregistry', `/api/v1/pin-terminal/start-payment`, { amount }).pipe(retry(1));
  }


  getGiftCardInformation(cardDetails: any): Observable<any> {
    const iBusinessId = localStorage.getItem('currentBusiness');
    cardDetails.iBusinessId = iBusinessId;
    return this.apiService.postNew('cashregistry', `/api/v1/pin-terminal/get-giftcard`, cardDetails).pipe(retry(1));
  }
}