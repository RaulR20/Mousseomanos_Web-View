import { distanceInMeters, formatDistance } from './distance';

describe('distance', () => {
  it('is zero between identical points', () => {
    expect(distanceInMeters({ lat: -23.5, lng: -46.6 }, { lat: -23.5, lng: -46.6 })).toBe(0);
  });

  it('computes the straight-line distance between São Paulo and Rio de Janeiro (~360 km)', () => {
    const km = distanceInMeters({ lat: -23.5505, lng: -46.6333 }, { lat: -22.9068, lng: -43.1729 }) / 1000;
    expect(km).toBeGreaterThan(355);
    expect(km).toBeLessThan(362);
  });

  it('computes about 111 km per degree of latitude', () => {
    const km = distanceInMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) / 1000;
    expect(km).toBeCloseTo(111.2, 0);
  });

  it('formats short distances in meters, rounded to 10 m', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(854)).toBe('850 m');
  });

  it('formats long distances in kilometers with a decimal comma', () => {
    expect(formatDistance(996)).toBe('1,0 km');
    expect(formatDistance(1234)).toBe('1,2 km');
    expect(formatDistance(12345)).toBe('12,3 km');
  });
});
