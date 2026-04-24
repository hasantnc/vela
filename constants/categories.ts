import { Category } from '@/types';

export const CATEGORIES: Category[] = [
  { id:'food', label:'Yemek', emoji:'🍽️', color:'#FF6B6B',
    sub:[
      { id:'coffee', label:'Kahve', emoji:'☕', details:['Starbucks','Yerel Kafe','Otomat'] },
      { id:'rest', label:'Restoran', emoji:'🍜', details:['Fine Dining','Orta Segment','Sokak'] },
      { id:'market', label:'Market', emoji:'🛒', details:['Migros','CarrefourSA','BİM','A101'] },
      { id:'fast', label:'Fast Food', emoji:'🍔', details:["McDonald's",'Burger King','KFC'] },
    ]},
  { id:'transport', label:'Ulaşım', emoji:'🚇', color:'#4ECDC4',
    sub:[
      { id:'metro', label:'Metro', emoji:'🚌', details:['İstanbulkart','Günlük'] },
      { id:'taxi', label:'Taksi', emoji:'🚕', details:['Uber','BiTaksi','Taksi'] },
      { id:'fuel', label:'Yakıt', emoji:'⛽', details:['Shell','BP','Opet'] },
    ]},
  { id:'entertain', label:'Eğlence', emoji:'🎬', color:'#A78BFA',
    sub:[
      { id:'cinema', label:'Sinema', emoji:'🎥', details:['Cinemaximum','CGV'] },
      { id:'subs', label:'Abonelik', emoji:'📺', details:['Netflix','Spotify','Disney+'] },
      { id:'games', label:'Oyun', emoji:'🎮', details:['Steam','PlayStation','Mobile'] },
    ]},
  { id:'bills', label:'Fatura', emoji:'📄', color:'#FCD34D',
    sub:[
      { id:'elec', label:'Elektrik', emoji:'⚡', details:['AYEDAŞ','BEDAŞ'] },
      { id:'water', label:'Su', emoji:'💧', details:['İSKİ'] },
      { id:'inet', label:'İnternet', emoji:'📡', details:['Turkcell','Vodafone','TT'] },
    ]},
  { id:'shopping', label:'Alışveriş', emoji:'🛍️', color:'#FB923C',
    sub:[
      { id:'cloth', label:'Giyim', emoji:'👕', details:['Zara','H&M','LC Waikiki'] },
      { id:'tech', label:'Teknoloji', emoji:'💻', details:['Apple','Samsung','Trendyol'] },
      { id:'home', label:'Ev & Yaşam', emoji:'🏠', details:['IKEA','Koçtaş'] },
    ]},
  { id:'health', label:'Sağlık', emoji:'🏥', color:'#34D399',
    sub:[
      { id:'pharm', label:'Eczane', emoji:'💊', details:['Reçeteli','OTC','Vitamin'] },
      { id:'doc', label:'Doktor', emoji:'👨‍⚕️', details:['Muayene','Tahlil'] },
      { id:'gym', label:'Spor', emoji:'🏋️', details:['Gym','Yoga','Yüzme'] },
    ]},
];