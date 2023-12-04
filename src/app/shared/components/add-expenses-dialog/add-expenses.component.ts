import { Component, OnInit, Input, Output, EventEmitter, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../toast';
import { CreateArticleGroupService } from '../../service/create-article-groups.service';
import { TaxService } from '../../service/tax.service';

@Component({
  selector: 'app-add-expenses',
  templateUrl: './add-expenses.component.html',
  styleUrls: ['./add-expenses.component.sass']
})
export class AddExpensesComponent implements OnInit {

  @Input() public country = 'NL';
  @Input() public taxes: Array<any> = [];
  @Output() countryChanged = new EventEmitter<string>();
  @Output() customerCountryChanged = new EventEmitter<string>();

  dialogRef: DialogComponent;
  faTimes = faTimes;
  expenseForm: any;
  focusValue = false;
  name: any;
  submitted = false;
  ledgerDescriptions = ['drinks', 'food', 'cleaning costs', 'office supplies', 'promotional material', 'shipping costs', 'car costs', 'Add money to cash register', 'Lost money/money difference'];
  selectedArticleGroup: any;
  allArticleGroups: any = [];
  currentEmployeeId: any;
  paymentMethod: any;
  // nVatRate: any;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastrService: ToastService,
    private createArticleGroupService: CreateArticleGroupService,
    private fb: FormBuilder,
    // private taxService: TaxService
  ) {
    const _injector = this.viewContainerRef.injector;;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.paymentMethod = this.dialogRef.context.paymentMethod;
  }

  async ngOnInit() {
    const value = localStorage.getItem('currentEmployee');
    const iLocationId: any = localStorage.getItem('currentLocation');
    // this.nVatRate = await this.taxService.fetchDefaultVatRate({ iLocationId: iLocationId });
    if (value) {
      this.currentEmployeeId = JSON.parse(value)._id;
    }
    this.getArticleGroup();
    this.expenseForm = this.fb.group({
      amount: new FormControl('', [Validators.required, Validators.min(1)]),
      expenseType: new FormControl('', [Validators.required]),
      tax: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
    });
  }

  get f() { return this.expenseForm.controls };

  assignArticleGroup() {
    this.selectedArticleGroup = null;
    const expenseType = this.expenseForm.value.expenseType;
    this.selectedArticleGroup = this.allArticleGroups.find((o: any) => o.sSubCategory === this.expenseForm.value.expenseType);
    if (!this.selectedArticleGroup) {
      this.createArticleGroup(expenseType);
    }
  }
  getArticleGroup() {
    this.createArticleGroupService.checkArticleGroups('expenses')
      .subscribe((res: any) => {
        if (res.data[0]) {
          this.allArticleGroups = res.data[0].result;
          this.selectedArticleGroup = this.allArticleGroups[0];
        } else {
          this.createArticleGroup('food');
        }
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }

  async createArticleGroup(sSubCategory: string) {
    const articleBody = { name: 'expenses', sCategory: 'expenses', sSubCategory };
    const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
    this.allArticleGroups.push(result.data);
    this.selectedArticleGroup = result.data;
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  submit() {
 
    if (this.expenseForm.invalid) {
      return;
    }
    const { amount, expenseType, description, tax } = this.expenseForm.value;

    const oArticleGroupMetaData = {
      aProperty: this.selectedArticleGroup.aProperty,
      sCategory: this.selectedArticleGroup.sCategory,
      sSubCategory: this.selectedArticleGroup.sSubCategory,
      oName: this.selectedArticleGroup.oName
    }
    const oPayment = {
      iPaymentMethodId: this.paymentMethod._id,
      sMethod: this.paymentMethod.sName.toLowerCase(),
      nAmount: -(amount),
    };
    const transactionItem = {
      sProductName: 'Expenses',
      sComment: description,
      nPriceIncVat: amount,
      nPurchasePrice: amount,
      iBusinessId: localStorage.getItem('currentBusiness'),
      iArticleGroupId: this.selectedArticleGroup._id,
      oArticleGroupMetaData,

      nTotal: -(amount),
      nPaymentAmount: -(amount),
      nRevenueAmount: -(amount),
      iWorkstationId: localStorage.getItem('currentWorkstation'),
      iEmployeeId: this.currentEmployeeId,
      iLocationId: localStorage.getItem('currentLocation'),
      nVatRate: tax,
      oType: {
        eTransactionType: 'expenses',
        bRefund: false,
        eKind: 'expenses',
        bDiscount: false,
      },
      oPayment
    }
    this.apiService.postNew('cashregistry', '/api/v1/till/add-expenses', transactionItem)
      .subscribe((res: any) => {
        this.toastrService.show({ type: 'success', text: res.message });
        this.close(res);
      }, err => {
        this.toastrService.show({ type: 'danger', text: err.message });
      });
  }
}
