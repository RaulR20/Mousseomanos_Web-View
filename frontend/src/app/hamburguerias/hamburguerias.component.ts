import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Coordinates, HamburgueriasService } from './hamburguerias.service';
import { MapsService } from './maps.service';
import { UserError } from './user-error';

@Component({
  selector: 'app-hamburguerias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './hamburguerias.component.html',
  styleUrl: './hamburguerias.component.scss',
})
export class HamburgueriasComponent {
  private readonly hamburguerias = inject(HamburgueriasService);
  private readonly maps = inject(MapsService);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('map');

  address = '';
  readonly loading = signal(false);
  readonly message = signal<string | null>(null);

  async searchByAddress(): Promise<void> {
    const address = this.address.trim();
    if (!address) {
      this.message.set('Informe um endereço ou CEP.');
      return;
    }
    await this.run(() => this.maps.geocode(address));
  }

  async searchByMyLocation(): Promise<void> {
    await this.run(() => this.currentPosition());
  }

  private currentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new UserError('Seu navegador não suporta geolocalização.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => reject(new UserError('Não foi possível obter sua localização. Verifique a permissão do navegador.')),
      );
    });
  }

  private async run(findOrigin: () => Promise<Coordinates>): Promise<void> {
    this.loading.set(true);
    this.message.set(null);

    let origin: Coordinates;
    try {
      origin = await findOrigin();
    } catch (error) {
      this.message.set(error instanceof UserError ? error.message : 'Não foi possível encontrar a localização.');
      this.loading.set(false);
      return;
    }

    try {
      const places = await firstValueFrom(this.hamburguerias.searchNear(origin));
      await this.maps.show(this.mapContainer().nativeElement, origin, places);
      if (places.length === 0) {
        this.message.set('Nenhuma hamburgueria encontrada por aqui.');
      }
    } catch (error) {
      this.message.set(
        error instanceof UserError
          ? error.message
          : 'Não foi possível buscar as hamburguerias. Tente novamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
