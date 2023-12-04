import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityItemsComponent } from './activity-items.component';

describe('ActivityItemsComponent', () => {
  let component: ActivityItemsComponent;
  let fixture: ComponentFixture<ActivityItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActivityItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
