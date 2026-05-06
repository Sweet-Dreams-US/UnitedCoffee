// United Coffee — demo cart with per-item modifiers (localStorage)
// Adapted from MochaLounge's cart.js — same architecture, recolored to United's design tokens.
(() => {
  const KEY = 'unitedCart';

  // Modifier groups keyed by <section id="..."> on menu.html.
  // If a clicked menu-row sits inside a section whose id is here, the customize sheet opens
  // instead of just adding the item directly.
  const MODIFIERS = {
    espresso: [
      { name: 'Size', type: 'single', required: true, options: [
        { label: 'Piccolo (4 oz)', price: 0, default: true },
        { label: 'Doppio (8 oz)', price: 0.75 },
        { label: 'Grande (12 oz)', price: 1.25 }
      ]},
      { name: 'Milk', type: 'single', required: true, options: [
        { label: 'Whole', price: 0, default: true },
        { label: '2%', price: 0 },
        { label: 'Skim', price: 0 },
        { label: 'Oat', price: 0.75 },
        { label: 'Almond', price: 0.75 }
      ]},
      { name: 'Extras', type: 'multi', options: [
        { label: 'Extra shot', price: 1.00 },
        { label: 'Decaf', price: 0 },
        { label: 'Vanilla', price: 0.75 },
        { label: 'Hazelnut', price: 0.75 },
        { label: 'Lavender', price: 0.75 }
      ]}
    ],
    'brew-tea': [
      { name: 'Size', type: 'single', required: true, options: [
        { label: '12 oz', price: 0, default: true },
        { label: '16 oz', price: 0.75 }
      ]},
      { name: 'Milk', type: 'single', options: [
        { label: 'No milk', price: 0, default: true },
        { label: 'Whole', price: 0 },
        { label: 'Oat', price: 0.75 },
        { label: 'Almond', price: 0.75 }
      ]},
      { name: 'Add', type: 'multi', options: [
        { label: 'Extra shot', price: 1.00 },
        { label: 'Honey', price: 0 },
        { label: 'Lemon', price: 0 }
      ]}
    ],
    waffles: [
      { name: 'Add-ons', type: 'multi', options: [
        { label: 'Extra Nutella', price: 1.00 },
        { label: 'Extra berries', price: 1.50 },
        { label: 'Mascarpone cream', price: 1.25 },
        { label: 'Espresso shot', price: 1.00 }
      ]}
    ],
    savory: [
      { name: 'Side', type: 'single', required: true, options: [
        { label: 'No side', price: 0, default: true },
        { label: 'Insalata della casa', price: 3.50 },
        { label: 'Cup of soup', price: 3.50 }
      ]},
      { name: 'Add-ons', type: 'multi', options: [
        { label: 'Avocado', price: 1.50 },
        { label: 'Prosciutto', price: 2.00 },
        { label: 'Fried egg', price: 1.50 }
      ]}
    ],
    dolci: [
      { name: 'Warm it up', type: 'single', required: true, options: [
        { label: 'Room temp', price: 0, default: true },
        { label: 'Warmed', price: 0 }
      ]},
      { name: 'Add', type: 'multi', options: [
        { label: 'Butter', price: 0.50 },
        { label: 'Jam', price: 0.50 }
      ]}
    ]
  };

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { items: [] }; }
    catch { return { items: [] }; }
  };
  const writeState = (state) => localStorage.setItem(KEY, JSON.stringify(state));

  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sigOf = (name, mods) =>
    slug(name) + '|' + (mods || []).map(m => m.group + ':' + m.label).sort().join(';');

  const itemTotal = (i) =>
    (Number(i.basePrice) + (i.modifiers || []).reduce((s, m) => s + Number(m.price || 0), 0)) * i.qty;

  const add = (name, basePrice, modifiers = []) => {
    const state = read();
    const sig = sigOf(name, modifiers);
    const found = state.items.find(i => i.sig === sig);
    if (found) found.qty += 1;
    else state.items.push({
      sig,
      id: slug(name) + '-' + Date.now().toString(36),
      name,
      basePrice: Number(basePrice),
      modifiers,
      qty: 1
    });
    writeState(state);
    document.dispatchEvent(new CustomEvent('cart:change'));
  };
  const setQty = (id, qty) => {
    const state = read();
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) state.items = state.items.filter(i => i.id !== id);
    else item.qty = qty;
    writeState(state);
    document.dispatchEvent(new CustomEvent('cart:change'));
  };
  const removeItem = (id) => setQty(id, 0);
  const clear = () => { writeState({ items: [] }); document.dispatchEvent(new CustomEvent('cart:change')); };
  const total = (state = read()) => state.items.reduce((sum, i) => sum + itemTotal(i), 0);
  const count = (state = read()) => state.items.reduce((sum, i) => sum + i.qty, 0);

  window.UnitedCart = { read, add, setQty, remove: removeItem, clear, total, count, itemTotal };

  // ---------- Tiny DOM helper (no innerHTML, no XSS surface) ----------
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k === 'style') node.setAttribute('style', v);
      else if (k.startsWith('aria-')) node.setAttribute(k, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  };
  const clearNode = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };

  // ---------- Customize sheet (per-item modifiers) ----------
  const csOverlay = document.getElementById('customizeOverlay');
  const csSheet = document.getElementById('customizeSheet');
  const csName = document.getElementById('customizeName');
  const csBase = document.getElementById('customizeBase');
  const csBody = document.getElementById('customizeBody');
  const csClose = document.getElementById('customizeClose');
  const csAdd = document.getElementById('customizeAdd');
  const csAddPrice = document.getElementById('customizeAddPrice');

  let csCurrent = null;

  const openCustomize = (name, basePrice, groups) => {
    if (!csSheet) return;
    csCurrent = { name, basePrice, groups };
    csName.textContent = name;
    csBase.textContent = 'Starting at $' + basePrice.toFixed(2);
    clearNode(csBody);

    groups.forEach((group, gi) => {
      const groupEl = el('div', { class: 'mod-group' });
      const labelEl = el('div', { class: 'mod-group-label' },
        el('span', {}, group.name + (group.type === 'multi' ? '  ·  optional' : '')),
        group.required ? el('span', { class: 'req' }, 'Required') : null
      );
      groupEl.appendChild(labelEl);
      const opts = el('div', {
        class: 'mod-options' + (group.options.length === 3 ? ' mod-options-3' : '')
      });
      group.options.forEach((opt, oi) => {
        const inputAttrs = group.type === 'single'
          ? { type: 'radio', name: 'g' + gi }
          : { type: 'checkbox' };
        const isDefault = group.type === 'single' && (opt.default || (oi === 0 && !group.options.some(o => o.default)));
        const input = el('input', { ...inputAttrs, value: opt.label });
        if (isDefault) input.checked = true;
        const priceText = opt.price > 0 ? '+$' + opt.price.toFixed(2) : '';
        const optLabel = el('label', {
          class: 'mod-opt' + (isDefault ? ' is-checked' : ''),
          dataset: { group: group.name, label: opt.label, price: String(opt.price), type: group.type }
        }, input,
          el('span', { class: 'mod-name' }, opt.label),
          el('span', { class: 'mod-price' }, priceText)
        );
        input.addEventListener('change', () => syncChecked(group.name));
        opts.appendChild(optLabel);
      });
      groupEl.appendChild(opts);
      csBody.appendChild(groupEl);
    });
    syncTotal();
    csOverlay.classList.add('open');
    csSheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const syncChecked = (groupName) => {
    csBody.querySelectorAll(`.mod-opt[data-group="${CSS.escape(groupName)}"]`).forEach(opt => {
      opt.classList.toggle('is-checked', opt.querySelector('input').checked);
    });
    syncTotal();
  };

  const collectModifiers = () => {
    const mods = [];
    csBody.querySelectorAll('.mod-opt').forEach(opt => {
      if (!opt.querySelector('input').checked) return;
      mods.push({
        group: opt.dataset.group,
        label: opt.dataset.label,
        price: parseFloat(opt.dataset.price) || 0
      });
    });
    return mods;
  };

  const syncTotal = () => {
    if (!csCurrent) return;
    const mods = collectModifiers();
    const t = csCurrent.basePrice + mods.reduce((s, m) => s + m.price, 0);
    csAddPrice.textContent = '$' + t.toFixed(2);
  };

  const closeCustomize = () => {
    csOverlay?.classList.remove('open');
    csSheet?.classList.remove('open');
    csCurrent = null;
    document.body.style.overflow = '';
  };

  csClose?.addEventListener('click', closeCustomize);
  csOverlay?.addEventListener('click', closeCustomize);

  csAdd?.addEventListener('click', () => {
    if (!csCurrent) return;
    const mods = collectModifiers();
    add(csCurrent.name, csCurrent.basePrice, mods);
    closeCustomize();
  });

  // ---------- + buttons on menu rows ----------
  const flashAdded = (btn) => {
    btn.classList.add('added');
    btn.textContent = '✓';
    setTimeout(() => { btn.classList.remove('added'); btn.textContent = '+'; }, 900);
  };

  document.querySelectorAll('.menu-row').forEach(row => {
    const nameEl = row.querySelector('.menu-row-name');
    const priceEl = row.querySelector('.menu-row-price');
    if (!nameEl || !priceEl) return;
    const name = (nameEl.firstChild?.textContent || nameEl.textContent).trim();
    const price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0;
    const section = row.closest('section[id]');
    const groups = section ? MODIFIERS[section.id] : null;

    const btn = el('button', {
      class: 'menu-add', type: 'button',
      'aria-label': groups ? `Customize and add ${name}` : `Add ${name}`
    }, '+');
    btn.addEventListener('click', () => {
      if (groups && groups.length) {
        openCustomize(name, price, groups);
      } else {
        add(name, price);
        flashAdded(btn);
      }
    });
    row.appendChild(btn);
  });

  // ---------- FAB + Drawer ----------
  const fab = document.getElementById('cartFab');
  const fabCount = document.getElementById('cartFabCount');
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const drawerBody = document.getElementById('cartBody');
  const drawerFooter = document.getElementById('cartFooter');
  const closeBtn = document.getElementById('cartClose');
  const cartTotalEl = document.getElementById('cartTotal');

  const openDrawer = () => { drawer?.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeDrawer = () => { drawer?.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; };

  fab?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCustomize(); closeDrawer(); } });

  const renderEmpty = () => el('div', { class: 'cart-empty' },
    el('div', { class: 'display' }, '∅'),
    el('p', { style: 'font-family: var(--font-display); text-transform: uppercase; font-size: 1.1rem;' }, 'Cart is empty'),
    el('p', { class: 'mt-3', style: 'font-size: 0.9rem;' }, 'Add an espresso, a Liège waffle, a panino — anything from the menu.')
  );

  const renderModSummary = (mods) => {
    if (!mods || !mods.length) return null;
    const text = mods.map(m => m.label + (m.price > 0 ? ' +$' + m.price.toFixed(2) : '')).join(' · ');
    return el('div', { class: 'cart-item-mods' }, text);
  };

  const renderItem = (i) => {
    const decBtn = el('button', { class: 'qty-btn', dataset: { act: 'dec' }, 'aria-label': 'Decrease' }, '−');
    const incBtn = el('button', { class: 'qty-btn', dataset: { act: 'inc' }, 'aria-label': 'Increase' }, '+');
    const rmBtn = el('button', { class: 'cart-remove', dataset: { act: 'rm' } }, 'Remove');
    return el('div', { class: 'cart-item', dataset: { id: i.id } },
      el('div', {},
        el('div', { class: 'cart-item-name' }, i.name),
        renderModSummary(i.modifiers),
        el('div', { class: 'qty-control' }, decBtn, el('span', { class: 'qty-val' }, String(i.qty)), incBtn, rmBtn)
      ),
      el('div', { class: 'cart-item-price' }, '$' + itemTotal(i).toFixed(2))
    );
  };

  const renderDrawer = () => {
    if (!fab) return;
    const state = read();
    const c = count(state);
    if (c > 0) { fab.classList.add('visible'); if (fabCount) fabCount.textContent = String(c); }
    else fab.classList.remove('visible');
    if (!drawerBody) return;
    clearNode(drawerBody);
    if (state.items.length === 0) {
      drawerBody.appendChild(renderEmpty());
      if (drawerFooter) drawerFooter.style.display = 'none';
      return;
    }
    if (drawerFooter) drawerFooter.style.display = '';
    state.items.forEach(i => drawerBody.appendChild(renderItem(i)));
    if (cartTotalEl) cartTotalEl.textContent = '$' + total(state).toFixed(2);
  };

  drawerBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('.cart-item').dataset.id;
    const state = read();
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    if (btn.dataset.act === 'inc') setQty(id, item.qty + 1);
    else if (btn.dataset.act === 'dec') setQty(id, item.qty - 1);
    else if (btn.dataset.act === 'rm') removeItem(id);
  });

  document.addEventListener('cart:change', () => {
    renderDrawer();
    fab?.classList.add('bump');
    setTimeout(() => fab?.classList.remove('bump'), 500);
  });

  renderDrawer();
})();
