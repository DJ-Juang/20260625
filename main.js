// main.js
let filteredData = [...rawData];
let currentPage = 1;
const itemsPerPage = 12;

function getThumbnail(url) {
    const idMatch = url.match(/\/d\/(.+?)\//);
    return idMatch ? `https://lh3.googleusercontent.com/d/${idMatch[1]}` : 'https://via.placeholder.com/400x260?text=No+Preview';
}

function initRegionFilter() {
    const regionSelect = document.getElementById('regionFilter');
    const regions = [...new Set(rawData.map(d => d.region))].sort();
    regions.forEach(r => regionSelect.add(new Option(r, r)));
}

function updateCountryOptions(selectedRegion) {
    const countrySelect = document.getElementById('countryFilter');
    countrySelect.innerHTML = '<option value="all">所有地點</option>';
    const availableCountries = rawData
        .filter(item => selectedRegion === 'all' || item.region === selectedRegion)
        .map(item => item.country);
    [...new Set(availableCountries)].sort().forEach(c => countrySelect.add(new Option(c, c)));
}

function renderGallery() {
    const gallery = document.getElementById('gallery');
    const stats = document.getElementById('stats');
    const emptyState = document.getElementById('emptyState');
    
    gallery.innerHTML = '';
    stats.textContent = `找到 ${filteredData.length} 筆資料 (第 ${currentPage} 頁)`;

    if (filteredData.length === 0) {
        emptyState.classList.remove('hidden');
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    emptyState.classList.add('hidden');

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredData.slice(start, start + itemsPerPage);

    pageItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col';
        card.innerHTML = `
            <div class="img-container">
                <img src="${getThumbnail(item.url)}" alt="${item.country}" onerror="this.src='https://via.placeholder.com/400x260?text=Image+Not+Found'">
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm">${item.year} (#${item.id})</div>
            </div>
            <div class="p-5 flex-grow">
                <div class="flex justify-between items-center mb-1">
                    <h3 class="font-bold text-slate-800 text-lg">${item.country} ${item.memo1}</h3>
                </div>
                <p class="text-slate-500 text-sm mb-4 italic">${item.region}</p>
                <a href="${item.url}" target="_blank" class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm">打開相簿</a>
            </div>
        `;
        gallery.appendChild(card);
    });
    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const createBtn = (label, page, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.disabled = disabled;
        btn.className = `min-w-[40px] h-10 px-3 rounded-lg font-medium ${active ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-100'} ${disabled ? 'opacity-30' : 'hover:bg-blue-50'}`;
        btn.onclick = () => { currentPage = page; renderGallery(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        return btn;
    };

    container.appendChild(createBtn('«', 1, false, currentPage === 1));
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            container.appendChild(createBtn(i, i, i === currentPage));
        }
    }
    container.appendChild(createBtn('»', totalPages, false, currentPage === totalPages));
}

function handleFilter() {
    const r = document.getElementById('regionFilter').value;
    const c = document.getElementById('countryFilter').value;
    filteredData = rawData.filter(item => (r === 'all' || item.region === r) && (c === 'all' || item.country === c));
    currentPage = 1;
    renderGallery();
}

window.onload = () => {
    initRegionFilter();
    document.getElementById('regionFilter').onchange = (e) => { updateCountryOptions(e.target.value); handleFilter(); };
    document.getElementById('countryFilter').onchange = handleFilter;
    document.getElementById('resetBtn').onclick = () => {
        document.getElementById('regionFilter').value = 'all';
        updateCountryOptions('all');
        document.getElementById('countryFilter').value = 'all';
        filteredData = [...rawData];
        currentPage = 1;
        renderGallery();
    };
    renderGallery();
};
