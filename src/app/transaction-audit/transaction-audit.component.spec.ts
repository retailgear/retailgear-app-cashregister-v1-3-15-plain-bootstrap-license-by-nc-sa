import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionAuditComponent } from './transaction-audit.component';

describe('TransactionAuditComponent', () => {
  let component: TransactionAuditComponent;
  let fixture: ComponentFixture<TransactionAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionAuditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
