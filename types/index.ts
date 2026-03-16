export interface Profile {
  id: string;
  username: string;
  virus_name: string;
  virus_color: string;
  points: number;
  total_cells: number;
  created_at: string;
}

export interface Cell {
  h3_index: string;
  owner_id: string;
  virus_color: string;
  virus_name: string;
  infected_at: string;
  strength: number;
}

export interface SpreadEvent {
  id: string;
  actor_id: string;
  h3_index: string;
  event_type: "gps_spread" | "remote_spread" | "disinfect" | "natural";
  lat: number | null;
  lng: number | null;
  points_spent: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  virus_name: string;
  virus_color: string;
  cell_count: number;
}
