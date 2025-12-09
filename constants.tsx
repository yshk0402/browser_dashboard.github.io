
import { LinkItem, NewsItem, HabitStatus } from './types';

// --- Top Section Links (Initial Data) ---

export const INITIAL_DEV_LINKS: LinkItem[] = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Supabase', url: 'https://supabase.com' },
  { name: 'Vercel', url: 'https://vercel.com' },
];

export const INITIAL_CHAT_LINKS: LinkItem[] = [
  { name: 'ChatGPT', url: 'https://chat.openai.com' },
  { name: 'Gemini', url: 'https://gemini.google.com' },
  { name: 'Claude', url: 'https://claude.ai' },
];

export const INITIAL_APP_LINKS: LinkItem[] = [
  { name: 'Figma', url: 'https://figma.com' },
  { name: 'Trello', url: 'https://trello.com' },
  { name: 'Spotify', url: 'https://spotify.com' },
];

// --- Middle Section (Initial Data) ---

export const INITIAL_GOOGLE_LINKS: LinkItem[] = [
  { name: 'Gmail', url: 'https://gmail.com' },
  { name: 'Calendar', url: 'https://calendar.google.com' },
  { name: 'Drive', url: 'https://drive.google.com' },
  { name: 'Meet', url: 'https://meet.google.com' },
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'The Future of AI Software Development',
    url: 'https://news.ycombinator.com',
    source: 'Hacker News',
    date: '2024-03-21',
    category: 'Tech'
  },
  {
    id: '2',
    title: 'NVIDIA announces new Blackwell GPU architecture',
    url: 'https://www.theverge.com',
    source: 'The Verge',
    date: '2024-03-20',
    category: 'Hardware'
  },
  {
    id: '3',
    title: 'Global markets rally ahead of Fed meeting',
    url: 'https://www.reuters.com',
    source: 'Reuters',
    date: '2024-03-19',
    category: 'Finance'
  },
  {
    id: '4',
    title: 'SpaceX Starship reaches orbit for the first time',
    url: 'https://techcrunch.com',
    source: 'TechCrunch',
    date: '2024-03-18',
    category: 'Space'
  },
];

export const INITIAL_STATUS_CARDS: HabitStatus[] = [
  { id: 'coding', title: 'Coding', target: '2 hours/day', completed: false },
  { id: 'reading', title: 'Reading', target: '30 mins/day', completed: false },
  { id: 'exercise', title: 'Exercise', target: '1 hour/day', completed: false },
  { id: 'meditation', title: 'Meditation', target: '15 mins/day', completed: false },
  { id: 'journaling', title: 'Journaling', target: '1 page/day', completed: false },
];

// --- Google Apps Script Code for UI Display ---
export const GAS_SCRIPT_CODE = `/**
 * --- SETUP INSTRUCTIONS ---
 * 1. Paste this code into Code.gs
 * 2. Run the 'setup' function once to create sheets.
 * 3. Deploy as Web App (Execute as: Me, Access: Anyone).
 * 4. Set up a Trigger:
 *    - Function: refreshNews
 *    - Event Source: Time-driven
 *    - Type: Hour timer (Every hour)
 */

// Configuration: Add your RSS feeds here
const RSS_FEEDS = [
  { url: 'https://zenn.dev/feed', source: 'Zenn', category: 'Tech' },
  { url: 'https://qiita.com/popular-items/feed', source: 'Qiita', category: 'Tech' },
  { url: 'https://b.hatena.ne.jp/hotentry/it.rss', source: 'Hatena', category: 'General' },
  { url: 'https://www.publickey1.jp/atom.xml', source: 'Publickey', category: 'Infrastructure' }
];

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = doc.getSheetByName('Data') || doc.insertSheet('Data');
    const newsSheet = doc.getSheetByName('News') || doc.insertSheet('News');
    
    // Read User Data
    const userDataStr = dataSheet.getRange('A1').getValue();
    let userData = {};
    if (userDataStr && userDataStr !== "") {
      try { userData = JSON.parse(userDataStr); } catch (e) {}
    }
    
    // Read News Data
    const newsDataStr = newsSheet.getRange('A1').getValue();
    let newsData = [];
    if (newsDataStr && newsDataStr !== "") {
      try { newsData = JSON.parse(newsDataStr); } catch (e) {}
    }
    
    // Merge: User Data + RSS News
    const result = { ...userData, news: newsData };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Server Error: " + e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Data') || doc.insertSheet('Data');
    
    if (!e.postData || !e.postData.contents) {
       throw new Error("No post data received");
    }

    const payload = JSON.parse(e.postData.contents);
    
    // IMPORTANT: We do NOT save 'news' here to avoid overwriting RSS data with stale client data.
    // The client should have stripped 'news' before sending, but we double-check.
    delete payload.news;
    
    sheet.getRange('A1').setValue(JSON.stringify(payload));
    sheet.getRange('B1').setValue(new Date().toISOString());
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function refreshNews() {
  let allNews = [];
  
  RSS_FEEDS.forEach(feed => {
    try {
      const xml = UrlFetchApp.fetch(feed.url).getContentText();
      const document = XmlService.parse(xml);
      const root = document.getRootElement();
      
      let items = [];
      const namespace = root.getNamespace();
      
      // Atom Feed
      if (namespace && namespace.getURI() === 'http://www.w3.org/2005/Atom') {
        items = root.getChildren('entry', namespace).map(entry => {
          const title = entry.getChild('title', namespace).getText();
          const link = entry.getChild('link', namespace).getAttribute('href').getValue();
          const dateStr = entry.getChild('updated', namespace).getText();
          return {
            title: title,
            url: link,
            date: dateStr,
            source: feed.source,
            category: feed.category
          };
        });
      } 
      // RSS 2.0 / 1.0
      else {
        // RSS 1.0 (RDF)
        if (root.getName() === 'RDF') {
           const ns = root.getNamespace(); // http://purl.org/rss/1.0/
           items = root.getChildren('item', ns).map(item => {
             return {
               title: item.getChild('title', ns).getText(),
               url: item.getChild('link', ns).getText(),
               date: item.getChild('date', XmlService.getNamespace('http://purl.org/dc/elements/1.1/')) ? item.getChild('date', XmlService.getNamespace('http://purl.org/dc/elements/1.1/')).getText() : new Date().toISOString(),
               source: feed.source,
               category: feed.category
             };
           });
        } else {
           // RSS 2.0
           const channel = root.getChild('channel');
           items = channel.getChildren('item').map(item => {
             const pubDate = item.getChild('pubDate') ? item.getChild('pubDate').getText() : new Date().toISOString();
             return {
               title: item.getChild('title').getText(),
               url: item.getChild('link').getText(),
               date: pubDate,
               source: feed.source,
               category: feed.category
             };
           });
        }
      }
      
      allNews = allNews.concat(items);
    } catch (e) {
      console.log('Error fetching ' + feed.url, e);
    }
  });
  
  // Format and Sort
  const formattedNews = allNews.map((item, index) => {
    let dateObj = new Date(item.date);
    if (isNaN(dateObj.getTime())) dateObj = new Date();
    
    return {
      id: 'rss-' + Date.now() + '-' + index,
      title: item.title,
      url: item.url,
      source: item.source,
      date: dateObj.toISOString().split('T')[0], // YYYY-MM-DD
      category: item.category
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30); // Keep top 30
    
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName('News') || doc.insertSheet('News');
  sheet.getRange('A1').setValue(JSON.stringify(formattedNews));
  sheet.getRange('B1').setValue(new Date().toISOString());
}

function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  if (!doc.getSheetByName('Data')) doc.insertSheet('Data');
  if (!doc.getSheetByName('News')) doc.insertSheet('News');
}`;
