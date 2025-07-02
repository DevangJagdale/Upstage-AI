import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

export default function DemoNotice() {
  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <strong>Live Demo Mode:</strong> All APIs are connected and functional! 
        Upload your own documents to test Document Parse, Information Extract, and Solar LLM capabilities.
        The demos use real Upstage AI services for authentic results.
      </AlertDescription>
    </Alert>
  );
}