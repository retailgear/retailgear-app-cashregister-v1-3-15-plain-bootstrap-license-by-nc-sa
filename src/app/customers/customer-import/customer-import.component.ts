import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../shared/components/toast';
import { ApiService } from '../../shared/service/api.service';
import { ImportService } from '../../shared/service/import.service';
import { TranslationsService } from '../../shared/service/translation.service';
import { StepperComponent } from '../../shared/_layout/components/common';
@Component({
  selector: 'app-customer-import',
  templateUrl: './customer-import.component.html',
  styleUrls: ['./customer-import.component.scss']
})
export class CustomerImportComponent implements OnInit {

  stepperIndex: any = 0;
  parsedCustomerData: Array<any> = [];
  customerDetailsForm: any;
  updateTemplateForm: any;
  importInprogress: boolean = false;
  businessDetails: any = {};
  stepperInstatnce: any;
  translate:any =[];
  bShowError: boolean = false;
  
  @ViewChild('stepperContainer', { read: ViewContainerRef }) stepperContainer!: ViewContainerRef;
  created: any;
  failed: any;

  constructor(
    private importService: ImportService,
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private toastService:ToastService ,
    private translationService:TranslateService
  ) { 
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.businessDetails._id = localStorage.getItem('currentBusiness')
    const translate = ['SUCCESSFULLY_IMPORTED'];
    this.translationService.get(translate).subscribe((res:any)=>{
      this.translate = res;
    })
  }

  ngAfterContentInit(): void {
    StepperComponent.bootstrap();
    setTimeout(() => {
      this.stepperInstatnce = StepperComponent.getInstance(this.stepperContainer.element.nativeElement);
    }, 200);
  }

  public moveToStep(step: any) {
    if (step == 'next') {
      this.stepperInstatnce.goNext();
    } else if (step == 'previous') {
      this.stepperInstatnce.goPrev();
    } else if (step == 'import') {
      this.importCustomer()
      this.stepperInstatnce.goNext();
    }
  }

  importCustomer() {
    let newParsedCustomer:any =[];
    let updatedTemplate ={};
    
    for(let[key , value] of Object.entries(this.parsedCustomerData[0])){
 
      let updateTem = this.customerDetailsForm[key];
      updatedTemplate ={ ... updatedTemplate , [updateTem]:this.updateTemplateForm[key]}
    }

    this.parsedCustomerData.forEach((customer:any)=>{
        let newCustomer={}
         for (let [key, value] of Object.entries(customer)) {
             let cus = this.customerDetailsForm[key];
             newCustomer ={ ... newCustomer , [cus]:value}
         }
      
         newParsedCustomer.push(newCustomer);
    })

    this.importInprogress = true;
    let data: any = {
      iBusinessId: this.businessDetails._id,
      oTemplate: this.importService.processImportCustomer({ customer:updatedTemplate }),
      aCustomer: newParsedCustomer,
      sDefaultLanguage: localStorage.getItem('language') || 'nl'
    };


    this.apiService.postNew('customer', '/api/v1/customer/import', data).subscribe((result: any) => {
      this.importInprogress = false;
      if(result?.message == 'success'){
        this.created = result?.data?.created || [];
        this.failed = result?.data?.failed || [];
        this.parsedCustomerData = [];
        this.toastService.show({type:'success' , text:this.translate['SUCCESSFULLY_IMPORTED']})
      }
    }, (error) => {
      this.parsedCustomerData = [];
      this.bShowError = true;
    });
  }

}
