'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Play, CheckCircle2, Clock, Loader2, ArrowRight, Zap, FileText, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; action?: { type: string; params: Record<string, string>; status: 'pending' | 'executing' | 'completed' }; }

const initialMessages: Message[] = [{ id: '1', role: 'assistant', content: "Hello! I'm your AI treasury agent. I can help you create payment intents, check conditions, execute payments, and manage settlements.", timestamp: new Date(Date.now() - 60000) }];
const mockTimeline = [
  { id: '1', title: 'Intent #42 Created', description: 'Payment intent for 250 TCRO', timestamp: new Date(Date.now() - 300000), status: 'success' },
  { id: '2', title: 'Condition Evaluated', description: 'Price threshold check passed', timestamp: new Date(Date.now() - 240000), status: 'success' },
  { id: '3', title: 'Payment Executed', description: 'Transaction submitted', timestamp: new Date(Date.now() - 180000), status: 'success', txHash: '0xabcd...1234' },
];
const mockActivity = [
  { id: '1', text: 'Connected to Cronos Testnet', time: '2 min ago' },
  { id: '2', text: 'Intent #42 conditions met', time: '5 min ago' },
  { id: '3', text: 'Payment executed: 250 TCRO', time: '5 min ago' },
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const hasAction = input.toLowerCase().includes('create') || input.toLowerCase().includes('payment');
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: hasAction ? "I'll create a payment intent for you:" : 'I understand. What would you like to do?', timestamp: new Date(), action: hasAction ? { type: 'create_intent', params: { amount: '100', currency: 'TCRO', recipient: '0x1234...5678' }, status: 'pending' } : undefined };
    setMessages((prev) => [...prev, assistantMessage]);
    if (hasAction) setPendingAction(assistantMessage.action!);
    setIsLoading(false);
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    setPendingAction({ ...pendingAction, status: 'executing' });
    await new Promise((r) => setTimeout(r, 2000));
    setPendingAction({ ...pendingAction, status: 'completed' });
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Action completed successfully!', timestamp: new Date() }]);
    setTimeout(() => setPendingAction(null), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Bot className="h-5 w-5 text-white" /></div>
                <div><CardTitle>Treasury Agent</CardTitle><CardDescription className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Online</CardDescription></div>
              </div>
              <Badge variant="info">x402 Enabled</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}>
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', message.role === 'assistant' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-secondary')}>
                        {message.role === 'assistant' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2', message.role === 'assistant' ? 'bg-secondary/50' : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20')}>
                        <p className="text-sm">{message.content}</p>
                        {message.action && (
                          <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border">
                            <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-cyan-400" /><span className="text-xs font-medium text-cyan-400">Action: {message.action.type}</span></div>
                            <div className="space-y-1 text-xs text-muted-foreground">{Object.entries(message.action.params).map(([key, value]) => (<div key={key} className="flex justify-between"><span className="capitalize">{key}:</span><span className="font-mono">{value}</span></div>))}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div><div className="bg-secondary/50 rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-cyan-400" /></div></motion.div>)}
              </div>
            </ScrollArea>
            <AnimatePresence>
              {pendingAction && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', pendingAction.status === 'pending' && 'bg-amber-500/20', pendingAction.status === 'executing' && 'bg-blue-500/20', pendingAction.status === 'completed' && 'bg-emerald-500/20')}>
                        {pendingAction.status === 'pending' && <Play className="h-5 w-5 text-amber-500" />}
                        {pendingAction.status === 'executing' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                        {pendingAction.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      </div>
                      <div><p className="text-sm font-medium">{pendingAction.status === 'pending' ? 'Action Ready' : pendingAction.status === 'executing' ? 'Executing...' : 'Completed'}</p></div>
                    </div>
                    {pendingAction.status === 'pending' && <Button onClick={executeAction} size="sm" variant="glow">Execute<ArrowRight className="h-4 w-4 ml-1" /></Button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Textarea placeholder="Ask the agent..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="min-h-[44px] max-h-32 resize-none" rows={1} />
                <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
          <TabsContent value="timeline" className="flex-1 mt-4">
            <Card className="h-full"><CardHeader><CardTitle className="text-base">Execution Timeline</CardTitle></CardHeader><CardContent>
              <div className="relative space-y-4"><div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                {mockTimeline.map((event) => (<div key={event.id} className="relative pl-10"><div className="absolute left-2 h-5 w-5 rounded-full flex items-center justify-center bg-emerald-500/20"><CheckCircle2 className="h-3 w-3 text-emerald-500" /></div><div className="bg-secondary/30 rounded-lg p-3"><p className="text-sm font-medium">{event.title}</p><p className="text-xs text-muted-foreground mt-0.5">{event.description}</p></div></div>))}
              </div>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="activity" className="flex-1 mt-4">
            <Card className="h-full"><CardHeader><CardTitle className="text-base">Activity Feed</CardTitle></CardHeader><CardContent>
              <div className="space-y-3">{mockActivity.map((item) => (<div key={item.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0"><div className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" /><div><p className="text-sm">{item.text}</p><p className="text-xs text-muted-foreground">{item.time}</p></div></div>))}</div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
        <Card><CardContent className="p-4"><div className="grid grid-cols-2 gap-4">
          <div className="text-center"><div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2"><FileText className="h-5 w-5 text-cyan-400" /></div><p className="text-2xl font-bold">24</p><p className="text-xs text-muted-foreground">Active Intents</p></div>
          <div className="text-center"><div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2"><Wallet className="h-5 w-5 text-emerald-400" /></div><p className="text-2xl font-bold">12.4K</p><p className="text-xs text-muted-foreground">TCRO Processed</p></div>
        </div></CardContent></Card>
      </div>
    </div>
  );
}
