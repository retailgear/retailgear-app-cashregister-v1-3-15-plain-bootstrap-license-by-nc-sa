import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/shared/service/api.service';
import { DialogComponent } from "../../../shared/service/dialog";

@Component({
  selector: 'app-add-edit-coupon',
  templateUrl: './add-edit-coupon.component.html',
  styleUrls: ['./add-edit-coupon.component.sass']
})
export class AddEditCouponComponent implements OnInit {

  dialogRef: DialogComponent;

  faTimes = faTimes;

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService
  ) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  save() {

  }
}
