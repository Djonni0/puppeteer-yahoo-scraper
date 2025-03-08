const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 10000;

const FMP_API_KEY = 'e2evLu4fXTkEU8AQxCd6wX3zRPVal7Cx';

app.get('/fetch', async (req, res) => {
  const { ticker, dataType } = req.query;
  const urlMap = {
    'balance': `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${FMP_API_KEY}`,
    'income': `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?apikey=${FMP_API_KEY}`,
    'cash': `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${FMP_API_KEY}`
  };
  const url = urlMap[dataType] || urlMap['balance'];

  try {
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, text: ${await response.text()}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data || data.length === 0) {
      console.log('No data returned from FMP API');
      res.status(500).send('No financial data available');
      return;
    }

    // Build HTML table
    let output = '<table border="1"><tr><th>Breakdown</th>';
    const dates = data.map(item => item.date).reverse();
    dates.forEach(date => output += `<th>${date}</th>`);
    output += '</tr>';

    const metrics = {};
    data.forEach(statement => {
      Object.entries(statement).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'cik' && !key.includes('link')) {
          metrics[key] = metrics[key] || { values: [] };
          metrics[key].values.push(value);
        }
      });
    });

    Object.entries(metrics).forEach(([key, { values }]) => {
      output += `<tr><td>${key.replace(/([A-Z])/g, ' $1').trim()}</td>`;
      values.reverse().forEach(value => output += `<td>${value.toLocaleString()}</td>`);
      output += '</tr>';
    });
    output += '</table>';

    console.log('Generated table from FMP API data');
    console.log('Sample output (first 500 chars):', output.substring(0, 500));
    res.send(output);
  } catch (e) {
    console.error('Error fetching data from FMP:', e.message);
    res.status(500).send(`Error: ${e.message}`);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
