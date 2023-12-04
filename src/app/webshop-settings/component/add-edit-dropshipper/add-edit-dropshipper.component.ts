import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../../shared/service/api.service';
import { DialogComponent } from "../../../shared/service/dialog";
import { ToastService } from '../../../shared/components/toast';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-add-edit-dropshipper',
  templateUrl: './add-edit-dropshipper.component.html',
  styleUrls: ['./add-edit-dropshipper.component.scss']
})
export class AddEditDropshipperComponent implements OnInit {

  dialogRef: DialogComponent;
  dropshipper!: any;
  faTimes = faTimes;
  dropshipperFormGroup : FormGroup;
  brandsList: Observable<any> = of([]);
  selectedLanguage: string;
  brandInput$= new Subject<string>();
  brandLoading: boolean = false;
  requestParams : any = {
    bIsShowDeletedBrand: false,
    iBusinessId: "",
    limit: 10,
    oFilterBy: {},
    searchValue: "",
    skip: 0,
    sortBy: "_id",
    sortOrder: -1
  }
  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private formBuilder: FormBuilder
  ) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);

    this.selectedLanguage = localStorage.getItem('language') || 'nl';
    this.requestParams.iBusinessId = localStorage.getItem("currentBusiness");

    this.dropshipperFormGroup = formBuilder.group({
      oBrandDetails: [{}, Validators.required],
      bShowProducts: [false],
      bDefaultDropshipper: [false],
      bCanReserve: [false],
      bCanDeliver: [false]
    });
  }

  ngOnInit(): void {
    if(this.dropshipper){
      this.dropshipperFormGroup.controls.bShowProducts.setValue(this.dropshipper.bShowProducts);
      this.dropshipperFormGroup.controls.bDefaultDropshipper.setValue(this.dropshipper.bDefaultDropshipper);
      this.dropshipperFormGroup.controls.bCanReserve.setValue(this.dropshipper.bCanReserve);
      this.dropshipperFormGroup.controls.bCanDeliver.setValue(this.dropshipper.bCanDeliver);
      this.dropshipperFormGroup.controls.oBrandDetails.setValue({ sName : this.dropshipper.oBrandMetaData.sName || '', sAlias: this.dropshipper.oBrandMetaData.sAlias || ''});
      this.dropshipperFormGroup.controls.oBrandDetails.disable();
    }

    this.brandsList =this.brandInput$.pipe(
      distinctUntilChanged(),
      tap(() =>this.brandLoading = true),
      switchMap(async (term : any) => {
        if(term?.length < 3) return [];
        this.requestParams.searchValue = term;
        let result: any = await this.apiService.postNew('core', '/api/v1/business/brands/list', this.requestParams).toPromise();
        let finalResult = result?.data?.length > 0 ? result?.data[0]?.result : [];
        return finalResult
      }),
      tap(() => this.brandLoading = false)
    )
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  save(){
    let requestDetails = this.dropshipperFormGroup.value;
    requestDetails.iBusinessId = this.requestParams.iBusinessId;

    if(this.dropshipper){
      // Update existing dropshipper
      this.apiService.putNew('core', '/api/v1/dropshipper/'+ this.dropshipper._id, requestDetails).subscribe((result : any) => {
        this.dialogRef.close.emit('fetchList');
      },(error : any) => {
        this.toastService.show({ type: 'warning', text: 'ERROR_WHILE_ADDING_DROPSHIPPER'});
      })
    } else {
      // Create new dropshipper
      requestDetails.iBrandId = requestDetails.oBrandDetails.iBrandId;
      requestDetails.iBusinessPartnerId = requestDetails.oBrandDetails.iBusinessPartnerId;
      requestDetails.oBrandMetaData = { sAlias: requestDetails.oBrandDetails.sAlias, sName: requestDetails.oBrandDetails.sName };
      delete requestDetails.oBrandDetails;

      this.apiService.postNew('core', '/api/v1/dropshipper', requestDetails).subscribe((result : any) => {
        this.dialogRef.close.emit('fetchList');
      },(error : any) => {
        this.toastService.show({ type: 'warning', text: 'ERROR_WHILE_ADDING_DROPSHIPPER'});
      })
    }
  }
}
