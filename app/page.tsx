'use client'

import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

// Consistent motion config
const motionConfig = {
  duration: 0.55,
  ease: [0.25, 0.1, 0.25, 1] as const,
  stagger: 0.1,
  y: 12,
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!mounted) return null
  
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-amber-400/30 border-t-amber-400 rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-amber-400 text-xs tracking-[0.3em] uppercase">Loading</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SCROLL PROGRESS BAR
// ============================================
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 origin-left z-[100]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function BackToTop() {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#top"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-10 h-10 md:w-12 md:h-12 bg-amber-400 rounded-full flex items-center justify-center text-black z-50 shadow-lg hover:bg-amber-300 transition-colors"
          aria-label="Back to top"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.a>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SPLIT TEXT ANIMATION
// ============================================
function SplitText({ 
  children, 
  className = '', 
  delay = 0,
  staggerDelay = 0.03
}: { 
  children: string
  className?: string
  delay?: number
  staggerDelay?: number
}) {
  const letters = children.split('')
  
  return (
    <span className={className} aria-label={children}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * staggerDelay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block"
          style={{ 
            transformOrigin: 'bottom',
            display: letter === ' ' ? 'inline' : 'inline-block',
            minWidth: letter === ' ' ? '0.25em' : 'auto'
          }}
          aria-hidden="true"
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  )
}

// ============================================
// ANIMATED COUNTER - HYDRATION SAFE
// ============================================
function AnimatedCounter({ 
  value, 
  duration = 2, 
  delay = 0 
}: { 
  value: string
  duration?: number
  delay?: number 
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  
  // Start with FINAL value (matches server render)
  const [displayValue, setDisplayValue] = useState(value)
  const [hasAnimated, setHasAnimated] = useState(false)
  
  useEffect(() => {
    // Skip if already animated or not in view
    if (hasAnimated || !isInView) return
    
    // Mark as animated to prevent re-runs
    setHasAnimated(true)
    
    // Handle infinity symbol - no animation needed
    if (value === '∞') return
    
    // Extract number and suffix (e.g., "50+" -> 50 and "+")
    const numMatch = value.match(/(\d+)/)
    const suffix = value.match(/[^\d]+$/)?.[0] || ''
    
    if (!numMatch) return
    
    const target = parseInt(numMatch[1])
    
    // Small delay to ensure hydration is complete, then reset to 0
    const hydrationDelay = setTimeout(() => {
      setDisplayValue('0' + suffix)
      
      // Start counting animation after the specified delay
      const animationDelay = setTimeout(() => {
        const startTime = Date.now()
        const animDuration = duration * 1000
        
        const tick = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / animDuration, 1)
          
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
          const current = Math.floor(eased * target)
          
          setDisplayValue(current + suffix)
          
          if (progress < 1) {
            requestAnimationFrame(tick)
          } else {
            setDisplayValue(value) // Ensure exact final value
          }
        }
        
        requestAnimationFrame(tick)
      }, delay * 1000)
      
      return () => clearTimeout(animationDelay)
    }, 50) // 50ms delay for hydration safety
    
    return () => clearTimeout(hydrationDelay)
  }, [isInView, hasAnimated, value, duration, delay])
  
  return <span ref={ref}>{displayValue}</span>
}

// ============================================
// MAGNETIC BUTTON
// ============================================
function MagneticButton({ 
  children, 
  className = '',
  href = '#',
  onClick,
  strength = 0.3,
  ariaLabel
}: { 
  children: React.ReactNode
  className?: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
  strength?: number
  ariaLabel?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const distanceX = (e.clientX - centerX) * strength
    const distanceY = (e.clientY - centerY) * strength
    
    x.set(distanceX)
    y.set(distanceY)
  }, [strength, x, y])
  
  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])
  
  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={ariaLabel}
    >
      {children}
    </motion.a>
  )
}

// ============================================
// HEADER - FIXED FOR MOBILE
// ============================================
function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-md border-b border-amber-500/10' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: motionConfig.ease }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <motion.a 
            href="#top" 
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="CleverTap - Go to homepage"
          >
            <Image 
              src="/images/clevertap-logo.webp" 
              alt="CleverTap Logo" 
              width={120} 
              height={28}
              className="h-6 sm:h-7 w-auto hover:opacity-80 transition-opacity"
            />
          </motion.a>
          <MagneticButton 
            href="#registration" 
            className="glow-button px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 rounded-full transition-all inline-block whitespace-nowrap"
            strength={0.4}
            ariaLabel="Register for the event"
          >
            Register Now
          </MagneticButton>
        </div>
      </div>
    </motion.header>
  )
}

// ============================================
// HERO WITH PARALLAX - FIXED FOR MOBILE
// ============================================
function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  
  return (
    <section ref={ref} id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black" aria-label="Hero section">
      {/* Parallax Background - FULL SCREEN COVER */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: backgroundY }}
      >
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src="/images/riyadh-bg.webp"
            alt="Riyadh Skyline at dusk"
            fill
            className="object-cover object-[center_20%] sm:object-[center_30%] md:object-center"
            priority
            sizes="100vw"
          />
        </motion.div>
        {/* Gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div 
        className="absolute top-32 left-10 w-16 h-16 border border-amber-500/20 rounded-full hidden md:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div 
        className="absolute bottom-32 right-10 w-24 h-24 border border-amber-500/20 rounded-full hidden md:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        aria-hidden="true"
      />
      
      {/* Floating particles */}
      <motion.div 
        className="absolute top-1/4 right-1/4 w-2 h-2 bg-amber-400/30 rounded-full hidden md:block"
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div 
        className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-amber-400/40 rounded-full hidden md:block"
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        aria-hidden="true"
      />

      <motion.div 
        className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-16 sm:pt-14"
        style={{ y: textY, opacity }}
      >
        {/* Arabic text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base sm:text-xl md:text-2xl text-amber-300 mb-2 font-light"
          dir="rtl"
          lang="ar"
        >
          مجلس سحور كليڤر تاب
        </motion.p>

        {/* CleverTap title with split text */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-1 font-serif text-amber-400">
          <SplitText delay={0.4} staggerDelay={0.05}>CleverTap</SplitText>
        </h1>
        
        {/* Majlis title with split text */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-tight mb-3 text-white font-serif">
          <SplitText delay={0.8} staggerDelay={0.04}>Majlis Al-Suhoor</SplitText>
        </h2>

        {/* Gold line */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 80, opacity: 1 }}
          transition={{ duration: 0.8, ease: motionConfig.ease, delay: 1.4 }}
          className="h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 mx-auto mb-4"
          aria-hidden="true"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: motionConfig.y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 1.6 }}
          className="text-xs sm:text-sm md:text-base text-white/80 font-light tracking-wide mb-6 sm:mb-8 px-4"
        >
          A Celebration of Flavor, Fellowship, and Future
        </motion.p>

        {/* Info pills */}
        <motion.div
          initial={{ opacity: 0, y: motionConfig.y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 1.8 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs px-2"
        >
          {[
            { icon: 'location', text: 'Riyadh, Saudi Arabia' },
            { icon: 'calendar', text: 'March 2, 2026' },
            { icon: 'clock', text: '9:30 PM onwards' }
          ].map((item, index) => (
            <motion.span
              key={item.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 2 + index * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(251, 191, 36, 0.5)' }}
              className="flex items-center gap-1.5 sm:gap-2 text-white bg-black/50 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 hover:bg-black/60 transition-all cursor-default"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                {item.icon === 'location' && <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
                {item.icon === 'calendar' && <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                {item.icon === 'clock' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              </svg>
              <span className="whitespace-nowrap">{item.text}</span>
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.a
          href="#countdown"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1 text-white/60"
          aria-label="Scroll to content"
        >
          <span className="text-[8px] sm:text-[9px] tracking-widest uppercase">Scroll</span>
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.a>
      </motion.div>
    </section>
  )
}

// ============================================
// COUNTDOWN WITH FLIP ANIMATION
// ============================================
function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    setMounted(true)
    
    const calculateTimeLeft = () => {
      const eventDate = new Date('March 2, 2026 21:30:00').getTime()
      const now = new Date().getTime()
      const distance = eventDate - now

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [])

  const timeUnits = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' }
  ]

  return (
    <section ref={ref} id="countdown" className="py-10 bg-gradient-to-b from-black to-[#0a0a0a] relative overflow-hidden pattern-bg" aria-label="Countdown to event">
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: motionConfig.y }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
          className="text-center mb-6"
        >
          <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-1">Don&apos;t Miss Out</p>
          <h2 className="text-xl md:text-2xl font-light text-white font-serif gold-line">Event Starts In</h2>
        </motion.div>
        <div className="flex justify-center gap-2 sm:gap-3 md:gap-6" role="timer" aria-live="polite">
          {timeUnits.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: motionConfig.y }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: index * motionConfig.stagger }}
              className="text-center"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#0f0f0f] border border-amber-500/20 rounded-lg flex items-center justify-center mb-1.5 overflow-hidden hover:border-amber-500/40 transition-colors">
                <span className="text-xl sm:text-2xl md:text-3xl font-light text-amber-400">
                  {mounted ? item.value.toString().padStart(2, '0') : '00'}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-wider">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// ABOUT WITH ANIMATED COUNTER
// ============================================
function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} id="about" className="py-12 bg-[#0a0a0a] pattern-bg" aria-label="About the event">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: motionConfig.y }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
          >
            <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-2">About The Event</p>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-light leading-tight mb-1 text-white font-serif gold-line-left">
              Network & Connect with{' '}
              <span className="highlight-text relative inline-block">
                Leaders
                <motion.span
                  initial={{ width: 0 }}
                  animate={isInView ? { width: '100%' } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="absolute bottom-0 left-0 h-[6px] bg-gradient-to-r from-amber-400/30 to-amber-500/30 -z-10"
                  aria-hidden="true"
                />
              </span>
              {' '}in Riyadh
            </h2>
            <div className="mt-4" />
            <motion.p
              initial={{ opacity: 0, y: motionConfig.y }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 0.1 }}
              className="text-white/40 text-sm leading-relaxed mb-6"
            >
              CleverTap Majlis Al-Suhoor is an exclusive gathering for leaders and experts in marketing, growth, and customer engagement. With no formal agenda, this is a unique opportunity to connect and build connections with industry peers over a memorable Suhoor.
            </motion.p>
            
            {/* Stats with Animated Counter */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { value: '50+', label: 'Leaders', delay: 0 },
                { value: '1', label: 'Night', delay: 0.2 },
                { value: '∞', label: 'Connections', delay: 0.4 }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: motionConfig.y }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -4, borderColor: 'rgba(251, 191, 36, 0.2)' }}
                  className="card-hover p-2 sm:p-3 bg-[#0f0f0f] rounded-lg border border-white/5 text-center transition-all"
                >
                  <div className="text-xl sm:text-2xl font-light text-amber-400">
                    <AnimatedCounter value={stat.value} duration={1.5} delay={stat.delay} />
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: motionConfig.y }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 0.2 }}
            className="relative"
          >
            <div className="corner-decor p-3">
              <motion.div 
                className="relative aspect-[4/3] rounded-lg overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <Image src="/images/networking-4.webp" alt="Professionals networking at a previous CleverTap event" fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// STAT CARD WITH ANIMATION
// ============================================
function StatCard({ 
  value, 
  label, 
  delay = 0, 
  isInView,
  animate = true 
}: { 
  value: string
  label: string
  delay?: number
  isInView: boolean
  animate?: boolean
}) {
  const [displayValue, setDisplayValue] = useState(animate ? '0' : value)
  const [hasAnimated, setHasAnimated] = useState(false)
  
  useEffect(() => {
    if (!isInView || hasAnimated || !animate) return
    
    setHasAnimated(true)
    
    // Handle infinity
    if (value === '∞') {
      const timeout = setTimeout(() => setDisplayValue('∞'), delay * 1000 + 500)
      return () => clearTimeout(timeout)
    }
    
    // Extract number and suffix
    const numMatch = value.match(/(\d+)/)
    const suffixMatch = value.match(/[^\d]+$/)
    
    if (!numMatch) {
      setDisplayValue(value)
      return
    }
    
    const targetNumber = parseInt(numMatch[1])
    const suffix = suffixMatch ? suffixMatch[0] : ''
    
    // Delay before starting
    const delayMs = delay * 1000
    
    const delayTimeout = setTimeout(() => {
      const duration = 1500 // 1.5 seconds
      const startTime = Date.now()
      
      const tick = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.floor(eased * targetNumber)
        
        setDisplayValue(current + suffix)
        
        if (progress < 1) {
          requestAnimationFrame(tick)
        }
      }
      
      requestAnimationFrame(tick)
    }, delayMs)
    
    return () => clearTimeout(delayTimeout)
  }, [isInView, value, delay, hasAnimated, animate])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: motionConfig.y }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay }}
      whileHover={{ y: -4, borderColor: 'rgba(251, 191, 36, 0.2)' }}
      className="card-hover p-2 sm:p-3 bg-[#0f0f0f] rounded-lg border border-white/5 text-center transition-all"
    >
      <div className="text-xl sm:text-2xl font-light text-amber-400">
        {displayValue}
      </div>
      <div className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
    </motion.div>
  )
}

// ============================================
// GALLERY WITH PAUSE ON HOVER
// ============================================
function Gallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [isPausedFood, setIsPausedFood] = useState(false)
  const [isPausedNetworking, setIsPausedNetworking] = useState(false)

  const foodColumn1 = [
    '/images/food-1.webp',
    '/images/food-2.webp',
    '/images/food-1.webp',
    '/images/food-2.webp',
  ]
  const foodColumn2 = [
    '/images/food-3.webp',
    '/images/food-1.webp',
    '/images/food-3.webp',
    '/images/food-1.webp',
  ]

  const networkingColumn1 = [
    '/images/networking-1.webp',
    '/images/networking-3.webp',
    '/images/networking-1.webp',
    '/images/networking-3.webp',
  ]
  const networkingColumn2 = [
    '/images/networking-2.webp',
    '/images/networking-4.webp',
    '/images/networking-2.webp',
    '/images/networking-4.webp',
  ]

  return (
    <section ref={ref} id="gallery" className="py-12 bg-[#080808] overflow-hidden" aria-label="Event gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: motionConfig.y }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
          className="text-center mb-10"
        >
          <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-2">What Awaits You</p>
          <h2 className="text-xl md:text-2xl font-light text-white font-serif gold-line">An Evening of Excellence</h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          
          {/* Left Side - Indulgent Dinner */}
          <div
            onMouseEnter={() => setIsPausedFood(true)}
            onMouseLeave={() => setIsPausedFood(false)}
            onTouchStart={() => setIsPausedFood(true)}
            onTouchEnd={() => setIsPausedFood(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: motionConfig.y }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
              className="text-center lg:text-left mb-4"
            >
              <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-1">Culinary Experience</p>
              <h3 className="text-lg font-light text-white font-serif">Indulgent Dinner</h3>
              <p className="text-white/30 text-xs mt-1">Savor the finest Arabian cuisine</p>
            </motion.div>

            <div className="relative h-[350px] sm:h-[400px] overflow-hidden rounded-xl">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#080808] to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />
              
              <div className="flex justify-center gap-3 h-full">
                <motion.div
                  className="flex flex-col gap-3"
                  animate={isPausedFood ? { y: 0 } : { y: [0, -600] }}
                  transition={{
                    y: { repeat: Infinity, repeatType: "loop", duration: 18, ease: "linear" }
                  }}
                >
                  {foodColumn1.map((src, index) => (
                    <motion.div 
                      key={index} 
                      className="relative w-32 sm:w-36 md:w-44 h-44 sm:h-48 md:h-56 rounded-xl overflow-hidden border border-amber-500/10 flex-shrink-0 group"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image src={src} alt={`Arabian cuisine dish ${index + 1}`} fill className="object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="flex flex-col gap-3"
                  animate={isPausedFood ? { y: -600 } : { y: [-600, 0] }}
                  transition={{
                    y: { repeat: Infinity, repeatType: "loop", duration: 22, ease: "linear" }
                  }}
                >
                  {foodColumn2.map((src, index) => (
                    <motion.div 
                      key={index} 
                      className="relative w-32 sm:w-36 md:w-44 h-52 sm:h-56 md:h-64 rounded-xl overflow-hidden border border-amber-500/10 flex-shrink-0 group"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image src={src} alt={`Arabian cuisine dish ${index + 1}`} fill className="object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Side - Networking */}
          <div
            onMouseEnter={() => setIsPausedNetworking(true)}
            onMouseLeave={() => setIsPausedNetworking(false)}
            onTouchStart={() => setIsPausedNetworking(true)}
            onTouchEnd={() => setIsPausedNetworking(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: motionConfig.y }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 0.1 }}
              className="text-center lg:text-left mb-4"
            >
              <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-1">Build Connections</p>
              <h3 className="text-lg font-light text-white font-serif">Networking</h3>
              <p className="text-white/30 text-xs mt-1">Connect with Riyadh&apos;s best minds</p>
            </motion.div>

            <div className="relative h-[350px] sm:h-[400px] overflow-hidden rounded-xl">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#080808] to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />
              
              <div className="flex justify-center gap-3 h-full">
                <motion.div
                  className="flex flex-col gap-3"
                  animate={isPausedNetworking ? { y: 0 } : { y: [0, -600] }}
                  transition={{
                    y: { repeat: Infinity, repeatType: "loop", duration: 20, ease: "linear" }
                  }}
                >
                  {networkingColumn1.map((src, index) => (
                    <motion.div 
                      key={index} 
                      className="relative w-32 sm:w-36 md:w-44 h-44 sm:h-48 md:h-56 rounded-xl overflow-hidden border border-amber-500/10 flex-shrink-0 group"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image src={src} alt={`Networking event photo ${index + 1}`} fill className="object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="flex flex-col gap-3"
                  animate={isPausedNetworking ? { y: -600 } : { y: [-600, 0] }}
                  transition={{
                    y: { repeat: Infinity, repeatType: "loop", duration: 25, ease: "linear" }
                  }}
                >
                  {networkingColumn2.map((src, index) => (
                    <motion.div 
                      key={index} 
                      className="relative w-32 sm:w-36 md:w-44 h-52 sm:h-56 md:h-64 rounded-xl overflow-hidden border border-amber-500/10 flex-shrink-0 group"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image src={src} alt={`Networking event photo ${index + 1}`} fill className="object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ============================================
// VIDEO SECTION WITH THUMBNAIL
// ============================================
function VideoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpenModal()
    }
  }

  return (
    <>
      <section ref={ref} id="video" className="py-12 bg-[#0a0a0a]" aria-label="Event highlights video">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: motionConfig.y }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
            className="text-center mb-6"
          >
            <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-2">Highlights</p>
            <h2 className="text-xl md:text-2xl font-light text-white font-serif gold-line">Last Year&apos;s Dubai Iftar</h2>
            <p className="text-white/30 text-xs mt-3">A glimpse into last year&apos;s Majlis experience</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: motionConfig.y }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 0.2 }}
            className="corner-decor p-2"
          >
            <div 
              className="relative aspect-video rounded-lg overflow-hidden border border-amber-500/10 bg-zinc-900 cursor-pointer group"
              onClick={handleOpenModal}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Play video highlights from Dubai Iftar event"
            >
              {/* Video Thumbnail */}
              <Image 
                src="/images/video-thumbnail.png" 
                alt="Video thumbnail - Dubai Iftar highlights" 
                fill 
                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="play-button w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-400/20 backdrop-blur-sm flex items-center justify-center border border-amber-400/30 group-hover:bg-amber-400/30 group-hover:border-amber-400/50 transition-all">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-wider group-hover:text-amber-400/60 transition-colors">Click to play</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={handleCloseModal}
            role="dialog"
            aria-modal="true"
            aria-label="Video player"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: motionConfig.ease }}
              className="relative w-full max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src="https://drive.google.com/file/d/1i86jP-JMFq4HtvsrmJUflx3mJEdTQoBa/preview"
                className="w-full h-full rounded-lg"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Dubai Iftar highlights video"
              />
              
              <button
                onClick={handleCloseModal}
                className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors p-2"
                aria-label="Close video"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// EVENT DETAILS
// ============================================
function EventDetails() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const details = [
    { icon: 'calendar', label: 'Date', value: 'March 2, 2026', subtext: 'Monday Evening' },
    { icon: 'clock', label: 'Time', value: '9:30 PM Onwards', subtext: 'Into the early hours' },
    { icon: 'location', label: 'Location', value: 'Riyadh', subtext: 'Venue details upon RSVP' },
  ]

  return (
    <section ref={ref} id="details" className="py-12 bg-[#0a0a0a]" aria-label="Event details">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: motionConfig.y }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
          className="text-center mb-8"
        >
          <p className="text-amber-400/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-2">Mark Your Calendar</p>
          <h2 className="text-xl md:text-2xl font-light text-white font-serif gold-line">Event Details</h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {details.map((detail, index) => (
            <motion.div
              key={detail.label}
              initial={{ opacity: 0, y: motionConfig.y }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: index * motionConfig.stagger }}
              whileHover={{ y: -4, borderColor: 'rgba(251, 191, 36, 0.25)' }}
              className="text-center p-3 sm:p-4 rounded-lg bg-[#0f0f0f] border border-amber-500/10 transition-all"
            >
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-full bg-amber-400/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(251, 191, 36, 0.2)' }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  {detail.icon === 'calendar' && <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  {detail.icon === 'clock' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {detail.icon === 'location' && <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
                </svg>
              </motion.div>
              <p className="text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-amber-400/50 mb-0.5">{detail.label}</p>
              <h3 className="text-sm sm:text-base font-normal text-white mb-0.5 font-serif">{detail.value}</h3>
              <p className="text-[9px] sm:text-[10px] text-white/30">{detail.subtext}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// REGISTRATION WITH SUCCESS MODAL
// ============================================
function Registration() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [formData, setFormData] = useState({ firstName: '', lastName: '', jobTitle: '', phone: '', email: '', country: '', organization: '', dietary: '', nationality: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSuccess(true)
    setFormData({ firstName: '', lastName: '', jobTitle: '', phone: '', email: '', country: '', organization: '', dietary: '', nationality: '' })
  }

  const inputClass = "w-full px-3 py-2 bg-[#151515] border border-white/10 rounded text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
  const labelClass = "block text-[9px] font-medium text-white/40 mb-1 uppercase tracking-wider"

  return (
    <>
      <section ref={ref} id="registration" className="py-12 bg-[#0a0a0a] pattern-bg" aria-label="Registration form">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: motionConfig.y }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
            className="text-center mb-8"
          >
            <motion.span 
              className="inline-block px-4 py-1.5 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 text-[9px] font-semibold uppercase tracking-wider mb-3"
              whileHover={{ scale: 1.05 }}
            >
              Limited Seats
            </motion.span>
            <h2 className="text-xl md:text-2xl font-light mb-1 text-white font-serif gold-line">
              <span className="highlight-text relative inline-block">
                Register
                <motion.span
                  initial={{ width: 0 }}
                  animate={isInView ? { width: '100%' } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="absolute bottom-0 left-0 h-[6px] bg-gradient-to-r from-amber-400/30 to-amber-500/30 -z-10"
                  aria-hidden="true"
                />
              </span>
              {' '}Now
            </h2>
            <div className="mt-3" />
            <p className="text-white/35 text-xs">Secure your place at this exclusive gathering</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: motionConfig.y }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: motionConfig.duration, ease: motionConfig.ease, delay: 0.2 }}
            className="corner-decor p-3"
          >
            <form onSubmit={handleSubmit} className="bg-[#0c0c0c] border border-amber-500/10 rounded-lg p-4 sm:p-5">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="firstName" className={labelClass}>First Name *</label>
                  <input type="text" id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="John" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelClass}>Last Name *</label>
                  <input type="text" id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Doe" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="jobTitle" className={labelClass}>Job Title *</label>
                  <input type="text" id="jobTitle" name="jobTitle" required value={formData.jobTitle} onChange={handleChange} className={inputClass} placeholder="Marketing Director" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone Number *</label>
                  <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+966 XXX XXX XXXX" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email Address *</label>
                  <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="john@company.com" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>Country *</label>
                  <select id="country" name="country" required value={formData.country} onChange={handleChange} className={inputClass} aria-required="true">
                    <option value="">Select country</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="BH">Bahrain</option>
                    <option value="KW">Kuwait</option>
                    <option value="OM">Oman</option>
                    <option value="QA">Qatar</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="organization" className={labelClass}>Organization *</label>
                  <input type="text" id="organization" name="organization" required value={formData.organization} onChange={handleChange} className={inputClass} placeholder="Company name" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="dietary" className={labelClass}>Dietary Requirements *</label>
                  <select id="dietary" name="dietary" required value={formData.dietary} onChange={handleChange} className={inputClass} aria-required="true">
                    <option value="">Select option</option>
                    <option value="none">No special requirements</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="gluten-free">Gluten-free</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="nationality" className={labelClass}>Nationality *</label>
                  <input type="text" id="nationality" name="nationality" required value={formData.nationality} onChange={handleChange} className={inputClass} placeholder="Your nationality" aria-required="true" />
                </div>
              </div>
              
              <div className="mt-5 text-center">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  className={`glow-button px-8 sm:px-10 py-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold uppercase tracking-wider rounded-full transition-all inline-flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''}`}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setIsSuccess(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f0f] border border-amber-500/20 rounded-lg p-6 sm:p-8 text-center max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 id="success-title" className="text-lg sm:text-xl font-serif text-white mb-2">Registration Complete!</h3>
              <p className="text-white/50 text-xs sm:text-sm mb-6">Thank you for registering. We&apos;ll send venue details to your email soon.</p>
              <motion.button 
                onClick={() => setIsSuccess(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-full text-xs sm:text-sm font-semibold transition-colors"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// FOOTER WITH WORKING LINKS
// ============================================
function Footer() {
  const quickLinks = [
    { name: 'About Event', href: '#about' },
    { name: 'Highlights', href: '#video' },
    { name: 'Register', href: '#registration' }
  ]
  
  const legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' }
  ]

  return (
    <footer className="bg-[#050505] border-t border-amber-500/10" role="contentinfo">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Links & Legal - Side by side on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6 text-center">
          <nav aria-label="Quick links">
            <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/35 text-xs hover:text-amber-400 transition-colors inline-flex items-center gap-1 group">
                    {link.name}
                    <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal links">
            <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-1.5">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/35 text-xs hover:text-amber-400 transition-colors inline-flex items-center gap-1 group">
                    {link.name}
                    <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Contact - Full width on mobile, third column on desktop */}
          <div className="col-span-2 md:col-span-1 mt-4 md:mt-0">
            <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-3">Contact</h4>
            <a href="tel:+971569100679" className="text-amber-400/80 text-xs hover:text-amber-400 transition-colors block mb-3" aria-label="Call us at +971 569 100 679">+971 569 100 679</a>
            <div className="flex gap-2 justify-center md:justify-center" role="list" aria-label="Social media links">
              {[
                { name: 'twitter', label: 'Follow us on Twitter' },
                { name: 'linkedin', label: 'Connect on LinkedIn' },
                { name: 'instagram', label: 'Follow us on Instagram' }
              ].map((social) => (
                <motion.a
                  key={social.name}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-amber-400/20 border border-white/10 hover:border-amber-400/30 flex items-center justify-center transition-all"
                  aria-label={social.label}
                  role="listitem"
                >
                  <svg className="w-3.5 h-3.5 text-white/40" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {social.name === 'twitter' && <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>}
                    {social.name === 'linkedin' && <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>}
                    {social.name === 'instagram' && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>}
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-amber-500/10 text-center">
          <p className="text-white/20 text-[10px]">© 2026 CleverTap. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// MAIN APP
// ============================================
export default function Home() {
  return (
    <main className="bg-[#0a0a0a] text-white antialiased">
      <LoadingScreen />
      <ScrollProgress />
      <BackToTop />
      <Header />
      <Hero />
      <Countdown />
      <About />
      <Gallery />
      <VideoSection />
      <EventDetails />
      <Registration />
      <Footer />
    </main>
  )
}
