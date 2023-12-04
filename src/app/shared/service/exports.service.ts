import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ExportsService {

  constructor(
    private apiService: ApiService
  ) { }

  createExportRecord(iBusinessId: any, data: any){
    this.apiService.postNew('core', '/api/v1/exports/' + iBusinessId, data).subscribe(
      (response : any) => {}
    )
  }
}
