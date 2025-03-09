const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 10000;

const FMP_API_KEY = process.env.FMP_API_KEY;

if (!FMP_API_KEY) {
  console.error('FMP_API_KEY environment variable is missing!');
  process.exit(1);
}

app.get('/fetch', async (req, res) => {
  const { ticker, categories } = req.query;

  // Default to all categories if none are provided
  const requestedCategories = categories ? categories.split(',') : ['balance', 'income', 'cash', 'ratios'];

  // Define API URLs
  const urls = {
    balance: `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${FMP_API_KEY}`,
    income: `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?apikey=${FMP_API_KEY}`,
    cash: `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${FMP_API_KEY}`,
    ratios: `https://financialmodelingprep.com/api/v3/financial-ratios/${ticker}?apikey=${FMP_API_KEY}`,
  };

  try {
    const results = {};

    // Fetch only requested categories
    for (const category of requestedCategories) {
      if (urls[category]) {
        console.log(`Fetching ${category} data from: ${urls[category]}`);
        const response = await fetch(urls[category]);
        if (!response.ok) {
          console.error(`HTTP error for ${category}! status: ${response.status}`);
          results[category] = [];
        } else {
          const data = await response.json();
          results[category] = data.length > 0 ? data : [];
        }
      }
    }

    // Process financial ratios if requested
    if (requestedCategories.includes("value") || requestedCategories.includes("growth")) {
      const ratiosData = results.ratios[0]; // Get the most recent ratios data
      let output = `<h2>Stock Analysis (${ticker})</h2><table border="1"><tr><th>Metric</th><th>Value</th></tr>`;

      if (requestedCategories.includes("value")) {
        output += `<h3>Buffett Investing Style</h3>`;
        output += `<tr><td>P/E Ratio</td><td>${ratiosData.priceEarningsRatio || "N/A"}</td></tr>`;
        output += `<tr><td>P/B Ratio</td><td>${ratiosData.priceBookValueRatio || "N/A"}</td></tr>`;
        output += `<tr><td>ROE (%)</td><td>${(ratiosData.returnOnEquity * 100).toFixed(2) || "N/A"}%</td></tr>`;
        output += `<tr><td>ROIC (%)</td><td>${(ratiosData.returnOnInvestedCapital * 100).toFixed(2) || "N/A"}%</td></tr>`;
        output += `<tr><td>Debt-to-Equity</td><td>${ratiosData.debtEquityRatio || "N/A"}</td></tr>`;
      }

      if (requestedCategories.includes("growth")) {
        output += `<h3>Growth Investing Style</h3>`;
        output += `<tr><td>Revenue Growth (%)</td><td>${(ratiosData.revenueGrowth * 100).toFixed(2) || "N/A"}%</td></tr>`;
        output += `<tr><td>EPS Growth (%)</td><td>${(ratiosData.epsgrowth * 100).toFixed(2) || "N/A"}%</td></tr>`;
        output += `<tr><td>Gross Margin (%)</td><td>${(ratiosData.grossProfitMargin * 100).toFixed(2) || "N/A"}%</td></tr>`;
        output += `<tr><td>P/S Ratio</td><td>${ratiosData.priceToSalesRatio || "N/A"}</td></tr>`;
        output += `<tr><td>EV/EBITDA</td><td>${ratiosData.enterpriseValueOverEBITDA || "N/A"}</td></tr>`;
      }

      output += `</table>`;
      res.set('Content-Type', 'text/html');
      return res.send(output);
    }

    res.json(results);
  } catch (e) {
    console.error('Error fetching data from FMP:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
