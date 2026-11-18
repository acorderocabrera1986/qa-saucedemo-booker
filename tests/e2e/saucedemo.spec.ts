import { test } from './fixtures';

const password = 'secret_sauce';

const backpack = {
  slug: 'sauce-labs-backpack',
  name: 'Sauce Labs Backpack',
};
const bikeLight = {
  slug: 'sauce-labs-bike-light',
  name: 'Sauce Labs Bike Light',
};

test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

test('un usuario válido entra al inventario', async ({ loginPage, inventoryPage }) => {
  await loginPage.login('standard_user', password);
  await inventoryPage.expectLoaded();
});

test('una contraseña incorrecta no entra y muestra el error', async ({ loginPage }) => {
  await loginPage.login('standard_user', 'clave-incorrecta');
  await loginPage.expectError('Username and password do not match');
});

test('un usuario bloqueado no entra', async ({ loginPage }) => {
  await loginPage.login('locked_out_user', password);
  await loginPage.expectError('Sorry, this user has been locked out');
});

test('añadir dos productos y completar la compra', async ({
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
}) => {
  await loginPage.login('standard_user', password);
  await inventoryPage.expectLoaded();
  await inventoryPage.addProducts(backpack.slug, bikeLight.slug);
  await inventoryPage.expectCartCount(2);
  await inventoryPage.openCart();

  await cartPage.expectItems([backpack.name, bikeLight.name]);
  await cartPage.checkout();

  await checkoutPage.fillCustomer('Ada', 'Lovelace', '28001');
  await checkoutPage.expectOverview('Item total: $39.98');
  await checkoutPage.finish();
  await checkoutPage.expectComplete();
  await checkoutPage.expectCartEmpty();
});
