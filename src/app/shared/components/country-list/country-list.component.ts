import {Component, OnInit, Input, Output, EventEmitter , OnChanges, SimpleChanges} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import * as _ from 'lodash';
import countryList from '../../../../assets/json/list.json'

@Component({
  selector: 'country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.sass']
})
export class CountryListComponent implements OnInit , OnChanges{

  @Input() public country = 'NL';
  @Output() countryChanged = new EventEmitter<string>();
  @Output() customerCountryChanged = new EventEmitter<string>();

  private countryListByLang: any;
  value: any = 'Netherlands';
  filteredOptions$: Array<any> = [];
  inputFormControl: FormControl = new FormControl();
  focusValue = false;
  name: any;

  constructor(
    private translateService: TranslateService
  ) {
    translateService.onLangChange.subscribe((event: any) => {
      this.ngOnInit();
    });
  }

  ngOnInit() {
    const language: string  = this.translateService.currentLang;
    switch (language){
      case 'nl': {
        this.countryListByLang = countryList.nl;
        break;
      }
      case 'en': {
        this.countryListByLang = countryList.en;
        break;
      }
      case 'de': {
        this.countryListByLang = countryList.de;
        break;
      }
      case 'fr': {
        this.countryListByLang = countryList.fr;
        break;
      }
      case 'es': {
        this.countryListByLang = countryList.es;
        break;
      }
    }

    this.filteredOptions$ = this.countryListByLang;

    const country = _.find(this.countryListByLang, {key: this.country});
    if (country) {
      this.value = country.value;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const country = _.find(this.countryListByLang, {key: this.country});
    if (country) {
      this.value = country.value;
    }
  }
  private filter(value: string): {key: '', value: ''}[] {
    const filterValue = value.toLowerCase();
    const filteredList = this.countryListByLang.filter((optionValue: any) => optionValue.value.toLowerCase().includes(filterValue));
    return filteredList;
  }

  onModelChange(value: string){
    this.filteredOptions$ = this.filter(value);
  }

  changeSelected(event: any){
    if (event) {
      this.country = event.key;
      this.value = event.value;
      this.customerCountryChanged.emit(event);
      this.countryChanged.emit(this.country);
      this.filteredOptions$ = this.filter('');
    }
  }
}
