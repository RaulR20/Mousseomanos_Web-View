import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { distanceInMeters, formatDistance } from './distance';
import { Coordinates, Hamburgueria } from './hamburguerias.service';
import { UserError } from './user-error';

const MAPS_CALLBACK = '__onGoogleMapsLoaded';
const GOOGLE_TIMEOUT_MS = 10_000;

/** Mapa escuro com tons quentes; esconde outros estabelecimentos para só as hamburguerias aparecerem. */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1512' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#c9b8a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1512' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3a2a22' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#7a4a1f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0b0a' }] },
];

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new UserError('O Google Maps não respondeu. Verifique a chave de API e as APIs habilitadas.')),
      GOOGLE_TIMEOUT_MS,
    );
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

@Injectable({ providedIn: 'root' })
export class MapsService {
  private readonly http = inject(HttpClient);

  private scriptLoaded?: Promise<void>;
  private map?: google.maps.Map;
  private infoWindow?: google.maps.InfoWindow;
  private markers: google.maps.Marker[] = [];

  /** Converte um endereço ou CEP em coordenadas. */
  async geocode(address: string): Promise<Coordinates> {
    await this.loadScript();
    const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
    try {
      // Com chave inválida ou Geocoding API desabilitada o Google pode nunca responder.
      const { results } = await withTimeout(new Geocoder().geocode({ address: `${address}, Brasil`, region: 'br' }));
      const location = results[0].geometry.location;
      return { lat: location.lat(), lng: location.lng() };
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('Endereço não encontrado.');
    }
  }

  /** Mostra o mapa com a bolinha azul na origem e um pin vermelho em cada hamburgueria. */
  async show(container: HTMLElement, origin: Coordinates, places: Hamburgueria[]): Promise<void> {
    await this.loadScript();
    const { Map, InfoWindow } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
    const { Marker } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

    this.map ??= new Map(container, {
      center: origin,
      zoom: 14,
      streetViewControl: false,
      mapTypeControl: false,
      styles: MAP_STYLES,
    });
    this.infoWindow ??= new InfoWindow();
    this.infoWindow.close();
    this.markers.forEach((marker) => marker.setMap(null));

    const bounds = new google.maps.LatLngBounds(origin);
    const currentLocation = new Marker({
      map: this.map,
      position: origin,
      title: 'Você está aqui',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
    const pins = places.map((place) => {
      const position = { lat: place.latitude, lng: place.longitude };
      bounds.extend(position);
      const pin = new Marker({ map: this.map, position, title: place.name });
      const distance = formatDistance(distanceInMeters(origin, { lat: place.latitude, lng: place.longitude }));
      pin.addListener('click', () => this.showDetails(pin, place.name, distance));
      return pin;
    });
    this.markers = [currentLocation, ...pins];

    if (places.length > 0) {
      this.map.fitBounds(bounds);
    } else {
      this.map.setCenter(origin);
      this.map.setZoom(14);
    }
  }

  /** Abre um balão com o nome e a distância até o estabelecimento sobre o pin clicado. */
  private showDetails(pin: google.maps.Marker, name: string | null, distance: string): void {
    const content = document.createElement('div');
    content.className = 'pin-info';
    const title = document.createElement('strong');
    title.textContent = name || 'Hamburgueria';
    const detail = document.createElement('span');
    detail.textContent = `a ${distance} de você, em linha reta`;
    content.append(title, detail);
    this.infoWindow?.setContent(content);
    this.infoWindow?.open({ map: this.map, anchor: pin });
  }

  private loadScript(): Promise<void> {
    this.scriptLoaded ??= this.injectScript().catch((error) => {
      this.scriptLoaded = undefined;
      throw error;
    });
    return this.scriptLoaded;
  }

  private async injectScript(): Promise<void> {
    const { mapsApiKey } = await firstValueFrom(
      this.http.get<{ mapsApiKey: string }>(`${environment.apiUrl}/config`),
    );
    if (!mapsApiKey) {
      throw new UserError('O mapa não está configurado.');
    }

    await new Promise<void>((resolve, reject) => {
      (window as unknown as Record<string, unknown>)[MAPS_CALLBACK] = resolve;
      const script = document.createElement('script');
      script.src =
        'https://maps.googleapis.com/maps/api/js' +
        `?key=${encodeURIComponent(mapsApiKey)}&v=weekly&loading=async&callback=${MAPS_CALLBACK}`;
      script.async = true;
      script.onerror = () => reject(new UserError('Não foi possível carregar o Google Maps.'));
      document.head.appendChild(script);
    });
  }
}
