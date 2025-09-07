'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { integrationManager } from '@/lib/integrations';

interface IntegrationStatus {
  googleCalendar: boolean;
  slack: boolean;
  trello: boolean;
}

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<IntegrationStatus | null>(null);
  const [settings, setSettings] = useState({
    googleCalendar: {
      apiKey: '',
      calendarId: '',
      enabled: false,
    },
    slack: {
      webhookUrl: '',
      channel: '#general',
      enabled: false,
    },
    trello: {
      apiKey: '',
      token: '',
      boardId: '',
      enabled: false,
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSettingChange = (integration: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [integration]: {
        ...prev[integration as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const configureIntegration = (type: 'google' | 'slack' | 'trello') => {
    if (type === 'google') {
      const config = settings.googleCalendar;
      integrationManager.configureGoogleCalendar(
        config.apiKey,
        config.calendarId
      );
      handleSettingChange('googleCalendar', 'enabled', true);
    } else if (type === 'slack') {
      const config = settings.slack;
      integrationManager.configureSlack(
        config.webhookUrl,
        config.channel
      );
      handleSettingChange('slack', 'enabled', true);
    } else if (type === 'trello') {
      const config = settings.trello;
      integrationManager.configureTrello(
        config.apiKey,
        config.token,
        config.boardId
      );
      handleSettingChange('trello', 'enabled', true);
    }
  };

  const testConnections = async () => {
    setLoading(true);
    try {
      const results = await integrationManager.testConnections();
      setTestResults(results);
    } catch (error) {
      console.error('Integration test failed:', error);
      setTestResults({
        googleCalendar: false,
        slack: false,
        trello: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (type: 'slack' | 'google' | 'trello') => {
    try {
      if (type === 'slack') {
        const slack = integrationManager.getSlack();
        if (slack) {
          await slack.sendMessage('🧪 *Integration Test*\nThis is a test message from VideoTask Manager!');
          alert('Test message sent to Slack!');
        }
      } else if (type === 'google') {
        const googleCal = integrationManager.getGoogleCalendar();
        if (googleCal) {
          const result = await googleCal.createEvent(
            'Integration Test Event',
            new Date(),
            new Date(Date.now() + 3600000),
            'This is a test event from VideoTask Manager'
          );
          alert(`Test event created! View it here: ${result.link}`);
        }
      } else if (type === 'trello') {
        const trello = integrationManager.getTrello();
        if (trello) {
          const lists = await trello.getLists();
          if (lists.length > 0) {
            const result = await trello.createCard(
              'Integration Test Card',
              'This is a test card from VideoTask Manager',
              lists[0].id
            );
            alert(`Test card created! View it here: ${result.url}`);
          }
        }
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('Test failed. Please check your configuration.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                External Integrations
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Connect your favorite tools to streamline your workflow
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={testConnections}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test All Connections'}
              </button>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        {testResults && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  testResults.googleCalendar ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-900">Google Calendar</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  testResults.slack ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-900">Slack</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  testResults.trello ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-900">Trello</span>
              </div>
            </div>
          </div>
        )}

        {/* Google Calendar Integration */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.316 5.684h-2.372v2.372h2.372V5.684zm-2.372 7.116h2.372v-2.372h-2.372v2.372zm6.3-7.908h-1.686V3.99h-2.372v1.902H7.43V3.99H5.058v1.902H3.372C2.618 5.892 2 6.51 2 7.264v12.588c0 .754.618 1.372 1.372 1.372h16.872c.754 0 1.372-.618 1.372-1.372V7.264c0-.754-.618-1.372-1.372-1.372zM20.628 19.852H3.372V9.036h17.256v10.816z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Google Calendar</h3>
                <p className="text-sm text-gray-500">Sync schedules and create calendar events</p>
              </div>
            </div>
            <div className="flex items-center">
              {settings.googleCalendar.enabled && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                  Connected
                </span>
              )}
              <button
                onClick={() => sendTestNotification('google')}
                disabled={!settings.googleCalendar.enabled}
                className="text-indigo-600 hover:text-indigo-900 text-sm disabled:opacity-50"
              >
                Test
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="gcal-api-key" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <input
                type="password"
                id="gcal-api-key"
                value={settings.googleCalendar.apiKey}
                onChange={(e) => handleSettingChange('googleCalendar', 'apiKey', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your Google Calendar API key"
              />
            </div>
            <div>
              <label htmlFor="gcal-calendar-id" className="block text-sm font-medium text-gray-700">
                Calendar ID
              </label>
              <input
                type="text"
                id="gcal-calendar-id"
                value={settings.googleCalendar.calendarId}
                onChange={(e) => handleSettingChange('googleCalendar', 'calendarId', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your calendar ID"
              />
            </div>
            <button
              onClick={() => configureIntegration('google')}
              disabled={!settings.googleCalendar.apiKey || !settings.googleCalendar.calendarId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {settings.googleCalendar.enabled ? 'Update Configuration' : 'Connect Google Calendar'}
            </button>
          </div>
        </div>

        {/* Slack Integration */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.525c0-1.386.714-2.446 2.52-2.446a2.528 2.528 0 0 1 2.52 2.446c0 1.386-.714 2.525-2.52 2.525zm6.492-2.525a2.528 2.528 0 0 1 2.52-2.446c1.386 0 2.52.714 2.52 2.446a2.528 2.528 0 0 1-2.52 2.525c-1.806 0-2.52-1.139-2.52-2.525zm-6.492-6.492A2.528 2.528 0 0 1 7.554 3.7c1.386 0 2.446.714 2.446 2.52a2.528 2.528 0 0 1-2.446 2.52c-1.386 0-2.52-.714-2.52-2.52zm6.492 0a2.528 2.528 0 0 1 2.52-2.52c1.806 0 2.52 1.139 2.52 2.52a2.528 2.528 0 0 1-2.52 2.446c-1.386 0-2.52-.714-2.52-2.446zM5.042 8.673a2.528 2.528 0 0 1-2.52-2.52c0-1.386.714-2.52 2.52-2.52a2.528 2.528 0 0 1 2.52 2.52c0 1.386-.714 2.446-2.52 2.52zm6.492 6.492a2.528 2.528 0 0 1 2.52 2.525c0 1.386-.714 2.52-2.52 2.52a2.528 2.528 0 0 1-2.52-2.52c0-1.386.714-2.525 2.52-2.525z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Slack</h3>
                <p className="text-sm text-gray-500">Send notifications and updates to your team</p>
              </div>
            </div>
            <div className="flex items-center">
              {settings.slack.enabled && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                  Connected
                </span>
              )}
              <button
                onClick={() => sendTestNotification('slack')}
                disabled={!settings.slack.enabled}
                className="text-indigo-600 hover:text-indigo-900 text-sm disabled:opacity-50"
              >
                Test
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="slack-webhook" className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                type="url"
                id="slack-webhook"
                value={settings.slack.webhookUrl}
                onChange={(e) => handleSettingChange('slack', 'webhookUrl', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            <div>
              <label htmlFor="slack-channel" className="block text-sm font-medium text-gray-700">
                Channel
              </label>
              <input
                type="text"
                id="slack-channel"
                value={settings.slack.channel}
                onChange={(e) => handleSettingChange('slack', 'channel', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="#general"
              />
            </div>
            <button
              onClick={() => configureIntegration('slack')}
              disabled={!settings.slack.webhookUrl}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {settings.slack.enabled ? 'Update Configuration' : 'Connect Slack'}
            </button>
          </div>
        </div>

        {/* Trello Integration */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.5 15c0 .275-.225.5-.5.5H6c-.275 0-.5-.225-.5-.5V9c0-.275.225-.5.5-.5h4c.275 0 .5.225.5.5v6zm9-6c0 .275-.225.5-.5.5h-4c-.275 0-.5-.225-.5-.5V6c0-.275.225-.5.5-.5h4c.275 0 .5.225.5.5v3z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Trello</h3>
                <p className="text-sm text-gray-500">Sync tasks and manage project boards</p>
              </div>
            </div>
            <div className="flex items-center">
              {settings.trello.enabled && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                  Connected
                </span>
              )}
              <button
                onClick={() => sendTestNotification('trello')}
                disabled={!settings.trello.enabled}
                className="text-indigo-600 hover:text-indigo-900 text-sm disabled:opacity-50"
              >
                Test
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="trello-api-key" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <input
                type="password"
                id="trello-api-key"
                value={settings.trello.apiKey}
                onChange={(e) => handleSettingChange('trello', 'apiKey', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your Trello API key"
              />
            </div>
            <div>
              <label htmlFor="trello-token" className="block text-sm font-medium text-gray-700">
                Token
              </label>
              <input
                type="password"
                id="trello-token"
                value={settings.trello.token}
                onChange={(e) => handleSettingChange('trello', 'token', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your Trello token"
              />
            </div>
            <div>
              <label htmlFor="trello-board-id" className="block text-sm font-medium text-gray-700">
                Board ID
              </label>
              <input
                type="text"
                id="trello-board-id"
                value={settings.trello.boardId}
                onChange={(e) => handleSettingChange('trello', 'boardId', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your Trello board ID"
              />
            </div>
            <button
              onClick={() => configureIntegration('trello')}
              disabled={!settings.trello.apiKey || !settings.trello.token || !settings.trello.boardId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {settings.trello.enabled ? 'Update Configuration' : 'Connect Trello'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}