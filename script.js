/* ==========================================================================
   Dynamic State Management, Real-time Calculations, DOM Operations, 
   Animations, and localStorage Persistence
   ========================================================================== */

// Default pre-filled data as requested
const defaultItems = [
  { id: "1", name: "Glasses", price: 4, qty: 1, shipping: 0, status: "to-pay" },
  { id: "2", name: "Elastic", price: 32, qty: 1, shipping: 0, status: "to-pay" },
  { id: "3", name: "Earbuds", price: 149, qty: 1, shipping: 15, status: "to-pay" },
  { id: "4", name: "Sugar Dolls", price: 149, qty: 1, shipping: 10, status: "paid" }
];

// State Variables
let items = [];
let currentFilter = 'all';
let targetBudget = 500;

// Previous totals stored for count-up animation reference
const prevTotals = {
  subtotal: 0,
  shipping: 0,
  paid: 0,
  toPay: 0,
  grand: 0
};

// DOM Elements
const itemListEl = document.getElementById('itemList');
const formEl = document.getElementById('addBudolForm');
const budgetInputEl = document.getElementById('budgetInput');
const budgetProgressBarEl = document.getElementById('budgetProgressBar');
const budgetWarningEl = document.getElementById('budgetWarning');
const resetDataBtn = document.getElementById('resetDataBtn');
const filterTabs = document.querySelectorAll('.filter-tab');

// Display elements for calculated totals
const totalSubtotalEl = document.getElementById('totalSubtotal');
const totalShippingEl = document.getElementById('totalShipping');
const totalPaidEl = document.getElementById('totalPaid');
const totalToPayEl = document.getElementById('totalToPay');
const grandTotalEl = document.getElementById('grandTotal');

// 1. Initialization
function init() {
  loadDataFromStorage();
  setupEventListeners();
  renderApp();
}

// Load from LocalStorage
function loadDataFromStorage() {
  const savedItems = localStorage.getItem('budol_items');
  const savedBudget = localStorage.getItem('budol_budget');

  if (savedItems) {
    try {
      items = JSON.parse(savedItems);
    } catch(e) {
      items = [...defaultItems];
    }
  } else {
    items = [...defaultItems];
  }

  if (savedBudget) {
    targetBudget = parseFloat(savedBudget) || 500;
    budgetInputEl.value = targetBudget;
  }
}

// Save to LocalStorage
function saveDataToStorage() {
  localStorage.setItem('budol_items', JSON.stringify(items));
  localStorage.setItem('budol_budget', targetBudget);
}

// 2. Real-time Calculations & Animated Count-up Updates
function updateCalculations() {
  let subtotal = 0;
  let shipping = 0;
  let paid = 0;
  let toPay = 0;

  items.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    const itemTotal = itemSubtotal + item.shipping;

    subtotal += itemSubtotal;
    shipping += item.shipping;

    if (item.status === 'paid') {
      paid += itemTotal;
    } else {
      toPay += itemTotal;
    }
  });

  const grand = subtotal + shipping;

  // Animate counts
  animateCount(totalSubtotalEl, prevTotals.subtotal, subtotal);
  animateCount(totalShippingEl, prevTotals.shipping, shipping);
  animateCount(totalPaidEl, prevTotals.paid, paid);
  animateCount(totalToPayEl, prevTotals.toPay, toPay);
  animateCount(grandTotalEl, prevTotals.grand, grand);

  // Save values for future animation steps
  prevTotals.subtotal = subtotal;
  prevTotals.shipping = shipping;
  prevTotals.paid = paid;
  prevTotals.toPay = toPay;
  prevTotals.grand = grand;

  // Update budget progress bar states
  updateBudgetUI(grand);
}

// Smooth count-up animation function
function animateCount(element, start, end) {
  if (start === end) {
    element.textContent = `₱${end.toFixed(2)}`;
    return;
  }

  const duration = 300;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentVal = start + (end - start) * progress;

    element.textContent = `₱${currentVal.toFixed(2)}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `₱${end.toFixed(2)}`;
    }
  }

  requestAnimationFrame(update);
}

// Dynamic Budget & Progress Bar logic
function updateBudgetUI(grandTotal) {
  if (!targetBudget || targetBudget <= 0) {
    budgetProgressBarEl.style.width = '0%';
    budgetWarningEl.textContent = '';
    return;
  }

  const percentage = (grandTotal / targetBudget) * 100;
  const displayWidth = Math.min(percentage, 100);

  budgetProgressBarEl.style.width = `${displayWidth}%`;

  // Color tier checks based on requirements
  if (percentage < 50) {
    budgetProgressBarEl.style.backgroundColor = 'var(--accent-soft-peach)';
    budgetWarningEl.textContent = '';
  } else if (percentage <= 100) {
    budgetProgressBarEl.style.backgroundColor = 'var(--accent-burnt-orange)';
    budgetWarningEl.textContent = '';
  } else {
    // Exceeded Budget
    budgetProgressBarEl.style.backgroundColor = 'var(--accent-burnt-orange)';
    budgetWarningEl.textContent = 'Teh, orange na budget mo!';
    
    // Trigger subtle shake animation
    budgetProgressBarEl.classList.remove('shake');
    void budgetProgressBarEl.offsetWidth; // Reflow trigger
    budgetProgressBarEl.classList.add('shake');
  }
}

// 3. Dynamic DOM Item Rendering
function renderApp() {
  updateCalculations();

  const filteredItems = items.filter(item => {
    if (currentFilter === 'all') return true;
    return item.status === currentFilter;
  });

  itemListEl.innerHTML = '';

  if (filteredItems.length === 0) {
    itemListEl.innerHTML = `
      <div class="empty-state">
        No items found in this section.
      </div>
    `;
    return;
  }

  filteredItems.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.dataset.id = item.id;

    const totalItemCost = (item.price * item.qty) + item.shipping;

    itemCard.innerHTML = `
      <div class="item-details">
        <div class="item-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
        <div class="item-meta">
          ₱${item.price.toFixed(2)} ${item.shipping > 0 ? `+ ₱${item.shipping.toFixed(2)} SF` : ''}
        </div>
      </div>
      <div class="item-right">
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
        <div class="price-tag">
          <div class="price-amount">₱${totalItemCost.toFixed(2)}</div>
          <span class="status-badge ${item.status}" onclick="toggleStatus('${item.id}')">
            ${item.status === 'paid' ? 'Paid' : 'To Pay'}
          </span>
        </div>
        <button class="btn-delete" onclick="removeItem('${item.id}', this)" title="Delete Item">&times;</button>
      </div>
    `;

    itemListEl.appendChild(itemCard);
  });
}

// Utility helper to prevent HTML injection
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// 4. State Modification Actions
window.changeQty = function(id, delta) {
  const item = items.find(i => i.id === id);
  if (item) {
    const newQty = item.qty + delta;
    if (newQty >= 1) {
      item.qty = newQty;
      saveDataToStorage();
      renderApp();
    }
  }
};

window.toggleStatus = function(id) {
  const item = items.find(i => i.id === id);
  if (item) {
    item.status = item.status === 'paid' ? 'to-pay' : 'paid';
    saveDataToStorage();
    renderApp();
  }
};

window.removeItem = function(id, buttonEl) {
  const card = buttonEl.closest('.item-card');
  card.classList.add('fade-out');

  setTimeout(() => {
    items = items.filter(i => i.id !== id);
    saveDataToStorage();
    renderApp();
  }, 300);
};

// 5. Event Listeners Setup
function setupEventListeners() {
  // Add Form Submission
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const qty = parseInt(document.getElementById('itemQty').value) || 1;
    const shipping = parseFloat(document.getElementById('itemShipping').value) || 0;
    const status = document.getElementById('itemStatus').value;

    if (!name) return;

    const newItem = {
      id: Date.now().toString(),
      name,
      price,
      qty,
      shipping,
      status
    };

    items.unshift(newItem);
    saveDataToStorage();
    renderApp();

    // Reset form inputs
    formEl.reset();
    document.getElementById('itemQty').value = '1';
    document.getElementById('itemShipping').value = '0';
  });

  // Budget Input Real-time Change
  budgetInputEl.addEventListener('input', (e) => {
    targetBudget = parseFloat(e.target.value) || 0;
    saveDataToStorage();
    updateCalculations();
  });

  // Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderApp();
    });
  });

  // Reset to Default Data
  resetDataBtn.addEventListener('click', () => {
    if (confirm('Reset items back to initial defaults?')) {
      items = JSON.parse(JSON.stringify(defaultItems));
      targetBudget = 500;
      budgetInputEl.value = targetBudget;
      saveDataToStorage();
      renderApp();
    }
  });
}

// Run Initialization on load
document.addEventListener('DOMContentLoaded', init);