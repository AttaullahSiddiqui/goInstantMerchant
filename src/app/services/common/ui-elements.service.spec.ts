import { TestBed } from '@angular/core/testing';

import { UiElementsService } from './ui-elements.service';

describe('UiElementsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UiElementsService = TestBed.get(UiElementsService);
    expect(service).toBeTruthy();
  });
});
