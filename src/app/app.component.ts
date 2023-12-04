import { Component, OnInit } from '@angular/core';
import { TranslationsService } from './shared/service/translation.service';

@Component({
  selector: 'body[root]',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  translation: any = [];

  constructor(private customTranslationService: TranslationsService) { }

  ngOnInit() {
    this.translation = this.customTranslationService.translation;

    if (localStorage?.org) {
      const org = JSON.parse(localStorage.org);
      this.customTranslationService.fetchTranslation(org)
    }
  }



}
