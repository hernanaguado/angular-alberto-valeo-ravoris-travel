import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let element: HTMLElement;
  let emitted: number[];

  const button = (testId: string) =>
    element.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)!;
  const pageButtons = () =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('[data-testid="page"]'));

  async function setup(currentPage: number, totalPages: number): Promise<void> {
    fixture.componentRef.setInput('currentPage', currentPage);
    fixture.componentRef.setInput('totalPages', totalPages);
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaginationComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(PaginationComponent);
    element = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));
  });

  it('should render one labelled button per page and mark only the current one', async () => {
    await setup(2, 4);

    expect(pageButtons().map((b) => b.textContent?.trim())).toEqual(['1', '2', '3', '4']);
    expect(pageButtons().map((b) => b.getAttribute('aria-label'))).toEqual([
      'Página 1',
      'Página 2',
      'Página 3',
      'Página 4',
    ]);
    expect(pageButtons().map((b) => b.getAttribute('aria-current'))).toEqual([
      null,
      'page',
      null,
      null,
    ]);
  });

  it('should render inside a labelled navigation landmark', async () => {
    await setup(1, 2);

    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Paginación');
  });

  it('should not render when there is only one page', async () => {
    await setup(1, 1);

    expect(element.querySelector('nav')).toBeNull();
  });

  it('should disable previous on the first page and next on the last page', async () => {
    await setup(1, 3);
    expect(button('prev').disabled).toBeTrue();
    expect(button('next').disabled).toBeFalse();

    await setup(3, 3);
    expect(button('prev').disabled).toBeFalse();
    expect(button('next').disabled).toBeTrue();
  });

  it('should emit the previous and next pages', async () => {
    await setup(2, 3);

    button('prev').click();
    button('next').click();

    expect(emitted).toEqual([1, 3]);
  });

  it('should emit the clicked page but not the current one', async () => {
    await setup(2, 3);

    pageButtons()[2].click();
    pageButtons()[1].click();

    expect(emitted).toEqual([3]);
  });
});
