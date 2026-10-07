export type Memory = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  source_type: string;
  source_url: string | null;
  deadline: string | null;
  created_at: string;
  is_favorite: boolean;
};

export type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  memory_id: string | null;
  completed: boolean;
};
