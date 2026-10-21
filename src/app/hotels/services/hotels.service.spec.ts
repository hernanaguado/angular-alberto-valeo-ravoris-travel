import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Hotel } from '../models/hotel.model';
import { createHotel } from '../testing/hotel.factory';
import { HOTELS_API_URL, HotelsService } from './hotels.service';

describe('HotelsService', () => {
  const apiUrl = '/api/hotels';

  let service: HotelsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HOTELS_API_URL, useValue: apiUrl },
      ],
    });
    service = TestBed.inject(HotelsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch hotels with GET from the configured URL', () => {
    const mockHotels = [createHotel({ id: '1' }), createHotel({ id: '2', name: 'Hotel Luna' })];

    let result: Hotel[] | undefined;
    service.getHotels().subscribe((hotels) => (result = hotels));

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockHotels);

    expect(result).toEqual(mockHotels);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getHotels().subscribe({
      next: () => fail('expected an error'),
      error: (err: HttpErrorResponse) => (error = err),
    });

    httpMock.expectOne(apiUrl).flush('Server error', { status: 500, statusText: 'Server Error' });

    expect(error?.status).toBe(500);
  });
});

describe('HOTELS_API_URL', () => {
  it('should point to json-server by default', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

    expect(TestBed.inject(HOTELS_API_URL)).toBe('http://localhost:3000/hotels');
  });
});
