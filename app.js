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
    const consentButtonSelector = 'button[name="agree"], button[value="agree"], button:contains("Accept"), button:contains("Zustimmen")';
    try {
      await page.waitForSelector(consentButtonSelector, { timeout: 5000 });
      await page.click(consentButtonSelector);
      console.log('Clicked consent button');
      await page.waitForNavigation({ waitUntil: 'networkidle2' }); // Wait for page to load after consent
    } catch (consentError) {
      console.log('No consent prompt found or already passed:', consentError.message);
    }

    // Now wait for the table
    const htmlBefore = await page.content();
    console.log('HTML before selector (first 500 chars):', htmlBefore.substring(0, 500));
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
