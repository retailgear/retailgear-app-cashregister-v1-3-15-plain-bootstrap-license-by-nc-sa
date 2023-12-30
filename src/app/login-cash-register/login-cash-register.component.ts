import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, Subscription, fromEvent } from 'rxjs';
import { ApiService } from '../shared/service/api.service';
import { GlobalService } from '../shared/service/global.service';
import { ToastService } from '../shared/components/toast';
import { AppInitService } from '../shared/service/app-init.service';
import { environment } from '../../environments/environment';
import { TranslationsService } from '../shared/service/translation.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { debounceTime, map } from 'rxjs/operators';

@Component({
    selector: 'app-login-cashregister',
    templateUrl: './login-cash-register.component.html',
    styleUrls: ['./login-cash-register.component.scss'],
})
export class LoginCashRegisterComponent implements OnInit {
    iBusinessId: any = localStorage.getItem('currentBusiness');
    iLocationId: any = localStorage.getItem('currentLocation');

    businessWorkStations: Array<any> = [];
    selectedBusiness: any = {};
    selectedWorkStation: any;

    bIsLoading: boolean = false;
    isOrgFetched: boolean = false;

    private sCurrentLocationId = localStorage.getItem('currentLocation') ?? '';
    $currentLocation: Subject<any> = new Subject<any>();

    rememberMe = false;
    bIsShowPassword = false;
    user:any = {
        email: '',
        password: '',
        iOrganizationid: [],
        recaptchaToken: '',
        rememberMe: false,
    };
    showMessages = {
        error: true,
        success: true,
    };
    messages: any = [];
    errors: any = [];
    loginForm = {
        validation: {
            password: {
                required: true,
                minLength: 4,
                maxLength: 50,
            },
            email: {
                required: true,
            },
        },
    };
    submitted = false;
    organizationDetails: any;
    translate: any = [];
    userDetail: any;
    aEmployees: Array<any> = [];

    aOrganizationList: any = [];
    sSitekey: any = environment?.RECAPTCHA_SITE_KEY;

    @ViewChild('organizationRef') organizationRef!: NgSelectComponent
    subscription!: Subscription;
    bIsSupplierSelectActive = true

    constructor(
        private apiService: ApiService,
        private routes: Router,
        private toastService: ToastService,
        private globalService: GlobalService,
        private translationService: TranslateService,
        private appInitService: AppInitService,
        private customTranslationService: TranslationsService,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        this.apiService.setToastService(this.toastService);
        localStorage.clear();
        this.apiService.resetDefaultHeaders();
        // this.getOrganizationDetailsByOrgin();

        this.getUserDetails();
        const translate = ['SUCCESSFULLY_LOGIN', 'EMAIL_OR_PASSWORD_INCORRECT'];
        this.translationService.get(translate).subscribe((res) => {
            this.translate = res;
        });
    }

    ngAfterViewInit() {
        // Search organization by org-name
        this.subscription = fromEvent(this.organizationRef.searchInput.nativeElement, "keyup").pipe(
            map(event => this.organizationRef.searchInput.nativeElement.value),
            debounceTime(1000)
        ).subscribe((val: any) => {
            if (!val)  return;
            // Fetch organization
            this.listOrganization(val)
        });
    }

    resolved(captchaToken: any) {
        this.user.recaptchaToken = captchaToken;
    }

    async login(formData: any) {
        if (!formData.form.value.iOrganizationid) {
            this.getOrganizationByName(formData.form.value.iOrganizationid);
            alert("You must select valid organization!");
            this.submitted = false;
            this.bIsLoading = false;
            return
          }

        if (
            formData.submitted &&
            formData.form &&
            formData.form.status == 'VALID'
        ) {
            this.bIsLoading = true;
            let data = {
                sEmail: formData.form.value.email.toLowerCase(),
                sPassword: formData.form.value.password,
                iOrganizationId: formData.form.value.iOrganizationid,
                sRecaptchaToken: this.user?.recaptchaToken
            };
           

            const result: any = await this.apiService
            .postNew('auth', '/api/v1/login/simple', data)
            .toPromise();
            if (result?.data?.authorization) {
                this.toastService.show({
                    type: 'success',
                    text: this.translate['SUCCESSFULLY_LOGIN'],
                });
                localStorage.setItem('authorization', result.data.authorization);
                localStorage.setItem('alternateToken', result.data.authorization);
                localStorage.setItem('failedAttempts', '0');
                localStorage.setItem('locked', 'false');
                this.getOrganizationDetailsByID(formData.form.value.iOrganizationid);
                delete result.data.authorization;
                this.iBusinessId =
                    result?.data?.aBusiness?.length && result?.data?.aBusiness[0]._id
                        ? result?.data?.aBusiness[0]._id
                        : '';
                if (this.iBusinessId) {
                    // const oBusiness = await this.getBusiness(this.iBusinessId).toPromise();
                    this.apiService.getNew('core', `/api/v1/business/${this.iBusinessId}`).subscribe((oBusiness:any)=>{
                        localStorage.setItem('currentBusiness', this.iBusinessId);
                        localStorage.setItem('dudaEmail', oBusiness.data.sDudaEmail);
                        this.apiService.setBusinessDetails({ _id: this.iBusinessId });
                    })
                    const response: any = await this.apiService
                        .getNew('auth', `/api/v1/access-role/user/list/${this.iBusinessId}`)
                        .toPromise();
                    localStorage.setItem('aRights', JSON.stringify(response.data));
                    this.appInitService.changeRights(response.data);
                    //   this.fetchUserAccessRole(iBusinessId); // To do check of accessibility at front-end side
                    // this.fetchBusinessSetting(iBusinessId); // Fetching business setting to check weather opening modal or not
                }

                let userName = `${result?.data?.sFirstName || ''} ${result?.data?.sLastName || ''
                    }`;
                userName = userName === '' ? result?.data?.sEmail : userName;
                localStorage.setItem(
                    'currentUser',
                    JSON.stringify({
                        userId: result.data._id,
                        userName: userName,
                        aRights: result.data.aRights,
                        bHomeWorker: result.data.bHomeWorker,
                    })
                );
                localStorage.setItem('type', result.data.eUserType);
                this.apiService.setUserDetails(result.data);
                
                await this.setLocation();
                this.ngZone.run(() => this.routes.navigate(['/home'])).then();
                if (localStorage?.org) {
                    const org = JSON.parse(localStorage.org);
                    this.customTranslationService.fetchTranslation(org)
                }
                this.bIsLoading = false;
            }
        }
    }

    onChangeOrg(event: any) {
        if (event._id) {
            this.user.iOrganizationid = event._id;
            this.isOrgFetched = true;
        } else {
            this.getOrganizationByName(event.label);
            this.user.iOrganizationid = event.label;
            this.isOrgFetched = true;
        }
    }

    orgSelectOnFocus(e: any) {
        this.bIsSupplierSelectActive = true
      }
    
      orgSelectOnBlur(e: any) {
        this.bIsSupplierSelectActive = false
      }

    async getOrganizationDetailsByID(iOrganizationId: String) {
        const result: any = await this.apiService
            .postNew('organization', `/api/v1/organizations/get-by-id`, {
                iOrganizationId: iOrganizationId
            }).toPromise();
        if (result?.data) {
            this.organizationDetails = result.data;
            localStorage.setItem('org', JSON.stringify(this.organizationDetails));
            this.apiService.setAPIHeaders();
        }
    }

    getOrganizationDetailsByOrgin() {
        this.apiService
            .getNew('organization', '/api/v1/public/get-organization')
            .subscribe(
                (result: any) => {
                    if (result && result.data) {
                        this.organizationDetails = result.data;
                        localStorage.setItem('org', JSON.stringify(result.data));
                        this.apiService.setAPIHeaders();
                    }
                },
                (error: any) => {
                    console.log(error);
                }
            );
    }

    getBusiness(iBusinessId: string): Observable<any> {
        return this.apiService.getNew('core', `/api/v1/business/${iBusinessId}`);
    }

    /* fetching user access-role list */
    fetchUserAccessRole(iBusinessId: string) { }

    /* Fetching the business settings to access across the application */
    // fetchBusinessSetting(iBusinessId: string) {
    //     console.log('c')
    //     this.apiService.getNew('core', `/api/v1/business/setting/${iBusinessId}`).subscribe((result: any) => {
    //         if (result?.data?._id) this.globalService.oBusinessSetting = result.data;
    //     }, (error) => {
    //         if (error?.message == 'business setting not found') {
    //             const oBody = {
    //                 iBusinessId: iBusinessId,
    //                 aModule: this.globalService.aModule || [],
    //                 oSetting: {
    //                     "canEmployeeModalOpen": true,
    //                     "nEmployeeLockTime": 1
    //                 }
    //             }
    //             this.apiService.postNew('core', '/api/v1/business/setting/', oBody).subscribe((result: any) => {
    //                 if (result?.data?._id) this.globalService.oBusinessSetting = result.data;
    //             }, (error) => {
    //                 console.log("error", error);
    //             })
    //         } else {
    //             this.toastService.show({ type: 'warning', text: 'Something went wrong' });
    //             this.routes.navigate(['./login']);
    //         }
    //     })
    // }

    getUserDetails() {
        this.apiService.userDetails.subscribe((userDetails: any) => {
            if (userDetails?._id) {
                this.userDetail = userDetails;
                this.aEmployees.forEach((employee: any) => {
                    employee.active = userDetails._id == employee._id;
                    return employee;
                });
            }
        });
    }

    async getLocations() {
        this.sCurrentLocationId = localStorage.getItem('currentLocation') ?? '';
        return new Promise((resolve, reject) => {
            const iBusinessId:any = this.iBusinessId || localStorage.getItem('currentBusiness');
            this.apiService
                .postNew('core', `/api/v1/business/${iBusinessId}/list-location`, {})
                // .getNew('core', `/api/v1/business/user-business-and-location/list`, {})
                .subscribe((result: any) => {
                    if (result.message == 'success') {
                        resolve(result);
                    }
                    reject();
                }),
                (error: any) => {
                    console.error(error);
                    reject(error);
                };
        });
    }

    async setLocation(sLocationId: string = '') {
        try {
            return new Promise<void>(async (resolve, reject) => {
                this.sCurrentLocationId =
                    sLocationId ?? localStorage.getItem('currentLocation') ?? '';
                const location: any = await this.getLocations();
                let oNewLocation: any = location?.data?.aLocation[0];
                let bIsCurrentBIsWebshop = false;
                // for (let i = 0; i < location?.data?.aLocation.length; i++) {
                //     const l = location?.data?.aLocation[i];
                //     if (l.bIsWebshop) oNewLocation = l;
                //     if (l._id.toString() === this.sCurrentLocationId) {
                //         if (l.bIsWebshop) {
                //             bIsCurrentBIsWebshop = true;
                //             this.$currentLocation.next({
                //                 selectedLocation: l,
                //                 sName: location?.data?.sName,
                //             });
                //             localStorage.setItem('currentLocation', l._id.toString());
                //             break;
                //         }
                //     }
                // }
                if (!bIsCurrentBIsWebshop) {
                    localStorage.setItem('currentLocation', oNewLocation._id.toString());
                    this.$currentLocation.next({
                        selectedLocation: oNewLocation,
                        sName: location?.data?.sName,
                    });
                    await this.fetchWorkstations();
                }
                this.iLocationId = this.sCurrentLocationId;
                resolve();
            });
        } catch (error) {
            console.log('error 310', error);
        }
    }

    // function for fetch workstations list
    fetchWorkstations() {
        return new Promise<void>(async (resolve, reject) => {
            this.businessWorkStations = [];
            // if (!this.selectedBusiness["selectedLocation"]) {
            //     this.selectedBusiness["selectedLocation"] = this.userDetail.aBusiness[0]?.aLocation[0];
            //     localStorage.setItem("currentLocation", this.selectedBusiness["selectedLocation"]._id);
            //     this.iLocationId = this.selectedBusiness["selectedLocation"]._id
            // }

            const iBusinessId = this.iBusinessId || localStorage.getItem('currentBusiness');
            const iLocationId = localStorage.getItem('currentLocation');

            // const headers = {
            //     Authorization: localStorage.getItem('alternateToken')
            //         ? localStorage.getItem('alternateToken')
            //         : localStorage.getItem('authorization'),
            //     'organization-id': this.organizationDetails.sName,
            //     'Content-Type': 'application/json',
            //     observe: 'response',
            // };
            this.apiService
                .getNew(
                    'cashregistry',
                    `/api/v1/workstations/list/${iBusinessId}/${iLocationId}`,
                )
                .subscribe(
                    (result: any) => {
                        if (result?.data?.length) {
                            this.businessWorkStations = result.data;
                            let workstationId = localStorage.getItem('currentWorkstation');
                            let bChanged = false;
                            if (workstationId && this.businessWorkStations.length > 0) {
                                result.data.filter((workstation: any) => {
                                    if (workstation._id == workstationId) {
                                        bChanged = true;
                                        this.selectWorkstation(workstation);
                                    }
                                });
                                if (!bChanged)
                                    this.selectWorkstation(this.businessWorkStations[0]);
                            } else {
                                // this.selectedWorkStation = this.businessWorkStations[0] || { sName: 'NO_WORKSTATION' };
                                this.selectWorkstation(this.businessWorkStations[0]);
                            }
                            resolve();
                        } else {
                            //if no workstation found then we create a new one - DEFAULT
                            let data = {
                                iBusinessId: this.iBusinessId,
                                iLocationId: this.iLocationId,
                                sName: 'DEFAULT',
                            };
                            this.apiService
                                .postNew('cashregistry', '/api/v1/workstations/create', data)
                                .subscribe((result: any) => {
                                    if (result?.data) this.selectWorkstation(result.data);
                                    resolve();
                                });
                        }
                    },
                    (error) => {
                        console.log('fetchWorkstations 375: ', error);
                    }
                );
        });
    }

    // Function for select workstation
    selectWorkstation(workstation: any) {
        localStorage.setItem('currentWorkstation', workstation._id);
        this.selectedWorkStation = workstation;
    }

    // organizations/list
    async listOrganization(searchValue?: string) {
        const aOrgList: any = await this.apiService
            .postNew('organization', `/api/v1/organizations/list`, {
                ...(searchValue && { searchValue })
            })
            .toPromise();

        if (aOrgList?.data?.result?.length)
            this.aOrganizationList = aOrgList?.data?.result.slice(0, 5);
    }

    async getOrganizationByName(orgName: string) {
        this.bIsLoading = true;
        this.apiService.postNew('organization', `/api/v1/organizations/get-by-name`, { sOrgName: orgName }).subscribe((org: any) => {
            console.log("aOrgList", org);
            if (org.data && org.data._id) {
                this.user.iOrganizationid = org.data._id;
                this.aOrganizationList.push(org.data)
            }
            this.bIsLoading = false;
            this.isOrgFetched = true;
        }, err => {
            alert("Please enter valid organization!");
            this.user.iOrganizationid = [];
            this.aOrganizationList = [];
            this.bIsLoading = false;
            this.isOrgFetched = false;
        })
    }

    onClearOrg(event:any){
        this.isOrgFetched = false;
    }
}
