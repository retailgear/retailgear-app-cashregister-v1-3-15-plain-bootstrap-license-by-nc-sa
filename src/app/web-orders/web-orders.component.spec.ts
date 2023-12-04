import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebOrdersComponent } from './web-orders.component';

describe('WebOrdersComponent', () => {
  let component: WebOrdersComponent;
  let fixture: ComponentFixture<WebOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebOrdersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
