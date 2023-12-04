import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { TranslationsService } from './translation.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})

export class AppInitService {

    public aAccessRoleData: BehaviorSubject<any> = new BehaviorSubject<any>({});



    constructor(private customTranslationService: TranslationsService, private translateService: TranslateService) {
        if (localStorage?.org) {
            const org = JSON.parse(localStorage.org);
            this.customTranslationService.fetchTranslation(org)
        } else {
            this.customTranslationService.fetchTranslation({
                sName: '',
                aLanguage: [
                    "en",
                ]
            })
        }

    }


    /* When we are changing the employee then we also needs to change the rights of them */
    changeRights(aAccessRole: any) {
        // console.log('change rights called, now aAccessRoleData.next')
        this.aAccessRoleData.next(aAccessRole);
    }

    showError(dynamicMessage?: string) {
        const initializationError = document.querySelector('#initializationError');
        const message = 'Aw, something went wrong';
        if (initializationError) initializationError.textContent = dynamicMessage || message;
    }

    initCsp() {
        // const headCsp = document.querySelector('head');
        // if (headCsp) headCsp.innerHTML += `<meta http-equiv="Content-Security-Policy" content="${environment.csp}">`;
        // else this.showError(`Something went wrong. Contact to RetailGear Team.`);
    }
}
