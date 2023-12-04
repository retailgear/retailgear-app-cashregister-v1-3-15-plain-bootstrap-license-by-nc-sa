import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsSettingsComponent } from './statistics-settings.component';

describe('StatisticsSettingsComponent', () => {
  let component: StatisticsSettingsComponent;
  let fixture: ComponentFixture<StatisticsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatisticsSettingsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
