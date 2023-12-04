import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ApiService } from '../../service/api.service';
import { CreateArticleGroupService } from '../../service/create-article-groups.service';
import { DialogComponent } from "../../service/dialog";
import { TillService } from '../../service/till.service';

@Component({
  selector: 'app-select-articlegroup-dialog',
  templateUrl: './select-articlegroup-dialog.component.html',
  styleUrls: ['./select-articlegroup-dialog.component.scss']
})

export class SelectArticleDialogComponent implements OnInit {
  @Input() customer: any;
  dialogRef: DialogComponent;
  filteredArticleGroups: Array<any> = [];
  filteredSupplierList: Array<any> = [];
  filteredBrandList: Array<any> = [];
  articleGroupsList: Array<any>;
  partnersList: Array<any> = [];
  brandsList: Array<any> = [];
  brand: any = null;
  articlegroup: any = null;
  supplier: any = null;
  iBusinessId = localStorage.getItem('currentBusiness');
  selectedLanguage: string;
  iArticleGroupId: any = null;
  iBusinessBrandId: any = null;
  from: any;
  bIsChanged: any = false;
  @ViewChild('articleGroupRef') articleGroupRef!: NgSelectComponent
  articleGroupLoading = false;

  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private tillService: TillService,
    private createArticleGroupService: CreateArticleGroupService) {
    const _injector = this.viewContainer.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit() {
    this.selectedLanguage = localStorage.getItem('language') || 'en';
    this.fetchBusinessPartners([]);
    this.getBusinessBrands();
    if(this.from == 'repair'){
      this.iArticleGroupId = this.tillService.settings?.iDefaultArticleGroupForRepair;
    }
    if(this.from == 'order'){
      this.iArticleGroupId = this.tillService.settings?.iDefaultArticleGroupForOrder;
    }
  }

  getAllArticleGroupList(data: any) {
    return this.apiService.postNew('core', '/api/v1/business/article-group/list', data).toPromise();
  }

  async getDefaultArticleGroupDetail(iArticleGroupId:any) {
    const eDefaultArticleGroup = this.articleGroupsList.find((el: any) => el._id === this.iArticleGroupId);
    if(eDefaultArticleGroup && !this.bIsChanged){
      this.articlegroup = eDefaultArticleGroup;
      this.supplier = this.partnersList.find((el: any) => el._id === this.articlegroup.aBusinessPartner[0]?.iBusinessPartnerId);
    }
  }

  async fetchArticleGroups(iBusinessPartnerId: any, bIsSupplierUpdated:boolean = false) {
    let data = {
      iBusinessPartnerId,
      iBusinessId: this.iBusinessId,
    };

    if(!this.articleGroupsList){
      const result: any = await this.getAllArticleGroupList(data);
      if(result.data?.length && result.data[0]?.result?.length){
        this.articleGroupsList = result.data[0].result;
        this.articleGroupLoading = false;
      }
    }
    

    if (this.iArticleGroupId) {
      this.getDefaultArticleGroupDetail(this.iArticleGroupId);
    } else {
      if (!bIsSupplierUpdated) {
        const oDefaultArticle: any = await this.createArticleGroupService.checkArticleGroups(this.from).toPromise();
        if (oDefaultArticle?.data?._id) {
          this.articlegroup = oDefaultArticle?.data;
          if (!this.articlegroup.aBusinessPartner?.length) {
            const result: any = await this.createArticleGroupService.saveInternalBusinessPartnerToArticleGroup(this.articlegroup).toPromise();
            this.articlegroup = result?.data;
          }
          this.supplier = this.partnersList.find((el: any) => el._id === this.articlegroup.aBusinessPartner[0]?.iBusinessPartnerId);
          
        } else {
          const articleBody: any = { name: this.from, eDefaultArticleGroup: this.from };
          const result: any = await this.createArticleGroupService.createArticleGroup(articleBody);
          this.articlegroup = result?.data;//[0]?.result[0];
          this.supplier = this.partnersList.find((el: any) => el._id === this.articlegroup.aBusinessPartner[0].iBusinessPartnerId);
        }
      }
    }
    this.articleGroupLoading = false;
  }

  // Function for search article group
  searchArticlegroup(searchStr: string) {
    if (searchStr && searchStr.length > 1) {
      this.filteredArticleGroups = this.articleGroupsList.filter((articlegroup: any) => {
        return articlegroup;
      });
    } else {
      this.filteredArticleGroups = [];
    }
  }

  // Function for search supplier
  searchSupplier(searchStr: string) {
    if (searchStr && searchStr.length > 1) {
      this.filteredSupplierList = this.partnersList.filter((supplier: any) => {
        return supplier.sName && supplier.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    } else {
      this.filteredSupplierList = [];
    }
  }

  searchBrand(searchStr: string) {
    if (searchStr && searchStr.length > 1) {
      this.filteredBrandList = this.brandsList.filter((brand: any) => {
        return brand.sName && brand.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    } else {
      this.filteredBrandList = [];
    }
  }

  fetchBusinessPartners(aBusinessPartnerId: any) {
    this.articleGroupLoading = true;
    this.partnersList = [];
    var body = {
      iBusinessId: this.iBusinessId,
      aBusinessPartnerId
    };
    if (this.supplier) {
      this.brand = null;
    }
    this.apiService.postNew('core', '/api/v1/business/partners/list', body).subscribe((result: any) => {
      if (result?.data?.length && result.data[0]?.result?.length) {
        this.partnersList = result.data[0].result;
        this.fetchArticleGroups(null);
        if (aBusinessPartnerId.length > 0) {
          this.supplier = this.partnersList[0];
        }
      }
    });
  }

  changeInArticleGroup(articlegroup: any) {
    // const aBusinessPartnerId: Array<any> = [];
    // if (this.articlegroup?.aBusinessPartner && this.articlegroup?.aBusinessPartner.length) {
    //   this.articlegroup?.aBusinessPartner.forEach((bPartner: any) => {
    //     aBusinessPartnerId.push(bPartner.iBusinessPartnerId);
    //   });
    // };
    // if (!this.supplier)
    //   this.fetchBusinessPartners(aBusinessPartnerId);

    if(articlegroup){
      this.iArticleGroupId = articlegroup._id;
      this.getDefaultArticleGroupDetail(this.iArticleGroupId);
    }else{
      this.articlegroup = articlegroup;
      this.filteredArticleGroups = [];
    }
   
    //console.log('after', articlegroup,this.articlegroup, this.iArticleGroupId);
  }

  changeInSupplier() {
    /*No need to fetch article groups related to supplier.*/
    //this.fetchArticleGroups(this.supplier._id, true);
    if(!this.supplier)
      this.bIsChanged = false;
    else
      this.bIsChanged = true;
  }

  changeInBrand(brand:any) {
    // if (!this.supplier) {
    //   if (this.from && this.from === 'repair') {
    //     this.brand.iBusinessPartnerId = this.brand.iRepairerId ? this.brand.iRepairerId : this.brand.iBusinessPartnerId
    //   }
    //   this.fetchBusinessPartners([this.brand.iBusinessPartnerId]);
    // }

    this.brand = brand;
    let newSupplier = this.partnersList.find((el: any) => el.iSupplierId === brand.iSupplierId)
    if(this.brand && !this.bIsChanged && newSupplier){
      this.supplier = newSupplier;
    }
  }

  getBusinessBrands() {
    const oBody = {
      iBusinessId: this.iBusinessId
    }
    this.apiService.postNew('core', '/api/v1/business/brands/list', oBody).subscribe((result: any) => {
      if (result.data && result.data.length > 0) {
        this.brandsList = result.data[0].result;
        this.brand = this.brandsList.find((o: any) => o.iBrandId === this.iBusinessBrandId);
      }
    })
  }

  close(status: boolean): void {
    const data = {
      articleGroupsList: this.articleGroupsList,
      brandsList: this.brandsList,
      partnersList: this.partnersList
    };
    if (status) {
      if (!this.articlegroup || !this.supplier) {
        return
      };
      const businessPartner = this.articlegroup.aBusinessPartner.find((o: any) => o.iBusinessPartnerId === this.supplier._id);
      let nMargin = businessPartner ? businessPartner.nMargin : 1;
      this.dialogRef.close.emit({ 
        action: true, 
        brand: this.brand || {}, 
        articlegroup: this.articlegroup, 
        supplier: this.supplier, 
        nMargin, 
        ...data
      });
    } else {
      this.dialogRef.close.emit({ action: false, ...data });
    }
  }
}
