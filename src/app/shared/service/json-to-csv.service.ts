import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ExportsService } from './exports.service';

@Injectable({
  providedIn: 'root'
})
export class JsonToCsvService {
  constructor(
    private apiService: ApiService,
    private exportsService: ExportsService
  ) { }

  iBusinessId : String = ''

  convertToCSV(objArray: Array<any>, headerList: Array<any>, valuesList: Array<any>, filename: String, separator: String, data: any) {
    let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = 'S.No' + separator;
    for (let index in headerList) {
     row += headerList[index] + separator;
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    for (let i = 0; i < array.length; i++) {
     let line = (i+1)+'';
     for (let index in valuesList) {
      let head = valuesList[index];
      let value = array[i][head];
      if(!value && value != 0) value = '';
      line += separator + value;
     }
     str += line + '\r\n';
    }
    this.downloadFile(str, filename, data)
   }

   downloadFile(csvData: String, filename: String, data: any) {
    let blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    this.uploadCSVFileOnServer(csvData, filename, ".csv", data);
    let dwldLink = document.createElement("a");
    let url = URL.createObjectURL(blob);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
        dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  uploadCSVFileOnServer(csvData: any, filename: String, fileType: String, data: any){
    let body = {
        filename : filename,
        fileType: fileType,
        userFormData: csvData
    }
    const iBusinessId = localStorage.getItem("currentBusiness");

    this.apiService.postNew('core', '/api/v1/stock-list/uploadFile/' + iBusinessId, body)
    .subscribe((result: any)=>{
        if(result && result.data && result.data.Location) {
          data.sS3Link = result.data.Location;
          this.exportsService.createExportRecord(iBusinessId, data)
        }
    })
  }
}