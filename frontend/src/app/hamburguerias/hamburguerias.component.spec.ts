import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { HamburgueriasComponent } from './hamburguerias.component';
import { Hamburgueria, HamburgueriasService } from './hamburguerias.service';
import { MapsService } from './maps.service';
import { UserError } from './user-error';

describe('HamburgueriasComponent', () => {
  const origin = { lat: -23.5, lng: -46.6 };
  const places: Hamburgueria[] = [{ name: 'Burger Bom', latitude: -23.51, longitude: -46.61 }];

  let hamburguerias: jasmine.SpyObj<HamburgueriasService>;
  let maps: jasmine.SpyObj<MapsService>;
  let fixture: ReturnType<typeof TestBed.createComponent<HamburgueriasComponent>>;
  let component: HamburgueriasComponent;
  let element: HTMLElement;

  beforeEach(() => {
    hamburguerias = jasmine.createSpyObj('HamburgueriasService', ['searchNear']);
    maps = jasmine.createSpyObj('MapsService', ['geocode', 'show']);
    maps.show.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [HamburgueriasComponent],
      providers: [
        { provide: HamburgueriasService, useValue: hamburguerias },
        { provide: MapsService, useValue: maps },
      ],
    });
    fixture = TestBed.createComponent(HamburgueriasComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  function stubGeolocation(result: 'allow' | 'deny'): void {
    spyOnProperty(navigator, 'geolocation').and.returnValue({
      getCurrentPosition: (success: PositionCallback, failure: PositionErrorCallback) =>
        result === 'allow'
          ? success({ coords: { latitude: origin.lat, longitude: origin.lng } } as GeolocationPosition)
          : failure({ code: 1 } as GeolocationPositionError),
    } as Geolocation);
  }

  it('geocodes the address, searches around it and shows the map', async () => {
    maps.geocode.and.resolveTo(origin);
    hamburguerias.searchNear.and.returnValue(of(places));

    component.address = '01310-100';
    await component.searchByAddress();

    expect(maps.geocode).toHaveBeenCalledWith('01310-100');
    expect(hamburguerias.searchNear).toHaveBeenCalledWith(origin);
    expect(maps.show).toHaveBeenCalledWith(element.querySelector('.map') as HTMLElement, origin, places);
    expect(component.message()).toBeNull();
  });

  it('does nothing when the address is empty', async () => {
    component.address = '   ';
    await component.searchByAddress();
    fixture.detectChanges();

    expect(maps.geocode).not.toHaveBeenCalled();
    expect(element.querySelector('.message')?.textContent).toContain('Informe um endereço');
  });

  it('shows a message when the address cannot be found', async () => {
    maps.geocode.and.rejectWith(new UserError('Endereço não encontrado.'));

    component.address = 'Lugar nenhum';
    await component.searchByAddress();
    fixture.detectChanges();

    expect(hamburguerias.searchNear).not.toHaveBeenCalled();
    expect(element.querySelector('.message')?.textContent).toContain('Endereço não encontrado');
  });

  it('searches around the browser location', async () => {
    stubGeolocation('allow');
    hamburguerias.searchNear.and.returnValue(of(places));

    await component.searchByMyLocation();

    expect(hamburguerias.searchNear).toHaveBeenCalledWith(origin);
    expect(maps.show).toHaveBeenCalledWith(jasmine.any(HTMLElement), origin, places);
  });

  it('shows a message when the location is denied', async () => {
    stubGeolocation('deny');

    await component.searchByMyLocation();
    fixture.detectChanges();

    expect(hamburguerias.searchNear).not.toHaveBeenCalled();
    expect(element.querySelector('.message')?.textContent).toContain('sua localização');
  });

  it('still shows the map and says so when there are no results', async () => {
    maps.geocode.and.resolveTo(origin);
    hamburguerias.searchNear.and.returnValue(of([]));

    component.address = 'Rua A';
    await component.searchByAddress();
    fixture.detectChanges();

    expect(maps.show).toHaveBeenCalledWith(jasmine.any(HTMLElement), origin, []);
    expect(element.querySelector('.message')?.textContent).toContain('Nenhuma hamburgueria');
  });

  it('shows the specific message when the map is not configured', async () => {
    maps.geocode.and.rejectWith(new UserError('O mapa não está configurado.'));

    component.address = 'Rua A';
    await component.searchByAddress();
    fixture.detectChanges();

    expect(element.querySelector('.message')?.textContent).toContain('O mapa não está configurado.');
  });

  it('shows a message when the search fails', async () => {
    maps.geocode.and.resolveTo(origin);
    hamburguerias.searchNear.and.returnValue(throwError(() => new Error('502')));

    component.address = 'Rua A';
    await component.searchByAddress();
    fixture.detectChanges();

    expect(maps.show).not.toHaveBeenCalled();
    expect(element.querySelector('.message')?.textContent).toContain('Não foi possível buscar');
    expect(component.loading()).toBeFalse();
  });
});
