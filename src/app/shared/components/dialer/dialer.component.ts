import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-dialer',
  templateUrl: './dialer.component.html',
  styleUrls: ['./dialer.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialerComponent implements OnChanges, OnInit {

  @Input()
  set quantity(value: number) {
    this.qty = value
  }
  get quantity() {
    return this.qty
  }
  @Output() quantityChange = new EventEmitter<number>()

  faPlus = faPlus
  faMinus = faMinus
  qty = 0

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
  }
  ngOnInit() {
    // this.qty = JSON.parse(JSON.stringify(this.quantity))
  }

  increase(): void {
    this.qty++
    if (this.qty === 0) {
      this.qty = 1;
    }
    this.quantityChange.emit(this.qty)
  }

  decrease(): void {
    if (this.qty <= 1) return;
    this.qty--
    this.quantityChange.emit(this.qty)
  }

  change(oldValue: any, newValue: any): void {
  }
}
