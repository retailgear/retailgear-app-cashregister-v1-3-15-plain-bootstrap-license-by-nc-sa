import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerGroupDetailComponent } from './customer-group-detail.component';

describe('CustomerGroupDetailComponent', () => {
  let component: CustomerGroupDetailComponent;
  let fixture: ComponentFixture<CustomerGroupDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerGroupDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerGroupDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
