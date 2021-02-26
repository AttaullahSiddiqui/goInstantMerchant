import { TestBed } from '@angular/core/testing';

import { FirebaseUploaderService } from './firebase-uploader.service';

describe('FirebaseUploaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FirebaseUploaderService = TestBed.get(FirebaseUploaderService);
    expect(service).toBeTruthy();
  });
});
