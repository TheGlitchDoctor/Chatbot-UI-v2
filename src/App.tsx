import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Send, 
  Mic, 
  Bot, 
  User, 
  MessageSquare,
  Plus,
  LogIn,
  X,
  Image,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  id: string;
  hasCode?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

import logoDark from './static/ai_agent.jpg';


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMessage, setRecordedMessage] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState('1');
  const [showConfirm, setShowConfirm] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Current Chat',
      timestamp: new Date().toLocaleString(),
      messages: [
        { 
          id: '1',
          type: 'user', 
          content: 'Hello! Can you show me how to write a simple React component?',
          timestamp: new Date(Date.now() - 5000).toLocaleString()
        },
        { 
          id: '2',
          type: 'bot', 
          content: 'Here\'s a simple React component example:\n```jsx\nimport React from \'react\';\n\nfunction SimpleComponent() {\n  return (\n    <div className="p-4">\n      <h1>Hello World!</h1>\n    </div>\n  );\n}\n\nexport default SimpleComponent;\n```',
          timestamp: new Date().toLocaleString(),
          hasCode: true
        }
      ]
    },
    {
      id: '2',
      title: 'Project Planning Discussion',
      timestamp: '2 hours ago',
      messages: []
    }
  ]);

  const currentSession = chatSessions.find(session => session.id === currentSessionId) || chatSessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedMessage(audioUrl);
        setShowConfirm(true);
      };

      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toLocaleString(),
      messages: []
    };
    setChatSessions(prevSessions => [newSession, ...prevSessions]);
    setCurrentSessionId(newSession.id);
    setCurrentInput('');
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleString()
    };

    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === currentSessionId
          ? {
              ...session,
              messages: [...session.messages, newMessage]
            }
          : session
      )
    );
    setCurrentInput('');
    setRecordedMessage(null);
    setShowConfirm(false);

    // Simulate bot response after thinking animation
    setTimeout(() => {
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: content.includes('code') || content.includes('example') 
          ? 'Here\'s an example:\n```javascript\nconst greeting = "Hello World!";\nconsole.log(greeting);\n```'
          : 'This is a sample response. In a real application, this would be the AI\'s response.',
        timestamp: new Date().toLocaleString(),
        hasCode: content.includes('code') || content.includes('example')
      };

      setChatSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, botResponse]
              }
            : session
        )
      );
      setIsThinking(false);
    }, 2000);
  };

  const handleMicClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleCopyCode = (messageId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedStates(prev => ({ ...prev, [messageId]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [messageId]: false }));
    }, 2000);
  };

  const ThinkingIndicator = () => (
    <div className="flex items-center gap-4 animate-fadeIn">
      <div className="thinking-indicator float">
        <div className="flex gap-1">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
      </div>
      <Sparkles className="w-5 h-5 text-[#ffb71b] animate-pulse" />
    </div>
  );

  const formatMessageContent = (message: Message) => {
    if (!message.hasCode) return message.content;

    const parts = message.content.split('```');
    return parts.map((part, index) => {
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      }
      const [language, ...code] = part.split('\n');
      const codeContent = code.join('\n');
      return (
        <div key={index} className="code-block group">
          <div className="code-block-header">
            <span className="text-sm text-gray-400">{language}</span>
            <button
              onClick={() => handleCopyCode(message.id, codeContent)}
              className="copy-button group-hover:opacity-100 opacity-0"
            >
              {copiedStates[message.id] ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <pre className="shimmer">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="h-16 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 shadow-sm border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:rotate-180"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="w-50 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-inner">
            <img src={logoDark} alt="logo Image" className="w-50 h-12"/>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#ffb71b] rounded-full shadow-[#ffb71b]/50 shadow-lg animate-pulse">
            <Bot className="w-6 h-6 text-black" />
          </div>
        </div>

        <button className="px-4 py-2 bg-black text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group hover:scale-105">
          <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          <span>Sign in</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div 
          className={`fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 shadow-lg transition-all duration-300 ease-out z-20`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 text-transparent bg-clip-text">
                Chat History
              </h2>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:rotate-90"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 p-3 bg-black text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mb-6 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>New Chat</span>
            </button>
            
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {chatSessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-102 ${
                    currentSessionId === session.id 
                      ? 'bg-[#ffb71b]/10 shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`w-5 h-5 ${
                      currentSessionId === session.id ? 'text-[#ffb71b]' : 'text-gray-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{session.title}</p>
                      <p className="text-xs text-gray-500">{session.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {currentSession.messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg float ${
                    message.type === 'user' 
                      ? 'bg-black' 
                      : 'bg-[#ffb71b]'
                  }`}>
                    {message.type === 'user' ? 
                      <User className="w-5 h-5 text-white" /> : 
                      <Bot className="w-5 h-5 text-black" />
                    }
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={`message-cloud ${
                      message.type === 'user' 
                        ? 'user-message' 
                        : 'bot-message'
                    }`}>
                      {formatMessageContent(message)}
                    </div>
                    <span className={`text-xs ${message.type === 'user' ? 'text-right' : ''} text-gray-500`}>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start animate-fadeIn">
                <ThinkingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm p-4">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-lg float">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl p-2 shadow-inner relative">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={isRecording ? "Recording..." : "Message..."}
                  className="flex-1 bg-transparent border-none outline-none px-2"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && currentInput.trim()) {
                      setIsThinking(true);
                      handleSendMessage(currentInput);
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleMicClick}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isRecording 
                        ? 'bg-red-100 hover:bg-red-200 animate-pulse' 
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <Mic className={`w-5 h-5 ${
                      isRecording ? 'text-red-500' : 'text-gray-600'
                    }`} />
                  </button>
                  {showConfirm && (
                    <div className="absolute right-14 bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsThinking(true);
                            handleSendMessage("Voice message");
                          }}
                          className="px-3 py-1 bg-[#ffb71b] text-black rounded-md hover:opacity-90 transition-all duration-200"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setRecordedMessage(null);
                            setShowConfirm(false);
                          }}
                          className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      if (currentInput.trim()) {
                        setIsThinking(true);
                        handleSendMessage(currentInput);
                      }
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110"
                  >
                    <Send className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;