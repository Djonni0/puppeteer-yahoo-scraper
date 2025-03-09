const express = require('express');
const yahooFinance = require('yahoo-fin');  // Import Yahoo Finance API
const app = express();
const port = process.env.PORT || 10000;

app.get('/fetch', async (req, res) => {
    const { ticker, categories } = req.query;  // Fetch ticker and categories from query

    // Example categories: 'balance', 'income', 'cash', 'ratios'
    const validCategories = ['balance', 'income', 'cash', 'ratios'];
    if (!categories || !validCategories.includes(categories)) {
        return res.status(400).send('Invalid category, valid options: balance, income, cash, ratios');
    }

    try {
        let results = {};

        // Fetch different financial data based on the category
        if (categories === 'balance' || categories === 'all') {
            const balanceData = await yahooFinance.balanceSheet(ticker);
            results.balance = balanceData;
        }
        if (categories === 'income' || categories === 'all') {
            const incomeData = await yahooFinance.incomeStatement(ticker);
            results.income = incomeData;
        }
        if (categories === 'cash' || categories === 'all') {
            const cashFlowData = await yahooFinance.cashFlow(ticker);
            results.cash = cashFlowData;
        }
        if (categories === 'ratios' || categories === 'all') {
            const ratiosData = await yahooFinance.ratios(ticker);
            results.ratios = ratiosData;
        }

        // Combine the results into a single response
        if (Object.keys(results).length === 0) {
            return res.status(404).send('No financial data found for this category');
        }

        res.json(results);  // Return results in JSON format
    } catch (error) {
        console.error('Error fetching data from Yahoo Finance:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
