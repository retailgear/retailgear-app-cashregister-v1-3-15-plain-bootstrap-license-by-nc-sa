import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersGroupComponent } from './customers-group.component';

describe('CustomersGroupComponent', () => {
  let component: CustomersGroupComponent;
  let fixture: ComponentFixture<CustomersGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomersGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
