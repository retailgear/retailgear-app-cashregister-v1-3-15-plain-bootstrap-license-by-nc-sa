import { Component, OnInit } from '@angular/core';
import { faSearch, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shared/service/api.service';
import { DialogService } from '../shared/service/dialog';
import { ToastService } from '../shared/components/toast';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CustomerGroupDetailComponent } from '../shared/components/customer-group-detail/customer-group-detail.component';
@Component({
  selector: 'app-customers-group',
  templateUrl: './customers-group.component.html',
  styleUrls: ['./customers-group.component.scss']
})
export class CustomersGroupComponent implements OnInit {

 
  faSearch = faSearch;
  faTrash = faTrash;
  faEdit = faEdit;
  headerColumn: any = ['NAME', 'DESCRIPTION'];
  iBusinessId: any;
  iLocationId: any;
  showLoader: Boolean = false;
  requestParams: any = {
    skip: 0,
    limit: 10,
    searchValue: '',
    sortBy: '',
    sortOrder: 'desc'
  }
  groupList: Array<any> = [];
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };
  translate: any = [];

  constructor(private apiService: ApiService,
    private dialogService: DialogService,
    private toastService: ToastService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    const translate = ['GROUP_DELETE_SUCCESSFULLY'];
    this.translateService.get(translate).subscribe((res: any) => {
      this.translate = res;
    })
    this.iBusinessId = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.getCustomersGroupList();
  }

  getCustomersGroupList(isPageChanged?: boolean) {
    if (this.requestParams.sSearchValue && !isPageChanged) this.resetThePagination();
    this.showLoader = true;
    this.groupList = [];
    this.requestParams.iBusinessId = this.iBusinessId;
    this.requestParams.iLocationId = this.iLocationId;
    this.apiService.postNew('customer', '/api/v1/group/list', this.requestParams).subscribe((res: any) => {
      this.showLoader = false;
      if (res?.message == 'success') {
        if (res?.data?.length) {
          this.paginationConfig.totalItems = res?.data[0]?.count?.totalData;
          this.groupList = res?.data[0]?.result
        }
      }
    })
  }
  

  resetThePagination() {
    this.requestParams.skip = 0;
    this.paginationConfig.currentPage = 1; 
    this.requestParams.limit = parseInt(this.paginationConfig.itemsPerPage);
  }

  changeItemsPerPage() {
    this.resetThePagination();
    this.getCustomersGroupList();
  }

  pageChanged(selctedPage: any) {
    this.requestParams.skip = (selctedPage - 1) * parseInt(this.paginationConfig.itemsPerPage);
    this.paginationConfig.currentPage = selctedPage;
    this.getCustomersGroupList(true);
  }

  editCustomersGroup(group: any) {
    const group1 = group;
    this.dialogService.openModal(CustomerGroupDetailComponent, { cssClass: "modal-lg", context: { mode: 'update', customerGroup: group1 } }).instance.close.subscribe((result: any) => {
      console.log(result);
      // if(result?.action) this.getCustomersGroupList()
    })
  }

  deleteCustomersGroup(group: any) {
    let confirmBtnDetails = [
      { text: "DELETE_GROUP", value: 'remove', status: 'success', class: 'ml-auto mr-2' },
      { text: "CANCEL", value: 'close' }
    ];
    this.dialogService.openModal(ConfirmationDialogComponent, { context: { header: 'DELETE_GROUP', bodyText: 'ARE_YOU_SURE_TO_DELETE_THIS_GROUP', buttonDetails: confirmBtnDetails } })
      .instance.close.subscribe(
        (status: any) => {
          if (status == 'remove') {
            this.apiService.postNew('customer', '/api/v1/group/delete', { _id: group._id, iBusinessId: this.iBusinessId }).subscribe((res: any) => {
              if (res?.message == 'success') {
                this.getCustomersGroupList();
                this.toastService.show({ type: 'success', text: this.translate['GROUP_DELETE_SUCCESSFULLY'] })
              } else {
                this.toastService.show({ type: 'warning', text: res.message });
              }
            })
          }
        })

  }

  createGroup() {
    this.dialogService.openModal(CustomerGroupDetailComponent, { cssClass: "modal-lg", context: { mode: 'create' } }).instance.close.subscribe((result: any) => {
      if (result?.action) this.getCustomersGroupList()
    })
  }

}
