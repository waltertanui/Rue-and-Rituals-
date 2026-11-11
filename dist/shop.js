
const photos = {
  blazer: 'photo-1594633312681-425c7b97ccd1',
  shirt: 'photo-1554568218-0f1715e72254',
  denim: 'photo-1541099649105-f69ad21f3246',
  serum: 'photo-1608248543803-ba4f8c70ae0b',
  cream: 'photo-1556229010-6c3f2c9ca5f8',
  lip: 'photo-1586495777744-4413f21062fa'
};
const catalog = [
  ['blazer', 'The Everyday Blazer', 'Clothing', 89, ['XS', 'S', 'M', 'L', 'XL'], 'A relaxed layer with room for a tee or a light knit.'],
  ['serum', 'Daily Glow Serum', 'Beauty', 36, ['30 mL'], 'A lightweight serum for the step before moisturizer.'],
  ['denim', 'Straight Leg Denim', 'Clothing', 74, ['24', '26', '28', '30', '32'], 'An easy straight-leg jean with a classic five-pocket cut.'],
  ['cream', 'Soft Reset Moisturizer', 'Beauty', 32, ['50 mL'], 'A smooth face cream for your morning or evening routine.'],
  ['shirt', 'The Cotton Tee', 'Clothing', 28, ['XS', 'S', 'M', 'L', 'XL'], 'A soft everyday tee with a simple crew neckline.'],
  ['lip', 'Sheer Lip Colour', 'Beauty', 22, ['Rose'], 'A buildable wash of rose colour for everyday wear.']
].map(([id, name, category, price, options, description]) => ({id, name, category, price: price * 100, options, description}));

const key = 'rue-ritual-bag-v1';
const find = id => catalog.find(product => product.id === id);
let cart = [];
try {
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(saved)) {
    cart = saved.filter(line => line && find(line.id)?.options.includes(line.option)
      && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99);
  }
} catch { /* The bag still works for this session. */ }

const products = document.querySelector('#products');
const dialog = document.querySelector('#modal');
const panel = document.querySelector('#panel');
const search = document.querySelector('#search');
const sort = document.querySelector('#sort');
const count = document.querySelector('#bag-count');
const toast = document.querySelector('#toast');
const currency = new Intl.NumberFormat('en-CA', {style:'currency', currency:'CAD'});
const money = cents => currency.format(cents / 100);
const photo = id => 'https://images.unsplash.com/' + photos[id] + '?auto=format&fit=crop&w=850&q=82';
let category = 'All';
let toastTimer;

function renderProducts() {
  const term = search.value.trim().toLowerCase();
  const results = catalog.filter(product => (category === 'All' || category === product.category)
    && [product.name, product.category, product.description].some(value => value.toLowerCase().includes(term)));
  if (sort.value === 'asc') results.sort((a, b) => a.price - b.price);
  if (sort.value === 'desc') results.sort((a, b) => b.price - a.price);
  products.innerHTML = results.map(product =>
    '<article><button class="photo" data-product="' + product.id + '" aria-label="View ' + product.name + '"><img loading="lazy" src="' + photo(product.id) + '" alt="' + product.name + '"></button>' +
    '<div class="product-info"><p class="eyebrow">' + product.category + '</p><div class="product-line"><h3><button data-product="' + product.id + '">' + product.name + '</button></h3><span class="price">' + money(product.price) + '</span></div></div></article>'
  ).join('') || '<p>No products match your search.</p>';
}

function updateBag() {
  count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  try { localStorage.setItem(key, JSON.stringify(cart)); } catch { /* Keep the in-memory bag. */ }
}

function openPanel(title, body) {
  panel.innerHTML = '<div class="panel-content"><div class="panel-head"><h2 id="panel-title">' + title +
    '</h2><button type="button" class="close" data-action="close" aria-label="Close">×</button></div>' + body + '</div>';
  dialog.setAttribute('aria-labelledby', 'panel-title');
  if (!dialog.open) dialog.showModal();
  panel.querySelector('.close').focus();
}

function detail(product) {
  const label = product.category === 'Clothing' ? 'Size' : 'Option';
  openPanel(product.name, '<img class="detail-image" src="' + photo(product.id) + '" alt="' + product.name +
    '"><p>' + product.description + '</p><p class="detail-price">' + money(product.price) +
    ' CAD</p><form id="add-form" data-id="' + product.id + '"><label>' + label +
    '<select name="option">' + product.options.map(option => '<option>' + option + '</option>').join('') +
    '</select></label><button class="primary full">Add to bag</button></form>');
}

function totals() {
  const subtotal = cart.reduce((sum, line) => sum + find(line.id).price * line.quantity, 0);
  const shipping = subtotal > 0 && subtotal <= 10000 ? 900 : 0;
  return {subtotal, shipping, total: subtotal + shipping};
}

function summary() {
  const {subtotal, shipping, total} = totals();
  return '<div class="totals"><div><span>Subtotal</span><span>' + money(subtotal) +
    '</span></div><div><span>Shipping</span><span>' + (shipping ? money(shipping) : 'Free') +
    '</span></div><div><span>Total (CAD)</span><span>' + money(total) + '</span></div></div>';
}

function bag(focusAction, index) {
  const lines = cart.map((line, index) => {
    const product = find(line.id);
    return '<div class="cart-line"><img src="' + photo(line.id) + '" alt=""><div><h3>' + product.name + '</h3><p>' + line.option +
      '</p><div class="stepper"><button data-action="minus" data-index="' + index + '" aria-label="Decrease quantity of ' + product.name + '">−</button><span>' + line.quantity +
      '</span><button data-action="plus" data-index="' + index + '" aria-label="Increase quantity of ' + product.name + '"' + (line.quantity >= 99 ? ' disabled' : '') +
      '>+</button></div></div><div class="line-price"><p>' + money(product.price * line.quantity) +
      '</p><button class="remove" data-action="remove" data-index="' + index + '">Remove</button></div></div>';
  }).join('');
  openPanel('Your bag', lines ? lines + summary() + '<button class="primary full" data-action="checkout">Checkout</button>' :
    '<p>Your bag is empty.</p><button class="primary full" data-action="close">Continue shopping</button>');
  if (focusAction) panel.querySelector('[data-action="' + focusAction + '"][data-index="' + index + '"]:not(:disabled)')?.focus();
}

function checkout() {
  if (!cart.length) return bag();
  openPanel('Checkout', '<button class="secondary" data-action="bag">← Back to bag</button><p class="note">Demo checkout. Use sample details. No payment is collected and no items ship.</p>' +
    '<form id="checkout-form"><button type="button" class="secondary" data-action="sample">Use sample details</button><div class="fields">' +
    '<label>First name<input name="first" required autocomplete="off" maxlength="80"></label><label>Last name<input name="last" required autocomplete="off" maxlength="80"></label>' +
    '<label class="wide">Email<input type="email" name="email" required autocomplete="off" maxlength="254"></label>' +
    '<label class="wide">Street address<input name="address" required autocomplete="off" maxlength="150"></label>' +
    '<label>City<input name="city" required autocomplete="off" maxlength="100"></label><label>Postal code<input name="postal" required autocomplete="off" maxlength="20"></label></div>' +
    summary() + '<button class="primary full">Place demo order</button></form>');
}

document.addEventListener('click', event => {
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    category = filter.dataset.filter;
    if (filter.tagName === 'A') search.value = '';
    document.querySelectorAll('.tabs button').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    renderProducts();
  }
  const productButton = event.target.closest('[data-product]');
  if (productButton) detail(find(productButton.dataset.product));
});
search.addEventListener('input', renderProducts);
sort.addEventListener('change', renderProducts);
document.querySelector('#open-bag').addEventListener('click', () => bag());

panel.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {action, index} = button.dataset;
  switch (action) {
    case 'close': dialog.close(); return;
    case 'bag': bag(); return;
    case 'checkout': checkout(); return;
    case 'sample': {
      const fields = panel.querySelector('#checkout-form').elements;
      const sample = {first:'Jamie',last:'Lee',email:'jamie@example.com',address:'123 Sample Street',city:'Vancouver',postal:'V6B 1A1'};
      Object.entries(sample).forEach(([name, value]) => { fields[name].value = value; });
      return;
    }
    default: {
      const line = cart[index];
      if (!line) return;
      if (action === 'remove' || (action === 'minus' && line.quantity === 1)) cart.splice(Number(index), 1);
      else if (action === 'plus') line.quantity = Math.min(line.quantity + 1, 99);
      else if (action === 'minus') line.quantity -= 1;
      updateBag();
      bag(action, index);
    }
  }
});

panel.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'add-form') {
    const id = form.dataset.id;
    const option = form.elements.option.value;
    const existing = cart.find(line => line.id === id && line.option === option);
    if (existing && existing.quantity >= 99) {
      form.querySelector('button').textContent = 'Bag limit reached';
      return;
    }
    if (existing) existing.quantity += 1;
    else cart.push({id, option, quantity: 1});
    updateBag();
    dialog.close();
    toast.textContent = find(id).name + ' added to your bag.';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ''; }, 2500);
  }
  if (form.id === 'checkout-form' && cart.length) {
    const orderId = 'RR-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const total = totals().total;
    cart = [];
    updateBag();
    openPanel('Order confirmed', '<p>Your demo order <strong>' + orderId + '</strong> is complete.</p><p>Order total <strong>' +
      money(total) + ' CAD</strong></p><p class="note">No payment was collected. Your checkout details were not saved.</p><button class="primary full" data-action="close">Continue shopping</button>');
  }
});

updateBag();
renderProducts();
