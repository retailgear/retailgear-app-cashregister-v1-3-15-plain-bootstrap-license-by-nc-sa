import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faLongArrowAltDown, faLongArrowAltUp, faMinusCircle, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { ActivityDetailsComponent } from '../shared/components/activity-details-dialog/activity-details.component';
import { CardsComponent } from '../shared/components/cards-dialog/cards-dialog.component';
import { ToastService } from '../shared/components/toast';
import { ApiService } from '../shared/service/api.service';
import { BarcodeService } from '../shared/service/barcode.service';
import { DialogService } from '../shared/service/dialog';
import { MenuComponent } from '../shared/_layout/components/common';

@Component({
  selector: 'app-activity-items',
  templateUrl: './activity-items.component.html',
  styleUrls: ['./activity-items.component.sass'],
  providers: [BarcodeService]
})
export class ActivityItemsComponent implements OnInit, OnDestroy {

  pageCounts: Array<number> = [10, 25, 50, 100]
  pageCount: number = 10;
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: '10',
    currentPage: 1,
    totalItems: 0
  };
  importStatus: string = 'all';
  businessDetails: any = {};
  iLocationId: String | null | undefined;
  requestParams: any = {
    create: {
      minDate: new Date('01-01-2015'),
      maxDate: new Date(new Date().setHours(23, 59, 59)),
    },
    estimate: {
      minDate: undefined,
      maxDate: undefined
    },
    // sortBy: { key: 'dCreatedDate', selected: true, sort: 'asc' },
    sortBy: 'dCreatedDate',
    sortOrder: 'desc',
    selectedRepairStatuses: [],
    selectedWorkstations: [],
    locations: [],
    selectedLocations: [],
    selectedKind: [],
    aSelectedBusinessPartner: [],
    iEmployeeId: '',
    iAssigneeId: '',
  };
  activityItems: Array<any> = [];
  showLoader: Boolean = false;
  faSearch = faSearch;
  faIncrease = faPlusCircle;
  faDecrease = faMinusCircle;
  faArrowUp = faLongArrowAltUp;
  faArrowDown = faLongArrowAltDown;
  sSearchValue: string = '';
  showAdvanceSearch = false;

  workstations: Array<any> = [];
  employees: Array<any> = [];
  repairStatuses: Array<any> = ['new', 'info', 'processing', 'cancelled', 'inspection', 'completed', 'refund',
    'refundInCashRegister', 'offer', 'offer-is-ok', 'offer-is-not-ok', 'to-repair', 'part-are-order', 'shipped-to-repair', 'delivered'
  ]

  aKind: Array<any> = ['reservation', 'repair', 'giftcard', 'order', 'gold-purchase', 'gold-sell', 'offer', 'refund']
  methodValue: string = 'All';
  transactionValue: string = 'All';
  aFilterBusinessPartner: any = [];

  tableHeaders: Array<any> = [
    { key: 'ACTIVITY_NO', selected: false, sort: 'asc' },
    { key: 'REPAIR_NUMBER', selected: false, sort: 'asc' },
    { key: 'INTAKE_DATE', selected: true, sort: 'asc' },
    { key: 'ESTIMATED_DATE', selected: false, sort: 'asc' },
    { key: 'STATUS', selected: false, sort: 'asc' },
    { key: 'SUPPLIER_REPAIR', disabled: true },
    { key: 'CUSTOMER', disabled: true },
    { key: 'ACTION' , disabled:true }
  ]

  selectedProperties: any;
  propertyOptions: Array<any> = [];
  aPropertyOptionIds: Array<any> = [];
  aProperty: Array<any> = [];
  propertyListSubscription!: Subscription;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private routes: Router,
    private toastrService: ToastService,
    private barcodeService: BarcodeService,
  ) { }

  async ngOnInit() {
    this.apiService.setToastService(this.toastrService);
    this.businessDetails._id = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.loadTransaction();

    const [_locationData, _workstationData, _employeeData]: any = await Promise.all([
      this.getLocations(),
      this.getWorkstations(),
      this.listEmployee()
    ]);

    this.apiService.activityItemDetails.subscribe((res:any)=>{
      let updatedActivityIndex= this.activityItems.findIndex((activity)=> activity._id == res._id)
      if(updatedActivityIndex != -1){
        this.activityItems[updatedActivityIndex] = res;
      }
    })

    if (_locationData.message == 'success') {
      this.requestParams.locations = _locationData.data.aLocation;
    }

    if (_workstationData && _workstationData.data) {
      this.workstations = _workstationData.data;
    }

    if (_employeeData?.data?.length && _employeeData.data[0]?.result?.length) {
      this.employees = _employeeData.data[0].result
    }

    this.getProperties();

    this.barcodeService.barcodeScanned.subscribe((barcode: string) => {
      this.openModal(barcode);
    });
  }

  loadTransaction() {
    this.activityItems = [];
    this.requestParams.iBusinessId = this.businessDetails._id;
    this.requestParams.limit = this.paginationConfig.itemsPerPage || 50;
    if (this.requestParams?.selectedKind?.length) this.requestParams.selectedKind = this.requestParams.selectedKind

    if (this.iLocationId) this.requestParams.iLocationId = this.iLocationId;
    this.showLoader = true;
    const oBody = { ... this.requestParams }
    oBody.aPropertyOptionIds = this.aPropertyOptionIds;
    oBody.importStatus = this.importStatus == 'all' ? undefined : this.importStatus;
    oBody.sSearchValue = this.sSearchValue;
    this.apiService.postNew('cashregistry', '/api/v1/activities/items', oBody).subscribe(
      (result: any) => {
        this.activityItems = result.data;
        this.paginationConfig.totalItems = result.count;
        this.showLoader = false;
        setTimeout(() => {
          MenuComponent.reinitialization();
        }, 200);
        if (result?.aUniqueBusinessPartner?.length && !this.aFilterBusinessPartner?.length) this.aFilterBusinessPartner = result.aUniqueBusinessPartner;
      },
      (error: any) => {
        this.showLoader = false;
      })
  }

  openActivities(activity: any, openActivityId?: any) {
    this.dialogService.openModal(ActivityDetailsComponent, { cssClass: 'w-fullscreen mt--5', hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true, context: { activity: activity, openActivityId, items: true, from: 'activity-items' } })
      .instance.close.subscribe((result: any) => {
        // if (result) this.routes.navigate(['business/till']);
      });
  }

  listEmployee() {
    return this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.businessDetails._id }).toPromise();
    //   if (result?.data?.length) {
    //     if (result?.data?.length && result.data[0].result?.length) this.employees = result.data[0].result
    //   }
    // }, (error) => {
    // })
  }

  getLocations() {
    return this.apiService.postNew('core', `/api/v1/business/${this.businessDetails._id}/list-location`, {}).toPromise();
  }

  getWorkstations() {
    return this.apiService.getNew('cashregistry', `/api/v1/workstations/list/${this.businessDetails._id}/${this.iLocationId}`).toPromise();
  }

  // Function for update item's per page
  changeItemsPerPage(pageCount: any) {
    this.paginationConfig.itemsPerPage = pageCount;
    this.loadTransaction();
  }

  // Function for trigger event after page changes
  pageChanged(page: any) {
    this.requestParams.skip = (page - 1) * parseInt(this.paginationConfig.itemsPerPage);
    this.loadTransaction();
    this.paginationConfig.currentPage = page;
  }

  sortAndLoadTransactions(sortHeader: any) {
    let sortBy = 'dCreatedDate';
    if (sortHeader.key == 'ESTIMATED_DATE') sortBy = 'dEstimatedDate'
    else if (sortHeader.key == 'ACTIVITY_NO') sortBy = 'sNumber'
    else if (sortHeader.key == 'REPAIR_NUMBER') sortBy = 'sBagNumber'
    else if (sortHeader.key == 'STATUS') sortBy = 'eActivityItemStatus'
    this.requestParams.sortBy = sortBy;
    this.requestParams.sortOrder = sortHeader.sort;
    this.loadTransaction();
  }

  //  Function for set sort option on transaction table
  setSortOption(sortHeader: any) {
    if (sortHeader.selected) {
      sortHeader.sort = sortHeader.sort == 'asc' ? 'desc' : 'asc';
      this.sortAndLoadTransactions(sortHeader)
    } else {
      this.tableHeaders = this.tableHeaders.map((th: any) => {
        if (sortHeader.key == th.key) {
          th.selected = true;
          th.sort = 'desc';
        } else {
          th.selected = false;
        }
        return th;
      })
      this.sortAndLoadTransactions(sortHeader)
    }
  }

  goToCashRegister() {
    this.routes.navigate(['/business/till']);
  }

  async openModal(barcode: any) {
    if (barcode.startsWith('0002'))
      barcode = barcode.substring(4)
    if (barcode.startsWith("AI")) {
      this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })
      let oBody: any = {
        iBusinessId: this.businessDetails._id,
        oFilterBy: {
          sNumber: barcode
        }
      }
      const activityItemResult: any = await this.apiService.postNew('cashregistry', `/api/v1/activities/activity-item`, oBody).toPromise();
      if (activityItemResult?.data[0]?.result?.length) {

        const iActivityId = activityItemResult?.data[0].result[0].iActivityId;
        const iActivityItemId = activityItemResult?.data[0].result[0]._id;
        oBody = {
          iBusinessId: this.businessDetails._id,
          oFilterBy: {
            _id: iActivityId
          }
        }
        const activityResult: any = await this.apiService.postNew('cashregistry', '/api/v1/activities', oBody).toPromise();

        if (activityResult.data?.length) {
          this.openActivities(activityResult.data[0], iActivityItemId);
        }
      }
    } else if (barcode.startsWith("A")) {
      this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })
      let oBody = {
        iBusinessId: this.businessDetails._id,
        oFilterBy: {
          sNumber: barcode
        }
      }
      const activityResult: any = await this.apiService.postNew('cashregistry', '/api/v1/activities', oBody).toPromise();

      if (activityResult.data?.length) {
        this.openActivities(activityResult.data[0]);
      }

      //activity.find({sNumber: barcode})
    } else if (barcode.startsWith("G")) {
      this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })
      let oBody: any = {
        iBusinessId: this.businessDetails._id,
        oFilterBy: {
          sGiftCardNumber: barcode.substring(2)
        }
      }
      let result: any = await this.apiService.postNew('cashregistry', `/api/v1/activities/activity-item`, oBody).toPromise();
      if (result?.data[0]?.result?.length) {
        const oGiftcard = result?.data[0]?.result[0];
        this.openCardsModal(oGiftcard)
      }
    } else if (barcode.startsWith("R")) {
    } else if (barcode.startsWith("T")) {
      this.toastrService.show({ type: 'warning', text: 'Please go to different page to process this barcode !' })
    }

  }

  openCardsModal(oGiftcard?: any, oCustomer?: any) {
    this.dialogService.openModal(CardsComponent, { cssClass: 'modal-lg', context: { customer: oCustomer, oGiftcard } })
      .instance.close.subscribe(result => {
      });
  }

  /* Property filter */
  getProperties() {
    this.selectedProperties = [];
    let data = {
      skip: 0,
      limit: 100,
      sortBy: '',
      sortOrder: '',
      searchValue: '',
      oFilterBy: {},
      iBusinessId: localStorage.getItem('currentBusiness'),
    };

    this.propertyListSubscription = this.apiService.postNew('core', '/api/v1/properties/list', data).subscribe((result: any) => {
      if (result?.data && result?.data[0]?.result?.length) {
        result.data[0].result.map((property: any) => {
          if (typeof this.propertyOptions[property._id] == 'undefined') {
            this.propertyOptions[property._id] = [];

            property.aOptions.map((option: any) => {
              if (option?.sCode?.trim() != '') {
                const opt: any = {
                  iPropertyId: property._id,
                  sPropertyName: property.sName,
                  iPropertyOptionId: option?._id,
                  sPropertyOptionName: option?.value,
                  sCode: option.sCode,
                  sName: option.sKey,
                  selected: false
                };
                this.propertyOptions[property._id].push(opt);
                const propertyIndex = this.aProperty.findIndex(
                  (prop: any) => prop.iPropertyId == property._id
                );
                if (propertyIndex === -1) this.aProperty.push(opt);
              }
            });
          }
        });
      }
    });
  }

  onProperties(value?: any) {
    if (this.selectedProperties && this.selectedProperties[value]) {
      this.aPropertyOptionIds = [];
      for (const oProperty of this.aProperty) {
        if (this.selectedProperties[oProperty?.iPropertyId]?.length) {
          const aOption = this.propertyOptions[oProperty?.iPropertyId].filter(
            (opt: any) => {
              return this.selectedProperties[oProperty?.iPropertyId].includes(
                opt.sName
              );
            }
          );
          for (const oOption of aOption) {
            this.aPropertyOptionIds.push(oOption?.iPropertyOptionId);
          }
        }
      }
    }
  }

  ngOnDestroy(): void {
    console.log('ondestroy activity items')
    if (this.propertyListSubscription) this.propertyListSubscription.unsubscribe();
    MenuComponent.clearEverything();
  }
}
