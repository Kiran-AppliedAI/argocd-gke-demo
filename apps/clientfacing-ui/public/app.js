const inventoryList = document.getElementById("inventoryList");
const refreshButton = document.getElementById("refreshButton");
const statusPill = document.getElementById("statusPill");
const lastUpdated = document.getElementById("lastUpdated");
const backendInfo = document.getElementById("backendInfo");

backendInfo.textContent = `Proxy target: ${
  window.APP_CONFIG?.inventoryApiUrl || "not configured"
}`;

function renderItems(items) {
  inventoryList.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "inventory-card";
    card.innerHTML = `
      <div class="inventory-top">
        <h3>${item.name}</h3>
        <span class="badge">${item.status}</span>
      </div>
      <p>${item.category}</p>
      <dl class="metrics">
        <div><dt>SKU</dt><dd>${item.sku}</dd></div>
        <div><dt>Quantity</dt><dd>${item.quantity}</dd></div>
        <div><dt>Region</dt><dd>${item.region}</dd></div>
      </dl>
    `;
    inventoryList.appendChild(card);
  });
}

async function loadInventory() {
  statusPill.textContent = "Loading...";

  try {
    const response = await fetch("/api/inventory");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Inventory request failed");
    }

    renderItems(payload.items || []);
    statusPill.textContent = "Inventory loaded";
    lastUpdated.textContent = `Last updated: ${new Date(payload.generatedAt).toLocaleString()}`;
  } catch (error) {
    inventoryList.innerHTML = `
      <article class="inventory-card error-card">
        <h3>Inventory API unavailable</h3>
        <p>${error.message}</p>
      </article>
    `;
    statusPill.textContent = "Backend unavailable";
    lastUpdated.textContent = "Last updated: failed";
  }
}

refreshButton.addEventListener("click", loadInventory);
loadInventory();

