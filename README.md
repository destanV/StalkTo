# Cloud Computing Term Project: Cryptocurrency Price Tracker

A real-time cryptocurrency price tracking application that displays live prices for Bitcoin (BTC), Ethereum (ETH), and Litecoin (LTC) using the CoinGecko API.
Comprises of 4 microservices:
## Features

- **Price Updates**: Fetches prices every 60 seconds from CoinGecko API
- **Web Dashboard**: Clean HTML interface with live price display
- **REST API**: JSON API endpoint for price data
- **WebSocket**: Real time updates using Socket.IO
- **MongoDB**: Persistent price history storage
- **Kubernetes Environment**: Control Microservices via Kubernetes, monitor via Grafana
## Architecture

The application consists of four Docker services:

- **MongoDB**: Database for storing price
- **API Service**: Node.js Express server
- **Worker Service**: Python service that fetches prices from cGecko
- **Frontend Service**: Nginx
