const { createClient } = require('microcms-js-sdk');
const Store = require('electron-store');
const https = require('https');

class MicroCMSService {
  constructor() {
    this.store = new Store();
    this.serviceDomain = '';
    this.apiKey = '';
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

    this.serviceDomain = settings.serviceDomain;
    this.apiKey = settings.apiKey;
    this.endpoint = settings.endpoint;

    console.log('MicroCMSクライアント初期化完了');
  }

  async fetchContents() {
    if (!this.serviceDomain || !this.apiKey || !this.endpoint) {
      console.warn('MicroCMS設定が未設定です。設定画面で設定してください。');
    }

    if (!this.client) {
      this.initialize();
    }
    
    if (!this.client) {
      console.warn('MicroCMS設定が未設定のため、データを取得できません。');
      return [];
    }
    
    try {
      const contentApi = await this.client.get({
        endpoint: this.endpoint, 
      });
      const managementApi = await this.requestManagementApi();
      const data = this.processContent(contentApi, managementApi);
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

  processContent(contentData, managementData) {
    if (contentData && contentData.contents && contentData.contents.length > 0 && managementData && managementData.contents && managementData.contents.length) {
      const currentDay = this.getCurrentDayOfWeek();
      const currentWeek = this.getCurrentWeekOfMonth();
      
      return contentData.contents.map((item) => {
        let processedItem = null;
        const manage = managementData.contents.find(contentData => contentData.id === item.id);
        
        if (item.type[0] == "image") {
          processedItem = {
            id: item.id,
            type: "image",
            url: item.img.url,
            status: manage.status[0] ?? null,
            reservationPublishTime: manage.reservationTime?.publishTime ?? null,
            reservationStopTime: manage.reservationTime?.stopTime  ?? null,
          }
        } else if (item.type[0] == "iframe" && item.iframeUrl) {
          processedItem = {
            id: item.id,
            type: "iframe",
            url: item.iframeUrl,
            status: manage.status[0] ?? null,
            reservationPublishTime: manage.reservationTime?.publishTime  ?? null,
            reservationStopTime: manage.reservationTime?.stopTime  ?? null,
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

  async requestManagementApi() {
    return new Promise((resolve, reject) => {
      const url = `https://${this.serviceDomain}.microcms-management.io/api/v1/contents/${this.endpoint}`;
      const options = {
        headers: {
          'X-MICROCMS-API-KEY': this.apiKey,
          depth: 2,
        }
      };
      https.get(url, options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          console.log('Request to api completed');
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            console.error('Failed to parse JSON:', error);
            reject(error);
          }
        });
        
        response.on('error', (error) => {
          console.error('Request to api failed:', error);
          reject(error);
        });
      }).on('error', (error) => {
        console.error('Request to api failed:', error);
        reject(error);
      });
    });
  }
}

module.exports = new MicroCMSService();