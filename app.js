const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 10000;

// Retrieve API key from environment variables
const FMP_API_KEY = process.env.FMP_API_KEY;

if (!FMP_API_KEY) {
  console.error('FMP_API_KEY environment variable is missing!');
  process.exit(1); // Exit the app if the API key is not found
}

app.get('/fetch', async (req, res) => {
  const { ticker, categories } = req.query; // Get ticker and categories from query parameters

  // Default to all categories if none are provided
  const requestedCategories = categories ? categories.split(',') : ['balance', 'income', 'cash', 'ratios'];

  // Define the URLs for financial data (including ratios)
  const urls = {
    balance: `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${FMP_API_KEY}`,
    income: `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?apikey=${FMP_API_KEY}`,
    cash: `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${FMP_API_KEY}`,
    ratios: `https://financialmodelingprep.com/api/v3/financial-ratios/${ticker}?apikey=${FMP_API_KEY}`,
  };

  try {
    // Initialize an empty object to store the results
    const results = {};

    // Fetch only the requested categories
    for (const category of requestedCategories) {
      if (urls[category]) {
        console.log(`Fetching ${category} data from: ${urls[category]}`);
        const response = await fetch(urls[category]);
        if (!response.ok) {
          console.error(`HTTP error for ${category}! status: ${response.status}`);
          results[category] = []; // If there's an error, set the category to empty array
        } else {
          const data = await response.json();
          results[category] = data.length > 0 ? data : []; // Store the fetched data or empty array if no data
        }
      }
    }

    // Build combined HTML output for requested categories
    let output = '<html><body>';
    
    // Loop through the requested categories and generate the output
    for (const category of requestedCategories) {
      const data = results[category];

      if (data && data.length === 0) {
        output += `<h2>${category.charAt(0).toUpperCase() + category.slice(1)} Statement</h2><p>No data available</p>`;
        continue;
      }

      output += `<h2>${category.charAt(0).toUpperCase() + category.slice(1)} Statement</h2>`;
      output += `<table border="1" id="${category}"><tr><th>Breakdown</th>`;
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
