import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface CreateGoalDialogProps {
  onCreateGoal: (goal: {
    goal_type: string;
    target_value: number;
    currency_unit: string;
    title: string;
    deadline?: string | null;
  }) => Promise<void>;
}

export function CreateGoalDialog({ onCreateGoal }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState('profit');
  const [targetValue, setTargetValue] = useState('');
  const [currencyUnit, setCurrencyUnit] = useState('WL');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;

    await onCreateGoal({
      goal_type: goalType,
      target_value: parseFloat(targetValue),
      currency_unit: currencyUnit,
      title: title.trim(),
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });

    setTitle('');
    setGoalType('profit');
    setTargetValue('');
    setCurrencyUnit('WL');
    setDeadline('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Goal Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Reach 100 DL profit" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit Target</SelectItem>
                  <SelectItem value="sales_count">Sales Count</SelectItem>
                  <SelectItem value="inventory_value">Inventory Value</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currencyUnit} onValueChange={setCurrencyUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WL">WL</SelectItem>
                  <SelectItem value="DL">DL</SelectItem>
                  <SelectItem value="BGL">BGL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Value *</Label>
              <Input type="number" step="0.01" min="0" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="100" required />
            </div>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full">Create Goal</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
