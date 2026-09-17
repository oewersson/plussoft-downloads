const API_BASE = "http://192.168.5.206:7008";

const elements = {
  menu: document.querySelector(".menu"),
  grid: document.getElementById("grid"),
  searchInput: document.getElementById("searchInput"),
  sectionTitle: document.getElementById("sectionTitle"),
  emptyState: document.getElementById("emptyState"),
  summaryCount: document.getElementById("summaryCount"),

  detailsModal: document.getElementById("detailsModal"),
  closeModal: document.getElementById("closeModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalCategory: document.getElementById("modalCategory"),
  modalDesc: document.getElementById("modalDesc"),
  modalIcon: document.getElementById("modalIcon"),
  modalVersions: document.getElementById("modalVersions") || createModalVersionsContainer()
};

let allCategories = [];
let allCards = [];
let currentCategoryId = null;
let currentCategoryName = "";

async function init() {
  await fetchCategories();
  if (allCategories.length > 0) {
    const firstCat = allCategories[0];
    const id = firstCat.categoria_id || firstCat.id || firstCat.ID;
    const nome = firstCat.categoria_nome || firstCat.nome || firstCat.NOME || "Sem Nome";
    selectCategory(id, nome);
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/site/categoria/listar`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    // Se a API retornar { data: [...] } ou algo similar, precisamos extrair o array.
    // Assumimos aqui que ou retorna o array direto, ou num campo padrão 'data'.
    allCategories = Array.isArray(data) ? data : (data.data || data.categorias || []);
    
    console.log("Categorias recebidas:", allCategories);
    renderCategories();
  } catch (err) {
    console.error("Erro ao buscar categorias:", err);
    elements.menu.innerHTML = `<div style="padding:15px;color:red;font-size:12px;">Erro ao carregar categorias. Verifique o F12 (Console).<br><br>${err.message}</div>`;
  }
}

async function fetchCardsByCategory(id) {
  elements.grid.innerHTML = "<p style='padding:20px; color:#666;'>Carregando...</p>";
  elements.emptyState.style.display = "none";
  try {
    const res = await fetch(`${API_BASE}/site/cards/listar?id=${id}`);
    if (res.status === 404) {
      allCards = [];
      applyFilters();
      return;
    }
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    allCards = Array.isArray(data) ? data : (data.value || data.data || data.cards || []);
    console.log("Cards recebidos da categoria " + id + ":", allCards);
    applyFilters();
  } catch (err) {
    console.error("Erro ao buscar cards:", err);
    elements.grid.innerHTML = "<p style='padding:20px; color:red;'>Erro ao carregar aplicativos.</p>";
  }
}

function renderCategories() {
  elements.menu.innerHTML = "";
  
  if (!allCategories || allCategories.length === 0) {
    elements.menu.innerHTML = `<div style="padding:15px;color:#666;font-size:12px;">Nenhuma categoria encontrada no JSON.</div>`;
    return;
  }
  
  allCategories.forEach(cat => {
    // Tenta pegar o nome da categoria pelos campos mais comuns baseados na sua Query SQL
    const id = cat.categoria_id || cat.id || cat.ID;
    const nome = cat.categoria_nome || cat.nome || cat.NOME || "Sem Nome";
    
    const btn = document.createElement("button");
    btn.className = "menu-item";
    btn.dataset.id = id;
    btn.innerHTML = `
      <span class="menu-text">${nome}</span>
      <span class="menu-chevron">›</span>
    `;
    btn.addEventListener("click", () => {
      selectCategory(id, nome);
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        const backdrop = document.getElementById("sidebarBackdrop");
        if (sidebar) sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
      }
    });
    elements.menu.appendChild(btn);
  });
}

async function selectCategory(id, name) {
  currentCategoryId = id;
  currentCategoryName = name;
  elements.sectionTitle.textContent = name;
  
  // Atualiza active class
  document.querySelectorAll(".menu-item").forEach(btn => {
    if (btn.dataset.id == id) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  
  elements.searchInput.value = "";
  await fetchCardsByCategory(id);
}

function formatDateTime(dateVal) {
  if (!dateVal) return "-";
  try {
    if (typeof dateVal === "string") {
      const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const [_, year, month, day, hours, minutes] = match;
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return "-";
  }
}

function renderCards(cardsToRender) {
  elements.grid.innerHTML = "";
  
  if (cardsToRender.length === 0) {
    elements.emptyState.style.display = "block";
  } else {
    elements.emptyState.style.display = "none";
    cardsToRender.forEach(card => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4";

      const article = document.createElement("article");
      article.className = "card h-100";
      
      const versaoAtual = card.versao || "N/A";
      const dataStr = formatDateTime(card.versao_datetime || card.datetime);
      
      const rawLogo = card.card_logo || card.imagem || card.logo;
      const isValidImage = typeof rawLogo === "string" && (
        rawLogo.startsWith("http://") || 
        rawLogo.startsWith("https://") || 
        rawLogo.startsWith("data:image/") || 
        rawLogo.startsWith("/") || 
        rawLogo.startsWith("./") || 
        /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(rawLogo)
      );
      const imgSrc = isValidImage ? rawLogo : "https://plussoft.com.br/img/program-default-logo.svg";
      const desc = card.card_descricao || card.descricao || card.detalhes || "";
      const nome = card.card_nome || card.nome || "Sem nome";
      let link = card.card_link || card.link || "#";
      if (link && link.startsWith("www.")) {
        link = "https://" + link;
      }
      const id = card.card_id || card.id;
      
      article.innerHTML = `
        <div class="card-header">
          <div class="card-header-left">
            <div class="app-icon-wrapper">
              <img src="${imgSrc}" class="app-icon-img" alt="Logo ${nome}" />
            </div>
            <h3 class="app-title">${nome}</h3>
          </div>
          <div class="card-header-meta">
            <span class="version-highlight">Versão ${versaoAtual}</span>
            <span class="updated-time">${dataStr}</span>
          </div>
        </div>
        <div class="card-desc-row">
          <p class="card-desc">${desc || 'Aplicativo integrado.'}</p>
          <span class="card-dots" title="Mais opções">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="19" cy="12" r="2"/>
            </svg>
          </span>
        </div>
        <div class="card-divider"></div>
        <div class="card-actions">
          <a href="${link}" target="_blank" class="btn btn-primary btn-round">
            Versão Atual
          </a>
          <button type="button" class="btn btn-secondary btn-round" onclick="openDetails(${id}, '${nome}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l3 2"/>
            </svg>
            Versões Anteriores
          </button>
        </div>
      `;
      col.appendChild(article);
      elements.grid.appendChild(col);
    });
  }
  elements.summaryCount.textContent = cardsToRender.length;
}

function applyFilters() {
  const term = elements.searchInput.value.trim().toLowerCase();
  
  let filtered = allCards;
  
  if (term) {
    filtered = filtered.filter(c => {
      const nome = c.card_nome || c.nome || "";
      return nome.toLowerCase().includes(term);
    });
  }
  
  renderCards(filtered);
}

elements.searchInput.addEventListener("input", applyFilters);

// --- Detalhes & Versões ---
function createModalVersionsContainer() {
  const div = document.createElement("div");
  div.id = "modalVersions";
  div.style.marginTop = "20px";
  // Procura se tem conteudo no modal, e anexa
  const modalContent = document.querySelector(".modal-content");
  if(modalContent) modalContent.appendChild(div);
  return div;
}

async function openDetails(cardId, cardName) {
  elements.modalTitle.innerText = cardName;
  elements.modalCategory.innerText = currentCategoryName;
  elements.modalDesc.innerText = "Carregando histórico de versões...";
  elements.modalVersions.innerHTML = "";
  elements.detailsModal.classList.add("active");
  elements.detailsModal.style.display = "flex";
  
  try {
    const res = await fetch(`${API_BASE}/site/versoes_cards/listar`);
    const versoes = await res.json();
    const versoesList = Array.isArray(versoes) ? versoes : (versoes.value || versoes.data || []);
    
    // Filtrar as versões desse card (assumindo que retorna id_cards ou similar)
    const cardVersions = versoesList.filter(v => v.id_cards == cardId || v.card_id == cardId);
    
    if (cardVersions.length === 0) {
      elements.modalDesc.innerText = "Nenhuma versão encontrada para este item.";
    } else {
      elements.modalDesc.innerText = "Histórico de Versões:";
      let html = '<ul style="list-style:none; padding:0; margin-top:10px; border-top:1px solid #ddd;">';
      cardVersions.forEach(v => {
        const dataStr = formatDateTime(v.datetime || v.versao_datetime);
        html += `
          <li style="padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${v.versao}</strong> <span style="color:#666; font-size: 0.9em; margin-left: 10px;">${dataStr}</span>
            </div>
            ${v.link ? `<a href="${v.link}" target="_blank" class="btn btn-primary btn-sm">Baixar</a>` : ''}
          </li>
        `;
      });
      html += '</ul>';
      elements.modalVersions.innerHTML = html;
    }
  } catch(err) {
    console.error("Erro ao carregar versões", err);
    elements.modalDesc.innerText = "Erro ao carregar o histórico de versões.";
  }
}

elements.closeModal.addEventListener("click", () => {
  elements.detailsModal.classList.remove("active");
  elements.detailsModal.style.display = "none";
});

elements.detailsModal.addEventListener("click", (e) => {
  if (e.target === elements.detailsModal) {
    elements.detailsModal.classList.remove("active");
    elements.detailsModal.style.display = "none";
  }
});

// UI controls
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) sidebar.classList.toggle("open");
  if (backdrop) backdrop.classList.toggle("active");
}



// Inicializar
init();