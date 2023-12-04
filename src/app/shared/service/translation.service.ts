import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/shared/components/toast';
import { ApiService } from 'src/app/shared/service/api.service';
// import * as en from 'src/assets/json/translations/en-translation.json';
// import * as nl from 'src/assets/json/translations/nl-translation.json';


export enum Languages {
  en = 'en', // english
  nl = 'nl', // dutch 
  de = 'de', // german
  fr = 'fr', // french
  es = 'es', // spanish
  da = 'da', // danish
}


@Injectable({
  providedIn: 'root'
})
export class TranslationsService {
  languages = Object.keys(Languages);
  translationsObject: any = {}
  constructor(
    private translateService: TranslateService,
    private apiService: ApiService,
    private toastService: ToastService,

  ) {
    console.log('cash register translation service constructor')
   }

  setTranslationsObject(translationsObject: any){
    this.translateService.setDefaultLang('nl');
    const currentLang: any = localStorage.getItem('language')?.toString() || 'nl';
    this.translateService.use(currentLang);

    this.translationsObject = translationsObject;
    this.translateService.addLangs(Object.keys(this.translationsObject));
    Object.keys(this.translationsObject).map((language: any) => {
      this.translateService.setTranslation(language, {
        ...this.translationsObject[language]
      });
    })
  }
  getTranslationsObject(){
    return this.translationsObject;
  }
  
  getTranslations() {
    const getLanguageTranslations = (lang: string, translations: any[]) => {
      return new Promise((resolve, reject) => {
        const translationsObject: any = {
          en: {},
          nl: {},
          de: {},
          fr: {},
          es: {},
          da: {},
        }
        for (let i = 0; i < translations.length; i++) {
          const element = translations[i];
          if (!element.aLanguageWiseTrans) continue;
          let languages = Object.entries(element.aLanguageWiseTrans)
          for (let j = 0; j < languages.length; j++) {
            const lang = languages[j];
            if (!translationsObject?.[lang[0]]) translationsObject[lang[0]] = {}
            translationsObject[lang[0]][element.sKeyword] = lang[1]
          }
        }
        resolve(translationsObject);
      })
    }
    return new Promise((resolve, reject) => {
      this.apiService.getNew('core', `/api/v1/translation/all`).subscribe({
        next: async (translations: any) => {
          if (translations.message !== 'success') {
            reject({ message: 'Error in getting translations' });
          }
          let data = await getLanguageTranslations('en', translations.data)
          resolve(data);
        },
        error: (error: any) => {
          reject(error);
          console.log(error);
        }
      })
    })
  }

  init() {
    console.log('cash register init translations')
    this.translateService.setDefaultLang('nl');
    const currentLang: any = localStorage.getItem('language')?.toString() || 'nl';
    this.translateService.use(currentLang);
    this.getTranslations().then((translations: any) => {
      this.translateService.addLangs(Object.keys(translations));
      Object.keys(translations).map((language: any) => {
        this.translateService.setTranslation(language, {
          ...translations[language]
        });
      })
    }).catch((error => {
      console.log(error)
      this.toastService.show({
        type: 'danger',
        text: error.message
      });

    }))
  }

  // initOld() {
  //   this.translateService.addLangs(this.languages);
  //   this.translateService.setDefaultLang('nl');
  //   const currentLang: any = localStorage.getItem('language')?.toString() || 'nl';
  //   this.translateService.use(currentLang);
  //   if (currentLang === 'nl') {
  //     this.translateService.setTranslation('nl', {
  //       // ...nl
  //     });
  //   }
  //   else
  //     this.translateService.setTranslation('en', {
  //       // ...en
  //     });
  // }

}
