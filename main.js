const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let favorites = JSON.parse(localStorage.getItem('travel_favorites')) || [];

// 網頁載入完成後初始化
document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  renderGallery();
  renderPagination();
  updateStats();
  setupModal();
  setupLightbox(); // 啟用燈箱初始化
});

// 1. 頂部無縫滾動 Banner (已修正：讓影片能自動、靜音、循環播放)
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

// 2. 渲染 3x3 照片卡片網格
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageData = travelData.slice(startIndex, endIndex);

  grid.innerHTML = '';

  if (pageData.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-12">目前沒有任何紀錄資料。</p>`;
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

// 3. 分頁控制
function renderPagination() {
  const paginationNav = document.getElementById('pagination');
  if (!paginationNav) return;

  const totalPages = Math.ceil(travelData.length / ITEMS_PER_PAGE);
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

// 4. 數據統計更新
function updateStats() {
  const totalStat = document.getElementById('stat-total');
  const favStat = document.getElementById('stat-favorites');
  
  if (totalStat) totalStat.innerHTML = `${travelData.length} <span class="text-sm text-stone-400">個回憶</span>`;
  if (favStat) favStat.innerHTML = `${favorites.length} <span class="text-sm text-stone-400">個最愛</span>`;
}

// 5. 切換最愛狀態
window.toggleFavorite = function(id) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  
  localStorage.setItem('travel_favorites', JSON.stringify(favorites));
  renderGallery();
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
    renderGallery();
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