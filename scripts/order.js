// United Coffee — order page (checkout shell)
// Adapted from MochaLounge: same flow, single location, United hours, UC- order IDs.
(() => {
  if (!window.UnitedCart) return;
  const { read, total, remove, clear, itemTotal } = window.UnitedCart;

  const summaryEl = document.getElementById('orderSummary');
  const totalEl = document.getElementById('orderTotal');
  const subtotalEl = document.getElementById('orderSubtotal');
  const taxEl = document.getElementById('orderTax');
  const placeBtn = document.getElementById('placeOrder');
  const checkoutShell = document.getElementById('checkoutShell');
  const successShell = document.getElementById('successShell');
  const successTotal = document.getElementById('successTotal');
  const successId = document.getElementById('successId');
  const successMethod = document.getElementById('successMethod');
  const successTime = document.getElementById('successTime');
  const timeSelect = document.getElementById('pickup-time');
  const hoursNote = document.getElementById('hoursNote');

  const TAX_RATE = 0.07;

  // United Coffee hours per weekday (0=Sun, 6=Sat) — verified from public listings.
  const HOURS = {
    0: { open: '8:00', close: '15:00', label: '8a — 3p' },
    1: { open: '6:30', close: '18:00', label: '6:30a — 6p' },
    2: { open: '6:30', close: '18:00', label: '6:30a — 6p' },
    3: { open: '6:30', close: '18:00', label: '6:30a — 6p' },
    4: { open: '6:30', close: '18:00', label: '6:30a — 6p' },
    5: { open: '6:30', close: '18:00', label: '6:30a — 6p' },
    6: { open: '7:00', close: '17:00', label: '7a — 5p' }
  };

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

  // ---------- Time slots ----------
  const fmtTime = (h, m) => {
    const am = h < 12;
    const hr = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    return hr + ':' + String(m).padStart(2, '0') + (am ? 'a' : 'p');
  };
  const parseHM = (s) => { const [h, m] = s.split(':').map(Number); return [h, m]; };
  const minutesFromMidnight = (h, m) => h * 60 + m;

  const buildSlots = () => {
    if (!timeSelect) return;
    const now = new Date();
    const day = now.getDay();
    const hours = HOURS[day];
    if (hoursNote) hoursNote.textContent = 'Open today · ' + hours.label;
    clearNode(timeSelect);

    const [openH, openM] = parseHM(hours.open);
    const [closeH, closeM] = parseHM(hours.close);
    const closeAbs = minutesFromMidnight(closeH, closeM);
    const openAbs = minutesFromMidnight(openH, openM);

    // Earliest pickup = max(now + 15min lead, open) rounded UP to 10-min
    const leadAbs = now.getHours() * 60 + now.getMinutes() + 15;
    let firstSlot = Math.max(leadAbs, openAbs);
    firstSlot = Math.ceil(firstSlot / 10) * 10;

    // Latest pickup = close - 10min
    const lastSlot = closeAbs - 10;

    if (firstSlot > lastSlot) {
      timeSelect.appendChild(el('option', { value: '' }, "Sorry — we're closed for today"));
      timeSelect.disabled = true;
      if (placeBtn) { placeBtn.disabled = true; placeBtn.style.opacity = '0.5'; }
      return;
    }

    // ASAP option
    timeSelect.appendChild(el('option', {
      value: 'asap:' + firstSlot
    }, 'ASAP — ready ~' + fmtTime(Math.floor(firstSlot / 60), firstSlot % 60)));

    // 10-minute intervals
    for (let m = firstSlot; m <= lastSlot; m += 10) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      timeSelect.appendChild(el('option', { value: 'slot:' + m }, fmtTime(h, min)));
    }
  };

  buildSlots();
  setInterval(buildSlots, 120000);

  // ---------- Cart rendering on order page ----------
  const renderModSummary = (mods) => {
    if (!mods || !mods.length) return null;
    const text = mods.map(m => m.label + (m.price > 0 ? ' +$' + m.price.toFixed(2) : '')).join(' · ');
    return el('div', { class: 'cart-item-mods' }, text);
  };

  const renderEmpty = () => {
    const link = el('a', { href: 'menu.html', class: 'btn btn-primary btn-arrow', style: 'margin-top:1.5rem; display:inline-flex;' }, 'Browse Menu');
    return el('div', { class: 'cart-empty', style: 'padding: 4rem 2rem;' },
      el('div', { style: 'font-family: var(--font-display); font-size: 3rem; color: var(--border-strong); margin-bottom: 1rem;' }, '∅'),
      el('p', { style: 'font-family: var(--font-display); text-transform: uppercase; font-size: 1.1rem;' }, 'No items yet'),
      el('p', { class: 'mt-3', style: 'font-size: 0.9rem; color: var(--text-dim);' }, 'Head back to the menu to add a few things.'),
      link
    );
  };

  const renderLine = (i) => {
    const rmBtn = el('button', { class: 'cart-remove', dataset: { act: 'rm' }, 'aria-label': `Remove ${i.name}` }, '×');
    return el('div', { class: 'summary-line', dataset: { id: i.id } },
      el('div', {},
        el('div', {},
          el('span', { class: 'qty-tag' }, '×' + i.qty),
          document.createTextNode(i.name)
        ),
        renderModSummary(i.modifiers)
      ),
      el('span', { style: 'display:flex; align-items:center; gap: 0.6rem; flex-shrink: 0;' },
        el('span', { style: 'color: var(--rosso);' }, '$' + itemTotal(i).toFixed(2)),
        rmBtn
      )
    );
  };

  const render = () => {
    if (!summaryEl) return;
    const state = read();
    clearNode(summaryEl);
    if (state.items.length === 0) {
      summaryEl.appendChild(renderEmpty());
      if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.style.opacity = '0.5';
        placeBtn.style.cursor = 'not-allowed';
      }
      if (totalEl) totalEl.textContent = '$0.00';
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (taxEl) taxEl.textContent = '$0.00';
      return;
    }
    state.items.forEach(i => summaryEl.appendChild(renderLine(i)));
    const sub = total(state);
    const tax = sub * TAX_RATE;
    if (subtotalEl) subtotalEl.textContent = '$' + sub.toFixed(2);
    if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + (sub + tax).toFixed(2);
    // Mirror total in sticky panel
    const mirror = document.getElementById('orderTotal-mirror');
    if (mirror) mirror.textContent = '$' + (sub + tax).toFixed(2);
    if (placeBtn && !timeSelect?.disabled) {
      placeBtn.disabled = false;
      placeBtn.style.opacity = '';
      placeBtn.style.cursor = '';
    }
  };

  summaryEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act="rm"]');
    if (!btn) return;
    const id = btn.closest('.summary-line').dataset.id;
    remove(id);
    render();
  });

  document.addEventListener('cart:change', render);
  render();

  // ---------- Submit ----------
  const form = document.getElementById('orderForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = read();
    if (state.items.length === 0) return;
    const data = new FormData(form);
    const method = data.get('method') === 'curbside' ? 'Curbside' : 'In-person';
    const timeRaw = data.get('time') || '';
    let timeLabel = '—';
    const timeMatch = timeRaw.match(/^(asap|slot):(\d+)$/);
    if (timeMatch) {
      const mins = parseInt(timeMatch[2], 10);
      timeLabel = fmtTime(Math.floor(mins / 60), mins % 60);
      if (timeMatch[1] === 'asap') timeLabel = 'ASAP — ' + timeLabel;
    }
    const sub = total(state);
    const grand = sub * (1 + TAX_RATE);
    const orderId = 'UC-' + Date.now().toString(36).toUpperCase().slice(-6);
    if (successId) successId.textContent = 'Order #' + orderId;
    if (successMethod) successMethod.textContent = method;
    if (successTime) successTime.textContent = timeLabel;
    if (successTotal) successTotal.textContent = '$' + grand.toFixed(2);
    if (checkoutShell) checkoutShell.style.display = 'none';
    if (successShell) successShell.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clear();
  });
})();
