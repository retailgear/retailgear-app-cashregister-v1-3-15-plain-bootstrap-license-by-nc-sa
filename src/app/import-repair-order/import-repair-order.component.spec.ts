import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportRepairOrderComponent } from './import-repair-order.component';

describe('ImportRepairOrderComponent', () => {
  let component: ImportRepairOrderComponent;
  let fixture: ComponentFixture<ImportRepairOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportRepairOrderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportRepairOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
