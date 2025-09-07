import { z } from 'zod';

// User validation schemas
export const userRoleSchema = z.enum(['admin', 'project_manager', 'crew_member']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  role: userRoleSchema.default('crew_member'),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Task validation schemas
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'completed']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  assignedTo: z.string().min(1, 'Assigned user is required'),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  dueDate: z.string().datetime('Invalid date format').or(z.date()),
  startDate: z.string().datetime('Invalid date format').or(z.date()).optional(),
  estimatedHours: z.number().min(0, 'Estimated hours must be positive').max(1000, 'Estimated hours too large').default(0),
  actualHours: z.number().min(0, 'Actual hours must be positive').max(1000, 'Actual hours too large').default(0),
});

export const updateTaskSchema = createTaskSchema.partial();

// Project validation schemas
export const projectStatusSchema = z.enum(['planning', 'active', 'on_hold', 'completed']);

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  projectManagerId: z.string().min(1, 'Project manager ID is required'),
  status: projectStatusSchema.default('planning'),
  budget: z.number().min(0, 'Budget must be positive').max(10000000, 'Budget too large').default(0),
  startDate: z.string().datetime('Invalid start date format').or(z.date()),
  endDate: z.string().datetime('Invalid end date format').or(z.date()),
  progress: z.number().min(0, 'Progress must be at least 0').max(100, 'Progress cannot exceed 100').default(0),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateProjectSchema = createProjectSchema.partial();

// Client validation schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200, 'Client name must be less than 200 characters'),
  email: z.string().email('Invalid email format').toLowerCase(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long').optional(),
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment must be less than 1000 characters'),
  taskId: z.string().optional(),
  projectId: z.string().optional(),
}).refine((data) => data.taskId || data.projectId, {
  message: 'Either taskId or projectId must be provided',
  path: ['taskId'],
});

// Equipment validation schemas
export const equipmentStatusSchema = z.enum(['available', 'in_use', 'maintenance', 'retired']);

export const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required').max(200, 'Equipment name must be less than 200 characters'),
  type: z.string().min(1, 'Equipment type is required').max(100, 'Equipment type must be less than 100 characters'),
  model: z.string().max(100, 'Model must be less than 100 characters').optional(),
  serialNumber: z.string().max(100, 'Serial number must be less than 100 characters').optional(),
  status: equipmentStatusSchema.default('available'),
  dailyRate: z.number().min(0, 'Daily rate must be positive').max(10000, 'Daily rate too large').default(0),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

// Budget validation schemas
export const createBudgetSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  budgetedAmount: z.number().min(0, 'Budgeted amount must be positive').max(10000000, 'Budgeted amount too large'),
  actualAmount: z.number().min(0, 'Actual amount must be positive').max(10000000, 'Actual amount too large').default(0),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

// Pagination and query validation schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).refine(n => n >= 1, 'Page must be at least 1').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100').default('20'),
  search: z.string().max(200, 'Search term too long').optional(),
});

export const taskQuerySchema = paginationSchema.extend({
  projectId: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedTo: z.string().optional(),
});

export const projectQuerySchema = paginationSchema.extend({
  status: projectStatusSchema.optional(),
  clientId: z.string().optional(),
  projectManagerId: z.string().optional(),
});

export const userQuerySchema = paginationSchema.extend({
  role: userRoleSchema.optional(),
});

// Helper function to validate and parse request data
export function validateRequestData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Helper function to validate query parameters
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { success: true; data: T } | { success: false; errors: string[] } {
  const queryObject: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryObject[key] = value;
  });
  
  return validateRequestData(schema, queryObject);
}