import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebOrderDetailsComponent } from './web-order-details.component';

describe('CustomerDetailsComponent', () => {
  let component: WebOrderDetailsComponent;
  let fixture: ComponentFixture<WebOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WebOrderDetailsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
