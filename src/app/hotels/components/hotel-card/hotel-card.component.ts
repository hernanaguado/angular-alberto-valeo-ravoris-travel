import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { Hotel } from '../../models/hotel.model';
import { MAX_STARS } from '../../models/hotel-filters.model';

// Si la imagen del hotel no carga, se usa una foto estable por hotel (mismo id → misma foto)
const fallbackImageUrl = (seed: string) => `https://picsum.photos/seed/${seed}/480/360`;

@Component({
  selector: 'app-hotel-card',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './hotel-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class HotelCardComponent {
  readonly hotel = input.required<Hotel>();
  /** Carga la imagen inmediatamente (tarjetas visibles al cargar la página) */
  readonly priority = input(false);

  protected readonly maxStars = MAX_STARS;

  private readonly failedAttempts = signal(0);

  protected readonly imageSrc = computed(() => {
    switch (this.failedAttempts()) {
      case 0:
        return this.hotel().image;
      case 1:
        return fallbackImageUrl(this.hotel().id);
      default:
        return null;
    }
  });

  protected readonly stars = computed(() =>
    Array.from({ length: MAX_STARS }, (_, i) => i < this.hotel().stars),
  );

  protected onImageError(): void {
    this.failedAttempts.update((attempts) => attempts + 1);
  }
}
