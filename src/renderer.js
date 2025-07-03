// 色々初期設定
let currentSlideIndex = 0;
let contentData = [];
let slideInterval;
let urlArr = [];

// 曜日・週判定関数
function getCurrentDayOfWeek() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date();
  return days[today.getDay()];
}

function getCurrentWeekOfMonth() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const adjustedDate = today.getDate() + firstDayOfWeek - 1;
  const weekNumber = Math.ceil(adjustedDate / 7);
  
  if (weekNumber === 1) return '第1週';
  if (weekNumber === 2) return '第2週';
  if (weekNumber === 3) return '第3週';
  if (weekNumber === 4) return '第4週';
  if (weekNumber === 5) return '第5週';
  return '第1週';
}

// 予約公開時間とステータスによる表示制御
function isContentVisible(item) {
  const now = new Date();
  
  // reservationPublishTimeとreservationStopTimeがnullの場合かつstatusがPUBLISHの場合は表示
  if (!item.reservationPublishTime && !item.reservationStopTime && item.status === 'PUBLISH') {
    return true;
  }
  
  // 予約時間が設定されている場合の判定
  if (item.reservationPublishTime || item.reservationStopTime) {
    const publishTime = item.reservationPublishTime ? new Date(item.reservationPublishTime) : null;
    const stopTime = item.reservationStopTime ? new Date(item.reservationStopTime) : null;

    // 公開：未設定 / 公開停止：設定済(未来)
    if (!publishTime && stopTime && now < stopTime) {
      return true
    }
    // 公開：設定済(過去) / 公開停止：未設定
    if (!stopTime && publishTime && publishTime <= now) {
      return true
    }
    // 公開：設定済(過去) / 公開停止：設定済(未来)
    if (publishTime && stopTime && publishTime <= now && now < stopTime) {
      return true;
    }
    // 公開：設定済(未来) / 公開停止：設定済(過去)
    if (publishTime && stopTime && now < publishTime && now < stopTime) {
      return true;
    }
  }
  
  return false;
}

// コンテンツのフィルタリング関数
function filterContentBySchedule(data) {
  const currentDay = getCurrentDayOfWeek();
  const currentWeek = getCurrentWeekOfMonth();
  
  return data.filter(item => {
    if (!item) return false;
    
    // 予約公開時間とステータスによる表示制御
    if (!isContentVisible(item)) {
      return false;
    }
    
    // 曜日・週による表示制御
    if (!item.weekDay || !Array.isArray(item.weekDay) || item.weekDay.length === 0) {
      return true;
    }
    
    return item.weekDay.some(dayInfo => {
      const dayMatches = dayInfo.day[0] === currentDay;
      const weekMatches = dayInfo.week[0] === '毎週' || dayInfo.week[0] === currentWeek;
      return dayMatches && weekMatches;
    });
  });
}

// データの受け取り
async function displayContent() {
  try {
    const rawData = await window.electronAPI.fetchContents();
    contentData = rawData; // フィルタリングはスライド表示時に実行
    console.log('HTML側で受け取ったデータ:', rawData);
    
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
  // 現在表示可能なスライドをフィルタリング
  const visibleSlides = filterContentBySchedule(contentData);
  
  // 表示可能なスライドがない場合は何も操作しない
  if (visibleSlides.length === 0) return;
  
  // 重複防止で、既存のインターバルがあるなら、削除する
  if (slideInterval) {
    clearInterval(slideInterval);
  }
  
  // スライド設定を取得
  const slideSettings = await window.electronAPI.getSlideSettings();
  const slideSpeed = (slideSettings?.speed || 5) * 1000; // 秒をミリ秒に変換
  
  // 現在のインデックスを表示可能なスライドに調整
  currentSlideIndex = 0;
  showSlideFromVisibleList(visibleSlides, currentSlideIndex);
  
  slideInterval = setInterval(() => {
    // 毎回最新の表示可能スライドを取得
    const currentVisibleSlides = filterContentBySchedule(contentData);
    
    if (currentVisibleSlides.length === 0) {
      clearInterval(slideInterval);
      return;
    }
    
    currentSlideIndex = (currentSlideIndex + 1) % currentVisibleSlides.length;
    showSlideFromVisibleList(currentVisibleSlides, currentSlideIndex);
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

// 表示可能なスライドリストから指定インデックスのスライドを表示
function showSlideFromVisibleList(visibleSlides, index) {
  if (visibleSlides.length === 0) return;
  
  const targetSlide = visibleSlides[index];
  if (!targetSlide) return;
  
  // 全てのスライドを非表示にする
  const slides = document.querySelectorAll('.slide-item');
  slides.forEach(slide => {
    slide.classList.remove('active');
  });
  
  // 対象のスライドを表示
  const targetSlideElement = document.querySelector(`[data-index="${contentData.indexOf(targetSlide)}"]`);
  if (targetSlideElement) {
    targetSlideElement.classList.add('active');
  }
  
  console.log('Showing slide:', index, 'of', visibleSlides.length, 'visible slides');
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
  const rawData = event.detail || [];
  contentData = rawData; // フィルタリングはスライド表示時に実行
  
  if (contentData && contentData.length > 0) {
    createSlides(contentData);
    startSlideshow();
  }
});

// HTML側でデータを取得・更新するための関数
async function updateContent() {
  try {
    const rawData = await window.electronAPI.fetchContents();
    // HTML側にデータ更新を通知
    window.dispatchEvent(new CustomEvent('contentUpdated', { detail: rawData }));
    return rawData;
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

