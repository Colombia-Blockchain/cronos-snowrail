'use client';

import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-900/50 via-gray-900 to-cyan-900/50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
          Ready to automate your treasury?
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join the future of autonomous finance with Snow Rail. Deploy your treasury AI today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard">
            <button className="px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 text-lg">
              Launch App
            </button>
          </Link>
          <button className="px-10 py-4 border-2 border-blue-400 text-blue-300 font-bold rounded-lg hover:bg-blue-500/10 transition-all duration-300 text-lg">
            View Docs
          </button>
        </div>

        <p className="mt-12 text-gray-400 text-sm">
          No credit card required • Deploy in minutes • 24/7 support
        </p>
      </div>
    </section>
  );
}
