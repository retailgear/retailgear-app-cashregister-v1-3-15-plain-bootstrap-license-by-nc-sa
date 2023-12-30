import { Subscription } from 'rxjs';
import { AddFavouritesComponent } from './../shared/components/add-favourites/favourites.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../shared/service/api.service';
import { DialogService } from '../shared/service/dialog';
import { CustomPaymentMethodComponent } from '../shared/components/custom-payment-method/custom-payment-method.component';
import { faTrash, faSearch, faSync } from '@fortawesome/free-solid-svg-icons';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../shared/components/toast';
import { TranslateService } from '@ngx-translate/core';
import { SetPaymentMethodSequenceComponent } from '../shared/components/set-payment-method-sequence-dialog/set-payment-method-sequence.component';
import { TillService } from '../shared/service/till.service';
import { QuickbuttonWizardComponent } from '../shared/components/quickbutton-wizard/quickbutton-wizard.component';

@Component({
  selector: 'app-till-settings',
  templateUrl: './till-settings.component.html',
  styleUrls: ['./till-settings.component.scss']
})
export class TillSettingsComponent implements OnInit, OnDestroy {

  faTrash = faTrash;
  faSearch = faSearch;
  faSync = faSync;
  payMethodsLoading: boolean = false;
  payMethods: Array<any> = [];
  aCustomerSearch: Array<any> = [];
  bookKeepingMode: boolean = false;
  bookKeepings: Array<any> = [];
  searchValue: string = '';
  requestParams: any = {
    iBusinessId: localStorage.getItem('currentBusiness')
  }
  updatingSettings: boolean = false;
  updatingCustomerSettings: boolean = false;
  iLocationId: any = localStorage.getItem('currentLocation');
  
  settings: any = {
    sDayClosurePeriod:  'day',
    sDayClosureMethod: 'workstation',
    bShowOrder: true,
    bShowGoldPurchase:  true,
    bShowOpenDrawer: true,
    aBagNumbers: [],
    aCashRegisterPrefill: [],
    iDefaultArticleGroupForOrder: null,
    iDefaultArticleGroupForRepair: null ,
    bLockCashRegisterAfterTransaction:  true,
    bEnableCashRegisterForGeneral:  true,
    bShowForm:  true,
    nLastReceiptNumber: 0,
    nLastInvoiceNumber: 0,
    nLastClientID:0,
    bOpenCashDrawer:true,
    id: null,
    eInvoiceGenerationMethod: 'auto-generate'
  };
  overviewColumns = [
    // { key:'', name:'action'}, 
    { key: 'sDescription', name: 'DESCRIPTION' },
    { key: 'nNumber', name: 'LEDGER_NUMBER' },
  ];
  articleGroupList!: Array<any>;
  selectedLanguage: any;
  loading: boolean = false;
  quickButtons: Array<any> = [];
  quickButtonsLoading: boolean = false;
  deleteMethodModalSub !: Subscription;
  getSettingsSubscription !: Subscription;
  getCustomerSettingsSubscription!: Subscription;
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
  dayClosureCheckSubscription !: Subscription;
  aSelectedFields:any;
  aPrefillFields:any = [
    { key: 'bArticleGroup', title: 'ARTICLE_GROUPS' },
    { key: 'bLabelDescription', title: 'LABEL_DESCRIPTION' },
    { key: 'bProductNumber', title: 'PRODUCT_NUMBER' },
  ]
  aFilterFields: Array<any> = [
    { key: 'FIRSTNAME', value: 'sFirstName' },
    { key: 'INSERT', value: 'sPrefix' },
    { key: 'LASTNAME', value: 'sLastName' },
    { key: 'PHONE', value: 'sMobile' },
    { key: 'POSTAL_CODE', value: 'sPostalCode' },
    { key: 'HOUSE_NUMBER', value: 'sHouseNumber' },
    { key: 'STREET', value: 'sStreet' },
    { key: 'COMPANY_NAME', value: 'sCompanyName' },
    { key: 'NCLIENTID', value: 'nClientId'}
  ];

  aSalesOrderNoTypes: Array<any> = [
    { sName: 'AUTO_GENERATE', value: 'auto-generate' },
    { sName: 'MANUAL', value: 'manual' }
  ];
  
  bUpdateNclientID: boolean = false;
  oldNlastnClientID: number = 0;
  
  bDefaultPayMethodsLoading: boolean = false;
  aDefaultPaymentMethods: any = [];
  aAllPaymentMethods: any = [];

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private toastService: ToastService,
    private translateService: TranslateService,
    public tillService: TillService
  ) { }
  
  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.selectedLanguage = localStorage.getItem('language');
    this.getSettings();
    this.fetchQuickButtons();
    this.getArticleGroups();
    this.getBookkeepingSetting();
    
  }

  getArticleGroups() {
    this.articleGroupList = [];
    this.loading = true;
    this.apiService.postNew('core', '/api/v1/business/article-group/list', this.requestParams).subscribe(
      (result: any) => {
        this.loading = false;
        if (result?.data?.length && result.data[0]?.result?.length) {
          this.articleGroupList = result.data[0].result.filter((item: any) => {
            if (!item?.oName?.[this.selectedLanguage]) {
              for (const sName of Object.values(item.oName)) {
                if (sName) {
                  item.oName[this.selectedLanguage] = sName;
                  break;
                }
              }
            }
            if (!item?.oName?.[this.selectedLanguage]) item.oName[this.selectedLanguage] = 'NO_NAME';
            return item.sCategory
          });
        }
      }, (error) => {
        this.loading = false;
        this.toastService.show({ type: 'warning', text: 'something went wrong' });
      })
  }

  deleteMethod(method: any) {
    const buttons = [
      { text: "YES", value: true, status: 'success', class: 'btn-primary me-2' },
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
  getCustomerSettings() {
    this.getCustomerSettingsSubscription = this.apiService.getNew('customer', `/api/v1/customer/settings/get/${this.requestParams.iBusinessId}`).subscribe((customersettingresult: any) => {
      this.settings.nLastClientID = customersettingresult?.nLastClientID;
      this.oldNlastnClientID = customersettingresult?.nLastClientID;
      this.settings.aCustomerSearch = customersettingresult?.aCustomerSearch;
      this.settings.sMessage = customersettingresult?.sMessage;
    }, (error) => {
      console.log(error);
    });
  }

  getSettings() {
    this.getSettingsSubscription = this.apiService.getNew('cashregistry', `/api/v1/settings/${this.requestParams.iBusinessId}`).subscribe((result: any) => {
      if (result) {
        this.settings = result;
        const oBagNumberSettings = {
          iLocationId: this.iLocationId,
          bAutoIncrementBagNumbers: true,
          nLastBagNumber: 0,
          sPrefix: ""
        };

        const oPrefillSettings = {
          iLocationId: this.iLocationId,
          bArticleGroup: true,
          bProductNumber: true,
          bProductName: true,
          bLabelDescription: true,
          bDiamondDetails: true,
          bPrefillBagNumbers: true
        }
        let oMergedSettings: any = {};
        if (!this.settings?.aBagNumbers?.length) {
          oMergedSettings = { ...oBagNumberSettings };
        } else {
          oMergedSettings = { ...(this.settings.aBagNumbers.find((el: any) => el.iLocationId === this.iLocationId) || oBagNumberSettings) };
        }

        if (!this.settings?.aCashRegisterPrefill?.length) {
          oMergedSettings = { ...oMergedSettings, ...oPrefillSettings };
          this.settings.aCashRegisterPrefill = [{ ...oPrefillSettings }];
        } else {
          oMergedSettings = { ...oMergedSettings, ...(this.settings.aCashRegisterPrefill.find((el: any) => el.iLocationId === this.iLocationId) || oPrefillSettings) };
        }

        this.settings.currentLocation = oMergedSettings;
      }
      this.getCustomerSettings();
      this.getPaymentMethods();
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
    this.createPaymentModalSub = this.dialogService.openModal(CustomPaymentMethodComponent, { cssClass: "", context: { mode: 'create', visiblePayMethods: this.aAllPaymentMethods.filter((el: any) => el.bShowInCashRegister) }, hasBackdrop: true }).instance.close.subscribe(async result => {
      if (result.action){
        this.getPaymentMethods();
      } 
    });
  }

  close() {
    this.close();
  }

  getPaymentMethods() {
    this.payMethodsLoading = true;
    this.bDefaultPayMethodsLoading = true;
    this.payMethods = []
    this.getPaymentMethodsSubscription = this.apiService.getNew('cashregistry', '/api/v1/payment-methods/' + this.requestParams.iBusinessId).subscribe(async (result: any) => { //'?type=custom'
      if (result?.data?.length) {
        this.aAllPaymentMethods = result.data;
        const oGiftcardMethod = this.aAllPaymentMethods.find((oMethod: any) => oMethod.sName == 'Giftcards');
        if (oGiftcardMethod) oGiftcardMethod.bIsDefaultPaymentMethod = true;
        this.payMethods = this.aAllPaymentMethods.filter((oMethod: any) => !oMethod.bIsDefaultPaymentMethod);
        this.payMethodsLoading = false;

        this.aDefaultPaymentMethods = this.aAllPaymentMethods.filter((oMethod: any) => oMethod.bIsDefaultPaymentMethod);
        for(let oMethod of this.aDefaultPaymentMethods){
          let setting = await this.settings?.aDefaultPayMethodSettings?.find((el:any) => el._id == oMethod._id)
          if(setting){
            //console.log('im inside here')
            oMethod.bShowInCashRegister = setting.bShowInCashRegister;
            oMethod.bStockReduction = setting.bStockReduction;
            oMethod.bInvoice = setting.bInvoice;
            oMethod.bAssignSavingPoints = setting.bAssignSavingPoints;
            oMethod.bAssignSavingPointsLastPayment = setting.bAssignSavingPointsLastPayment;
          }
        }
        this.bDefaultPayMethodsLoading = false;
        // Comment tihs line for temporary solution for stackblitz
        // for (let i = 0; i < this.payMethods.length; i++) { this.getLedgerNumber(this.payMethods[i]._id, i) }
      }
     
    }, (error) => {
      this.payMethodsLoading = false;
    })
  }


  viewDetails(method: any) {
    this.viewDetailsModalSub = this.dialogService.openModal(CustomPaymentMethodComponent, { cssClass: "", context: { mode: 'details', customMethod: method, settings: this.settings , visiblePayMethods: this.aAllPaymentMethods.filter((el: any) => el.bShowInCashRegister)}, hasBackdrop: true }).instance.close.subscribe(async result => {
      if (result.action){
        this.getSettings(); 
        this.toastService.show({ type: 'success', text: this.translateService.instant('SAVED_SUCCESSFULLY') });
      }
    });
  }

  
  updateCustomerSettings() {
    let CustomerSettingsbody = {}
    if(this.bUpdateNclientID && (this.oldNlastnClientID != this.settings.nLastClientID)){
      CustomerSettingsbody = {
        aCustomerSearch: this.settings?.aCustomerSearch,
        nLastClientID: this.settings.nLastClientID,
        sMessage: this.settings.sMessage
      }
    }else{
      CustomerSettingsbody = {
        aCustomerSearch:this.settings?.aCustomerSearch,
        sMessage: this.settings.sMessage
      }
    }
    this.updatingCustomerSettings = true;
    this.updateSettingsSubscription = this.apiService.putNew('customer', '/api/v1/customer/settings/update/' + this.requestParams.iBusinessId, CustomerSettingsbody)
      .subscribe((result: any) => {
        if (result){
          this.updatingCustomerSettings = false;
          this.bUpdateNclientID = false;
          this.toastService.show({ type: 'success', text: 'Saved Successfully' });
        } 
      }, (error) => {
        this.updatingCustomerSettings = false;
        console.log(error);
      })
  }

  UpdateSettings() {
    if(this.settings?.aBagNumbers?.length) {
      this.settings.aBagNumbers = [...this.settings?.aBagNumbers?.filter((el: any) => el.iLocationId !== this.iLocationId), this.settings.currentLocation];
    }else{
      this.settings.aBagNumbers = [ 
        {
          iLocationId: this.iLocationId,
          bAutoIncrementBagNumbers: true,
          nLastBagNumber: this.settings?.currentLocation?.nLastBagNumber,
          sPrefix: this.settings?.currentLocation?.sPrefix
        }
      ]
    }
    if(this.settings?.aCashRegisterPrefill?.length) {
      const oCurrentSettrings = {
        iLocationId: this.settings.currentLocation.iLocationId,
        bArticleGroup: this.settings.currentLocation.bArticleGroup,
        bProductNumber: this.settings.currentLocation.bProductNumber,
        bProductName: this.settings.currentLocation.bProductName,
        bLabelDescription: this.settings.currentLocation.bLabelDescription,
        bDiamondDetails: this.settings.currentLocation.bDiamondDetails,
        bPrefillBagNumbers: this.settings.currentLocation.bPrefillBagNumbers,
      } 
      this.settings.aCashRegisterPrefill = [...this.settings?.aCashRegisterPrefill?.filter((el: any) => el.iLocationId !== this.iLocationId), {...oCurrentSettrings}];
    }
    const body = {
      nLastInvoiceNumber: this.settings?.nLastInvoiceNumber || 0,
      nLastReceiptNumber: this.settings?.nLastReceiptNumber || 0 ,
      sDayClosurePeriod: this.settings?.sDayClosurePeriod || 'day',
      sDayClosureMethod: this.settings?.sDayClosureMethod || 'workstation',
      bOpenCashDrawer: this.settings?.bOpenCashDrawer,
      bShowOrder: this.settings?.bShowOrder ,
      bShowGoldPurchase: this.settings?.bShowGoldPurchase,
      bShowOpenDrawer: this.settings?.bShowOpenDrawer,
      aBagNumbers: this.settings?.aBagNumbers || [],
      aCashRegisterPrefill: this.settings?.aCashRegisterPrefill || [],
      iDefaultArticleGroupForOrder:this.settings?.iDefaultArticleGroupForOrder || null,
      iDefaultArticleGroupForRepair:this.settings?.iDefaultArticleGroupForRepair || null ,
      bLockCashRegisterAfterTransaction: this.settings?.bLockCashRegisterAfterTransaction || false,
      bEnableCashRegisterForGeneral: this.settings?.bEnableCashRegisterForGeneral || true,
      bShowForm: this.settings?.bShowForm,
      aDescriptionFieldToPrefill: this.settings?.aDescriptionFieldToPrefill,
      eInvoiceGenerationMethod: this.settings?.eInvoiceGenerationMethod
    };
    this.updatingSettings = true;
    this.updateSettingsSubscription = this.apiService.putNew('cashregistry', '/api/v1/settings/update/' + this.requestParams.iBusinessId, body)
      .subscribe((result: any) => {
        if (result){
          this.updatingSettings = false;
          this.toastService.show({ type: 'success', text: 'Saved Successfully' });
        } 
      }, (error) => {
        console.log(error);
      })
      
  }


  createFavourite() {
    // this.createFavouriteModalSub = this.dialogService.openModal(AddFavouritesComponent, { context: { mode: 'create' }, cssClass: "modal-lg", hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true }).instance.close.subscribe(result => {
    //   if (result.action)
    //     this.fetchQuickButtons();
    // });

    this.createFavouriteModalSub = this.dialogService.openModal(QuickbuttonWizardComponent, { 
      context: { mode: 'create', aQuickButtons:  this.quickButtons}, 
      cssClass: "modal-lg", 
      hasBackdrop: true, 
      closeOnBackdropClick: true, 
      closeOnEsc: true 
    }).instance.close.subscribe(result => {
      if (result.action)
        this.fetchQuickButtons();
    });
  }

  fetchQuickButtons() {
    this.quickButtonsLoading = true;
    try {
      this.fetchQuickButtonsSubscription = this.apiService.getNew('cashregistry', `/api/v1/quick-buttons/${this.requestParams.iBusinessId}?iLocationId=${this.iLocationId}`).subscribe((result: any) => {
        this.quickButtonsLoading = false;
        
        if (result?.length){
          let hotKeys = new Set();
          this.quickButtons = result;
          for( const button of this.quickButtons) {
            if(button.oKeyboardShortcut && button.oKeyboardShortcut?.sKey1 != '' && button.oKeyboardShortcut?.sKey1){
              const hotKey = JSON.stringify(button.oKeyboardShortcut);
              if (hotKeys.has(hotKey)) {
                button.bIsDuplicateHK = true;
              }else{
                hotKeys.add(hotKey);
              }
            }
          }
        } else {
          this.quickButtons =[];
        }
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
    this.createFavouriteModalSub = this.dialogService.openModal(AddFavouritesComponent, { context: { mode: 'edit', button:button}, cssClass: "modal-lg", hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true }).instance.close.subscribe(result => {
      if (result.action)
        this.fetchQuickButtons();
    });
  }

  onChangeDayClosureMethod(sRevertDayClosureMethod: string) {
    const oBody = {
      iBusinessId: this.requestParams.iBusinessId,
      iLocationId: this.iLocationId,
      sDayClosureMethod: 'location' /* passing default because we need to check in all workstation for particular location */
    }
    this.dayClosureCheckSubscription = this.apiService.postNew('cashregistry', `/api/v1/statistics/day-closure/check`, oBody).subscribe(async (result: any) => {
      /* if any day-state is open then we don't allow to change the method as it will create the calculation problem in statistics */
      if (result?.data?.bIsDayStateOpened) {
        this.settings.sDayClosureMethod = sRevertDayClosureMethod;
        this.toastService.show({ type: 'warning', text: 'Please close all the day-state first then and only you can change the method' });
      }
    }, (error) => {
      this.toastService.show({ type: 'warning', text: 'something went wrong' });
    });
  }

  setSequenceForCashRegister(){
    this.dialogService.openModal(SetPaymentMethodSequenceComponent, { 
      context: { 
        payMethods: this.aAllPaymentMethods.filter((el: any) => el.bShowInCashRegister),
        aPaymentMethodSequence: this.settings?.aPaymentMethodSequence || []
      }, 
      cssClass: "modal-m", hasBackdrop: true, closeOnBackdropClick: true, closeOnEsc: true }).instance.close.subscribe(result => {
      if (result?.action) {
        this.settings = result?.data;
      }
    });
  }
 
  ngOnDestroy(): void {
    if (this.deleteMethodModalSub) this.deleteMethodModalSub.unsubscribe();
    if (this.getSettingsSubscription) this.getSettingsSubscription.unsubscribe();
    if (this.getCustomerSettingsSubscription) this.getCustomerSettingsSubscription.unsubscribe();
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
    if (this.dayClosureCheckSubscription) this.dayClosureCheckSubscription.unsubscribe();
  }
}
