/**
 * Valores `data-test` de SauceDemo.
 * Si la tienda renombra un control, se cambia aquí y en ningún otro archivo.
 */
export const testId = {
  username: 'username',
  password: 'password',
  loginButton: 'login-button',
  error: 'error',
  title: 'title',
  cartBadge: 'shopping-cart-badge',
  cartLink: 'shopping-cart-link',
  itemName: 'inventory-item-name',
  checkout: 'checkout',
  firstName: 'firstName',
  lastName: 'lastName',
  postalCode: 'postalCode',
  continue: 'continue',
  subtotal: 'subtotal-label',
  finish: 'finish',
  completeHeader: 'complete-header',
  completeText: 'complete-text',
} as const;

export function addToCartTestId(slug: string) {
  return `add-to-cart-${slug}`;
}

export const route = {
  login: /\/$/,
  inventory: /inventory\.html/,
  cart: /cart\.html/,
  checkoutInfo: /checkout-step-one\.html/,
  checkoutOverview: /checkout-step-two\.html/,
  checkoutComplete: /checkout-complete\.html/,
} as const;

export const copy = {
  productsTitle: 'Products',
  thankYou: 'Thank you for your order!',
  dispatched: 'dispatched',
  credentialsMismatch: 'Username and password do not match',
  lockedOut: 'Sorry, this user has been locked out',
} as const;
