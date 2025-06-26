// 色々初期設定
let currentSlideIndex = 0;
let contentData = [];
let slideInterval;
let urlArr = [];

// データの受け取り
async function displayContent() {
  try {
    contentData = await window.electronAPI.fetchContents();
    console.log('HTML側で受け取ったデータ:', contentData);
    
    if (contentData && contentData.length > 0) {
      createSlides(contentData);

      // CSPを動的に設定
      let csp = "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://digital-signage-test.microcms.io; img-src 'self' file: https://images.microcms-assets.io; ";
      if (urlArr) {
        csp += `frame-src 'self' ${urlArr.join(' ')}`;
      }
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = csp;
      document.head.appendChild(meta);

      startSlideshow();
    }
  } catch (error) {
    console.error('データ取得エラー:', error);
  }
}

// スライドを作る関数
function createSlides(data) {
  urlArr = [];
  const slideContainer = document.getElementById('slideContainer');
  slideContainer.innerHTML = '';
  
  data.forEach((item, index) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'slide-item';
    slideDiv.setAttribute('data-index', index);
    
    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.url;
      slideDiv.appendChild(img);
    } else if (item.type === 'iframe') {
      const div = document.createElement('div');
      div.className = 'slide-iframe';
      div.innerHTML = item.url;
      slideDiv.appendChild(div);

      const regex = /https?:\/\/[^\/"'\s]+/g;
      const matches = item.url.match(regex) || [];
      console.log(matches);
      urlArr = [...urlArr, ...new Set(matches)]

      console.log(urlArr)
    }
    
    slideContainer.appendChild(slideDiv);
  });
}

async function startSlideshow() {
  // 一つしかスライドがない場合は、何も操作しない
  if (contentData.length === 0) return;
  
  // 重複防止で、既存のインターバルがあるなら、削除する
  if (slideInterval) {
    clearInterval(slideInterval);
  }
  
  // スライド設定を取得
  const slideSettings = await window.electronAPI.getSlideSettings();
  const slideSpeed = (slideSettings?.speed || 5) * 1000; // 秒をミリ秒に変換
  
  showSlide(currentSlideIndex);
  
  slideInterval = setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % contentData.length;
    showSlide(currentSlideIndex);
  }, slideSpeed);
}

// スライドの現状何が見られているかを決める関数
function showSlide(index) {
  console.log(index);
  const slides = document.querySelectorAll('.slide-item');
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
}

// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', () => {
  console.log('HTML側のスクリプト実行開始');
  displayContent();
});

// データ更新時にスライドショーを再開始
window.addEventListener('contentUpdated', (event) => {
  if (slideInterval) {
    clearInterval(slideInterval);
  }
  currentSlideIndex = 0;
  contentData = event.detail || [];
  
  if (contentData && contentData.length > 0) {
    createSlides(contentData);
    startSlideshow();
  }
});

// HTML側でデータを取得・更新するための関数
async function updateContent() {
  try {
    const data = await window.electronAPI.fetchContents();
    // HTML側にデータ更新を通知
    window.dispatchEvent(new CustomEvent('contentUpdated', { detail: data }));
    return data;
  } catch (error) {
    console.error('Error fetching content:', error);
    return [];
  }
}

// メインプロセスからのコンテンツ更新を受信
window.electronAPI.onContentUpdated((data) => {
  console.log('Content updated from main process:', data);
  // HTML側にデータ更新を通知
  window.dispatchEvent(new CustomEvent('contentUpdated', { detail: data }));
});

// メインプロセスからのスライド速度更新を受信
window.electronAPI.onSlideSpeedUpdated((speed) => {
  console.log('Slide speed updated:', speed);
  // スライドショーを再開始
  if (contentData && contentData.length > 0) {
    startSlideshow();
  }
});

