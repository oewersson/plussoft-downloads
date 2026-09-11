const menuItems = [...document.querySelectorAll(".menu-item")];
const cards = [...document.querySelectorAll(".card")];
const searchInput = document.getElementById("searchInput");
const sectionTitle = document.getElementById("sectionTitle");
const emptyState = document.getElementById("emptyState");
const summaryCount = document.getElementById("summaryCount");
const btnGrid = document.getElementById("btnGrid");
const btnList = document.getElementById("btnList");
const gridContainer = document.getElementById("grid");

let currentCategory = "PlusSoft";

const labels = {
  PlusSoft: "Ferramentas PlusSoft",
  ShopControl9: "Atualizações do ShopControl9",
  Acesso: "Acesso Remoto",
  Debug: "Debug Remoto",
  Links: "Links",
  SQL: "SQL Server",
  Management: "Management Studio",
  Gerenciamento: "Gerenciamento",
};

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach((card) => {
    const categoryMatch = card.dataset.category === currentCategory;
    const searchMatch =
      !term || card.dataset.search.toLowerCase().includes(term);
    const show = categoryMatch && searchMatch;

    card.style.display = show ? "" : "none";
    if (show) visible++;
  });

  summaryCount.textContent = visible;
  emptyState.style.display = visible === 0 ? "block" : "none";
}

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuItems.forEach((x) => x.classList.remove("active"));
    item.classList.add("active");

    currentCategory = item.dataset.filter;
    sectionTitle.textContent = labels[currentCategory] || currentCategory;
    searchInput.value = "";
    applyFilters();

    if (window.innerWidth <= 760) {
      document.getElementById("sidebar").classList.remove("open");
    }
  });
});

if (btnGrid && btnList && gridContainer) {
  btnGrid.addEventListener("click", () => {
    gridContainer.classList.remove("list-view");
    btnGrid.classList.add("active");
    btnList.classList.remove("active");
  });

  btnList.addEventListener("click", () => {
    gridContainer.classList.add("list-view");
    btnList.classList.add("active");
    btnGrid.classList.remove("active");
  });
}

searchInput.addEventListener("input", applyFilters);

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  } else if (e.key === "Escape") {
    if (detailsModal.classList.contains("active")) {
      detailsModal.classList.remove("active");
    } else if (document.activeElement === searchInput) {
      searchInput.value = "";
      applyFilters();
      searchInput.blur();
    }
  }
});

// Modal Logic
const detailsModal = document.getElementById("detailsModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalDesc = document.getElementById("modalDesc");
const modalIcon = document.getElementById("modalIcon");

document.querySelectorAll(".card").forEach(card => {
  const detailBtn = card.querySelector(".btn-secondary");
  if(detailBtn) {
    detailBtn.addEventListener("click", () => {
      const titleNode = card.querySelector(".app-title") || card.querySelector("h3");
      const categoryNode = card.querySelector(".app-category") || card.querySelector("span");
      const descNode = card.querySelector("p");
      
      const title = titleNode ? titleNode.textContent : "";
      const categoryText = categoryNode ? categoryNode.textContent : "";
      const desc = descNode ? descNode.textContent : "";
      
      const iconNode = card.querySelector(".app-icon") || card.querySelector(".app-icon-img");
      const iconHtml = iconNode ? iconNode.outerHTML : '';
      
      modalTitle.innerText = title;
      modalCategory.innerText = categoryText;
      modalDesc.innerText = desc;
      modalIcon.innerHTML = iconHtml;
      
      detailsModal.classList.add("active");
    });
  }
});

closeModal.addEventListener("click", () => {
  detailsModal.classList.remove("active");
});

detailsModal.addEventListener("click", (e) => {
  if(e.target === detailsModal) {
    detailsModal.classList.remove("active");
  }
});

applyFilters();