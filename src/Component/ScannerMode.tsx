import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ScannerMode() {
    const navigate = useNavigate();
    const toggleCheckIn = useMutation(api.attendanceLogs.toggleCheckIn);
    const logs = useQuery(api.attendanceLogs.getAllLogs); // For quick validation locally
    
    const [lastScanned, setLastScanned] = useState<{name: string, status: boolean} | null>(null);
    const { signOut } = useAuthActions();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            async (decodedText) => {
                // Ignore fast duplicate scans
                if (lastScanned) return;

                try {
                    const scannedUuid = decodedText;
                    const log = logs?.find(l => l.qr_uuid === scannedUuid);
                    
                    if (log) {
                        if (log.checked_in) {
                            toast.error(`${log.full_name} is already checked in!`);
                            setLastScanned({ name: log.full_name, status: false });
                        } else {
                            await toggleCheckIn({ id: log._id, status: true });
                            toast.success(`${log.full_name} checked in successfully!`);
                            setLastScanned({ name: log.full_name, status: true });
                        }
                    } else {
                        toast.error("Invalid QR Code");
                    }
                } catch (error) {
                    toast.error("Failed to process QR code");
                }

                // Reset after 3 seconds
                setTimeout(() => {
                    setLastScanned(null);
                }, 3000);
            },
            () => {
                // Ignore noisy errors
            }
        );

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [logs, toggleCheckIn, lastScanned]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#000',
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#a855f7', padding: '8px', borderRadius: '10px' }}>
                        <Camera size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Scanner Mode</h1>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Usher View</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div id="reader" style={{ 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        border: '2px solid rgba(255,255,255,0.1)',
                        background: 'black',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}></div>

                    <div style={{ height: '100px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {lastScanned ? (
                            <div style={{
                                background: lastScanned.status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${lastScanned.status ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                padding: '16px 24px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: lastScanned.status ? '#34d399' : '#f87171',
                                width: '100%'
                            }}>
                                {lastScanned.status ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{lastScanned.name}</h3>
                                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
                                        {lastScanned.status ? 'Successfully Checked In' : 'Already Checked In'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontStyle: 'italic' }}>
                                Point camera at QR code to instantly check in attendee.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
