/* eslint-disable @angular-eslint/no-input-rename */
/**
 * A single tab page. It renders the passed template
 * via the @Input properties by using the ngTemplateOutlet
 * and ngTemplateOutletContext directives.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pn-tab',
  template: `
    <div [ngClass]="{'active' : active}" class="tab-pane">
      <ng-content></ng-content>
    </div>
  `
})
export class TabComponent {
  @Input('tabTitle') title!: string;
  @Input('allColumns') allColumns!: any;
  @Input('transactions') transactions!: any;
  @Input() active = false;
}
