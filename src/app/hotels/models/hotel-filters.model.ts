export const STAR_OPTIONS = [1, 2, 3, 4, 5] as const;
export const MAX_STARS = STAR_OPTIONS.length;

export const RATE_RANGE = { min: 0, max: 5, step: 0.1 } as const;
export const PRICE_RANGE = { min: 50, max: 1000, step: 10 } as const;

export interface HotelFilters {
  readonly name: string;
  readonly stars: readonly number[];
  readonly minRate: number;
  readonly maxPrice: number;
}

export const DEFAULT_FILTERS: HotelFilters = {
  name: '',
  stars: [],
  minRate: RATE_RANGE.min,
  maxPrice: PRICE_RANGE.max,
};
