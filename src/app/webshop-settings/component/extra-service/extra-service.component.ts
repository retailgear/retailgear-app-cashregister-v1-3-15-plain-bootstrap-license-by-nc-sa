import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, Subject, of } from 'rxjs';
import { distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../shared/service/api.service';
import { ToastService } from '../../../shared/components/toast';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'extra-service',
  templateUrl: './extra-service.component.html',
  styleUrls: ['./extra-service.component.scss']
})
export class ExtraServiceComponent implements OnInit {

  constructor(
    private domSanitizer : DomSanitizer,
    private apiService : ApiService,
    private toastService: ToastService,
    private translateService: TranslateService
  ) { }

  service : any = {
    bGiftWrap : false,
    bEngraving : false,
    oGiftWrapDetails : {
      oBasic : {
        bEnabled : false,
        nPrice : 0
      },
      oPremium : {
        bEnabled : false,
        nPrice : 0
      },
      oLuxury : {
        bEnabled : false,
        nPrice : 0
      }
    },
    aEngravingDetails : [{
      sType: 'default',
      oFontDetails : {
        bEnabled : false,
        nPrice : 0,
        aFontList : [],
        isForArticleGroup: false,
        aArticleGroup: []
      },
    }]
  };

  iBusinessId : any;
  iLocationId : any;
  webLocation : any;
  isAddNewType: boolean = false;
  engravingTypeName : string = '';
  typeList: Array<any> = ['default'];
  selectedType: any;
  selectedLanguage: string;
  articleGroups: Observable<any> = of([]);
  articleInput$ = new Subject<string>();
  articlesLoading: boolean = false;
  engravingList: Observable<any> = of([]);
  engravingListLoading: boolean = false;
  engravingTypeExist: boolean = false;
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

  fontList : Array<any> = [
    'Open Sans',
    'Times New Roman',
    'Pacifico',
    'Caveat'
  ];
  ngOnInit(): void {
    this.selectedLanguage = localStorage.getItem('language') || 'nl';
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.webLocation = localStorage.getItem('webLocation') || this.iLocationId;
    this.requestParams.iBusinessId = this.iBusinessId;
    this.fetchExtraServiceDetails();

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

  getSanitizedURL(fontName : string){
    return this.domSanitizer.bypassSecurityTrustResourceUrl('https://fonts.googleapis.com/css?family='+ fontName);
  }

  fetchExtraServiceDetails(){
    this.apiService.getNew('cashregistry', `/api/v1/extra-services/${this.webLocation}?iBusinessId=${this.iBusinessId}`)
      .subscribe((result : any) => {
        if(result?.data?._id){
          this.service = result.data;
          if (!this.service?.sTermForEngraving) this.service.sTermForEngraving = 'engraving';
          this.selectedType = this.service.aEngravingDetails[0];
        }
        if(!this.selectedType){
          this.service.aEngravingDetails = [{
            sType: 'default',
            oFontDetails : {
              bEnabled : false,
              nPrice : 0,
              aFontList : [],
              isForArticleGroup: false,
              aArticleGroup: []
            }
          }];
          this.selectedType = this.service.aEngravingDetails[0];
        }
        this.engravingList = of(this.service.aEngravingDetails);
      });
  }
  updateExtraServiceDetails(){
    this.service.aEngravingDetails = this.service.aEngravingDetails.map( (details : any) => {
      details.oFontDetails.aArticleGroup = details.oFontDetails.aArticleGroup.map((article : any) => {return {_id: article._id, oName: article.oName};});
      return details;
    });
    if(this.service?._id){
      this.updateExtraService();
    } else {
      this.createNewService();
    }
  }

  createNewService(){
    let details = {
      ...this.service,
      iBusinessId : this.iBusinessId,
      iLocationId : this.webLocation
    }
    this.apiService.postNew('cashregistry', '/api/v1/extra-services', details).subscribe(
      (result : any) => {
        this.toastService.show({ type: 'success', text: this.translateService.instant('SAVED_SUCCESSFULLY') });
      }, (error) => {
        this.toastService.show({ type: 'warning', text: 'something went wrong' });
      });
  }

  updateExtraService(){
    this.apiService.putNew('cashregistry', '/api/v1/extra-services/'+this.service._id, this.service).subscribe(
      (result : any) => {
        this.toastService.show({ type: 'success', text: this.translateService.instant('SAVED_SUCCESSFULLY') });
      }, (error) => {
        this.toastService.show({ type: 'warning', text: 'something went wrong' });
      });
  }

  addEngravingType(){
    this.engravingListLoading = true;
    this.engravingTypeExist = false;
    let existingIndex = this.service.aEngravingDetails.findIndex((type : any) => type.sType == this.engravingTypeName);
    if(existingIndex > -1){
      this.engravingTypeExist = true;

    } else{
      this.service.aEngravingDetails.push({
        sType: this.engravingTypeName,
        oFontDetails : {
          bEnabled : false,
          nPrice : 0,
          aFontList : [],
          isForArticleGroup: false,
          aArticleGroup: []
        }
      });
      this.engravingList = of(this.service.aEngravingDetails);
      this.selectedType = this.service.aEngravingDetails[this.service.aEngravingDetails.length - 1];
      this.isAddNewType = false;
    }
    setTimeout(()=>{ this.engravingListLoading = false}, 50);
    this.engravingTypeName = '';
  }
  
  trackByFn(item: any) {
    return item.sType || item._id;
  }
  removeSelectedType(){
    this.engravingListLoading = false;
    this.service.aEngravingDetails = this.service.aEngravingDetails.filter((type: any) => this.selectedType.sType != type.sType);
    this.engravingList = of(this.service.aEngravingDetails);
    this.selectedType = this.service.aEngravingDetails[this.service.aEngravingDetails.length - 1];
    setTimeout(()=>{ this.engravingListLoading = false}, 50);
  }
}
