import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingPointsComponent } from './saving-points.component';

describe('WorkstationComponent', () => {
  let component: SavingPointsComponent;
  let fixture: ComponentFixture<SavingPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SavingPointsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SavingPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
