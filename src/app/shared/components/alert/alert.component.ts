import {Component, Input, OnInit} from '@angular/core';
import {faTimes, faTriangleExclamation, faCheck, faInfo, faComments} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

@Component({
  selector: 'app-alert',
  template: `
    <div class="alert d-flex align-items-center p-5 mb-10" [ngClass]="getAlertClass('div')" *ngIf="show">
<!--        <span class="svg-icon svg-icon-2hx me-3" [ngClass]="getAlertClass('icon')">-->
          <fa-icon class="svg-icon svg-icon-2hx me-3" [ngClass]="getAlertClass('icon')" [icon]="getAlertIcon()"></fa-icon>
<!--        </span>-->
        <div class="d-flex flex-column">
            <h4 class="mb-1 text-dark" *ngIf="alert.title">{{alert.title}}</h4>
            <span>{{alert.message}}</span>
        </div>
        <button type="button" class="position-absolute position-sm-relative m-2 m-sm-0 top-0 btn btn-icon ms-sm-auto" data-bs-dismiss="alert" *ngIf="dismissible" (click)="closeAlert()">
          <fa-icon [icon]="faTimes"></fa-icon>
        </button>
    </div>
  `,
})
export class AlertComponent implements OnInit {
  @Input() alert: {title: string, message: string} = {title: "", message: 'Alert message'}
  @Input() type: string = 'primary'
  @Input() dismissible: boolean = false

  show: boolean = true
  faTimes = faTimes

  constructor() { }

  ngOnInit(): void {
  }

  getAlertClass(type: string): string {
    let className = ''
    if(type === 'div') {
      className = 'alert-' + this.type
      if (this.dismissible) {
        className += 'alert-dismissible'
      }
    } else if(type === 'icon') {
      className = 'svg-icon-' + this.type
    }
    return className
  }

  getAlertIcon(): IconProp {
    let result = faComments
    switch(this.type) {
      case 'primary':
        result = faComments
        break;
      case 'danger' :
       result = faTriangleExclamation
        break;
      case 'success':
        result = faCheck
        break;
      case 'info':
        result = faInfo
        break;
      case 'warning':
        result = faTriangleExclamation
        break
    }
    return result
  }

  closeAlert(): void {
    this.show = false
  }

}
