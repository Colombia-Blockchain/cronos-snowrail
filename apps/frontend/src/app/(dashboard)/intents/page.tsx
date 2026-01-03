'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, Play, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, formatAddress } from '@/lib/utils';
import { toast } from 'sonner';

interface Intent { id: string; amount: string; currency: string; recipient: string; condition: { type: string; value: string }; status: 'pending' | 'executed' | 'failed'; createdAt: string; }

const mockIntents: Intent[] = [
  { id: 'INT-001', amount: '250.00', currency: 'TCRO', recipient: '0x1234567890abcdef1234567890abcdef12345678', condition: { type: 'manual', value: 'Manual trigger' }, status: 'pending', createdAt: '2024-01-15T10:30:00Z' },
  { id: 'INT-002', amount: '1,500.00', currency: 'TCRO', recipient: '0xabcdef1234567890abcdef1234567890abcdef12', condition: { type: 'price-below', value: 'CRO < $0.15' }, status: 'executed', createdAt: '2024-01-14T15:45:00Z' },
  { id: 'INT-003', amount: '500.00', currency: 'TCRO', recipient: '0xfedcba9876543210fedcba9876543210fedcba98', condition: { type: 'time-based', value: 'Every Monday 9:00 AM' }, status: 'pending', createdAt: '2024-01-13T09:00:00Z' },
  { id: 'INT-004', amount: '100.00', currency: 'TCRO', recipient: '0x0987654321fedcba0987654321fedcba09876543', condition: { type: 'manual', value: 'Manual trigger' }, status: 'failed', createdAt: '2024-01-12T14:20:00Z' },
];

export default function IntentsPage() {
  const [intents] = useState<Intent[]>(mockIntents);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', currency: 'TCRO', recipient: '', conditionType: 'manual', conditionValue: '' });

  const filteredIntents = intents.filter((intent) => intent.id.toLowerCase().includes(searchQuery.toLowerCase()) || intent.recipient.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateIntent = () => { toast.success('Intent created successfully'); setCreateDialogOpen(false); setFormData({ amount: '', currency: 'TCRO', recipient: '', conditionType: 'manual', conditionValue: '' }); };
  const handleTrigger = (intentId: string) => { toast.info('Triggering intent...', { description: `Intent ${intentId} is being processed` }); };
  const handleCopyAddress = (address: string) => { navigator.clipboard.writeText(address); toast.success('Address copied'); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div><h1 className="text-2xl font-bold">Payment Intents</h1><p className="text-muted-foreground">Manage and monitor your payment intents</p></div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild><Button variant="glow"><Plus className="h-4 w-4 mr-2" />Create Intent</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Payment Intent</DialogTitle><DialogDescription>Set up a new payment intent with conditions.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4"><div className="col-span-2"><label className="text-sm font-medium mb-2 block">Amount</label><Input placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div><div><label className="text-sm font-medium mb-2 block">Currency</label><Input value={formData.currency} disabled /></div></div>
              <div><label className="text-sm font-medium mb-2 block">Recipient Address</label><Input placeholder="0x..." value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-2 block">Condition Type</label><select className="w-full h-10 rounded-lg border border-border bg-background/50 px-3 text-sm" value={formData.conditionType} onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}><option value="manual">Manual Trigger</option><option value="price-below">Price Below</option><option value="time-based">Time Based</option></select></div>
              {formData.conditionType !== 'manual' && <div><label className="text-sm font-medium mb-2 block">Condition Value</label><Input placeholder="Condition value..." value={formData.conditionValue} onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })} /></div>}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateIntent}>Create Intent</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center"><Clock className="h-5 w-5 text-blue-400" /></div><div><p className="text-2xl font-bold">{intents.filter((i) => i.status === 'pending').length}</p><p className="text-sm text-muted-foreground">Pending</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div><div><p className="text-2xl font-bold">{intents.filter((i) => i.status === 'executed').length}</p><p className="text-sm text-muted-foreground">Executed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-400" /></div><div><p className="text-2xl font-bold">{intents.filter((i) => i.status === 'failed').length}</p><p className="text-sm text-muted-foreground">Failed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center"><span className="text-cyan-400 font-bold text-sm">$</span></div><div><p className="text-2xl font-bold">2,350</p><p className="text-sm text-muted-foreground">Total TCRO</p></div></div></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6"><div className="flex flex-col sm:flex-row gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by ID or recipient..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div><Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filters</Button></div></CardContent></Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {filteredIntents.map((intent) => (
          <Card key={intent.id} className="hover:border-cyan-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', intent.status === 'pending' && 'bg-amber-500/20', intent.status === 'executed' && 'bg-emerald-500/20', intent.status === 'failed' && 'bg-red-500/20')}>
                    {intent.status === 'pending' && <Clock className="h-5 w-5 text-amber-500" />}
                    {intent.status === 'executed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {intent.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-sm font-medium">{intent.id}</span><Badge variant={intent.status === 'executed' ? 'success' : intent.status === 'pending' ? 'warning' : 'destructive'}>{intent.status}</Badge></div>
                    <p className="text-sm text-muted-foreground mt-1">To: {formatAddress(intent.recipient)}</p>
                    <div className="flex items-center gap-2 mt-1"><Badge variant="outline" className="text-xs">{intent.condition.type}</Badge><span className="text-xs text-muted-foreground">{intent.condition.value}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-right"><p className="text-lg font-bold">{intent.amount}</p><p className="text-xs text-muted-foreground">{intent.currency}</p></div>
                  <div className="flex items-center gap-2">
                    {intent.status === 'pending' && <Button size="sm" variant="outline" onClick={() => handleTrigger(intent.id)}><Play className="h-4 w-4 mr-1" />Trigger</Button>}
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleCopyAddress(intent.recipient)}><Copy className="h-4 w-4 mr-2" />Copy Address</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete Intent</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
