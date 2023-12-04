import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { TillService } from '../../shared/service/till.service';

@Component({
  selector: 'app-day-closures',
  templateUrl: './day-closures.component.html',
  styleUrls: ['./day-closures.component.scss']
})
export class DayClosuresComponent implements OnInit, OnDestroy {

  showLoader: boolean = false;
  aDayClosure: any = [];
  iBusinessId: any = '';

  iLocationId: any = '';
  aLocation: any = [];
  aSelectedLocation: any;

  iWorkstationId: any;
  aWorkStation: any = [];
  aWorkStationList: any = [];
  oSelectedWorkStation: any;

  oUser: any = {};

  listBusinessSubscription !: Subscription;
  workstationListSubscription !: Subscription;
  dayClosureListSubscription !: Subscription;
  requestParams: any = {
    skip: 0,
    limit: 25,
    sortOrder: 'descend'
  };
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: 25,
    currentPage: 1,
    totalItems: 0
  };
  sDayClosureMethod:any;
  constructor(private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toastrService: ToastService,
    public tillService: TillService
  ) {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation');

    const _oUser = localStorage.getItem('currentUser');
    if (_oUser) this.oUser = JSON.parse(_oUser);
    this.paginationConfig.currentPage = this.route?.snapshot?.queryParams?.page ? this.route?.snapshot?.queryParams?.page : this.paginationConfig.currentPage
    
  }
  
  async ngOnInit() {
    this.apiService.setToastService(this.toastrService);
    await this.tillService.fetchSettings();
    this.sDayClosureMethod = this.tillService.settings?.sDayClosureMethod || 'workstation';
    // console.log(this.sDayClosureMethod, this.tillService.settings);
    this.fetchDayClosureList();
    this.fetchBusinessLocation();
    this.getWorkstations();
  }

  fetchBusinessLocation() {
    if (!this.oUser?.userId) return;
    this.listBusinessSubscription = this.apiService.postNew('core', `/api/v1/business/${this.iBusinessId}/list-location`, { iBusinessId: this.iBusinessId }).subscribe((result: any) => {
      if (result?.data?.aLocation?.length) this.aLocation = result.data.aLocation;
    }, (error) => {
      console.log('error: ', error);
    })
  }

  getWorkstations() {
    this.workstationListSubscription = this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.iBusinessId}`).subscribe(
      (result: any) => {
        if (result && result.data?.length) this.aWorkStationList = result.data;
      }),
      (error: any) => {
        console.error(error)
      }
  }
  
  changeItemsPerPage(pageCount: any) {
    this.paginationConfig.itemsPerPage = pageCount;
    this.requestParams.skip = 0;
    this.paginationConfig.currentPage = 1; 
    this.fetchDayClosureList();
  }

  pageChanged(page: any) {
    this.requestParams.skip = (page - 1) * this.requestParams.limit;
    this.fetchDayClosureList();
    this.paginationConfig.currentPage = page;
  }

  fetchDayClosureList() {
    this.aDayClosure = [];
    this.showLoader = true;
    const oBody = {
      iBusinessId: this.iBusinessId,
      oFilter: {
        iLocationId: this.iLocationId,
        aLocationId: this?.aSelectedLocation?.length ? this.aSelectedLocation : [],
      },
      ...this.requestParams
    }

    if (this.tillService.settings?.sDayClosureMethod === 'workstation') {
      oBody.iWorkstationId = [this.oSelectedWorkStation?._id];
    }
    this.dayClosureListSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/list`, oBody).subscribe((result: any) => {
      if (result?.data?.length) {
        this.aDayClosure = result.data[0]?.result.map((el:any) => {
          el.nTotalRevenue = +(el.aRevenuePerBusinessPartner.reduce((a:any, b:any) => a + b.nTotalRevenue, 0).toFixed(2));
          el.nPaymentMethodTotal = +(el.aPaymentMethods.reduce((a: any, b: any) => a + b.nAmount, 0).toFixed(2));
          return el;
        });
        
        this.paginationConfig.totalItems = result.data[0].count.totalData;

      }
      this.showLoader = false;
    }, (error) => {
      console.log('error: ', error);
      this.showLoader = false;
    })
  }

  selectedLocationChanged(){
    this.aWorkStation = [];
    this.oSelectedWorkStation = undefined;
    this.aWorkStation = this.aWorkStationList.filter((workstation:any)=> this.aSelectedLocation.includes(workstation.iLocationId));
  }

  goToView(item:any){
    this.router.navigate(
      ['../../transactions-audit/view', item._id], 
      { 
        relativeTo: this.route, 
        state: { 
          dStartDate: item.dOpenDate, 
          dEndDate: item.dCloseDate,
          iLocationId: item.iLocationId,
          iWorkstationId: item.iWorkstationId
        }
      }); 
  }

  ngOnDestroy(): void {
    if (this.listBusinessSubscription) this.listBusinessSubscription.unsubscribe();
    if (this.workstationListSubscription) this.workstationListSubscription.unsubscribe();
    if (this.dayClosureListSubscription) this.dayClosureListSubscription.unsubscribe();
  }
}
