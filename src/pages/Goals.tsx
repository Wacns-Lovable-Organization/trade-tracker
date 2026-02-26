import { PageHeader } from '@/components/ui/PageHeader';
import { useGoals } from '@/hooks/useGoals';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Goals() {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal, completeGoal } = useGoals();

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <div>
      <PageHeader title="Goals & Milestones" description="Set targets and track your progress">
        <CreateGoalDialog onCreateGoal={addGoal} />
      </PageHeader>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-muted-foreground mb-4">Create your first goal to start tracking your progress.</p>
          <CreateGoalDialog onCreateGoal={addGoal} />
        </div>
      ) : (
        <Tabs defaultValue="active" className="mt-4">
          <TabsList>
            <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} onComplete={completeGoal} />
              ))}
            </div>
            {activeGoals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">All goals completed! 🎉</div>
            )}
          </TabsContent>
          <TabsContent value="completed">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {completedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} onComplete={completeGoal} />
              ))}
            </div>
            {completedGoals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No completed goals yet.</div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
