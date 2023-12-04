import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../../shared/service/api.service';
import { DialogComponent } from "../../../shared/service/dialog";
import { ToastService } from '../../../shared/components/toast';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-add-edit-coupon',
  templateUrl: './add-edit-coupon.component.html',
  styleUrls: ['./add-edit-coupon.component.scss']
})
export class AddEditCouponComponent implements OnInit {

  dialogRef: DialogComponent;
  couponDetails: any;
  faTimes = faTimes;
  couponFormGroup : FormGroup;
  articleGroups: Observable<any> = of([]);
  articleInput$ = new Subject<string>();
  selectedLanguage: string;
  requestParams : any = {
    skip: 0,
    limit: 25,
    sortBy: '',
    sortOrder: '',
    searchValue: '',
    oFilterBy: {
    },
    iBusinessId: ''
  };
  articlesLoading: boolean

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private formBuilder: FormBuilder,
    
  ) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    let currentDate = new Date();
    
    currentDate.setFullYear(currentDate.getFullYear() + 10);
    var day = ("0" + currentDate.getDate()).slice(-2);
    var month = ("0" + (currentDate.getMonth() + 1)).slice(-2);

    var today = currentDate.getFullYear()+"-"+(month)+"-"+(day) ;
    this.couponFormGroup = formBuilder.group({
      sCouponCode: ['', Validators.required],
      nAmount: [0, Validators.required],
      nMinSpend: [0],
      sDiscountType: ['fixedAmount', Validators.required],
      dDateExpired: [today, Validators.required],
      nLimit: [10000],
      nTimesUsed: [0],
      bExcludeProduct: [false],
      aProductArticleGroup: [[]],
      bExcludeSaleProduct: [true]
    });
    this.selectedLanguage = localStorage.getItem('language') || 'nl';
    this.requestParams.iBusinessId = localStorage.getItem("currentBusiness");
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    if(this.couponDetails){
      // this.articleGroups = of(this.couponDetails.aProductArticleGroup);
      this.couponFormGroup.patchValue(this.couponDetails);
      this.couponFormGroup.controls.dDateExpired.setValue(new Date(this.couponDetails.dDateExpired).toISOString().split('T')[0]);
      // this.couponFormGroup.get('aProductArticleGroup')?.setValue(this.couponDetails.aProductArticleGroup)
    }

    this.articleGroups =this.articleInput$.pipe(
      distinctUntilChanged(),
      tap(() =>this.articlesLoading = true),
      switchMap(async (term : any) => {
        if(term?.length < 3) return [];
        this.requestParams.searchValue = term;
        let result: any = await this.apiService.postNew('core', '/api/v1/business/article-group/list', this.requestParams).toPromise();
        let finalResult = result?.data?.length > 0 ? result?.data[0]?.result : [];
        return finalResult
      }),
      tap(() => this.articlesLoading = false)
    )
  }

  trackByFn(item: any) {
    return item._id;
  }

  fetchArticleGroups(event ?: any){
    this.apiService.postNew('core', '/api/v1/business/article-group/list', this.requestParams).subscribe(
      (result: any) => {
        if (result.data && result.data.length > 0) {
          this.articleGroups = of(result.data[0].result)
        }
      }
    );
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  save() {
    let requestDetails = this.couponFormGroup.value;
    requestDetails.aProductArticleGroup = this.couponFormGroup.value.aProductArticleGroup.map((article : any) => { return {_id: article._id, oName: article.oName}; });
    requestDetails.iBusinessId = localStorage.getItem('currentBusiness');
    requestDetails.iLocationId = localStorage.getItem('currentLocation');
    if(this.couponDetails?._id){
      requestDetails._id = this.couponDetails._id;
      this.apiService.putNew('cashregistry', '/api/v1/coupons/update', requestDetails).subscribe(
        (result : any) => {
          if(result.message == 'success'){
            this.toastService.show({ type: 'success', text: 'COUPON_UPDATED' });
            this.dialogRef.close.emit('fetchList');
          } else {
            this.toastService.show({ type: 'danger', text: 'ERROR_WHILE_UPDATING_COUPON' });
          }
          
        }
      )
    } else {
      this.apiService.postNew('cashregistry', '/api/v1/coupons/create', requestDetails).subscribe(
        (result : any) => {
          if(result.message == 'success'){
            this.toastService.show({ type: 'success', text: 'NEW_COUPON_CREATED' });
            this.dialogRef.close.emit('fetchList');
          } else {
            this.toastService.show({ type: 'danger', text: 'ERROR_WHILE_CREATING_COUPON' });
          }
          
        }
      )
    }
  }
}
