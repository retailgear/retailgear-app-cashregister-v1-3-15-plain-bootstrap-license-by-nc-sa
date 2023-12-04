import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditWorkstationComponent } from './add-edit-workstation.component';

describe('AddEditWorkstationComponent', () => {
  let component: AddEditWorkstationComponent;
  let fixture: ComponentFixture<AddEditWorkstationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditWorkstationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditWorkstationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
