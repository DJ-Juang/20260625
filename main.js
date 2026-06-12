const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let filterMode = 'all'; // 'all'（全部）或 'favorites'（僅收藏）
let favorites = JSON.parse(localStorage.getItem('travel_favorites')) || [];

// 網頁載入完成後初始化
document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  setupFilterTabs(); // 初始化篩選標籤互動
  renderGallery();
  renderPagination();
  updateStats();
  setupModal();
  setupLightbox(); // 啟用燈箱初始化
});

// 取得當前篩選模式下的資料列表
function getFilteredData() {
  return filterMode === 'all' 
    ? travelData 
    : travelData.filter(item => favorites.includes(item.id));
}

// 1. 頂部無縫滾動 Banner
function initCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;

  const carouselItems = [...travelData, ...travelData, ...travelData];
  
  track.innerHTML = carouselItems.map(item => `
    <div class="w-48 h-32 mx-2 flex-shrink-0 overflow-hidden rounded shadow-sm border border-stone-800 bg-stone-900">
      ${item.type === 'video' 
        ? `<video src="${item.url}" class="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity duration-300" autoplay muted loop playsinline></video>`
        : `<img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity duration-300">`
      }
    </div>
  `).join('');
}

// 初始化篩選標籤的點擊事件與手勢樣式
function setupFilterTabs() {
  const totalBtn = document.getElementById('stat-total')?.parentElement;
  const favBtn = document.getElementById('stat-favorites')?.parentElement;

  if (totalBtn && favBtn) {
    // 注入基礎 RWD 手勢與雜誌感轉場動畫樣式
    totalBtn.className = "flex flex-col cursor-pointer transition-all duration-300 p-4 rounded-lg border border-transparent hover:bg-stone-50 select-none w-full md:w-auto";
    favBtn.className = "flex flex-col cursor-pointer transition-all duration-300 p-4 rounded-lg border border-transparent hover:bg-stone-50 select-none w-full md:w-auto";

    // 點擊「已紀錄的足跡」還原呈現所有照片
    totalBtn.addEventListener('click', () => {
      if (filterMode !== 'all') {
        filterMode = 'all';
        currentPage = 1;
        renderGallery();
        renderPagination();
        updateStats();
      }
    });

    // 點擊「我的私房收藏」只呈現最愛照片
    favBtn.addEventListener('click', () => {
      if (filterMode !== 'favorites') {
        filterMode = 'favorites';
        currentPage = 1;
        renderGallery();
        renderPagination();
        updateStats();
      }
    });
  }
}

// 2. 渲染 3x3 照片卡片網格 (支援動態篩選模式)
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const activeData = getFilteredData();
  
  // 安全限制：若因取消收藏導致當前頁數超出最大頁數，自動修正回最後一頁
  const totalPages = Math.ceil(activeData.length / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageData = activeData.slice(startIndex, endIndex);

  grid.innerHTML = '';

  // 處理無資料時的雜誌風提示（尤其是當收藏清單空空如也時）
  if (pageData.length === 0) {
    if (filterMode === 'favorites') {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 px-4 bg-stone-50 border border-dashed border-stone-200 rounded-lg">
          <i class="fa-regular fa-heart text-[#8C6239] opacity-40 text-4xl mb-4 block"></i>
          <p class="text-stone-600 font-light mb-1">您的「我的最愛」中目前空無一物</p>
          <p class="text-xs text-stone-400">點擊卡片右下角的愛心，就能將您心動的義瑞回憶珍藏在此！</p>
        </div>`;
    } else {
      grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-12">目前沒有任何紀錄資料。</p>`;
    }
    return;
  }

  pageData.forEach(item => {
    const isFav = favorites.includes(item.id);
    const card = document.createElement('div');
    card.className = "bg-white border border-stone-200 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 transform hover:-translate-y-1 group flex flex-col justify-between";
    
    const displayId = String(item.id).padStart(2, '0');

    card.innerHTML = `
      <!-- 上方預覽區：點擊原地觸發滿版燈箱 -->
      <div onclick="openLightbox(${item.id})" class="block relative aspect-[4/3] overflow-hidden bg-stone-100 cursor-pointer">
        ${item.type === 'video' 
          ? `
            <div class="absolute inset-0 flex items-center justify-center bg-stone-900 bg-opacity-40 z-10 text-white group-hover:scale-110 transition-transform duration-500">
              <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <i class="fa-solid fa-play text-lg translate-x-0.5"></i>
              </div>
            </div>
            <video src="${item.url}" class="w-full h-full object-cover" muted loop></video>
            `
          : `<img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out">`
        }
        <!-- 左上方：#ID 編號 -->
        <span class="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[10px] tracking-widest text-[#8C6239] px-2.5 py-1 uppercase rounded-sm font-bold z-10 shadow-sm border border-stone-100 font-serif">
          #${displayId}
        </span>
        <!-- 右上方：國家/景點分類 -->
        <span class="absolute top-3 right-3 bg-[#1A2535]/90 backdrop-blur-sm text-[10px] tracking-widest text-white px-2.5 py-1 uppercase rounded-sm font-semibold z-10 shadow-sm border border-white/10">
          ${item.category}
        </span>
      </div>
      
      <!-- 下方文字與收藏區 -->
      <div class="p-5 flex justify-between items-center bg-white border-t border-stone-50">
        <h3 class="text-sm font-light text-stone-800 tracking-wide truncate pr-4" title="${item.title}">
          ${item.title}
        </h3>
        <button onclick="toggleFavorite(${item.id})" class="text-stone-300 hover:text-red-400 transition-colors duration-300 p-1 focus:outline-none">
          <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'} text-lg"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 3. 分頁控制 (依據目前篩選後的資料長度動態調整)
function renderPagination() {
  const paginationNav = document.getElementById('pagination');
  if (!paginationNav) return;

  const activeData = getFilteredData();
  const totalPages = Math.ceil(activeData.length / ITEMS_PER_PAGE);
  paginationNav.innerHTML = '';

  if (totalPages <= 1) return;

  const createBtn = (label, targetPage, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.innerHTML = label;
    btn.disabled = disabled;
    
    if (active) {
      btn.className = "w-8 h-8 flex items-center justify-center text-xs bg-[#1A2535] text-white rounded-full font-medium transition-all duration-300";
    } else if (disabled) {
      btn.className = "w-8 h-8 flex items-center justify-center text-xs text-stone-300 cursor-not-allowed";
    } else {
      btn.className = "w-8 h-8 flex items-center justify-center text-xs text-stone-600 hover:bg-stone-100 rounded-full transition-all duration-300";
    }

    btn.addEventListener('click', () => {
      currentPage = targetPage;
      renderGallery();
      renderPagination();
      window.scrollTo({ top: 350, behavior: 'smooth' });
    });

    return btn;
  };

  paginationNav.appendChild(createBtn('<i class="fa-solid fa-angles-left text-[9px]"></i>', 1, currentPage === 1));
  paginationNav.appendChild(createBtn('<i class="fa-solid fa-angle-left text-[9px]"></i>', currentPage - 1, currentPage === 1));

  for (let i = 1; i <= totalPages; i++) {
    paginationNav.appendChild(createBtn(i, i, false, currentPage === i));
  }

  paginationNav.appendChild(createBtn('<i class="fa-solid fa-angle-right text-[9px]"></i>', currentPage + 1, currentPage === totalPages));
  paginationNav.appendChild(createBtn('<i class="fa-solid fa-angles-right text-[9px]"></i>', totalPages, currentPage === totalPages));
}

// 4. 數據統計與「頁籤視覺高亮狀態」同步更新
function updateStats() {
  const totalStat = document.getElementById('stat-total');
  const favStat = document.getElementById('stat-favorites');
  
  if (totalStat) totalStat.innerHTML = `${travelData.length} <span class="text-sm text-stone-400">個回憶</span>`;
  if (favStat) favStat.innerHTML = `${favorites.length} <span class="text-sm text-stone-400">個最愛</span>`;

  // 取得父容器進行視覺樣式切換
  const totalBtn = totalStat?.parentElement;
  const favBtn = favStat?.parentElement;

  if (totalBtn && favBtn) {
    if (filterMode === 'all') {
      // 高亮「已紀錄的足跡」
      totalBtn.classList.add('border-stone-300', 'bg-white', 'shadow-sm');
      totalBtn.classList.remove('border-transparent');
      
      // 暗化「我的私房收藏」
      favBtn.classList.remove('border-stone-300', 'bg-white', 'shadow-sm');
      favBtn.classList.add('border-transparent');
    } else {
      // 高亮「我的私房收藏」
      favBtn.classList.add('border-stone-300', 'bg-white', 'shadow-sm');
      favBtn.classList.remove('border-transparent');
      
      // 暗化「已紀錄的足跡」
      totalBtn.classList.remove('border-stone-300', 'bg-white', 'shadow-sm');
      totalBtn.classList.add('border-transparent');
    }
  }
}

// 5. 切換最愛狀態 (支援在我的最愛頁面取消收藏時立刻移除)
window.toggleFavorite = function(id) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  
  localStorage.setItem('travel_favorites', JSON.stringify(favorites));
  
  // 重新渲染當前視窗，並保持在合理的分頁範圍內
  renderGallery();
  renderPagination();
  updateStats();
};

// 6. 高級自訂二次確認彈出視窗 (Modal)
function setupModal() {
  const modal = document.getElementById('confirm-modal');
  const card = document.getElementById('modal-card');
  const btnReset = document.getElementById('btn-reset');
  const btnCancel = document.getElementById('modal-cancel');
  const btnConfirm = document.getElementById('modal-confirm');

  const openModal = () => {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      card.classList.remove('scale-95');
    }, 10);
  };

  const closeModal = () => {
    modal.classList.add('opacity-0');
    card.classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  };

  btnReset.addEventListener('click', openModal);
  btnCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  btnConfirm.addEventListener('click', () => {
    favorites = [];
    localStorage.removeItem('travel_favorites');
    filterMode = 'all'; // 重設時自動切換回呈現所有照片
    currentPage = 1;
    renderGallery();
    renderPagination();
    updateStats();
    closeModal();
  });
}

// 7. 滿版精緻相簿燈箱邏輯 (Lightbox)
function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.id === 'lightbox-content-box') {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
      closeLightbox();
    }
  });
}

// 打開燈箱
window.openLightbox = function(id) {
  const item = travelData.find(d => d.id === id);
  if (!item) return;

  const lightbox = document.getElementById('lightbox');
  const contentBox = document.getElementById('lightbox-content-box');
  const titleText = document.getElementById('lightbox-title');
  const categoryText = document.getElementById('lightbox-category');

  titleText.innerText = item.title;
  categoryText.innerText = item.category;

  if (item.type === 'video') {
    contentBox.innerHTML = `
      <video src="${item.url}" class="max-w-full max-h-[75vh] rounded-lg shadow-2xl" controls autoplay loop></video>
    `;
  } else {
    contentBox.innerHTML = `
      <img src="${item.url}" alt="${item.title}" class="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl">
    `;
  }

  lightbox.classList.remove('hidden');
  document.body.classList.add('overflow-hidden-lightbox');
  setTimeout(() => {
    lightbox.classList.remove('opacity-0');
  }, 10);
};

// 關閉燈箱
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  const contentBox = document.getElementById('lightbox-content-box');

  lightbox.classList.add('opacity-0');
  document.body.classList.remove('overflow-hidden-lightbox');
  
  setTimeout(() => {
    lightbox.classList.add('hidden');
    contentBox.innerHTML = ''; 
  }, 300);
}