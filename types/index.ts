/**
 * Common enums for the Tickap application
 */
export enum Category {
  VideoGame = "VideoGame",
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

export enum TeamRole {
  LEADER = "LEADER",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER"
}

export enum RequestType {
  INVITE = "INVITE",
  REQUEST = "REQUEST"
}

export enum RequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED"
}

export enum QuestionType {
  SHORT_TEXT = "SHORT_TEXT",
  PARAGRAPH = "PARAGRAPH",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOXES = "CHECKBOXES",
  CHECKBOX = "CHECKBOX",
  DROPDOWN = "DROPDOWN",
  DATE = "DATE",
  TIME = "TIME",
  NUMBER = "NUMBER",
  USER = "USER"
}

/**
 * User and member interfaces
 */
export interface Member {
  nick: string | null;
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
  role?: TeamRole;
}

export interface JoinRequest {
  id: string;
  event_id: bigint;
  registration_id: bigint | null;
  user_id: bigint;
  user_name: string | null;
  user_pfp: string | null;
  type: RequestType;
  status: RequestStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Registration {
  id: bigint;
  event_id: bigint;
  team_name: string | null;
  local_id?: number | null;
  registrationusers: RegistrationUser[];
  join_requests?: JoinRequest[];
  extra?: string | any; // Added to support custom responses
  is_disqualified?: boolean;
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
  role_id: bigint | null;
  manager_id: bigint | null;
  channel_id: bigint | null;
  notification_channel_id: bigint | null;
  discord_event_id?: bigint | string | null;
  allow_incomplete_teams?: boolean | null;
  enable_team_invites?: boolean | null;
  enable_team_requests?: boolean | null;
  register_for_other?: boolean | null;
  auto_team_name?: boolean | null;
  team_counter?: number | null;
  extra?: any;
}

export interface EventQuestionOption {
  id: string;
  text: string;
}

export interface EventQuestion {
  id: string;
  text: string;
  description?: string;
  placeholder?: string;
  type: QuestionType;
  required: boolean;
  options?: EventQuestionOption[];
  min?: number | null;
  max?: number | null;
  order: number;
}

export interface DiscordScheduledEvent {
  id: string;
  guild_id: string;
  channel_id?: string | null;
  creator_id?: string | null;
  name: string;
  description?: string | null;
  scheduled_start_time: string;
  scheduled_end_time?: string | null;
  privacy_level: number;
  status: number; // 1: SCHEDULED, 2: ACTIVE, 3: COMPLETED, 4: CANCELED
  entity_type: number; // 1: STAGE_INSTANCE, 2: VOICE, 3: EXTERNAL
  entity_id?: string | null;
  entity_metadata?: {
    location?: string;
  } | null;
  creator?: {
    id: string;
    username: string;
    avatar?: string | null;
  } | null;
  user_count?: number;
  image?: string | null;
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
  notification_channel_id?: string;
  status?: EventStatus;
}