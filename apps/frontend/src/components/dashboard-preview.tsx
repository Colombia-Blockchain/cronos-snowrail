'use client';

import { useEffect, useState } from 'react';

interface DashboardCard {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function DashboardPreview() {
  const [cards, setCards] = useState<DashboardCard[]>([
    { label: 'Total Assets', value: '$2.5M', change: '+12.5%', isPositive: true },
    { label: 'AI Decisions Today', value: '847', change: '+23%', isPositive: true },
    { label: 'Success Rate', value: '94.2%', change: '+2.1%', isPositive: true },
    { label: 'Gas Optimized', value: '$12.3K', change: '-45%', isPositive: true },
  ]);

  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    setAnimateCards(true);
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 to-blue-900/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Live Treasury Dashboard
          </h2>
          <p className="text-xl text-gray-400">
            Real-time metrics and AI-powered insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`p-6 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700 rounded-lg transition-all duration-500 ${
                animateCards ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <p className="text-gray-400 text-sm mb-2">{card.label}</p>
              <p className="text-3xl font-bold text-white mb-3">{card.value}</p>
              <p className={`text-sm font-semibold ${card.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {card.change} from last 24h
              </p>
            </div>
          ))}
        </div>

        {/* Chart Preview */}
        <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-6">Performance Chart</h3>
          <div className="h-64 flex items-end justify-around gap-2 bg-gradient-to-t from-blue-500/10 to-transparent rounded p-4">
            {[60, 75, 45, 85, 65, 95, 70, 80].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
