import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Trophy, Calendar, Target, Pencil, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Goal } from '@/hooks/useGoals';
import { useState } from 'react';

interface GoalCardProps {
  goal: Goal;
  onUpdate: (id: string, updates: Partial<Goal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
}

export function GoalCard({ goal, onUpdate, onDelete, onComplete }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal.current_value.toString());

  const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;

  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSaveProgress = async () => {
    const val = parseFloat(editValue) || 0;
    await onUpdate(goal.id, { current_value: val } as any);
    setIsEditing(false);
  };

  const goalTypeLabels: Record<string, string> = {
    profit: 'Profit',
    sales_count: 'Sales',
    inventory_value: 'Inventory',
    custom: 'Custom',
  };

  return (
    <Card className={goal.is_completed ? 'border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {goal.is_completed ? (
                <Trophy className="w-4 h-4 text-[hsl(var(--success))]" />
              ) : (
                <Target className="w-4 h-4 text-primary" />
              )}
              <h3 className="font-semibold truncate">{goal.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {goalTypeLabels[goal.goal_type] || goal.goal_type}
              </Badge>
              <Badge variant="outline" className="text-xs">{goal.currency_unit}</Badge>
              {goal.is_completed && (
                <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-xs">
                  Completed! 🎉
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {!goal.is_completed && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(!isEditing)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this goal.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(goal.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono font-medium">
              {goal.current_value} / {goal.target_value} {goal.currency_unit}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}% complete</span>
            {daysRemaining !== null && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining === 0 ? 'Due today' : 'Overdue'}
              </span>
            )}
          </div>
        </div>

        {isEditing && !goal.is_completed && (
          <div className="flex gap-2 items-center pt-1">
            <Input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 flex-1"
              placeholder="Current value"
            />
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSaveProgress}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!goal.is_completed && progress >= 100 && (
          <Button size="sm" className="w-full gap-2" onClick={() => onComplete(goal.id)}>
            <Trophy className="w-4 h-4" />
            Mark as Completed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
