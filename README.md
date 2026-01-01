# Cryptocurrency Price Tracker

A real-time cryptocurrency price tracking application that displays live prices for Bitcoin (BTC), Ethereum (ETH), and Litecoin (LTC) using the CoinGecko API.

## Features

- **Real-time Price Updates**: Fetches prices every 60 seconds from CoinGecko API
- **Multi-Currency Support**: Tracks BTC, ETH, and LTC prices simultaneously
- **Web Dashboard**: Clean HTML interface with live price display
- **REST API**: JSON API endpoint for price data
- **WebSocket Integration**: Real-time updates using Socket.IO
- **MongoDB Storage**: Persistent price history storage

## Architecture

The application consists of four Docker services:

- **MongoDB**: Database for storing price data
- **API Service**: Node.js/Express API server with Socket.IO
- **Worker Service**: Python service that fetches prices from CoinGecko
- **Frontend Service**: Nginx web server serving the HTML dashboard
