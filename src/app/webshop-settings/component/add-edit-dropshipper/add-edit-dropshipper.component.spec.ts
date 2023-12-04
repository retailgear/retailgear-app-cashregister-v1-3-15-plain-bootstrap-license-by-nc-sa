import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDropshipperComponent } from './add-edit-dropshipper.component';

describe('AddEditDropshipperComponent', () => {
  let component: AddEditDropshipperComponent;
  let fixture: ComponentFixture<AddEditDropshipperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditDropshipperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditDropshipperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
