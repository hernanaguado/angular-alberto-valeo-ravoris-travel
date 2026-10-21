import { Hotel } from '../models/hotel.model';
import { DEFAULT_FILTERS, HotelFilters } from '../models/hotel-filters.model';

/** Minúsculas y sin tildes, para que "hotél" encuentre "Hotel" */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function filterHotels(hotels: readonly Hotel[], filters: HotelFilters): Hotel[] {
  const name = normalizeText(filters.name.trim());

  return hotels.filter(
    (hotel) =>
      normalizeText(hotel.name).includes(name) &&
      (filters.stars.length === 0 || filters.stars.includes(hotel.stars)) &&
      hotel.rate >= filters.minRate &&
      hotel.price <= filters.maxPrice,
  );
}

export function hasActiveFilters(filters: HotelFilters): boolean {
  return (
    filters.name.trim() !== DEFAULT_FILTERS.name ||
    filters.stars.length > 0 ||
    filters.minRate !== DEFAULT_FILTERS.minRate ||
    filters.maxPrice !== DEFAULT_FILTERS.maxPrice
  );
}
