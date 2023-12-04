import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiskalySettingsComponent } from './fiskaly-settings.component';

describe('FiskalySettingsComponent', () => {
  let component: FiskalySettingsComponent;
  let fixture: ComponentFixture<FiskalySettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FiskalySettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FiskalySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
