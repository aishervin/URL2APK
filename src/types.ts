export type Orientation = 'portrait' | 'landscape' | 'auto';

export type StudioTab = 'dashboard' | 'editor' | 'assets' | 'github' | 'build' | 'ai-assistant';

export type CreationMode = 'website' | 'source' | 'ai-gen' | 'import' | 'hybrid';

export interface ProjectFile {
  path: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'ts' | 'py' | 'json' | 'image' | 'asset' | 'other';
  content: string;
  isModified?: boolean;
}

export interface AppBuilderRequest {
  url?: string;
  appName: string;
  orientation?: Orientation;
  sourceFiles?: Record<string, string>;
  mode?: CreationMode;
}

export interface AppBuilderResponse {
  status?: 'pending' | 'queued' | 'in_progress' | 'success' | 'failed' | 'cancelled' | string;
  message?: string;
  error?: string;
  downloadUrl?: string;
  directApkUrl?: string;
  runId?: number;
  artifactId?: number;
  runUrl?: string;
}

export interface GitHubWorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
}

export interface GitHubArtifact {
  id: number;
  name: string;
  size_in_bytes: number;
  expired?: boolean;
  archive_download_url: string;
}

export interface GitHubArtifactsResponse {
  total_count: number;
  artifacts: GitHubArtifact[];
}

export interface GeminiModelInfo {
  name: string;
  displayName: string;
  description?: string;
}
