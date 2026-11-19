# Prueba de automatización: SauceDemo y Restful Booker

Pruebas de extremo a extremo, de API y de carga sobre dos aplicaciones públicas de práctica. El repositorio es público y vive aparte de cualquier otro proyecto: https://github.com/acorderocabrera1986/qa-saucedemo-booker

El enunciado pide cinco cosas. Cada una está en el historial como su propia capa de commits, no en un único volcado.

| Punto | Qué pide | Dónde está | Cómo se comprobó |
|---|---|---|---|
| 1 | Playwright, Page Object Model, login válido y fallido, compra, al menos dos navegadores | `tests/e2e/`, proyectos `chromium` y `firefox` | 4 pruebas en cada navegador, en local y en GitHub Actions |
| 2 | CRUD de una reserva con token, código y cuerpo | `tests/api/` | 5 pruebas en serie contra la API en vivo |
| 3 | JMeter, 10 usuarios, 1 minuto, aserciones e informe HTML | `jmeter/booker-load-test.jmx`, `jmeter/html-report/` | Última corrida: 1863 muestras, 0 % de error |
| 4 | GitHub Actions ejecutando Playwright | `.github/workflows/playwright.yml` | [Corrida del commit `5ea1e61`](https://github.com/acorderocabrera1986/qa-saucedemo-booker/actions/runs/44439714659): 13 pruebas en 9,7 s |
| 5 | Este documento | `README.md` | Cómo correr, decisiones, qué haría con más tiempo y cómo usé la IA |

## Mapa del repositorio

```
playwright.config.ts          proyectos, timeouts, IPv4 y el atributo data-test
tests/e2e/selectors.ts        data-test, rutas y textos. Las páginas solo leen esto
tests/e2e/data/shop.ts        usuarios, catálogo y comprador
tests/e2e/fixtures.ts         inyecta Login, Inventory, Cart y Checkout
tests/e2e/pages/              Page Object Model
tests/e2e/saucedemo.spec.ts  las cuatro pruebas de la tienda
tests/api/booking.ts          forma de una reserva y el ejemplo que se envía
tests/api/booker-client.ts    rutas, credencial pública y cookie del token
tests/api/contract.ts         200, 201, 403, 404 y el texto "Created"
tests/api/booker.spec.ts      crear, leer, modificar, rechazar y borrar
jmeter/booker-load-test.jmx  10 usuarios durante 60 segundos
jmeter/html-report/           informe HTML de la última carga que pasó
scripts/run-load-test.ps1     arranca JMeter con java y limpia la corrida anterior
.github/workflows/playwright.yml
```

No se versiona `node_modules/`, `playwright-report/`, `test-results/`, `jmeter/results/`, los `*.jtl`, la carpeta `.tools/` ni `.env`. El informe de JMeter sí se versiona, porque el enunciado pide el HTML generado y Actions no lanza el minuto de carga.

## Requisitos

- Node.js 20. En esta máquina, 20.19.4. El lock fija `@playwright/test` 1.65.1 y TypeScript 5.9.
- Para la carga: Java 17 o superior y Apache JMeter 5.6.3. Aquí corrió con Java 26. Java 26 avisa de que JMeter usa `sun.misc.Unsafe`; el aviso no corta la prueba. El script busca, en este orden, `JMETER_BAT`, `.tools/apache-jmeter-5.6.3/bin/jmeter.bat` y `.tools/apache-jmeter/bin/jmeter.bat`.
- Navegadores de Playwright: `npx playwright install chromium firefox`. En CI el workflow los instala con las dependencias del sistema. En local, si el CDN no entrega el zip, se puede usar el Chrome y el Firefox ya instalados. El detalle está más abajo.

Las credenciales de las dos demos son públicas y están en el código a propósito:

- SauceDemo: `standard_user` / `secret_sauce` y `locked_out_user` / `secret_sauce`, en `tests/e2e/data/shop.ts`.
- Restful Booker: `admin` / `password123`, en `tests/api/booker-client.ts`.

El token que devuelve `POST /auth` no se guarda. Cada corrida lo pide y lo usa solo en memoria. No va en commits, en el informe de JMeter ni en este documento.

## Cómo ejecutarlo

Desde la raíz del repositorio, en PowerShell.

Instalar y correr la tienda y la API:

```powershell
npm ci
npx playwright install chromium firefox
npm test
```

`npm test` lanza los tres proyectos: SauceDemo en Chromium, SauceDemo en Firefox y el CRUD de Restful Booker.

Solo la tienda, en los dos navegadores:

```powershell
npm run test:e2e
```

Un solo navegador:

```powershell
npx playwright test --project=chromium
npx playwright test --project=firefox
```

Solo la API:

```powershell
npm run test:api
```

El informe HTML de Playwright queda en `playwright-report/`. Esa carpeta está en `.gitignore`. Se abre con:

```powershell
npm run report
```

### Navegadores del sistema

`cdn.playwright.dev` desde esta red abre la conexión y no termina de entregar el zip. Si Chrome y Firefox ya están instalados:

```powershell
$env:PW_USE_SYSTEM_BROWSERS = '1'
npx playwright test --project=chromium --project=firefox
```

En `cmd` la variable es `set PW_USE_SYSTEM_BROWSERS=1`. En GitHub Actions no se define: el runner descarga el Chromium y el Firefox de Playwright.

El canal importa. `channel: 'firefox'` es el Firefox que empaqueta Playwright, no el de `Program Files`. El Firefox instalado en Windows es `channel: 'moz-firefox'`. El config solo pone ese canal cuando `PW_USE_SYSTEM_BROWSERS=1`. Edge no sirve: abre el navegador y SauceDemo responde `net::ERR_NETWORK_ACCESS_DENIED`.

En esta máquina el Firefox del sistema llegó a abrir la tienda, pero `fill()` dejó el usuario vacío y el login respondió «Username is required». Un script suelto con el mismo `fill()` sí escribía. Por eso la corrida que cuenta, en local y en CI, usa el Firefox 159 de Playwright (revisión 1572), no el del sistema. El zip se descargó en el navegador, porque el instalador de Node no lo completaba, y se colocó en `%LOCALAPPDATA%\ms-playwright\firefox-1572`.

### Carga con JMeter

Hace falta el JDK en el `PATH` y JMeter en `.tools/` o en `JMETER_BAT`. Desde la raíz:

```powershell
.\scripts\run-load-test.ps1
```

El script hace esto, y hay que dejarlo así si se lanza JMeter a mano:

1. Borra `jmeter/results/results.jtl` si existe. Si el archivo ya tiene filas, JMeter se niega a arrancar.
2. Borra `jmeter/html-report`. El generador HTML exige que la carpeta de salida no exista.
3. Quita `JMETER_BIN` del entorno. Si esa variable apunta a `jmeter.bat`, el `.bat` busca un jar con un nombre imposible (`jmeter.batApacheJMeter.jar`).
4. Arranca con `java -jar ApacheJMeter.jar -n -t ... -l ... -e -o ...`, no con `jmeter.bat`.
5. Falla si no aparece `jmeter/html-report/index.html`.

La corrida dura un minuto más el arranque de la JVM, cerca de un minuto y medio. El `results.jtl` no se sube. El HTML sí.

A mano, con la carpeta del informe ya borrada y el jtl vacío:

```powershell
java -jar .tools\apache-jmeter-5.6.3\bin\ApacheJMeter.jar -n -t jmeter\booker-load-test.jmx -l jmeter\results\results.jtl -e -o jmeter\html-report
```

### GitHub Actions

El workflow corre solo en cada `push` y en cada `pull_request`. No hace falta lanzarlo a mano. En `ubuntu-latest`: Node 20, `npm ci`, `npx playwright install --with-deps chromium firefox`, `npx playwright test`, y sube `playwright-report/` como artefacto durante 7 días. El job tiene un tope de 20 minutos. No ejecuta JMeter.

La última corrida, sobre `5ea1e61`, está en https://github.com/acorderocabrera1986/qa-saucedemo-booker/actions/runs/44439714659

## Qué comprueban las pruebas

### SauceDemo

El config pone `testIdAttribute: 'data-test'`. SauceDemo no usa `data-testid`. Si un control cambia de nombre, se toca `tests/e2e/selectors.ts` y ningún page object.

Cada prueba abre el login en `beforeEach`. Los cuatro casos se repiten en Chromium y en Firefox:

- `standard_user` entra y el inventario muestra el título Products.
- `standard_user` con `clave-incorrecta` se queda en el login y el error contiene «Username and password do not match».
- `locked_out_user` ve «Sorry, this user has been locked out».
- Se añaden Sauce Labs Backpack (29,99) y Sauce Labs Bike Light (9,99). El badge del carrito marca 2. El carrito muestra los dos nombres. El comprador es Ada Lovelace, código postal 28001. El subtotal es `Item total: $39.98`. Al terminar, la cabecera es «Thank you for your order!», el texto habla del envío y el badge del carrito ya no está.

El subtotal no está escrito a mano en el spec. `itemTotalLabel()` suma los precios del catálogo. Si cambia un precio en `shop.ts`, cambia la aserción.

### Restful Booker

Las cinco pruebas van en serie y comparten una reserva. `beforeAll` solo guarda el token como texto. No reutiliza el `request` de ese hook: Playwright no deja usar ese fixture en los tests siguientes, y cada test construye su propio `BookerClient`. `afterAll` borra la reserva si el test de borrado no llegó a dejar el id en cero.

La reserva de ejemplo es Ada, apellido único por corrida, 150, depósito pagado, del 2026-12-01 al 2026-12-05, Breakfast. La modificación la pasa a Grace Hopper, apellido Hopper y total 220.

Contrato medido contra la API en vivo, no contra un CRUD de manual. Los códigos viven en `tests/api/contract.ts`:

| Operación | Esperado | Por qué no es el del manual |
|---|---|---|
| `POST /auth` | 200 y un `token` no vacío | La demo devuelve el token en el cuerpo |
| `POST /booking` | 200, `bookingid` numérico y `booking` igual al enviado | El alta es 200, no 201 |
| `GET /booking/{id}` | 200 y el mismo cuerpo | |
| `PUT /booking/{id}` con `Cookie: token=...` | 200, y el GET siguiente ya trae a Grace Hopper | |
| El mismo `PUT` sin cookie | 403 | El cliente omite la cabecera. No manda una cookie vacía |
| `DELETE /booking/{id}` con token | 201 y el cuerpo exacto `Created` | El borrado es 201, no 204 |
| `GET` después del borrado | 404 | |

Sin `Accept: application/json` la API contesta XML. El proyecto `api` manda `Accept` y `Content-Type` en todas las peticiones. Cada llamada tiene un tope de 20 segundos. El proyecto espera hasta 45 segundos y reintenta dos veces, también en local, porque el dyno de Heroku se duerme.

### JMeter

El plan `Restful Booker — 10 usuarios, 1 minuto` tiene tres grupos:

1. Preparación, 1 hilo. `POST /auth` exige 200 y guarda el token. `POST /booking` crea una reserva `firstname=Load` y exige 200. Si la preparación falla, el plan se detiene: no tiene sentido leer un id que no existe.
2. Carga. 10 hilos, rampa de 10 segundos, planificador de 60 segundos. Cada hilo hace `GET /booking/{id}` y exige HTTP 200 y el texto `"firstname":"Load"`. Un error de muestra no para a los demás.
3. Cierre, 1 hilo. `DELETE` con la cookie del token y exige 201.

La carga no hace `POST /booking` en bucle. Diez usuarios durante un minuto creando reservas dejarían cientos de filas en un servicio público. El CRUD que escribe está en Playwright, una reserva por corrida.

Timeouts del plan: conexión 20 s y respuesta 20 s en el alta y el borrado; conexión 15 s y respuesta 20 s en la lectura.

## Decisiones

- Un solo repositorio. La tienda, la API, JMeter y Actions se leen juntos. Separarlos partiría el workflow y el informe. El avance está en los commits: herramienta, interfaz, API, carga, CI, red, arranque de JMeter, informe, documento, selectores, contrato, canal de Firefox, limpieza del jtl y el informe actualizado.
- Playwright cubre la interfaz y la API. JMeter solo la carga, porque el enunciado pide esa herramienta y su informe HTML.
- Los dos navegadores aplican a SauceDemo. Repetir el CRUD en cada navegador no aporta: no hay página que pintar.
- Los localizadores, las rutas y los textos fijos de la tienda están en un solo archivo. Los usuarios, los precios y el comprador están en otro. Los page objects no concatenan selectores.
- Las rutas y la cookie del token están en el cliente. Los códigos y el texto `Created` están en el contrato. El spec no arma URLs ni escribe números de estado sueltos.
- La autenticación del enunciado es el token, así que el `PUT` y el `DELETE` mandan `Cookie: token=...`. No uso Basic Auth, aunque la API también lo acepta.
- `dns.setDefaultResultOrder('ipv4first')`. Desde esta red, si Node elegía IPv6, Restful Booker se quedaba colgado hasta el timeout.
- En CI la tienda reintenta dos veces, guarda traza en el primer reintento y captura pantalla solo si falla. En local la tienda no reintenta, para ver el fallo a la primera. `forbidOnly` solo se activa en CI.
- Actions no lanza el minuto de JMeter. Alargaría cada push y castigaría el mismo servicio público. El HTML generado en local se deja en el repositorio.
- El script de carga borra el jtl y el informe antes de repetir. La primera repetición falló al instante porque el jtl anterior no estaba vacío, y además ya había borrado el informe. Esa corrida rota no se subió. Se subió primero el arreglo del script y, después de una corrida en verde, solo el HTML nuevo.
- `PW_USE_SYSTEM_BROWSERS` existe para esta máquina. CI no lo necesita y no lo define.

## Qué falló y cómo quedó

- El primer contrato proponía 201 al crear y 204 al borrar. La API en vivo responde 200 y 201 con cuerpo `Created`. Las aserciones se fijaron después de medirla.
- Guardar el `request` de `beforeAll` dentro del cliente hacía fallar el test al instante: ese fixture no se puede reutilizar. Cada test crea su cliente.
- `channel: 'firefox'` buscaba el Firefox de Playwright, que aquí todavía no estaba. El del sistema es `moz-firefox`. Aun así, la suite con el Firefox del sistema dejaba el formulario vacío. La corrida válida usa el Firefox 1572 de Playwright.
- Edge queda descartado por `ERR_NETWORK_ACCESS_DENIED`.
- `jmeter.bat` con `JMETER_BIN` apuntando al propio `.bat` no encontraba el jar. El script llama a `java -jar` y limpia esa variable.
- La primera repetición de la carga murió con «Results file is not empty». El script ahora borra el jtl.
- Justo después, `POST /auth` desde JMeter agotó 20 segundos contra cada una de las cuatro direcciones y el plan se detuvo con 1 muestra y 100 % de error. PowerShell, en ese momento, tardaba unos 22 segundos en el mismo login: el dyno estaba frío. No subí ese informe. La repetición, con la API ya despierta, dio 0 % de error.
- El instalador de Playwright no completó la descarga del Firefox desde el CDN, ni desde los espejos que se probaron. El zip se bajó con el navegador y se instaló a mano en la carpeta que Playwright espera.

## Resultado de las corridas

Local, SauceDemo, Firefox 159 de Playwright: las 4 pruebas pasaron en 16,4 s. Chromium, en una corrida anterior de la misma suite: las 4 pasaron.

Local, Restful Booker, después de dejar los códigos en `contract.ts`: las 5 pruebas pasaron en 12,2 s. Una corrida anterior había fallado el primer `POST /auth` a los 20 s y el reintento pasó. Por eso el proyecto reintenta siempre.

Local, JMeter, corrida que está en el repositorio:

| Petición | Muestras | Error | Tiempo medio |
|---|---:|---:|---:|
| POST /auth | 1 | 0 | 2,9 s |
| POST /booking | 1 | 0 | 119 ms |
| GET /booking/{id} | 1860 | 0 | 301 ms |
| DELETE /booking/{id} | 1 | 0 | 5,6 s |
| Total | 1863 | 0 % | 305 ms |

Diez usuarios activos, unos 26,5 requests por segundo, máximo 32,8 s en una lectura. Una corrida anterior, con la API más rápida, había dado 3610 muestras y también 0 % de error. El informe versionado es el de 1863, que es la repetición posterior al arreglo del script.

GitHub Actions, commit `5ea1e61`: 13 pruebas pasadas en 9,7 s. Cuatro de Chromium, cuatro de Firefox y las cinco de la API. En el runner el CDN sí entrega Chromium 159 y Firefox 159.

## Con más tiempo

- WebKit y una vista móvil de SauceDemo. El page object ya no depende del navegador; faltaría el proyecto en el config y en el workflow.
- Entender por qué el Firefox del sistema deja el login vacío dentro de la suite y no en un script suelto. Hasta entonces no lo uso como evidencia.
- Más bordes de la API: fechas invertidas, cuerpo incompleto, un id que no existe y un token inventado en el `DELETE`.
- Sacar Restful Booker del camino crítico de CI. Un mock para el contrato en cada push, y un workflow programado contra la API real. Un Heroku frío no debería poner roja la tienda. La corrida de JMeter que se abortó con el login a 80 segundos es el caso concreto.
- Subir el timeout de conexión de JMeter, o fijar una sola dirección, para que cuatro registros DNS lentos no consuman el minuto antes de empezar la carga.
- Fijar un JDK 17 junto a JMeter 5.6.3. Java 26 solo avisó, pero el aviso de `sun.misc.Unsafe` dice que ese método va a desaparecer.
- Una segunda carga con un tope de peticiones por segundo y la rampa más larga, y publicar el HTML en GitHub Pages en vez de dejar el árbol del informe dentro del repo.
- Guardar la traza de Playwright también cuando la prueba pasa, para repasarla en la entrevista.
- Un job de Actions que falle si alguien sube un `results.jtl` o un token. Hoy eso solo lo evita `.gitignore` y el cuidado al hacer commit.

## Cómo usé la IA

Trabajé en Cursor. Le pedí que armara la prueba en menos de tres horas, en un repositorio nuevo de mi cuenta, con commits según avanzaba el trabajo y sin mezclarlo con otros proyectos. Le pedí que lo tratara como un ejercicio de automatización: Page Object Model, selectores cambiables en un solo sitio, aserciones de código y de cuerpo, y el informe de JMeter. Después le fui pidiendo cada punto por separado: Firefox, la API, la carga, Actions y este documento. La condición que repetí es que no se subiera todo de una vez.

Acepté esta forma, después de verla en el código y de correrla:

- Un solo repositorio en TypeScript.
- Playwright para la tienda y para la API. JMeter solo para la carga.
- Page Object Model con fixtures, y las constantes de `data-test` en `selectors.ts`.
- Chromium y Firefox solo en la tienda.
- El plan de JMeter que crea una reserva, la lee durante un minuto y la borra.
- Actions solo para Playwright, con el informe como artefacto.
- IPv4 primero, tope de 20 segundos y reintentos en la API.
- Arrancar JMeter con `java -jar` y borrar el jtl antes de repetir.
- El canal `moz-firefox` cuando el navegador es el del sistema.

Corregí lo que proponía o lo que la corrida desmintió:

- El alta no es 201 ni el borrado es 204. Medí la API y dejé 200, 201, `Created`, 403 y 404 en `contract.ts`.
- El carrito vacío no se comprueba leyendo por dentro de la página. Quedó como método de `CheckoutPage`.
- Los localizadores usan `data-test`, no `data-testid`.
- La carga no crea una reserva por iteración.
- El token de sesión no se imprime, no se commitea y no se pega en el README. Las contraseñas de las demos sí están, porque son públicas y las pruebas las necesitan.
- No se reutiliza el `request` de `beforeAll`.
- No se usa Edge. No se presenta como verde el Firefox del sistema: la suite fallaba con el usuario vacío. La evidencia de Firefox es la del binario 1572 y la de Actions.
- No se commitea el zip de Firefox, la carpeta `.tools/`, el `results.jtl` ni un informe de una corrida fallida.
- El script no puede dejar `JMETER_BIN` apuntando al `.bat`, y no puede generar el HTML encima de una carpeta que ya existe.
- La primera repetición de JMeter, con 100 % de error, no entra al repositorio. Entra la siguiente, con 0 %.

Lo que escribí o revisé yo, y no dejé solo en manos del modelo: los códigos reales de Restful Booker, que el Firefox del sistema no servía como evidencia, que el CDN había que bajarlo por el navegador, y que cada punto se subiera en su commit.

## Tiempo

El enunciado empezó alrededor de las 18:00. El repositorio público, con la tienda, la API, el plan de JMeter, Actions y la primera versión de este documento, quedó cerca de las 19:20: alrededor de una hora y veinticinco minutos.

Después seguí con lo que esa primera pasada había dejado abierto. El Firefox de Playwright no se pudo bajar por el CDN y se instaló desde el zip. La API se volvió a correr con los códigos en un solo archivo. La carga se repitió, porque el jtl viejo impedía arrancar y la primera repetición encontró la API dormida. Actions ya estaba en verde y lo comprobé sobre el último commit. Este documento cierra esa segunda pasada. El reloj, desde el enunciado hasta aquí, queda alrededor de las cuatro horas y cuarto. La parte que se fue de las tres horas fue casi toda la descarga de Firefox y el repetir cada punto para dejar el historial separado.

## Historial

```
9674e27 chore: iniciar el proyecto de Playwright en TypeScript
d61dbc0 test: cubrir login y compra de SauceDemo con Page Object Model
dc6a2ca test: cubrir el CRUD de reservas con el token de Restful Booker
8d74e40 test: anadir el plan de carga de JMeter para 10 usuarios y 1 minuto
c202850 ci: ejecutar Playwright en Chromium y Firefox
cf21bca test: preferir IPv4 y reintentar la API publica
d8a07a6 test: arrancar JMeter con java y usar el Firefox del sistema si existe
567911f test: guardar el informe HTML de la carga de un minuto
f282c0e docs: explicar como correr la prueba y que se decidio
11374d5 refactor: centralizar selectores y el cliente de la API
f1b7508 test: dejar los codigos de la API de reservas en un solo sitio
73d0b09 fix: usar el canal moz-firefox cuando el navegador es el del sistema
c4f483f test: vaciar el resultado anterior antes de repetir la carga
5ea1e61 test: actualizar el informe HTML de la carga de un minuto
```

El commit de esta versión del documento va justo encima de esa lista.
