import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';

@Component({
  selector: '[till-goldsell]',
  templateUrl: './gold-sell.component.html',
  styleUrls: ['./gold-sell.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class GoldSellComponent implements OnInit {
  @Input() item: any
  constructor() { }

  ngOnInit(): void {
  }

}
