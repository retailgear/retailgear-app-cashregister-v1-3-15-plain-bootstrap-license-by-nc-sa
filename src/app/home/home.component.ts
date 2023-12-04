import { Component, EventEmitter, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as data from '../../assets/json/country-list-lang.json'
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  title = 'Cash register home page';
  localData: any;
  @Output() checkUpdate: EventEmitter<any> = new EventEmitter();

  selectedLanguage: string = 'en';
  languageList: Array<any> = (data as any).default;;


  aHeaderMenu: any = [];

  userType: string | null = localStorage.getItem("type");

  constructor(private translateService: TranslateService, private router: Router) {
    const aEnabledLanguages = JSON.parse(localStorage.org).aLanguage;
    this.languageList = this.languageList.filter((item: any) => aEnabledLanguages.includes(item.lang_code));

    this.aHeaderMenu = [
      {
        title: 'HOME',
        path: '/home'
      },
      {
        title: 'TRANSACTIONS',
        path: '/home/transactions'
      },
      {
        title: 'ACTIVITY_ITEMS_BACKOFFICE',
        path: '/home/activity-items'
      },
      {
        title: 'STATISTICS',
        path: '/home/transactions-audit'
      },
      {
        title: 'TEXT_HEAD_CUSTOMERS_RETAILER_HOME',
        path: '/home/customers'
      },
      {
        title: 'DEVICES',
        path: '/home/devices'
      },
      {
        title: 'LOYALITY_POINTS',
        path: '/home/saving-points'
      },

      {
        title: 'SETTINGS',
        path: '/home/till-settings',
        dropdown: [
          {
            title: 'STATISTICS_SETTINGS',
            path: '/home/statistics-settings'
          },
          {
            title: 'FISKALY_SETTINGS',
            path: '/home/fiskaly-settings'
          },
          {
            title: 'PAYMENT_INTEGRATIONS',
            path: '/home/payment-account-management',
            dropdown: [
              { title: 'ACCOUNT_SETTINGS', icon: '', section: 'payment-account-management', path: '/home/payment-account-management', },
              { title: 'POS_SETTINGS', icon: '', section: 'pos-settings', path: '/home/payment-account-management', },
            ]
          },
          {
            title: 'PRINT_SETTINGS',
            path: '/home/print-settings',
            dropdown: [
              { title: 'PRINTNODE_SETTINGS', icon: '', section: 'print-settings', path: '/home/print-settings', },
              { title: 'PRINT_SETTINGS_LETTER_PAPER', icon: '', section: 'print-settings-letter-paper', path: '/home/print-settings', },
              { title: 'LABEL_DEFINITION', icon: '', section: 'label-definition', path: '/home/print-settings', },
              { title: 'PRINT_ACTIONS', icon: '', section: 'print-action', path: '/home/print-settings', }
            ]
          },
          {
            title: 'WEBSHOP_SETTINGS',
            path: '/home/workstations',
            dropdown: [
              { title: 'SHIPPING_COST', icon: '', section: 'shipping_cost', path: '/home/workstations', },
              { title: 'OTHER_DELIVERY_METHODS', icon: '', section: 'other_delivery_methods', path: '/home/workstations', },
              { title: 'PAYMENTS', icon: '', section: 'payments', path: '/home/workstations', },
              { title: 'ADDITIONAL_SERVICES', icon: '', section: 'additional_services', path: '/home/workstations', },
              { title: 'COUPONS', icon: '', section: 'coupons', path: '/home/workstations', },
              { title: 'DROPSHIPPING_MENU_TITLE', icon: '', section: 'drop_shipper', path: '/home/workstations', },
            ]
          },
          {
            title: 'CASH_REGISTER',
            path: '/home/till-settings',
            dropdown: [
              { title: (this.userType && this.userType == 'supplier' ? 'SUPPLIER' : 'SETTINGS'), icon: '', section: 'cash-settings' },
              { title: 'PAYMENT_METHODS', icon: '', section: 'payment-methods' },
              { title: 'QUICK_BUTTONS', icon: '', section: 'quick-buttons' },
            ]
          },
        ]
      }
    ];
  }

  onChangeLanguage(event: any) {
    const lang_code = event.target.value;
    this.selectedLanguage = lang_code;
    localStorage.setItem('language', lang_code || 'en');
    this.translateService.use(lang_code);
  }

  logout() {
    localStorage.clear();
    this.router.navigateByUrl('/');
    // setTimeout(() => { window.location.reload() }, 2000)
  }
}
