import { Component, OnInit, Input, Output, EventEmitter, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiService } from '../../service/api.service';
import { DialogComponent } from '../../service/dialog';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../toast';
import { CreateArticleGroupService } from '../../service/create-article-groups.service';
import { TransactionItem } from 'src/app/till/models/transaction-item.model';

@Component({
  selector: 'app-more-payments-dialog',
  templateUrl: './more-payments-dialog.component.html',
  styleUrls: ['./more-payments-dialog.component.scss']
})
export class MorePaymentsDialogComponent implements OnInit {


  dialogRef: DialogComponent;

  private countryListByLang: any;
  faTimes = faTimes;
  filteredOptions$: Array<any> = [];
  expenseForm: any;
  focusValue = false;
  name: any;
  submitted = false;
  allPaymentMethods: Array<any> = [];
  constructor(
    private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastrService: ToastService,
    private createArticleGroupService: CreateArticleGroupService,
    private fb: FormBuilder,
  ) {
    const _injector = this.viewContainerRef.injector;;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit() {
    this.allPaymentMethods = this.dialogRef.context;
  }

  get f() { return this.expenseForm.controls };

  private filter(value: string): { key: '', value: '' }[] {
    const filterValue = value.toLowerCase();
    const filteredList = this.countryListByLang.filter((optionValue: any) => optionValue.value.toLowerCase().includes(filterValue));
    return filteredList;
  }

  onModelChange(value: string) {
    this.filteredOptions$ = this.filter(value);
  }


  close(data: any) {
    this.dialogRef.close.emit(data);
  }
  selectMethod(method: any) {
  }
  submit() {

  }
}