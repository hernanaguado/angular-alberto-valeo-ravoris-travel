import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID, Provider } from '@angular/core';

/** Formatea números, precios y fechas en español. Se reutiliza en los tests. */
export function provideSpanishLocale(): Provider {
  registerLocaleData(localeEs);
  return { provide: LOCALE_ID, useValue: 'es' };
}
