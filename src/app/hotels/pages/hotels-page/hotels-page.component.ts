import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { HotelCardComponent } from '../../components/hotel-card/hotel-card.component';
import { HotelFiltersComponent } from '../../components/hotel-filters/hotel-filters.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { HotelsStore } from '../../state/hotels.store';
import { fromQueryParams, toQueryParams } from '../../utils/hotels-query-params';

/** Tarjetas de la primera fila en escritorio: su imagen se carga con prioridad */
const PRIORITY_IMAGES = 3;
const SKELETON_CARDS = 6;

@Component({
  selector: 'app-hotels-page',
  imports: [HotelCardComponent, HotelFiltersComponent, PaginationComponent],
  providers: [HotelsStore],
  templateUrl: './hotels-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsPageComponent {
  protected readonly store = inject(HotelsStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly resultsHeading = viewChild.required<ElementRef<HTMLElement>>('resultsHeading');

  protected readonly priorityImages = PRIORITY_IMAGES;
  protected readonly skeletonCards = Array.from({ length: SKELETON_CARDS }, (_, i) => i);

  constructor() {
    // La URL es la fuente inicial del estado: se puede compartir o recargar sin perder filtros
    this.store.restore(fromQueryParams(this.route.snapshot.queryParamMap));

    // Sincroniza el estado con la URL (sistema externo: aquí sí corresponde un effect).
    // Mientras carga se omite: la página aún no puede validarse contra los resultados.
    effect(() => {
      const queryParams = toQueryParams({ filters: this.store.filters(), page: this.store.page() });
      if (this.store.isLoading()) {
        return;
      }
      void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
    });
  }

  protected onPageChange(page: number): void {
    this.store.goToPage(page);
    // Lleva al usuario (y el foco del lector de pantalla) al inicio de los nuevos resultados
    const heading = this.resultsHeading().nativeElement;
    heading.scrollIntoView({ block: 'start' });
    heading.focus({ preventScroll: true });
  }
}
