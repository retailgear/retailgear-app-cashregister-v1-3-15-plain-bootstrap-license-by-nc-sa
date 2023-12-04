import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickbuttonWizardComponent } from './quickbutton-wizard.component';

describe('QuickbuttonWizardComponent', () => {
  let component: QuickbuttonWizardComponent;
  let fixture: ComponentFixture<QuickbuttonWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickbuttonWizardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickbuttonWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
