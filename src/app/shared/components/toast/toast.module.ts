import { NgModule} from '@angular/core'
import { OverlayModule } from '@angular/cdk/overlay';

import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [OverlayModule, CommonModule, FontAwesomeModule],
  declarations: [ToastComponent],
  entryComponents: [ToastComponent]
})
export class ToastModule {
  public static forRoot() {
        return {
            ngModule: ToastModule,
            providers: [
                ToastService
            ],
        };
    }
 }
