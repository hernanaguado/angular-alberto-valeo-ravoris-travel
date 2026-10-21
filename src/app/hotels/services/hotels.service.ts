import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Hotel } from '../models/hotel.model';

/** URL del endpoint de hoteles. Se puede sobrescribir por entorno o en los tests. */
export const HOTELS_API_URL = new InjectionToken<string>('HOTELS_API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000/hotels',
});

@Injectable({ providedIn: 'root' })
export class HotelsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(HOTELS_API_URL);

  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.apiUrl);
  }
}
