"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Wifi, 
  Shield, 
  Clock, 
  MapPin, 
  ChevronRight,
  ChevronDown,
  Smartphone,
  Globe,
  Zap
} from "lucide-react";

const floatingIcons = [
  { Icon: Wifi, delay: 0, x: "10%", y: "20%" },
  { Icon: Globe, delay: 0.5, x: "85%", y: "15%" },
  { Icon: Smartphone, delay: 1, x: "80%", y: "70%" },
  { Icon: Zap, delay: 1.5, x: "15%", y: "75%" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
        {/* Hero Illustration - Phone Mockup */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <svg className="w-[800px] h-[800px]" viewBox="0 0 400 400" fill="none">
            <rect x="120" y="40" width="160" height="320" rx="20" stroke="white" strokeWidth="2"/>
            <rect x="140" y="80" width="120" height="200" rx="4" stroke="white" strokeWidth="1.5"/>
            <circle cx="200" cy="320" r="8" stroke="white" strokeWidth="1.5"/>
            <rect x="170" y="50" width="60" height="6" rx="3" stroke="white" strokeWidth="1"/>
            <rect x="160" y="100" width="80" height="40" rx="4" stroke="white" strokeWidth="1"/>
            <rect x="160" y="155" width="50" height="6" rx="3" stroke="white" strokeWidth="1"/>
            <rect x="160" y="170" width="80" height="6" rx="3" stroke="white" strokeWidth="1"/>
            <rect x="160" y="185" width="60" height="6" rx="3" stroke="white" strokeWidth="1"/>
            <rect x="160" y="210" width="80" height="30" rx="4" stroke="white" strokeWidth="1"/>
            <path d="M180 225 L190 225 L195 220 L205 230 L215 215" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute hidden lg:block"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.3, 
            scale: 1,
            y: [0, -20, 0],
          }}
          transition={{
            opacity: { delay: delay + 0.5, duration: 0.5 },
            scale: { delay: delay + 0.5, duration: 0.5 },
            y: {
              delay: delay + 1,
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <Icon className="w-12 h-12 text-white/40" strokeWidth={1} />
        </motion.div>
      ))}

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
          >
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-white/90 text-sm font-medium">
              Kominfo Licensed &bull; Trusted by Tourists Since 2020
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Stay Connected in{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
              Paradise
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Instant eSIM & SIM cards from Rp 150K. Seamless connectivity from the moment you land in Bali.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              href={"/products" as any}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105"
            >
              View Plans
              <span className="text-sm font-normal text-blue-500 ml-1">from Rp 150K</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300"
            >
              How It Works
            </Link>
          </motion.div>

          {/* Trust Indicators - Accurate & Verifiable */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
          >
            <TrustIndicator 
              icon={Shield} 
              label="Kominfo Licensed" 
              sublabel="Official Provider"
            />
            <TrustIndicator 
              icon={Clock} 
              label="5-Min Setup" 
              sublabel="Instant Activation"
            />
            <TrustIndicator 
              icon={MapPin} 
              label="Airport Pickup" 
              sublabel="Ngurah Rai Terminal"
            />
            <TrustIndicator 
              icon={Wifi} 
              label="24/7 Support" 
              sublabel="WhatsApp Available"
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 cursor-pointer"
        onClick={() => {
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>

      {/* Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20"></div>
    </section>
  );
}

function TrustIndicator({ 
  icon: Icon, 
  label, 
  sublabel 
}: { 
  icon: typeof Shield; 
  label: string; 
  sublabel: string;
}) {
  return (
    <div className="flex items-center gap-3 text-white/90">
      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-white/60">{sublabel}</p>
      </div>
    </div>
  );
}
