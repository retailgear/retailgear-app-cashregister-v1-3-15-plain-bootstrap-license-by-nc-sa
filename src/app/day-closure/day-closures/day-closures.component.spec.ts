import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayClosuresComponent } from './day-closures.component';

describe('DayClosuresComponent', () => {
  let component: DayClosuresComponent;
  let fixture: ComponentFixture<DayClosuresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DayClosuresComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DayClosuresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
