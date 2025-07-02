import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function DemoNotice() {
  const isStatic = !import.meta.env.VITE_API_BASE_URL || 
                   window.location.hostname.includes('netlify');

  if (!isStatic) return null;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Static Demo Mode:</strong> This is a static deployment showing the UI and code examples. 
        For live API demos, please run the application locally with your Upstage API key.
        <a 
          href="https://github.com/your-repo" 
          className="ml-2 underline hover:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View setup instructions →
        </a>
      </AlertDescription>
    </Alert>
  );
}