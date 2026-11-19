# Prueba de automatización: SauceDemo y Restful Booker

Pruebas de extremo a extremo, de API y de carga sobre dos aplicaciones públicas de práctica.

- Interfaz: [SauceDemo](https://www.saucedemo.com), con Page Object Model, en Chromium y Firefox.
- API: [Restful Booker](https://restful-booker.herokuapp.com): crear, consultar, modificar y borrar una reserva con token.
- Carga: JMeter, 10 usuarios durante 1 minuto, con aserciones y el informe HTML en `jmeter/html-report/index.html`.
- CI: GitHub Actions ejecuta las pruebas de Playwright.

## Requisitos

- Node.js 20
- Para la carga: Java 17 o superior y JMeter 5.6. El script usa `JMETER_BIN` o `.tools/apache-jmeter/bin/jmeter.bat`

Las credenciales de las dos demos son públicas: SauceDemo `standard_user` / `secret_sauce`, y Restful Booker `admin` / `password123`.

## Cómo ejecutarlo

```bash
npm ci
npx playwright install chromium firefox
npm test
```

Eso lanza la tienda en Chromium y en Firefox, y después el CRUD de la API.

Solo la tienda:

```bash
npm run test:e2e
```

Un navegador:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
```

Solo la API:

```bash
npm run test:api
```

Si en esa máquina ya están Chrome y Firefox, y el CDN de Playwright no responde, se puede correr contra los navegadores del sistema:

```bash
set PW_USE_SYSTEM_BROWSERS=1
npx playwright test --project=chromium --project=firefox
```

En PowerShell la variable es `$env:PW_USE_SYSTEM_BROWSERS='1'`. En GitHub Actions no se define: el workflow descarga Chromium y Firefox.

El informe de Playwright queda en `playwright-report/`. Se abre con `npm run report`.

La carga, desde la raíz, en PowerShell:

```powershell
.\scripts\run-load-test.ps1
```

O con JMeter en el PATH:

```bash
jmeter -n -t jmeter/booker-load-test.jmx -l jmeter/results/results.jtl -e -o jmeter/html-report
```

`jmeter/html-report` no puede existir antes de generar el informe. El script la borra. El resultado se abre en `jmeter/html-report/index.html`.

El workflow `.github/workflows/playwright.yml` corre en cada push y en cada pull request: `npm ci`, Chromium, Firefox y `npx playwright test`. Sube el informe HTML como artefacto. No lanza JMeter.

## Qué comprueban las pruebas

SauceDemo, en cada navegador:

- `standard_user` llega al inventario.
- Una contraseña incorrecta se queda en el login y muestra que el usuario y la contraseña no coinciden.
- `locked_out_user` ve que la cuenta está bloqueada.
- Se añaden la mochila y la luz de bicicleta, el carrito muestra los dos nombres, el subtotal es `$39.98` y la compra termina en «Thank you for your order!». El carrito queda vacío.

Restful Booker, en serie y sobre la misma reserva:

- `POST /auth` responde 200 y devuelve un token.
- `POST /booking` responde 200, con `bookingid` y la reserva enviada.
- `GET /booking/{id}` responde 200 con esos datos.
- `PUT /booking/{id}` con la cookie `token=...` responde 200, y la consulta posterior ya trae el cambio.
- El mismo `PUT` sin token responde 403.
- `DELETE /booking/{id}` con token responde 201 y el cuerpo `Created`. La consulta siguiente responde 404.

Esos códigos no son los de un CRUD de manual. El alta es 200, no 201. El borrado es 201, no 204. Los fijé contra la API en vivo antes de escribir las aserciones.

JMeter:

1. Un hilo de preparación pide el token, crea una reserva llamada Load y exige 200.
2. Diez hilos, con una rampa de 10 segundos y un plan de 60 segundos, consultan esa reserva. Cada muestra exige HTTP 200 y `"firstname":"Load"`.
3. Al terminar, un hilo la borra con el token y exige 201.

## Decisiones

- Playwright cubre la interfaz y la API. JMeter solo la carga, porque el enunciado pide esa herramienta y su informe HTML.
- Los dos navegadores aplican a SauceDemo. Repetir el CRUD en cada navegador no aporta: no hay página que pintar.
- SauceDemo marca los controles con `data-test`. Playwright busca `data-testid` por defecto, así que el config usa `testIdAttribute: 'data-test'`. Los specs no llevan selectores sueltos. Hablan con `LoginPage`, `InventoryPage`, `CartPage` y `CheckoutPage`, inyectadas por fixtures.
- La API exige `Accept: application/json`. Sin esa cabecera Restful Booker contesta XML.
- La autenticación del enunciado es el token, así que el `PUT` y el `DELETE` mandan `Cookie: token=...`. No uso el Basic Auth, aunque la API también lo acepta.
- Las pruebas de API van en serie y comparten una reserva. `afterAll` la borra si el test de borrado no llegó a ejecutarse.
- Cada llamada a la API tiene un tope de 20 segundos y el proyecto reintenta dos veces. Heroku duerme el dyno y, desde esta red, una ruta IPv6 se queda colgada. El config pide IPv4 primero con `dns.setDefaultResultOrder('ipv4first')`.
- La carga no escribe en bucle. Diez usuarios durante un minuto haciendo `POST /booking` dejarían cientos de reservas en un servicio público. El plan crea una, la lee y la borra. El CRUD completo está en Playwright.
- Actions no lanza el minuto de JMeter. Alargaría cada push y castigaría el mismo servicio. El informe generado en local se deja en el repositorio.
- En CI, la tienda reintenta dos veces. En local, la tienda no reintenta, para ver el fallo a la primera.
- `PW_USE_SYSTEM_BROWSERS=1` usa el Chrome y el Firefox ya instalados. Hace falta porque desde aquí `cdn.playwright.dev` abre la conexión y no completa la descarga. En CI esa variable no existe.
- El repo es nuevo y público, separado de otros proyectos. El historial va por capas: herramienta, interfaz, API, carga, el ajuste de red, CI y este documento.

## Con más tiempo

- Ejecutar también WebKit y una vista móvil de SauceDemo.
- Más bordes de la API: fechas invertidas, cuerpo incompleto y un token inventado en el `DELETE`.
- Sacar Restful Booker del camino crítico de CI: un mock para el contrato y un workflow programado contra la API real. Un Heroku caído no debería poner roja la tienda.
- Fijar un JDK 17 junto a JMeter. Un Java muy nuevo puede romper el arranque de JMeter 5.6.
- Una segunda carga con rampa más larga y un límite de peticiones por segundo, y publicar el HTML en GitHub Pages.
- Guardar la traza de Playwright también cuando la prueba pasa, para repasarla en la entrevista.

## Cómo usé la IA

Pedí a Cursor que armara la prueba en menos de tres horas, en un repositorio nuevo de mi cuenta de GitHub, con commits según avanzaba y sin mezclarlo con otros proyectos.

Acepté esta forma: Page Object Model con fixtures, Playwright en TypeScript para la tienda y para la API, Chromium y Firefox solo en la tienda, JMeter para la carga, Actions solo para Playwright, y un README con las decisiones.

Corregí, al revisar lo que proponía y al ejecutarlo:

- El alta de una reserva responde 200 y el borrado 201. La primera idea del contrato usaba 201 y 204.
- El carrito vacío no se lee rompiendo el encapsulado de la página. Quedó como método de `CheckoutPage`.
- Los localizadores usan `data-test`, no `data-testid`.
- La carga no crea una reserva por iteración.
- El token de la demo no va en el código, en los commits ni aquí. Las pruebas lo piden en el momento.
- La red de esta máquina cuelga las descargas de `cdn.playwright.dev` y también colgó Restful Booker cuando Node elegía IPv6. Por eso el config fuerza IPv4, las peticiones tienen tope y la API reintenta. Edge del sistema abre el navegador y responde `ERR_NETWORK_ACCESS_DENIED`, así que no sirve como segundo navegador. El segundo navegador del repositorio sigue siendo Firefox.

## Resultado de la corrida local

- SauceDemo en Chrome: las 4 pruebas pasaron (login válido, contraseña incorrecta, usuario bloqueado y compra de dos productos).
- Restful Booker: las 5 pruebas pasaron, incluido el 403 sin token y el 404 después del borrado.
- JMeter: 10 usuarios, 3610 muestras en 1 minuto y 3 segundos, 0 % de error. El informe está en `jmeter/html-report/index.html`.
- Firefox no se ejecutó en esta máquina. `cdn.playwright.dev` abre la conexión y no entrega el zip, y Edge responde `ERR_NETWORK_ACCESS_DENIED`. El workflow de GitHub Actions sí instala Chromium y Firefox y corre los dos proyectos.

## Tiempo

Desde el enunciado hasta dejar el repositorio público: alrededor de una hora y veinticinco minutos.
