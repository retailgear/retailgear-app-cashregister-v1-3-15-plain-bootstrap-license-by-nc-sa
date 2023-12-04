import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraServiceComponent } from './extra-service.component';

describe('ExtraServiceComponent', () => {
  let component: ExtraServiceComponent;
  let fixture: ComponentFixture<ExtraServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraServiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtraServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
