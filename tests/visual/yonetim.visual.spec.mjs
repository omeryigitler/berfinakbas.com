import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const resultsDirectory = path.resolve('tests/visual/results');
const currentScreenshot = path.join(resultsDirectory, 'yonetim-current.png');
const masksFile = path.join(resultsDirectory, 'yonetim-masks.json');

function requireAuthenticatedState() {
  if (!process.env.PLAYWRIGHT_STORAGE_STATE) {
    throw new Error(
      'PLAYWRIGHT_STORAGE_STATE must point to an authenticated admin storage-state file.',
    );
  }
}

async function collectDynamicRectangles(page) {
  const declaredRectangles = await page.locator('[data-visual-dynamic]').evaluateAll((elements) =>
    elements.flatMap((element) => {
      const box = element.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return [];
      return [
        {
          height: box.height,
          reason: element.getAttribute('data-visual-dynamic') || 'declared-dynamic',
          width: box.width,
          x: box.x,
          y: box.y,
        },
      ];
    }),
  );

  const detailTextRectangles = await page
    .getByTestId('client-detail-panel')
    .locator('*')
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        if (!(element instanceof HTMLElement)) return [];
        if (element.children.length !== 0) return [];
        if (!element.textContent?.trim()) return [];
        if (['BUTTON', 'H3', 'OPTION', 'PATH', 'SVG'].includes(element.tagName)) return [];
        const box = element.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0) return [];
        return [
          {
            height: box.height,
            reason: 'detail-live-text',
            width: box.width,
            x: box.x,
            y: box.y,
          },
        ];
      }),
    );

  const headerTextRectangles = await page
    .getByTestId('sales-hub-header')
    .locator('*')
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        if (!(element instanceof HTMLElement)) return [];
        if (element.children.length !== 0 || !element.textContent?.trim()) return [];
        if (element.tagName === 'BUTTON') return [];
        const box = element.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0) return [];
        return [
          {
            height: box.height,
            reason: 'authenticated-user',
            width: box.width,
            x: box.x,
            y: box.y,
          },
        ];
      }),
    );

  const processStages = await page.locator('#sales-hub-process > div').nth(1).boundingBox();
  const processRectangles = processStages
    ? [{ ...processStages, reason: 'client-process-state' }]
    : [];

  return [
    ...declaredRectangles,
    ...detailTextRectangles,
    ...headerTextRectangles,
    ...processRectangles,
  ];
}

test.beforeAll(() => {
  requireAuthenticatedState();
});

test('approved /yonetim structure has zero unexpected pixel differences', async ({ page }) => {
  await page.goto('/yonetim', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('sales-hub-dashboard')).toBeVisible();
  await expect(page.getByTestId('sales-hub-sidebar')).toHaveCount(1);
  await expect(page.getByTestId('sales-hub-header')).toHaveCount(1);
  await expect(page.getByTestId('client-portfolio-panel')).toHaveCount(1);
  await expect(page.getByTestId('client-detail-panel')).toHaveCount(1);

  const firstClient = page.locator('[data-client-id]').first();
  await expect(firstClient).toBeVisible();
  await firstClient.click();
  await expect(page.getByText('Danışan ayrıntıları yükleniyor...')).toBeHidden();

  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });

  await mkdir(resultsDirectory, { recursive: true });
  const rectangles = await collectDynamicRectangles(page);
  await writeFile(masksFile, `${JSON.stringify({ rectangles }, null, 2)}\n`, 'utf8');
  await page.screenshot({
    animations: 'disabled',
    fullPage: false,
    path: currentScreenshot,
  });

  execFileSync('python3', ['tests/visual/compare.py'], {
    stdio: 'inherit',
  });
});
