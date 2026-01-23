import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mic, Volume2, AlertCircle, Loader2, Send } from 'lucide-react';

// Backend WebSocket URL
const WS_URL = 'ws://localhost:8000/ws/local-live';

interface LiveVoiceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'connecting';

// Breathing Sphere Component
const BreathingSphere: React.FC<{ state: VoiceState }> = ({ state }) => {
    const particles = React.useMemo(() => {
        const count = 200;
        const result = [];
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);
            result.push({ id: i, x: x * 150, y: y * 150, depth: (z + 1) / 2, delay: (i / count) * 2 });
        }
        return result;
    }, []);

    const getColor = () => {
        switch (state) {
            case 'listening': return 'rgba(45, 212, 191, 1)';
            case 'processing': return 'rgba(251, 191, 36, 1)';
            case 'speaking': return 'rgba(59, 130, 246, 1)';
            case 'error': return 'rgba(239, 68, 68, 1)';
            case 'connecting': return 'rgba(168, 85, 247, 1)';
            default: return 'rgba(45, 212, 191, 0.6)';
        }
    };

    return (
        <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: getColor().replace('1)', '0.1)') }} />
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'spin 20s linear infinite' }}>
                {particles.map((p) => (
                    <motion.div key={p.id} className="absolute rounded-full"
                        style={{
                            backgroundColor: getColor(),
                            width: `${3 + p.depth * 4}px`, height: `${3 + p.depth * 4}px`,
                            left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`,
                            opacity: 0.3 + p.depth * 0.7,
                        }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                    />
                ))}
            </div>
            <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <div className="w-16 h-16 rounded-full blur-xl" style={{ background: `linear-gradient(to bottom right, ${getColor().replace('1)', '0.4)')}, ${getColor().replace('1)', '0.2)')})` }} />
            </motion.div>
        </div>
    );
};

const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({ isOpen, onClose }) => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [statusText, setStatusText] = useState('Tap to start');
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isRecordingRef = useRef(false);

    const addLog = (msg: string) => {
        console.log(msg);
        setLogs(prev => [...prev.slice(-5), `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    // Connect to WebSocket
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        addLog('🔌 Connecting to backend...');
        setVoiceState('connecting');
        setStatusText('Connecting to server...');

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            addLog('✅ Connected to backend');
            setVoiceState('idle');
            setStatusText('Tap to start speaking');
        };

        ws.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                // Audio response from backend
                addLog('🔊 Received audio response');
                const audioBlob = new Blob([event.data], { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Play the audio
                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.play();
                    setVoiceState('speaking');
                    setStatusText('Speaking...');
                }
            } else {
                // JSON message
                try {
                    const msg = JSON.parse(event.data);
                    addLog(`📨 ${msg.type}: ${msg.message || msg.text || ''}`);

                    switch (msg.type) {
                        case 'status':
                            if (msg.message === 'transcribing') {
                                setVoiceState('processing');
                                setStatusText('Transcribing...');
                            } else if (msg.message === 'thinking') {
                                setStatusText('Thinking...');
                            } else if (msg.message === 'speaking') {
                                setVoiceState('speaking');
                                setStatusText('Speaking...');
                            } else if (msg.message === 'done') {
                                // Will be handled by audio end
                            }
                            break;
                        case 'transcription':
                            setTranscript(`You: "${msg.text}"`);
                            break;
                        case 'response':
                            setAiResponse(`AI: "${msg.text}"`);
                            break;
                        case 'error':
                            addLog(`❌ Error: ${msg.message}`);
                            setStatusText('Error - tap to retry');
                            setVoiceState('error');
                            break;
                    }
                } catch (e) {
                    addLog(`⚠️ Could not parse message`);
                }
            }
        };

        ws.onerror = (error) => {
            addLog('❌ WebSocket error');
            console.error('WebSocket error:', error);
            setVoiceState('error');
            setStatusText('Connection error - is backend running?');
        };

        ws.onclose = () => {
            addLog('🔌 WebSocket closed');
            wsRef.current = null;
            if (isOpen) {
                setVoiceState('error');
                setStatusText('Disconnected - tap to reconnect');
            }
        };

        wsRef.current = ws;
    }, [isOpen]);

    // Start recording
    const startRecording = async () => {
        if (isRecordingRef.current) return;

        try {
            addLog('🎤 Requesting microphone...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            // Check MediaRecorder support
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                addLog('🛑 Recording stopped');
                isRecordingRef.current = false;

                // Stop the stream
                stream.getTracks().forEach(track => track.stop());

                // Create blob and send to backend
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                addLog(`📤 Sending ${audioBlob.size} bytes`);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(audioBlob);
                    setVoiceState('processing');
                    setStatusText('Processing...');
                } else {
                    addLog('❌ WebSocket not connected');
                    setVoiceState('error');
                    setStatusText('Not connected');
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms
            isRecordingRef.current = true;
            setVoiceState('listening');
            setStatusText('Listening... tap to stop');
            setTranscript('');
            setAiResponse('');
            addLog('🎙️ Recording started');

        } catch (error) {
            addLog(`❌ Mic error: ${error}`);
            setVoiceState('error');
            setStatusText('Microphone error');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecordingRef.current) {
            mediaRecorderRef.current.stop();
            addLog('⏹️ Stopping recording...');
        }
    };

    // Handle sphere click
    const handleSphereClick = () => {
        if (voiceState === 'error' || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        } else if (voiceState === 'idle') {
            startRecording();
        } else if (voiceState === 'listening') {
            stopRecording();
        }
    };

    // Initialize on open
    useEffect(() => {
        if (isOpen) {
            connectWebSocket();

            // Create audio element for playback
            audioRef.current = new Audio();
            audioRef.current.onended = () => {
                addLog('🔊 Audio finished');
                setVoiceState('idle');
                setStatusText('Tap to speak again');
            };
        }

        return () => {
            // Cleanup
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (mediaRecorderRef.current && isRecordingRef.current) {
                mediaRecorderRef.current.stop();
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [isOpen, connectWebSocket]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleClose = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (mediaRecorderRef.current && isRecordingRef.current) {
            mediaRecorderRef.current.stop();
        }
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onClose();
    };

    const getStatusColor = () => {
        switch (voiceState) {
            case 'listening': return 'text-teal-400';
            case 'processing': return 'text-amber-400';
            case 'speaking': return 'text-blue-400';
            case 'error': return 'text-red-400';
            case 'connecting': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = () => {
        switch (voiceState) {
            case 'listening': return <Mic className="w-5 h-5 animate-pulse" />;
            case 'processing': return <Loader2 className="w-5 h-5 animate-spin" />;
            case 'speaking': return <Volume2 className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            case 'connecting': return <Loader2 className="w-5 h-5 animate-spin" />;
            default: return <Mic className="w-5 h-5 opacity-50" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

                    {/* Sphere */}
                    <div
                        className="relative z-10 flex items-center justify-center flex-1 cursor-pointer"
                        onClick={handleSphereClick}
                    >
                        <BreathingSphere state={voiceState} />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white/70 text-center">
                                {voiceState === 'idle' ? (
                                    <>
                                        <Mic className="w-12 h-12 mx-auto mb-2" />
                                        <p>Click to start</p>
                                    </>
                                ) : voiceState === 'listening' ? (
                                    <>
                                        <Mic className="w-12 h-12 mx-auto mb-2 animate-pulse text-teal-400" />
                                        <p className="text-teal-400">Click to stop & send</p>
                                    </>
                                ) : voiceState === 'connecting' ? (
                                    <>
                                        <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin text-purple-400" />
                                        <p className="text-purple-400">Connecting...</p>
                                    </>
                                ) : voiceState === 'error' ? (
                                    <>
                                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                                        <p className="text-red-400">Click to reconnect</p>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Transcripts */}
                    <div className="absolute top-1/2 mt-48 left-1/2 -translate-x-1/2 z-10 max-w-lg text-center px-4">
                        {transcript && <p className="text-teal-300 text-xl mb-2">{transcript}</p>}
                        {aiResponse && <p className="text-blue-300 text-lg">{aiResponse}</p>}
                    </div>

                    {/* Status */}
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
                        <div className={`flex items-center gap-3 ${getStatusColor()}`}>
                            {getStatusIcon()}
                            <span className="text-xl font-medium">{statusText}</span>
                        </div>
                    </div>

                    {/* End button */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
                        <button onClick={handleClose} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg">
                            <Phone className="w-7 h-7 text-white rotate-[135deg]" />
                        </button>
                    </div>

                    {/* Debug log */}
                    <div className="absolute top-4 left-4 z-10 text-xs text-white/50 font-mono max-w-sm">
                        <p className="text-white/70 mb-1">Debug (Local Backend):</p>
                        {logs.map((log, i) => <p key={i}>{log}</p>)}
                    </div>

                    <div className="absolute top-6 right-6 text-white/40 text-sm z-10">ESC to exit</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LiveVoiceOverlay;
