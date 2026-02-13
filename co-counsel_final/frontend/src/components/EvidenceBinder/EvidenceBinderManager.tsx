import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, FolderOpen, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  EvidenceBinder,
  createEvidenceBinder,
  deleteEvidenceBinder,
  listEvidenceBinders,
  updateEvidenceBinder,
} from '@/services/evidence_binder_api';

const DEMO_BINDERS: EvidenceBinder[] = [
  {
    id: 'demo-1',
    name: 'Divorce Case 2025',
    description: 'All evidence for the divorce case.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [],
  },
  {
    id: 'demo-2',
    name: 'Client X - Contract Dispute',
    description: 'Documents related to contract dispute.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [],
  },
];

const EvidenceBinderManager: React.FC = () => {
  const [binders, setBinders] = useState<EvidenceBinder[]>([]);
  const [newBinderName, setNewBinderName] = useState('');
  const [newBinderDescription, setNewBinderDescription] = useState('');
  const [editingBinder, setEditingBinder] = useState<EvidenceBinder | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const fetchBinders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listEvidenceBinders();
      setBinders(Array.isArray(data) ? data : []);
      setDemoMode(false);
    } catch (err: any) {
      setDemoMode(true);
      setBinders(DEMO_BINDERS);
      setError(err?.message ?? 'Unable to load evidence binders. Showing demo data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBinders();
  }, []);

  const handleCreateBinder = async () => {
    if (!newBinderName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const created = await createEvidenceBinder({
        name: newBinderName.trim(),
        description: newBinderDescription.trim() || undefined,
      });
      setBinders((prev) => [...prev, created]);
      setDemoMode(false);
      setNewBinderName('');
      setNewBinderDescription('');
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to create evidence binder.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBinder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteEvidenceBinder(id);
      setBinders((prev) => prev.filter((binder) => binder.id !== id));
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete binder.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBinder = (binder: EvidenceBinder) => {
    setEditingBinder(binder);
    setNewBinderName(binder.name);
    setNewBinderDescription(binder.description || '');
    setIsCreateDialogOpen(true);
  };

  const handleUpdateBinder = async () => {
    if (!editingBinder || !newBinderName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateEvidenceBinder(editingBinder.id, {
        name: newBinderName.trim(),
        description: newBinderDescription.trim() || undefined,
      });
      setBinders((prev) =>
        prev.map((binder) => (binder.id === updated.id ? updated : binder))
      );
      setEditingBinder(null);
      setNewBinderName('');
      setNewBinderDescription('');
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update binder.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="binder-manager">
      <div className="binder-manager__header">
        <div>
          <h2 className="binder-manager__title">Evidence Binders</h2>
          {demoMode && (
            <p className="text-xs uppercase tracking-[0.4em] text-accent-gold mt-2">
              Demo binders (offline)
            </p>
          )}
        </div>
        <div className="binder-manager__actions">
          <Button variant="outline" size="sm" onClick={fetchBinders} className="binder-action" disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingBinder(null);
                  setNewBinderName('');
                  setNewBinderDescription('');
                  setIsCreateDialogOpen(true);
                }}
                className="binder-create"
              >
                <PlusCircle className="binder-create__icon" /> Create New Binder
              </Button>
            </DialogTrigger>
            <DialogContent className="binder-dialog">
              <DialogHeader>
                <DialogTitle className="binder-dialog__title">
                  {editingBinder ? 'Edit Binder' : 'Create New Binder'}
                </DialogTitle>
              </DialogHeader>
              <div className="binder-form">
                <div className="binder-form__row">
                  <Label htmlFor="name" className="binder-form__label">Name</Label>
                  <Input
                    id="name"
                    value={newBinderName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBinderName(e.target.value)}
                    className="binder-input"
                  />
                </div>
                <div className="binder-form__row">
                  <Label htmlFor="description" className="binder-form__label">Description</Label>
                  <Textarea
                    id="description"
                    value={newBinderDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBinderDescription(e.target.value)}
                    className="binder-textarea"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={editingBinder ? handleUpdateBinder : handleCreateBinder}
                  className="binder-save"
                  disabled={isLoading}
                >
                  {editingBinder ? 'Save Changes' : 'Create Binder'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="binder-grid">
        {binders.map((binder) => (
          <div key={binder.id} className="binder-card">
            <div>
              <h3 className="binder-card__title">
                <FolderOpen className="binder-card__icon" /> {binder.name}
              </h3>
              <p className="binder-card__description">{binder.description || 'No description provided.'}</p>
              <p className="binder-card__meta">Created: {new Date(binder.created_at).toLocaleDateString()}</p>
              <p className="binder-card__meta">Last Updated: {new Date(binder.updated_at).toLocaleDateString()}</p>
            </div>
            <div className="binder-card__actions">
              <Button variant="outline" size="sm" onClick={() => handleEditBinder(binder)} className="binder-action">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteBinder(binder.id)} className="binder-action danger">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EvidenceBinderManager;
