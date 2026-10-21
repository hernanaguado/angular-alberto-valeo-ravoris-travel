<p align="center">
  <img src="src/assets/logo.png" alt="Ávoristech" /><br />
</p>

# Listado de hoteles – Prueba técnica Angular

Aplicación Angular 20 que muestra un listado paginado de hoteles con filtros por nombre, categoría, valoración y precio. El enunciado original está en [ENUNCIADO.md](ENUNCIADO.md).

## Puesta en marcha

Requisitos: Node.js 20.19+ / 22.12+ / 24 y npm.

```bash
npm install
npm run generate-db   # (opcional) regenera db.json con 100 hoteles aleatorios
npm run start         # json-server (http://localhost:3000/hotels) + app (http://localhost:4200)
```

| Script                 | Descripción                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `npm run start`        | Levanta la API (`json-server`) y el servidor de desarrollo     |
| `npm test`             | Tests unitarios en modo watch (Karma + Jasmine)                |
| `npm run test:ci`      | Tests unitarios una sola vez en Chrome headless                |
| `npm run lint`         | ESLint con las reglas de `angular-eslint` (incluye a11y)       |
| `npm run format:check` | Comprueba el formato con Prettier (`npm run format` lo aplica) |
| `npm run build`        | Build de producción                                            |

## Funcionalidad

- **Nombre**: búsqueda tipo _contains_ sin distinguir mayúsculas ni tildes ("avila" encuentra "Ávila"); se ignoran los espacios al principio y al final.
- **Categoría**: checkboxes de 1 a 5 estrellas combinables; sin ninguna marcada se muestran todas.
- **Valoración**: `input[type=range]` de 0 a 5 con paso 0,1; muestra hoteles con valoración **≥** al valor.
- **Precio**: `input[type=range]` de 50 a 1000 € (valor inicial 1000 € para no ocultar nada); muestra hoteles con precio **≤** al valor.
- **Paginación**: 12 hoteles por página. Al cambiar un filtro se vuelve a la página 1; si la página pedida no existe se muestra la última.
- **URL compartible**: filtros y página se reflejan en la URL (`/?q=sol&stars=4,5&rate=3.5&price=400&page=2`), así que se puede recargar o compartir sin perder el estado. Los valores inválidos de la URL se descartan.
- **Estados**: carga (_skeleton_), error con reintento y sin resultados (con botón para limpiar filtros). Contador "N hoteles encontrados · mostrando 13–24".
- **Diseño responsive** con Tailwind CSS; en móvil el panel de filtros se puede plegar.

## Estructura

```
src/app/
├── app.config.ts / app.routes.ts      # providers globales y ruta lazy
├── core/provide-spanish-locale.ts     # locale 'es' (reutilizado en los tests)
└── hotels/
    ├── models/                        # Hotel, HotelFilters, valores por defecto, rangos y pasos
    ├── services/hotels.service.ts     # acceso a la API (solo HTTP) + token HOTELS_API_URL
    ├── utils/                         # funciones puras: filtros, paginación, (de)serialización de la URL
    ├── state/hotels.store.ts          # estado de la pantalla con signals
    ├── pages/hotels-page/             # contenedor: conecta store, URL y componentes
    ├── components/                    # componentes de presentación
    │   ├── hotel-card/
    │   ├── hotel-filters/
    │   └── pagination/
    └── testing/hotel.factory.ts       # factorías de datos para los tests
```

## Decisiones técnicas

- **Angular moderno**: componentes standalone, `input()` / `input.required()` / `output()`, `viewChild()`, control flow (`@if`, `@for`, `@let`), `inject()`, `host` en lugar de decoradores, `ChangeDetectionStrategy.OnPush` en todos los componentes y aplicación **zoneless** (`provideZonelessChangeDetection`; `zone.js` no está instalado).
- **Estado con signals** (`HotelsStore`): la carga se hace con `rxResource` (expone `isLoading`, `error`, `reload`) y los datos derivados (`filteredHotels`, `totalPages`, `page`, `pagedHotels`) son `computed`. La página es un `linkedSignal` de los filtros: cualquier cambio de filtros la devuelve a 1 sin código imperativo. Los signals escribibles son privados y se exponen con `asReadonly()`.
- **Store a nivel de página** (`providers: [HotelsStore]`): su ciclo de vida va ligado a la ruta.
- **Contenedor / presentación**: solo la página conoce el store y el router. `HotelCard`, `HotelFilters` y `Pagination` reciben datos por inputs y comunican intenciones por outputs.
- **Sincronización con la URL**: la página restaura el estado desde los _query params_ al crearse y lo escribe con un `effect` (`replaceUrl`, para no llenar el historial). Es el único `effect` de la aplicación porque sincroniza con un sistema externo; la lógica de (de)serialización está en funciones puras testeadas.
- **Filtros como componente controlado**: los controles reflejan `store.filters()` y emiten cambios parciales. No se usan Reactive Forms porque no hay validación ni envío y duplicarían el estado.
- **Filtrado y paginación en cliente**: con 100 hoteles es instantáneo. Con un volumen grande se delegaría en el servidor (`json-server` ya admite `name_like`, `rate_gte`, `price_lte`, `_page` y `_limit`), con los filtros como `params` del recurso y _debounce_ en la búsqueda por nombre.
- **Configuración**: la URL de la API se inyecta con el token `HOTELS_API_URL`, sobrescribible por entorno o en los tests.
- **Imágenes**: se usa la imagen de `db.json`; si falla, una foto estable de picsum (seed = id del hotel) y, como último recurso, un placeholder. La primera fila carga con prioridad (`eager` + `fetchpriority`) y el resto en `lazy`; `width`/`height` y `aspect-ratio` evitan saltos de maquetación.
- **Accesibilidad**: labels asociados, categorías en `fieldset`/`legend`, ranges con `aria-valuetext` ("3,5 de 5 o más", "400 € como máximo"), contador en región `role="status"`, error con `role="alert"`, paginación en `<nav>` con `aria-current`, foco y scroll al inicio de los resultados al cambiar de página, categoría de cada hotel anunciada como "3 de 5 estrellas" y foco visible en todos los controles.
- **Formato español** (`LOCALE_ID = 'es'`) para precios y valoraciones.
- **Calidad**: ESLint (`angular-eslint`, con reglas de accesibilidad, OnPush obligatorio y sin `$any`) y Prettier.

## Tests

Karma + Jasmine (`npm run test:ci`), zoneless y sin `fakeAsync`. Cubren:

- **Utilidades**: todos los filtros con sus casos límite (≥ / ≤ exactos, decimales, mayúsculas, tildes, espacios, cadena vacía) y su combinación; paginación; (de)serialización de la URL con valores inválidos y fuera de rango.
- **Servicio**: petición GET a la URL configurada y propagación de errores con `HttpTestingController`.
- **Store**: estado de carga, error y reintento; filtrado y reset con vuelta a la página 1; última página incompleta; límites de página y restauración de un estado.
- **Componentes**: renderizado con formato español, accesibilidad (etiquetas, `aria-valuetext`, `aria-current`), interacción real con el DOM y emisión de outputs.
- **Integración en la página**: skeleton de carga, error y reintento, filtrar y limpiar desde el panel, paginar con gestión del foco y sincronización con la URL (`RouterTestingHarness`).
