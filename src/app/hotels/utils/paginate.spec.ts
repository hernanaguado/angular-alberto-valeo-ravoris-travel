import { getTotalPages, paginate } from './paginate';

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it('should return the first page', () => {
    expect(paginate(items, 1, 3)).toEqual([1, 2, 3]);
  });

  it('should return a middle page', () => {
    expect(paginate(items, 2, 3)).toEqual([4, 5, 6]);
  });

  it('should return a partial last page', () => {
    expect(paginate(items, 3, 3)).toEqual([7]);
  });

  it('should return an empty array for a page out of range', () => {
    expect(paginate(items, 4, 3)).toEqual([]);
  });
});

describe('getTotalPages', () => {
  it('should return exact pages when divisible', () => {
    expect(getTotalPages(6, 3)).toBe(2);
  });

  it('should round up', () => {
    expect(getTotalPages(7, 3)).toBe(3);
  });

  it('should return 1 when there are no items', () => {
    expect(getTotalPages(0, 3)).toBe(1);
  });
});
