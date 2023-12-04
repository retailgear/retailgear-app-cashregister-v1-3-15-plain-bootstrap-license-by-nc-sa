import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MorePaymentsDialogComponent } from './more-payments-dialog.component';

describe('AddExpensesComponent', () => {
  let component: MorePaymentsDialogComponent;
  let fixture: ComponentFixture<MorePaymentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MorePaymentsDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MorePaymentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
