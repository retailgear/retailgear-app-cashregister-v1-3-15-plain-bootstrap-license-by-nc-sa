import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/service/api.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})

export class StatisticsComponent implements OnInit {
  iBusinessId: any = '';
  aStatistic: any = [];
  sDisplayMethod: string = 'revenuePerBusinessPartner';
  aDisplayMethod: any = [
    {
      sKey: 'revenuePerBusinessPartner',
      sValue: 'Supplier And Article-Group And Dynamic Property',
    },
    {
      sKey: 'revenuePerArticleGroupAndProperty',
      sValue: 'Article Group and Dynamic Property',
    },
    {
      sKey: 'revenuePerSupplierAndArticleGroup', // Use the revenuePerBusinessPartner and Remove the Dynamic Property
      sValue: 'Supplier And Article-Group',
    },
    {
      sKey: 'revenuePerProperty',
      sValue: 'Revenue Per Property',
    },
    {
      sKey: 'revenuePerArticleGroup', // Use the revenuePerArticleGroupAndProperty and remove the Dynamic Property
      sValue: 'Article Group',
    },
  ]

  // Always show the Overall data, Payment method and VatRate (Shop-purchase and web)

  constructor(
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.fetchStatistics(this.sDisplayMethod);
  }

  fetchStatistics(sDisplayMethod: string) {
    const oBody = {
      iBusinessId: this.iBusinessId,
      oFilter: {
        sDisplayMethod: sDisplayMethod,
        dStartDate: '',
        dEndDate: ''
      },
    }
    this.apiService.postNew('cashregistry', `/api/v1/statistics/get`, oBody).subscribe((result: any) => {
      if (result?.data?.aStatistic?.length) this.aStatistic = result.data.aStatistic;
    }, (error) => {
      console.log('error: ', error);
    })
  }

  changeDisplayMethod(event: any) {
    const sDisplayMethod = event?.target?.value;
    if (sDisplayMethod == 'revenuePerBusinessPartner') this.fetchStatistics('revenuePerBusinessPartner');
    else if (sDisplayMethod == 'revenuePerArticleGroupAndProperty') this.fetchStatistics('revenuePerArticleGroupAndProperty');
    else if (sDisplayMethod == 'revenuePerSupplierAndArticleGroup') this.fetchStatistics('revenuePerBusinessPartner');
    else if (sDisplayMethod == 'revenuePerProperty') this.fetchStatistics('revenuePerProperty');
    else if (sDisplayMethod == 'revenuePerArticleGroup') this.fetchStatistics('revenuePerArticleGroupAndProperty');
  }
}
