import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
  Injector,
  Compiler
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.sass']
})
export class DialogComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    private compiler: Compiler,
    private injector: Injector,
    private componentFactoryResolver: ComponentFactoryResolver) { }
  @Output() close = new EventEmitter();
  @Input() template: any;
  @Input() context: any;
  @Input() cssClass: any;
  @Input() hasBackdrop: boolean | undefined;
  @Input() closeOnBackdropClick: boolean | undefined;
  @Input() closeOnEsc: boolean | undefined;

  @Output() triggerEvent: EventEmitter<any> = new EventEmitter();
  contextChanged = new Subject<any>();

  @ViewChild('backdrop', { read: ViewContainerRef }) backdrop!: ViewContainerRef;
  @ViewChild('dialogContainer', { read: ViewContainerRef }) container!: ViewContainerRef;
  @ViewChild('dialog', { read: ViewContainerRef }) dialog!: ViewContainerRef;
  componentRef: any;
  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    import('src/app/shared/shared.module').then(({ SharedModule }) => {
      this.compiler.compileModuleAsync(SharedModule).then(moduleFactory => {
        const moduleRef: any = moduleFactory.create(this.injector);
        const componentFactory = moduleRef.instance.resolveComponent(this.template);
        this.componentRef = this.container.createComponent(componentFactory, undefined, moduleRef.injector);
        if (this.context && Object.keys(this.context).length > 0) {
          Object.keys(this.context).forEach(key => {
            this.componentRef.instance[key] = this.context[key];
          });
        }
        if (this.cssClass) {
          this.dialog.element.nativeElement.className += " " + this.cssClass;
        }
      })
    });

    if (!this.hasBackdrop) {
      this.backdrop.element.nativeElement.remove();
      if (this.backdrop.element?.nativeElement?.parentElement?.className) {
        this.backdrop.element.nativeElement.parentElement.className = `${this.backdrop.element.nativeElement.parentElement.className} top-spacing`;
      }
    } else if (!this.cssClass?.includes('top-spacing') && this.backdrop.element?.nativeElement?.parentElement?.className) {
      this.backdrop.element.nativeElement.parentElement.className = `${this.backdrop.element.nativeElement.parentElement.className} top-spacing`;
    }
  }

  clickOnBackdrop() {
    this.triggerEvent.emit('close');
  }

  ngOnDestroy(): void {
  }
}