'use client';

export function DashboardPreview() {
  return (
    <section className="py-24 bg-surface-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh-gradient-dark pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Three simple steps to autonomous treasury management
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="01"
            title="Create Intent"
            description="Define payment conditions like price thresholds, time triggers, or manual approval."
            icon={<CreateIcon />}
          />
          <StepCard
            number="02"
            title="Fund Intent"
            description="Deposit the payment amount. Your funds stay secure until conditions are met."
            icon={<FundIcon />}
          />
          <StepCard
            number="03"
            title="Auto Execute"
            description="AI agents monitor conditions and execute payments when criteria are satisfied."
            icon={<ExecuteIcon />}
          />
        </div>

        {/* Visual Flow */}
        <div className="mt-16 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent hidden md:block" />

          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <FlowNode label="Deposit" active />
            <FlowConnector />
            <FlowNode label="Conditions Met" />
            <FlowConnector />
            <FlowNode label="Payment Sent" />
          </div>
        </div>
      </div>
    </section>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
      {/* Number badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-brand-500 text-white text-sm font-semibold flex items-center justify-center">
        {number}
      </div>

      <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 text-brand-400">
        {icon}
      </div>

      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function FlowNode({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        w-4 h-4 rounded-full
        ${active ? 'bg-brand-400 shadow-lg shadow-brand-400/50' : 'bg-white/10 border border-white/20'}
      `} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="hidden md:flex items-center flex-1 px-4">
      <div className="h-px flex-1 bg-white/10" />
      <svg className="w-3 h-3 text-white/20 mx-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function CreateIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function FundIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function ExecuteIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
