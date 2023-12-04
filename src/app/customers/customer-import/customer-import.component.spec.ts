import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerImportComponent } from './customer-import.component';

describe('CustomerImportComponent', () => {
  let component: CustomerImportComponent;
  let fixture: ComponentFixture<CustomerImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
