import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { DialogComponent } from './dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private componentSubscriber!: Subject<string>;
  constructor(private injector: Injector,
    private applicationRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver) {}

  openModal(templateRef: any, userConfig: any) {
    // Create element
    const popup = document.createElement('popup-component');

    let className = 'main-container'
    if( document.getElementsByClassName("container") && document.getElementsByClassName("container")[0]) {
      // Running the cash register as separate app will have a different container
      className = 'container'
    }
    document.getElementsByClassName(className)[0].appendChild(popup);

    // Create the component and wire it up with the element
    const factory = this.componentFactoryResolver.resolveComponentFactory(DialogComponent);
    const dialogComponentRef = factory.create(this.injector, [], popup);

    // Attach to the view so that the change detector knows to run
    this.applicationRef.attachView(dialogComponentRef.hostView);

    
    // Listen to the close event
    dialogComponentRef.instance.close.subscribe(() => {
      if(document.body.contains(popup)) document.body.removeChild(popup);
      this.applicationRef.detachView(dialogComponentRef.hostView);
    });

    document.addEventListener('token-expired', () => {
      if (document.body.contains(popup)) document.body.removeChild(popup);
      this.applicationRef.detachView(dialogComponentRef.hostView);
    });

    // Set the message
    dialogComponentRef.instance.template = templateRef;
    dialogComponentRef.instance.context = userConfig.context;
    dialogComponentRef.instance.cssClass = userConfig.cssClass;
    dialogComponentRef.instance.hasBackdrop = userConfig.hasBackdrop;
    dialogComponentRef.instance.closeOnBackdropClick = userConfig.closeOnBackdropClick;
    dialogComponentRef.instance.closeOnEsc = userConfig.closeOnEsc;

    dialogComponentRef.instance.triggerEvent.subscribe((data: any) => {
      if (data == 'close') {
        document?.body?.removeChild(popup);
        this.applicationRef.detachView(dialogComponentRef.hostView);
      }
    });
    
    // Add to the DOM
    document.body.appendChild(popup);
    return dialogComponentRef;
  }
}
