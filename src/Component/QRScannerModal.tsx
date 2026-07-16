import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
                scanner.clear();
                onClose();
            },
            () => {
                // Ignore errors (too noisy)
            }
        );

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [isOpen, onClose, onScan]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '32px',
                            position: 'relative',
                            boxShadow: 'var(--shadow-lg)'
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: '50%',
                                padding: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'var(--primary-bg)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <Camera size={28} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Scan Attendee Pass</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Point your camera at the registrant's QR code</p>
                        </div>

                        <div id="reader" style={{ 
                            borderRadius: '16px', 
                            overflow: 'hidden', 
                            border: '1px solid var(--border)',
                            background: 'black'
                        }}></div>

                        <p style={{ 
                            textAlign: 'center', 
                            marginTop: '24px', 
                            color: 'var(--text-muted)', 
                            fontSize: '13px',
                            fontStyle: 'italic'
                        }}>
                            Automatic check-in will trigger upon detection
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
