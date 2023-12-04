import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSyncDialogComponent } from './customer-sync-dialog.component';

describe('CustomerSyncDialogComponent', () => {
  let component: CustomerSyncDialogComponent;
  let fixture: ComponentFixture<CustomerSyncDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerSyncDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerSyncDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
