const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const selectAllEl = document.getElementById("cartSelectAll");
const deleteSelectedBtn = document.getElementById("cartDeleteSelected");
const orderButton = document.getElementById("cartOrderButton");

const summaryProductPrice = document.getElementById("summaryProductPrice");
const summaryShippingPrice = document.getElementById("summaryShippingPrice");
const summaryDiscountPrice = document.getElementById("summaryDiscountPrice");
const summaryProductDiscount = document.getElementById("summaryProductDiscount");
const summaryTotalPrice = document.getElementById("summaryTotalPrice");

const SHIPPING_PRICE = 2500;
const FREE_SHIPPING_THRESHOLD = 39900;

function formatPrice(value) {
  return Number(value || 0).toLocaleString("ko-KR") + "원";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getItemKey(item) {
  return [item.id, item.color, item.size].map(value => String(value || "")).join("__");
}

function getSelectedKeys() {
  return Array.from(document.querySelectorAll(".cart-item-check:checked")).map(input => input.value);
}

function getSelectedItems() {
  const selectedKeys = new Set(getSelectedKeys());
  return getCartItems().filter(item => selectedKeys.has(getItemKey(item)));
}

function calculateSummary(items) {
  const productTotal = items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);
  const shipping = productTotal > 0 && productTotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_PRICE : 0;
  return {
    count: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    productTotal,
    shipping,
    discount: 0,
    total: productTotal + shipping
  };
}

function updateSummary() {
  const selectedItems = getSelectedItems();
  const summary = calculateSummary(selectedItems);

  summaryProductPrice.textContent = formatPrice(summary.productTotal);
  summaryShippingPrice.textContent = formatPrice(summary.shipping);
  summaryDiscountPrice.textContent = formatPrice(summary.discount);
  summaryProductDiscount.textContent = formatPrice(summary.discount);
  summaryTotalPrice.textContent = formatPrice(summary.total);
  orderButton.textContent = summary.count + "건 주문하기";
  orderButton.disabled = summary.count === 0;
}

function renderCartItems() {
  const items = getCartItems();

  if (!items.length) {
    cartItemsEl.innerHTML = "";
    cartEmptyEl.hidden = false;
    selectAllEl.checked = false;
    selectAllEl.disabled = true;
    deleteSelectedBtn.disabled = true;
    updateSummary();
    return;
  }

  cartEmptyEl.hidden = true;
  selectAllEl.disabled = false;
  deleteSelectedBtn.disabled = false;

  cartItemsEl.innerHTML = items.map(item => {
    const key = getItemKey(item);
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const discountRate = Number(item.discountRate || 0);
    const optionText = [item.color, item.size, quantity + "개"].filter(Boolean).join(", ");
    const itemTotal = price * quantity;
    const discountHtml = discountRate > 0
      ? `<span class="cart-item-discount">${discountRate}%</span>`
      : "";

    return `
      <article class="cart-item" data-cart-key="${escapeHtml(key)}">
        <input class="cart-item-check" type="checkbox" value="${escapeHtml(key)}" checked aria-label="${escapeHtml(item.title)} 선택" />
        <a class="cart-item-image" href="${escapeHtml(item.url || "./product-detail.html")}">
          <img src="${escapeHtml(item.image || "./img/Favicon.png")}" alt="${escapeHtml(item.title)}" />
        </a>
        <div class="cart-item-info">
          <p class="cart-item-brand">${escapeHtml(item.brand || "EASE FIT")}</p>
          <p class="cart-item-title">${escapeHtml(item.title)}</p>
          <p class="cart-item-option">옵션 ${escapeHtml(optionText)}</p>
          <div class="cart-item-price">
            ${discountHtml}
            <strong class="cart-item-sale">${formatPrice(itemTotal)}</strong>
          </div>
          <div class="cart-quantity" aria-label="수량 변경">
            <button type="button" class="quantity-button" data-action="decrease" data-key="${escapeHtml(key)}" aria-label="수량 감소">-</button>
            <span>${quantity}</span>
            <button type="button" class="quantity-button" data-action="increase" data-key="${escapeHtml(key)}" aria-label="수량 증가">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <button type="button" class="cart-option-button">옵션/수량 변경</button>
          <button type="button" class="cart-buy-button">바로구매</button>
        </div>
        <button type="button" class="cart-item-remove" data-key="${escapeHtml(key)}" aria-label="상품 삭제">×</button>
        <div class="cart-item-delivery">${formatPrice(itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE)} | ${FREE_SHIPPING_THRESHOLD.toLocaleString("ko-KR")}원 이상 무료배송</div>
        <div class="cart-item-subtotal">
          <div><span>상품가격</span><strong>${formatPrice(itemTotal)}</strong></div>
          <div><span>배송비</span><strong>${formatPrice(itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE)}</strong></div>
          <div><span>할인내역</span><strong>0원</strong></div>
          <div><span>예상 결제 금액</span><strong>${formatPrice(itemTotal + (itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE))}</strong></div>
        </div>
      </article>
    `;
  }).join("");

  selectAllEl.checked = true;
  updateSummary();
}

function removeItemsByKeys(keys) {
  const keySet = new Set(keys);
  const nextItems = getCartItems().filter(item => !keySet.has(getItemKey(item)));
  saveCartItems(nextItems);
  renderCartItems();
  updateCartCount();
}

function updateItemQuantity(key, direction) {
  const items = getCartItems();
  const nextItems = items.map(item => {
    if (getItemKey(item) !== key) return item;
    const current = Number(item.quantity || 1);
    const nextQuantity = direction === "increase" ? current + 1 : Math.max(1, current - 1);
    return Object.assign({}, item, { quantity: nextQuantity });
  });
  saveCartItems(nextItems);
  renderCartItems();
  updateCartCount();
}

cartItemsEl.addEventListener("change", event => {
  if (!event.target.classList.contains("cart-item-check")) return;
  const checks = Array.from(document.querySelectorAll(".cart-item-check"));
  selectAllEl.checked = checks.length > 0 && checks.every(input => input.checked);
  updateSummary();
});

cartItemsEl.addEventListener("click", event => {
  const removeButton = event.target.closest(".cart-item-remove");
  if (removeButton) {
    removeItemsByKeys([removeButton.dataset.key]);
    return;
  }

  const quantityButton = event.target.closest(".quantity-button");
  if (quantityButton) {
    updateItemQuantity(quantityButton.dataset.key, quantityButton.dataset.action);
  }
});

selectAllEl.addEventListener("change", () => {
  document.querySelectorAll(".cart-item-check").forEach(input => {
    input.checked = selectAllEl.checked;
  });
  updateSummary();
});

deleteSelectedBtn.addEventListener("click", () => {
  const selectedKeys = getSelectedKeys();
  if (!selectedKeys.length) return;
  removeItemsByKeys(selectedKeys);
});

orderButton.addEventListener("click", () => {
  if (orderButton.disabled) return;
  alert("주문 기능은 준비 중입니다.");
});

// DB에서 장바구니 데이터를 불러온 뒤 렌더링
loadCartFromDB().then(() => {
  renderCartItems();
  updateCartCount();
});
