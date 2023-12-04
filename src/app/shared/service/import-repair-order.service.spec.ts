import { TestBed } from '@angular/core/testing';

import { ImportRepairOrderService } from './import-repair-order.service';

describe('ImportRepairOrderService', () => {
  let service: ImportRepairOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportRepairOrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
