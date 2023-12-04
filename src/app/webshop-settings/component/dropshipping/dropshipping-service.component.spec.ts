import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropshippingServiceComponent } from './dropshipping-service.component';

describe('DropshippingServiceComponent', () => {
  let component: DropshippingServiceComponent;
  let fixture: ComponentFixture<DropshippingServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropshippingServiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropshippingServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
