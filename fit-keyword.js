const filterTabs = document.querySelectorAll(".keyword-filter-tab");
const filterPanel = document.getElementById("keywordFilterPanel");
const filterClose = document.querySelector(".keyword-filter-close");
const filterContents = document.querySelectorAll(".keyword-filter-content");
const keywordHelpButtons = document.querySelectorAll(".keyword-help-button");
const keywordChips = document.querySelectorAll(".keyword-chip");
const selectableFilterOptions = document.querySelectorAll(".swatch-option, .text-filter-list button, .price-check-list label");
const priceInputs = document.querySelectorAll(".price-input");
const priceApply = document.querySelector(".price-apply");
const selectedFilters = document.querySelector(".keyword-selected-filters");
const filterReset = document.querySelector(".filter-reset");
const filterApply = document.querySelector(".filter-apply");
const productCards = document.querySelectorAll(".keyword-product-card");

const closeKeywordHelp = () => {
  keywordHelpButtons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.closest(".keyword-help-wrap")?.classList.remove("is-open");
  });
};

const formatPriceValue = (value) => {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parsePriceValue = (value) => {
  const price = Number(value.replace(/\D/g, ""));
  return Number.isFinite(price) ? price : 0;
};

const getPriceLabel = () => {
  const [minInput, maxInput] = priceInputs;
  const minPrice = minInput?.value.trim() ?? "";
  const maxPrice = maxInput?.value.trim() ?? "";

  if (minPrice && maxPrice) return `${minPrice}원 ~ ${maxPrice}원`;
  if (minPrice) return `${minPrice}원 이상`;
  if (maxPrice) return `${maxPrice}원 이하`;
  return "";
};

const clearPriceFilter = () => {
  priceInputs.forEach((input) => {
    input.value = "";
  });
  selectedFilters?.replaceChildren();
  productCards.forEach((card) => {
    card.hidden = false;
  });
};

const getProductCardPrice = (card) => {
  const priceText = card.querySelector(".price-row strong")?.textContent ?? "";
  return parsePriceValue(priceText);
};

const applyPriceFilter = () => {
  const [minInput, maxInput] = priceInputs;
  const minPrice = parsePriceValue(minInput?.value ?? "");
  const maxPrice = parsePriceValue(maxInput?.value ?? "");

  if (!minPrice && !maxPrice) {
    productCards.forEach((card) => {
      card.hidden = false;
    });
    return;
  }

  productCards.forEach((card) => {
    const price = getProductCardPrice(card);
    const isAboveMin = !minPrice || price >= minPrice;
    const isBelowMax = !maxPrice || price <= maxPrice;
    card.hidden = !(isAboveMin && isBelowMax);
  });
};

const renderPriceFilter = () => {
  const label = getPriceLabel();

  selectedFilters?.replaceChildren();

  if (!label || !selectedFilters) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "keyword-selected-filter";
  button.textContent = label;
  button.setAttribute("aria-label", `${label} 가격 필터 삭제`);
  button.addEventListener("click", clearPriceFilter);
  selectedFilters.append(button);
};

const submitPriceFilter = () => {
  renderPriceFilter();
  applyPriceFilter();
};

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const panelName = tab.dataset.filterPanel;
    const isSameOpen = tab.classList.contains("is-open") && filterPanel?.classList.contains("is-open");

    if (isSameOpen) {
      filterPanel.classList.remove("is-open");
      tab.classList.remove("is-open");
      return;
    }

    filterTabs.forEach((item) => item.classList.remove("is-open"));
    filterContents.forEach((content) => {
      content.classList.toggle("is-active", content.dataset.filterContent === panelName);
    });
    tab.classList.add("is-open");
    filterPanel?.classList.add("is-open");
  });
});

filterClose?.addEventListener("click", () => {
  filterPanel?.classList.remove("is-open");
  filterTabs.forEach((tab) => tab.classList.remove("is-open"));
});

keywordChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    keywordChips.forEach((item) => item.classList.remove("is-selected"));
    chip.classList.add("is-selected");
  });
});

selectableFilterOptions.forEach((option) => {
  option.addEventListener("click", () => {
    option.classList.toggle("is-selected");
  });
});

priceInputs.forEach((input) => {
  input.addEventListener("input", () => {
    input.value = formatPriceValue(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitPriceFilter();
    }
  });
});

priceApply?.addEventListener("click", submitPriceFilter);
filterApply?.addEventListener("click", submitPriceFilter);

filterReset?.addEventListener("click", () => {
  clearPriceFilter();
  selectableFilterOptions.forEach((option) => option.classList.remove("is-selected"));
  document.querySelectorAll(".price-check-list input").forEach((input) => {
    input.checked = false;
  });
});

keywordHelpButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const wrap = button.closest(".keyword-help-wrap");
    const shouldOpen = !wrap?.classList.contains("is-open");

    closeKeywordHelp();

    if (shouldOpen) {
      wrap?.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element) || !event.target.closest(".keyword-help-wrap")) {
    closeKeywordHelp();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeKeywordHelp();
  }
});
