'use client';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '🤖',
    title: 'AI-Powered Decisions',
    description: 'Advanced AI agents analyze market conditions and execute strategies autonomously',
  },
  {
    icon: '⚡',
    title: 'Real-time Execution',
    description: 'Instant transaction processing with sub-second decision latency',
  },
  {
    icon: '🔒',
    title: 'Secure & Auditable',
    description: 'All transactions signed and recorded on-chain for complete transparency',
  },
  {
    icon: '💎',
    title: 'Multi-Asset Support',
    description: 'Manage diverse crypto portfolios with intelligent rebalancing',
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Real-time dashboards with deep insights into treasury performance',
  },
  {
    icon: '🔄',
    title: 'Continuous Learning',
    description: 'AI agents improve strategies over time through reinforcement learning',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need for autonomous treasury management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
