'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ListChecks, Plus, Settings, Trash2, AlertCircle, Loader2, X,
  GripVertical, ChevronDown, ChevronRight, FolderPlus, FileEdit,
  Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { qaParameterApi } from '@/lib/api';
import type { QAParameter, Parameter, SubParameter } from '@/types/qa-parameter';

export default function ParameterManagementPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [parameterSets, setParameterSets] = useState<QAParameter[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Dialog states
  const [showNewSetDialog, setShowNewSetDialog] = useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showNewSubParamDialog, setShowNewSubParamDialog] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Form states
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newSubParam, setNewSubParam] = useState<Partial<SubParameter>>({
    name: '',
    weight: 10,
    type: 'Non-Fatal'
  });
  const [saving, setSaving] = useState(false);

  // Load parameter sets
  useEffect(() => {
    loadParameterSets();
  }, []);

  const loadParameterSets = async () => {
    setIsLoading(true);
    try {
      const sets = await qaParameterApi.list();
      setParameterSets(sets);
      if (sets.length > 0 && !selectedSetId) {
        setSelectedSetId(sets[0].id || sets[0]._id);
      }
    } catch (error) {
      console.error('Failed to load parameter sets:', error);
      // Use demo data if API fails
      setParameterSets([
        {
          id: 'demo-1',
          name: 'Default Customer Service',
          description: 'Standard customer service evaluation parameters',
          isActive: true,
          lastModified: new Date().toISOString(),
          parameters: [
            {
              id: 'grp-1',
              name: 'Greeting & Opening',
              subParameters: [
                { id: 'sp-1', name: 'Used correct greeting', weight: 5, type: 'Non-Fatal' },
                { id: 'sp-2', name: 'Introduced self and company', weight: 5, type: 'Non-Fatal' },
              ]
            },
            {
              id: 'grp-2',
              name: 'Problem Resolution',
              subParameters: [
                { id: 'sp-3', name: 'Identified customer issue', weight: 15, type: 'Non-Fatal' },
                { id: 'sp-4', name: 'Provided correct solution', weight: 20, type: 'Non-Fatal' },
                { id: 'sp-5', name: 'Data protection followed', weight: 0, type: 'Fatal' },
              ]
            },
            {
              id: 'grp-3',
              name: 'Closing',
              subParameters: [
                { id: 'sp-6', name: 'Summarized actions taken', weight: 10, type: 'Non-Fatal' },
                { id: 'sp-7', name: 'Asked if anything else needed', weight: 5, type: 'Non-Fatal' },
              ]
            }
          ]
        }
      ]);
      setSelectedSetId('demo-1');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSet = parameterSets.find(s => s.id === selectedSetId || (s as any)._id === selectedSetId);

  // Calculate total weight for a parameter set
  const calculateTotalWeight = (params: Parameter[]) => {
    return params.reduce((total, group) => {
      return total + group.subParameters.reduce((sum, sp) =>
        sp.type !== 'Fatal' ? sum + sp.weight : sum, 0);
    }, 0);
  };

  const totalWeight = selectedSet ? calculateTotalWeight(selectedSet.parameters) : 0;

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Create new parameter set
  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    setSaving(true);
    try {
      const newSet: Partial<QAParameter> = {
        name: newSetName,
        description: newSetDescription,
        isActive: true,
        parameters: []
      };
      const response = await qaParameterApi.create(newSet as any);
      await loadParameterSets();
      setSelectedSetId(response.id || response._id);
      setShowNewSetDialog(false);
      setNewSetName('');
      setNewSetDescription('');
      toast({ title: 'Success', description: 'Parameter set created' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create parameter set', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Add new parameter group to selected set
  const handleAddGroup = async () => {
    if (!selectedSet || !newGroupName.trim()) return;
    setSaving(true);
    try {
      const updatedParams = [
        ...selectedSet.parameters,
        {
          id: `grp-${Date.now()}`,
          name: newGroupName,
          subParameters: []
        }
      ];
      await qaParameterApi.update(selectedSetId!, { parameters: updatedParams } as any);
      await loadParameterSets();
      setShowNewGroupDialog(false);
      setNewGroupName('');
      toast({ title: 'Success', description: 'Parameter group added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add group', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Add sub-parameter to a group
  const handleAddSubParameter = async () => {
    if (!selectedSet || !editingGroupId || !newSubParam.name?.trim()) return;
    setSaving(true);
    try {
      const updatedParams = selectedSet.parameters.map(group => {
        if (group.id === editingGroupId) {
          return {
            ...group,
            subParameters: [
              ...group.subParameters,
              {
                id: `sp-${Date.now()}`,
                name: newSubParam.name!,
                weight: newSubParam.type === 'Fatal' ? 0 : (newSubParam.weight || 10),
                type: newSubParam.type as 'Fatal' | 'Non-Fatal' | 'ZTP'
              }
            ]
          };
        }
        return group;
      });
      await qaParameterApi.update(selectedSetId!, { parameters: updatedParams } as any);
      await loadParameterSets();
      setShowNewSubParamDialog(false);
      setNewSubParam({ name: '', weight: 10, type: 'Non-Fatal' });
      setEditingGroupId(null);
      toast({ title: 'Success', description: 'Sub-parameter added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add sub-parameter', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete a sub-parameter
  const handleDeleteSubParam = async (groupId: string, subParamId: string) => {
    if (!selectedSet) return;
    if (!confirm('Delete this sub-parameter?')) return;

    try {
      const updatedParams = selectedSet.parameters.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            subParameters: group.subParameters.filter(sp => sp.id !== subParamId)
          };
        }
        return group;
      });
      await qaParameterApi.update(selectedSetId!, { parameters: updatedParams } as any);
      await loadParameterSets();
      toast({ title: 'Deleted', description: 'Sub-parameter removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Delete a group
  const handleDeleteGroup = async (groupId: string) => {
    if (!selectedSet) return;
    if (!confirm('Delete this entire parameter group and all its sub-parameters?')) return;

    try {
      const updatedParams = selectedSet.parameters.filter(g => g.id !== groupId);
      await qaParameterApi.update(selectedSetId!, { parameters: updatedParams } as any);
      await loadParameterSets();
      toast({ title: 'Deleted', description: 'Parameter group removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete group', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parameter Management</h2>
          <p className="text-muted-foreground">Create and manage QA parameter sets</p>
        </div>
        <Dialog open={showNewSetDialog} onOpenChange={setShowNewSetDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              New Parameter Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Parameter Set</DialogTitle>
              <DialogDescription>
                A parameter set is a collection of evaluation criteria for QA audits.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="setName">Set Name</Label>
                <Input
                  id="setName"
                  placeholder="e.g., Customer Service Evaluation"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setDesc">Description</Label>
                <Textarea
                  id="setDesc"
                  placeholder="Describe when to use this parameter set..."
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSetDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateSet} disabled={saving || !newSetName.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Set
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Parameter Set Selector */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Parameter Set</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {parameterSets.map((set) => {
              const setId = set.id || (set as any)._id;
              return (
                <Button
                  key={setId}
                  variant={selectedSetId === setId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSetId(setId)}
                  className="gap-2"
                >
                  <ListChecks className="h-4 w-4" />
                  {set.name}
                  <Badge variant="secondary" className="ml-1">
                    {set.parameters?.length || 0} groups
                  </Badge>
                </Button>
              );
            })}
            {parameterSets.length === 0 && (
              <p className="text-muted-foreground text-sm">No parameter sets found. Create one to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight Status */}
      {selectedSet && (
        <div className={`p-4 rounded-lg text-sm flex items-center justify-between ${totalWeight === 100
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
          : totalWeight > 100
            ? 'bg-red-500/10 border border-red-500/20 text-red-500'
            : 'bg-amber-500/10 border border-amber-500/20 text-amber-600'
          }`}>
          <div className="flex items-center gap-2">
            {totalWeight === 100 ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            Total Weight: {totalWeight}%
            {totalWeight !== 100 && (
              <span className="text-muted-foreground">
                ({totalWeight > 100 ? 'Reduce weights' : `Add ${100 - totalWeight}% more`})
              </span>
            )}
          </div>
          <span className="text-muted-foreground">Fatal parameters have 0 weight</span>
        </div>
      )}

      {/* Parameter Groups */}
      {selectedSet && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  {selectedSet.name}
                </CardTitle>
                <CardDescription>{selectedSet.description}</CardDescription>
              </div>
              <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Parameter Group</DialogTitle>
                    <DialogDescription>
                      Groups organize related sub-parameters together (e.g., "Greeting & Opening").
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., Greeting & Opening"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddGroup} disabled={saving || !newGroupName.trim()}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Group
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedSet.parameters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No parameter groups yet.</p>
                  <p className="text-sm">Add a group to start defining evaluation criteria.</p>
                </div>
              ) : (
                selectedSet.parameters.map((group) => (
                  <Collapsible
                    key={group.id}
                    open={expandedGroups.has(group.id)}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <div className="border rounded-lg">
                      {/* Group Header */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {expandedGroups.has(group.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{group.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.subParameters.length} sub-parameter{group.subParameters.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {group.subParameters.reduce((sum, sp) => sp.type !== 'Fatal' ? sum + sp.weight : sum, 0)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGroupId(group.id);
                                setShowNewSubParamDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Sub-Parameters */}
                      <CollapsibleContent>
                        <div className="border-t">
                          {group.subParameters.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No sub-parameters. Click + to add one.
                            </div>
                          ) : (
                            group.subParameters.map((subParam) => (
                              <div
                                key={subParam.id}
                                className="flex items-center justify-between p-3 pl-12 border-b last:border-b-0 hover:bg-muted/30"
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{subParam.name}</span>
                                  <Badge
                                    variant={subParam.type === 'Fatal' ? 'destructive' : subParam.type === 'ZTP' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {subParam.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  {subParam.type !== 'Fatal' && (
                                    <span className="text-sm font-medium">{subParam.weight}%</span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteSubParam(group.id, subParam.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Sub-Parameter Dialog */}
      <Dialog open={showNewSubParamDialog} onOpenChange={setShowNewSubParamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sub-Parameter</DialogTitle>
            <DialogDescription>
              Add a specific evaluation criterion within this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spName">Sub-Parameter Name</Label>
              <Input
                id="spName"
                placeholder="e.g., Agent used correct greeting"
                value={newSubParam.name}
                onChange={(e) => setNewSubParam({ ...newSubParam, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newSubParam.type}
                  onValueChange={(v) => setNewSubParam({
                    ...newSubParam,
                    type: v as any,
                    weight: v === 'Fatal' ? 0 : newSubParam.weight
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non-Fatal">Non-Fatal</SelectItem>
                    <SelectItem value="Fatal">Fatal</SelectItem>
                    <SelectItem value="ZTP">ZTP (Zero Tolerance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spWeight">Weight (%)</Label>
                <Input
                  id="spWeight"
                  type="number"
                  min="0"
                  max="100"
                  value={newSubParam.weight}
                  onChange={(e) => setNewSubParam({ ...newSubParam, weight: parseInt(e.target.value) || 0 })}
                  disabled={newSubParam.type === 'Fatal'}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSubParamDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSubParameter} disabled={saving || !newSubParam.name?.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Sub-Parameter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
