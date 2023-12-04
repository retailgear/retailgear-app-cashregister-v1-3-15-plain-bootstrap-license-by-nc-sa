import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faLongArrowAltDown, faLongArrowAltUp, faMinusCircle, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { ActivityDetailsComponent } from '../shared/components/activity-details-dialog/activity-details.component';
import { CardsComponent } from '../shared/components/cards-dialog/cards-dialog.component';
import { ToastService } from '../shared/components/toast';
import { WebOrderDetailsComponent } from '../shared/components/web-order-details/web-order-details.component';
import { ApiService } from '../shared/service/api.service';
import { BarcodeService } from '../shared/service/barcode.service';
import { DialogService } from '../shared/service/dialog';
import { MenuComponent } from '../shared/_layout/components/common';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.sass'],
  providers: [BarcodeService]
})
export class ServicesComponent implements OnInit, OnDestroy {

  option: boolean = true;
  faSearch = faSearch;
  faIncrease = faPlusCircle;
  faDecrease = faMinusCircle;
  faArrowUp = faLongArrowAltUp;
  faArrowDown = faLongArrowAltDown;
  cities = [
    { name: 'Amsterdam', code: 'AMS' },
    { name: 'Bruxelles', code: 'BRU' },
    { name: 'Paris', code: 'PAR' },
    { name: 'Instanbul', code: 'INS' }
  ];
  selectedCity: string = '';
  activities: Array<any> = [];
  businessDetails: any = {};
  userType: any = {};
  requestParams: any = {
    transactionStatuses: ['new', 'processing', 'cancelled', 'inspection', 'completed', 'refund', 'refundInCashRegister'],
    selectedTransactionStatuses: [],
    locations: [],
    selectedLocations: [],
    aSelectedBusinessPartner: [],
    iEmployeeId: '',
    iAssigneeId: '',
    searchValue: '',
    sortBy: { key: '_id', selected: true, sort: 'asc' },
    sortOrder: 'asc'
  };
  showLoader: Boolean = false;
  widgetLog: string[] = [];
  pageCounts: Array<number> = [10, 25, 50, 100]
  pageCount: number = 10;
  pageNumber: number = 1;
  setPaginateSize: number = 10;
  paginationConfig: any = {
    itemsPerPage: '10',
    currentPage: 1,
    totalItems: 0
  };
  showAdvanceSearch = false;
  transactionMenu = [
    { key: 'REST_PAYMENT' },
    { key: 'REFUND/REVERT' },
    { key: 'PREPAYMENT' },
    { key: 'MARK_CONFIRMED' },
  ];
  iBusinessId: any = '';
  aFilterBusinessPartner: any = [];

  // Advance search fields 

  addDays(date: any, days: any) {
    const inputDate = new Date(date);
    return new Date(inputDate.setDate(inputDate.getDate() + days));
  }

  filterDates: any = {
    create: {
      minDate: new Date('01-01-2015'),
      maxDate: new Date(new Date().setHours(23, 59, 59)),
    },
    estimate: {
      minDate: undefined,
      maxDate: undefined
      // minDate: new Date('01-01-2015'),
      // maxDate: this.addDays(new Date(new Date().setHours(23, 59, 59)), 20),
    }
  }

  paymentMethods: Array<any> = ['All', 'Cash', 'Credit', 'Card', 'Gift-Card'];
  transactionTypes: Array<any> = ['All', 'Refund', 'Repair', 'Gold-purchase', 'Gold-sale', 'order', 'giftcard', 'offer', 'reservation'];
  transactionStatus: string = 'all';
  invoiceStatus: string = 'all';
  importStatus: string = 'all';
  methodValue: string = 'All';
  transactionValue: string = 'All';
  employees: Array<any> = [];
  workstations: Array<any> = [];
  selectedWorkstations: Array<any> = [];
  iLocationId: string;
  webOrders: Boolean = false;
  isFor = "";

  tableHeaders: Array<any> = [
    { key: 'ACTIVITY_NUMBER', selected: false, sort: '' },
    { key: 'REPAIR_NUMBER', disabled: true },
    { key: 'TYPE', disabled: true },
    { key: 'INTAKE_DATE', selected: false, sort: 'asc' },
    { key: 'END_DATE', selected: false, sort: 'asc' },
    { key: 'STATUS', disabled: true },
    { key: 'SUPPLIER_REPAIRER', disabled: true },
    // { key: 'Partner supplier status', disabled: true },
    { key: 'CUSTOMER', disabled: true },
    { key: 'ACTIONS', disabled: true },
  ]

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastrService: ToastService,
    private barcodeService: BarcodeService,
  ) { }
  
  async ngOnInit(): Promise<void> {
    this.apiService.setToastService(this.toastrService);
    this.barcodeService.barcodeScanned.subscribe((barcode: string) => {
      this.openModal(barcode);
    });

    this.activatedRoute.queryParamMap.subscribe((params: any) => {
      this.isFor = params.params.isFor;
    })
    if (this.router.url.includes('/business/webshop-orders')) {
      this.webOrders = true;
      this.requestParams.eType = ['webshop-revenue'] //, 'webshop-reservation'
    }
    this.businessDetails._id = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.userType = localStorage.getItem('type');
    this.iBusinessId = localStorage.getItem('currentBusiness');

    this.showLoader = true;
    if (this.isFor !== "activity") await this.setLocation() /* For web-orders, we will switch to the web-order location otherwise keep current location */
    this.showLoader = false
    this.loadTransaction();
    this.fetchBusinessDetails();

    const [_locationData, _workstationData, _employeeData]: any = await Promise.all([
      this.getLocations(),
      this.getWorkstations(),
      this.listEmployee()
    ]);

    if (_locationData.message == 'success') {
      this.requestParams.locations = _locationData.data.aLocation;
    }

    if (_workstationData && _workstationData.data) {
      this.workstations = _workstationData.data;
    }

    if (_employeeData?.data?.length && _employeeData.data[0]?.result?.length) {
      this.employees = _employeeData.data[0].result
    }
    // setTimeout(() => { 
    //   MenuComponent.bootstrap();
    // }, 200);
  }

  // Function for handle event of transaction menu
  clickMenuOpt(key: string, transactionId: string) {
  }

  getTypes(arr: any) {
    let str = '';
    if (arr && arr.length) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i]?.oArticleGroupMetaData?.sCategory) {
          if (!str) { str += (arr[i]?.oArticleGroupMetaData?.sCategory) }
          else { str += (', ' + arr[i]?.oArticleGroupMetaData?.sCategory) }
        }
      }
    }
    return str;
  }

  // getBusinessLocations() {
  //   // return new Promise<any>((resolve, reject) => {
  //     return this.apiService.getNew('core', '/api/v1/business/user-business-and-location/list')
  //       // .subscribe((result: any) => {
  //       //   if (result.message == "success" && result?.data) {
  //       //     resolve(result);
  //       //   }
  //       //   // resolve(null);
  //       // }
  //       // , (error) => {
  //       //   resolve(error);
  //       //   console.error('error: ', error);
  //       // })
  //   // })
  // }

  getLocations() {
    return this.apiService.postNew('core', `/api/v1/business/${this.businessDetails._id}/list-location`, {}).toPromise();
  }

  async setLocation(sLocationId: string = "") {
    return new Promise<void>(async (resolve, reject) => {
      this.iLocationId = sLocationId ?? (localStorage.getItem('currentLocation') ?? '')
      try {
        const _aBusinessLocation: any = await this.apiService.getNew('core', '/api/v1/business/user-business-and-location/list').toPromise();
        if (_aBusinessLocation?.data?.aBusiness?.length) {
          const aBusiness = _aBusinessLocation.data?.aBusiness.find((business:any)=> business._id === this.iBusinessId)
          if (aBusiness?.aInLocation?.length){
            this.iLocationId = aBusiness.aInLocation.find((location: any) => location.bIsWebshop)?._id || this.iLocationId;
          }
        }
        // resolve()

        // const aBusinessLocation = _aBusinessLocation.data;
        // console.log(218, aBusinessLocation)
        // let oNewLocation: any
        // let bIsCurrentBIsWebshop = false
        // for (let k = 0; k < aBusinessLocation?.data?.aBusiness?.length; k++) {
        //   console.log(222)
        //   const aAllLocations = aBusinessLocation?.data?.aBusiness[k]
        //   for (let i = 0; i < aAllLocations?.aLocation?.length; i++) {
        //     const l = aAllLocations?.aLocation[i];
        //     if (l.bIsWebshop) oNewLocation = l
        //     if (l._id.toString() === this.iLocationId) {
        //       if (l.bIsWebshop) {
        //         bIsCurrentBIsWebshop = true
        //         this.iLocationId = l._id.toString()
        //         break
        //       }
        //     }
        //   }
        // }
        // console.log(230, oNewLocation, bIsCurrentBIsWebshop)
        // if (!bIsCurrentBIsWebshop) {
        //   this.iLocationId = oNewLocation._id.toString()
        //   console.log(233, this.iLocationId)
        // }
        resolve()
      } catch (error) {
        resolve()
      }
    })
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


  //  Function for set sort option on transaction table
  setSortOption(sortHeader: any) {
    if (sortHeader.selected) {
      sortHeader.sort = sortHeader.sort == 'asc' ? 'desc' : 'asc';
      this.sortAndLoadTransactions(sortHeader)
    } else {
      this.tableHeaders = this.tableHeaders.map((th: any) => {
        if (sortHeader.key == th.key) {
          th.selected = true;
          th.sort = 'asc';
        } else {
          th.selected = false;
        }
        return th;
      })
      this.sortAndLoadTransactions(sortHeader)
    }
  }

  sortAndLoadTransactions(sortHeader: any) {
    let sortBy = 'dCreatedDate';
    if (sortHeader.key == 'End date') sortBy = 'dEstimatedDate';
    if (sortHeader.key == 'Intake date') sortBy = 'dCreatedDate';
    if (sortHeader.key == 'Activity No.') sortBy = 'sNumber';
    this.requestParams.sortBy = sortBy;
    this.requestParams.sortOrder = sortHeader.sort;
    this.loadTransaction();
  }

  listEmployee() {
    return this.apiService.postNew('auth', '/api/v1/employee/list', { iBusinessId: this.businessDetails._id }).toPromise();
  }

  openActivities(activity: any, openActivityId?: any) {
    if (this.webOrders) {
      let isFrom = this.router.url.includes('/business/webshop-orders') ? 'web-orders' : 'web-reservations';
      this.dialogService.openModal(WebOrderDetailsComponent, { cssClass: 'w-fullscreen', context: { activity, businessDetails: this.businessDetails, from: isFrom } })
        .instance.close.subscribe(result => {
          if (this.webOrders && result) this.router.navigate(['business/till']);
        });
    } else {
      this.dialogService.openModal(ActivityDetailsComponent, {
        cssClass: 'w-fullscreen mt--5',
        hasBackdrop: true,
        closeOnBackdropClick: true,
        closeOnEsc: true,
        context: {
          activity,
          businessDetails: this.businessDetails,
          openActivityId,
          items: false,
          webOrders: this.webOrders,
          from: 'services'
        }
      }).instance.close.subscribe(result => {
        if (this.webOrders && result) this.router.navigate(['business/till']);
      });
    }
  }

  loadTransaction() {
    if (this.router.url.includes('/business/webshop-orders')) {
      this.webOrders = true;
      this.requestParams.eType = ['webshop-revenue']
    } else if (this.router.url.includes('/business/reservations')) {
      this.webOrders = true;
      this.requestParams.eType = ['webshop-reservation']
    } else {
      this.requestParams.eType = ['cash-register-service', 'cash-register-revenue']
      if (this.iLocationId) this.requestParams.iLocationId = this.iLocationId
    }
    this.activities = [];
    this.requestParams.iBusinessId = this.businessDetails._id;
    this.requestParams.skip = this.requestParams.skip || 0;
    this.requestParams.limit = this.paginationConfig.itemsPerPage || 50;
    this.requestParams.importStatus = this.importStatus == 'all' ? undefined : this.importStatus;
    // if (this.iLocationId && !this.requestParams.selectedLocations?.length) this.requestParams.selectedLocations.push(this.requestParams.selectedLocations);
    this.showLoader = true;

    this.requestParams.estimateDate = {
      minDate: this.filterDates.estimate.minDate,
      maxDate: this.filterDates.estimate.maxDate,
    }
    this.requestParams.createdDate = {
      minDate: this.filterDates.create.minDate,
      maxDate: this.filterDates.create.maxDate,
    }
    this.apiService.postNew('cashregistry', '/api/v1/activities', this.requestParams).subscribe((result: any) => {
      if (result?.data?.length) this.activities = result?.data;
      else this.activities = [];
      if (result?.aUniqueBusinessPartner && !this.aFilterBusinessPartner?.length) this.aFilterBusinessPartner = result.aUniqueBusinessPartner;
      this.paginationConfig.totalItems = result?.count;
      this.getCustomers();
      this.showLoader = false;
      setTimeout(() => {
        MenuComponent.bootstrap();
        // MenuComponent.reinitialization();
      }, 200);
    }, (error) => {
      this.showLoader = false;
    })
  }

  getCustomers() {
    const body = {
      iBusinessId: this.iBusinessId,
      oFilterBy:{
        _id: [...new Set(this.activities.map((el: any) => el?.iCustomerId).filter((n: any) => n))]
      }
    }

    this.apiService.postNew('customer', '/api/v1/customer/list', body).subscribe(async (result: any) => {
      if (result?.data?.length && result?.data[0]?.result?.length) {
        const customers = result.data[0].result || [];
        for (let i = 0; i < this.activities.length; i++) {
          for (let j = 0; j < customers.length; j++) {
            if (this.activities[i]?.iCustomerId?.toString() == customers[j]?._id?.toString()) {
              this.activities[i].oCustomer = {
                sFirstName: customers[j].sFirstName,
                sPrefix: customers[j].sPrefix,
                sLastName: customers[j].sLastName
              }
            }
          }
        }
      }
    })
  }

  goToCashRegister() {
    this.router.navigate(['/business/till']);
  }

  async openModal(barcode: any) {
    if (barcode.startsWith('0002'))
      barcode = barcode.substring(4)
    if (barcode.startsWith("AI")) {
      this.toastrService.show({ type: 'success', text: 'Barcode detected: ' + barcode })
      // activityitem.find({sNumber: barcode},{eTransactionItem.eKind : 1})
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
      // activityitem.find({sGiftcardNumber: barcode},{eTransactionItem.eKind : 1})
    } else if (barcode.startsWith("R")) {
      // activityitem.find({sRepairNumber: barcode},{eTransactionItem.eKind : 1})
    } else if (barcode.startsWith("T")) {
      this.toastrService.show({ type: 'warning', text: 'Please go to different page to process this barcode !' })
    }
    console.log('barcode ', barcode);
  }

  openCardsModal(oGiftcard?: any, oCustomer?: any) {
    this.dialogService.openModal(CardsComponent, { cssClass: 'modal-lg', context: { customer: oCustomer, oGiftcard } })
      .instance.close.subscribe(result => {
        if (result) {

        }
      });
  }

  fetchBusinessDetails() {
    this.apiService.getNew('core', '/api/v1/business/' + this.iBusinessId).subscribe((result: any) => {
      this.businessDetails = result.data;
      this.businessDetails.currentLocation = this.businessDetails?.aLocation?.find((location: any) => location?._id === localStorage.getItem('currentLocation'));
    })
  }

  ngOnDestroy(): void {
    console.log('ondestroy services')
    MenuComponent.clearEverything();
  }
}
