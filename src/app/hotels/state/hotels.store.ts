import { Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { DEFAULT_FILTERS, HotelFilters } from '../models/hotel-filters.model';
import { HotelsService } from '../services/hotels.service';
import { filterHotels, hasActiveFilters } from '../utils/filter-hotels';
import { HotelsViewState } from '../utils/hotels-query-params';
import { getTotalPages, paginate } from '../utils/paginate';

export const PAGE_SIZE = 12;

@Injectable()
export class HotelsStore {
  private readonly hotelsService = inject(HotelsService);

  private readonly hotelsResource = rxResource({
    stream: () => this.hotelsService.getHotels(),
    defaultValue: [],
  });

  private readonly _filters = signal<HotelFilters>(DEFAULT_FILTERS);
  // Cualquier cambio de filtros devuelve a la primera página
  private readonly _page = linkedSignal({ source: this._filters, computation: () => 1 });

  readonly filters = this._filters.asReadonly();
  readonly hasActiveFilters = computed(() => hasActiveFilters(this._filters()));

  readonly isLoading = this.hotelsResource.isLoading;
  readonly error = this.hotelsResource.error;

  // value() lanza una excepción si el recurso está en error
  private readonly hotels = computed(() =>
    this.hotelsResource.hasValue() ? this.hotelsResource.value() : [],
  );

  readonly filteredHotels = computed(() => filterHotels(this.hotels(), this._filters()));
  readonly totalPages = computed(() => getTotalPages(this.filteredHotels().length, PAGE_SIZE));
  // Una página restaurada desde la URL puede no existir: se muestra la última disponible
  readonly page = computed(() => Math.min(this._page(), this.totalPages()));
  readonly pagedHotels = computed(() => paginate(this.filteredHotels(), this.page(), PAGE_SIZE));

  /** Posición (1-based) del primer y último hotel visibles, para "Mostrando 13–24 de 40" */
  readonly visibleRange = computed(() => {
    const from = (this.page() - 1) * PAGE_SIZE + 1;
    return { from, to: from + this.pagedHotels().length - 1 };
  });

  updateFilters(filters: Partial<HotelFilters>): void {
    this._filters.update((current) => ({ ...current, ...filters }));
  }

  resetFilters(): void {
    // Copia: con la misma referencia el signal no notificaría y no se volvería a la página 1
    this._filters.set({ ...DEFAULT_FILTERS });
  }

  goToPage(page: number): void {
    this._page.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  /** Restaura un estado completo (p. ej. desde la URL) sin limitar la página: aún no hay datos */
  restore({ filters, page }: HotelsViewState): void {
    this._filters.set(filters);
    this._page.set(page);
  }

  reload(): void {
    this.hotelsResource.reload();
  }
}
