import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { faTimes, faSync } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-transaction-details-import',
  templateUrl: './transaction-details-import.component.html',
  styleUrls: ['./transaction-details-import.component.sass']
})
export class TransactionDetailsImportComponent implements OnInit, OnChanges {


  @Input() transactionDetailsForm: any;
  @Output() transactionDetailsFormChange: EventEmitter<any> = new EventEmitter();
  @Input() updateTemplateForm: any;
  @Output() updateTemplateFormChange: EventEmitter<any> = new EventEmitter();
  @Input() parsedTransactionData: any;
  @Output() moveToStep: EventEmitter<any> = new EventEmitter();

  faTimes = faTimes;
  faSync = faSync;
  iBusinessId: string = '';
  iLocationId: string = '';

  headerOptions: Array<any> = [];

  doNothingForFields: Array<string> = [];
  overwriteForFields: Array<string> = [];
  ifUndefinedForFields: Array<string> = [];
  appendForFields: Array<string> = [];


  allFields: any = {
    first: [],
    last: [],
    all: []
  };

  language: string = 'nl';
  languageList = [
    { name: 'DUTCH', key: 'nl' },
    { name: 'ENGLISH', key: 'en' },
    { name: 'GERMAN', key: 'de' },
    { name: 'FRENCH', key: 'fr' },
    { name: 'SPANISH', key: 'es' }
  ]

  constructor(
    private apiService: ApiService,
    private toasterService: ToastService
  ) { }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem("currentBusiness") || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    // if (this.transactionDetailsForm?.isTransaction) this.getDynamicFields(false); // FOR TESTING AND DYNAMIC DATA(TRANSACTION)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.parsedTransactionData && this.parsedTransactionData.length > 0) {
      this.headerOptions = Object.keys(this.parsedTransactionData[0]);
      this.transactionDetailsForm = {};
      this.updateTemplateForm = {};
      this.headerOptions.filter((option: any) => this.updateTemplateForm[option] = 'overwrite');
      this.getDynamicFields(false);
    }
  }

  // Function for get dynamic field
  getDynamicFields(isResetAttributes: boolean) {
    let filter = {
      oFilterBy: {
        "sName": "import transaction details"
      },
      "iBusinessId": this.iBusinessId,
      "iLocationId": this.iLocationId
    };

    this.apiService.postNew('core', '/api/v1/properties/list', filter).subscribe((result: any) => {
      if (result && result.data && result.data.length > 0) {
        this.allFields['all'] = result.data[0].aOptions;
        if (isResetAttributes) {
          this.transactionDetailsForm = {};
          this.updateTemplateForm = {};
        }
        this.allFields['all'].filter((field: any) => {
          if (this.headerOptions.indexOf(field.sKey) > -1) {
            this.transactionDetailsForm[field.sKey] = field.sKey;
          }
        });
      }
    }, error => {
      console.error("error :", error);
    })
  }


  filteredFieldOptions(optionFor: string, index: string): Array<string> {
    let uniqueList = [];
    switch (optionFor) {
      case 'DO_NOTHING':
        uniqueList = this.allFields[index].filter((o: any) => this.overwriteForFields.indexOf(o) === -1 && this.ifUndefinedForFields.indexOf(o) === -1 && this.appendForFields.indexOf(o) === -1);
        break;
      case 'OVERWRITE':
        uniqueList = this.allFields[index].filter((o: any) => this.doNothingForFields.indexOf(o) === -1 && this.ifUndefinedForFields.indexOf(o) === -1 && this.appendForFields.indexOf(o) === -1);
        break;
      case 'ADD_IF_UNDEFINED':
        uniqueList = this.allFields[index].filter((o: any) => this.overwriteForFields.indexOf(o) === -1 && this.doNothingForFields.indexOf(o) === -1 && this.appendForFields.indexOf(o) === -1);
        break;
      case 'APPEND':
        uniqueList = this.allFields[index].filter((o: any) => this.overwriteForFields.indexOf(o) === -1 && this.ifUndefinedForFields.indexOf(o) === -1 && this.doNothingForFields.indexOf(o) === -1);
        break;
      default:
        uniqueList = this.allFields[index];
    }
    return uniqueList;
  }

  // Function for go to step(next / previous)
  gotoStep(step: string) {
    if (Object.keys(this.transactionDetailsForm).length != this.headerOptions.length) {
      this.toasterService.show({ type: 'danger', text: 'You have not set some of the attributes exist in file.' });
    }
    this.updateTemplateFormChange.emit(this.updateTemplateForm);
    this.transactionDetailsFormChange.emit(this.transactionDetailsForm);
    this.moveToStep.emit(step);
  }

  // Function for validate customer detail header linking
  validateTransactionHeaderLink(): boolean {
    return Object.keys(this.transactionDetailsForm).length == 0;
  }

}
