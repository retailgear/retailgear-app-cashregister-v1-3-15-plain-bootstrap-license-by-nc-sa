import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayClosureComponent } from './day-closure.component';

describe('DayClosureComponent', () => {
  let component: DayClosureComponent;
  let fixture: ComponentFixture<DayClosureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DayClosureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DayClosureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
