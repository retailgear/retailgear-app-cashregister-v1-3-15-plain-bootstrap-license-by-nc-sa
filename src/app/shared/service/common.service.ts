import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from './api.service';
import { ToastService } from '../components/toast';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private file: any;
  constructor(private apiService: ApiService,
    private toastService: ToastService,
    private http: HttpClient) {
  }

  async onFileChange(files: any, iBusinessId: any, fileType: any) {
    if (fileType == 'image') {
      if (files[0].type == 'image/png' || files[0].type == 'image/jpeg' || files[0].type == 'image/jpg') {
        if (files[0].size > 4000 && files[0].size <= 2097152) {
          this.file = files[0];
          try {
            const result: any = await this.submit(iBusinessId, fileType)
            if (result?.data?.url) {
              this.file.url = result.data.url;
              await this.uploadFileToS3(result.data.signature, this.file, result.data.url, this.file.type);
              return this.file;
            }
          } catch (error) {
            console.log("error");
            this.file = undefined;
            return this.file;
          }
        } else {
          this.toastService.show({ type: 'warning', text: 'Image size must be 4kb to 2 mb' });
        }

      } else {
        this.toastService.show({ type: 'warning', text: "Image extension must be png , jpeg , jpg" })
      }
    } else {
      // other file type validation
      this.toastService.show({ type: 'warning', text: "Please upload validate image type file" })
    }

  }


  submit(iBusinessId: any, fileType: any) {
    return this.apiService.getNew('core', '/api/v1/file-uploads/' + iBusinessId + '?fileName=' + this.file.name + '&fileType=' + this.file.type + '&fileSize=' + this.file.size + '&type=' + fileType).toPromise();
  }

  async uploadFileToS3(signedRequest: any, file: any, url: any, type: any) {
    let finalHeaders = {
      'x-amz-acl': 'public-read',
      'Content-Type': type,
      charset: 'utf-8',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Allow-Origin': '*',
      observe: 'response'
    };

    let httpHeaders = {
      headers: new HttpHeaders(finalHeaders),
    }

    return this.http.put(
      signedRequest,
      file,
      httpHeaders,
    ).toPromise();
  }
}
