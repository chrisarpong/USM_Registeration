import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import img3 from '../assets/3.JPEG'
import img4 from '../assets/4.JPEG'
import img6 from '../assets/6.JPEG'
import img11 from '../assets/11.JPEG'
import img13 from '../assets/13.JPEG'
import img14 from '../assets/14.JPEG'

const images = [img14, img3, img4, img6, img11, img13]

export default function Slideshow() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
        }, 5000) // Change image every 5 seconds
        return () => clearInterval(timer)
    }, [])

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <AnimatePresence initial={false}>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 0.6, scale: 1 }} // 0.6 opacity to keep text legible
                    exit={{ opacity: 0 }}
                    transition={{ 
                        opacity: { duration: 1.5, ease: 'easeInOut' },
                        scale: { duration: 6, ease: 'linear' } // Slow zoom effect while visible
                    }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${images[currentIndex]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        willChange: 'transform, opacity'
                    }}
                />
            </AnimatePresence>
        </div>
    )
}
