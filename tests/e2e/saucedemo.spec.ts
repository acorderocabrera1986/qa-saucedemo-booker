import { test } from './fixtures';
import { catalog, customer, itemTotalLabel, users } from './data/shop';
import { copy } from './selectors';

const purchase = [catalog.backpack, catalog.bikeLight];

test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

test('un usuario válido entra al inventario', async ({ loginPage, inventoryPage }) => {
  await loginPage.login(users.standard.username, users.standard.password);
  await inventoryPage.expectLoaded();
});

test('una contraseña incorrecta no entra y muestra el error', async ({ loginPage }) => {
  await loginPage.login(users.invalidPassword.username, users.invalidPassword.password);
  await loginPage.expectError(copy.credentialsMismatch);
});

test('un usuario bloqueado no entra', async ({ loginPage }) => {
  await loginPage.login(users.locked.username, users.locked.password);
  await loginPage.expectError(copy.lockedOut);
});

test('añadir dos productos y completar la compra', async ({
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
}) => {
  await loginPage.login(users.standard.username, users.standard.password);
  await inventoryPage.expectLoaded();
  await inventoryPage.addProducts(...purchase.map((product) => product.slug));
  await inventoryPage.expectCartCount(purchase.length);
  await inventoryPage.openCart();

  await cartPage.expectItems(purchase.map((product) => product.name));
  await cartPage.checkout();

  await checkoutPage.fillCustomer(customer.firstName, customer.lastName, customer.postalCode);
  await checkoutPage.expectOverview(itemTotalLabel(purchase.map((product) => product.price)));
  await checkoutPage.finish();
  await checkoutPage.expectComplete();
  await checkoutPage.expectCartEmpty();
});
