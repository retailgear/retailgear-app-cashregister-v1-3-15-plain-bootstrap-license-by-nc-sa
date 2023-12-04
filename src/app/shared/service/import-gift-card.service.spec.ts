import { TestBed } from '@angular/core/testing';

import { ImportGiftCardService } from './import-gift-card.service';

describe('ImportGiftCardService', () => {
  let service: ImportGiftCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportGiftCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
