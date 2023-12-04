import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDetailsImportComponent} from './transaction-details-import.component';

describe('TransactionDetailsImportComponent', () => {
  let component: TransactionDetailsImportComponent;
  let fixture: ComponentFixture<TransactionDetailsImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionDetailsImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionDetailsImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
