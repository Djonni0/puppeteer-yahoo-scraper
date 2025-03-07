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
      headless: 'new', // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Render
      // Let Puppeteer use its bundled Chromium
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.tableContainer.yf-9ft13', { timeout: 10000 });
    await page.evaluate(() => {
      document.querySelectorAll('[data-ylk="elm:expand"]').forEach(btn => btn.click());
    });
    await page.waitForTimeout(1000);
    const html = await page.content();
    await browser.close();
    res.send(html);
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
});

app.listen(port, ()
