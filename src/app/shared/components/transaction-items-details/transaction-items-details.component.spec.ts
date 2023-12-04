import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionItemsDetailsComponent } from './transaction-items-details.component';

describe('CustomerDetailsComponent', () => {
  let component: TransactionItemsDetailsComponent;
  let fixture: ComponentFixture<TransactionItemsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransactionItemsDetailsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionItemsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
