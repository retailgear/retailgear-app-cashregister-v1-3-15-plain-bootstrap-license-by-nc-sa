import { Component, OnInit } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { DialogService } from '../../../shared/service/dialog';
import { AddEditDropshipperComponent } from '../add-edit-dropshipper/add-edit-dropshipper.component';
import { ApiService } from '../../../shared/service/api.service';
@Component({
  selector: 'dropshipping-service',
  templateUrl: './dropshipping-service.component.html',
  styleUrls: ['./dropshipping-service.component.scss']
})

export class DropshippingServiceComponent implements OnInit {
  faPlus = faPlus;
  iBusinessId : any;
  dropShipperList: Array<any> = [];
  constructor(
    private dialogService: DialogService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness');
    this.fetchDropshipperList();
  }

  async addEditDropshipper(dropshipper?: any) {
    this.dialogService.openModal(AddEditDropshipperComponent, { cssClass: 'mw-50', context: { dropshipper } })
      .instance.close.subscribe(async (result: any) => {
        if (result == 'fetchList') {
          await this.apiService.postNew('cron', '/api/v1/cron/dropshipper', { iBusinessId: this.iBusinessId }).toPromise();
          this.fetchDropshipperList();
        }
      });
  }

  fetchDropshipperList(){
    this.dropShipperList = [];
    this.apiService.postNew('core', `/api/v1/dropshipper/list`, {iBusinessId : this.iBusinessId}).subscribe(
      (result : any) => {
        if(result?.data?.length > 0){
          this.dropShipperList = result.data[0].result;
        }
      }
    )
  }

  deleteShipper(shipper : any){
    this.apiService.deleteNew('core', `/api/v1/dropshipper/${shipper._id}?iBusinessId=${this.iBusinessId}`).subscribe(
      (result : any) => {
        if(result.message == 'success'){
          this.fetchDropshipperList();
        } 
      }
    )
  }
}
