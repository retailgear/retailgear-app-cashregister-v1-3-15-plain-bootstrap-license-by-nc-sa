import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
import { faTimes, faSync } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-customer-details-import',
  templateUrl: './customer-details-import.component.html',
  styleUrls: ['./customer-details-import.component.sass']
})
export class CustomerDetailsImportComponent implements OnInit, OnChanges {


  @Input() customerDetailsForm: any;
  @Output() customerDetailsFormChange: EventEmitter<any> = new EventEmitter();
  @Input() updateTemplateForm: any;
  @Output() updateTemplateFormChange: EventEmitter<any> = new EventEmitter();
  @Input() parsedCustomerData: any;
  @Output() moveToStep: EventEmitter<any> = new EventEmitter();

  faTimes = faTimes;
  faSync = faSync;

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
    this.apiService.setToastService(this.toasterService);
    // if (this.customerDetailsForm?.isTransaction) this.getDynamicFields(false); // FOR TESTING AND DYNAMIC DATA(TRANSACTION)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.parsedCustomerData && this.parsedCustomerData.length > 0) {
      this.headerOptions = Object.keys(this.parsedCustomerData[0]);
      this.customerDetailsForm = {};
      this.updateTemplateForm = {};
      this.headerOptions.filter((option: any) => this.updateTemplateForm[option] = 'overwrite');
      this.getDynamicFields(false);
    }
  }

  // Function for get dynamic field
  getDynamicFields(isResetAttributes: boolean) {
    let filter = {
      oFilterBy: {
        "sName": "IMPORT_CUSTOMER_DETAILS"
      }
    };

    this.apiService.postNew('core', '/api/v1/properties/list', filter).subscribe((result: any) => {
      if (result && result.data && result.data.length > 0) {
        this.allFields['all'] = result.data[0].result[0].aOptions;
        if (isResetAttributes) {
          this.customerDetailsForm = {};
          this.updateTemplateForm = {};
        }
        this.allFields['all'].filter((field: any) => {
          if (this.headerOptions.indexOf(field.sKey) > -1) {
            this.customerDetailsForm[field.sKey] = field.sKey;
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
    if (Object.keys(this.customerDetailsForm).length != this.headerOptions.length) {
      this.toasterService.show({ type: 'danger', text: 'You have not set some of the attributes exist in file.' });
    }
    this.updateTemplateFormChange.emit(this.updateTemplateForm);
    this.customerDetailsFormChange.emit(this.customerDetailsForm);
    this.moveToStep.emit(step);
  }

  // Function for validate customer detail header linking
  validateCustomerHeaderLink(): boolean {
    return Object.keys(this.customerDetailsForm).length == 0;
  }

}
