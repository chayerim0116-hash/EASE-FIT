const filterTabs = document.querySelectorAll(".keyword-filter-tab");
const filterPanel = document.getElementById("keywordFilterPanel");
const filterClose = document.querySelector(".keyword-filter-close");
const filterContents = document.querySelectorAll(".keyword-filter-content");
const keywordHelpButtons = document.querySelectorAll(".keyword-help-button");

const closeKeywordHelp = () => {
  keywordHelpButtons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.closest(".keyword-help-wrap")?.classList.remove("is-open");
  });
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
