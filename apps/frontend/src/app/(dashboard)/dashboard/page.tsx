'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, TrendingUp, Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const stats = [
  { title: 'Treasury Balance', value: '12,450.00', currency: 'TCRO', change: '+12.5%', trend: 'up', icon: Wallet },
  { title: 'Active Intents', value: '24', change: '+3', trend: 'up', icon: Activity },
  { title: 'Total Settled', value: '156,230.50', currency: 'TCRO', change: '+8.2%', trend: 'up', icon: TrendingUp },
  { title: 'Pending', value: '7', change: '-2', trend: 'down', icon: Clock },
];

const recentActivity = [
  { id: 1, description: 'Payment to 0x1234...5678', amount: '250.00 TCRO', time: '2 min ago', status: 'success' },
  { id: 2, description: 'Intent #42 awaiting conditions', amount: '1,500.00 TCRO', time: '15 min ago', status: 'pending' },
  { id: 3, description: 'Settlement batch #12', amount: '5,230.00 TCRO', time: '1 hour ago', status: 'success' },
  { id: 4, description: 'Payment to 0xabcd...efgh', amount: '100.00 TCRO', time: '2 hours ago', status: 'failed' },
];

export default function DashboardPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  {stat.currency && <span className="text-sm text-muted-foreground">{stat.currency}</span>}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                  <span className={cn('text-xs font-medium', stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500')}>{stat.change}</span>
                  <span className="text-xs text-muted-foreground">vs last week</span>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50" />
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-400" />Agent Status</CardTitle>
                <CardDescription>AI-powered treasury automation</CardDescription>
              </div>
              <Badge variant="success" className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-sm text-muted-foreground">Intents Processed</p><p className="text-2xl font-bold">1,247</p></div>
              <div><p className="text-sm text-muted-foreground">Success Rate</p><p className="text-2xl font-bold text-emerald-400">98.5%</p></div>
              <div><p className="text-sm text-muted-foreground">Avg Response</p><p className="text-2xl font-bold">1.2s</p></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Daily Limit Usage</span><span className="font-medium">67%</span></div>
              <Progress value={67} />
            </div>
            <div className="flex gap-3">
              <Button asChild className="flex-1"><Link href="/agent">Open Console</Link></Button>
              <Button variant="outline" asChild><Link href="/intents">View Intents</Link></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest treasury operations</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className={cn('mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0', activity.status === 'success' && 'bg-emerald-500/20', activity.status === 'pending' && 'bg-amber-500/20', activity.status === 'failed' && 'bg-red-500/20')}>
                    {activity.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {activity.status === 'pending' && <Clock className="h-4 w-4 text-amber-500" />}
                    {activity.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <span className="text-xs font-medium text-cyan-400">{activity.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle><CardDescription>Common treasury operations</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild><Link href="/intents"><Activity className="h-5 w-5 text-cyan-400" /><span>Create Intent</span></Link></Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild><Link href="/agent"><Zap className="h-5 w-5 text-cyan-400" /><span>Agent Chat</span></Link></Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild><Link href="/settlement"><TrendingUp className="h-5 w-5 text-cyan-400" /><span>View Settlements</span></Link></Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2"><Wallet className="h-5 w-5 text-cyan-400" /><span>Deposit Funds</span></Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
