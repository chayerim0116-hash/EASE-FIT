const visualTrack = document.querySelector(".visual-track");
const visualSlides = document.querySelectorAll(".visual-slide");
const visualPrev = document.querySelector(".visual-prev");
const visualNext = document.querySelector(".visual-next");
const visualCurrent = document.querySelector(".visual-current");
const visualTotal = document.querySelector(".visual-total");
const visualProgressFill = document.querySelector(".visual-progress-fill");

const visualSlideCount = visualSlides.length;
const visualAutoplayDelay = 4200;
let visualPosition = visualSlideCount > 1 ? 1 : 0;
let visualTimer = null;
let visualIsAnimating = false;       // 애니메이션 중 이중 실행 방지
let visualAnimFallback = null;       // transitionend 미발화 대비 타임아웃

if (visualTrack && visualSlideCount > 1) {
  const firstClone = visualSlides[0].cloneNode(true);
  const lastClone = visualSlides[visualSlideCount - 1].cloneNode(true);

  firstClone.setAttribute("aria-hidden", "true");
  lastClone.setAttribute("aria-hidden", "true");
  visualTrack.appendChild(firstClone);
  visualTrack.insertBefore(lastClone, visualSlides[0]);
}

const getCurrentVisualNumber = () => {
  if (visualSlideCount < 2) return 1;
  return ((visualPosition - 1 + visualSlideCount) % visualSlideCount) + 1;
};

const updateVisualNumber = () => {
  const currentNumber = getCurrentVisualNumber();
  if (visualCurrent) visualCurrent.textContent = String(currentNumber);
  if (visualProgressFill && visualSlideCount > 1) {
    visualProgressFill.style.transform = `translateX(${(currentNumber - 1) * 100}%)`;
  }
};

// position이 유효 범위를 벗어난 경우 즉시 복구
const clampVisualPosition = () => {
  if (visualPosition < 0 || visualPosition > visualSlideCount + 1) {
    visualPosition = 1;
    updateVisualBanner(false, false);
  }
};

const updateVisualBanner = (animate = true, resetProgress = true) => {
  if (!visualTrack) return;

  clearTimeout(visualAnimFallback);

  if (!animate) {
    // 즉시 이동: 전환 끄고 → 위치 설정 → 다음 프레임에 전환 복구
    visualIsAnimating = false;
    visualTrack.style.transition = "none";
    visualTrack.style.transform = `translateX(-${visualPosition * 100}%)`;
    void visualTrack.getBoundingClientRect();
    requestAnimationFrame(() => {
      visualTrack.style.transition = "";
    });
  } else {
    // 애니메이션 이동: 잠금 설정 + 800ms 후 강제 해제 (transitionend 미발화 보험)
    visualIsAnimating = true;
    visualTrack.style.transition = "";
    visualTrack.style.transform = `translateX(-${visualPosition * 100}%)`;
    visualAnimFallback = setTimeout(() => {
      visualIsAnimating = false;
      // transitionend 미발화 시 경계 위치(0, slideCount+1)도 직접 보정
      if (visualPosition === visualSlideCount + 1) {
        visualPosition = 1;
        updateVisualBanner(false, false);
      } else if (visualPosition === 0) {
        visualPosition = visualSlideCount;
        updateVisualBanner(false, false);
      } else {
        clampVisualPosition();
      }
    }, 800);
  }

  updateVisualNumber();
  if (resetProgress) updateVisualNumber();
};

const moveVisualBanner = (direction) => {
  if (visualSlideCount < 2) return;
  if (visualIsAnimating) return;  // 애니메이션 중 무시

  visualPosition += direction;
  updateVisualBanner();
};

const startVisualAutoplay = () => {
  if (visualSlideCount < 2) return;
  window.clearInterval(visualTimer);
  visualTimer = window.setInterval(() => moveVisualBanner(1), visualAutoplayDelay);
};

const resetVisualAutoplay = () => {
  window.clearInterval(visualTimer);
  startVisualAutoplay();
};

if (visualTotal) visualTotal.textContent = String(visualSlideCount);

if (visualPrev) {
  visualPrev.addEventListener("click", () => {
    moveVisualBanner(-1);
    resetVisualAutoplay();
  });
}

if (visualNext) {
  visualNext.addEventListener("click", () => {
    moveVisualBanner(1);
    resetVisualAutoplay();
  });
}

if (visualTrack) {
  const onTransitionDone = (e) => {
    // transform 트랜지션 종료만 처리 (다른 속성 무시)
    if (e.propertyName !== "transform") return;

    clearTimeout(visualAnimFallback);
    visualIsAnimating = false;

    if (visualPosition === visualSlideCount + 1) {
      visualPosition = 1;
      updateVisualBanner(false, false);
    } else if (visualPosition === 0) {
      visualPosition = visualSlideCount;
      updateVisualBanner(false, false);
    }
  };

  visualTrack.addEventListener("transitionend", onTransitionDone);
  // 애니메이션이 중단된 경우(탭 전환 등)에도 잠금 해제
  visualTrack.addEventListener("transitioncancel", () => {
    clearTimeout(visualAnimFallback);
    visualIsAnimating = false;
  });
}

// 탭 숨김/복귀 처리
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // 탭 숨김: 자동재생 중단 + 진행 중 타이머 정리 (복귀 시 누적 방지)
    window.clearInterval(visualTimer);
    clearTimeout(visualAnimFallback);
    visualIsAnimating = false;
  } else {
    // 탭 복귀: 위치를 유효 범위(1~slideCount)로 보정 후 자동재생 재시작
    clearTimeout(visualAnimFallback);
    visualIsAnimating = false;
    const safe = ((visualPosition - 1 + visualSlideCount) % visualSlideCount) + 1;
    if (safe !== visualPosition) {
      visualPosition = safe;
      updateVisualBanner(false, false);
    }
    startVisualAutoplay();
  }
});

updateVisualBanner(false);
startVisualAutoplay();

const categories = [
  { name: "티셔츠", img: "./img/category/tshirt.jpeg" },
  { name: "셔츠",   img: "./img/category/shirt.jpeg" },
  { name: "니트",   img: "./img/category/knit.jpeg" },
  { name: "에센셜", img: "./img/category/esential.jpeg" },
  { name: "팬츠",   img: "./img/category/pants.jpeg" },
  { name: "스커트", img: "./img/category/skirt.jpeg" },
  { name: "원피스", img: "./img/category/dress.jpeg" },
  { name: "아우터", img: "./img/category/outer.jpeg" },
  { name: "ACC",    img: "./img/category/acc.jpeg" },
];

const categoryList = document.getElementById("categoryList");

if (categoryList) {
  categories.forEach((cat, index) => {
    const item = document.createElement("a");
    item.href = "#";
    item.className = "category-item" + (index === 0 ? " active" : "");
    item.setAttribute("aria-label", cat.name);

    const box = document.createElement("span");
    box.className = "category-img-box";

    const img = document.createElement("img");
    img.src = cat.img;
    img.alt = cat.name;

    box.appendChild(img);

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = cat.name;

    item.appendChild(box);
    item.appendChild(name);
    categoryList.appendChild(item);

    item.addEventListener("click", (e) => {
      e.preventDefault();
      categoryList.querySelectorAll(".category-item").forEach((el) => {
        el.classList.remove("active");
      });
      item.classList.add("active");
    });
  });
}

/* ── 상품 카드 클릭 → 상세페이지 이동 ─────── */
const productCards = document.querySelectorAll(".product-card[data-product-id]");

const getCardProductData = (card) => {
  const image = card.querySelector(".product-image img");
  const category = card.querySelector(".product-brand");
  const name = card.querySelector(".product-name");
  const price = card.querySelector(".price-row strong");
  const originalPrice = card.querySelector(".price-row del");
  const discount = card.querySelector(".price-row span");
  const colors = Array.from(card.querySelectorAll(".color-chip")).map((chip) => {
    return window.getComputedStyle(chip).backgroundColor;
  });

  return {
    id: card.dataset.productId,
    category: category ? category.textContent.trim() : "EASE FIT",
    name: name ? name.textContent.trim() : "",
    price: price ? price.textContent.trim() : "",
    originalPrice: originalPrice ? originalPrice.textContent.trim() : "",
    discount: discount ? discount.textContent.trim() : "",
    image: image ? image.getAttribute("src") : "",
    colors,
    sizes: "XS-3XL"
  };
};

const syncProductWishlistButtons = () => {
  productCards.forEach((card) => {
    const button = card.querySelector(".wishlist-btn");
    if (!button) return;

    const active = isWishlisted(card.dataset.productId);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-label", active ? "위시리스트 삭제" : "위시리스트 추가");
    const icon = button.querySelector(".heart-icon");
    if (icon) icon.textContent = active ? "♥" : "♡";
  });
};

productCards.forEach((card) => {
  const wishButton = card.querySelector(".wishlist-btn");

  if (wishButton) {
    wishButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const active = toggleWishlistItem(getCardProductData(card));
      wishButton.classList.toggle("is-active", active);
      wishButton.setAttribute("aria-label", active ? "위시리스트 삭제" : "위시리스트 추가");
      const icon = wishButton.querySelector(".heart-icon");
      if (icon) icon.textContent = active ? "♥" : "♡";
    });
  }

  card.addEventListener("click", (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest(".color-chip") ||
      e.target.closest(".product-wish")
    ) {
      return;
    }

    const productId = card.dataset.productId;
    if (productId) {
      window.location.href = `product-detail.html?id=${productId}`;
    }
  });
});

// DB에서 위시리스트 불러온 뒤 하트 버튼 상태 동기화
loadWishlistFromDB().then(() => syncProductWishlistButtons());
