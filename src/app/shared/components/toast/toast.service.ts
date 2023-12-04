import { Injectable, Injector } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';

import { ToastComponent } from './toast.component';
import { ToastData, ToastConfig, defaultToastConfig } from './toast-config';
import { ToastRef } from './toast-ref';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private lastToast!: ToastRef;
  toastConfig: ToastConfig = defaultToastConfig;

  constructor(
    private overlay: Overlay,
    private parentInjector: Injector
  ) { }

  show(data: ToastData) {
    const positionStrategy : any = this.getPositionStrategy();
    const overlayRef : any = this.overlay.create();

    overlayRef._pane.style = "top:"+ positionStrategy._topOffset + "; right:"+ positionStrategy._rightOffset + "; position: absolute !important; z-index:100; margin-top: 20px;";
    const toastRef = new ToastRef(overlayRef);
    this.lastToast = toastRef;

    const injector = this.getInjector(data, toastRef, this.parentInjector);
    const toastPortal = new ComponentPortal(ToastComponent, null, injector);

    overlayRef.attach(toastPortal);

    return toastRef;
  }

  getPositionStrategy() {
    return this.overlay.position()
      .global()
      .top(this.getPosition())
      .right(this.toastConfig?.position?.right + 'px');
  }

  getPosition() {
    const lastToastIsVisible = this.lastToast && this.lastToast.isVisible();
    const position = lastToastIsVisible
      ? this.lastToast.getPosition().bottom
      : this.toastConfig?.position?.top;

    return position + 'px';
  }

  getInjector(data: ToastData, toastRef: ToastRef, parentInjector: Injector) {
    const tokens = new WeakMap();

    tokens.set(ToastData, data);
    tokens.set(ToastRef, toastRef);

    return new PortalInjector(parentInjector, tokens);
  }
}
