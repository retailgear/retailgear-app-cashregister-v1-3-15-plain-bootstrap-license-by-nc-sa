import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoldSellComponent } from './gold-sell.component';

describe('GoldSellComponent', () => {
  let component: GoldSellComponent;
  let fixture: ComponentFixture<GoldSellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoldSellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoldSellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
