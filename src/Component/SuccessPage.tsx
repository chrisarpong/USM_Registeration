import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Calendar, MapPin, Share2, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import logo from '../assets/logo.png';

export default function SuccessPage() {
    const location = useLocation();
    const { name = 'there', registrationId = 'USM-GUEST', status, event } = location.state || {};

    // Personalize the subtitle based on status
    let welcomeMessage = 'Your registration has been confirmed. We look forward to seeing you!';
    if (status === 'First Timer') {
        welcomeMessage = 'We are thrilled to welcome you for the first time! Your registration is confirmed.';
    } else if (status === 'Guest') {
        welcomeMessage = 'Your guest registration is confirmed. We look forward to hosting you!';
    }

    // Dynamic event data passed from Registration page
    const eventData = event || {};
    const eventDate = eventData.date || '—';
    const eventTime = eventData.time || '10:00 AM';
    const eventTheme = eventData.theme || 'TBD';
    const eventVenue = eventData.venue || 'Venue TBD';

    const shareOnWhatsApp = () => {
        const message = `Hey! I just registered for the Unending Spirit Meeting. Join me on ${eventDate}! 🕊️✨\n\nRegister here: https://usm-registeration.vercel.app`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg-base)' }}>
            <motion.div
                className="modal-content"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    padding: 'clamp(24px, 5vw, 40px)',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <img src={logo} alt="USM Logo" style={{ height: '60px', width: 'auto' }} />
                </div>

                <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Registration Successful!
                </h1>

                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                    Hi <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</span>, <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{welcomeMessage}</span>
                </p>

                {/* QR Code Section */}
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    display: 'inline-block',
                    marginBottom: '32px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <QRCodeSVG 
                        value={String(registrationId)} 
                        size={160}
                        level="H"
                        includeMargin={false}
                    />
                    <p style={{ color: '#09090b', fontSize: '12px', fontWeight: 600, margin: '16px 0 0 0', letterSpacing: '1px' }}>
                        YOUR ATTENDANCE PASS
                    </p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <button
                        onClick={shareOnWhatsApp}
                        className="btn-submit"
                        style={{
                            background: '#25D366',
                            color: 'white',
                            margin: '0 auto',
                            width: 'auto',
                            padding: '12px 24px',
                            borderRadius: '100px'
                        }}
                    >
                        <Share2 size={18} />
                        Invite a Friend on WhatsApp
                    </button>
                </div>

                {/* Event Details Card */}
                <div style={{
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    border: '1px solid var(--border)',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Sparkles size={18} color="var(--primary)" />
                            <div>
                                <h4 style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>Theme</h4>
                                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}>{eventTheme}</p>
                            </div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Calendar size={18} color="var(--primary)" />
                            <div>
                                <h4 style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>Date & Time</h4>
                                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}>{eventDate} at {eventTime}</p>
                            </div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <MapPin size={18} color="var(--primary)" />
                            <div>
                                <h4 style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>Venue</h4>
                                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}>{eventVenue}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
