import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-pdf',
  template: '<div #pdfGenerator id="pdfGenerator"></div>',
  styleUrls: ['./pdf.component.scss']
})
export class PdfComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
