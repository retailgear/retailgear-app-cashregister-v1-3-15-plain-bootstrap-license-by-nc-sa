import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftCardFileImportComponent } from './import-gift-card-file.component';

describe('GiftCardFileImportComponent', () => {
  let component: GiftCardFileImportComponent;
  let fixture: ComponentFixture<GiftCardFileImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiftCardFileImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GiftCardFileImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
