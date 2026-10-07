import { Session } from "express-session";

export interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  sanitized: boolean;
}

export interface OnlineUser {
  name: string;
  socket?: import("ws").WebSocket;
  lastActivity: number;
  sessionId: string;
  isAuthenticated: boolean;
}

export interface AuthenticatedSession extends Session {
  userId?: string;
  userName?: string;
  isAuthenticated?: boolean;
}

export interface SecurityConfig {
  maxOnlineUsers: number;
  maxMessageLength: number;
  minUsernameLength: number;
  maxUsernameLength: number;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
  inactivityTimeout: number;
  sessionTimeout: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp: number;
}

export interface LoginRequest {
  name: string;
}

export interface LoginResponse {
  sessionId: string;
  name: string;
  csrfToken: string;
}

export interface MessageRequest {
  text: string;
  type: "send_message";
}

export interface WebSocketMessage {
  type: "message" | "online_users" | "error" | "heartbeat" | "pong";
  message?: Message;
  users?: string[];
  error?: string;
}