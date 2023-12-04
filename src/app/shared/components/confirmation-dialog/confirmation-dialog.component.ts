import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { DialogComponent } from "../../service/dialog";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
  header: string = ""
  bodyText: string = ""
  buttonDetails: Array<any> = [
    { text: "CANCEL", value: false }
  ]
  dialogRef: DialogComponent

  faTimes = faTimes

  constructor(private viewContainerRef: ViewContainerRef) {
    const _injector = this.viewContainerRef.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
  }

  confirmed(status: any): void {
    if (status) {
      this.dialogRef.close.emit(status)
    } else {
      this.dialogRef.close.emit(status);
    }
  }

}
