import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';

export default function SuccessPage() {
    const location = useLocation();
    const name = location.state?.name || 'there';

    return (
        <div className="registration-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {/* Background Animations */}
            <div className="background-shapes">
                <motion.div
                    className="shape"
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', position: 'absolute', top: '-10%', left: '-10%' }}
                />
                <motion.div
                    className="shape"
                    animate={{ x: [0, -40, 0], y: [0, 40, 0], rotate: [0, -90, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)', position: 'absolute', bottom: '-20%', right: '-10%' }}
                />
            </div>

            <motion.div
                className="glass-panel"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                style={{
                    maxWidth: '550px',
                    width: '100%',
                    padding: '40px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(20, 20, 35, 0.5)'
                }}
            >

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <img src={logo} alt="USM Logo" style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.6))' }} />
                </div>

                <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', color: 'white' }}>
                    Registration Successful!
                </h1>

                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: 1.6 }}>
                    Hi <span style={{ color: 'white', fontWeight: 600 }}>{name}</span>, we are absolutely thrilled to welcome you to the Unending Spirit Meeting. A confirmation has been sent to your email.
                </p>

                {/* Event Details Card */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
                        <Sparkles size={20} color="#a855f7" />
                        <h3 style={{ color: '#a855f7', fontSize: '18px', fontWeight: 600, margin: 0 }}>Theme: Gift of Healing</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#818cf8' }}>
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</h4>
                                <p style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: 500 }}>28th March</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#818cf8' }}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</h4>
                                <p style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: 500 }}>10:00 AM Prompt</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#818cf8' }}>
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Venue Location</h4>
                                <p style={{ margin: 0, color: 'white', fontSize: '15px', lineHeight: 1.5 }}>
                                    3rd floor ORA black star building, Opposite Ofankor Shell filling station
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        padding: '16px 24px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: '20px',
                        display: 'inline-block',
                        margin: '0 auto'
                    }}
                >
                    <p style={{ margin: 0, color: '#c084fc', fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px' }}>
                        Prepare your heart for a divine encounter.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
