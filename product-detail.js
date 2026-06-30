/* ─────────────────────────────────────────────
   Product Detail — JavaScript
   ───────────────────────────────────────────── */

/* ── URL에서 상품 ID 읽기 ───────────────────── */
const rawId = new URLSearchParams(window.location.search).get("id") || "EF001";
let product  = null;
let sizeData = {};


/* ── 현재 선택 상태 ─────────────────────────── */
let currentColor    = '';
let currentColorObj = null;
let currentSize     = '';

/* ── DOM 참조 ───────────────────────────────── */
const mainImage       = document.getElementById("mainProductImage");
const zoomContainer   = document.getElementById("zoomContainer");
const productThumbs   = document.getElementById("productThumbs");
const colorChipsArea  = document.getElementById("colorChipsArea");
const selectedColorEl = document.getElementById("selectedColorName");
const chestEl         = document.getElementById("measureChest");
const shoulderEl      = document.getElementById("measureShoulder");
const lengthEl        = document.getElementById("measureLength");
const fitDescEl       = document.getElementById("fitDesc");
const sizeGuideToggle = document.getElementById("sizeGuideToggle");
const sizeGuidePanel  = document.getElementById("sizeGuideAccordion");
const cartBtn         = document.getElementById("cartBtn");
const buyBtn          = document.getElementById("buyBtn");
const modelBadge      = document.getElementById("modelBadge");
const detailColorList = document.getElementById("detailColorList");
const detailMoreButton = document.getElementById("detailMoreButton");
const detailMoreContent = document.getElementById("detailMoreContent");
const zoomLens = document.getElementById("zoomLens");
const zoomPreview = document.getElementById("zoomPreview");
const detailProductNumber = document.getElementById("detailProductNumber");
const modelWearSize = document.getElementById("modelWearSize");

const PRODUCT_IMAGE_SETS = {
  EF001: {
    images: [
      "./img/main_content1/product1/SHOT_26_004 (1).jpeg",
      "./img/main_content1/product1/SHOT_26_034.jpeg",
      "./img/main_content1/product1/SHOT_26_059 (1).jpeg",
      "./img/main_content1/product1/SHOT_26_005 (1).jpeg",
      "./img/main_content1/product1/Ashleyttee_001.jpeg"
    ],
    detailImages: [
      "./img/main_content1/product1/SHOT_26_024.jpeg",
      "./img/main_content1/product1/UNIVERSALSTANDARD_08.26.252989.jpeg",
      "./img/main_content1/product1/USPA1261-742_002.jpeg",
      "./img/main_content1/product1/lou-high-rise-barrel-leg-jeans-union-city-blue_MAIN.jpeg"
    ]
  },
  EF002: {
    images: [
      "./img/main_content1/product2/SHOT_56_1906.jpeg",
      "./img/main_content1/product2/USPA0977S_490Comfortdenim_Marche_ShortsWestern_Blue_001_008 (1).jpeg",
      "./img/main_content1/product2/SHOT_56_1899 (1).jpeg",
      "./img/main_content1/product2/USPA0977S_490Comfortdenim_Marche_ShortsWestern_Blue_002_004 (1).jpeg",
      "./img/main_content1/product2/USPA0977S_490Comfortdenim_Marche_ShortsWestern_Blue_003_002 (1).jpeg"
    ],
    detailImages: [
      "./img/main_content1/product2/SHOT_61_2014.jpeg",
      "./img/main_content1/product2/USPA0977S_490Comfortdenim_Marche_ShortsWestern_Blue_001_008 (1).jpeg",
      "./img/main_content1/product2/USPA0977S_490Comfortdenim_Marche_ShortsWestern_Blue_003_002 (1).jpeg",
      "./img/main_content1/product2/USDR0746SLB-692_MAIN_d280d53c-0904-4ee9-bfb6-eedd193d2778.jpeg"
    ]
  },
  EF003: {
    images: [
      "./img/main_content1/product3/Relaxed_Bootcut_Jeans_Anzio_Blue_USPA1886_904_001_008.jpeg",
      "./img/main_content1/product3/Relaxed_Bootcut_Jeans_Anzio_Blue_USPA1886_904_002_012.jpeg",
      "./img/main_content1/product3/Editorial_4_084 (1).jpeg",
      "./img/main_content1/product3/Editorial_4_086 (1).jpeg",
      "./img/main_content1/product3/Relaxed_Bootcut_Jeans_Anzio_Blue_USPA1886_904_003_019.jpeg"
    ],
    detailImages: [
      "./img/main_content1/product3/Editorial_4_084 (1).jpeg",
      "./img/main_content1/product3/Editorial_4_086 (1).jpeg",
      "./img/main_content1/product3/Trouser_Jean_Nilo_Blue_USPA1577_685_001_403.jpeg",
      "./img/main_content1/product3/SHOT_20_287.jpeg"
    ]
  },
  EF004: {
    images: [
      "./img/main_content1/product4/Ashley_V_Neck_Tee_Black_USTO0567V_001_001_013 (1).jpeg",
      "./img/main_content1/product4/Ashley_V_Neck_Tee_Black_USTO0567V_001_002_014 (1).jpeg",
      "./img/main_content1/product4/Ashley_V_Neck_Tee_Black_USTO0567V_001_003_022 (1).jpeg",
      "./img/main_content1/product4/AshleyVNeckTeeBlackUSTO0567V-001 (1).jpeg",
      "./img/main_content1/product4/V_Neck_Top_Black_USTO1177_001_001_003.jpeg"
    ],
    detailImages: [
      "./img/main_content1/product4/AshleyVNeckTeeBlackUSTO0567V-001 (1).jpeg",
      "./img/main_content1/product4/Ashley_V_Neck_Tee_White_USTO0567V_025_001_657.jpeg",
      "./img/main_content1/product4/V_Neck_Top_Black_USTO1177_001_001_003.jpeg",
      "./img/main_content1/product4/SHOT_36_002.jpeg"
    ]
  },
  EF005: {
    images: [
      "./img/main_content3/product5/main.jpeg",
      "./img/main_content3/product5/SHOT11_023 (1).jpeg",
      "./img/main_content3/product5/SHOT11_047 (1).jpeg",
      "./img/main_content3/product5/USTO1945_467_Light_As_Air_Boy_Tee_Vapor_001_173 (1).jpeg",
      "./img/main_content3/product5/USTO1945_467_Light_As_Air_Boy_Tee_Vapor_003_170 (1).jpeg"
    ],
    detailImages: [
      "./img/main_content3/product5/USTO1945_001_Light_As_Air_Boy_Tee_Black_001_040.jpeg",
      "./img/main_content3/product5/USTO1945_001_Light_As_Air_Boy_Tee_Black_002_024.jpeg",
      "./img/main_content3/product5/USTO1945_467_Light_As_Air_Boy_Tee_Vapor_001_173 (1).jpeg",
      "./img/main_content3/product5/USTO1945_467_Light_As_Air_Boy_Tee_Vapor_003_170 (1).jpeg"
    ]
  },
  EF006: {
    images: [
      "./img/main_content3/product6/main.jpeg",
      "./img/main_content3/product6/SHOT31_037 (1).jpeg",
      "./img/main_content3/product6/USTO1663_899_Breton_Stripe_Garcon_Tee_Vermilion_Red_White_Stripe_002_012.jpeg",
      "./img/main_content3/product6/USTO1663_899_Breton_Stripe_Garcon_Tee_Vermilion_Red_White_Stripe_001_025 (1).jpeg",
      "./img/main_content3/product6/USTO1663_899_Breton_Stripe_Garcon_Tee_Vermilion_Red_White_Stripe_003_015.jpeg"
    ],
    detailImages: [
      "./img/main_content3/product6/SHOT3_124.jpeg",
      "./img/main_content3/product6/SHOT_24_031.jpeg",
      "./img/main_content3/product6/USTO1663_899_Breton_Stripe_Garcon_Tee_Vermilion_Red_White_Stripe_001_025 (1).jpeg",
      "./img/main_content3/product6/USTO1663_899_Breton_Stripe_Garcon_Tee_Vermilion_Red_White_Stripe_003_015.jpeg"
    ]
  },
  EF007: {
    images: [
      "./img/main_content3/product7/main.jpeg",
      "./img/main_content3/product7/SHOT_45_1618 (1).jpeg",
      "./img/main_content3/product7/USTO1492-987Belle-Breton-Stripe-Jersey-TeeNavy-Pinstripe_002_030.jpeg",
      "./img/main_content3/product7/SHOT_45_1636 (1).jpeg",
      "./img/main_content3/product7/USTO1492-987Belle-Breton-Stripe-Jersey-TeeNavy-Pinstripe_003_036.jpeg"
    ],
    detailImages: [
      "./img/main_content3/product7/Belle_top.jpeg",
      "./img/main_content3/product7/USTO1492-987Belle-Breton-Stripe-Jersey-TeeNavy-Pinstripe_001_025.jpeg",
      "./img/main_content3/product7/USTO1492-987Belle-Breton-Stripe-Jersey-TeeNavy-Pinstripe_002_030.jpeg",
      "./img/main_content3/product7/USTO1492-987Belle-Breton-Stripe-Jersey-TeeNavy-Pinstripe_003_036.jpeg"
    ]
  },
  EF008: {
    images: [
      "./img/main_content3/product8/main.jpeg",
      "./img/main_content3/product8/SHOT_57_0007 (1).jpeg",
      "./img/main_content3/product8/SHOT_57_0032 (1).jpeg",
      "./img/main_content3/product8/SHOT_57_0021 (1).jpeg",
      "./img/main_content3/product8/SHOT_57_0028 (1).jpeg"
    ],
    detailImages: [
      "./img/main_content3/product8/SHOT_57_0032 (1).jpeg",
      "./img/main_content3/product8/USTO1905P-025ButtonBackpoloinCottonPoplinWhite_001_207.jpeg",
      "./img/main_content3/product8/USTO1905P-025ButtonBackpoloinCottonPoplinWhite_002_194.jpeg",
      "./img/main_content3/product8/USTO1905P-025ButtonBackpoloinCottonPoplinWhite_003_201.jpeg"
    ]
  },
  EF009: {
    images: [
      "./img/main_content3/product9/main.jpeg",
      "./img/main_content3/product9/SHOT33_118 (1).jpeg",
      "./img/main_content3/product9/SHOT33_123.jpeg",
      "./img/main_content3/product9/SHOT_27_020.jpeg",
      "./img/main_content3/product9/USTO1995XP_128_Stretch_Poplin_Short_Sleeve_Full_Placket_Elbe_Light_Blue_001_546.jpeg"
    ],
    detailImages: [
      "./img/main_content3/product9/SHOT33_180.jpeg",
      "./img/main_content3/product9/SHOT_27_042 (1).jpeg",
      "./img/main_content3/product9/USTO1995XP_128_Stretch_Poplin_Short_Sleeve_Full_Placket_Elbe_Light_Blue_001_543.jpeg",
      "./img/main_content3/product9/USTO1995XP_128_Stretch_Poplin_Short_Sleeve_Full_Placket_Elbe_Light_Blue_003_530.jpeg"
    ]
  },
  EF010: {
    images: [
      "./img/main_content3/product10/main.jpeg",
      "./img/main_content3/product10/USTO0883_025_Cai_High_Neck_Tank_White_001_080 (1).jpeg",
      "./img/main_content3/product10/USTO0883_025_Cai_High_Neck_Tank_White_002_060 (1).jpeg",
      "./img/main_content3/product10/USTO0883_025_Cai_High_Neck_Tank_White_003_069.jpeg"
    ],
    detailImages: [
      "./img/main_content3/product10/CaiHighNeckTankBaritoneBlueUSTO0883-454_001.jpeg",
      "./img/main_content3/product10/USTO0883_025_Cai_High_Neck_Tank_White_001_080 (1).jpeg",
      "./img/main_content3/product10/USTO0883_025_Cai_High_Neck_Tank_White_003_069.jpeg"
    ]
  },
  EF011: {
    images: [
      "./img/main_content3/product11/main.jpeg",
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_001_032 (1).jpeg",
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_002_001 (1).jpeg",
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_003_679.jpeg",
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_004_034 (1).jpeg"
    ],
    detailImages: [
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_001_032.jpeg",
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_002_001.jpeg",
      "./img/main_content3/product11/SQUARE_NECK_LONG_SLEEVE_TOP_Black_USTO1066_001_004_692.jpeg"
    ]
  },
  EF012: {
    images: [
      "./img/main_content3/product12/main.jpeg",
      "./img/main_content3/product12/SHOT_54_1862.jpeg",
      "./img/main_content3/product12/USTO1658-1127Noyack-Breton-Stripe-Boatneck-TankSoft-Blue-White-Stripe_001_109 (1).jpeg",
      "./img/main_content3/product12/USTO1658-1127Noyack-Breton-Stripe-Boatneck-TankSoft-Blue-White-Stripe_003_101.jpeg"
    ],
    detailImages: [
      "./img/main_content3/product12/USTO1658-1127Noyack-Breton-Stripe-Boatneck-TankSoft-Blue-White-Stripe_001_109.jpeg",
      "./img/main_content3/product12/USTO1658-1127Noyack-Breton-Stripe-Boatneck-TankSoft-Blue-White-Stripe_003_101.jpeg"
    ]
  }
};

function applyLocalImageSet(productData) {
  const imageSet = PRODUCT_IMAGE_SETS[productData.code];
  if (!imageSet) return productData;

  const baseColor = productData.colors[0] || {
    id: "default",
    name: "기본",
    swatch: "#111111",
    images: []
  };

  const colors = productData.colors.length
    ? productData.colors.map(color => ({ ...color, images: imageSet.images }))
    : [{ ...baseColor, images: imageSet.images }];

  return {
    ...productData,
    defaultColor: colors.some(color => color.id === productData.defaultColor)
      ? productData.defaultColor
      : colors[0].id,
    colors,
    detailImages: imageSet.detailImages
  };
}

function renderDetailImages(images) {
  const detailImageArea = document.querySelector(".detail-more-images");
  if (!detailImageArea || !images || !images.length) return;

  detailImageArea.innerHTML = "";
  images.forEach((src, idx) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `상품 상세컷 ${idx + 1}`;
    img.loading = "lazy";
    detailImageArea.appendChild(img);
  });
}

function getModelWearText(productData) {
  const modelSize = productData.modelInfo?.match(/·\s*([A-Z0-9]+)\s*착용/)?.[1];
  const size = modelSize || productData.defaultSize || productData.sizes?.[0] || "M";
  return `${size} 착용`;
}

function getContainedImageRect() {
  if (!zoomContainer || !mainImage || !mainImage.naturalWidth || !mainImage.naturalHeight) return null;

  const box = zoomContainer.getBoundingClientRect();
  const boxRatio = box.width / box.height;
  const imageRatio = mainImage.naturalWidth / mainImage.naturalHeight;

  let width = box.width;
  let height = box.height;
  let left = box.left;
  let top = box.top;

  if (imageRatio > boxRatio) {
    height = width / imageRatio;
    top = box.top + (box.height - height) / 2;
  } else {
    width = height * imageRatio;
    left = box.left + (box.width - width) / 2;
  }

  return { left, top, width, height, right: left + width, bottom: top + height };
}

function positionModelBadge() {
  if (!modelBadge || !zoomContainer) return;

  const imageRect = getContainedImageRect();
  if (!imageRect) return;

  const containerRect = zoomContainer.getBoundingClientRect();
  const inset = 20;
  const right = Math.max(inset, containerRect.right - imageRect.right + inset);
  const bottom = Math.max(inset, containerRect.bottom - imageRect.bottom + inset);

  modelBadge.style.right = `${right}px`;
  modelBadge.style.bottom = `${bottom}px`;
}

function queueModelBadgePosition() {
  if (!mainImage) return;

  const update = () => requestAnimationFrame(positionModelBadge);
  if (mainImage.complete && mainImage.naturalWidth) {
    update();
  } else {
    mainImage.addEventListener("load", update, { once: true });
  }
}

function positionZoomPreview(imageRect) {
  if (!zoomPreview || !imageRect) return { width: 0, height: 0 };

  const gap = 24;
  const viewportPadding = 24;
  const rightSpace = window.innerWidth - imageRect.right - gap - viewportPadding;
  const previewWidth = Math.max(320, Math.min(540, rightSpace));
  const previewHeight = Math.min(imageRect.height, window.innerHeight - viewportPadding * 2);
  const left = rightSpace >= 320
    ? imageRect.right + gap
    : Math.max(viewportPadding, imageRect.left);
  const top = Math.min(Math.max(viewportPadding, imageRect.top), window.innerHeight - previewHeight - viewportPadding);

  zoomPreview.style.width = `${previewWidth}px`;
  zoomPreview.style.height = `${previewHeight}px`;
  zoomPreview.style.left = `${left}px`;
  zoomPreview.style.top = `${top}px`;

  return { width: previewWidth, height: previewHeight };
}

function updateZoom(event) {
  if (!zoomLens || !zoomPreview || !mainImage) return;

  const imageRect = getContainedImageRect();
  if (!imageRect) return;

  zoomLens.classList.add("is-active");
  zoomPreview.classList.add("is-active");

  const x = Math.min(Math.max(event.clientX, imageRect.left), imageRect.right) - imageRect.left;
  const y = Math.min(Math.max(event.clientY, imageRect.top), imageRect.bottom) - imageRect.top;
  const preview = positionZoomPreview(imageRect);
  const zoom = 2.35;
  const lensWidth = Math.min(imageRect.width, preview.width / zoom);
  const lensHeight = Math.min(imageRect.height, preview.height / zoom);
  const lensLeft = Math.min(Math.max(x - lensWidth / 2, 0), imageRect.width - lensWidth);
  const lensTop = Math.min(Math.max(y - lensHeight / 2, 0), imageRect.height - lensHeight);
  const containerRect = zoomContainer.getBoundingClientRect();

  zoomLens.style.width = `${lensWidth}px`;
  zoomLens.style.height = `${lensHeight}px`;
  zoomLens.style.left = `${imageRect.left - containerRect.left + lensLeft}px`;
  zoomLens.style.top = `${imageRect.top - containerRect.top + lensTop}px`;

  zoomPreview.style.backgroundImage = `url("${mainImage.currentSrc || mainImage.src}")`;
  zoomPreview.style.backgroundSize = `${imageRect.width * zoom}px ${imageRect.height * zoom}px`;
  zoomPreview.style.backgroundPosition = `${-(lensLeft * zoom)}px ${-(lensTop * zoom)}px`;
}

function showZoom(event) {
  if (!zoomLens || !zoomPreview || !mainImage || !mainImage.complete) return;
  zoomLens.classList.add("is-active");
  zoomPreview.classList.add("is-active");
  updateZoom(event);
}

function hideZoom() {
  zoomLens?.classList.remove("is-active");
  zoomPreview?.classList.remove("is-active");
}

function initImageZoom() {
  if (!zoomContainer || !mainImage || !zoomLens || !zoomPreview) return;

  zoomContainer.addEventListener("mouseenter", showZoom);
  zoomContainer.addEventListener("mousemove", updateZoom);
  zoomContainer.addEventListener("mouseleave", hideZoom);
  document.addEventListener("mousemove", (event) => {
    if (!zoomPreview.classList.contains("is-active")) return;
    const rect = zoomContainer.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isOutside) hideZoom();
  });
  window.addEventListener("scroll", hideZoom, { passive: true });
  window.addEventListener("resize", () => {
    hideZoom();
    queueModelBadgePosition();
  });
}

/* ── 썸네일 DOM 생성 및 이벤트 바인딩 ──────── */
function renderThumbs(images) {
  if (!productThumbs) return;
  productThumbs.innerHTML = "";

  images.slice(0, 5).forEach((src, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumbnail" + (idx === 0 ? " active" : "");
    btn.dataset.image = src;
    btn.setAttribute("aria-label", `이미지 ${idx + 1}`);

    const img = document.createElement("img");
    img.src = src;
    img.alt = `상품 썸네일 ${idx + 1}`;
    btn.appendChild(img);
    productThumbs.appendChild(btn);

    btn.addEventListener("click", () => {
      if (mainImage) mainImage.src = src;
      hideZoom();
      queueModelBadgePosition();
      productThumbs.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

/* ── 컬러칩 DOM 생성 및 이벤트 바인딩 ──────── */
function renderColorSwatches(productData) {
  if (!colorChipsArea) return;
  colorChipsArea.innerHTML = "";

  productData.colors.forEach((colorObj, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch" + (idx === 0 ? " active" : "");
    btn.dataset.color = colorObj.id;
    btn.dataset.colorName = colorObj.name;
    btn.title = colorObj.name;
    btn.setAttribute("aria-label", `${colorObj.name} 선택`);
    btn.style.background = colorObj.swatch;

    if (colorObj.id === "white" || colorObj.swatch === "#ffffff" || colorObj.swatch === "#f0eeeb") {
      btn.style.border = "1.5px solid #ccc";
    }

    btn.addEventListener("click", () => {
      colorChipsArea.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");

      currentColor = colorObj.id;
      currentColorObj = colorObj;

      if (selectedColorEl) selectedColorEl.textContent = colorObj.name;
      if (mainImage) mainImage.src = colorObj.images[0];
      hideZoom();
      queueModelBadgePosition();
      renderThumbs(colorObj.images);
      renderDetailImages(product?.detailImages || colorObj.images);
      updateDetailColorActive();
    });

    colorChipsArea.appendChild(btn);
  });
}

function updateDetailColorActive() {
  if (!detailColorList) return;
  detailColorList.querySelectorAll(".detail-color-card").forEach(card => {
    card.classList.toggle("active", card.dataset.color === currentColor);
  });
}

function renderDetailColorInfo(productData) {
  if (!detailColorList) return;
  detailColorList.innerHTML = "";

  productData.colors.forEach((colorObj) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "detail-color-card";
    btn.dataset.color = colorObj.id;
    btn.setAttribute("aria-label", `${colorObj.name} 컬러 보기`);

    const swatch = document.createElement("i");
    swatch.className = "detail-color-chip";
    swatch.style.background = colorObj.swatch;

    const label = document.createElement("span");
    label.textContent = colorObj.name;

    btn.appendChild(swatch);
    btn.appendChild(label);

    btn.addEventListener("click", () => {
      currentColor = colorObj.id;
      currentColorObj = colorObj;

      if (selectedColorEl) selectedColorEl.textContent = colorObj.name;
      if (mainImage) mainImage.src = colorObj.images[0];
      hideZoom();
      queueModelBadgePosition();
      renderThumbs(colorObj.images);
      renderDetailImages(product?.detailImages || colorObj.images);

      colorChipsArea?.querySelectorAll(".color-swatch").forEach(swatch => {
        swatch.classList.toggle("active", swatch.dataset.color === colorObj.id);
      });
      updateDetailColorActive();
    });

    detailColorList.appendChild(btn);
  });

  updateDetailColorActive();
}

/* ── 사이즈 버튼 초기화 ─────────────────────── */
function initSizeBtns(productData) {
  const sizeBtns = document.querySelectorAll(".size-btn");

  sizeBtns.forEach((btn) => {
    const size = btn.dataset.size;
    const inList = productData.sizes.includes(size);
    btn.disabled = !inList;
    btn.style.opacity = inList ? "1" : "0.3";
    btn.classList.remove("active"); /* 기본 선택 없음 — 사용자가 직접 선택해야 함 */
  });

  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      sizeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSize = btn.dataset.size;
      applySizeData(currentSize);
    });
  });
}

/* ── 핏 정보 업데이트 ───────────────────────── */
function applySizeData(size) {
  const data = sizeData[size];
  if (!data) return;

  if (chestEl)     chestEl.textContent     = data.chest;
  if (shoulderEl)  shoulderEl.textContent  = data.shoulder;
  if (lengthEl)    lengthEl.textContent    = data.length;
  if (fitDescEl)   fitDescEl.textContent   = data.fit;
}

/* ── 페이지 전체 초기화 ─────────────────────── */
function initPage(productData) {
  document.title = `${productData.name} | EASE FIT`;

  const codeEl  = document.getElementById("productCode");
  const titleEl = document.getElementById("productTitle");
  const priceEl = document.getElementById("productPrice");

  if (codeEl)  codeEl.textContent  = productData.code;
  if (titleEl) titleEl.textContent = productData.name;
  if (priceEl) priceEl.textContent = productData.price;
  if (modelBadge) modelBadge.textContent = productData.modelInfo;
  if (detailProductNumber) detailProductNumber.textContent = `상품번호 : ${productData.code}`;
  if (modelWearSize) modelWearSize.textContent = getModelWearText(productData);

  const defaultColorObj = productData.colors.find(c => c.id === productData.defaultColor) || productData.colors[0];
  currentColor    = defaultColorObj.id;
  currentColorObj = defaultColorObj;
  currentSize     = ""; /* 사이즈는 사용자가 직접 선택해야 함 */

  if (selectedColorEl) selectedColorEl.textContent = defaultColorObj.name;
  if (mainImage)       mainImage.src = defaultColorObj.images[0];
  queueModelBadgePosition();

  renderThumbs(defaultColorObj.images);
  renderDetailImages(productData.detailImages || defaultColorObj.images);
  renderColorSwatches(productData);
  renderDetailColorInfo(productData);
  initSizeBtns(productData);
}

/* ── 페이지 실행 ────────────────────────────── */

/* ════════════════════════════════════════════
   위시리스트 — common.js 의 wishlist 유틸 사용
   ════════════════════════════════════════════ */

function getDetailWishlistItem(productData) {
  const colorObj = currentColorObj || productData.colors[0];
  return {
    id: productData.code,
    category: "EASE FIT",
    name: productData.name,
    price: productData.price.replace("원", ""),
    originalPrice: "",
    discount: "",
    image: colorObj && colorObj.images && colorObj.images[0] ? colorObj.images[0] : "",
    colors: productData.colors.map(color => color.swatch),
    sizes: "XS-3XL"
  };
}

function syncDetailWishlistButton(productData) {
  const button = document.getElementById("detailWishlistBtn");
  if (!button) return;

  const active = isWishlisted(productData.code);
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-label", active ? "위시리스트 삭제" : "위시리스트 추가");
  const icon = button.querySelector(".heart-icon");
  if (icon) icon.textContent = active ? "♥" : "♡";
}

const detailWishlistBtn = document.getElementById("detailWishlistBtn");
if (detailWishlistBtn) {
  detailWishlistBtn.addEventListener("click", () => {
    const active = toggleWishlistItem(getDetailWishlistItem(product));
    detailWishlistBtn.classList.toggle("is-active", active);
    detailWishlistBtn.setAttribute("aria-label", active ? "위시리스트 삭제" : "위시리스트 추가");
    const icon = detailWishlistBtn.querySelector(".heart-icon");
    if (icon) icon.textContent = active ? "♥" : "♡";
  });
  // syncDetailWishlistButton 은 Promise.all 초기화 블록에서 호출
}

/* ── 전체 사이즈 가이드 accordion ───────────── */
if (sizeGuideToggle && sizeGuidePanel) {
  sizeGuideToggle.addEventListener("click", () => {
    const willOpen = sizeGuidePanel.hidden;
    sizeGuidePanel.hidden = !willOpen;
    sizeGuideToggle.setAttribute("aria-expanded", String(willOpen));
    sizeGuideToggle.textContent = willOpen
      ? "- 전체 사이즈 가이드 접기"
      : "+ 전체 사이즈 가이드 보기";
  });
}

initImageZoom();

if (detailMoreButton && detailMoreContent) {
  detailMoreButton.addEventListener("click", () => {
    const willOpen = detailMoreContent.hidden;
    detailMoreContent.hidden = !willOpen;
    detailMoreButton.setAttribute("aria-expanded", String(willOpen));
    detailMoreButton.textContent = willOpen ? "상세 정보 접기" : "상세 정보 더보기";
  });
}

/* ════════════════════════════════════════════
   장바구니 — common.js 의 getCartItems / saveCartItems / updateCartCount 사용
   ════════════════════════════════════════════ */

/* 현재 선택된 옵션 반환. 하나라도 없으면 null */
function getSelectedOptions() {
  if (!currentColor || !currentSize) return null;
  return { color: currentColor, size: currentSize };
}

/* 컬러·사이즈 모두 선택됐는지 확인 */
function validateOptions() {
  return !!(currentColor && currentSize);
}

/* 장바구니에 상품 추가 또는 수량 증가 */
function addToCart(productData, opts) {
  const items = getCartItems();
  const priceNum = parseInt(productData.price.replace(/[^0-9]/g, ""), 10) || 0;
  const colorName = currentColorObj ? currentColorObj.name : opts.color;
  const image = currentColorObj && currentColorObj.images[0] ? currentColorObj.images[0] : "";

  const idx = items.findIndex(
    item => item.id === productData.code && item.color === colorName && item.size === opts.size
  );

  if (idx !== -1) {
    items[idx].quantity += 1;
    saveCartItems(items);
    updateCartCount();
    return "updated";
  }

  items.push({
    id:       productData.code,
    brand:    "EASE FIT",
    title:    productData.name,
    price:    priceNum,
    image:    image,
    color:    colorName,
    size:     opts.size,
    quantity: 1,
    url:      `./product-detail.html?id=${productData.code}`
  });
  saveCartItems(items);
  updateCartCount();
  return "added";
}

/* ── 모달 제어 ──────────────────────────────── */

let activeModal = null;

function openModal(el) {
  if (activeModal) closeModal();
  activeModal = el;
  el.classList.add("is-open");
  document.body.classList.add("modal-open");
}

function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  activeModal = null;
}

function openOptionAlertModal() {
  const el = document.getElementById("optionAlertModal");
  if (el) openModal(el);
}

function openCartSuccessModal(type) {
  const el  = document.getElementById("cartSuccessModal");
  const msg = document.getElementById("cartSuccessMsg");
  if (!el || !msg) return;

  msg.textContent =
    type === "updated"
      ? "이미 담긴 상품의 수량이 추가되었어요."
      : "상품을 장바구니에 담았어요.";

  openModal(el);
}

/* ── 이벤트 바인딩 ──────────────────────────── */

function bindCartButton() {
  if (!cartBtn) return;

  cartBtn.addEventListener("click", () => {
    if (!validateOptions()) {
      openOptionAlertModal();
      return;
    }
    const opts   = getSelectedOptions();
    const result = addToCart(product, opts);
    openCartSuccessModal(result);
  });
}

/* 옵션 안내 모달 — 확인 */
const optionAlertConfirm = document.getElementById("optionAlertConfirm");
if (optionAlertConfirm) {
  optionAlertConfirm.addEventListener("click", closeModal);
}

/* 성공 모달 — 닫기 버튼 */
const cartSuccessClose = document.getElementById("cartSuccessClose");
if (cartSuccessClose) {
  cartSuccessClose.addEventListener("click", closeModal);
}

/* 성공 모달 — 장바구니 가기 */
const goCartBtn = document.getElementById("goCartBtn");
if (goCartBtn) {
  goCartBtn.addEventListener("click", () => {
    window.location.href = "./cart.html";
  });
}

/* 성공 모달 — 쇼핑 계속하기 */
const continueShopBtn = document.getElementById("continueShopBtn");
if (continueShopBtn) {
  continueShopBtn.addEventListener("click", closeModal);
}

/* ESC 키 */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

/* dim(배경) 클릭 시 닫기 */
document.querySelectorAll(".modal-dim").forEach(dim => {
  dim.addEventListener("click", e => {
    if (e.target === dim) closeModal();
  });
});

/* 초기 실행 — DB에서 장바구니·위시리스트를 불러온 뒤 UI 초기화 */
/* 초기 실행 — Supabase에서 상품·장바구니·위시리스트 로드 후 UI 초기화 */
(async () => {
  /* ① 상품 + 컬러 + 이미지 + variants 한 번에 fetch */
  const { data: raw, error: pErr } = await db
    .from('products')
    .select(`
      id, code, name, price, model_info, default_color, default_size,
      product_colors (
        color_key, color_name, swatch, display_order,
        product_images (image_path, display_order)
      ),
      product_variants (size, in_stock)
    `)
    .eq('code', rawId)
    .single();

  if (pErr || !raw) {
    console.error('상품 로드 실패:', pErr);
    const titleEl = document.getElementById('productTitle');
    if (titleEl) titleEl.textContent = '상품 정보를 불러올 수 없습니다.';
    return;
  }

  /* ② DB 응답 → JS 객체로 변환 */
  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  const colors = (raw.product_colors || [])
    .sort((a, b) => a.display_order - b.display_order)
    .map(c => ({
      id:     c.color_key,
      name:   c.color_name,
      swatch: c.swatch,
      images: (c.product_images || [])
        .sort((a, b) => a.display_order - b.display_order)
        .map(i => i.image_path)
    }));

  const sizes = [...new Set(
    (raw.product_variants || []).filter(v => v.in_stock).map(v => v.size)
  )].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  product = applyLocalImageSet({
    code:         raw.code,
    name:         raw.name,
    price:        raw.price.toLocaleString('ko-KR') + '원',
    modelInfo:    raw.model_info,
    defaultColor: raw.default_color,
    defaultSize:  raw.default_size,
    colors,
    sizes
  });

  /* ③ 사이즈 실측 fetch */
  const { data: sizeRows } = await db
    .from('product_sizes')
    .select('size, chest, shoulder, length, fit_desc')
    .order('display_order');

  (sizeRows || []).forEach(s => {
    sizeData[s.size] = { chest: s.chest, shoulder: s.shoulder, length: s.length, fit: s.fit_desc };
  });

  /* ④ 페이지 렌더링 */
  initPage(product);

  /* ⑤ 사이즈 테이블 렌더링 */
  renderSizeTable();

  /* ⑥ 장바구니·위시리스트 로드 후 버튼 바인딩 */
  await Promise.all([loadCartFromDB(), loadWishlistFromDB()]);
  updateCartCount();
  bindCartButton();
  syncDetailWishlistButton(product);

  /* ⑦ 최근 본 상품 저장 */
  initRecentViewedProduct();
})();


/* ── 구매하기 ───────────────────────────────── */
if (buyBtn) {
  buyBtn.addEventListener("click", () => {
    alert("구매 기능은 준비 중입니다.");
  });
}

/* ── 하단 탭 전환 ────────────────────────────── */
const extraTabs   = document.querySelectorAll(".extra-tab");
const extraPanels = document.querySelectorAll(".extra-panel");

extraTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    extraTabs.forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    extraPanels.forEach(panel => {
      if (panel.id === `panel-${target}`) {
        panel.hidden = false;
        panel.classList.add("active");
      } else {
        panel.hidden = true;
        panel.classList.remove("active");
      }
    });
  });
});

/* ════════════════════════════════════════════
   사이즈 테이블 렌더링
   ════════════════════════════════════════════ */
/* ════════════════════════════════════════════
   사이즈 테이블 렌더링 — async init 에서 호출
   ════════════════════════════════════════════ */
function renderSizeTable() {
  const tbody = document.querySelector("#sizeDetailTable tbody");
  if (!tbody) return;
  if (tbody.children.length) return;

  const sizeList = product ? product.sizes : Object.keys(sizeData);
  sizeList.forEach(size => {
    const d = sizeData[size];
    if (!d) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${size}</td><td>${d.length}</td><td>${d.chest}</td><td>${d.shoulder}</td>`;
    tbody.appendChild(tr);
  });
}


/* ════════════════════════════════════════════
   상세 탭 네비게이션 — 스크롤 + 활성 상태
   ════════════════════════════════════════════ */
(function initRightDetailTabs() {
  const tabButtons = document.querySelectorAll(".right-detail-tab");
  if (!tabButtons.length) return;

  /* 탭 클릭 → 해당 섹션으로 스크롤 */
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const section  = document.getElementById(targetId);
      if (!section) return;
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* IntersectionObserver → 화면에 들어온 섹션에 따라 active 탭 변경 */
  const sectionIds = ["product-info-section", "size-section", "review-section"];
  const sections   = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  if (!sections.length) return;

  let lastActive = null;

  const observer = new IntersectionObserver(
    entries => {
      let bestRatio = 0;
      let bestId    = null;

      entries.forEach(entry => {
        if (entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio;
          bestId    = entry.target.id;
        }
      });

      if (bestId && bestId !== lastActive) {
        lastActive = bestId;
        tabButtons.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.target === bestId);
        });
      }
    },
    {
      threshold: [0, 0.15, 0.3, 0.5],
      rootMargin: "-10% 0px -60% 0px"
    }
  );

  sections.forEach(s => observer.observe(s));
})();

/* ════════════════════════════════════════════
   사이즈 구매 경향 + 리뷰 포인트 샘플 데이터
   ════════════════════════════════════════════ */
(function initDetailInsightPanels() {
  const sizeSelect = document.getElementById("usualSizeSelect");
  const sizeBars = document.getElementById("sizePurchaseBars");
  const reviewTabs = document.querySelectorAll(".review-point-tab");
  const reviewTip = document.getElementById("reviewPointTip");
  const reviewBars = document.getElementById("reviewPointBars");

  const purchaseData = {
    XS: [{ label: "XS", percent: 76 }, { label: "S", percent: 24 }],
    S: [{ label: "S", percent: 68 }, { label: "M", percent: 22 }, { label: "XS", percent: 10 }],
    M: [{ label: "M", percent: 72 }, { label: "L", percent: 20 }, { label: "S", percent: 8 }],
    L: [{ label: "L", percent: 62 }, { label: "XL", percent: 28 }, { label: "M", percent: 10 }],
    XL: [{ label: "XL", percent: 66 }, { label: "2XL", percent: 24 }, { label: "L", percent: 10 }],
    "2XL": [{ label: "2XL", percent: 70 }, { label: "3XL", percent: 20 }, { label: "XL", percent: 10 }],
    "3XL": [{ label: "3XL", percent: 82 }, { label: "2XL", percent: 18 }]
  };

  const reviewData = {
    size: {
      tip: "100%의 유저가 잘맞아요를 선택했어요",
      rows: [{ label: "작아요", count: 0, percent: 0 }, { label: "잘맞아요", count: 20, percent: 100 }, { label: "커요", count: 0, percent: 0 }]
    },
    fit: {
      tip: "55%의 유저가 레귤러핏을 선택했어요",
      rows: [{ label: "슬림핏", count: 0, percent: 0 }, { label: "레귤러핏", count: 11, percent: 55 }, { label: "오버핏", count: 9, percent: 45 }]
    },
    sheer: {
      tip: "75%의 유저가 안비쳐요를 선택했어요",
      rows: [{ label: "약간 비쳐요", count: 0, percent: 0 }, { label: "보통이에요", count: 5, percent: 25 }, { label: "안비쳐요", count: 15, percent: 75 }]
    },
    color: {
      tip: "89%의 유저가 화면과 같아요를 선택했어요",
      rows: [{ label: "어두워요", count: 0, percent: 0 }, { label: "화면과 같아요", count: 17, percent: 89 }, { label: "밝아요", count: 2, percent: 11 }]
    },
    length: {
      tip: "44%의 유저가 골반위를 선택했어요",
      rows: [{ label: "크롭", count: 0, percent: 0 }, { label: "허리", count: 3, percent: 33 }, { label: "골반", count: 2, percent: 22 }, { label: "골반위", count: 4, percent: 44 }, { label: "골반아래", count: 0, percent: 0 }]
    }
  };

  function renderSizeBars(size) {
    if (!sizeBars) return;
    const rows = purchaseData[size] || purchaseData.M;
    sizeBars.innerHTML = rows.map(row => `
      <div class="size-purchase-row">
        <div class="size-purchase-row-top">
          <span>사이즈 ${row.label}</span>
          <span>${row.percent}%가 구매</span>
        </div>
        <div class="size-purchase-track">
          <span class="size-purchase-fill" style="width:${row.percent}%"></span>
        </div>
      </div>
    `).join("");
  }

  function renderReviewPoint(key) {
    if (!reviewBars || !reviewTip) return;
    const data = reviewData[key] || reviewData.size;
    const maxPercent = Math.max(...data.rows.map(item => item.percent));
    reviewTip.innerHTML = `<span>TIP</span><strong>${data.tip}</strong>`;
    reviewBars.innerHTML = data.rows.map(row => `
      <div class="review-point-row${row.percent === maxPercent ? " is-primary" : ""}">
        <div class="review-point-row-top">
          <span>${row.label}</span>
          <span>${row.count}명</span>
        </div>
        <div class="review-point-track">
          <span class="review-point-fill" style="width:${row.percent}%"></span>
        </div>
      </div>
    `).join("");
  }

  if (sizeSelect) {
    renderSizeBars(sizeSelect.value);
    sizeSelect.addEventListener("change", () => renderSizeBars(sizeSelect.value));
  }

  if (reviewTabs.length) {
    renderReviewPoint("size");
    reviewTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        reviewTabs.forEach(item => item.classList.remove("active"));
        tab.classList.add("active");
        renderReviewPoint(tab.dataset.reviewPoint);
      });
    });
  }
})();

/* ════════════════════════════════════════════
   최근 본 상품 — common.js 의 saveRecentProduct 사용
   패널 이벤트는 common.js 의 initQuickMenu 가 처리
   ════════════════════════════════════════════ */

function initRecentViewedProduct() {
  const firstColorObj = product.colors[0];
  saveRecentProduct({
    id:    product.code,
    brand: "EASE FIT",
    title: product.name,
    price: product.price,
    image: firstColorObj ? firstColorObj.images[0] : "",
    url:   "./product-detail.html?id=" + product.code
  });
}

/* 실행 */
