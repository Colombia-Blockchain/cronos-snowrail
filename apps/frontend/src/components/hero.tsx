'use client';

import { useEffect, useState } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900 min-h-screen flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-400/50 rounded-full text-blue-300 text-sm font-semibold tracking-wider">
            CRONOS X402 TREASURY
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight">
          Snow Rail
        </h1>

        <p className="text-xl sm:text-2xl text-gray-300 mb-6 leading-relaxed">
          Autonomous Agentic Treasury powered by AI decision-making
        </p>

        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
          Intelligent asset management on Cronos blockchain with advanced agent orchestration
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
            Get Started
          </button>
          <button className="px-8 py-3 border border-blue-400 text-blue-300 font-semibold rounded-lg hover:bg-blue-500/10 transition-all duration-300">
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
            <p className="text-gray-400 text-sm">Autonomous</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">AI-Powered</div>
            <p className="text-gray-400 text-sm">Decision Making</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
            <p className="text-gray-400 text-sm">Active Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
