import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { CreateArticleGroupService } from '../../service/create-article-groups.service';
import { DialogComponent, DialogService } from "../../service/dialog";
import { TillService } from '../../service/till.service';
import { AddExpensesComponent } from '../add-expenses-dialog/add-expenses.component';

@Component({
  selector: 'app-closing-daystate-helper-dialog',
  templateUrl: './closing-daystate-helper-dialog.component.html',
  styleUrls: ['./closing-daystate-helper-dialog.component.scss']
})
export class ClosingDaystateHelperDialogComponent implements OnInit {
  dialogRef: DialogComponent
  faTimes = faTimes;
  oHelperDetails:any = {
    oStartAmountIncorrect: {
      bChecked: false,
      nAmount: 0,
    },
    bCantCloseDueToDifference: false,
    bWrongDayEndCash: false,
    aReasons: [{ nAmount: 0}]
  }
  oCountings:any;
  aReasons:any = [
    { sKey: 'expense-lost-money', sTitle: 'LOST_MONEY', bAllowMultiple: false },
    { sKey: 'add-expenses', sTitle: 'WANT_TO_ADD_EXPENSES', bAllowMultiple: true },
    { sKey: 'add-cash-without-revenue', sTitle: 'FOUND_CASH_TO_BE_ADDED_NO_REVENUE', bAllowMultiple: false },
    { sKey: 'cash-should-higher', sTitle: 'CASH_SHOULD_BE_HIGHER_BECAUSE_SOLD_SOMETHING_WITHOUT_USING_CASH_REGISTER', bAllowMultiple: false },
    { sKey: 'cash-should-lower', sTitle: 'CASH_SHOULD_BE_LOWER_BUT_NOT_USED_CASH_REGISTER', bAllowMultiple: false },
    { sKey: 'taken-by-owner', sTitle: 'TAKEN_BY_OWNER', bAllowMultiple: false },
  ];
  oCashPaymentMethod:any;
  bDisable:boolean = false;
  bProcessing: boolean = false;
  nStandardTax:number = 0;

  constructor(
    private viewContainerRef: ViewContainerRef,
    public tillService: TillService,
    private dialogService: DialogService,
    private articleGroupService: CreateArticleGroupService) {
    const _injector = this.viewContainerRef.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit() {
    if (this.oHelperDetails?.aReasons[0]?.sKey) {
      this.oHelperDetails.aReasons.forEach((oReason: any) => {
        const oItem = this.aReasons.find((el: any) => el.sKey == oReason.sKey)
        oReason.sTitle = oItem.sTitle;
        if (['expense-lost-money', 'add-expenses'].includes(oReason.sKey)) oReason.nAmount = -oReason.nAmount;
        if (oReason.sKey == 'add-expenses') oReason.bDisabled = true;
      });
    } else {
      this.oHelperDetails.aReasons[0].aOptions = [...this.aReasons];
    }
    this.nStandardTax = Math.max(...this.tillService.taxes.map((el:any) => el.nRate));
  }

  reset() {
    this.oHelperDetails = {
      oStartAmountIncorrect: {
        bChecked: false,
        nAmount: 0,
      },
      bCantCloseDueToDifference: false,
      bWrongDayEndCash: false,
      aReasons: [{ nAmount: 0 }],
      bSaved: true
    };
  }
  remove(index:number){
    this.oHelperDetails.aReasons.splice(index, 1);
    if (!this.oHelperDetails.aReasons?.length) this.addMoreReasons();
  }

  async close(bStatus:boolean = false) {
    const oBody:any = { type: bStatus };
    if(bStatus) {
      this.bProcessing = true;
      await this.processHelperDetailsForContinue();
      this.bProcessing = true;
      oBody.oHelperDetails = this.oHelperDetails;
    }
    this.dialogRef.close.emit(oBody)
  }

  processHelperDetailsForContinue() {
    return new Promise(async (resolve, reject) => {
      
      if(this.oHelperDetails.oStartAmountIncorrect.bChecked) {
        const sType = 'modified-start-amount';
        const title = 'MODIFIED_CASH_REGISTER_START_AMOUNT';
        const oExpenseType = { title, type: 'positive', eDefaultArticleType: sType };
        const oArticleGroup: any = await this.articleGroupService.getArticleGroupData(sType);
        this.oHelperDetails.oStartAmountIncorrect.oExpense = this.tillService.prepareExpenseBody(
          oArticleGroup, 
          this.oCashPaymentMethod, 
          oExpenseType, 
          this.oHelperDetails.oStartAmountIncorrect.nAmount,
          0);
      }
      for(const oReason of this.oHelperDetails.aReasons) {
        if(oReason.sKey == 'add-expenses') continue;
        let oExpenseType, oArticleGroup, nTax:number = 0;
        const eDefaultArticleType = oReason.sKey;
        switch(eDefaultArticleType) {
          case 'expense-lost-money':
            oExpenseType = this.tillService.ledgerDescriptions.find((el: any) => el.eDefaultArticleType == eDefaultArticleType);
            nTax = this.nStandardTax;
            break;
          case 'add-cash-without-revenue':
            nTax = 0;
            oExpenseType = { title: 'ADD_CASH_WITHOUT_REVENUE', type: 'positive', eDefaultArticleType };
            break;
          case 'taken-by-owner':
            nTax = 0;
            oExpenseType = { title: 'TAKEN_BY_OWNER', type: 'negative', eDefaultArticleType};
            break;
        } 
        oArticleGroup = await this.articleGroupService.getArticleGroupData(eDefaultArticleType);
        oReason.oExpense = this.tillService.prepareExpenseBody(oArticleGroup,this.oCashPaymentMethod,oExpenseType,oReason.nAmount, nTax);
      }
      resolve(true);
    })
  }

  addMoreReasons() {
    const oNewItem:any = { nAmount: 0, aOptions: JSON.parse(JSON.stringify(this.aReasons)) };
    this.oHelperDetails.aReasons.forEach((oReason:any) => {
      const oData = oNewItem.aOptions.find((el:any) => el.sKey == oReason.sKey);
      if (oData.bAllowMultiple) oData.bDisabled = false;
      else oData.bDisabled = true;
    })
    this.oHelperDetails.aReasons.push(oNewItem);
  }

  async onChange(key:any, oReason: any, index:number) {
    // const oItem = this.aReasons.find((el: any) => el.sKey == key);
    // oReason.sTitle = oItem.sTitle;
    if (key == 'add-expenses') {
      this.dialogService.openModal(AddExpensesComponent, {
        cssClass: 'modal-m',
        context: {
          paymentMethod: this.oCashPaymentMethod,
          bImmediateCreate: false
        },
        hasBackdrop: true,
      }).instance.close.subscribe(result => {
        if (result) {
          oReason.nAmount = result.nAmount;
          oReason.oExpense = result;
          oReason.bDisabled = true;
        } else {
          this.remove(index);
        }
      });
    } else if (key == 'cash-should-higher' || key == 'cash-should-lower') {
      oReason.bShowMsg = true;
      oReason.sMessage = 'PLEASE_USE_THE_CASH_REGISTER_FOR_THIS';
    }
  }

  validate() {
    this.bDisable = false;
    if (this.oHelperDetails.oStartAmountIncorrect.nAmount <= 0) this.bDisable = true;
  }

}
