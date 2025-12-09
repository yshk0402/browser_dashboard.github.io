
import React, { useState, useEffect } from 'react';
import { LinkList } from './components/LinkList';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/ui/Table';
import { Badge } from './components/ui/Badge';
import { ExternalLink, Newspaper, Settings2, X, Plus, Database, Loader2, Save, Copy, Check, FileCode, AlertCircle, Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog } from 'lucide-react';
import { NewsItem, LinkItem, DashboardData } from './types';
import { useDashboardData } from './hooks';
import { GAS_SCRIPT_CODE } from './constants';
import { format } from 'date-fns';

// --- Widget Component: Clock & Weather ---
const HeaderWidgets = () => {
  // Clock State
  const [time, setTime] = useState(new Date());

  // Weather State
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    // Clock Timer
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Weather Fetcher
    const fetchWeather = () => {
      setWeatherLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
              );
              const data = await res.json();
              if (data.current_weather) {
                setWeather({
                  temp: data.current_weather.temperature,
                  code: data.current_weather.weathercode,
                });
              }
            } catch (e) {
              console.error('Failed to fetch weather', e);
            } finally {
              setWeatherLoading(false);
            }
          },
          (err) => {
            console.warn('Geolocation permission denied or error', err);
            setWeatherLoading(false);
          }
        );
      } else {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 30 mins
    const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  // Weather Icon Helper
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-5 h-5 text-amber-500" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-slate-400" />;
    if (code >= 45 && code <= 48) return <CloudFog className="w-5 h-5 text-slate-400" />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-5 h-5 text-sky-300" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="w-5 h-5 text-purple-500" />;
    return <Cloud className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="flex flex-col items-end gap-1 text-slate-700">
      {/* Clock */}
      <div className="text-right">
         <div className="text-2xl font-bold leading-none tracking-tight font-mono text-slate-800">
           {format(time, 'HH:mm')}
         </div>
         <div className="text-xs text-slate-400 font-medium mt-1">
           {format(time, 'EEE, MMM d')}
         </div>
      </div>
      
      {/* Weather */}
      <div className="flex items-center gap-2 mt-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
         {weatherLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
         ) : weather ? (
           <>
             {getWeatherIcon(weather.code)}
             <span className="text-sm font-semibold">{weather.temp}°C</span>
           </>
         ) : (
           <span className="text-xs text-slate-400">No Weather</span>
         )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  // Global Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Unified Data Hook
  const { 
    data, 
    updateData, 
    isLoading, 
    isSaving, 
    isDirty, 
    sheetUrl, 
    setSheetUrl,
    manualSave,
    error 
  } = useDashboardData();

  // Local state for adding news
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newNewsItem, setNewNewsItem] = useState<{title: string, url: string, source: string, date: string, category: string}>({ 
    title: '', url: '', source: '', date: format(new Date(), 'yyyy-MM-dd'), category: '' 
  });

  // --- Handlers for Data Updates ---

  const updateLinkSection = (section: keyof DashboardData, newItems: LinkItem[]) => {
    updateData(prev => ({ ...prev, [section]: newItems }));
  };

  const handleDeleteNews = (id: string) => {
    updateData(prev => ({
      ...prev,
      news: prev.news.filter(b => b.id !== id)
    }));
  };

  const handleAddNews = () => {
    if (newNewsItem.title && newNewsItem.url) {
      const item: NewsItem = {
        id: Date.now().toString(),
        title: newNewsItem.title,
        url: newNewsItem.url,
        source: newNewsItem.source || 'Unknown',
        date: newNewsItem.date,
        category: newNewsItem.category || 'General'
      };
      updateData(prev => ({
        ...prev,
        news: [...prev.news, item]
      }));
      setNewNewsItem({ title: '', url: '', source: '', date: format(new Date(), 'yyyy-MM-dd'), category: '' });
      setIsAddingNews(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFaviconUrl = (urlStr: string) => {
    try {
      const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
      return ''; 
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 max-w-7xl mx-auto selection:bg-slate-100 selection:text-slate-900 relative">
      
      {/* 1. Header Section */}
      <header className="mb-12 flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">home</h1>
          <p className="text-slate-500 mt-2 font-light">Welcome back, Engineer.</p>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-2 mt-4">
             {isSaving ? (
               <span className="flex items-center text-xs text-slate-400 gap-1 animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>
             ) : isDirty ? (
               <span className="text-xs text-amber-500 flex items-center gap-1 cursor-pointer" onClick={manualSave} title="Click to save now">Unsaved changes</span>
             ) : sheetUrl && !error ? (
               <span className="text-xs text-green-500 flex items-center gap-1">Synced</span>
             ) : null}

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ml-4 border-l pl-4 border-slate-200">
              <span className="hidden md:inline">{isEditing ? 'Done' : 'Edit'}</span>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 rounded-full transition-colors ${isEditing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </label>
            <button 
              onClick={() => setShowSettings(true)}
              className={`p-1.5 rounded-full transition-colors ml-1 ${error ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              title="Connection Settings"
            >
              {error ? <AlertCircle className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right Side: Widgets */}
        <div className="flex-none">
           <HeaderWidgets />
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-2">
           <AlertCircle className="w-5 h-5 flex-none" />
           <div className="text-sm">
             <span className="font-semibold">Sync Error:</span> {error} 
             <button onClick={() => setShowSettings(true)} className="ml-2 underline hover:text-red-950">Check Settings</button>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-md ${error ? 'bg-red-100' : 'bg-slate-100'}`}>
                   {error ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Database className="w-5 h-5 text-slate-700" />}
                </div>
                <div>
                   <CardTitle>Sync with Google Sheets</CardTitle>
                   <p className="text-xs text-slate-500 font-normal mt-0.5">Store your data in your own private spreadsheet.</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-800 p-2"><X className="w-5 h-5"/></button>
            </CardHeader>
            <CardContent className="space-y-6 overflow-y-auto p-6">
              
              {/* Setup Guide */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-500" /> 
                  Setup Instructions
                </h3>
                
                <ol className="relative border-l border-slate-200 ml-3 space-y-6">
                  <li className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full -left-3 ring-4 ring-white text-xs font-semibold text-slate-600">1</span>
                    <h4 className="font-medium text-slate-900 text-sm">Create a Google Sheet</h4>
                    <p className="text-sm text-slate-500 mt-1">Create a new, empty Google Sheet in your Drive.</p>
                  </li>
                  <li className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full -left-3 ring-4 ring-white text-xs font-semibold text-slate-600">2</span>
                    <h4 className="font-medium text-slate-900 text-sm">Add Apps Script</h4>
                    <p className="text-sm text-slate-500 mt-1">In the sheet, go to <strong>Extensions &gt; Apps Script</strong>.</p>
                  </li>
                  <li className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full -left-3 ring-4 ring-white text-xs font-semibold text-slate-600">3</span>
                    <h4 className="font-medium text-slate-900 text-sm">Paste Code</h4>
                    <p className="text-sm text-slate-500 mt-1 mb-2">Delete any code in <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Code.gs</code> and paste the following:</p>
                    
                    <div className="relative group">
                      <pre className="bg-slate-900 text-slate-300 p-4 rounded-md text-xs font-mono overflow-x-auto h-32 border border-slate-800">
                        {GAS_SCRIPT_CODE}
                      </pre>
                      <button 
                        onClick={handleCopyCode}
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded backdrop-blur-sm transition-colors"
                        title="Copy code"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                  <li className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full -left-3 ring-4 ring-white text-xs font-semibold text-slate-600">4</span>
                    <h4 className="font-medium text-slate-900 text-sm">Deploy Web App</h4>
                    <ul className="text-sm text-slate-500 mt-1 list-disc list-inside space-y-2">
                      <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                      <li>Select type: <strong>Web app</strong>.</li>
                      <li>Description: "Dashboard API".</li>
                      <li>Execute as: <strong>Me</strong> (your email).</li>
                      <li className="text-slate-900 font-bold bg-yellow-50 inline-block px-1 rounded">Who has access: Anyone <span className="font-normal text-slate-600">(Crucial! Must be 'Anyone')</span></li>
                      <li>Click <strong>Deploy</strong> and copy the <strong>Web App URL</strong> below.</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      <strong>Note:</strong> If you see "Failed to fetch", you likely didn't select "Anyone". If you change code later, you must create a <strong>New deployment</strong> (Manage deployments won't update the active version).
                    </p>
                  </li>
                </ol>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Input Field */}
              <div className={`p-4 rounded-lg border ${error ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Paste Web App URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none" 
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                  <button 
                    onClick={() => { manualSave(); setShowSettings(false); }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap font-medium"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${sheetUrl ? (error ? 'bg-red-500' : isLoading ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-300'}`} />
                   <p className={`text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>
                    {error 
                      ? error 
                      : sheetUrl 
                        ? (isLoading ? 'Connecting...' : 'Connected (Auto-save enabled)') 
                        : 'Using Local Storage (This device only)'}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && !data.devLinks.length ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {/* 2. Top Section (3 Columns) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <LinkList title="Links" items={data.devLinks} isEditing={isEditing} onUpdate={(items) => updateLinkSection('devLinks', items)} />
            <LinkList title="Chats" items={data.chatLinks} isEditing={isEditing} onUpdate={(items) => updateLinkSection('chatLinks', items)} />
            <LinkList title="Apps" items={data.appLinks} isEditing={isEditing} onUpdate={(items) => updateLinkSection('appLinks', items)} />
          </section>

          {/* 3. Middle Section (2 Columns Grid) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Left: Googles (1/3) */}
            <div className="md:col-span-1">
              <LinkList title="Googles" items={data.googleLinks} isEditing={isEditing} onUpdate={(items) => updateLinkSection('googleLinks', items)} />
            </div>

            {/* Right: News Curation (2/3) */}
            <div className="md:col-span-2">
              <Card className="h-full border-slate-100 shadow-sm flex flex-col">
                <CardHeader className="pb-2 flex-none">
                  <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-slate-400" />
                    News Curation
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Article</TableHead>
                        <TableHead className="w-[20%]">Date</TableHead>
                        <TableHead className="w-[20%]">Source</TableHead>
                        <TableHead className="w-[20%]">Category</TableHead>
                        {isEditing && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.news.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-slate-700">
                             {/* Article Title */}
                             <div className="flex items-center gap-2">
                               <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline decoration-slate-300 underline-offset-4">
                                 {item.title}
                               </a>
                             </div>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs">
                             {/* Date */}
                             {item.date}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                             {/* Source with Favicon */}
                             <div className="flex items-center gap-2">
                                <img 
                                  src={getFaviconUrl(item.url)} 
                                  alt="" 
                                  className="w-4 h-4 rounded-sm opacity-70"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                {item.source}
                             </div>
                          </TableCell>
                          <TableCell>
                             {/* Category */}
                             <Badge variant="secondary" className="text-slate-500 bg-slate-50 border-slate-100 font-normal">
                               {item.category}
                             </Badge>
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <button onClick={() => handleDeleteNews(item.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded">
                                  <X className="w-4 h-4" />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {isEditing && !isAddingNews && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center p-2">
                            <button onClick={() => setIsAddingNews(true)} className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 w-full py-2 border border-dashed border-slate-200 rounded hover:border-slate-300">
                              <Plus className="w-4 h-4" /> Add Article
                            </button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Add News Form */}
                  {isEditing && isAddingNews && (
                    <div className="mt-4 p-4 border rounded-md bg-slate-50 border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Article</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <input 
                          placeholder="Article Title" 
                          className="p-2 text-sm border rounded"
                          value={newNewsItem.title}
                          onChange={e => setNewNewsItem({...newNewsItem, title: e.target.value})} 
                        />
                        <input 
                          placeholder="URL" 
                          className="p-2 text-sm border rounded"
                          value={newNewsItem.url}
                          onChange={e => setNewNewsItem({...newNewsItem, url: e.target.value})} 
                        />
                         <input 
                          placeholder="Source (e.g. BBC)" 
                          className="p-2 text-sm border rounded"
                          value={newNewsItem.source}
                          onChange={e => setNewNewsItem({...newNewsItem, source: e.target.value})} 
                        />
                        <input 
                          type="date"
                          className="p-2 text-sm border rounded"
                          value={newNewsItem.date}
                          onChange={e => setNewNewsItem({...newNewsItem, date: e.target.value})} 
                        />
                        <input 
                          placeholder="Category" 
                          className="p-2 text-sm border rounded"
                          value={newNewsItem.category}
                          onChange={e => setNewNewsItem({...newNewsItem, category: e.target.value})} 
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAddingNews(false)} className="px-3 py-1 text-sm text-slate-500">Cancel</button>
                        <button onClick={handleAddNews} className="px-3 py-1 text-sm bg-slate-900 text-white rounded hover:bg-slate-800">Add</button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}

    </div>
  );
};

export default App;
