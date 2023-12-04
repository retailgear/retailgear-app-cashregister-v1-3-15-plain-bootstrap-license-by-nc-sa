import { Component, OnInit } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { NgForm } from "@angular/forms";
import { TranslateService } from '@ngx-translate/core';
import { DialogComponent, DialogService } from '../../service/dialog';
import { ApiService } from '../../service/api.service';
import { ToastService } from '../toast';


@Component({
  selector: 'app-customer-group-detail',
  templateUrl: './customer-group-detail.component.html',
  styleUrls: ['./customer-group-detail.component.scss']
})
export class CustomerGroupDetailComponent implements OnInit {

  dialogRef: DialogComponent;
  customerGroup:any={
    'sName':'',
    'sDescription':'',
    'iBusinessId':'',
    'iLocationId':'',
    '_id':''
  }
  mode='create';
  bDisabled:Boolean = false;
  translate:any=[];

  constructor( private viewContainerRef: ViewContainerRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private dialogService: DialogService,
    private translateService: TranslateService ,) { 
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
       this.customerGroup.iBusinessId =localStorage.getItem('currentBusiness');
       this.customerGroup.iLocationId = localStorage.getItem('currentLocation');
       const translate=['GROUPS_ADDED_SUCCESSFULLY' , 'GROUPS_UPDATE_SUCCESSFULLY'];
       this.translateService.get(translate).subscribe((res:any)=>{
        this.translate = res
       })
  }

  createGroup(){
   this.bDisabled=true;
   this.apiService.postNew('customer' , '/api/v1/group/create' ,this.customerGroup).subscribe((res:any)=>{
     this.bDisabled=false;
     if(res?.message == 'success'){
      this.close({action:true , customerGroup:res?.data});
      this.toastService.show({type:'success' , text:this.translate['GROUPS_ADDED_SUCCESSFULLY']});
     }else{
      this.close({action:false});
      this.toastService.show({type:'warning' , text:res?.message});
     }
   })
  }

  updateGroup(){
    this.bDisabled=true;
    this.apiService.putNew('customer' , '/api/v1/group/update' ,this.customerGroup).subscribe((res:any)=>{
      this.bDisabled=false;
      if(res?.message == 'success'){
       this.close({action:true , customerGroup:res?.data});
       this.toastService.show({type:'success' , text:this.translate['GROUPS_UPDATE_SUCCESSFULLY']});
      }else{
       this.close({action:false});
       this.toastService.show({type:'warning' , text:res?.message});
      }
    })
  }

  close(data: any) {
    this.dialogRef.close.emit(data);
  }
}
