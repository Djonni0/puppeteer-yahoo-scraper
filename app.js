const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 10000;

// Fetch the API key from environment variables
const FMP_API_KEY = process.env.FMP_API_KEY;

app.get('/fetch', async (req, res) => {
  const { ticker, category } = req.query; // 'ticker' and 'category' query parameters

  // Validate ticker and category
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required' });
  }
  if (!category || !['balance', 'income', 'cash'].includes(category)) {
    return res.status(400).json({ error: 'Valid category is required (balance, income, cash)' });
  }

  // URLs for financial data
  const urls = {
    balance: `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${FMP_API_KEY}`,
    income: `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?apikey=${FMP_API_KEY}`,
    cash: `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${FMP_API_KEY}`
  };

  try {
    const results = {};

    // Fetch the requested category data
    const url = urls[category];
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error for ${category}! status: ${response.status}`);
      throw new Error(`HTTP error for ${category}! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      results[category] = 'No data available';
    } else {
      results[category] = data;
    }

    // Respond with the structured JSON data
    res.json(results);
  } catch (e) {
    console.error('Error fetching data from FMP:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
