import { Component, Input, OnInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { DialogComponent } from "../../service/dialog";
import { faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import { DialogService } from '../../service/dialog';
import { ApiService } from '../../service/api.service';
import { TransactionItemsDetailsComponent } from '../transaction-items-details/transaction-items-details.component';
import { TillService } from '../../service/till.service';
import { ToastService } from '../toast';

@Component({
  selector: 'app-customer-activities',
  templateUrl: './customer-activities.component.html',
  styleUrls: ['./customer-activities.component.scss']
})
export class CustomerActivitiesDialogComponent implements OnInit {
  @Input() customer: any;
  dialogRef: DialogComponent

  faTimes = faTimes
  loading = false
  showLoader = false;
  totalActivities = 0;
  business: any = {}
  activities: Array<any> = [];
  
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: '10',
    currentPage: 1,
    totalItems: 0
  };
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageCount:any = 10;
  page = 1;

  iBusinessId: any = localStorage.getItem("currentBusiness");
  requestParams: any = {
    searchValue: '',
    limit: 5,
    skip: 0
  }

  constructor(
    private viewContainer: ViewContainerRef,
    private dialogService: DialogService,
    private apiService: ApiService,
    private toastService: ToastService,
    private tillService: TillService) {
    const _injector = this.viewContainer.injector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.requestParams.iBusinessId = this.iBusinessId;
    if (this.customer?.activityData) {
      this.activities = this.customer?.activityData;
      this.paginationConfig.totalItems = this.activities?.length;
    } else {
      this.findTransactions()
    }
  }


  changeItemsPerPage(pageCount: any) {
    this.paginationConfig.itemsPerPage = pageCount;
    // this.findTransactions();
  }

  // Function for trigger event after page changes
  pageChanged(page: any) {
    this.requestParams.skip = (page - 1) * parseInt(this.paginationConfig.itemsPerPage);
    // this.findTransactions();
    this.paginationConfig.currentPage = page;
  }

  findTransactions() {
    this.activities = [];
    this.totalActivities = 0;
    this.requestParams.type = 'transaction';
    this.requestParams.limit = this.paginationConfig.itemsPerPage || 50;
    this.showLoader = true;
    this.apiService.postNew('cashregistry', `/api/v1/activities/customer/${this.customer._id}`, this.requestParams).subscribe((result: any) => {
      this.showLoader = false;
      if(result?.data?.length && result?.data[0]?.result?.length) {
        this.paginationConfig.totalItems = result?.data[0].count[0].totalData;
        this.activities = result?.data[0]?.result.map((item: any) => {
          item.sBagNumbers = (item?.aActivityItemMetaData?.length) ? item.aActivityItemMetaData.map((el: any) => el.sBagNumber).join(',') : '';
          return item;
        });
        this.totalActivities = result?.data[0].count[0].totalData;
      } else {
        this.close(false);
      }

    }, (error) => {
      this.showLoader = false;
    })
  }

  openTransaction(transaction: any, itemType: any) {
    // console.log('transaction search openTransaction: ', transaction, itemType);
    this.dialogService.openModal(TransactionItemsDetailsComponent, { cssClass: "modal-xl", context: { transaction, itemType } }).instance.close.subscribe(result => {
      // console.log('transaction search response of transaction item details component: ', result);
      if(result?.transaction) {
        // console.log('now sending to tillservice processTransactionSearchResult')
        const temp = this.tillService.processTransactionSearchResult(result);
        // console.log('response of tillservice processTransactionSearchResult closing search dialog', temp)
        this.close(temp);
      }
    });
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }
}
