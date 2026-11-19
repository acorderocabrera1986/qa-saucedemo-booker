import { expect, type Page } from '@playwright/test';
import { copy, route, testId } from '../selectors';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillCustomer(firstName: string, lastName: string, postalCode: string) {
    await expect(this.page).toHaveURL(route.checkoutInfo);
    await this.page.getByTestId(testId.firstName).fill(firstName);
    await this.page.getByTestId(testId.lastName).fill(lastName);
    await this.page.getByTestId(testId.postalCode).fill(postalCode);
    await this.page.getByTestId(testId.continue).click();
  }

  async expectOverview(itemTotal: string) {
    await expect(this.page).toHaveURL(route.checkoutOverview);
    await expect(this.page.getByTestId(testId.subtotal)).toHaveText(itemTotal);
  }

  async finish() {
    await this.page.getByTestId(testId.finish).click();
  }

  async expectComplete() {
    await expect(this.page).toHaveURL(route.checkoutComplete);
    await expect(this.page.getByTestId(testId.completeHeader)).toHaveText(copy.thankYou);
    await expect(this.page.getByTestId(testId.completeText)).toContainText(copy.dispatched);
  }

  async expectCartEmpty() {
    await expect(this.page.getByTestId(testId.cartBadge)).toHaveCount(0);
  }
}
