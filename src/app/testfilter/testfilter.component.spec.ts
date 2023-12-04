import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestFilterComponent } from './testfilter.component';

describe('TestFilterComponent', () => {
  let component: TestFilterComponent;
  let fixture: ComponentFixture<TestFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
