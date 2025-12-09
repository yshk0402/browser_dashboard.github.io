import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { LinkItem } from '../types';
import { Plus, X } from 'lucide-react';

interface LinkListProps {
  title: string;
  items: LinkItem[];
  isEditing: boolean;
  onUpdate: (items: LinkItem[]) => void;
}

const getFaviconUrl = (urlStr: string) => {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=google.com&sz=32`; // fallback
  }
};

export const LinkList: React.FC<LinkListProps & { autoHeight?: boolean }> = ({ title, items, isEditing, onUpdate, autoHeight = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', url: '' });

  const handleDelete = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onUpdate(newItems);
  };

  const handleAdd = () => {
    if (newItem.name && newItem.url) {
      onUpdate([...items, newItem]);
      setNewItem({ name: '', url: '' });
      setIsAdding(false);
    }
  };

  return (
    <Card className={`${autoHeight ? '' : 'h-full'} border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col`}>
      <CardHeader className="pb-3 flex-none">
        <CardTitle className="text-lg font-medium text-slate-700 flex justify-between items-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 flex-grow overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="group relative flex items-center">
            <a
              href={isEditing ? undefined : item.url}
              target={isEditing ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={`flex-1 flex items-center gap-3 p-2 rounded-md transition-all ${isEditing ? 'bg-slate-50 cursor-default opacity-80' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              onClick={(e) => isEditing && e.preventDefault()}
            >
              <img
                src={getFaviconUrl(item.url)}
                alt={item.name}
                className="h-4 w-4 rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </a>
            {isEditing && (
              <button
                onClick={() => handleDelete(index)}
                className="absolute right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {isEditing && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 p-2 rounded-md border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 text-sm mt-2"
          >
            <Plus className="h-4 w-4" /> Add Link
          </button>
        )}

        {isEditing && isAdding && (
          <div className="flex flex-col gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 mt-2">
            <input
              type="text"
              placeholder="Name"
              className="text-xs p-1 rounded border border-slate-200"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="URL"
              className="text-xs p-1 rounded border border-slate-200"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsAdding(false)} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>
              <button onClick={handleAdd} className="text-xs bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-700">Add</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};