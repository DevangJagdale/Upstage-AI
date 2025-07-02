import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "./file-upload";
import CodeBlock from "./code-block";
import { FileText, Upload, Code2, Lightbulb, Zap } from "lucide-react";
import { DOCUMENT_PARSE_EXAMPLES } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function DocumentParseDemo() {
  const [outputFormat, setOutputFormat] = useState("json");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const { toast } = useToast();

  const outputFormats = [
    { id: "html", label: "HTML" },
    { id: "markdown", label: "Markdown" },
    { id: "json", label: "JSON" },
  ];

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setParseResult(null);

    try {
      const result = await apiClient.parseDocument(file);
      setParseResult(result);
      
      toast({
        title: "Document parsed successfully!",
        description: `Processed ${result.elements?.length || 0} elements from your document`,
      });
    } catch (error) {
      console.error("Document parse error:", error);
      toast({
        title: "Parse failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDisplayContent = () => {
    if (!parseResult?.elements) {
      return "Upload a document to see parsed content here...";
    }

    switch (outputFormat) {
      case "html":
        return parseResult.elements
          .map((el: any) => el.content?.html || el.content?.text || "")
          .join("\n");
      case "markdown":
        return parseResult.elements
          .map((el: any) => el.content?.markdown || el.content?.text || "")
          .join("\n");
      case "json":
      default:
        return JSON.stringify(parseResult, null, 2);
    }
  };

  return (
    <div id="document-parse" className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 service-doc-parse rounded-full text-2xl mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Document Parse Demo</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Transform any document into structured HTML or Markdown with advanced layout detection
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(160,84%,39%)]">
              <Upload className="mr-2 h-5 w-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg"
              maxSize={50}
              onFileSelect={handleFileUpload}
              placeholder={isProcessing ? "Processing document..." : "Drop your document here or click to upload"}
              description="Supports PDF, DOCX, PPTX, XLSX, Images (up to 50MB)"
            />
            
            {isProcessing && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Processing with Upstage Document Parse API...</span>
                </div>
              </div>
            )}

            {parseResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700">
                  <strong>✓ Success!</strong> Parsed {parseResult.elements?.length || 0} elements
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(160,84%,39%)]">
              <Code2 className="mr-2 h-5 w-5" />
              Parsed Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={outputFormat} onValueChange={setOutputFormat}>
              <TabsList className="grid w-full grid-cols-3">
                {outputFormats.map((format) => (
                  <TabsTrigger key={format.id} value={format.id}>
                    {format.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {outputFormats.map((format) => (
                <TabsContent key={format.id} value={format.id}>
                  <CodeBlock
                    code={getDisplayContent()}
                    language={format.id === "json" ? "json" : format.id}
                    title={`${format.label} Output`}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(160,84%,39%)]">
            <Code2 className="mr-2 h-5 w-5" />
            Implementation Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="python">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
            </TabsList>

            {Object.entries(DOCUMENT_PARSE_EXAMPLES).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <CodeBlock
                  code={code}
                  language={lang === "curl" ? "bash" : lang}
                  title={`${lang.charAt(0).toUpperCase() + lang.slice(1)} Example`}
                  showCopy
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card className="bg-gradient-to-r from-[hsl(160,84%,39%)] to-green-600 text-white">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Tips & Best Practices
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                File Optimization:
              </div>
              <ul className="space-y-1 text-green-100">
                <li>• Use high-resolution documents (min 640px width)</li>
                <li>• Ensure text is at least 2.5% of image height</li>
                <li>• Split long PDFs (>100 pages) for better performance</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2 flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Performance:
              </div>
              <ul className="space-y-1 text-green-100">
                <li>• Sync API: 10 RPS, max 100 pages</li>
                <li>• Async API: 30 RPS, max 1,000 pages</li>
                <li>• Max file size: 50MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}