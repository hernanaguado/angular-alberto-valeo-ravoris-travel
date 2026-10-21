import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  HotelFilters,
  PRICE_RANGE,
  RATE_RANGE,
  STAR_OPTIONS,
} from '../../models/hotel-filters.model';
import { hasActiveFilters } from '../../utils/filter-hotels';

@Component({
  selector: 'app-hotel-filters',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './hotel-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelFiltersComponent {
  readonly filters = input.required<HotelFilters>();

  readonly filtersChange = output<Partial<HotelFilters>>();
  readonly filtersReset = output<void>();

  protected readonly starOptions = STAR_OPTIONS.map((value) => ({
    value,
    icons: '★'.repeat(value),
    label: value === 1 ? '1 estrella' : `${value} estrellas`,
  }));
  protected readonly rateRange = RATE_RANGE;
  protected readonly priceRange = PRICE_RANGE;

  protected readonly selectedStars = computed(() => new Set(this.filters().stars));
  protected readonly canReset = computed(() => hasActiveFilters(this.filters()));

  /** En móvil el panel empieza plegado para que los resultados queden a la vista */
  protected readonly expanded = signal(false);

  protected toggleExpanded(): void {
    this.expanded.update((expanded) => !expanded);
  }

  protected onNameChange(name: string): void {
    this.filtersChange.emit({ name });
  }

  protected onStarToggle(star: number, checked: boolean): void {
    const stars = checked
      ? [...this.filters().stars, star].sort((a, b) => a - b)
      : this.filters().stars.filter((s) => s !== star);
    this.filtersChange.emit({ stars });
  }

  protected onMinRateChange(minRate: number): void {
    this.filtersChange.emit({ minRate });
  }

  protected onMaxPriceChange(maxPrice: number): void {
    this.filtersChange.emit({ maxPrice });
  }
}
