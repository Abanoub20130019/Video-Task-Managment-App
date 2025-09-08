'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CollaborativeEditor from '@/components/CollaborativeEditor';
import VideoCallIntegration from '@/components/VideoCallIntegration';
import AdvancedNotifications from '@/components/AdvancedNotifications';
import TeamCommunicationHub from '@/components/TeamCommunicationHub';
import MobileFeatures from '@/components/MobileFeatures';
import { showSuccess, showError } from '@/lib/toast';

export default function DemoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeDemo, setActiveDemo] = useState<string>('overview');
  const [demoData, setDemoData] = useState({
    collaborativeContent: '',
    capturedPhotos: [] as File[],
    locationData: null as any,
    voiceTranscriptions: [] as string[]
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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

  const demoSections = [
    {
      id: 'overview',
      title: 'Feature Overview',
      icon: '🎯',
      description: 'Complete overview of all new features'
    },
    {
      id: 'profile',
      title: 'User Profile',
      icon: '👤',
      description: 'Enhanced user profile with comprehensive information'
    },
    {
      id: 'collaboration',
      title: 'Real-time Collaboration',
      icon: '🤝',
      description: 'Live cursor tracking and collaborative editing'
    },
    {
      id: 'video',
      title: 'Video Integration',
      icon: '📹',
      description: 'Voice/video calls for remote teams'
    },
    {
      id: 'notifications',
      title: 'Smart Notifications',
      icon: '🔔',
      description: 'Advanced notification system with filtering'
    },
    {
      id: 'chat',
      title: 'Team Communication',
      icon: '💬',
      description: 'Integrated chat with file sharing'
    },
    {
      id: 'mobile',
      title: 'Mobile Features',
      icon: '📱',
      description: 'Camera, GPS, and voice-to-text capabilities'
    },
    {
      id: 'pwa',
      title: 'PWA & Offline',
      icon: '🔄',
      description: 'Progressive Web App with offline functionality'
    }
  ];

  const handlePhotoCapture = (photo: File) => {
    setDemoData(prev => ({
      ...prev,
      capturedPhotos: [...prev.capturedPhotos, photo]
    }));
    showSuccess(`Photo captured: ${photo.name}`);
  };

  const handleLocationCapture = (location: any) => {
    setDemoData(prev => ({
      ...prev,
      locationData: location
    }));
    showSuccess('Location captured successfully!');
  };

  const handleVoiceTranscription = (text: string) => {
    setDemoData(prev => ({
      ...prev,
      voiceTranscriptions: [...prev.voiceTranscriptions, text]
    }));
    showSuccess('Voice transcription added!');
  };

  const renderDemoContent = () => {
    switch (activeDemo) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                🚀 Video Task Manager - Enhanced Features Demo
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Welcome to the comprehensive demo of all new features implemented in the Video Task Manager. 
                This application now includes advanced collaboration tools, mobile capabilities, and enhanced user experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoSections.slice(1).map((section) => (
                <div
                  key={section.id}
                  onClick={() => setActiveDemo(section.id)}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
                >
                  <div className="text-4xl mb-4">{section.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ✨ Key Improvements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎨 UI/UX Enhancements</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Modern, responsive design with dark mode support</li>
                    <li>• Improved navigation and user experience</li>
                    <li>• Enhanced accessibility features</li>
                    <li>• Smooth animations and transitions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">⚡ Performance Optimizations</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Removed unnecessary loading notifications</li>
                    <li>• Enhanced PWA with offline capabilities</li>
                    <li>• Optimized caching strategies</li>
                    <li>• Background sync for offline actions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🤝 Collaboration Features</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Real-time collaborative editing</li>
                    <li>• Live cursor tracking</li>
                    <li>• Video/voice integration</li>
                    <li>• Team communication hub</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📱 Mobile Capabilities</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Camera integration for progress photos</li>
                    <li>• GPS tracking for location-based tasks</li>
                    <li>• Voice-to-text for quick task creation</li>
                    <li>• Touch-optimized interface</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click on any feature card above to explore the detailed demo
              </p>
              <button
                onClick={() => setActiveDemo('profile')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start Feature Tour
              </button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                👤 Enhanced User Profile
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The user profile has been completely redesigned with comprehensive user information, 
                preferences, skills management, and statistics tracking.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">✅ Basic Information</h4>
                  <ul className="text-gray-600 dark:text-gray-400 ml-4">
                    <li>• Full name, email, phone</li>
                    <li>• Location and timezone</li>
                    <li>• Department and role</li>
                    <li>• Personal bio</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">✅ Skills & Expertise</h4>
                  <ul className="text-gray-600 dark:text-gray-400 ml-4">
                    <li>• Dynamic skills management</li>
                    <li>• Add/remove skills easily</li>
                    <li>• Visual skill display</li>
                    <li>• Team skill matching</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">✅ Preferences</h4>
                  <ul className="text-gray-600 dark:text-gray-400 ml-4">
                    <li>• Notification settings</li>
                    <li>• Theme preferences</li>
                    <li>• Language selection</li>
                    <li>• Privacy controls</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">✅ Statistics</h4>
                  <ul className="text-gray-600 dark:text-gray-400 ml-4">
                    <li>• Projects completed</li>
                    <li>• Tasks completed</li>
                    <li>• Hours logged</li>
                    <li>• Activity tracking</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 text-center">
                <a
                  href="/profile"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View Your Profile
                </a>
              </div>
            </div>
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🤝 Real-time Collaboration
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Experience live collaborative editing with cursor tracking and real-time updates.
              </p>
            </div>
            
            <CollaborativeEditor
              documentId="demo-document"
              initialContent={demoData.collaborativeContent}
              onContentChange={(content) => setDemoData(prev => ({ ...prev, collaborativeContent: content }))}
              placeholder="Start typing to see real-time collaboration in action..."
            />
            
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">🎯 Collaboration Features:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Live cursor tracking shows where other users are editing</li>
                <li>• Real-time text synchronization across all connected users</li>
                <li>• User presence indicators show who's currently online</li>
                <li>• Conflict resolution for simultaneous edits</li>
                <li>• Auto-save functionality with change history</li>
              </ul>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📹 Video Call Integration
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Integrated video calling system for remote team collaboration.
              </p>
            </div>
            
            <VideoCallIntegration
              projectId="demo-project"
              onCallEnd={() => showSuccess('Demo call ended')}
            />
            
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">🎥 Video Features:</h4>
              <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <li>• HD video quality with adaptive bitrate</li>
                <li>• Screen sharing capabilities</li>
                <li>• Mute/unmute audio controls</li>
                <li>• Camera on/off toggle</li>
                <li>• Meeting link generation and sharing</li>
                <li>• Call duration tracking</li>
                <li>• Participant management</li>
              </ul>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🔔 Advanced Notification System
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Smart notification filtering with AI-powered suggestions and bulk actions.
              </p>
            </div>
            
            <AdvancedNotifications showFilters={true} maxItems={10} />
            
            <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">🧠 Smart Features:</h4>
              <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                <li>• AI-powered notification prioritization</li>
                <li>• Smart filtering by type, priority, and date</li>
                <li>• Bulk actions for managing multiple notifications</li>
                <li>• Digest mode for reduced notification frequency</li>
                <li>• Deep linking to relevant tasks and projects</li>
                <li>• Real-time notification updates</li>
              </ul>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                💬 Team Communication Hub
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Integrated chat system with file sharing, mentions, and real-time messaging.
              </p>
            </div>
            
            <TeamCommunicationHub
              projectId="demo-project"
              channelType="project"
            />
            
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">💬 Chat Features:</h4>
              <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1">
                <li>• Real-time messaging with typing indicators</li>
                <li>• File sharing with drag-and-drop support</li>
                <li>• @mentions for team member notifications</li>
                <li>• Message reactions and emoji support</li>
                <li>• Reply to specific messages</li>
                <li>• Online presence indicators</li>
                <li>• Message history and search</li>
              </ul>
            </div>
          </div>
        );

      case 'mobile':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📱 Mobile-Specific Features
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Camera integration, GPS tracking, and voice-to-text capabilities for mobile users.
              </p>
            </div>
            
            <MobileFeatures
              onPhotoCapture={handlePhotoCapture}
              onLocationCapture={handleLocationCapture}
              onVoiceTranscription={handleVoiceTranscription}
            />
            
            {/* Demo Data Display */}
            {(demoData.capturedPhotos.length > 0 || demoData.locationData || demoData.voiceTranscriptions.length > 0) && (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Captured Demo Data:</h4>
                
                {demoData.capturedPhotos.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">📸 Photos ({demoData.capturedPhotos.length}):</h5>
                    <div className="flex flex-wrap gap-2">
                      {demoData.capturedPhotos.map((photo, index) => (
                        <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm">
                          {photo.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {demoData.locationData && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">📍 Location:</h5>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-2 rounded text-sm">
                      Lat: {demoData.locationData.lat.toFixed(6)}, Lng: {demoData.locationData.lng.toFixed(6)}
                      {demoData.locationData.address && <div>Address: {demoData.locationData.address}</div>}
                    </div>
                  </div>
                )}
                
                {demoData.voiceTranscriptions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">🎤 Voice Transcriptions ({demoData.voiceTranscriptions.length}):</h5>
                    <div className="space-y-2">
                      {demoData.voiceTranscriptions.map((text, index) => (
                        <div key={index} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 p-2 rounded text-sm">
                          "{text}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'pwa':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🔄 PWA & Offline Capabilities
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Progressive Web App features with enhanced offline functionality and background sync.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📱 PWA Features</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Installable on mobile and desktop
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Native app-like experience
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Push notifications support
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Responsive design for all devices
                  </li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔄 Offline Features</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Offline task creation and editing
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Background sync when online
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Cached data for offline viewing
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Smart caching strategies
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🧪 Test Offline Functionality</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                To test offline capabilities:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Open browser developer tools (F12)</li>
                <li>Go to Network tab and check "Offline"</li>
                <li>Try creating tasks or navigating pages</li>
                <li>Actions will be queued and synced when back online</li>
                <li>Cached data will be available for viewing</li>
              </ol>
              
              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Service Worker Status:</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Enhanced service worker active with offline support
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Demo content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🚀 Feature Demo Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Explore all the enhanced features of Video Task Manager
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Welcome, {session.user?.name}
              </span>
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Demo Sections</h3>
              <nav className="space-y-2">
                {demoSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveDemo(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeDemo === section.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{section.icon}</span>
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs opacity-75">{section.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              {renderDemoContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}