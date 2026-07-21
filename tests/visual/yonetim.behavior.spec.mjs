import { expect, test } from '@playwright/test';

function requireAuthenticatedState() {
  if (!process.env.PLAYWRIGHT_STORAGE_STATE) {
    throw new Error(
      'PLAYWRIGHT_STORAGE_STATE must point to an authenticated admin storage-state file.',
    );
  }
}

async function openSalesHub(page) {
  await page.goto('/yonetim', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('sales-hub-dashboard')).toBeVisible();
  await expect(page.getByText('Danışanlar yükleniyor...')).toBeHidden();
}

async function clientName(card) {
  const lines = (await card.locator('[data-visual-dynamic="client-identity"]').innerText())
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
  return lines[1] || lines[0];
}

test.beforeAll(() => {
  requireAuthenticatedState();
});

test('opens the approved shell with one sidebar, one header and a live portfolio', async ({ page }) => {
  await openSalesHub(page);

  await expect(page.getByTestId('sales-hub-sidebar')).toHaveCount(1);
  await expect(page.getByTestId('sales-hub-header')).toHaveCount(1);
  await expect(page.getByTestId('client-portfolio-panel')).toHaveCount(1);
  await expect(page.getByTestId('client-detail-panel')).toHaveCount(1);
  await expect(page.locator('[data-client-id]').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).not.toHaveText('Danışan seçilmedi');
});

test('selects clients, searches, filters and sorts the real list', async ({ page }) => {
  await openSalesHub(page);

  const cards = page.locator('[data-client-id]');
  const firstCard = cards.first();
  const firstName = await clientName(firstCard);
  await firstCard.click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(firstName);

  if ((await cards.count()) > 1) {
    const secondCard = cards.nth(1);
    const secondName = await clientName(secondCard);
    await secondCard.click();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(secondName);
  }

  const search = page.getByPlaceholder('Danışan ara...');
  await search.fill(firstName);
  await expect(page.locator('[data-client-id]').first()).toContainText(firstName);
  await search.clear();

  const group = page.getByLabel('Grup:');
  await group.selectOption('ACTIVE');
  const activeCards = page.locator('[data-client-id]');
  for (let index = 0; index < (await activeCards.count()); index += 1) {
    await expect(activeCards.nth(index)).toContainText('Aktif');
  }

  await group.selectOption('ALL');
  await page.getByRole('button', { name: 'SIRALA' }).click();
  const sortedCards = page.locator('[data-client-id]');
  const names = [];
  for (let index = 0; index < (await sortedCards.count()); index += 1) {
    names.push(await clientName(sortedCards.nth(index)));
  }
  const expected = [...names].sort((left, right) => left.localeCompare(right, 'tr'));
  expect(names).toEqual(expected);
});

test('preserves panel collapse behavior and routes operational actions correctly', async ({ page }) => {
  await openSalesHub(page);
  const firstCard = page.locator('[data-client-id]').first();
  const clientId = await firstCard.getAttribute('data-client-id');
  await firstCard.click();

  const sidebar = page.getByTestId('sales-hub-sidebar');
  const expanded = await sidebar.boundingBox();
  expect(expanded).not.toBeNull();
  await page.getByTitle('Menüyü daralt').click();
  const collapsed = await sidebar.boundingBox();
  expect(collapsed).not.toBeNull();
  expect(collapsed.width).toBeLessThan(expanded.width);

  await page.evaluate(() => {
    window.__salesHubPrintCalled = false;
    window.print = () => {
      window.__salesHubPrintCalled = true;
    };
  });
  await page.getByRole('button', { name: 'To PDF' }).click();
  expect(await page.evaluate(() => window.__salesHubPrintCalled)).toBe(true);

  await page.getByRole('button', { name: 'Yeni', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/yonetim/randevular\\?clientId=${encodeURIComponent(clientId)}`),
  );
});

test('requires guardian fields for a child client before any API write', async ({ page }) => {
  await openSalesHub(page);
  await page.getByTestId('client-portfolio-panel').getByTitle('Yeni danışan').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Danışan tipi').selectOption('CHILD');
  await dialog.getByLabel('Ad').fill('Görsel');
  await dialog.getByLabel('Soyad').fill('Kontrol');
  await dialog.getByRole('button', { name: 'Danışanı oluştur' }).click();

  await expect(dialog).toBeVisible();
  expect(await dialog.getByLabel('Veli adı').evaluate((input) => input.validity.valueMissing)).toBe(
    true,
  );
});

test('rejects unauthenticated client API access', async ({ playwright }) => {
  const anonymous = await playwright.request.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
  });
  const response = await anonymous.get('/api/admin/clients?take=1');
  expect(response.status()).toBe(403);
  await anonymous.dispose();
});

test('writes, reloads, edits, notes and deactivates through real APIs on the test database', async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_WRITE_TESTS !== '1', 'Requires a disposable integration database.');
  await openSalesHub(page);

  const unique = `Playwright ${Date.now()}`;
  await page.getByTestId('client-portfolio-panel').getByTitle('Yeni danışan').click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Ad').fill(unique);
  await createDialog.getByLabel('Soyad').fill('Danışan');
  await createDialog.getByLabel('Telefon').fill('5550001122');
  await createDialog.getByRole('button', { name: 'Danışanı oluştur' }).click();

  await expect(page.locator('[data-client-id]').filter({ hasText: unique })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-client-id]').filter({ hasText: unique })).toBeVisible();
  await page.locator('[data-client-id]').filter({ hasText: unique }).click();

  await page.getByRole('button', { name: 'Düzenle' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('Tercih edilen ad').fill('Kalıcı Test');
  await editDialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Danışan bilgileri kaydedildi.')).toBeVisible();

  await page.getByTitle('Operasyonel not ekle').click();
  const noteDialog = page.getByRole('dialog');
  await noteDialog.getByLabel('Not').fill('Playwright gerçek API notu');
  await noteDialog.getByRole('button', { name: 'Notu ekle' }).click();
  await expect(page.getByText('Operasyonel not eklendi.')).toBeVisible();

  await page.getByRole('button', { name: 'Sil' }).click();
  const deactivateDialog = page.getByRole('dialog');
  await deactivateDialog.getByRole('button', { name: 'Pasife al' }).click();
  await expect(page.getByText('Danışan kaydı pasife alındı.')).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-client-id]').filter({ hasText: unique })).toContainText('Pasif');
});
