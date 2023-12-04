import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportRepairOrderDetailComponent } from './import-repair-order-detail.component';

describe('ImportRepairOrderDetailComponent', () => {
  let component: ImportRepairOrderDetailComponent;
  let fixture: ComponentFixture<ImportRepairOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportRepairOrderDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportRepairOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
