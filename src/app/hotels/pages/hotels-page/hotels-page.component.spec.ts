import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { provideSpanishLocale } from '../../../core/provide-spanish-locale';
import { Hotel } from '../../models/hotel.model';
import { HotelsService } from '../../services/hotels.service';
import { PAGE_SIZE } from '../../state/hotels.store';
import { createHotels } from '../../testing/hotel.factory';
import { HotelsPageComponent } from './hotels-page.component';

// GIF transparente de 1×1: evita peticiones de red en los tests
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const hotels = (count: number) =>
  createHotels(count, (i) => ({ image: PIXEL, stars: (i % 5) + 1 }));

describe('HotelsPageComponent', () => {
  let element: HTMLElement;
  let whenStable: () => Promise<unknown>;

  const query = <T extends HTMLElement = HTMLElement>(selector: string) =>
    element.querySelector<T>(selector);
  const byTestId = <T extends HTMLElement = HTMLElement>(testId: string) =>
    query<T>(`[data-testid="${testId}"]`);
  const cards = () => element.querySelectorAll('app-hotel-card');
  const resultsCount = () => byTestId('results-count')?.textContent?.replace(/\s+/g, ' ').trim();

  function configure(getHotels: () => Observable<Hotel[]>): void {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideSpanishLocale(),
        provideRouter([{ path: '', component: HotelsPageComponent }]),
        { provide: HotelsService, useValue: { getHotels } },
      ],
    });
  }

  /** Crea la página y la pinta sin esperar a que termine la carga */
  function render(getHotels: () => Observable<Hotel[]>): void {
    configure(getHotels);
    const fixture: ComponentFixture<HotelsPageComponent> =
      TestBed.createComponent(HotelsPageComponent);
    element = fixture.nativeElement;
    whenStable = () => fixture.whenStable();
    fixture.detectChanges();
  }

  async function setup(getHotels: () => Observable<Hotel[]>): Promise<void> {
    render(getHotels);
    await whenStable();
  }

  /** Arranca la página a través del router para probar la sincronización con la URL */
  async function setupWithUrl(url: string, count = 30): Promise<Router> {
    configure(() => of(hotels(count)));
    const harness = await RouterTestingHarness.create(url);
    element = harness.routeNativeElement!;
    whenStable = () => harness.fixture.whenStable();
    await whenStable();
    return TestBed.inject(Router);
  }

  async function typeName(value: string): Promise<void> {
    const input = query<HTMLInputElement>('app-hotel-filters [data-testid="name"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await whenStable();
  }

  describe('states', () => {
    it('should show a skeleton and announce the loading until the hotels arrive', async () => {
      const response = new Subject<Hotel[]>();
      render(() => response);

      expect(byTestId('loading')).not.toBeNull();
      expect(resultsCount()).toBe('Cargando hoteles…');

      response.next(hotels(3));
      response.complete();
      await whenStable();

      expect(byTestId('loading')).toBeNull();
      expect(cards().length).toBe(3);
    });

    it('should show an empty message when there are no hotels', async () => {
      await setup(() => of([]));

      expect(byTestId('empty')).not.toBeNull();
      expect(byTestId('empty-reset')).toBeNull();
      expect(resultsCount()).toBe('0 hoteles encontrados');
      expect(cards().length).toBe(0);
    });

    it('should show an error and retry loading', async () => {
      const getHotels = jasmine.createSpy('getHotels').and.returnValues(
        throwError(() => new Error('boom')),
        of(hotels(2)),
      );
      await setup(getHotels);

      expect(byTestId('error')?.getAttribute('role')).toBe('alert');

      byTestId<HTMLButtonElement>('retry')!.click();
      await whenStable();

      expect(byTestId('error')).toBeNull();
      expect(cards().length).toBe(2);
    });
  });

  describe('results', () => {
    it('should render one card per hotel of the current page inside a list', async () => {
      await setup(() => of(hotels(20)));

      expect(element.querySelectorAll('ul[role="list"] > li > app-hotel-card').length).toBe(
        PAGE_SIZE,
      );
      expect(resultsCount()).toBe('20 hoteles encontrados · mostrando 1–12');
    });

    it('should use the singular when a single hotel is found', async () => {
      await setup(() => of(hotels(1)));

      expect(resultsCount()).toBe('1 hotel encontrado');
    });

    it('should load only the first row of images with priority', async () => {
      await setup(() => of(hotels(PAGE_SIZE)));

      const eager = element.querySelectorAll('img[loading="eager"]');
      expect(eager.length).toBe(3);
    });
  });

  describe('pagination', () => {
    it('should navigate to the last, incomplete page', async () => {
      await setup(() => of(hotels(20)));

      byTestId<HTMLButtonElement>('next')!.click();
      await whenStable();

      expect(cards().length).toBe(20 - PAGE_SIZE);
      expect(resultsCount()).toBe('20 hoteles encontrados · mostrando 13–20');
    });

    it('should move the focus to the results heading after changing page', async () => {
      await setup(() => of(hotels(20)));

      byTestId<HTMLButtonElement>('next')!.click();
      await whenStable();

      expect(document.activeElement).toBe(byTestId('results-heading'));
    });
  });

  describe('filters', () => {
    it('should filter the hotels from the filters panel and go back to page 1', async () => {
      await setup(() => of(hotels(20)));
      byTestId<HTMLButtonElement>('next')!.click();
      await whenStable();

      await typeName('Hotel 1');

      // "Hotel 1" y "Hotel 10".."Hotel 19"
      expect(resultsCount()).toBe('11 hoteles encontrados');
      expect(cards().length).toBe(11);
    });

    it('should reset the filters from the panel', async () => {
      await setup(() => of(hotels(20)));
      await typeName('Hotel 1');

      byTestId<HTMLButtonElement>('reset')!.click();
      await whenStable();

      expect(resultsCount()).toBe('20 hoteles encontrados · mostrando 1–12');
    });

    it('should offer to clear the filters when nothing matches', async () => {
      await setup(() => of(hotels(20)));
      await typeName('inexistente');

      byTestId<HTMLButtonElement>('empty-reset')!.click();
      await whenStable();

      expect(cards().length).toBe(PAGE_SIZE);
    });
  });

  describe('URL', () => {
    it('should restore the filters and the page from the query params', async () => {
      await setupWithUrl('/?stars=1,2,3&page=2');

      // 18 hoteles de 1 a 3 estrellas → la página 2 tiene 6
      expect(resultsCount()).toBe('18 hoteles encontrados · mostrando 13–18');
      const checked = Array.from(
        element.querySelectorAll<HTMLInputElement>('[data-testid="star"]'),
      ).map((checkbox) => checkbox.checked);
      expect(checked).toEqual([true, true, true, false, false]);
      expect(query('[aria-current="page"]')?.textContent?.trim()).toBe('2');
    });

    it('should reflect the filters and the page in the URL', async () => {
      const router = await setupWithUrl('/');

      byTestId<HTMLButtonElement>('next')!.click();
      await whenStable();
      expect(router.url).toBe('/?page=2');

      await typeName('Hotel 1');
      expect(router.url).toBe('/?q=Hotel%201');
    });

    it('should fall back to the last page when the restored one does not exist', async () => {
      await setupWithUrl('/?page=99');

      expect(query('[aria-current="page"]')?.textContent?.trim()).toBe('3');
    });
  });
});
