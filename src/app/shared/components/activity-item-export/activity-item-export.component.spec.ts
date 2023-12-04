import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityItemExportComponent } from './activity-item-export.component';

describe('ActivityItemExportComponent', () => {
  let component: ActivityItemExportComponent;
  let fixture: ComponentFixture<ActivityItemExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActivityItemExportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityItemExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
