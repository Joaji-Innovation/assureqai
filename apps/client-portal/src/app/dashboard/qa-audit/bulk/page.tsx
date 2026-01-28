'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, FileText, Loader2, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueuedFile {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  score?: number;
}

export default function BulkAuditPage() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = useCallback((newFiles: FileList) => {
    const queuedFiles: QueuedFile[] = Array.from(newFiles).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'queued',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...queuedFiles]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startProcessing = async () => {
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'queued') continue;

      // Update status to processing
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processing' as const } : f))
      );

      // Simulate processing with progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress } : f))
        );
      }

      // Complete with random score
      const score = Math.round(70 + Math.random() * 25);
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'completed' as const, progress: 100, score } : f
        )
      );
    }

    setProcessing(false);
  };

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const avgScore = completedCount > 0
    ? Math.round(files.filter((f) => f.score).reduce((sum, f) => sum + (f.score || 0), 0) / completedCount)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulk AI Audit</h2>
          <p className="text-muted-foreground">Process multiple recordings at once</p>
        </div>
        {files.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {completedCount} / {files.length} completed
            {avgScore > 0 && <span className="ml-2 text-primary font-medium">Avg: {avgScore}%</span>}
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            Batch Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('bulk-upload')?.click()}
          >
            <input
              id="bulk-upload"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Upload Multiple Files</p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop up to 50 audio files for batch processing
            </p>
            <Button type="button">Select Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Processing Queue</CardTitle>
          {files.length > 0 && !processing && (
            <Button onClick={startProcessing} disabled={files.every((f) => f.status !== 'queued')}>
              Start Processing
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-4" />
              <p>No files in queue</p>
              <p className="text-sm">Upload files to start batch processing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border"
                >
                  <div className="flex-shrink-0">
                    {file.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : file.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : file.status === 'failed' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.status === 'processing' && (
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {file.score !== undefined && (
                      <span className={`font-bold ${file.score >= 80 ? 'text-emerald-500' : file.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {file.score}%
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      file.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      file.status === 'processing' ? 'bg-primary/10 text-primary' :
                      file.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {file.status}
                    </span>
                    {file.status === 'queued' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
