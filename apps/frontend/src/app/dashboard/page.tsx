'use client';

import { CreateIntentForm } from '@/components/create-intent-form';
import { IntentList } from '@/components/intent-list';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Treasury Management
          </h1>
          <p className="text-gray-400 text-lg">
            Create and manage autonomous payment intents with AI-powered decision making
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <CreateIntentForm />
          </div>

          {/* Intent List Section */}
          <div className="lg:col-span-2">
            <IntentList />
          </div>
        </div>
      </div>
    </div>
  );
}
