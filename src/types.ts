export type Orientation = 'portrait' | 'landscape' | 'auto';

export interface AppBuilderRequest {
  url: string;
  appName: string;
  orientation?: Orientation;
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
