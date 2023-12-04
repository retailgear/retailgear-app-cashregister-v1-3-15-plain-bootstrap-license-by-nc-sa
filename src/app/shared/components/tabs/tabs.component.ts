/**
 * The main component that renders single TabComponent
 * instances.
 */

import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';

import { TabComponent } from './tab.component';

@Component({
  selector: 'app-pn-tabs',
  template: `
    <ul class="nav nav-tabs nav-line-tabs my-5 fs-6 fw-bolder" [ngClass]="addClass.length > 0 ? addClass : ''">
      <li *ngFor="let tab of tabs" (click)="selectTab(tab)" class="nav-item pointer" [ngClass]="addChildListClass.length > 0 ? addChildListClass : ''">
        <a class="nav-link p-3 m-0" [class.active]="tab.active" [ngClass]="addChildLinkClass.length > 0 ? addChildLinkClass : ''">{{tab.title}}</a>
      </li>
    </ul>    
  <ng-content></ng-content>
  `
})
export class TabsComponent implements AfterContentInit {

  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;
  @Input() addClass: string = '';
  @Input() addChildListClass: string = '';
  @Input() addChildLinkClass: string = '';
  @Output() activeTabChanged = new EventEmitter<string>();
  @Input() activeTabIndex !: number;

  // contentChildren are set
  ngAfterContentInit() {
    // get all active tabs
    
    if (this.activeTabIndex){
      this.selectTab(this.tabs.get(this.activeTabIndex));
    } else {
      let activeTabs = this.tabs.filter((tab) => tab.active);
      // if there is no active tab set, activate the first
      if (activeTabs.length === 0) this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab: any) {
    // deactivate all tabs
    this.tabs.toArray().forEach(tab => tab.active = false);

    // activate the tab the user has clicked on.
    tab.active = true;

    this.activeTabChanged.emit(tab.title);
  }
}
