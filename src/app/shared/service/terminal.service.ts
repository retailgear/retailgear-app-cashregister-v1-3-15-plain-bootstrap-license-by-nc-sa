import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TerminalService {
  iBusinessId = localStorage.getItem('currentBusiness');
  iLocationId = localStorage.getItem('currentLocation');
  iWorkstationId = localStorage.getItem('currentWorkstation');
  
  constructor(private apiService: ApiService) { }

  refetchId() {
    this.iBusinessId = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.iWorkstationId = localStorage.getItem('currentWorkstation');
  }

  getTerminals(): Observable<any> {
    this.refetchId();
    return this.apiService.getNew('cashregistry', `/api/v1/pin-terminal/get-terminals?iBusinessId=${this.iBusinessId}&iLocationId=${this.iLocationId}`);
  }

  startTerminalPayment(amount: number, sProvider?:string): Observable<any> {
    const oBody = {
      amount,
      iBusinessId: this.iBusinessId, 
      iWorkstationId: this.iWorkstationId,
      sProvider
    }
    return this.apiService.postNew('cashregistry', `/api/v1/pin-terminal/start-payment`, oBody).pipe(retry(1));
  }


  getGiftCardInformation(cardDetails: any): Observable<any> {
    cardDetails.iBusinessId = this.iBusinessId;
    return this.apiService.postNew('cashregistry', `/api/v1/pin-terminal/get-giftcard`, cardDetails).pipe(retry(1));
  }
}