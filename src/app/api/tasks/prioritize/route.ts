import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Project from '@/models/Project';
import { authOptions } from '@/lib/auth';
import { apiLogger } from '@/lib/logger';
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis';

interface TaskPriorityData {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date;
  startDate?: Date;
  estimatedHours: number;
  actualHours: number;
  assignedTo: {
    _id: string;
    name: string;
    role: string;
  };
  projectId: {
    _id: string;
    name: string;
    status: string;
    budget: number;
    endDate: Date;
  };
}

interface PriorityScore {
  taskId: string;
  currentPriority: string;
  suggestedPriority: string;
  score: number;
  reasoning: string[];
  confidence: number;
}

// AI-driven priority calculation algorithm
function calculateTaskPriority(task: TaskPriorityData, allTasks: TaskPriorityData[]): PriorityScore {
  let score = 0;
  const reasoning: string[] = [];
  const now = new Date();
  
  // 1. Due date urgency (0-40 points)
  const daysUntilDue = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilDue <= 1) {
    score += 40;
    reasoning.push('Due within 24 hours - critical urgency');
  } else if (daysUntilDue <= 3) {
    score += 30;
    reasoning.push('Due within 3 days - high urgency');
  } else if (daysUntilDue <= 7) {
    score += 20;
    reasoning.push('Due within a week - moderate urgency');
  } else if (daysUntilDue <= 14) {
    score += 10;
    reasoning.push('Due within 2 weeks - low urgency');
  }
  
  // 2. Project deadline impact (0-25 points)
  const projectDaysUntilDue = Math.ceil((task.projectId.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (projectDaysUntilDue <= 7) {
    score += 25;
    reasoning.push('Project deadline approaching - high impact');
  } else if (projectDaysUntilDue <= 14) {
    score += 15;
    reasoning.push('Project deadline within 2 weeks - moderate impact');
  } else if (projectDaysUntilDue <= 30) {
    score += 10;
    reasoning.push('Project deadline within a month - low impact');
  }
  
  // 3. Task complexity and effort (0-20 points)
  if (task.estimatedHours > 40) {
    score += 20;
    reasoning.push('High complexity task - requires early attention');
  } else if (task.estimatedHours > 20) {
    score += 15;
    reasoning.push('Medium complexity task');
  } else if (task.estimatedHours > 8) {
    score += 10;
    reasoning.push('Standard complexity task');
  }
  
  // 4. Dependency analysis (0-15 points)
  const dependentTasks = allTasks.filter(t => 
    t.projectId._id === task.projectId._id && 
    t.startDate && task.dueDate && 
    new Date(t.startDate) <= task.dueDate
  );
  
  if (dependentTasks.length > 3) {
    score += 15;
    reasoning.push('Multiple tasks depend on this - blocking others');
  } else if (dependentTasks.length > 1) {
    score += 10;
    reasoning.push('Some tasks depend on this');
  }
  
  // 5. Project budget and importance (0-10 points)
  if (task.projectId.budget > 50000) {
    score += 10;
    reasoning.push('High-budget project - business critical');
  } else if (task.projectId.budget > 20000) {
    score += 7;
    reasoning.push('Medium-budget project - important');
  } else if (task.projectId.budget > 10000) {
    score += 5;
    reasoning.push('Standard budget project');
  }
  
  // 6. Current status consideration (0-10 points)
  if (task.status === 'in_progress') {
    score += 10;
    reasoning.push('Already in progress - maintain momentum');
  } else if (task.status === 'review') {
    score += 8;
    reasoning.push('In review - close to completion');
  }
  
  // 7. Assignee workload (0-10 points)
  const assigneeTaskCount = allTasks.filter(t => 
    t.assignedTo._id === task.assignedTo._id && 
    t.status !== 'completed'
  ).length;
  
  if (assigneeTaskCount <= 2) {
    score += 10;
    reasoning.push('Assignee has light workload - can focus');
  } else if (assigneeTaskCount <= 5) {
    score += 5;
    reasoning.push('Assignee has moderate workload');
  } else {
    reasoning.push('Assignee has heavy workload - may need support');
  }
  
  // 8. Overdue penalty
  if (daysUntilDue < 0) {
    score += 50;
    reasoning.push(`OVERDUE by ${Math.abs(daysUntilDue)} days - immediate attention required`);
  }
  
  // Determine suggested priority based on score
  let suggestedPriority: string;
  let confidence: number;
  
  if (score >= 70) {
    suggestedPriority = 'high';
    confidence = 0.9;
  } else if (score >= 40) {
    suggestedPriority = 'medium';
    confidence = 0.8;
  } else {
    suggestedPriority = 'low';
    confidence = 0.7;
  }
  
  // Adjust confidence based on data quality
  if (task.estimatedHours === 0) {
    confidence -= 0.1;
    reasoning.push('No time estimate - confidence reduced');
  }
  
  if (!task.startDate) {
    confidence -= 0.1;
    reasoning.push('No start date - confidence reduced');
  }
  
  return {
    taskId: task._id,
    currentPriority: task.priority,
    suggestedPriority,
    score: Math.round(score),
    reasoning,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskIds, mode = 'analyze' } = await request.json();

    apiLogger.info('AI prioritization request', { 
      projectId, 
      taskIds: taskIds?.length, 
      mode,
      userId: session.user.id 
    });

    await dbConnect();

    // Build query based on input
    let query: any = {};
    if (projectId) {
      query.projectId = projectId;
    }
    if (taskIds && taskIds.length > 0) {
      query._id = { $in: taskIds };
    }

    // If no specific tasks, analyze all active tasks
    if (!projectId && (!taskIds || taskIds.length === 0)) {
      query.status = { $in: ['todo', 'in_progress', 'review'] };
    }

    // Fetch tasks with populated data
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name role')
      .populate('projectId', 'name status budget endDate')
      .lean() as TaskPriorityData[];

    if (tasks.length === 0) {
      return NextResponse.json({
        message: 'No tasks found for prioritization',
        results: [],
      });
    }

    // Check cache for recent analysis
    const cacheKey = `ai_priority:${projectId || 'all'}:${taskIds?.join(',') || 'all'}`;
    const cachedResults = await CacheService.get<PriorityScore[]>(cacheKey);
    
    if (cachedResults && mode === 'analyze') {
      apiLogger.info('AI prioritization served from cache', { 
        cacheKey,
        taskCount: tasks.length,
        duration: Date.now() - startTime 
      });
      
      return NextResponse.json({
        message: 'Task prioritization analysis completed (cached)',
        results: cachedResults,
        cached: true,
        analysisDate: new Date().toISOString(),
      });
    }

    // Calculate priority scores for all tasks
    const priorityResults = tasks.map(task => calculateTaskPriority(task, tasks));

    // Sort by score (highest first)
    priorityResults.sort((a, b) => b.score - a.score);

    // Cache results for 1 hour
    await CacheService.set(cacheKey, priorityResults, CacheTTL.RATE_LIMIT_API);

    // If mode is 'apply', update the task priorities
    if (mode === 'apply') {
      const updates = priorityResults
        .filter(result => result.suggestedPriority !== result.currentPriority && result.confidence >= 0.7)
        .map(result => ({
          updateOne: {
            filter: { _id: result.taskId },
            update: { priority: result.suggestedPriority },
          },
        }));

      if (updates.length > 0) {
        await Task.bulkWrite(updates);
        
        // Clear related caches
        await CacheService.delPattern('tasks:*');
        await CacheService.delPattern('dashboard:*');
        
        apiLogger.info('AI prioritization applied', { 
          updatedTasks: updates.length,
          totalAnalyzed: tasks.length,
          userId: session.user.id 
        });
      }
    }

    const duration = Date.now() - startTime;
    apiLogger.info('AI prioritization completed', { 
      taskCount: tasks.length,
      highPriorityTasks: priorityResults.filter(r => r.suggestedPriority === 'high').length,
      duration,
      mode 
    });

    return NextResponse.json({
      message: `Task prioritization analysis completed${mode === 'apply' ? ' and applied' : ''}`,
      results: priorityResults,
      summary: {
        totalTasks: tasks.length,
        highPriority: priorityResults.filter(r => r.suggestedPriority === 'high').length,
        mediumPriority: priorityResults.filter(r => r.suggestedPriority === 'medium').length,
        lowPriority: priorityResults.filter(r => r.suggestedPriority === 'low').length,
        changesRecommended: priorityResults.filter(r => r.suggestedPriority !== r.currentPriority).length,
        highConfidenceChanges: priorityResults.filter(r => r.suggestedPriority !== r.currentPriority && r.confidence >= 0.8).length,
      },
      analysisDate: new Date().toISOString(),
      cached: false,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    apiLogger.error('AI prioritization failed', error, { duration });
    
    return NextResponse.json(
      { error: 'Failed to analyze task priorities' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving cached prioritization results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskIds = searchParams.get('taskIds')?.split(',');

    const cacheKey = `ai_priority:${projectId || 'all'}:${taskIds?.join(',') || 'all'}`;
    const cachedResults = await CacheService.get<PriorityScore[]>(cacheKey);

    if (cachedResults) {
      return NextResponse.json({
        message: 'Cached prioritization results',
        results: cachedResults,
        cached: true,
      });
    }

    return NextResponse.json({
      message: 'No cached results found',
      results: [],
      cached: false,
    });

  } catch (error) {
    apiLogger.error('Failed to retrieve cached prioritization', error);
    return NextResponse.json(
      { error: 'Failed to retrieve prioritization results' },
      { status: 500 }
    );
  }
}