import { TestBed } from '@angular/core/testing';

import { MyEventsService } from './my-events.service';

describe('MyEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MyEventsService = TestBed.get(MyEventsService);
    expect(service).toBeTruthy();
  });
});
