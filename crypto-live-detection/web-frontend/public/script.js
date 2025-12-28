let cachedCoins = [];

// Fetch backend service version
async function fetchVersion() {
	const el = document.getElementById("versionText");
	if (!el) return;
	try {
		const res = await fetch("/version");
		const v = await res.json();
		el.textContent = `${v.service} v${v.version} | commit: ${v.commit}`;
	} catch (e) {
		el.textContent = "Version unavailable";
	}
}

// Fetch cryptocurrency data from api-service
async function fetchCryptoData(searchTerm = "") {
	try {
		const url = searchTerm
			? `/api/coins?search=${encodeURIComponent(searchTerm)}`
			: `/api/coins`;

		const response = await fetch(url);
		const data = await response.json();
		return data.coins || [];
	} catch (error) {
		console.error('Error fetching cryptocurrency data:', error);
		return [];
	}
}

// Display cryptocurrency data in the table
function displayCryptoData(coins) {
	const cryptoTable = document.getElementById('cryptoTable');
	cryptoTable.innerHTML = '';

	coins.forEach(coin => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td><img src="${coin.iconUrl}" class="crypto-logo" alt="${coin.name}"></td>
			<td>${coin.name}</td>
			<td>${coin.symbol}</td>
			<td>$${coin.price}</td>
			<td>${coin.change}%</td>
			<td>${coin.volume ? coin.volume : '-'}</td>
			<td>${coin.marketCap ? coin.marketCap : '-'}</td>
		`;
		cryptoTable.appendChild(row);
	});
}

// Filter cryptocurrencies based on user input
function filterCryptoData(coins, searchTerm) {
	searchTerm = searchTerm.toLowerCase();

	const filteredCoins = coins.filter(coin =>
		coin.name.toLowerCase().includes(searchTerm) ||
		coin.symbol.toLowerCase().includes(searchTerm)
	);

	return filteredCoins;
}

// Handle search input
async function handleSearchInput() {
	const searchInput = document.getElementById('searchInput');
	const searchTerm = searchInput.value.trim();

	if (cachedCoins.length) {
		const filteredCoins = filterCryptoData(cachedCoins, searchTerm);
		displayCryptoData(filteredCoins);
		return;
	}

	const coins = await fetchCryptoData(searchTerm);
	displayCryptoData(coins);
}

// Alerts UI helpers
function addAlertLine(text) {
	const box = document.getElementById("alertsBox");
	const line = document.createElement("div");
	line.innerHTML = `<small>${text}</small>`;
	box.prepend(line);

	while (box.children.length > 30) {
		box.removeChild(box.lastChild);
	}
}

function connectAlertsWebSocket() {
	const proto = location.protocol === "https:" ? "wss" : "ws";
	const ws = new WebSocket(`${proto}://${location.host}/ws/alerts`);

	ws.onopen = () => addAlertLine("Connected to alert stream.");
	ws.onclose = () => addAlertLine("Alert stream disconnected.");
	ws.onerror = () => addAlertLine("Alert stream error.");

	ws.onmessage = (ev) => {
		try {
			const msg = JSON.parse(ev.data);
			if (msg.type === "alert") {
				addAlertLine(`ALERT: ${msg.symbol} change ${msg.change}% (rule: ${msg.rule})`);
			}
		} catch (e) {}
	};
}

// Initialize app
async function initializeApp() {
	await fetchVersion();

	const coins = await fetchCryptoData();
	cachedCoins = coins;
	displayCryptoData(coins);

	const searchInput = document.getElementById('searchInput');
	const searchButton = document.getElementById('searchButton');

	searchInput.addEventListener('input', handleSearchInput);
	searchButton.addEventListener('click', handleSearchInput);

	setInterval(async () => {
		const coins = await fetchCryptoData();
		cachedCoins = coins;
		displayCryptoData(coins);
	}, 15000);

	connectAlertsWebSocket();
}

document.addEventListener('DOMContentLoaded', initializeApp);
