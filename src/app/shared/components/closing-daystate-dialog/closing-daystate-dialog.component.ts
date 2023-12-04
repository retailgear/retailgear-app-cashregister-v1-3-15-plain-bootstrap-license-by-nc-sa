import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { DialogComponent } from "../../service/dialog";
import { TillService } from '../../service/till.service';

@Component({
  selector: 'app-closing-daystate-dialog',
  templateUrl: './closing-daystate-dialog.component.html',
  styleUrls: ['./closing-daystate-dialog.component.scss']
})
export class ClosingDaystateDialogComponent implements OnInit {
  dialogRef: DialogComponent

  faTimes = faTimes;
  choice:any = 'skim_all';
  nCashInTill:any;

  constructor(
    private viewContainerRef: ViewContainerRef,
    public tillService: TillService) {
    const _injector = this.viewContainerRef.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
  }

  ngOnInit(): void {
  }

  close(data:any): void {
    this.dialogRef.close.emit(data)
  }    
}
