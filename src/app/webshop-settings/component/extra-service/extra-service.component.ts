import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService } from 'src/app/shared/service/api.service';

@Component({
  selector: 'extra-service',
  templateUrl: './extra-service.component.html',
  styleUrls: ['./extra-service.component.sass']
})
export class ExtraServiceComponent implements OnInit {

  constructor(
    private domSanitizer : DomSanitizer,
    private apiService : ApiService
  ) { }

  service : any = {
    bGiftWrap : false,
    bEngraving : false,
    oGiftWrapDetails : {
      oBasic : {
        bEnabled : false,
        nPrice : 0
      },
      oPremium : {
        bEnabled : false,
        nPrice : 0
      },
      oLuxury : {
        bEnabled : false,
        nPrice : 0
      }
    },
    oEngravingDetails : {
      oFontDetails : {
        bEnabled : false,
        nPrice : 0,
        aFontList : []
      },
      oImageDetails : {
        bEnabled : false,
        nPrice : 0
      }
    }
  };

  iBusinessId : any;
  iLocationId : any;

  fontList : Array<any> = [
    'Open Sans',
    'Times New Roman',
    'Pacifico',
    'Caveat'
  ];
  ngOnInit(): void {
    this.iBusinessId = localStorage.getItem('currentBusiness') || '';
    this.iLocationId = localStorage.getItem('currentLocation') || '';
    this.fetchExtraServiceDetails();
  }

  getSanitizedURL(fontName : string){
    return this.domSanitizer.bypassSecurityTrustResourceUrl('https://fonts.googleapis.com/css?family='+ fontName);
  }

  fetchExtraServiceDetails(){
    this.apiService.getNew('cashregistry', `/api/v1/extra-services/${this.iLocationId}?iBusinessId=${this.iBusinessId}`)
      .subscribe((result : any) => {
        if(result?.data?._id){
          this.service = result.data;
        }
      });
  }
  updateExtraServiceDetails(){
    if(this.service?._id){
      this.updateExtraService();
    } else {
      this.createNewService();
    }
  }

  createNewService(){
    let details = {
      ...this.service,
      iBusinessId : this.iBusinessId,
      iLocationId : this.iLocationId
    }
    this.apiService.postNew('cashregistry', '/api/v1/extra-services', details).subscribe(
      (result : any) =>{
      }
    );
  }

  updateExtraService(){
    this.apiService.putNew('cashregistry', '/api/v1/extra-services/'+this.service._id, this.service).subscribe(
      (result : any) =>{
      }
    );
  }  
}
