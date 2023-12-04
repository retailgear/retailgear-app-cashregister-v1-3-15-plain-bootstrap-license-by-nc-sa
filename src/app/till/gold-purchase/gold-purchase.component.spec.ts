import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoldPurchaseComponent } from './gold-purchase.component';

describe('GoldPurchaseComponent', () => {
  let component: GoldPurchaseComponent;
  let fixture: ComponentFixture<GoldPurchaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoldPurchaseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoldPurchaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
