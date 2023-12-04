import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from '@ngx-translate/core';
import { DialogComponent } from '../../service/dialog';
import { ToastService } from '../toast';
import { TransactionsPdfService } from '../../service/transactions-pdf.service';

@Component({
  selector: 'app-activity-item-export',
  templateUrl: './activity-item-export.component.html',
  styleUrls: ['./activity-item-export.component.scss']
})
export class ActivityItemExportComponent implements OnInit {

  businessDetails: any;
  headerList: Array<any> = [];
  valuesList: Array<any> = [];
  fieldsToRemove: Array<any> = [];
  downloading: boolean = false;
  useSameFilter: Boolean = true;
  aWorkStation: any = [];
  aLocation: any = [];
  aAssignee: any = [];
  aBusinessPartner: any = [];
  faTimes = faTimes;
  requestParams: any = {
    iBusinessId: '',
    iLocationId: '',
    aProjection: []
  }
  page: string = '';

  filterDates: any = {
    endDate: new Date(new Date().setHours(23, 59, 59)),
    startDate: new Date(new Date('01-01-2015').setHours(0, 0, 0))
  }

  dialogRef: DialogComponent;
  translate: any = [];
  isPdfLoading: boolean = false;
  iBusinessId: any;
  iLocationId: any;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private toastService: ToastService,
    private translateService: TranslateService,
    private transactionsPdfService: TransactionsPdfService
  ) {
    const _injector = this.viewContainerRef.parentInjector;
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem("currentBusiness");
    this.iLocationId = localStorage.getItem('currentLocation');
    this.requestParams.limit = '';
    const translate = ['NO_DATA_FOUND'];
    this.translateService.get(translate).subscribe((res) => {
      this.translate = res;
    })
  }

  close(flag: Boolean) {
    this.dialogRef.close.emit({ action: false })
  }

  async exportToPDF() {
    let customHeader: any = [... this.headerList];
    this.isPdfLoading = true;
    if (!this.useSameFilter) {
      this.requestParams = {
        iBusinessId: this.iBusinessId,
        iLocationId: this.iLocationId,
        limit: ''
      }
    }
    for (let index in this.fieldsToRemove) {
      const headerIndex = customHeader.findIndex((customerheader: any) => customerheader.key == this.fieldsToRemove[index].key)
      if (headerIndex > -1) {
        customHeader.splice(headerIndex, 1);
      }
    }
    await this.transactionsPdfService.exportToPdf({
      requestParams: this.requestParams,
      customerHeader: customHeader,
      page: this.page,
      businessDetail: this.businessDetails,
      aWorkstation: this.aWorkStation,
      aLocation: this.aLocation,
      aAssignee: this.aAssignee,
      aBusinessPartner: this.aBusinessPartner
    });
    this.isPdfLoading = false;
  }

  updateExportField(obj: any) {
    let index = this.fieldsToRemove.findIndex((field) => field.value == obj.value);
    if (index > -1) this.fieldsToRemove.splice(index, 1);
    else this.fieldsToRemove.push(obj)
  }
}
