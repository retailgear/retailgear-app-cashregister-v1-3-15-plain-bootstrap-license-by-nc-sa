import { Subscription } from 'rxjs';
import { Component, OnInit, HostListener, ViewChild, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../shared/service/api.service';
import { ToastService } from '../shared/components/toast/toast.service';

@Component({
  selector: 'app-day-closure',
  templateUrl: './day-closure.component.html',
  styleUrls: ['./day-closure.component.sass']
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
    private route: ActivatedRoute
  ) { }


  @ViewChild('adminFrame') iframe: any;

  @HostListener('window:message', ['$event'])
  onMessage(e: any) {
    if (e.data && e.data.for == 'frame loaded') {
      setTimeout(() => {
        this.onFrameLoad();
      }, 500);
    }
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.iBusinessId = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.iWorkstationId = localStorage.getItem('currentWorkstation');
    this.isAnyDayStateOpened();
  }

  onFrameLoad(): void {
    if (this.iframe == null) return;
    let iWindow = this.iframe.nativeElement.contentWindow;
    if (iWindow == null) return;
    iWindow.postMessage({ "parentOrigin": window.location.origin }, 'http://localhost:4002');
  }

  ngOnDestroy(): void {
    if (this.closeSubscription) this.closeSubscription.unsubscribe();
  }

  isAnyDayStateOpened() {
    const oBody = {
      iBusinessId: this.iBusinessId,
      iLocationId: this.iLocationId,
      iWorkstationId: this.iWorkstationId
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
