# Puppeteer Yahoo Scraper

> A simple web scraper that uses Puppeteer to fetch financial data from Yahoo Finance.

## Description

This project provides a tool for scraping financial data using the [Puppeteer](https://github.com/puppeteer/puppeteer) library and displays it via a web service. The primary data sources are **balance sheet**, **income statement**, and **cash flow statement** from Financial Modeling Prep's API.

### Features
- Scrapes financial data from Financial Modeling Prep API.
- Displays data in HTML format.
- Retrieves balance sheet, income statement, and cash flow data.

---

## Requirements

- Node.js (version 18 or higher)
- Docker (if you want to use it with Docker)

---

## Setup

### Clone the Repository

```bash
git clone https://github.com/Djonni0/puppeteer-yahoo-scraper.git
cd puppeteer-yahoo-scraper
Install Dependencies
bash
Copy
npm install
Usage
Start the Application
bash
Copy
npm start
This will start the application on the default port 10000.

Accessing the Scraper
To fetch financial data for a stock symbol, use the following URL format:

bash
Copy
http://localhost:10000/fetch?ticker=AAPL
Replace AAPL with the ticker of the company you're interested in. The available financial data types are:

Balance Sheet
Income Statement
Cash Flow Statement
Docker Usage
Build the Docker Image
bash
Copy
docker build -t puppeteer-yahoo-scraper .
Run the Docker Container
bash
Copy
docker run -p 3000:3000 puppeteer-yahoo-scraper
Endpoints
/fetch
This endpoint accepts a query parameter ticker and returns the financial data in HTML format.

Example Request:

bash
Copy
http://localhost:10000/fetch?ticker=AAPL
