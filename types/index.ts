/**
 * Common enums for the Tickap application
 */
export enum Category {
  VedioGame = "VedioGame",
  ESports = "ESports",
  Music = "Music",
  Other = "Other"
}

export enum Platform {
  Discord = "Discord",
  TickAp = "TickAp",
  Other = "Other"
}

export enum EventStatus {
  Open = "Open",
  Closed = "Closed",
  Cancelled = "Cancelled",
  Live = "Live"
}

/**
 * User and member interfaces
 */
export interface Member {
  user: {
    id: string;
    username: string;
    avatar: string;
    global_name: string;
  };
}

/**
 * Registration related interfaces
 */
export interface RegistrationUser {
  user_id: bigint;
  registration_id: bigint;
  event_id: bigint;
  user_name: string | null;
  pfp: string | null;
}

export interface Registration {
  id: bigint;
  event_id: bigint;
  team_name: string | null;
  registrationusers: RegistrationUser[];
}

/**
 * Guild (Discord server) interface
 */
export interface Guild {
  id: string;
  name: string;
  icon: string;
  permissions?: string;
  manager?: boolean;
  mutual?: boolean;
  approximate_member_count?: number;
}

/**
 * Event interface
 */
export interface Event {
  id: bigint | string | number;
  name: string;
  banner?: string;
  category?: string;
  category_name: string | null;
  platform?: string ;
  date: Date | null;
  details: string | null;
  status: string;
  is_solo: boolean | null;
  max_teams: number | null;
  min_team_player: number | null;
  max_team_player: number | null;
  registrations?: Registration[];
  guild_id: bigint | null;
  redirect_url: string | null;
  location_url: string | null;
  rules: string | null;
  prize: string | null;
  role_id: BigInt | null;
  manager_id: BigInt | null;
  channel_id: BigInt | null;
}

/**
 * Form data interfaces
 */
export interface EventFormValues {
  name: string;
  date: Date;
  start_time: string;
  is_solo: boolean;
  category: Category;
  platform: Platform;
  banner?: Blob;
  prize?: string;
  max_teams?: number;
  min_team_player?: number;
  max_team_player?: number;
  rules?: string;
  details?: string;
  location?: string;
  location_url?: string;
  redirect_url?: string;
  category_name?: string;
  role_id?: string;
  manager_id?: string;
  channel_id?: string;
  status?: EventStatus;
}