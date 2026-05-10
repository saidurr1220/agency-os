"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Calendar,
  Smile,
  Meh,
  Frown,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppStore } from '@/store';
import { formatDate } from '@/lib/utils';

const journalSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  completedItems: z.string(),
  blockers: z.string(),
  tomorrowPlan: z.string(),
  mood: z.number().min(1).max(5).optional(),
});

type JournalFormData = z.infer<typeof journalSchema>;

const moodIcons = [
  { value: 1, icon: Frown, label: 'Terrible', color: 'text-red-500' },
  { value: 2, icon: Frown, label: 'Bad', color: 'text-orange-500' },
  { value: 3, icon: Meh, label: 'Okay', color: 'text-yellow-500' },
  { value: 4, icon: Smile, label: 'Good', color: 'text-green-500' },
  { value: 5, icon: Star, label: 'Excellent', color: 'text-purple-500' },
];

export default function JournalPage() {
  const { journals, addJournal } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number>(3);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
  });

  const onSubmit = (data: JournalFormData) => {
    addJournal({
      userId: '1',
      companyId: '1',
      date: new Date(),
      summary: data.summary,
      completedItems: data.completedItems.split('\n').filter(Boolean),
      blockers: data.blockers.split('\n').filter(Boolean),
      tomorrowPlan: data.tomorrowPlan.split('\n').filter(Boolean),
      mood: selectedMood,
      productivityScore: Math.floor(Math.random() * 30) + 70,
    });
    reset();
    setShowForm(false);
  };

  const sortedJournals = [...journals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Work Journal</h2>
            <p className="text-muted-foreground">
              Track your daily progress and reflections
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {sortedJournals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No journal entries yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Start documenting your daily work progress
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Write First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedJournals.map((journal, index) => (
                <motion.div
                  key={journal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">
                              {formatDate(journal.date)}
                            </h3>
                            {journal.mood && (
                              <Badge variant="secondary">
                                {moodIcons.find((m) => m.value === journal.mood)?.label}
                              </Badge>
                            )}
                            {journal.productivityScore && (
                              <Badge variant="outline">
                                {journal.productivityScore}% productive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(journal.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <p className="text-sm mb-4">{journal.summary}</p>

                      <div className="grid md:grid-cols-3 gap-4">
                        {journal.completedItems.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-medium text-green-600">Completed</span>
                            </div>
                            <ul className="space-y-1">
                              {journal.completedItems.slice(0, 3).map((item, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="mt-1 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                  {item}
                                </li>
                              ))}
                              {journal.completedItems.length > 3 && (
                                <li className="text-xs text-muted-foreground">
                                  +{journal.completedItems.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {journal.blockers.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-medium text-red-600">Blockers</span>
                            </div>
                            <ul className="space-y-1">
                              {journal.blockers.slice(0, 2).map((item, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="mt-1 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {journal.tomorrowPlan.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-medium text-blue-600">Tomorrow</span>
                            </div>
                            <ul className="space-y-1">
                              {journal.tomorrowPlan.slice(0, 2).map((item, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="mt-1 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Daily Work Journal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>How are you feeling today?</Label>
              <div className="flex gap-3">
                {moodIcons.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedMood === mood.value
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent hover:bg-accent'
                    }`}
                  >
                    <mood.icon className={`w-6 h-6 ${mood.color}`} />
                    <span className="text-[10px] mt-1 block">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Today&apos;s Summary</Label>
              <Textarea
                id="summary"
                placeholder="What did you work on today?"
                {...register('summary')}
                rows={3}
              />
              {errors.summary && (
                <p className="text-xs text-red-500">{errors.summary.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="completedItems">Completed Items</Label>
              <Textarea
                id="completedItems"
                placeholder="One item per line..."
                {...register('completedItems')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blockers">Blockers / Issues</Label>
              <Textarea
                id="blockers"
                placeholder="Any blockers or issues..."
                {...register('blockers')}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tomorrowPlan">Tomorrow&apos;s Plan</Label>
              <Textarea
                id="tomorrowPlan"
                placeholder="What&apos;s planned for tomorrow..."
                {...register('tomorrowPlan')}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
