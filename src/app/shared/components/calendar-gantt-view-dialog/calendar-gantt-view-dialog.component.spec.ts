import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarGanttViewDialogComponent } from './calendar-gantt-view-dialog.component';

describe('CalendarGanttViewDialogComponent', () => {
  let component: CalendarGanttViewDialogComponent;
  let fixture: ComponentFixture<CalendarGanttViewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalendarGanttViewDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarGanttViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
