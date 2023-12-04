import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionFileImportComponent } from './transaction-file-import.component';

describe('TransactionFileImportComponent', () => {
  let component: TransactionFileImportComponent;
  let fixture: ComponentFixture<TransactionFileImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionFileImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionFileImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
