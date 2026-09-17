let properties = [];
let selectedProperty = null;

const listingsEl = document.getElementById('listings');
const dialog = document.getElementById('bookingDialog');
const dialogTitle = document.getElementById('dialogTitle');
const nightsInput = document.getElementById('nightsInput');
const totalPriceEl = document.getElementById('totalPrice');
const errorMsg = document.getElementById('errorMsg');

async function loadProperties() {
  listingsEl.innerHTML = '<p role="status">Loading properties...</p>';

  try {
    const res = await fetch('/api/properties');
    if (!res.ok) {
      throw new Error('Could not load properties');
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid properties response');
    }

    properties = data;
    renderListings();
  } catch (err) {
    listingsEl.innerHTML = `
      <p role="alert">Properties are temporarily unavailable.</p>
      <button type="button" id="retryBtn">Try again</button>
    `;
    document.getElementById('retryBtn').addEventListener('click', loadProperties);
  }
}

function renderListings() {
  listingsEl.innerHTML = properties.map((p) => `
    <div class="card">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="village">${p.village}</p>
        <p class="desc">${p.description}</p>
        <p class="price">€${p.pricePerNight} / night · up to ${p.guests} guests</p>
        <button data-id="${p.id}" class="book-btn">Book now</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.book-btn').forEach((btn) => {
    btn.addEventListener('click', () => openDialog(btn.dataset.id));
  });
}

function openDialog(id) {
  selectedProperty = properties.find((p) => p.id === id);
  dialogTitle.textContent = selectedProperty.name;
  nightsInput.value = 2;
  errorMsg.textContent = '';
  updateTotal();
  dialog.showModal();
}

function updateTotal() {
  const nights = Number(nightsInput.value) || 1;
  totalPriceEl.textContent = `Total: €${(selectedProperty.pricePerNight * nights).toFixed(2)}`;
}

nightsInput.addEventListener('input', updateTotal);
document.getElementById('closeDialogBtn').addEventListener('click', () => dialog.close());

document.getElementById('payBtn').addEventListener('click', async () => {
  errorMsg.textContent = '';
  const nights = Number(nightsInput.value) || 1;

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: selectedProperty.id, nights })
    });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      errorMsg.textContent = data.error || 'Something went wrong.';
    }
  } catch (err) {
    errorMsg.textContent = 'Network error, please try again.';
  }
});

loadProperties();
