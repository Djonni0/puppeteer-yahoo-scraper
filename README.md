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

```
git clone https://github.com/Djonni0/puppeteer-yahoo-scraper.git
cd puppeteer-yahoo-scraper
Install Dependencies
```
npm install
```
Usage
Start the Application
```
npm start
```
This will start the application on the default port 10000.

Accessing the Scraper
To fetch financial data for a stock symbol, use the following URL format:

```
http://localhost:10000/fetch?ticker=AAPL
```
Replace AAPL with the ticker of the company you're interested in. The available financial data types are:

Balance Sheet
Income Statement
Cash Flow Statement
Docker Usage
Build the Docker Image
``` ```
docker build -t puppeteer-yahoo-scraper .
```
Run the Docker Container
``` ```

docker run -p 3000:3000 puppeteer-yahoo-scraper
Endpoints
/fetch
```
This endpoint accepts a query parameter ticker and returns the financial data in HTML format.

Example Request:

```
Copy
http://localhost:10000/fetch?ticker=AAPL

Deploying on Render.com
Render is a platform that can easily deploy Node.js applications. Here’s how you can deploy this application on Render:

Steps to Deploy:
Sign up for Render.com: Go to Render.com and sign up for an account.

Create a New Web Service:

Click on the "New" button and choose "Web Service".
Connect your GitHub repository where this project is stored.
Configure Your Service:

Environment: Select Node.
Branch: Choose main (or whichever branch you want to deploy).
Build Command: apt-get update && apt-get install -y chromium && npm install
Start Command: node app.js
Deploy:

Click "Create Web Service", and Render will start building and deploying your app.
Once the app is deployed, you'll receive a URL from Render where your app will be live.
Testing:

After the deployment is successful, visit the Render app URL (e.g., https://your-app.onrender.com/fetch?ticker=AAPL) to test if the application is working as expected.
