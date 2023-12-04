import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintWorkstationComponent } from './print-workstation.component';

describe('PrintWorkstationComponent', () => {
  let component: PrintWorkstationComponent;
  let fixture: ComponentFixture<PrintWorkstationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintWorkstationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintWorkstationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
