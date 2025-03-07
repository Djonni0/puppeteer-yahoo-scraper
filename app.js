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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium'
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Handle cookie consent
    const consentButtonSelector = 'button[name="agree"]';
    const fallbackSelectors = [
      '.btn.primary',
      'button:contains("Zustimmen")',
      'button:contains("Accept All")',
      'button:contains("Alle akzeptieren")'
    ];
    let consentClicked = false;
    try {
      await page.waitForSelector(consentButtonSelector, { timeout: 10000 });
      await page.click(consentButtonSelector);
      consentClicked = true;
      console.log('Clicked primary consent button: button[name="agree"]');
    } catch (e) {
      console.log('Primary consent selector failed:', e.message);
      for (const selector of fallbackSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          await page.click(selector);
          consentClicked = true;
          console.log(`Clicked fallback consent button: ${selector}`);
          break;
        } catch (fallbackError) {
          console.log(`Fallback selector ${selector} failed:`, fallbackError.message);
        }
      }
    }

    if (consentClicked) {
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }); // Increase to 30s
        console.log('Consent accepted, page navigated');
      } catch (navError) {
        console.log('Navigation after consent timed out, proceeding anyway:', navError.message);
      }
    } else {
      console.log('No consent button found, proceeding anyway');
    }

    // Fetch the table
    const htmlBefore = await page.content();
    console.log('HTML after consent (first 500 chars):', htmlBefore.substring(0, 500));
    await page.waitForSelector('.tableContainer.yf-9ft13', { timeout: 30000 });
    await page.evaluate(() => {
      document.querySelectorAll('[data-ylk="elm:expand"]').forEach(btn => btn.click());
    });
    await page.waitForTimeout(2000);
    const html = await page.content();
    console.log('Page content fetched successfully');
    await browser.close();
    res.send(html);
  } catch (e) {
    console.error('Error fetching page:', e.message);
    res.status(500).send(`Error: ${e.message}`);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
