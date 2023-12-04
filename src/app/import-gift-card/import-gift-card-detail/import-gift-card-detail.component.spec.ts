import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportGiftCardDetailComponent } from './import-gift-card-detail.component';

describe('ImportGiftCardDetailComponent', () => {
  let component: ImportGiftCardDetailComponent;
  let fixture: ComponentFixture<ImportGiftCardDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportGiftCardDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportGiftCardDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
