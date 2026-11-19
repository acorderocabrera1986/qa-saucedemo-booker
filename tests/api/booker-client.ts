import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { type Booking } from './booking';

const timeout = 20_000;

export const bookerRoutes = {
  auth: '/auth',
  bookings: '/booking',
  booking: (id: number) => `/booking/${id}`,
} as const;

export const bookerAuth = {
  username: 'admin',
  password: 'password123',
} as const;

export function tokenCookie(token: string) {
  return { Cookie: `token=${token}` };
}

export class BookerClient {
  constructor(private readonly request: APIRequestContext) {}

  authenticate(): Promise<APIResponse> {
    return this.request.post(bookerRoutes.auth, { data: bookerAuth, timeout });
  }

  create(booking: Booking): Promise<APIResponse> {
    return this.request.post(bookerRoutes.bookings, { data: booking, timeout });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(bookerRoutes.booking(id), { timeout });
  }

  replace(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.request.put(bookerRoutes.booking(id), {
      data: booking,
      timeout,
      headers: token ? tokenCookie(token) : undefined,
    });
  }

  remove(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(bookerRoutes.booking(id), {
      headers: tokenCookie(token),
      timeout,
    });
  }
}
