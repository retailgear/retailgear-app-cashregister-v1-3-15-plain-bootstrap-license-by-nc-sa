import { Component, OnInit, Input, Output, EventEmitter, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../toast';
import { CreateArticleGroupService } from '../../service/create-article-groups.service';
import { TillService } from '../../service/till.service';

@Component({
  selector: 'app-add-expenses',
  templateUrl: './add-expenses.component.html',
  styleUrls: ['./add-expenses.component.scss']
})
export class AddExpensesComponent implements OnInit {

  taxes:any;
  dialogRef: DialogComponent;
  faTimes = faTimes;
  expenseForm: any;
  focusValue = false;
  name: any;
  submitted = false;
  
  selectedArticleGroup: any;
  allArticleGroups: any = [];
  paymentMethod: any;
  // nVatRate: any;
  iLocationId: any = localStorage.getItem('currentLocation');
  iBusinessId: any = localStorage.getItem('currentBusiness');
  iWorkstationId: any = localStorage.getItem('currentWorkstation');
  bLoading = false;
  bImmediateCreate:boolean = true;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastrService: ToastService,
    private articleGroupService: CreateArticleGroupService,
    private fb: FormBuilder,
    public tillService: TillService
  ) {
    const _injector = this.viewContainerRef.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.paymentMethod = this.dialogRef.context.paymentMethod;
  }

  async ngOnInit() {
    this.taxes = this.tillService.taxes;
    this.expenseForm = this.fb.group({
      nAmount: new FormControl('', [Validators.required, Validators.min(1)]),
      oExpenseType: new FormControl('', [Validators.required]),
      nTax: new FormControl('', [Validators.required]),
      sDescription: new FormControl('', [Validators.required]),
    });
  }

  get f() { return this.expenseForm.controls };

  close(data: any) {
    this.dialogRef.close.emit(data);
  }

  async submit() {
    if (this.expenseForm.invalid) return;
    this.bLoading = true;
    const { nAmount, oExpenseType, sDescription, nTax } = this.expenseForm.value;

    const _result: any = await this.articleGroupService.checkArticleGroups(oExpenseType.eDefaultArticleType).toPromise();

    const oArticleGroup = _result.data;
    const oBody = {
      oArticleGroup, 
      oPaymentMethod: this.paymentMethod,
      oExpenseType,
      nTax,
      sDescription,
      nAmount
    }
    const oTransactionItem = this.tillService.createExpenseTransactionItem(oBody);

    if (this.bImmediateCreate) {
      this.apiService.postNew('cashregistry', '/api/v1/till/add-expenses', oTransactionItem)
        .subscribe((res: any) => {
          this.bLoading = true;
          this.toastrService.show({ type: 'success', text: res.message });
          this.close({ oTransactionItem, ...oBody });
        }, err => {
          this.toastrService.show({ type: 'danger', text: err.message });
        });
    } else {
      this.close({ oTransactionItem, ...oBody});
    }
  }
}
