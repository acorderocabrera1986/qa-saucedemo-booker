import { expect, test } from '@playwright/test';
import { sampleBooking, type Booking } from './booking';
import { BookerClient } from './booker-client';

test.describe.configure({ mode: 'serial' });

test.describe('reservas autenticadas con token', () => {
  let token = '';
  let bookingId = 0;
  let created: Booking;
  const updated: Booking = {
    ...sampleBooking('Hopper'),
    firstname: 'Grace',
    totalprice: 220,
  };

  test.beforeAll(async ({ request }) => {
    created = sampleBooking(`QA${Date.now()}`);
    const response = await new BookerClient(request).authenticate();
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.token.length).toBeGreaterThan(0);
    token = body.token;
  });

  test.afterAll(async ({ request }) => {
    if (!bookingId || !token) return;
    await new BookerClient(request).remove(bookingId, token);
  });

  test('crear una reserva', async ({ request }) => {
    const response = await new BookerClient(request).create(created);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.bookingid).toEqual(expect.any(Number));
    expect(body.booking).toMatchObject(created);
    bookingId = body.bookingid;
  });

  test('consultar la reserva creada', async ({ request }) => {
    const response = await new BookerClient(request).get(bookingId);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject(created);
  });

  test('modificar la reserva con el token', async ({ request }) => {
    const api = new BookerClient(request);
    const response = await api.replace(bookingId, updated, token);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject(updated);

    const stored = await api.get(bookingId);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toMatchObject(updated);
  });

  test('rechazar la modificación si no hay token', async ({ request }) => {
    const response = await new BookerClient(request).replace(bookingId, created);
    expect(response.status()).toBe(403);
  });

  test('borrar la reserva con el token', async ({ request }) => {
    const api = new BookerClient(request);
    const response = await api.remove(bookingId, token);
    expect(response.status()).toBe(201);
    expect(await response.text()).toContain('Created');

    const missing = await api.get(bookingId);
    expect(missing.status()).toBe(404);
    bookingId = 0;
  });
});
