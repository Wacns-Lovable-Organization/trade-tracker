import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Categories() {
  const { data, addCategory, renameCategory, deleteCategory } = useApp();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAdd = () => {
    try {
      addCategory(newCategoryName);
      setNewCategoryName('');
      setIsAddDialogOpen(false);
      toast.success('Category created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add category');
    }
  };

  const handleRename = () => {
    if (!editingCategory) return;
    try {
      renameCategory(editingCategory.id, editingCategory.name);
      setEditingCategory(null);
      setIsEditDialogOpen(false);
      toast.success('Category renamed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rename category');
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteCategory(id);
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  const getCategoryUsageCount = (categoryId: string) => {
    return data.items.filter(i => i.defaultCategoryId === categoryId).length +
      data.inventoryEntries.filter(e => e.snapshotCategoryId === categoryId).length;
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your items into categories"
      >
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your items.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Blocks, Seeds, Consumables"
                className="mt-2"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newCategoryName.trim()}>
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-3">
        {data.categories.map((category, index) => {
          const usageCount = getCategoryUsageCount(category.id);
          const isOther = category.id === 'cat_other';

          return (
            <Card
              key={category.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isOther ? 'bg-muted' : 'bg-primary/10'
                    )}>
                      <Tag className={cn(
                        'w-4 h-4',
                        isOther ? 'text-muted-foreground' : 'text-primary'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {isOther && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-muted-foreground bg-muted rounded">
                            <Lock className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {usageCount} item{usageCount !== 1 ? 's' : ''} using this category
                      </span>
                    </div>
                  </div>

                  {!isOther && (
                    <div className="flex items-center gap-2">
                      <Dialog open={isEditDialogOpen && editingCategory?.id === category.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setEditingCategory(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rename Category</DialogTitle>
                            <DialogDescription>
                              Update the category name.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="edit-category-name">Category Name</Label>
                            <Input
                              id="edit-category-name"
                              value={editingCategory?.name || ''}
                              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="mt-2"
                              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleRename} disabled={!editingCategory?.name.trim()}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {usageCount > 0
                                ? `This category is used by ${usageCount} item(s). They will be reassigned to "Other".`
                                : 'This action cannot be undone.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(category.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.categories.length === 1 && (
        <div className="mt-8 text-center py-8 text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Only the default "Other" category exists.</p>
          <p className="text-sm">Create categories to better organize your inventory.</p>
        </div>
      )}
    </div>
  );
}
