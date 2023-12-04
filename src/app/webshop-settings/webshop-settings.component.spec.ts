import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebshopSettingsComponent } from './webshop-settings.component';

describe('WebshopSettingsComponent', () => {
  let component: WebshopSettingsComponent;
  let fixture: ComponentFixture<WebshopSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebshopSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebshopSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
