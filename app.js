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
    // Set User-Agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Wait longer for the table
    await page.waitForSelector('.tableContainer.yf-9ft13', { timeout: 30000 }); // 30 seconds
    await page.evaluate(() => {
      document.querySelectorAll('[data-ylk="elm:expand"]').forEach(btn => btn.click());
    });
    await page.waitForTimeout(2000); // Extra 2 seconds for expansion
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
