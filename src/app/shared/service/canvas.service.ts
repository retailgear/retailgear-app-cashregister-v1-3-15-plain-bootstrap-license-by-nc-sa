import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  constructor() { }

  // Convert image url in assets to b64
  getBase64Image(url: string): Promise<any> {
    return new Promise((resolve) => {
      const image = new Image();
      const outputFormat = 'image/png';
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
        // tslint:disable-next-line: no-angle-bracket-type-assertion
        let canvas = <HTMLCanvasElement>document.createElement('CANVAS');
        // let canvas = document.createElement('CANVAS') as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        let dataURL;
        canvas.height = image.height;
        canvas.width = image.width;
        // context.drawImage(image, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        // canvas = null;
        resolve(dataURL);
      };
      image.src = url;
    });
  }
}
