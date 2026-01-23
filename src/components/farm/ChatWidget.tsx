import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Mic, MicOff, Send, Bot, User, Sparkles, Maximize2, Minimize2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFarm } from '@/contexts/FarmContext';
import LiveVoiceOverlay from './LiveVoiceOverlay';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MOCK_RESPONSES = [
  "Based on your current soil moisture levels, I recommend waiting another 6 hours before the next irrigation cycle. Your crops are showing healthy hydration patterns.",
  "Your water budget is looking optimal! The current efficiency score suggests you're using 23% less water than traditional irrigation methods.",
  "I notice the soil moisture has dropped to {moisture}%. For {crop}, the ideal range is 50-70%. Consider scheduling irrigation within the next 12 hours.",
  "Great question! For maximum yield, maintain consistent moisture levels between 55-65%. Your current reading of {moisture}% is within acceptable range.",
  "Weather patterns indicate potential rainfall in the next 48 hours. I suggest reducing irrigation by 30% to optimize water usage.",
  "Your {crop} is in the vegetative growth stage. This is a critical period where consistent moisture is essential for root development.",
];

const ChatWidget = () => {
  const { farmData } = useFarm();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI Crop Consultant. I'm here to help you optimize your ${farmData.cropType} irrigation and answer any farming questions. How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(false);
  const [isLiveModeEnabled, setIsLiveModeEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!isSpeakerEnabled) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getMockResponse = (): string => {
    const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
    return MOCK_RESPONSES[randomIndex]
      .replace('{moisture}', farmData.soilMoisture.toString())
      .replace('{crop}', farmData.cropType);
  };

  // Ollama API configuration
  const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
  const OLLAMA_MODEL = 'llama3:latest';

  // Create system context for the AI
  const getSystemPrompt = () => {
    return `You are an expert AI Crop Consultant for FarmFlow, a precision agriculture platform. 
You help farmers optimize their irrigation and crop management.

Current Farm Data:
- Crop Type: ${farmData.cropType}
- Soil Moisture: ${farmData.soilMoisture}%
- Field Size: ${farmData.fieldSize} acres
- Daily Water Need: ${farmData.dailyWaterNeed} mm
- Pump Status: ${farmData.pumpActive ? 'Running' : 'Off'}

Optimal moisture range for ${farmData.cropType}: 50-70%

Provide helpful, concise advice based on this data. Be friendly and professional.
Keep responses under 3 sentences unless the user asks for detailed information.`;
  };

  // Call Ollama API using /api/chat endpoint
  const callOllamaAPI = async (userPrompt: string): Promise<string> => {
    try {
      console.log('Calling Ollama API with model:', OLLAMA_MODEL);

      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(),
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          stream: false,
        }),
      });

      console.log('Ollama response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama API error response:', errorText);
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Ollama response data:', data);

      // /api/chat returns response in data.message.content
      return data.message?.content || data.response || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Ollama API error:', error);
      // Fallback to mock response if Ollama is unavailable
      return getMockResponse() + '\n\n(Note: Using offline mode - Ollama not available)';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      // Call Ollama API for real AI response
      const aiResponse = await callOllamaAPI(userQuery);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please make sure Ollama is running and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <LayoutGroup>
      {/* Backdrop for expanded mode */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={containerRef}
        layoutId="ai-chat-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          layout: {
            type: 'spring',
            stiffness: 350,
            damping: 30,
            mass: 0.8,
          },
          opacity: { duration: 0.3 },
          y: { duration: 0.3 },
        }}
        className={`glass-card p-6 ${isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'relative'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-foreground">AI Crop Consultant</h3>
              <p className="text-xs text-muted-foreground">Powered by FarmFlow Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 rounded-full bg-success"
              />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>

            {/* Expand/Contract Button */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/30 hover:border-primary/50 flex items-center justify-center text-primary hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md"
              title={isExpanded ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
            >
              {isExpanded ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div className={`overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent ${isExpanded ? 'flex-1' : 'h-80'
          }`}>
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'assistant'
                    ? 'bg-gradient-to-br from-primary to-secondary'
                    : 'bg-gradient-to-br from-secondary to-water'
                    }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'assistant'
                    ? 'bg-muted/50 backdrop-blur-sm border border-border/50'
                    : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                    }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${message.role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                      }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator - Animated typing dots */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {/* Animated typing dots */}
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2">
          {/* Live Mode Button - Speech to Speech */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsLiveModeEnabled(!isLiveModeEnabled)}
              className={`rounded-xl h-12 w-12 transition-all duration-300 ${isLiveModeEnabled
                ? 'bg-success/20 border-success text-success animate-pulse'
                : 'hover:bg-success/10 hover:border-success hover:text-success'
                }`}
              title="Live Mode - Speech to Speech"
            >
              <Radio className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Microphone Button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleListening}
              className={`rounded-xl h-12 w-12 transition-all duration-300 ${isListening
                ? 'bg-destructive/10 border-destructive text-destructive animate-pulse'
                : 'hover:bg-primary/10 hover:border-primary hover:text-primary'
                }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </motion.div>

          {/* Text Input - Now a Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? 'Listening...' : 'Ask about your crops...'}
              className="glass-input w-full pr-4 rounded-xl text-base py-3 px-4 min-h-[48px] max-h-[120px] resize-none"
              disabled={isListening}
              rows={1}
            />
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <div className="w-2 h-2 rounded-full bg-destructive" />
              </motion.div>
            )}
          </div>

          {/* Send Button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="rounded-xl h-12 px-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Voice Status with Wave Animation */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="flex items-center justify-center gap-3 py-2">
                {/* Voice wave visualization */}
                <div className="flex items-center gap-0.5 h-6">
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-destructive rounded-full"
                      animate={{
                        height: [4 + Math.random() * 4, 12 + Math.random() * 8, 4 + Math.random() * 4]
                      }}
                      transition={{
                        duration: 0.4 + Math.random() * 0.2,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-destructive font-medium">
                  Listening... Speak now
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Live Voice Overlay */}
      <LiveVoiceOverlay
        isOpen={isLiveModeEnabled}
        onClose={() => setIsLiveModeEnabled(false)}
      />
    </LayoutGroup>
  );
};

export default ChatWidget;

