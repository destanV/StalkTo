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

## Recent Changes

### Version Updates
- **Multi-Currency Support**: Extended from single BTC tracking to BTC, ETH, and LTC
- **Rate Limit Optimization**: Increased fetch interval from 10 to 60 seconds to comply with CoinGecko's free tier limits
- **Health Checks**: Added MongoDB health checks for proper service startup order
- **UI Improvements**: Updated frontend to display all three cryptocurrencies with individual price boxes

### Technical Improvements
- Modified worker service to fetch multiple coins in single API call
- Updated API endpoints to return latest prices for all currencies
- Enhanced frontend with separate display sections for each coin
- Added proper error handling for API rate limits

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)

## Installation & Setup

1. **Clone or Download the Repository**
   ```bash
   git clone <repository-url>
   cd StalkTo-master
   ```

2. **Navigate to the Project Directory**
   ```bash
   cd btc-feed
   ```

3. **Start the Application**
   ```bash
   docker-compose up --build
   ```

   This command will:
   - Build all Docker images
   - Start MongoDB, API, Worker, and Frontend services
   - Set up networking between containers

4. **Access the Application**
   - **Web Dashboard**: http://localhost:80
   - **API Endpoint**: http://localhost:3000/api/price

## Usage

### Web Interface
Open http://localhost:80 in your browser to view the live price dashboard. The interface displays:
- Current prices for BTC, ETH, and LTC
- Last update timestamps
- Real-time price changes with visual indicators

### API Usage
Get the latest prices via REST API:

```bash
curl http://localhost:3000/api/price
```

Response format:
```json
{
  "BTCUSDT": {
    "timestamp": 1767015847000,
    "price": 87277.0,
    "pair": "BTCUSDT",
    "source": "CoinGecko",
    "_id": "..."
  },
  "ETHUSDT": {
    "timestamp": 1767015847000,
    "price": 2923.58,
    "pair": "ETHUSDT",
    "source": "CoinGecko",
    "_id": "..."
  },
  "LTCUSDT": {
    "timestamp": 1767015847000,
    "price": 77.3,
    "pair": "LTCUSDT",
    "source": "CoinGecko",
    "_id": "..."
  }
}
```

## Configuration

### Environment Variables
The services use the following environment variables (defined in docker-compose.yml):

- `MONGO_URI`: MongoDB connection string (default: mongodb://mongo:27017)
- `MONGO_DB_NAME`: Database name (default: btc_db)
- `PORT`: API server port (default: 3000)

### Price Update Frequency
Prices are fetched every 60 seconds. To modify this interval, edit the `time.sleep(60)` value in `services/worker-service/worker.py`.

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Ensure ports 80, 3000, and 27017 are available
   - Stop other services using these ports

2. **Rate Limit Errors**
   - The application is configured to avoid rate limits
   - If you encounter issues, the 60-second interval should resolve them

3. **Container Startup Issues**
   - Ensure Docker daemon is running
   - Check MongoDB health check passes before other services start

4. **Network Issues**
   - Verify internet connectivity for API calls
   - Check Docker network configuration

### Logs
View service logs:
```bash
docker-compose logs [service-name]
```

Available services: mongo, api, worker, frontend

## Development

### Project Structure
```
btc-feed/
├── docker-compose.yml
├── services/
│   ├── api-service/
│   │   ├── index.js          # Main API server
│   │   ├── endpoints.js      # API routes
│   │   ├── cfg.js           # Configuration
│   │   ├── models/Price.js  # MongoDB model
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── worker-service/
│   │   ├── worker.py        # Price fetching service
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── frontend-service/
│       ├── index.html       # Web interface
│       └── Dockerfile
└── README.md
```

### Adding New Cryptocurrencies
1. Update the `coins` list in `worker.py`
2. Add corresponding pair mappings
3. Update frontend HTML and JavaScript
4. Modify API response structure if needed

## API Reference

### CoinGecko API
The application uses CoinGecko's free API. For higher rate limits, consider their paid plans.

### Socket.IO Events
- `price_update`: Emits latest prices for all currencies every 10 seconds

## License

This project is open source. Please check the license file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
- Check the troubleshooting section
- Review Docker and service logs
- Ensure all prerequisites are met