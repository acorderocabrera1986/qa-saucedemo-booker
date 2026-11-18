import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillCustomer(firstName: string, lastName: string, postalCode: string) {
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
    await this.page.getByTestId('firstName').fill(firstName);
    await this.page.getByTestId('lastName').fill(lastName);
    await this.page.getByTestId('postalCode').fill(postalCode);
    await this.page.getByTestId('continue').click();
  }

  async expectOverview(itemTotal: string) {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await expect(this.page.getByTestId('subtotal-label')).toHaveText(itemTotal);
  }

  async finish() {
    await this.page.getByTestId('finish').click();
  }

  async expectComplete() {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
    await expect(this.page.getByTestId('complete-text')).toContainText('dispatched');
  }

  async expectCartEmpty() {
    await expect(this.page.getByTestId('shopping-cart-badge')).toHaveCount(0);
  }
}
