import { getCurrentProfile } from '@/lib/auth'
import { IntegrationStatus } from '@/components/integrations/status'

export default async function IntegrationsPage() {
  const profile = await getCurrentProfile()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools to unlock Space&apos;s full potential
        </p>
      </div>

      <div className="space-y-6">
        {/* Google */}
        <div className="neu-flat p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Google Workspace</h2>
              <p className="text-sm text-muted-foreground">Gmail and Calendar access</p>
            </div>
          </div>
          <IntegrationStatus type="google" />
        </div>

        {/* Linear */}
        <div className="neu-flat p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl linear-bg flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                <path d="M2.5 2.5L10 17.5L17.5 2.5H12.5L10 7.5L7.5 2.5H2.5Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Linear</h2>
              <p className="text-sm text-muted-foreground">Issues and project tracking</p>
            </div>
          </div>
          <IntegrationStatus type="linear" />
        </div>
      </div>

      {/* Help */}
      <div className="mt-8 neu-flat p-6 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-3">Troubleshooting</h3>
        <p className="text-sm text-muted-foreground mb-4">
          If you logged in before Gmail/Calendar scopes were added, you need to reconnect 
          your Google account to grant the new permissions.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">API not enabled?</strong> Enable APIs in Google Cloud Console:</p>
          <div className="flex gap-4 mt-2">
            <a 
              href="https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=861258557300" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Gmail API →
            </a>
            <a 
              href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=861258557300" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Calendar API →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
