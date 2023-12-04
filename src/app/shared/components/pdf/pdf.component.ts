import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-pdf',
  template: '<div #pdfGenerator id="pdfGenerator"></div>',
  styleUrls: ['./pdf.component.sass']
})
export class PdfComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
