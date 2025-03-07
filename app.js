const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3000;

app.get('/fetch', async (req, res) => {
  const { ticker, dataType } = req.query;
  const urlMap = {
    'balance': `https://finance.yahoo.com/quote/${ticker}/balance-sheet?p=${ticker}`,
    'income': `https://finance.yahoo.com/quote/${ticker}/financials?p=${ticker}`,
    'cash': `https://finance.yahoo.com/quote/${ticker}/cash-flow?p=${ticker}`
  };
  const url = urlMap[dataType] || urlMap['balance'];

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080' // Mimic real viewport
      ],
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium'
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    await page.setViewport({ width: 1920, height: 1080 });
    // Enhanced stealth
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      window.chrome = { runtime: {} };
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Handle cookie consent
    const consentButtonSelector = 'button[name="agree"].accept-all';
    const fallbackSelectors = [
      '.btn.secondary.accept-all',
      'button:contains("Alle akzeptieren")',
      'button:contains("Accept All")',
      'button:contains("Zustimmen")'
    ];
    let consentClicked = false;
    let attempts = 0;
    const maxAttempts = 2;

    while (!consentClicked && attempts < maxAttempts) {
      try {
        await page.waitForSelector(consentButtonSelector, { timeout: 10000 });
        await page.evaluate((selector) => {
          const button = document.querySelector(selector);
          if (button) {
            button.click();
            button.dispatchEvent(new Event('click', { bubbles: true }));
          }
        }, consentButtonSelector);
        consentClicked = true;
        console.log('Clicked primary consent button: button[name="agree"].accept-all');
        await page.waitForTimeout(30000);
        const htmlPostClick = await page.content();
        console.log('HTML post-consent click (first 500 chars):', htmlPostClick.substring(0, 500));
        if (htmlPostClick.includes('Yahooist Teil der Yahoo Markenfamilie')) {
          console.log('Still on consent page, retrying...');
          consentClicked = false;
        }
      } catch (e) {
        console.log('Primary consent selector failed:', e.message);
        for (const selector of fallbackSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.evaluate((sel) => {
              const button = document.querySelector(sel);
              if (button) {
                button.click();
                button.dispatchEvent(new Event('click', { bubbles: true }));
              }
            }, selector);
            consentClicked = true;
            console.log(`Clicked fallback consent button: ${selector}`);
            await page.waitForTimeout(30000);
            const htmlPostClick = await page.content();
            console.log('HTML post-consent click (first 500 chars):', htmlPostClick.substring(0, 500));
            if (htmlPostClick.includes('Yahooist Teil der Yahoo Markenfamilie')) {
              console.log('Still on consent page, retrying...');
              consentClicked = false;
            }
            break;
          } catch (fallbackError) {
            console.log(`Fallback selector ${selector} failed:`, fallbackError.message);
          }
        }
      }
      attempts++;
    }

    if (consentClicked) {
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Consent accepted, page navigated');
      } catch (navError) {
        console.log('Navigation after consent timed out, proceeding anyway:', navError.message);
      }
    } else {
      console.log('No consent button worked after retries, proceeding anyway');
    }

    await page.waitForSelector('body', { timeout: 60000 });
    console.log('Body loaded');

    try {
      const tableSelector = '.tableContainer.yf-9ft13';
      await page.waitForSelector(tableSelector, { timeout: 90000 });
      console.log('Found table container');

      // Click all individual expand buttons with full event chain
      let expandedCount = 0;
      const maxLevels = 5;
      for (let level = 0; level < maxLevels; level++) {
        const expandButtons = await page.$$('.tableContainer.yf-9ft13 button[data-ylk^="elm:expand"]');
        console.log(`Level ${level}: Found ${expandButtons.length} expand buttons`);
        if (expandButtons.length === 0 && level > 0) break;

        for (const button of expandButtons) {
          try {
            await button.evaluate(b => {
              b.dispatchEvent(new Event('mousedown', { bubbles: true }));
              b.click();
              b.dispatchEvent(new Event('mouseup', { bubbles: true }));
            });
            expandedCount++;
            await page.waitForTimeout(5000); // Increased wait for JS
            console.log(`Clicked expand button ${expandedCount} with full event chain`);
          } catch (e) {
            console.log(`Error clicking expand button ${expandedCount}: ${e.message}`);
          }
        }

        const nestedRows = await page.$$(`.row.lv-${level + 1}`);
        console.log(`Level ${level}: Found ${nestedRows.length} lv-${level + 1} rows`);
        if (nestedRows.length > 0) {
          console.log(`Nested rows detected at lv-${level + 1}`);
        }
      }
      console.log(`Total expanded ${expandedCount} individual buttons`);

      // Verify deepest level
      const deepestRowSelector = '.row.lv-4';
      try {
        await page.waitForSelector(deepestRowSelector, { timeout: 60000, visible: true });
        console.log('Deepest nested rows (lv-4) confirmed visible');
      } catch (e) {
        console.log('Deepest rows not found, proceeding with available HTML:', e.message);
      }

      const html = await page.content();
      console.log('Page content fetched successfully');
      console.log('Final HTML snippet (first 2000 chars):', html.substring(0, 2000));
      await browser.close();
      res.send(html);
    } catch (tableError) {
      console.error('Table or expansion error:', tableError.message);
      const htmlAfterAttempt = await page.content();
      console.log('HTML after expansion attempt (first 2000 chars):', htmlAfterAttempt.substring(0, 2000));
      await browser.close();
      res.send(`Expansion failed, but here’s the HTML: ${htmlAfterAttempt}`);
    }
  } catch (e) {
    console.error('Error fetching page:', e.message);
    res.status(500).send(`Error: ${e.message}`);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
