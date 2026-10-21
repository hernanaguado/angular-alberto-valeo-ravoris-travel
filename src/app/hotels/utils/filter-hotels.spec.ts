import { Hotel } from '../models/hotel.model';
import { DEFAULT_FILTERS } from '../models/hotel-filters.model';
import { createHotel } from '../testing/hotel.factory';
import { filterHotels, hasActiveFilters, normalizeText } from './filter-hotels';

const ids = (hotels: Hotel[]) => hotels.map((hotel) => hotel.id);

describe('filterHotels', () => {
  it('should return all hotels with default filters', () => {
    const hotels = [createHotel({ id: '1' }), createHotel({ id: '2' })];

    expect(filterHotels(hotels, DEFAULT_FILTERS)).toEqual(hotels);
  });

  it('should return an empty list when no hotel matches', () => {
    const hotels = [createHotel({ name: 'Hotel Sol' })];

    expect(filterHotels(hotels, { ...DEFAULT_FILTERS, name: 'luna' })).toEqual([]);
  });

  describe('name', () => {
    const hotels = [
      createHotel({ id: '1', name: 'Hotel Gran Sol' }),
      createHotel({ id: '2', name: 'Hotel Luna' }),
      createHotel({ id: '3', name: 'Hotel Ávila' }),
    ];

    it('should match text contained anywhere in the name', () => {
      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, name: 'ran' });

      expect(ids(result)).toEqual(['1']);
    });

    it('should be case insensitive', () => {
      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, name: 'LUNA' });

      expect(ids(result)).toEqual(['2']);
    });

    it('should ignore accents in both the search and the name', () => {
      expect(ids(filterHotels(hotels, { ...DEFAULT_FILTERS, name: 'avila' }))).toEqual(['3']);
      expect(ids(filterHotels(hotels, { ...DEFAULT_FILTERS, name: 'lúna' }))).toEqual(['2']);
    });

    it('should ignore surrounding whitespace', () => {
      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, name: '  luna ' });

      expect(ids(result)).toEqual(['2']);
    });

    it('should return every hotel for a blank search', () => {
      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, name: '   ' });

      expect(result.length).toBe(3);
    });
  });

  describe('stars', () => {
    const hotels = [
      createHotel({ id: '1', stars: 1 }),
      createHotel({ id: '2', stars: 3 }),
      createHotel({ id: '3', stars: 5 }),
    ];

    it('should return only hotels with the selected categories', () => {
      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, stars: [3, 5] });

      expect(ids(result)).toEqual(['2', '3']);
    });

    it('should return every category when none is selected', () => {
      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, stars: [] });

      expect(ids(result)).toEqual(['1', '2', '3']);
    });
  });

  describe('minRate', () => {
    it('should include hotels with rate equal or greater', () => {
      const hotels = [
        createHotel({ id: '1', rate: 3.6 }),
        createHotel({ id: '2', rate: 3.7 }),
        createHotel({ id: '3', rate: 4.5 }),
      ];

      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, minRate: 3.7 });

      expect(ids(result)).toEqual(['2', '3']);
    });

    it('should include hotels rated 0 with the minimum value', () => {
      const hotels = [createHotel({ id: '1', rate: 0 })];

      expect(ids(filterHotels(hotels, { ...DEFAULT_FILTERS, minRate: 0 }))).toEqual(['1']);
    });
  });

  describe('maxPrice', () => {
    it('should include hotels with price equal or lower', () => {
      const hotels = [
        createHotel({ id: '1', price: 199.99 }),
        createHotel({ id: '2', price: 200 }),
        createHotel({ id: '3', price: 200.01 }),
      ];

      const result = filterHotels(hotels, { ...DEFAULT_FILTERS, maxPrice: 200 });

      expect(ids(result)).toEqual(['1', '2']);
    });
  });

  it('should combine all filters', () => {
    const hotels = [
      createHotel({ id: '1', name: 'Hotel Sol', stars: 4, rate: 4, price: 150 }),
      createHotel({ id: '2', name: 'Hotel Sol', stars: 2, rate: 4, price: 150 }),
      createHotel({ id: '3', name: 'Hotel Sol', stars: 4, rate: 2, price: 150 }),
      createHotel({ id: '4', name: 'Hotel Sol', stars: 4, rate: 4, price: 900 }),
      createHotel({ id: '5', name: 'Hotel Mar', stars: 4, rate: 4, price: 150 }),
    ];

    const result = filterHotels(hotels, { name: 'sol', stars: [4], minRate: 3, maxPrice: 500 });

    expect(ids(result)).toEqual(['1']);
  });
});

describe('normalizeText', () => {
  it('should lowercase and remove diacritics', () => {
    expect(normalizeText('Hotél ÁVILA Ñandú')).toBe('hotel avila nandu');
  });
});

describe('hasActiveFilters', () => {
  it('should be false for the default filters', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBeFalse();
  });

  it('should ignore a blank name', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, name: '  ' })).toBeFalse();
  });

  it('should be true when any filter differs from its default', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, name: 'sol' })).toBeTrue();
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, stars: [2] })).toBeTrue();
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, minRate: 0.1 })).toBeTrue();
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, maxPrice: 990 })).toBeTrue();
  });
});
