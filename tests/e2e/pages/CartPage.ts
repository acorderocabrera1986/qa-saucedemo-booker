import { expect, type Page } from '@playwright/test';
import { route, testId } from '../selectors';

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectItems(names: string[]) {
    await expect(this.page).toHaveURL(route.cart);
    const items = this.page.getByTestId(testId.itemName);
    await expect(items).toHaveCount(names.length);
    await expect(items).toHaveText(names);
  }

  async checkout() {
    await this.page.getByTestId(testId.checkout).click();
  }
}
