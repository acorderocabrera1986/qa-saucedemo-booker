import { expect, type Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectItems(names: string[]) {
    await expect(this.page).toHaveURL(/cart\.html/);
    const items = this.page.getByTestId('inventory-item-name');
    await expect(items).toHaveCount(names.length);
    await expect(items).toHaveText(names);
  }

  async checkout() {
    await this.page.getByTestId('checkout').click();
  }
}
