import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnimationEvent } from '@angular/animations';

import { ToastData, ToastConfig, defaultToastConfig } from './toast-config';
import { ToastRef } from './toast-ref';
import { toastAnimations, ToastAnimationState } from './toast-animation';
import { faBolt, faCheckSquare, faEnvelopeSquare, faExclamationTriangle, faQuestion, IconDefinition, faTimes, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  animations: [toastAnimations.fadeToast],
})
export class ToastComponent implements OnInit, OnDestroy {
  animationState: ToastAnimationState = 'default';
  iconType: IconDefinition;
  times = faTimes;
  bg_color: string;
  toastConfig: ToastConfig = defaultToastConfig;
  states = {
    computer: '',
    printer: '',
    printJob: '',
    message: ''
  };
  showDetails: boolean = false;
  chevronDown = faChevronDown;
  chevronUp = faChevronUp;

  private intervalId: any;
  noAutoClose: boolean = true;

  constructor(
    readonly data: ToastData,
    readonly ref: ToastRef,
    private apiService: ApiService
  ) {
    switch (data.type) {
      case 'primary':
        this.iconType = faEnvelopeSquare;
        break;
      case 'success':
        this.iconType = faCheckSquare;
        break;
      case 'info':
        this.iconType = faQuestion;
        break;
      case 'warning':
        this.iconType = faExclamationTriangle;
        break;
      case 'danger':
        this.iconType = faBolt;
        break;
      default:
        this.iconType = faEnvelopeSquare;
    }
    this.bg_color = data.type ? "bg-" + data.type : "";
    
    this.noAutoClose = this.data?.noAutoClose || false;
  }

  ngOnInit() {
    if (this.data?.apiUrl) {
      this.fetchStatus();
      this.intervalId = setTimeout(() => this.animationState = 'closing', 15000);
    } else{
      if (!this.noAutoClose) {
        this.intervalId = setTimeout(() => this.animationState = 'closing', 5000);
      }
    }

  }

  ngOnDestroy() {
    clearTimeout(this.intervalId);
  }

  close() {
    this.ref.close();
  }

  onFadeFinished(event: AnimationEvent) {
    const { toState } = event;
    const isFadeOut = (toState as ToastAnimationState) === 'closing';
    const itFinished = this.animationState === 'closing';

    if (isFadeOut && itFinished) {
      this.close();
    }
  }

  fetchStatus() {
    if (this.data.apiUrl)
      this.apiService.getNew('cashregistry', this.data.apiUrl).subscribe((response: any) => {
        if (response?.state) {
          this.states.printJob = 'Print job status : ' + response?.state;
          this.states.computer = 'Computer status : ' + response?.printer?.computer?.state;
          this.states.printer = 'Printer status : ' + response?.printer?.state;
        } else {
          this.states.message = 'PRINTJOB_NOT_FOUND';
        }
      })
  }
  closeToast(){
    this.intervalId = setTimeout(() => this.animationState = 'closing', 1000);
  }
}
