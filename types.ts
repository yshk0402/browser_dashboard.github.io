
export interface LinkItem {
  name: string;
  url: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  category: string;
}

export interface HeatmapDataPoint {
  date: string;
  count: number;
  level: number;
}

export interface HabitData {
  key: string;
  label: string;
  data: HeatmapDataPoint[];
}

export interface HabitStatus {
  id: string;
  title: string;
  target: string;
  completed?: boolean;
}

export interface DailyHabitStatus {
  date: string;
  status: Record<string, boolean>;
}

// The unified data structure to be saved in Google Sheets
export interface DashboardData {
  devLinks: LinkItem[];
  chatLinks: LinkItem[];
  appLinks: LinkItem[];
  googleLinks: LinkItem[];
  news: NewsItem[];
}
