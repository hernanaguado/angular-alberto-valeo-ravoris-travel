import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./hotels/pages/hotels-page/hotels-page.component').then((m) => m.HotelsPageComponent),
  },
  { path: '**', redirectTo: '' },
];
