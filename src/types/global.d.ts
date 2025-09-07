// Global type definitions for the Video Task Management App

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Allow any additional props
    [key: string]: any;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Mongoose model type fixes
declare module 'mongoose' {
  interface Model<T> {
    find(filter?: any, projection?: any, options?: any): any;
    findById(id: any, projection?: any, options?: any): any;
    findOne(filter?: any, projection?: any, options?: any): any;
    create(doc: any): any;
    updateOne(filter: any, update: any, options?: any): any;
    deleteOne(filter: any, options?: any): any;
    countDocuments(filter?: any): any;
    aggregate(pipeline: any[]): any;
    insertMany(docs: any[], options?: any): any;
    bulkWrite(operations: any[], options?: any): any;
  }
}

// Extend Window interface for PWA and speech recognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// PWA types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend global types for better compatibility
declare global {
  interface HTMLElement {
    contentEditable?: string;
  }
}

// Module declarations for packages without types
declare module 'pusher-js' {
  export default class Pusher {
    constructor(key: string, options?: any);
    subscribe(channel: string): any;
    unsubscribe(channel: string): void;
    disconnect(): void;
    connection: {
      state: string;
      bind(event: string, callback: (data?: any) => void): void;
    };
  }
}

declare module 'pusher' {
  export default class Pusher {
    constructor(options: any);
    trigger(channel: string, event: string, data: any): Promise<any>;
  }
}

declare module 'firebase/app' {
  export function initializeApp(config: any): any;
}

declare module 'firebase/messaging' {
  export function getMessaging(app: any): any;
  export function getToken(messaging: any, options: any): Promise<string>;
  export function onMessage(messaging: any, callback: (payload: any) => void): void;
}

declare module 'firebase-admin' {
  const admin: any;
  export = admin;
}

// Utility types for the application
export type UserRole = 'admin' | 'project_manager' | 'crew_member';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';
export type Theme = 'light' | 'dark' | 'system';

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiError {
  error: string;
  details?: string[];
}

// Common entity interfaces
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Task extends BaseEntity {
  projectId: string;
  title: string;
  description?: string;
  assignedTo: User;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  clientId: string;
  projectManagerId: string;
  status: ProjectStatus;
  budget: number;
  startDate: string;
  endDate: string;
  progress: number;
}

export {};