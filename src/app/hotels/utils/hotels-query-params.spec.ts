import { convertToParamMap } from '@angular/router';

import { DEFAULT_FILTERS } from '../models/hotel-filters.model';
import { fromQueryParams, toQueryParams } from './hotels-query-params';

describe('toQueryParams', () => {
  it('should omit every parameter for the default state', () => {
    expect(toQueryParams({ filters: DEFAULT_FILTERS, page: 1 })).toEqual({
      q: null,
      stars: null,
      rate: null,
      price: null,
      page: null,
    });
  });

  it('should serialize the non-default values', () => {
    const params = toQueryParams({
      filters: { name: ' sol ', stars: [3, 5], minRate: 3.5, maxPrice: 400 },
      page: 2,
    });

    expect(params).toEqual({ q: 'sol', stars: '3,5', rate: '3.5', price: '400', page: '2' });
  });
});

describe('fromQueryParams', () => {
  it('should return the default state without parameters', () => {
    expect(fromQueryParams(convertToParamMap({}))).toEqual({ filters: DEFAULT_FILTERS, page: 1 });
  });

  it('should read a valid state', () => {
    const params = convertToParamMap({
      q: 'sol',
      stars: '5,3',
      rate: '3.5',
      price: '400',
      page: '2',
    });

    expect(fromQueryParams(params)).toEqual({
      filters: { name: 'sol', stars: [3, 5], minRate: 3.5, maxPrice: 400 },
      page: 2,
    });
  });

  it('should discard invalid, duplicated or out-of-range values', () => {
    const params = convertToParamMap({
      stars: '9,abc,2,2,',
      rate: 'abc',
      price: '5000',
      page: '-3',
    });

    expect(fromQueryParams(params)).toEqual({
      filters: { ...DEFAULT_FILTERS, stars: [2], maxPrice: 1000 },
      page: 1,
    });
  });

  it('should clamp values below the minimum and ignore non-integer pages', () => {
    const params = convertToParamMap({ rate: '-1', price: '10', page: '1.5' });

    expect(fromQueryParams(params)).toEqual({
      filters: { ...DEFAULT_FILTERS, minRate: 0, maxPrice: 50 },
      page: 1,
    });
  });

  it('should round-trip with toQueryParams', () => {
    const state = {
      filters: { name: 'luna', stars: [1, 4], minRate: 4.2, maxPrice: 250 },
      page: 3,
    };
    const serialized = toQueryParams(state);

    expect(fromQueryParams({ get: (name) => serialized[name as keyof typeof serialized] })).toEqual(
      state,
    );
  });
});
