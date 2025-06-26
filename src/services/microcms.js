const { createClient } = require('microcms-js-sdk');
const Store = require('electron-store');

class MicroCMSService {
  constructor() {
    this.client = null;
    this.store = new Store();
    this.endpoint = '';
  }

  initialize() {
    const userSettings = this.store.get('userSettings', {});
    const settings = userSettings.microcms || {
      serviceDomain: '',
      apiKey: '',
      endpoint: ''
    };

    console.log('MicroCMS設定を読み込み:', settings);

    this.endpoint = settings.endpoint;
    
    if (!settings.serviceDomain || !settings.apiKey || !settings.endpoint) {
      console.warn('MicroCMS設定が未設定です。設定画面で設定してください。');
      console.log('serviceDomain:', settings.serviceDomain);
      console.log('apiKey:', settings.apiKey);
      return;
    }
    
    console.log('MicroCMSクライアントを初期化中...');
    this.client = createClient({
      serviceDomain: settings.serviceDomain,
      apiKey: settings.apiKey,
    });
    console.log('MicroCMSクライアント初期化完了');
  }

  async fetchContents() {
    if (!this.client) {
      this.initialize();
    }
    
    if (!this.client) {
      console.warn('MicroCMS設定が未設定のため、データを取得できません。');
      return [];
    }
    
    try {
      const response = await this.client.get({
        endpoint: this.endpoint, 
      });
      const data = this.processContent(response);
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error : ', error);
      return [];
    }
  }

  getCurrentDayOfWeek() {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const today = new Date();
    return days[today.getDay()];
  }

  getCurrentWeekOfMonth() {
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

  processContent(data) {
    if (data && data.contents && data.contents.length > 0) {
      const currentDay = this.getCurrentDayOfWeek();
      const currentWeek = this.getCurrentWeekOfMonth();
      
      return data.contents.map((item) => {
        let processedItem = null;
        
        if (item.type[0] == "image") {
          processedItem = {
            id: item.id,
            type: "image",
            url: item.img.url
          }
        } else if (item.type[0] == "iframe" && item.iframeUrl) {
          processedItem = {
            id: item.id,
            type: "iframe",
            url: item.iframeUrl
          }
        }
        
        if (processedItem && item.weekDay && Array.isArray(item.weekDay)) {
          processedItem.weekDay = item.weekDay;
        }
        
        return processedItem;
      }).filter(item => {
        if (!item) return false;
        
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

    return []
  }
}

module.exports = new MicroCMSService();