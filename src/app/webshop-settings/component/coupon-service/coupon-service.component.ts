import { Component, OnInit } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { DialogService } from '../../../shared/service/dialog';
import { AddEditCouponComponent } from '../add-edit-coupon/add-edit-coupon.component';
import { ApiService } from '../../../shared/service/api.service';
@Component({
  selector: 'coupon-service',
  templateUrl: './coupon-service.component.html',
  styleUrls: ['./coupon-service.component.scss']
})
export class CouponServiceComponent implements OnInit {
  faPlus = faPlus;
  iBusinessId : any;
  couponList: Array<any> = [];
  constructor(
    private dialogService: DialogService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness');
    this.fetchCouponList();
  }

  addEditCoupon(couponDetails?: any) {
    this.dialogService.openModal(AddEditCouponComponent, { cssClass: 'mw-50', context: {couponDetails} })
      .instance.close.subscribe((result: any) => {
        if(result == 'fetchList'){
          this.fetchCouponList();
        }
      });
  }

  fetchCouponList(){
    this.couponList = [];
    this.apiService.getNew('cashregistry', `/api/v1/coupons/list/${this.iBusinessId}`).subscribe(
      (result : any) => {
        if(result?.data?.length > 0){
          this.couponList = result.data;
        }
      }
    )
  }

  deleteCoupon(coupon : any){
    this.apiService.deleteNew('cashregistry', `/api/v1/coupons/${this.iBusinessId}/${coupon._id}`).subscribe(
      (result : any) => {
        if(result.message == 'success'){
          // this.toastService.show({ type: 'success', text: 'COUPON_REMOVED' });
          this.fetchCouponList();
        } else {
          // this.toastService.show({ type: 'success', text: 'ERROR_WHILE_REMOVING_COUPON' });
        }
      }
    )
  }
}
