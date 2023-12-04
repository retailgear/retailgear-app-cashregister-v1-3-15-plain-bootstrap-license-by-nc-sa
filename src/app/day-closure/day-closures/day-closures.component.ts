import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';

@Component({
  selector: 'app-day-closures',
  templateUrl: './day-closures.component.html',
  styleUrls: ['./day-closures.component.sass']
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
  constructor(private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toastrService: ToastService
  ) {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.iWorkstationId = localStorage.getItem('currentWorkstation');

    const _oUser = localStorage.getItem('currentUser');
    if (_oUser) this.oUser = JSON.parse(_oUser);
    this.paginationConfig.currentPage = this.route?.snapshot?.queryParams?.page ? this.route?.snapshot?.queryParams?.page : this.paginationConfig.currentPage

  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastrService);
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
    this.fetchDayClosureList();
  }
  pageChanged(page: any) {
    this.requestParams.skip = (page - 1) * this.requestParams.limit;
    // this.requestParams.limit = page * this.requestParams.limit;

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
        iWorkstationId: [this.oSelectedWorkStation?._id],
      },
      ...this.requestParams
    }
    this.dayClosureListSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/list`, oBody).subscribe((result: any) => {
      if (result?.data?.length) {
        this.aDayClosure = result.data[0]?.result;
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

  goToView(iStatisticsId: any, dOpenDate: any, dCloseDate:any){
    this.router.navigate(['../../transactions-audit/view', iStatisticsId], { relativeTo: this.route, state: { dStartDate: dOpenDate, dEndDate: dCloseDate } }); 
  }

  ngOnDestroy(): void {
    if (this.listBusinessSubscription) this.listBusinessSubscription.unsubscribe();
    if (this.workstationListSubscription) this.workstationListSubscription.unsubscribe();
    if (this.dayClosureListSubscription) this.dayClosureListSubscription.unsubscribe();
  }

  // viewStatistics(oDayClosure: any) {
  // }
}
