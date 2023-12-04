import {Component, Input, OnInit, ViewContainerRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import {DialogComponent} from "../../service/dialog";
import {faTimes, faSearch} from "@fortawesome/free-solid-svg-icons";
import { DialogService } from '../../service/dialog';
import { CustomerDetailsComponent } from '../customer-details/customer-details.component';
import { ApiService } from '../../service/api.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from '../toast';

@Component({
  selector: 'app-customer-dialog',
  templateUrl: './customer-dialog.component.html',
  styleUrls: ['./customer-dialog.component.sass']
})
export class CustomerDialogComponent implements OnInit {
  @Input() customer: any;
  dialogRef: DialogComponent

  faTimes = faTimes
  faSearch = faSearch
  loading = false
  showLoader = false;
  customers: Array<any> = [];
  business: any = {}
  customColumn = 'NAME';
  defaultColumns = [ 'PHONE', 'EMAIL', 'SHIPPING_ADDRESS', 'INVOICE_ADDRESS'];
  allColumns = [ this.customColumn, ...this.defaultColumns ];
  requestParams: any = {
    searchValue: ''
  }
  fakeCustomer: any = {
    number: '45663',
    counter: false,
    name: 'Christy van Woudenberg',
    email: 'CristyvanWoudenberg@armyspy.com',
    address: {
      street: 'Slatuinenweg',
      number: 24,
      zip: '1057 KB',
      city: 'Amsterdam'
    }
  }
  fakeCustomers = [] = [
    {
      number: '45663',
      counter: false,
      name: 'Christy van Woudenberg',
      email: 'CristyvanWoudenberg@armyspy.com',
      address: {
        street: 'Slatuinenweg',
        number: 24,
        zip: '1057 KB',
        city: 'Amsterdam'
      }
    },
    {
      number: '99647',
      counter: false,
      name: 'Irem Botman',
      email: 'IremBotman@teleworm.us',
      address: {
        street: 'Van der Leeuwlaan',
        number: 39,
        zip: '3119 LP',
        city: 'Schiedam'
      }
    },
    {
      number: '666543',
      counter: false,
      name: 'Chaline Kruisselbrink',
      email: 'ChalineKruisselbrink@dayrep.com',
      address: {
        street: 'Hogenhof',
        number: 1,
        zip: '3861 CG',
        city: 'Nijkerk'
      }
    },
    {
      number: '55147',
      counter: false,
      name: 'Jovan Abbink',
      email: 'JovanAbbink@teleworm.us',
      address: {
        street: 'Turfsteker',
        number: 94,
        zip: '8447 DB',
        city: 'Heerenveen'
      }
    },
    {
      number: '33654',
      counter: false,
      name: 'Richano van der Zijden',
      email: 'RichanovanderZijden@teleworm.us',
      address: {
        street: 'Veilingweg',
        number: 192,
        zip: '4731 CW',
        city: 'Oudenbosch'
      }
    }
  ]

  @ViewChildren('inputElement') inputElement!: QueryList<ElementRef>;

  constructor(
    private viewContainer: ViewContainerRef,
    private dialogService: DialogService,
    private apiService: ApiService,
    private translateService: TranslateService,
    private toastService: ToastService) {
    const _injector = this.viewContainer.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngAfterViewInit(): void {
    this.inputElement.first.nativeElement.focus();
  }

  ngOnInit(): void {
    this.apiService.setToastService(this.toastService);
    this.business._id = localStorage.getItem("currentBusiness");
    this.requestParams.iBusinessId = this.business._id;
  }

  makeCustomerName = async (customer: any) => {
    if (!customer) {
      return '';
    }
    let result = '';
    if (customer.sSalutation) {
      await this.translateService.get(customer.sSalutation.toUpperCase()).subscribe( (res) => {
        result += res + ' ';
      });
    }
    if (customer.sFirstName) {
      result += customer.sFirstName + ' ';
    }
    if (customer.sPrefix) {
      result += customer.sPrefix + ' ';
    }

    if (customer.sLastName) {
      result += customer.sLastName;
    }

    return result;
  }

  formatZip(zipcode: string) {
    if (!zipcode) {
      return '';
    }
    return zipcode.replace(/([0-9]{4})([a-z]{2})/gi, (original, group1, group2) => {
      return group1 + ' ' + group2.toUpperCase();
    });
  }

  makeCustomerAddress(address: any, includeCountry: boolean) {
    if (!address) {
      return '';
    }
    let result = '';
    if (address.sStreet) {
      result += address.sStreet + ' ';
    }
    if (address.sHouseNumber) {
      result += address.sHouseNumber + (address.sHouseNumberSuffix ? '' : ' ');
    }
    if (address.sHouseNumberSuffix) {
      result += address.sHouseNumberSuffix + ' ';
    }
    if (address.sPostalCode) {
      result += this.formatZip(address.sPostalCode) + ' ';
    }
    if (address.sCity) {
      result += address.sCity;
    }
    if (includeCountry && address.sCountry) {
      result += address.sCountry;
    }
    return result;
  }

  getCustomers() {
    this.showLoader = true;
    this.customers = [];
    this.apiService.postNew('customer', '/api/v1/customer/list', this.requestParams)
      .subscribe(async (result: any) => {
        this.showLoader = false;
          if (result && result.data && result.data[0] && result.data[0].result) {
            this.customers = result.data[0].result;
            for(const customer of this.customers){
              customer['NAME'] = await this.makeCustomerName(customer);
              customer['SHIPPING_ADDRESS'] = this.makeCustomerAddress(customer.oShippingAddress, false);
              customer['INVOICE_ADDRESS'] = this.makeCustomerAddress(customer.oInvoiceAddress, false);
              customer['EMAIL'] = customer.sEmail;
              customer['PHONE'] = (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '')
            }

          }
      },
      (error : any) =>{
        this.customers = [];
        this.showLoader = false;
      })
  }
  
  AddCustomer(){
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass:"modal-xl", context: { mode: 'create' } }).instance.close.subscribe(async (result) =>{ 
      let customer =  result.customer;
      customer['NAME'] =  await this.makeCustomerName(customer);
      customer['SHIPPING_ADDRESS'] = this.makeCustomerAddress(customer.oShippingAddress, false);
      customer['INVOICE_ADDRESS'] = this.makeCustomerAddress(customer.oInvoiceAddress, false);
      customer['EMAIL'] = customer.sEmail;
      customer['PHONE'] = (customer.oPhone && customer.oPhone.sLandLine ? customer.oPhone.sLandLine : '') + (customer.oPhone && customer.oPhone.sLandLine && customer.oPhone.sMobile ? ' / ' : '') + (customer.oPhone && customer.oPhone.sMobile ? customer.oPhone.sMobile : '')
      this.close({action: false, customer: customer });
    });
  }

  editCustomer(customer: any){
    this.dialogService.openModal(CustomerDetailsComponent, { cssClass:"modal-xl", context: { mode: 'details', customer: customer, editProfile: true } }).instance.close.subscribe(result =>{
       this.getCustomers()
    });
  }

  close(data: any): void {
    this.dialogRef.close.emit(data)
  }

  randNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min +1) + min);
  }

  setCustomer(customer: any): void {
    this.loading = true
    this.customer = customer;

    this.dialogRef.close.emit({ action: false, customer: this.customer })
  }

  save(): void {
    this.dialogRef.close.emit({action: true, customer: this.customer})
  }

}
