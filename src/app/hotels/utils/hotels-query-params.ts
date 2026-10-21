import {
  DEFAULT_FILTERS,
  HotelFilters,
  PRICE_RANGE,
  RATE_RANGE,
  STAR_OPTIONS,
} from '../models/hotel-filters.model';

/** Estado de la pantalla que se refleja en la URL */
export interface HotelsViewState {
  readonly filters: HotelFilters;
  readonly page: number;
}

/** Solo necesita leer parámetros: compatible con `ParamMap` y fácil de simular */
export interface QueryParamReader {
  get(name: string): string | null;
}

/** Parámetros de la URL; `null` elimina el parámetro (valor por defecto) */
export type HotelsQueryParams = Record<'q' | 'stars' | 'rate' | 'price' | 'page', string | null>;

export function toQueryParams({ filters, page }: HotelsViewState): HotelsQueryParams {
  const name = filters.name.trim();

  return {
    q: name || null,
    stars: filters.stars.length ? filters.stars.join(',') : null,
    rate: filters.minRate !== DEFAULT_FILTERS.minRate ? String(filters.minRate) : null,
    price: filters.maxPrice !== DEFAULT_FILTERS.maxPrice ? String(filters.maxPrice) : null,
    page: page > 1 ? String(page) : null,
  };
}

/** Lee el estado de la URL descartando valores inválidos o fuera de rango */
export function fromQueryParams(params: QueryParamReader): HotelsViewState {
  return {
    filters: {
      name: params.get('q') ?? DEFAULT_FILTERS.name,
      stars: parseStars(params.get('stars')),
      minRate: parseInRange(params.get('rate'), RATE_RANGE, DEFAULT_FILTERS.minRate),
      maxPrice: parseInRange(params.get('price'), PRICE_RANGE, DEFAULT_FILTERS.maxPrice),
    },
    page: parsePage(params.get('page')),
  };
}

function parseStars(value: string | null): number[] {
  const validStars = new Set<number>(STAR_OPTIONS);
  const stars = (value ?? '').split(',').map(Number);
  return [...new Set(stars)].filter((star) => validStars.has(star)).sort((a, b) => a - b);
}

function parseInRange(
  value: string | null,
  range: { readonly min: number; readonly max: number },
  fallback: number,
): number {
  const parsed = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, range.min), range.max) : fallback;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
