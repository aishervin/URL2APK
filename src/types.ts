export interface AppBuilderRequest {
  url: string;
  appName: string;
}

export interface AppBuilderResponse {
  status?: string;
  message?: string;
  error?: string;
  downloadUrl?: string;
}
