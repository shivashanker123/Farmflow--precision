import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    Plus,
    Trash2,
    Copy,
    Check,
    Wifi,
    WifiOff,
    Activity,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Device {
    id: string;
    user_id: number;
    name: string;
    created_at: string;
}

interface DeviceSettingsProps {
    onDeviceChange?: () => void;
}

const DeviceSettings: React.FC<DeviceSettingsProps> = ({ onDeviceChange }) => {
    const { token } = useAuth();
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [newlyCreatedDevice, setNewlyCreatedDevice] = useState<Device | null>(null);
    const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchDevices();
        }
    }, [token]);

    const fetchDevices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/devices`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setDevices(data.devices || []);
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const registerDevice = async () => {
        if (!newDeviceName.trim()) return;

        setIsRegistering(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/devices`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newDeviceName }),
            });

            if (response.ok) {
                const data = await response.json();
                setNewlyCreatedDevice(data.device);
                setNewlyCreatedSecret(data.secret);  // Store secret (shown only once!)
                setDevices(prev => [data.device, ...prev]);
                setNewDeviceName('');
                setShowRegisterForm(false);
                onDeviceChange?.();
            }
        } catch (error) {
            console.error('Failed to register device:', error);
        } finally {
            setIsRegistering(false);
        }
    };

    const deleteDevice = async (deviceId: string) => {
        if (!confirm('Delete this device? All sensor data will be lost.')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/devices?id=${deviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                setDevices(prev => prev.filter(d => d.id !== deviceId));
                if (newlyCreatedDevice?.id === deviceId) {
                    setNewlyCreatedDevice(null);
                }
                onDeviceChange?.();
            }
        } catch (error) {
            console.error('Failed to delete device:', error);
        }
    };

    const copyToClipboard = async (deviceId: string) => {
        await navigator.clipboard.writeText(deviceId);
        setCopiedId(deviceId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-display font-bold text-foreground">IoT Devices</h2>
                    <p className="text-sm text-muted-foreground">Manage your ESP8266 sensor devices</p>
                </div>
                <Button
                    onClick={() => setShowRegisterForm(true)}
                    className="bg-primary hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Register Device
                </Button>
            </div>

            {/* Register Form Modal */}
            <AnimatePresence>
                {showRegisterForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowRegisterForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-display font-bold text-foreground mb-4">
                                Register New Device
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deviceName">Device Name</Label>
                                    <Input
                                        id="deviceName"
                                        placeholder="e.g., Field A Sensor"
                                        value={newDeviceName}
                                        onChange={(e) => setNewDeviceName(e.target.value)}
                                        className="glass-input"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRegisterForm(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={registerDevice}
                                        disabled={!newDeviceName.trim() || isRegistering}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isRegistering ? 'Registering...' : 'Register'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Newly Created Device Instructions */}
            <AnimatePresence>
                {newlyCreatedDevice && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-card p-5 border-2 border-success/50 bg-success/5"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-5 h-5 text-success" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-foreground">Device Registered!</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Copy this Device ID into your Arduino code:
                                </p>
                                <div className="flex items-center gap-2 mt-3 p-3 bg-muted/50 rounded-lg font-mono text-sm">
                                    <code className="flex-1 break-all">{newlyCreatedDevice.id}</code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(newlyCreatedDevice.id)}
                                        className="flex-shrink-0"
                                    >
                                        {copiedId === newlyCreatedDevice.id ? (
                                            <Check className="w-4 h-4 text-success" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-2">Arduino Code:</p>
                                    <pre className="text-xs font-mono overflow-x-auto">
                                        {`const char* deviceId = "${newlyCreatedDevice.id}";
const char* deviceSecret = "${newlyCreatedSecret || 'YOUR_SECRET'}";
const char* ingestUrl = 
  "https://dathehackathonthingy.vercel.app/api/ingest";`}
                                    </pre>
                                </div>
                                {newlyCreatedSecret && (
                                    <div className="mt-3 p-2 bg-warning/10 rounded-lg border border-warning/30">
                                        <p className="text-xs text-warning font-medium">⚠️ Save this secret now! It won't be shown again.</p>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setNewlyCreatedDevice(null)}
                                    className="mt-3 text-muted-foreground"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Device List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : devices.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-8 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Cpu className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground">No Devices Registered</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Register your first ESP8266 sensor to start collecting data
                    </p>
                    <Button
                        onClick={() => setShowRegisterForm(true)}
                        className="mt-4 bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Register Device
                    </Button>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {devices.map((device, index) => (
                        <motion.div
                            key={device.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Cpu className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-foreground">{device.name}</h4>
                                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="text-xs text-muted-foreground font-mono truncate">
                                            {device.id}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(device.id)}
                                            className="p-1 h-auto"
                                        >
                                            {copiedId === device.id ? (
                                                <Check className="w-3 h-3 text-success" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteDevice(device.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Help Section */}
            <div className="glass-card p-5 bg-secondary/5 border-secondary/20">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">How It Works</h4>
                        <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                            <li>Register a device above to get a unique Device ID</li>
                            <li>Copy the Device ID into your ESP8266 Arduino code</li>
                            <li>Flash the ESP8266 with your WiFi credentials</li>
                            <li>Your sensor data will appear in the dashboard automatically</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceSettings;
