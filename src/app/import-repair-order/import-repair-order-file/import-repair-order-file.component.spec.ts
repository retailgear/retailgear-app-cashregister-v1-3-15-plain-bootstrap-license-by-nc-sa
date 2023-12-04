import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportRepairOrderFileComponent } from './import-repair-order-file.component';

describe('ImportRepairOrderFileComponent', () => {
  let component: ImportRepairOrderFileComponent;
  let fixture: ComponentFixture<ImportRepairOrderFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportRepairOrderFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportRepairOrderFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
