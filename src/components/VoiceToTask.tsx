'use client';

import { useState, useRef, useEffect } from 'react';
import { showError, showSuccess, showInfo, showLoading, dismissToast } from '@/lib/toast';

interface VoiceToTaskProps {
  onTaskCreated?: (taskData: any) => void;
  projectId?: string;
  className?: string;
}

interface RecognitionResult {
  transcript: string;
  confidence: number;
}

// Speech recognition interface
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

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceToTask({ onTaskCreated, projectId, className = '' }: VoiceToTaskProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showInfo('Listening... Speak your task details');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'no-speech':
            showError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            showError('Microphone not accessible. Please check permissions.');
            break;
          case 'not-allowed':
            showError('Microphone permission denied. Please enable microphone access.');
            break;
          case 'network':
            showError('Network error. Please check your connection.');
            break;
          default:
            showError('Speech recognition failed. Please try again.');
        }
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);

        if (finalTranscript) {
          processVoiceInput(finalTranscript);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      showError('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceInput = async (voiceText: string) => {
    if (!voiceText.trim() || isProcessing) return;

    setIsProcessing(true);
    const loadingToast = showLoading('Processing voice input...');

    try {
      // Parse voice input using simple NLP patterns
      const taskData = parseVoiceToTaskData(voiceText);
      
      if (!taskData.title) {
        dismissToast(loadingToast);
        showError('Could not extract task title from voice input. Please try again.');
        return;
      }

      // Create task via API
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          projectId: projectId,
        }),
      });

      dismissToast(loadingToast);

      if (response.ok) {
        const createdTask = await response.json();
        showSuccess(`Task "${taskData.title}" created successfully!`);
        
        if (onTaskCreated) {
          onTaskCreated(createdTask);
        }
        
        setTranscript('');
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create task');
      }
    } catch (error) {
      dismissToast(loadingToast);
      console.error('Error processing voice input:', error);
      showError('Failed to process voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple NLP parser for voice input
  const parseVoiceToTaskData = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract title (everything before common keywords)
    const titleKeywords = ['due', 'assign', 'priority', 'estimate', 'description'];
    let title = text;
    
    for (const keyword of titleKeywords) {
      const index = lowerText.indexOf(keyword);
      if (index !== -1) {
        title = text.substring(0, index).trim();
        break;
      }
    }
    
    // Clean up title
    title = title.replace(/^(create|add|new)\s+(task|item)?\s*/i, '').trim();
    
    // Extract due date
    let dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Default to 1 week
    
    const dueDatePatterns = [
      /due\s+(today|tomorrow|next week|next month)/i,
      /due\s+in\s+(\d+)\s+(day|days|week|weeks)/i,
      /deadline\s+(today|tomorrow|next week)/i,
    ];
    
    for (const pattern of dueDatePatterns) {
      const match = text.match(pattern);
      if (match) {
        const timeRef = match[1].toLowerCase();
        if (timeRef === 'today') {
          dueDate = new Date();
        } else if (timeRef === 'tomorrow') {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
        } else if (timeRef === 'next week') {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);
        } else if (timeRef === 'next month') {
          dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 1);
        } else if (match[2]) {
          const num = parseInt(match[1]);
          const unit = match[2];
          dueDate = new Date();
          if (unit.startsWith('day')) {
            dueDate.setDate(dueDate.getDate() + num);
          } else if (unit.startsWith('week')) {
            dueDate.setDate(dueDate.getDate() + (num * 7));
          }
        }
        break;
      }
    }
    
    // Extract priority
    let priority = 'medium';
    if (/high priority|urgent|critical|asap/i.test(text)) {
      priority = 'high';
    } else if (/low priority|when possible|not urgent/i.test(text)) {
      priority = 'low';
    }
    
    // Extract estimated hours
    let estimatedHours = 0;
    const hoursMatch = text.match(/(\d+)\s+(hour|hours|hr|hrs)/i);
    if (hoursMatch) {
      estimatedHours = parseInt(hoursMatch[1]);
    }
    
    // Extract description (everything after "description" or "details")
    let description = '';
    const descMatch = text.match(/(?:description|details|notes?):\s*(.+)/i);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    return {
      title: title || 'Voice-created task',
      description,
      priority,
      dueDate: dueDate.toISOString(),
      estimatedHours,
      assignedTo: '', // Will need to be set by user or default
    };
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <>
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <span>Voice to Task</span>
            </>
          )}
        </button>

        {isListening && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>Listening...</span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Voice Input:
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {transcript}
          </p>
          
          {!isListening && transcript && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => processVoiceInput(transcript)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Create Task
              </button>
              <button
                onClick={() => setTranscript('')}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p className="mb-1">
          <strong>Voice Commands:</strong>
        </p>
        <ul className="space-y-1 ml-4">
          <li>• "Create task [title] due [date] high priority"</li>
          <li>• "Add [title] estimated 4 hours description [details]"</li>
          <li>• "New task [title] due tomorrow assign to [name]"</li>
          <li>• "Urgent task [title] due today"</li>
        </ul>
      </div>
    </div>
  );
}

// Hook for voice recognition functionality
export function useVoiceRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
    }
  }, []);

  const startListening = (
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ) => {
    if (!recognitionRef.current || isListening) return;

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (onError) onError(event.error);
    };

    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        if (result.isFinal) isFinal = true;
      }

      onResult(transcript, isFinal);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      if (onError) onError('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
}

// Voice command processor for different contexts
export class VoiceCommandProcessor {
  static processTaskCommand(transcript: string) {
    // Implementation for task-specific voice commands
    return this.parseTaskFromVoice(transcript);
  }

  static processProjectCommand(transcript: string) {
    // Implementation for project-specific voice commands
    return this.parseProjectFromVoice(transcript);
  }

  private static parseTaskFromVoice(text: string) {
    // Enhanced parsing logic would go here
    // This is a simplified version
    return {
      title: text.replace(/^(create|add|new)\s+(task|item)?\s*/i, '').trim(),
      priority: /high|urgent|critical/i.test(text) ? 'high' : 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
    };
  }

  private static parseProjectFromVoice(text: string) {
    return {
      name: text.replace(/^(create|add|new)\s+(project)?\s*/i, '').trim(),
      status: 'planning',
    };
  }
}