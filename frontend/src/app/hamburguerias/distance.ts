import { Coordinates } from './hamburguerias.service';

const EARTH_RADIUS_METERS = 6_371_000;

/** Distância em linha reta entre dois pontos (fórmula de haversine). */
export function distanceInMeters(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/** "850 m" abaixo de 1 km (arredondado a 10 m); "1,2 km" a partir daí. */
export function formatDistance(meters: number): string {
  const rounded = Math.round(meters / 10) * 10;
  if (rounded < 1000) {
    return `${rounded} m`;
  }
  const kilometers = (meters / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${kilometers} km`;
}
