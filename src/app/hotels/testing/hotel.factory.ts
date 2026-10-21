import { Hotel } from '../models/hotel.model';

export function createHotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    id: '1',
    name: 'Hotel Test',
    image: 'https://example.com/hotel.png',
    address: 'Calle Mayor 1',
    stars: 3,
    rate: 3,
    price: 100,
    ...overrides,
  };
}

/** Hoteles "Hotel 1".."Hotel N" con id correlativo */
export function createHotels(
  count: number,
  overrides: (index: number) => Partial<Hotel> = () => ({}),
): Hotel[] {
  return Array.from({ length: count }, (_, i) =>
    createHotel({ id: String(i + 1), name: `Hotel ${i + 1}`, ...overrides(i) }),
  );
}
