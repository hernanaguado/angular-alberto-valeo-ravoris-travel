import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { Hotel } from '../models/hotel.model';
import { DEFAULT_FILTERS } from '../models/hotel-filters.model';
import { HotelsService } from '../services/hotels.service';
import { createHotels } from '../testing/hotel.factory';
import { HotelsStore, PAGE_SIZE } from './hotels.store';

// 30 hoteles con categorías 1..5 repartidas: 6 de cada una → 3 páginas
const HOTELS = createHotels(30, (i) => ({ stars: (i % 5) + 1 }));

describe('HotelsStore', () => {
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  /** Crea el store sin esperar: mientras la carga está pendiente la app no se estabiliza */
  function createStore(getHotels: () => Observable<Hotel[]>): HotelsStore {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        HotelsStore,
        { provide: HotelsService, useValue: { getHotels } },
      ],
    });
    const store = TestBed.inject(HotelsStore);
    TestBed.tick(); // ejecuta el efecto del recurso, que se suscribe a getHotels()
    return store;
  }

  async function setup(getHotels: () => Observable<Hotel[]>): Promise<HotelsStore> {
    const store = createStore(getHotels);
    await settle();
    return store;
  }

  describe('loading', () => {
    it('should be loading until the hotels arrive', async () => {
      const response = new Subject<Hotel[]>();
      const store = createStore(() => response);

      expect(store.isLoading()).toBeTrue();
      expect(store.pagedHotels()).toEqual([]);

      response.next(HOTELS);
      response.complete();
      await settle();

      expect(store.isLoading()).toBeFalse();
      expect(store.filteredHotels().length).toBe(30);
    });

    it('should expose the first page', async () => {
      const store = await setup(() => of(HOTELS));

      expect(store.page()).toBe(1);
      expect(store.pagedHotels()).toEqual(HOTELS.slice(0, PAGE_SIZE));
      expect(store.totalPages()).toBe(3);
      expect(store.visibleRange()).toEqual({ from: 1, to: PAGE_SIZE });
    });

    it('should expose the error and an empty list when loading fails', async () => {
      const store = await setup(() => throwError(() => new Error('boom')));

      expect(store.error()).toBeTruthy();
      expect(store.pagedHotels()).toEqual([]);
    });

    it('should load the hotels again on reload', async () => {
      const getHotels = jasmine.createSpy('getHotels').and.returnValues(
        throwError(() => new Error('boom')),
        of(HOTELS),
      );
      const store = await setup(getHotels);

      store.reload();
      await settle();

      expect(getHotels).toHaveBeenCalledTimes(2);
      expect(store.error()).toBeUndefined();
      expect(store.filteredHotels().length).toBe(30);
    });
  });

  describe('filters', () => {
    it('should filter hotels and go back to page 1', async () => {
      const store = await setup(() => of(HOTELS));
      store.goToPage(2);

      store.updateFilters({ stars: [5] });

      expect(store.filters()).toEqual({ ...DEFAULT_FILTERS, stars: [5] });
      expect(store.filteredHotels().length).toBe(6);
      expect(store.filteredHotels().every((hotel) => hotel.stars === 5)).toBeTrue();
      expect(store.page()).toBe(1);
    });

    it('should reset filters and go back to page 1', async () => {
      const store = await setup(() => of(HOTELS));
      store.updateFilters({ name: 'Hotel' });
      store.goToPage(3);

      store.resetFilters();

      expect(store.filters()).toEqual(DEFAULT_FILTERS);
      expect(store.filteredHotels().length).toBe(30);
      expect(store.page()).toBe(1);
    });

    it('should go back to page 1 on reset even if the filters were already the default', async () => {
      const store = await setup(() => of(HOTELS));
      store.goToPage(3);

      store.resetFilters();

      expect(store.page()).toBe(1);
    });

    it('should tell whether any filter is active', async () => {
      const store = await setup(() => of(HOTELS));
      expect(store.hasActiveFilters()).toBeFalse();

      store.updateFilters({ minRate: 2 });

      expect(store.hasActiveFilters()).toBeTrue();
    });
  });

  describe('pagination', () => {
    it('should expose an incomplete last page', async () => {
      const store = await setup(() => of(HOTELS));

      store.goToPage(3);

      expect(store.pagedHotels()).toEqual(HOTELS.slice(2 * PAGE_SIZE));
      expect(store.visibleRange()).toEqual({ from: 25, to: 30 });
    });

    it('should keep the page within bounds', async () => {
      const store = await setup(() => of(HOTELS));

      store.goToPage(99);
      expect(store.page()).toBe(3);

      store.goToPage(0);
      expect(store.page()).toBe(1);
    });
  });

  describe('restore', () => {
    it('should restore filters and page before the hotels are loaded', async () => {
      const response = new Subject<Hotel[]>();
      const store = createStore(() => response);

      store.restore({ filters: { ...DEFAULT_FILTERS, stars: [1, 2, 3] }, page: 2 });
      response.next(HOTELS);
      response.complete();
      await settle();

      // 18 hoteles de 1 a 3 estrellas → la página 2 tiene los 6 últimos
      expect(store.filters().stars).toEqual([1, 2, 3]);
      expect(store.page()).toBe(2);
      expect(store.pagedHotels().length).toBe(18 - PAGE_SIZE);
    });

    it('should show the last page when the restored page no longer exists', async () => {
      const store = await setup(() => of(HOTELS));

      store.restore({ filters: DEFAULT_FILTERS, page: 50 });

      expect(store.page()).toBe(3);
    });
  });
});
