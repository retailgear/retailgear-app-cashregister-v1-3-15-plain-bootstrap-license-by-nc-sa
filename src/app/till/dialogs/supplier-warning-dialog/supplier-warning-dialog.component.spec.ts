import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierWarningDialogComponent } from './supplier-warning-dialog.component';

describe('SupplierWarningDialogComponent', () => {
  let component: SupplierWarningDialogComponent;
  let fixture: ComponentFixture<SupplierWarningDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupplierWarningDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplierWarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
