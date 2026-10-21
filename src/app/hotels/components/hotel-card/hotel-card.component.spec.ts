import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideSpanishLocale } from '../../../core/provide-spanish-locale';
import { createHotel } from '../../testing/hotel.factory';
import { HotelCardComponent } from './hotel-card.component';

describe('HotelCardComponent', () => {
  const hotel = createHotel({
    id: '1',
    name: 'Hotel Sol',
    image: 'https://example.com/sol.png',
    address: 'Calle Mayor 1',
    stars: 3,
    rate: 4.25,
    price: 1120.5,
  });

  let fixture: ComponentFixture<HotelCardComponent>;
  let element: HTMLElement;

  const query = (testId: string) => element.querySelector(`[data-testid="${testId}"]`);
  const text = (testId: string) => query(testId)?.textContent?.replace(/\s+/g, ' ').trim();

  async function failImageLoad(): Promise<void> {
    element.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HotelCardComponent],
      providers: [provideZonelessChangeDetection(), provideSpanishLocale()],
    });
    fixture = TestBed.createComponent(HotelCardComponent);
    fixture.componentRef.setInput('hotel', hotel);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should render the hotel data', () => {
    expect(text('name')).toBe('Hotel Sol');
    expect(text('address')).toBe('Calle Mayor 1');
  });

  it('should format the rate and price in Spanish', () => {
    expect(text('rate')).toBe('Valoración 4,3');
    expect(text('price')).toBe('1.120,50 € / noche');
  });

  it('should render filled stars according to the category', () => {
    const stars = Array.from(query('stars')!.querySelectorAll('span'));

    expect(stars.length).toBe(5);
    expect(stars.filter((star) => !star.classList.contains('text-slate-300')).length).toBe(3);
  });

  it('should expose the category as a single accessible image', () => {
    const stars = query('stars')!;

    expect(stars.getAttribute('role')).toBe('img');
    expect(stars.getAttribute('aria-label')).toBe('3 de 5 estrellas');
    stars
      .querySelectorAll('span')
      .forEach((star) => expect(star.getAttribute('aria-hidden')).toBe('true'));
  });

  it('should render the hotel image with its name as alternative text', () => {
    const img = element.querySelector('img')!;

    expect(img.getAttribute('src')).toBe(hotel.image);
    expect(img.getAttribute('alt')).toBe('Hotel Sol');
  });

  it('should lazy load the image by default', () => {
    const img = element.querySelector('img')!;

    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.hasAttribute('fetchpriority')).toBeFalse();
  });

  it('should load the image eagerly with high priority when prioritized', async () => {
    fixture.componentRef.setInput('priority', true);
    await fixture.whenStable();

    const img = element.querySelector('img')!;
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('should use a stable fallback image when the original fails to load', async () => {
    await failImageLoad();

    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'https://picsum.photos/seed/1/480/360',
    );
  });

  it('should show a placeholder when the fallback image also fails', async () => {
    await failImageLoad();
    await failImageLoad();

    expect(element.querySelector('img')).toBeNull();
    expect(query('image-fallback')).not.toBeNull();
  });
});
