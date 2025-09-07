import { NextResponse } from 'next/server';

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Password validation
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Name validation
export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s'-]+$/.test(name);
}

// Project validation
export function validateProjectData(data: any) {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    errors.push('Project name must be at least 3 characters long');
  }

  if (!data.clientId || typeof data.clientId !== 'string') {
    errors.push('Client is required');
  }

  if (!data.projectManagerId || typeof data.projectManagerId !== 'string') {
    errors.push('Project manager is required');
  }

  if (!data.startDate || isNaN(Date.parse(data.startDate))) {
    errors.push('Valid start date is required');
  }

  if (!data.endDate || isNaN(Date.parse(data.endDate))) {
    errors.push('Valid end date is required');
  }

  if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
    errors.push('End date must be after start date');
  }

  if (data.budget !== undefined && (isNaN(data.budget) || data.budget < 0)) {
    errors.push('Budget must be a positive number');
  }

  return errors;
}

// Task validation
export function validateTaskData(data: any) {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Task title must be at least 3 characters long');
  }

  if (!data.assignedTo || typeof data.assignedTo !== 'string') {
    errors.push('Assignee is required');
  }

  if (!data.dueDate || isNaN(Date.parse(data.dueDate))) {
    errors.push('Valid due date is required');
  }

  if (data.estimatedHours !== undefined && (isNaN(data.estimatedHours) || data.estimatedHours < 0)) {
    errors.push('Estimated hours must be a positive number');
  }

  return errors;
}

// User validation
export function validateUserData(data: any) {
  const errors: string[] = [];

  if (!data.name || !isValidName(data.name)) {
    errors.push('Valid name is required (2-50 characters, letters only)');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  return errors;
}

// API error response helper
export function createErrorResponse(errors: string[], status: number = 400) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors
    },
    { status }
  );
}

// Success response helper
export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status: 200 }
  );
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}