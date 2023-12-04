import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintSettingsDetailsComponent } from './print-settings-details.component';

describe('PrintSettingsDetailsComponent', () => {
  let component: PrintSettingsDetailsComponent;
  let fixture: ComponentFixture<PrintSettingsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintSettingsDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintSettingsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
