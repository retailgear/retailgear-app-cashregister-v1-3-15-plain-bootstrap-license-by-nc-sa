import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../shared/service/api.service';
import { ToastService } from '../shared/components/toast/toast.service';
import { TillService } from '../shared/service/till.service';

@Component({
  selector: 'app-day-closure',
  templateUrl: './day-closure.component.html',
  styleUrls: ['./day-closure.component.scss']
})
export class DayClosureComponent implements OnInit, OnDestroy {

  iBusinessId: any;
  iLocationId: any;
  iWorkstationId: any;
  closingDayState: boolean = false;
  bIsDayStateOpened: boolean = false;
  bIsDayStateOpenLoading: boolean = false;
  closeSubscription !: Subscription;
  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private tillService: TillService
  ) { }

  async ngOnInit() {
    this.apiService.setToastService(this.toastService);
    this.iBusinessId = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.iWorkstationId = localStorage.getItem('currentWorkstation');
    await this.tillService.fetchSettings();
    this.isAnyDayStateOpened();
  }

  ngOnDestroy(): void {
    if (this.closeSubscription) this.closeSubscription.unsubscribe();
  }

  isAnyDayStateOpened() {
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId,
      sDayClosureMethod: this.tillService.settings?.sDayClosureMethod || 'workstation'
    }
    this.bIsDayStateOpenLoading = true;
    this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/check`, oBody).subscribe((result: any) => {
      this.bIsDayStateOpenLoading = false;
      if (result?.data?.bIsDayStateOpened && result?.data?.oStatisticDetail?._id) {
        this.bIsDayStateOpened = true;
        const oState = {
          dStartDate: result.data.oStatisticDetail.dOpenDate,
          dEndDate: result.data.oStatisticDetail.dCloseDate,
          bIsDayStateOpened: this.bIsDayStateOpened
        }
        this.router.navigate(['../transactions-audit/view', result.data.oStatisticDetail._id], { relativeTo: this.route, state: oState })
      }
    }, (error) => {
      this.bIsDayStateOpenLoading = false;
      console.error('Error here: ', error);
      this.toastService.show({ type: 'warning', text: `Day-state is not closed` });
    })
  }
}
