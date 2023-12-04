import { Component, OnInit } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { DialogService } from 'src/app/shared/service/dialog';
import { AddEditCouponComponent } from '../add-edit-coupon/add-edit-coupon.component';
@Component({
  selector: 'coupon-service',
  templateUrl: './coupon-service.component.html',
  styleUrls: ['./coupon-service.component.sass']
})
export class CouponServiceComponent implements OnInit {
  faPlus = faPlus;
  constructor(
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
  }

  addEditCoupon() {
    this.dialogService.openModal(AddEditCouponComponent, { cssClass: 'w-fullscreen', context: {} })
      .instance.close.subscribe((result: any) => {

      });
  }

}
