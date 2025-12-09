
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
export const GAS_SCRIPT_CODE = `function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Data') || doc.insertSheet('Data');
    const data = sheet.getRange('A1').getValue();
    
    let result = {};
    if (data && data !== "") {
      try {
        result = JSON.parse(data);
      } catch (err) {
        result = { error: "Invalid JSON in sheet: " + err.toString() };
      }
    }
    
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
    
    // The payload is passed as raw post data (stringified JSON)
    // We check if e.postData exists to avoid errors if called incorrectly
    if (!e.postData || !e.postData.contents) {
       throw new Error("No post data received");
    }

    const payload = e.postData.contents;
    
    // Save to cell A1
    sheet.getRange('A1').setValue(payload);
    // Update timestamp in B1
    sheet.getRange('B1').setValue(new Date().toISOString());
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
