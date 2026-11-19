export const users = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_out_user', password: 'secret_sauce' },
  invalidPassword: { username: 'standard_user', password: 'clave-incorrecta' },
} as const;

export const catalog = {
  backpack: { slug: 'sauce-labs-backpack', name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { slug: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light', price: 9.99 },
} as const;

export const customer = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '28001',
} as const;

export function itemTotalLabel(prices: number[]) {
  const total = prices.reduce((sum, price) => sum + price, 0);
  return `Item total: $${total.toFixed(2)}`;
}
