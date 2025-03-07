const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 10000;

const FMP_API_KEY = 'e2evLu4fXTkEU8AQxCd6wX3zRPVal7Cx';

app.get('/fetch', async (req, res) => {
  const { ticker } = req.query; // No dataType needed, fetching all
  const urls = {
    balance: `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${FMP_API_KEY}`,
    income: `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?apikey=${FMP_API_KEY}`,
    cash: `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${FMP_API_KEY}`
  };

  try {
    // Fetch all three statements
    const results = {};
    for (const [type, url] of Object.entries(urls)) {
      console.log(`Fetching ${type} data from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`HTTP error for ${type}! status: ${response.status}, text: ${await response.text()}`);
        throw new Error(`HTTP error for ${type}! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || data.length === 0) {
        console.log(`No ${type} data returned from FMP API`);
        results[type] = [];
      } else {
        results[type] = data;
      }
    }

    // Build combined HTML output
    let output = '<html><body>';
    
    for (const [type, data] of Object.entries(results)) {
      if (data.length === 0) {
        output += `<h2>${type.charAt(0).toUpperCase() + type.slice(1)} Statement</h2><p>No data available</p>`;
        continue;
      }

      output += `<h2>${type.charAt(0).toUpperCase() + type.slice(1)} Statement</h2>`;
      output += `<table border="1" id="${type}"><tr><th>Breakdown</th>`;
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
        const title = key.replace(/([A-Z])/g, ' $1').trim()
          .replace(/\b\w/g, c => c.toUpperCase());
        output += `<tr><td>${title}</td>`;
        values.reverse().forEach(value => output += `<td>${value.toLocaleString()}</td>`);
        output += '</tr>';
      });
      output += '</table>';
    }
    
    output += '</body></html>';

    console.log('Generated combined tables from FMP API data');
    console.log('Sample output (first 500 chars):', output.substring(0, 500));
    
    res.set('Content-Type', 'text/html');
    res.send(output);
  } catch (e) {
    console.error('Error fetching data from FMP:', e.message);
    res.status(500).send(`Error: ${e.message}`);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
