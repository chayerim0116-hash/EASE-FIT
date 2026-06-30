const wishlistGrid = document.getElementById("wishlistGrid");
const wishlistEmpty = document.getElementById("wishlistEmpty");
const wishlistCountText = document.getElementById("wishlistCountText");
const wishlistClearButton = document.getElementById("wishlistClearButton");

function escapeWishlistHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderWishlistColors(colors) {
  if (!Array.isArray(colors) || !colors.length) return "";

  return `
    <div class="color-chips" aria-label="색상 옵션">
      ${colors.map(color => `<span class="color-chip" style="background:${escapeWishlistHtml(color)}"></span>`).join("")}
    </div>
  `;
}

function renderWishlistCards(items) {
  wishlistGrid.innerHTML = items.map(item => {
    const url = `./product-detail.html?id=${encodeURIComponent(item.id)}`;
    const originalPrice = item.originalPrice
      ? `<del>${escapeWishlistHtml(item.originalPrice)}</del>`
      : "";
    const discount = item.discount
      ? `<span>${escapeWishlistHtml(item.discount)}</span>`
      : "";

    return `
      <article class="product-card wishlist-card" data-product-id="${escapeWishlistHtml(item.id)}">
        <div class="product-image">
          <img src="${escapeWishlistHtml(item.image)}" alt="${escapeWishlistHtml(item.name)}" loading="lazy" />
          <button type="button" class="wishlist-btn product-wish is-active" aria-label="위시리스트 삭제">
            <span class="heart-icon">♥</span>
          </button>
        </div>
        <div class="product-info">
          <p class="product-brand">${escapeWishlistHtml(item.category || "EASE FIT")}</p>
          <p class="product-name">${escapeWishlistHtml(item.name)}</p>
          <div class="price-row">
            <strong class="wishlist-sale-price">${escapeWishlistHtml(item.price)}</strong>
            ${originalPrice}
            ${discount}
          </div>
          ${renderWishlistColors(item.colors)}
          <span class="wishlist-size-badge">${escapeWishlistHtml(item.sizes || "XS-3XL")}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderWishlistPage() {
  const items = getWishlistItems();
  const count = items.length;

  wishlistCountText.textContent = count + (count === 1 ? " Item" : " Items");
  wishlistGrid.hidden = count === 0;
  wishlistEmpty.hidden = count !== 0;
  wishlistClearButton.hidden = count === 0;

  if (count === 0) {
    wishlistGrid.innerHTML = "";
    return;
  }

  renderWishlistCards(items);
}

wishlistGrid.addEventListener("click", event => {
  const wishButton = event.target.closest(".wishlist-btn");
  if (wishButton) {
    event.preventDefault();
    event.stopPropagation();
    const card = wishButton.closest(".wishlist-card");
    if (!card) return;
    removeWishlistItem(card.dataset.productId);
    renderWishlistPage();
    return;
  }

  const card = event.target.closest(".wishlist-card");
  if (!card) return;
  window.location.href = `./product-detail.html?id=${encodeURIComponent(card.dataset.productId)}`;
});

wishlistClearButton.addEventListener("click", () => {
  const isEditing = wishlistGrid.classList.toggle("is-editing");
  wishlistClearButton.textContent = isEditing ? "완료" : "편집";
});

// DB에서 위시리스트 데이터를 불러온 뒤 렌더링
loadWishlistFromDB().then(() => {
  renderWishlistPage();
  updateWishlistCount();
});
