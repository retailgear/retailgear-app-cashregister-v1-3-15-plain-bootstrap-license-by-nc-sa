import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDetailsImportComponent} from './customer-details-import.component';

describe('CustomerDetailsComponent', () => {
  let component: CustomerDetailsImportComponent;
  let fixture: ComponentFixture<CustomerDetailsImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerDetailsImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerDetailsImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
