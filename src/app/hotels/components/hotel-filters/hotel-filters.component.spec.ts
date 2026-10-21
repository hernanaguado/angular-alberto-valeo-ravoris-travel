import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideSpanishLocale } from '../../../core/provide-spanish-locale';
import { DEFAULT_FILTERS, HotelFilters } from '../../models/hotel-filters.model';
import { HotelFiltersComponent } from './hotel-filters.component';

describe('HotelFiltersComponent', () => {
  let fixture: ComponentFixture<HotelFiltersComponent>;
  let element: HTMLElement;
  let emitted: Partial<HotelFilters>[];

  const byTestId = <T extends HTMLElement = HTMLInputElement>(testId: string) =>
    element.querySelector<T>(`[data-testid="${testId}"]`)!;
  const starCheckboxes = () =>
    Array.from(element.querySelectorAll<HTMLInputElement>('[data-testid="star"]'));

  // El formato español separa el símbolo € con un espacio no separable
  const squash = (value: string | null | undefined) => value?.replace(/\s+/g, ' ').trim();

  function type(el: HTMLInputElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input'));
  }

  async function setup(filters: HotelFilters = DEFAULT_FILTERS): Promise<void> {
    fixture.componentRef.setInput('filters', filters);
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotelFiltersComponent],
      providers: [provideZonelessChangeDetection(), provideSpanishLocale()],
    });
    fixture = TestBed.createComponent(HotelFiltersComponent);
    element = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.filtersChange.subscribe((change) => emitted.push(change));
  });

  describe('rendering', () => {
    it('should reflect the current filters', async () => {
      await setup({ name: 'sol', stars: [2, 4], minRate: 3.5, maxPrice: 400 });

      expect(byTestId('name').value).toBe('sol');
      expect(starCheckboxes().map((c) => c.checked)).toEqual([false, true, false, true, false]);
      expect(byTestId('rate').value).toBe('3.5');
      expect(byTestId('price').value).toBe('400');
    });

    it('should show the range values formatted in Spanish', async () => {
      await setup({ ...DEFAULT_FILTERS, minRate: 3.5, maxPrice: 400 });

      expect(squash(byTestId('rate-value').textContent)).toBe('3,5');
      expect(squash(byTestId('price-value').textContent)).toBe('400 €');
    });

    it('should describe the range values to assistive technology', async () => {
      await setup({ ...DEFAULT_FILTERS, minRate: 3.5, maxPrice: 400 });

      expect(byTestId('rate').getAttribute('aria-valuetext')).toBe('3,5 de 5 o más');
      expect(squash(byTestId('price').getAttribute('aria-valuetext'))).toBe('400 € como máximo');
    });

    it('should start with the price at its maximum so no hotel is hidden', async () => {
      await setup();

      expect(byTestId('price').value).toBe('1000');
      expect(byTestId('rate').value).toBe('0');
    });

    it('should update the checkboxes when the filters change', async () => {
      await setup({ ...DEFAULT_FILTERS, stars: [1] });

      await setup(DEFAULT_FILTERS);

      expect(starCheckboxes().some((c) => c.checked)).toBeFalse();
    });
  });

  describe('changes', () => {
    it('should emit the name when typing', async () => {
      await setup();

      type(byTestId('name'), 'luna');

      expect(emitted).toEqual([{ name: 'luna' }]);
    });

    it('should add stars in order and remove them', async () => {
      await setup({ ...DEFAULT_FILTERS, stars: [3] });

      starCheckboxes()[0].click();
      starCheckboxes()[2].click();

      expect(emitted).toEqual([{ stars: [1, 3] }, { stars: [] }]);
    });

    it('should emit numeric values from the ranges', async () => {
      await setup();

      type(byTestId('rate'), '3.7');
      type(byTestId('price'), '250');

      expect(emitted).toEqual([{ minRate: 3.7 }, { maxPrice: 250 }]);
    });
  });

  describe('reset', () => {
    it('should be disabled with the default filters', async () => {
      await setup();

      expect(byTestId<HTMLButtonElement>('reset').disabled).toBeTrue();
    });

    it('should emit filtersReset when there are active filters', async () => {
      await setup({ ...DEFAULT_FILTERS, name: 'sol' });
      let resetEmitted = false;
      fixture.componentInstance.filtersReset.subscribe(() => (resetEmitted = true));

      byTestId<HTMLButtonElement>('reset').click();

      expect(resetEmitted).toBeTrue();
    });
  });

  describe('mobile panel', () => {
    it('should start collapsed and toggle its visibility', async () => {
      await setup();
      const toggle = byTestId<HTMLButtonElement>('toggle');
      const panel = byTestId<HTMLFormElement>('panel');

      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(panel.classList).toContain('hidden');

      toggle.click();
      await fixture.whenStable();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(panel.classList).not.toContain('hidden');
    });
  });
});
