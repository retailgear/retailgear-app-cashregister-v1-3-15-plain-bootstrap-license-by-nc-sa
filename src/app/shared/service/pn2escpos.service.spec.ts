import { TestBed } from '@angular/core/testing';

import { Pn2escposService } from './pn2escpos.service';

describe('Pn2escposService', () => {
  let service: Pn2escposService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pn2escposService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
