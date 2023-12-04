import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankConfirmationDialogComponent } from './bank-confirmation-dialog.component';

describe('BankConfirmationDialogComponent', () => {
  let component: BankConfirmationDialogComponent;
  let fixture: ComponentFixture<BankConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BankConfirmationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BankConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
