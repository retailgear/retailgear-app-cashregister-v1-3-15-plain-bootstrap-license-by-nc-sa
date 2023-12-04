import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyPointsDiscountComponent } from './loyalty-points-discount.component';

describe('LoyaltyPointsDiscountComponent', () => {
  let component: LoyaltyPointsDiscountComponent;
  let fixture: ComponentFixture<LoyaltyPointsDiscountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoyaltyPointsDiscountComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoyaltyPointsDiscountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
