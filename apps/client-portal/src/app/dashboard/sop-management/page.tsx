'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  BookText, Plus, FileText, Upload, Loader2, X, Eye, Trash2,
  Download, CheckCircle, AlertCircle, Clock, FileUp, Link2, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sopApi, qaParameterApi } from '@/lib/api';
import type { QAParameter } from '@/types/qa-parameter';

interface SOP {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;  // Backward compatibility with old records
  description?: string;
  content?: string;  // SOP text content or base64 file content
  category?: string;
  version?: string;
  status?: 'Draft' | 'Published' | 'Archived';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  linkedParameterSetId?: string;
}

export default function SOPManagementPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sops, setSops] = useState<SOP[]>([]);
  const [parameterSets, setParameterSets] = useState<QAParameter[]>([]);

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null);

  // Form states
  const [uploading, setUploading] = useState(false);
  const [newSop, setNewSop] = useState({
    name: '',
    description: '',
    file: null as File | null,
    linkedParameterSetId: ''
  });
  const [editSop, setEditSop] = useState({
    id: '',
    name: '',
    content: '',
    category: '',
    version: '1.0',
    status: 'Draft' as 'Draft' | 'Published' | 'Archived',
    linkedParameterSetId: '',
    isActive: true
  });

  // Load SOPs and parameter sets
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sopResponse, paramResponse] = await Promise.all([
        sopApi.list(),
        qaParameterApi.list()
      ]);

      // Normalize SOP data - ensure name exists (fallback to title, fileName, or 'Untitled')
      const normalizedSops = ((sopResponse as any) || []).map((sop: any) => ({
        ...sop,
        name: sop.name || sop.title || sop.fileName?.replace(/\.[^/.]+$/, '') || 'Untitled SOP'
      }));

      setSops(normalizedSops);
      setParameterSets((paramResponse as any) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Show error state instead of demo data
      setSops([]);
      setParameterSets([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon color based on type
  const getFileColor = (fileType?: string) => {
    if (!fileType) return 'text-muted-foreground';
    if (fileType.includes('pdf')) return 'text-red-500';
    if (fileType.includes('word') || fileType.includes('doc')) return 'text-blue-500';
    if (fileType.includes('text')) return 'text-gray-500';
    return 'text-primary';
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewSop({
        ...newSop,
        file,
        name: newSop.name || file.name.replace(/\.[^/.]+$/, '') // Use filename as name if empty
      });
    }
  };

  // Upload new SOP
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSop.name.trim()) return;

    setUploading(true);
    try {
      let fileContent = '';
      let fileData = {};

      // Read file as base64 if provided
      if (newSop.file) {
        fileContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || ''); // Remove data:... prefix
          };
          reader.readAsDataURL(newSop.file!);
        });

        fileData = {
          fileName: newSop.file.name,
          fileType: newSop.file.type,
          fileSize: newSop.file.size,
          content: fileContent
        };
      }

      await sopApi.create({
        name: newSop.name,
        description: newSop.description,
        ...fileData,
        isActive: true
      } as any);

      await loadData();
      setShowUploadDialog(false);
      setNewSop({ name: '', description: '', file: null, linkedParameterSetId: '' });
      toast({ title: 'Success', description: 'SOP uploaded successfully' });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Error', description: 'Failed to upload SOP', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Open edit dialog
  const handleEdit = (sop: SOP) => {
    setEditSop({
      id: sop.id || sop._id || '',
      name: sop.name || sop.title || '',
      content: sop.content || '',
      category: sop.category || 'General',
      version: sop.version || '1.0',
      status: sop.status || 'Draft',
      linkedParameterSetId: sop.linkedParameterSetId || '',
      isActive: sop.isActive
    });
    setShowEditDialog(true);
  };

  // Save edited SOP
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSop.name?.trim() || !editSop.id) return;

    setUploading(true);
    try {
      await sopApi.update(editSop.id, {
        name: editSop.name,
        title: editSop.name, // Also save as title for backward compatibility
        content: editSop.content,
        category: editSop.category,
        version: editSop.version,
        status: editSop.status,
        linkedParameterSetId: editSop.linkedParameterSetId,
        isActive: editSop.isActive
      } as any);

      await loadData();
      setShowEditDialog(false);
      setEditSop({ id: '', name: '', content: '', category: '', version: '1.0', status: 'Draft', linkedParameterSetId: '', isActive: true });
      toast({ title: 'Success', description: 'SOP updated successfully' });
    } catch (error) {
      console.error('Update failed:', error);
      toast({ title: 'Error', description: 'Failed to update SOP', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Delete SOP
  const handleDelete = async (sop: SOP) => {
    if (!confirm(`Delete "${sop.name}"? This cannot be undone.`)) return;

    try {
      const sopId = sop.id || sop._id;
      if (sopId) {
        await sopApi.delete(sopId);
        await loadData();
        toast({ title: 'Deleted', description: 'SOP removed successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete SOP', variant: 'destructive' });
    }
  };

  // View SOP details
  const handleView = (sop: SOP) => {
    setSelectedSop(sop);
    setShowViewDialog(true);
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h2 className="text-2xl font-bold tracking-tight">SOP Management</h2>
          <p className="text-muted-foreground">Standard Operating Procedures library</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4" />
          Add SOP
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SOPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sops.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sops.filter(s => s.fileName).length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{sops.filter(s => s.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* SOP Grid */}
      {sops.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No SOPs yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Upload your first SOP to get started</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add SOP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sops.map((sop) => (
            <Card
              key={sop.id || sop._id}
              className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors group"
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className={`p-2 rounded-lg bg-primary/10 ${getFileColor(sop.fileType)}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleView(sop)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(sop)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(sop)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{sop.name || sop.title || 'Untitled SOP'}</h3>
                  {sop.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sop.description}</p>
                  )}
                </div>

                {sop.fileName && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileUp className="h-3 w-3" />
                    <span className="truncate">{sop.fileName}</span>
                    <span>({formatFileSize(sop.fileSize)})</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(sop.updatedAt || sop.createdAt)}
                  </div>
                  <Badge variant={sop.isActive ? 'default' : 'secondary'}>
                    {sop.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New SOP</DialogTitle>
            <DialogDescription>
              Add a Standard Operating Procedure document to your library.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sopName">SOP Name *</Label>
              <Input
                id="sopName"
                placeholder="e.g., Customer Complaint Resolution"
                value={newSop.name}
                onChange={(e) => setNewSop({ ...newSop, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sopDesc">Description</Label>
              <Textarea
                id="sopDesc"
                placeholder="Brief description of this SOP..."
                value={newSop.description}
                onChange={(e) => setNewSop({ ...newSop, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Document File (Optional)</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById('sop-file')?.click()}
              >
                <input
                  id="sop-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {newSop.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">{newSop.file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewSop({ ...newSop, file: null });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload PDF, DOC, or TXT</p>
                    <p className="text-xs text-muted-foreground mt-1">Max file size: 10MB</p>
                  </>
                )}
              </div>
            </div>

            {parameterSets.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Parameter Set (Optional)</Label>
                <Select
                  value={newSop.linkedParameterSetId}
                  onValueChange={(v) => setNewSop({ ...newSop, linkedParameterSetId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parameter set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parameterSets.map((ps) => (
                      <SelectItem key={ps.id} value={ps.id}>
                        {ps.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !newSop.name.trim()}>
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload SOP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSop?.name || selectedSop?.title || 'Untitled SOP'}</DialogTitle>
            <DialogDescription>{selectedSop?.description || 'No description provided'}</DialogDescription>
          </DialogHeader>
          {selectedSop && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{formatDate(selectedSop.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p>{formatDate(selectedSop.updatedAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{selectedSop.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                {selectedSop.fileName && (
                  <div>
                    <Label className="text-muted-foreground">File</Label>
                    <p>{selectedSop.fileName} ({formatFileSize(selectedSop.fileSize)})</p>
                  </div>
                )}
              </div>

              {selectedSop.content && (
                <div>
                  <Label className="text-muted-foreground">Document</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm">Document attached</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                      // Download logic
                      const link = document.createElement('a');
                      link.href = `data:${selectedSop.fileType};base64,${selectedSop.content}`;
                      link.download = selectedSop.fileName || 'document';
                      link.click();
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SOP</DialogTitle>
            <DialogDescription>
              Update the details for &quot;{editSop.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editSop.name}
                onChange={(e) => setEditSop({ ...editSop, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editContent">Content</Label>
              <Textarea
                id="editContent"
                value={editSop.content}
                onChange={(e) => setEditSop({ ...editSop, content: e.target.value })}
                rows={8}
                placeholder="Enter the SOP content here..."
              />
              <p className="text-xs text-muted-foreground">
                The AI will use this content to generate a QA campaign if you use the AI generation feature.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCategory">Category</Label>
                <Select
                  value={editSop.category}
                  onValueChange={(v) => setEditSop({ ...editSop, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editVersion">Version</Label>
                <Input
                  id="editVersion"
                  value={editSop.version}
                  onChange={(e) => setEditSop({ ...editSop, version: e.target.value })}
                  placeholder="e.g., 1.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editSop.status}
                  onValueChange={(v) => setEditSop({ ...editSop, status: v as 'Draft' | 'Published' | 'Archived' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Link to QA Parameter Campaign (Optional)
                </Label>
                <Select
                  value={editSop.linkedParameterSetId || 'none'}
                  onValueChange={(v) => setEditSop({ ...editSop, linkedParameterSetId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No specific campaign linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific campaign linked</SelectItem>
                    {parameterSets.map((ps) => (
                      <SelectItem key={ps.id} value={ps.id}>
                        {ps.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !editSop.name?.trim()}>
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
