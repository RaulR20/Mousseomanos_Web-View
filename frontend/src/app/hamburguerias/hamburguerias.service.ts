import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Hamburgueria {
  name: string;
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class HamburgueriasService {
  private readonly http = inject(HttpClient);

  searchNear({ lat, lng }: Coordinates): Observable<Hamburgueria[]> {
    const params = new HttpParams().set('lat', lat).set('lng', lng);
    return this.http.get<Hamburgueria[]>(`${environment.apiUrl}/hamburguerias`, { params });
  }
}
