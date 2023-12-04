import { Subscription } from 'rxjs';
import { AddFavouritesComponent } from './../shared/components/add-favourites/favourites.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../shared/service/api.service';
import { DialogService } from '../shared/service/dialog';
import { CustomPaymentMethodComponent } from '../shared/components/custom-payment-method/custom-payment-method.component';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../shared/components/toast';
@Component({
  selector: 'app-till-settings',
  templateUrl: './till-settings.component.html',
  styleUrls: ['./till-settings.component.scss']
})
export class TillSettingsComponent implements OnInit, OnDestroy {

  faTrash = faTrash;
  payMethodsLoading: boolean = false;
  payMethods: Array<any> = [];
  bookKeepingMode: boolean = false;
  bookKeepings: Array<any> = [];
  searchValue: string = '';
  requestParams: any = {
    iBusinessId: ''
  }
  updatingSettings: boolean = false;
  iLocationId:any;
  
  settings: any = { nLastReceiptNumber: 0, nLastInvoiceNumber: 0, id: null };
  overviewColumns = [
    // { key:'', name:'action'}, 
    { key: 'sDescription', name: 'DESCRIPTION' },
    { key: 'nNumber', name: 'LEDGER_NUMBER' },
  ];
  articleGroupList!: Array<any>;
  loading: boolean = false;
  quickButtons: Array<any> = [];
  quickButtonsLoading: boolean = false;
  deleteMethodModalSub !: Subscription;
  getSettingsSubscription !: Subscription;
  getLedgerSubscription !: Subscription;
  geBookkeepingUpdateSubscription !: Subscription;
  geBookkeepingListSubscription !: Subscription;
  updateLedgerSubscription !: Subscription;
  updateGeneralLedgerSubscription !: Subscription;
  getLedgerNumberSubscription !: Subscription;
  createPaymentModalSub !: Subscription;
  getPaymentMethodsSubscription !: Subscription;
  viewDetailsModalSub !: Subscription;
  updateSettingsSubscription !: Subscription;
  createFavouriteModalSub !: Subscription;
  fetchQuickButtonsSubscription !: Subscription;
  saveFavouritesSubscription !: Subscription;
  removeQuickButtonSubscription !: Subscription;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    this.requestParams.iBusinessId = localStorage.getItem('currentBusiness');
    this.iLocationId = localStorage.getItem('currentLocation');
    this.getPaymentMethods();
    this.getBookkeepingSetting();
    this.getSettings();
    this.fetchQuickButtons();
  }

  deleteMethod(method: any) {
    const buttons = [
      { text: "YES", value: true, status: 'success', class: 'btn-primary ml-auto mr-2' },
      { text: "NO", value: false, class: 'btn-warning' }
    ]
    this.deleteMethodModalSub = this.dialogService.openModal(ConfirmationDialogComponent, {
      context: {
        header: 'DELETE_PAYMENT_METHOD',
        bodyText: 'ARE_YOU_SURE_TO_DELETE_THIS_PAYMENT_METHOD?',
        buttonDetails: buttons
      }
    })
      .instance.close.subscribe(
        result => {
          if (result) {
            this.apiService.deleteNew('cashregistry', '/api/v1/payment-methods/remove/' + method._id + '?iBusinessId=' + this.requestParams.iBusinessId).subscribe((result: any) => {
              this.getPaymentMethods()
            }, (error) => {
            })
          }
        }
      )
  }

  getSettings() {
    this.getSettingsSubscription = this.apiService.getNew('cashregistry', '/api/v1/settings/' + this.requestParams.iBusinessId).subscribe((result: any) => {
      this.settings = result;
    }, (error) => {
      console.log(error);
    })
  }

  getGeneralLedgerNumber() {
    this.bookKeepings = [];
    this.loading = true;
    this.getLedgerSubscription = this.apiService.getNew('bookkeeping', '/api/v1/ledger/?iBusinessId=' + this.requestParams.iBusinessId + '&sType=general&searchValue=' + this.searchValue).subscribe(
      (result: any) => {
        if (result && result.length) this.bookKeepings = result;
        this.loading = false;
      }),
      (error: any) => {
        this.bookKeepings = [];
        this.loading = false;
        console.error(error)
      }
  }

  // createBookkeepingSetting(){
  //   const data = {
  //     iBusinessId: this.requestParams.iBusinessId,
  //     bBookkeeping: true
  //   };

  //   this.apiService.postNew('bookkeeping', '/api/v1/bookkeeping-setting/create', data).subscribe(
  //     (result : any) => {      
  //     },
  //     (error: any) =>{
  //     }
  //   )
  // }

  updateBookkeepingSetting(bBookkeeping: boolean) {
    const data = {
      iBusinessId: this.requestParams.iBusinessId,
      bBookkeeping
    };
    if (bBookkeeping) this.getGeneralLedgerNumber();
    this.geBookkeepingUpdateSubscription = this.apiService.postNew('bookkeeping', '/api/v1/bookkeeping-setting/update', data).subscribe(
      (result: any) => {
      },
      (error: any) => {
      }
    )
  }

  getBookkeepingSetting() {
    this.geBookkeepingListSubscription = this.apiService.getNew('bookkeeping', '/api/v1/bookkeeping-setting/list/' + this.requestParams.iBusinessId).subscribe(
      (result: any) => {
        if (result && result.bBookkeeping) {
          this.bookKeepingMode = result.bBookkeeping;
          this.getGeneralLedgerNumber();
        }
      },
      (error: any) => {
      }
    )
  }

  updateLedgerNumber(method: any) {
    const createArticle = {
      iBusinessId: this.requestParams.iBusinessId,
      iPaymentMethodId: method._id,
      nNumber: method.sLedgerNumber
    };

    this.updateLedgerSubscription = this.apiService.postNew('bookkeeping', '/api/v1/ledger', createArticle).subscribe(
      (result: any) => {
      },
      (error: any) => {
      }
    )
  }

  updateGeneralLedgerNumber(data: any) {
    const Obj = {
      iBusinessId: this.requestParams.iBusinessId,
      _id: data._id,
      nNumber: data.nNumber
    };
    this.updateGeneralLedgerSubscription = this.apiService.putNew('bookkeeping', '/api/v1/ledger', Obj).subscribe(
      (result: any) => {
      },
      (error: any) => {
      }
    )
  }

  getLedgerNumber(methodId: any, index: number) {
    this.getLedgerNumberSubscription = this.apiService.getNew('bookkeeping', '/api/v1/ledger/payment-method/' + methodId + '?iBusinessId=' + this.requestParams.iBusinessId).subscribe(
      (result: any) => {
        if (result && result.nNumber) { this.payMethods[index].sLedgerNumber = result.nNumber; }
      }
    )
  }


  createPaymentMethod() {
    this.createPaymentModalSub = this.dialogService.openModal(CustomPaymentMethodComponent, { cssClass: "", context: { mode: 'create' } }).instance.close.subscribe(result => {
      if (result.action) this.getPaymentMethods();
    });
  }

  close() {
    this.close();
  }

  getPaymentMethods() {
    this.payMethodsLoading = true;
    this.payMethods = []
    this.getPaymentMethodsSubscription = this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.requestParams.iBusinessId + '?type=custom').subscribe((result: any) => {
      if (result && result.data && result.data.length) {
        this.payMethods = result.data;
        for (let i = 0; i < this.payMethods.length; i++) { this.getLedgerNumber(this.payMethods[i]._id, i) }
      }
      this.payMethodsLoading = false;
    }, (error) => {
      this.payMethodsLoading = false;
    })
  }

  viewDetails(method: any) {
    this.viewDetailsModalSub = this.dialogService.openModal(CustomPaymentMethodComponent, { cssClass: "", context: { mode: 'details', customMethod: method } }).instance.close.subscribe(result => {
      if (result.action) this.getPaymentMethods();
    });
  }

  updateSettings(event:any): void {
    const { nLastInvoiceNumber, nLastReceiptNumber, sDayClosurePeriod } = this.settings;
    const body = { nLastInvoiceNumber, nLastReceiptNumber, sDayClosurePeriod };
    event.target.disabled = true;
    this.updatingSettings = true;
    this.updateSettingsSubscription = this.apiService.putNew('cashregistry', '/api/v1/settings/update/' + this.requestParams.iBusinessId, body)
      .subscribe((result: any) => {
        if (result){
          this.updatingSettings = false;
          event.target.disabled = false;
          this.toastService.show({ type: 'success', text: 'Saved Successfully' });
        } 
      }, (error) => {
        console.log(error);
      })
  }


  createFavourite() {
    this.createFavouriteModalSub = this.dialogService.openModal(AddFavouritesComponent, { context: { mode: 'create' }, cssClass: "modal-lg", hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true }).instance.close.subscribe(result => {
      if (result.action)
        this.fetchQuickButtons();
    });
  }

  fetchQuickButtons() {
    this.quickButtonsLoading = true;
    try {
      this.fetchQuickButtonsSubscription = this.apiService.getNew('cashregistry', `/api/v1/quick-buttons/${this.requestParams.iBusinessId}?iLocationId=${this.iLocationId}`).subscribe((result: any) => {
        this.quickButtonsLoading = false;
        if (result?.length) this.quickButtons = result;
      }, (error) => {
        this.quickButtonsLoading = false;
      })
    } catch (e) {
      this.quickButtonsLoading = false;
    }
  }

  shiftQuickButton(type: string, index: number) {
    if (type == 'up') {
      if (this.quickButtons[index - 1])
        [this.quickButtons[index - 1], this.quickButtons[index]] = [this.quickButtons[index], this.quickButtons[index - 1]]

    } else {
      if (this.quickButtons[index + 1])
        [this.quickButtons[index + 1], this.quickButtons[index]] = [this.quickButtons[index], this.quickButtons[index + 1]]
    }
  }

  saveFavourites(event: any) {
    event.target.disabled = true;
    this.quickButtonsLoading = true;
    try {
      this.saveFavouritesSubscription = this.apiService.putNew('cashregistry', '/api/v1/quick-buttons/updateSequence/' + this.requestParams.iBusinessId, this.quickButtons).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: `Quick Buttons order saved successfully` });
        this.quickButtonsLoading = false;
        event.target.disabled = false;
      }, (error) => {
        this.quickButtonsLoading = false;
        event.target.disabled = false;
      })
    } catch (e) {
      this.quickButtonsLoading = false;
      event.target.disabled = false;
    }

  }

  removeQuickButton(button: any) {
    try {
      this.removeQuickButtonSubscription = this.apiService.deleteNew('cashregistry', `/api/v1/quick-buttons/${button._id}/${this.requestParams.iBusinessId}`).subscribe((result: any) => {
        this.toastService.show({ type: 'success', text: `Quick button deleted successfully` });
        this.fetchQuickButtons();
      }, (error) => {

      })
    } catch (e) {

    }
  }

  editQuickButton(button:any) {
    console.log(button)
    this.createFavouriteModalSub = this.dialogService.openModal(AddFavouritesComponent, { context: { mode: 'edit', button:button}, cssClass: "modal-lg", hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true }).instance.close.subscribe(result => {
      if (result.action)
        this.fetchQuickButtons();
    });
  }
 
  ngOnDestroy(): void {
    if (this.deleteMethodModalSub) this.deleteMethodModalSub.unsubscribe();
    if (this.getSettingsSubscription) this.getSettingsSubscription.unsubscribe();
    if (this.getLedgerSubscription) this.getLedgerSubscription.unsubscribe();
    if (this.geBookkeepingUpdateSubscription) this.geBookkeepingUpdateSubscription.unsubscribe();
    if (this.geBookkeepingListSubscription) this.geBookkeepingListSubscription.unsubscribe();
    if (this.updateLedgerSubscription) this.updateLedgerSubscription.unsubscribe();
    if (this.updateGeneralLedgerSubscription) this.updateGeneralLedgerSubscription.unsubscribe();
    if (this.getLedgerNumberSubscription) this.getLedgerNumberSubscription.unsubscribe();
    if (this.createPaymentModalSub) this.createPaymentModalSub.unsubscribe();
    if (this.getPaymentMethodsSubscription) this.getPaymentMethodsSubscription.unsubscribe();
    if (this.viewDetailsModalSub) this.viewDetailsModalSub.unsubscribe();
    if (this.updateSettingsSubscription) this.updateSettingsSubscription.unsubscribe();
    if (this.createFavouriteModalSub) this.createFavouriteModalSub.unsubscribe();
    if (this.fetchQuickButtonsSubscription) this.fetchQuickButtonsSubscription.unsubscribe();
    if (this.saveFavouritesSubscription) this.saveFavouritesSubscription.unsubscribe();
    if (this.removeQuickButtonSubscription) this.removeQuickButtonSubscription.unsubscribe();
  }
}
