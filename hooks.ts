
import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardData } from './types';
import { 
  INITIAL_DEV_LINKS, 
  INITIAL_CHAT_LINKS, 
  INITIAL_APP_LINKS, 
  INITIAL_GOOGLE_LINKS, 
  INITIAL_NEWS
} from './constants';
import { fetchFromSheet, saveToSheet } from './api';
import { useLocalStorage } from './utils';

const DEFAULT_DATA: DashboardData = {
  devLinks: INITIAL_DEV_LINKS,
  chatLinks: INITIAL_CHAT_LINKS,
  appLinks: INITIAL_APP_LINKS,
  googleLinks: INITIAL_GOOGLE_LINKS,
  news: INITIAL_NEWS
};

export const useDashboardData = () => {
  // Store the Sheet URL in localStorage so we remember connection
  const [sheetUrl, setSheetUrl] = useLocalStorage<string>('dashboard_sheet_api_url', '');
  
  // Main Data State
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); // Has local changes?

  // Helper to migrate old bookmark format to new news format if needed
  const migrateData = (incoming: any): DashboardData => {
    const result = { ...DEFAULT_DATA, ...incoming };
    
    // 1. Handle "bookmarks" -> "news" rename
    if (incoming.bookmarks && !incoming.news) {
      // 2. Map old BookmarkItem to NewsItem if structure differs
      // Old: { name, url, tags } -> New: { title, url, source, date, category }
      result.news = incoming.bookmarks.map((b: any, i: number) => ({
        id: b.id || i.toString(),
        title: b.name || 'Untitled', // Map name to title
        url: b.url || '',
        source: 'Saved Link', // Default source
        date: new Date().toISOString().split('T')[0], // Default date
        category: Array.isArray(b.tags) ? b.tags[0] : 'General' // Take first tag
      }));
    }
    return result;
  };

  // Load data on mount or when URL changes
  useEffect(() => {
    if (!sheetUrl) {
      // If no URL, try loading from local storage backup or use defaults
      const localBackup = window.localStorage.getItem('dashboard_data_backup');
      if (localBackup) {
        try {
          const parsed = JSON.parse(localBackup);
          setData(migrateData(parsed));
        } catch (e) {
          console.warn("Failed to parse local backup", e);
          setData(DEFAULT_DATA);
        }
      }
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sheetData = await fetchFromSheet(sheetUrl);
        if (sheetData) {
          setData(migrateData(sheetData));
          // Update local backup
          window.localStorage.setItem('dashboard_data_backup', JSON.stringify(sheetData));
        } else {
          // Empty sheet, keep defaults but ready to sync
          setIsDirty(true); 
        }
      } catch (err) {
        setError('Failed to load data from Sheet.');
        // Fallback to local
        const localBackup = window.localStorage.getItem('dashboard_data_backup');
        if (localBackup) {
            try {
              const parsed = JSON.parse(localBackup);
              setData(migrateData(parsed));
            } catch (e) {
              setData(DEFAULT_DATA);
            }
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [sheetUrl]);

  // Debounced Save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveData = useCallback(async (newData: DashboardData) => {
    // Always save to local backup immediately
    window.localStorage.setItem('dashboard_data_backup', JSON.stringify(newData));
    
    if (!sheetUrl) return;

    setIsSaving(true);
    try {
      await saveToSheet(sheetUrl, newData);
      setIsDirty(false);
    } catch (err) {
      setError('Failed to save to Sheet.');
    } finally {
      setIsSaving(false);
    }
  }, [sheetUrl]);

  // Update function that triggers auto-save
  const updateData = useCallback((updater: (prev: DashboardData) => DashboardData) => {
    setData(prev => {
      const newData = updater(prev);
      
      // Debounce logic
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      setIsDirty(true);
      saveTimeoutRef.current = setTimeout(() => {
        saveData(newData);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return newData;
    });
  }, [saveData]);

  // Force manual save (e.g. before closing or on button click)
  const manualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveData(data);
  };

  return {
    data,
    updateData,
    isLoading,
    isSaving,
    isDirty,
    error,
    sheetUrl,
    setSheetUrl,
    manualSave
  };
};
