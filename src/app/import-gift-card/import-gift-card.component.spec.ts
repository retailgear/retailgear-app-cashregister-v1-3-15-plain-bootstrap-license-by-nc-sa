import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportGiftCardComponent } from './import-gift-card.component';

describe('ImportGiftCardComponent', () => {
  let component: ImportGiftCardComponent;
  let fixture: ComponentFixture<ImportGiftCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportGiftCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportGiftCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
