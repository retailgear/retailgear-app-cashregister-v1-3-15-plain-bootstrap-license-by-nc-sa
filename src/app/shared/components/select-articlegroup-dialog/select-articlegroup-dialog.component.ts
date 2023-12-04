import { AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
// import * as _ from 'lodash';

import { ApiService } from '../../service/api.service';
import { DialogComponent } from "../../service/dialog";
import { ToastService } from '../toast';
@Component({
  selector: 'app-select-articlegroup-dialog',
  templateUrl: './select-articlegroup-dialog.component.html',
  styleUrls: ['./select-articlegroup-dialog.component.scss']
})
export class SelectArticleDialogComponent implements OnInit, AfterViewInit {
  @Input() customer: any;
  dialogRef: DialogComponent;
  filteredArticleGroups: Array<any> = [];
  filteredSupplierList: Array<any> = [];
  filteredBrandList: Array<any> = [];
  articleGroupsList: Array<any> = [];
  partnersList: Array<any> = [];
  brandsList: Array<any> = [];
  brand: any = null;
  articlegroup: any = null;
  supplier: any = null;
  iBusinessId = localStorage.getItem('currentBusiness');
  iArticleGroupId: any = null;
  iBusinessBrandId: any = null;
  from: any;
  @ViewChild('articleGroupRef') articleGroupRef!: NgSelectComponent
  articleGroupLoading: boolean = true;
  constructor(
    private viewContainer: ViewContainerRef,
    private apiService: ApiService,
    private toastrService: ToastService) {
    const _injector = this.viewContainer.injector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);

  }


  ngOnInit(): void {
    this.fetchArticleGroups(null);
    this.fetchBusinessPartners([]);
    this.getBusinessBrands();
    this.iBusinessBrandId = this.dialogRef.context?.item?.iBusinessBrandId;
    this.from = this.dialogRef.context.from;
  }
  ngAfterViewInit(): void {

  }

  fetchArticleGroups(iBusinessPartnerId: any) {
    if (!iBusinessPartnerId) {
      this.articlegroup = null;
    }
    let data = {
      searchValue: '',
      oFilterBy: {
      },
      iBusinessPartnerId,
      iBusinessId: localStorage.getItem('currentBusiness'),
    };
    this.apiService.postNew('core', '/api/v1/business/article-group/list', data)
      .subscribe((result: any) => {
        if (result && result.data && result.data[0] && result.data[0].result && result.data[0].result.length) {
          this.articleGroupsList = result.data[0].result;
          setTimeout(() => {
            this.articleGroupLoading = false;
            if (this.articleGroupRef)
              this.articleGroupRef.focus()
          }, 150);
        } else {
          this.fetchArticleGroups(null);
        }

      }, error => {
        this.toastrService.show({ type: 'danger', text: error.message });
      });
  }

  // Function for search article group
  searchArticlegroup(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredArticleGroups = this.articleGroupsList.filter((articlegroup: any) => {
        return articlegroup.oName && articlegroup.oName.en && articlegroup.oName.en.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  // Function for search supplier
  searchSupplier(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredSupplierList = this.partnersList.filter((supplier: any) => {
        return supplier.sName && supplier.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  searchBrand(searchStr: string) {
    if (searchStr && searchStr.length > 2) {
      this.filteredBrandList = this.brandsList.filter((brand: any) => {
        return brand.sName && brand.sName.toLowerCase().includes(searchStr.toLowerCase());
      });
    }
  }

  fetchBusinessPartners(aBusinessPartnerId: any) {
    this.partnersList = [];
    var body = {
      iBusinessId: this.iBusinessId,
      aBusinessPartnerId
    };
    if (this.supplier) {
      this.brand = null;
    }
    this.apiService.postNew('core', '/api/v1/business/partners/list', body).subscribe(
      (result: any) => {
        if (result && result.data && result.data && result.data[0] && result.data[0].result && result.data[0].result.length && result.data[0].count && result.data[0].count.totalData) {
          this.partnersList = result.data[0].result;
          if (aBusinessPartnerId.length > 0) {
            this.supplier = this.partnersList[0];
          }
        }
      },
      (error: any) => {
        this.partnersList = [];
      }
    );
  }

  changeInArticleGroup() {
    const aBusinessPartnerId: Array<any> = [];
    if (this.articlegroup.aBusinessPartner && this.articlegroup.aBusinessPartner.length) {
      this.articlegroup.aBusinessPartner.forEach((bPartner: any) => {
        aBusinessPartnerId.push(bPartner.iBusinessPartnerId);
      });
    };
    if (!this.supplier)
      this.fetchBusinessPartners(aBusinessPartnerId);

  }

  changeInSupplier() {
    this.fetchArticleGroups(this.supplier._id);
  }

  changeInBrand() {
    if (!this.supplier) {
      if (this.from && this.from === 'repair') {
        this.brand.iBusinessPartnerId = this.brand.iRepairerId ? this.brand.iRepairerId : this.brand.iBusinessPartnerId
      }
      this.fetchBusinessPartners([this.brand.iBusinessPartnerId]);
    }
  }

  getBusinessBrands() {
    const oBody = {
      iBusinessId: localStorage.getItem('currentBusiness') || '',
    }
    this.apiService.postNew('core', '/api/v1/business/brands/list', oBody).subscribe((result: any) => {
      if (result.data && result.data.length > 0) {
        this.brandsList = result.data[0].result;
        this.brand = this.brandsList.find((o: any) => o.iBrandId === this.iBusinessBrandId);
      }
    })
  }

  close(status: boolean): void {
    if (status) {
      if (!this.articlegroup || !this.supplier) {
        return
      };
      const businessPartner = this.articlegroup.aBusinessPartner.find((o: any) => o.iBusinessPartnerId === this.supplier._id);
      let nMargin = businessPartner ? businessPartner.nMargin : 1;
      this.dialogRef.close.emit({ brand: this.brand || {}, articlegroup: this.articlegroup, supplier: this.supplier, nMargin });
    } else {
      this.dialogRef.close.emit(false);
    }
  }
}
