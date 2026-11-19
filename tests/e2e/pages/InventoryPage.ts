import { expect, type Page } from '@playwright/test';
import { addToCartTestId, copy, route, testId } from '../selectors';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(this.page).toHaveURL(route.inventory);
    await expect(this.page.getByTestId(testId.title)).toHaveText(copy.productsTitle);
  }

  async addProducts(...slugs: string[]) {
    for (const slug of slugs) {
      await this.page.getByTestId(addToCartTestId(slug)).click();
    }
  }

  async expectCartCount(count: number) {
    await expect(this.page.getByTestId(testId.cartBadge)).toHaveText(String(count));
  }

  async openCart() {
    await this.page.getByTestId(testId.cartLink).click();
  }
}
