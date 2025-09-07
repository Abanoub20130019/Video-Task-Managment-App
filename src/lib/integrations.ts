// External tool integrations
import { apiLogger } from './logger';

// Google Calendar Integration
export class GoogleCalendarIntegration {
  private accessToken: string;
  private calendarId: string;

  constructor(accessToken: string, calendarId: string = 'primary') {
    this.accessToken = accessToken;
    this.calendarId = calendarId;
  }

  async createEvent(title: string, startDate: Date, endDate: Date, description?: string) {
    try {
      const event = {
        summary: title,
        description: description || '',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create calendar event');
      }

      const createdEvent = await response.json();
      
      apiLogger.info('Google Calendar event created', {
        eventId: createdEvent.id,
        title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return {
        id: createdEvent.id,
        status: 'created',
        link: createdEvent.htmlLink,
        hangoutLink: createdEvent.hangoutLink,
      };
    } catch (error) {
      apiLogger.error('Google Calendar integration error', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async syncEvents(timeMin?: Date, timeMax?: Date) {
    try {
      const params = new URLSearchParams({
        timeMin: (timeMin || new Date()).toISOString(),
        timeMax: (timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to sync calendar events');
      }

      const data = await response.json();
      
      apiLogger.info('Google Calendar events synced', {
        eventCount: data.items?.length || 0,
        calendarId: this.calendarId,
      });

      return data.items?.map((event: any) => ({
        id: event.id,
        title: event.summary,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description || '',
        location: event.location || '',
        attendees: event.attendees || [],
        link: event.htmlLink,
      })) || [];
    } catch (error) {
      apiLogger.error('Google Calendar sync error', error);
      return [];
    }
  }

  async updateEvent(eventId: string, updates: any) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update calendar event');
      }

      return await response.json();
    } catch (error) {
      apiLogger.error('Google Calendar update error', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 410) { // 410 = already deleted
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete calendar event');
      }

      apiLogger.info('Google Calendar event deleted', { eventId });
      return true;
    } catch (error) {
      apiLogger.error('Google Calendar delete error', error);
      throw error;
    }
  }
}

// Slack Integration
export class SlackIntegration {
  private botToken: string;
  private webhookUrl?: string;

  constructor(botToken: string, webhookUrl?: string) {
    this.botToken = botToken;
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(channel: string, text: string, blocks?: any[]) {
    try {
      const payload = {
        channel,
        text,
        blocks,
        username: 'VideoTask Manager',
        icon_emoji: ':movie_camera:',
      };

      // Use webhook if available, otherwise use Web API
      const url = this.webhookUrl || 'https://slack.com/api/chat.postMessage';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (!this.webhookUrl) {
        headers['Authorization'] = `Bearer ${this.botToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send Slack message');
      }

      const result = await response.json();
      
      apiLogger.info('Slack message sent', {
        channel,
        messageLength: text.length,
        timestamp: result.ts,
      });

      return { success: true, timestamp: result.ts };
    } catch (error) {
      apiLogger.error('Slack integration error', error);
      throw new Error('Failed to send Slack message');
    }
  }

  async sendProjectUpdate(channel: string, projectName: string, status: string, progress: number) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📹 *Project Update: ${projectName}*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n${status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Progress:*\n${progress}%`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Updated at ${new Date().toLocaleString()}`,
          },
        ],
      },
    ];

    return this.sendMessage(channel, `Project Update: ${projectName}`, blocks);
  }

  async sendTaskNotification(
    channel: string,
    taskTitle: string,
    assignedTo: string,
    dueDate: string,
    priority: string = 'medium'
  ) {
    const priorityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
    };

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📋 *New Task Assigned*\n*${taskTitle}*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Assigned to:*\n${assignedTo}`,
          },
          {
            type: 'mrkdwn',
            text: `*Due Date:*\n${dueDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${priorityEmoji[priority as keyof typeof priorityEmoji]} ${priority}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Task',
            },
            style: 'primary',
            url: `${process.env.NEXTAUTH_URL}/tasks/${taskTitle}`, // Would need actual task ID
          },
        ],
      },
    ];

    return this.sendMessage(channel, `New Task: ${taskTitle}`, blocks);
  }

  async getChannels() {
    try {
      const response = await fetch('https://slack.com/api/conversations.list', {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Slack channels');
      }

      const data = await response.json();
      return data.channels || [];
    } catch (error) {
      apiLogger.error('Failed to fetch Slack channels', error);
      return [];
    }
  }
}

// Trello Integration (for task management sync)
export class TrelloIntegration {
  private apiKey: string;
  private token: string;
  private boardId: string;

  constructor(apiKey: string, token: string, boardId: string) {
    this.apiKey = apiKey;
    this.token = token;
    this.boardId = boardId;
  }

  private getAuthParams() {
    return `key=${this.apiKey}&token=${this.token}`;
  }

  async createCard(name: string, description: string, listId: string, dueDate?: Date) {
    try {
      const params = new URLSearchParams({
        name,
        desc: description,
        idList: listId,
        ...(dueDate && { due: dueDate.toISOString() }),
        key: this.apiKey,
        token: this.token,
      });

      const response = await fetch('https://api.trello.com/1/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create Trello card');
      }

      const card = await response.json();
      
      apiLogger.info('Trello card created', {
        cardId: card.id,
        name,
        listId,
        boardId: this.boardId,
      });

      return {
        id: card.id,
        name: card.name,
        description: card.desc,
        url: card.url,
        shortUrl: card.shortUrl,
      };
    } catch (error) {
      apiLogger.error('Trello integration error', error);
      throw new Error('Failed to create Trello card');
    }
  }

  async getLists() {
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${this.boardId}/lists?${this.getAuthParams()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch Trello lists');
      }

      const lists = await response.json();
      
      apiLogger.info('Trello lists fetched', {
        listCount: lists.length,
        boardId: this.boardId,
      });

      return lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        closed: list.closed,
        pos: list.pos,
      }));
    } catch (error) {
      apiLogger.error('Trello lists fetch error', error);
      return [];
    }
  }

  async updateCard(cardId: string, updates: any) {
    try {
      const params = new URLSearchParams({
        ...updates,
        key: this.apiKey,
        token: this.token,
      });

      const response = await fetch(`https://api.trello.com/1/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Trello card');
      }

      return await response.json();
    } catch (error) {
      apiLogger.error('Trello card update error', error);
      throw error;
    }
  }

  async deleteCard(cardId: string) {
    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?${this.getAuthParams()}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete Trello card');
      }

      apiLogger.info('Trello card deleted', { cardId });
      return true;
    } catch (error) {
      apiLogger.error('Trello card delete error', error);
      throw error;
    }
  }

  async syncTasksToTrello(tasks: any[]) {
    try {
      const lists = await this.getLists();
      const statusToListMap = {
        'todo': lists.find((l: any) => l.name.toLowerCase().includes('to do') || l.name.toLowerCase().includes('todo')),
        'in_progress': lists.find((l: any) => l.name.toLowerCase().includes('progress') || l.name.toLowerCase().includes('doing')),
        'review': lists.find((l: any) => l.name.toLowerCase().includes('review')),
        'completed': lists.find((l: any) => l.name.toLowerCase().includes('done') || l.name.toLowerCase().includes('complete')),
      };

      const results = [];
      for (const task of tasks) {
        const targetList = statusToListMap[task.status as keyof typeof statusToListMap];
        if (targetList) {
          try {
            const card = await this.createCard(
              task.title,
              task.description || '',
              targetList.id,
              task.dueDate ? new Date(task.dueDate) : undefined
            );
            results.push({ taskId: task._id, cardId: card.id, success: true });
          } catch (error) {
            results.push({ taskId: task._id, success: false, error: (error as Error).message });
          }
        }
      }

      return results;
    } catch (error) {
      apiLogger.error('Trello sync error', error);
      throw error;
    }
  }
}

// Integration Manager
export class IntegrationManager {
  private googleCalendar?: GoogleCalendarIntegration;
  private slack?: SlackIntegration;
  private trello?: TrelloIntegration;

  configureGoogleCalendar(apiKey: string, calendarId: string) {
    this.googleCalendar = new GoogleCalendarIntegration(apiKey, calendarId);
  }

  configureSlack(webhookUrl: string, channel?: string) {
    this.slack = new SlackIntegration(webhookUrl, channel);
  }

  configureTrello(apiKey: string, token: string, boardId: string) {
    this.trello = new TrelloIntegration(apiKey, token, boardId);
  }

  getGoogleCalendar() {
    return this.googleCalendar;
  }

  getSlack() {
    return this.slack;
  }

  getTrello() {
    return this.trello;
  }

  async testConnections() {
    const results = {
      googleCalendar: false,
      slack: false,
      trello: false,
    };

    if (this.googleCalendar) {
      try {
        await this.googleCalendar.syncEvents();
        results.googleCalendar = true;
      } catch (error) {
        console.error('Google Calendar test failed:', error);
      }
    }

    if (this.slack) {
      try {
        await this.slack.sendMessage('#general', '🔗 Integration test - VideoTask Manager connected successfully!');
        results.slack = true;
      } catch (error) {
        console.error('Slack test failed:', error);
      }
    }

    if (this.trello) {
      try {
        await this.trello.getLists();
        results.trello = true;
      } catch (error) {
        console.error('Trello test failed:', error);
      }
    }

    return results;
  }
}

// Global integration manager instance
export const integrationManager = new IntegrationManager();