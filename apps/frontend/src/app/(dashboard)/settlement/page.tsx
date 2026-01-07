'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, CheckCircle2, Clock, AlertCircle, ExternalLink, Filter, Download, TrendingUp, Wallet, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatAddress } from '@/lib/utils';
import { toast } from 'sonner';

interface Settlement { id: string; batchId: string; totalAmount: string; currency: string; intentsCount: number; status: 'pending' | 'processing' | 'completed' | 'failed'; txHash?: string; createdAt: string; gasUsed?: string; }

const mockSettlements: Settlement[] = [
  { id: 'SET-001', batchId: 'BATCH-2024-001', totalAmount: '5,230.00', currency: 'TCRO', intentsCount: 12, status: 'completed', txHash: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef12345678', createdAt: '2024-01-15T10:00:00Z', gasUsed: '0.045' },
  { id: 'SET-002', batchId: 'BATCH-2024-002', totalAmount: '1,850.00', currency: 'TCRO', intentsCount: 5, status: 'processing', txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', createdAt: '2024-01-15T14:30:00Z' },
  { id: 'SET-003', batchId: 'BATCH-2024-003', totalAmount: '3,120.00', currency: 'TCRO', intentsCount: 8, status: 'pending', createdAt: '2024-01-15T15:45:00Z' },
  { id: 'SET-004', batchId: 'BATCH-2024-004', totalAmount: '750.00', currency: 'TCRO', intentsCount: 3, status: 'failed', createdAt: '2024-01-14T09:15:00Z' },
];

export default function SettlementPage() {
  const [settlements] = useState<Settlement[]>(mockSettlements);
  const [activeTab, setActiveTab] = useState('all');
  const filteredSettlements = activeTab === 'all' ? settlements : settlements.filter((s) => s.status === activeTab);
  const stats = {
    totalSettled: settlements.filter((s) => s.status === 'completed').reduce((acc, s) => acc + parseFloat(s.totalAmount.replace(',', '')), 0),
    pendingAmount: settlements.filter((s) => s.status === 'pending' || s.status === 'processing').reduce((acc, s) => acc + parseFloat(s.totalAmount.replace(',', '')), 0),
    totalBatches: settlements.length,
    successRate: (settlements.filter((s) => s.status === 'completed').length / settlements.length) * 100,
  };
  const handleRetry = (settlementId: string) => { toast.info('Retrying settlement...', { description: `Settlement ${settlementId} is being reprocessed` }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div><h1 className="text-2xl font-bold">Settlement</h1><p className="text-muted-foreground">Track and manage batch settlements</p></div>
        <div className="flex gap-2"><Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button><Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-emerald-400" /></div><div><p className="text-sm text-muted-foreground">Total Settled</p><p className="text-2xl font-bold">{stats.totalSettled.toLocaleString()}</p><p className="text-xs text-muted-foreground">TCRO</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center"><Clock className="h-6 w-6 text-amber-400" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{stats.pendingAmount.toLocaleString()}</p><p className="text-xs text-muted-foreground">TCRO</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center"><ArrowLeftRight className="h-6 w-6 text-cyan-400" /></div><div><p className="text-sm text-muted-foreground">Total Batches</p><p className="text-2xl font-bold">{stats.totalBatches}</p><p className="text-xs text-muted-foreground">Processed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-blue-400" /></div><div><p className="text-sm text-muted-foreground">Success Rate</p><p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p><Progress value={stats.successRate} className="w-24 h-1 mt-1" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><CardTitle>Settlement Batches</CardTitle><CardDescription>View and manage settlement transactions</CardDescription></div>
            <Tabs value={activeTab} onValueChange={setActiveTab}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pending">Pending</TabsTrigger><TabsTrigger value="processing">Processing</TabsTrigger><TabsTrigger value="completed">Completed</TabsTrigger><TabsTrigger value="failed">Failed</TabsTrigger></TabsList></Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {filteredSettlements.map((settlement) => (
              <div key={settlement.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', settlement.status === 'completed' && 'bg-emerald-500/20', settlement.status === 'processing' && 'bg-blue-500/20', settlement.status === 'pending' && 'bg-amber-500/20', settlement.status === 'failed' && 'bg-red-500/20')}>
                    {settlement.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {settlement.status === 'processing' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                    {settlement.status === 'pending' && <Clock className="h-5 w-5 text-amber-500" />}
                    {settlement.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-sm font-medium">{settlement.batchId}</span><Badge variant={settlement.status === 'completed' ? 'success' : settlement.status === 'processing' ? 'info' : settlement.status === 'pending' ? 'warning' : 'destructive'}>{settlement.status}</Badge></div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground"><span>{settlement.intentsCount} intents</span><span>{new Date(settlement.createdAt).toLocaleString()}</span></div>
                    {settlement.txHash && <div className="flex items-center gap-2 mt-1"><span className="text-xs font-mono text-cyan-400">{formatAddress(settlement.txHash)}</span><Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button></div>}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right"><p className="text-lg font-bold">{settlement.totalAmount}</p><p className="text-xs text-muted-foreground">{settlement.currency}</p></div>
                  {settlement.gasUsed && <div className="text-right hidden sm:block"><p className="text-sm font-medium">{settlement.gasUsed}</p><p className="text-xs text-muted-foreground">Gas (TCRO)</p></div>}
                  {settlement.status === 'failed' && <Button size="sm" variant="outline" onClick={() => handleRetry(settlement.id)}><RefreshCw className="h-4 w-4 mr-1" />Retry</Button>}
                  {settlement.status === 'completed' && settlement.txHash && <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4 mr-1" />Explorer</Button>}
                </div>
              </div>
            ))}
            {filteredSettlements.length === 0 && <div className="text-center py-12"><Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No settlements found</p></div>}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
