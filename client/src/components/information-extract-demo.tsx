import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "./file-upload";
import CodeBlock from "./code-block";
import { Search, Upload, Code2, Lightbulb, Settings, Wand2, FileText } from "lucide-react";
import { INFORMATION_EXTRACT_EXAMPLES } from "../lib/constants";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function InformationExtractDemo() {
  const [selectedDocType, setSelectedDocType] = useState("invoice");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractResult, setExtractResult] = useState<any>(null);
  const { toast } = useToast();

  const documentTypes = [
    { id: "invoice", label: "Invoice", icon: "📄" },
    { id: "resume", label: "Resume", icon: "📋" },
    { id: "bank", label: "Bank Statement", icon: "🏦" },
    { id: "receipt", label: "Receipt", icon: "🧾" },
  ];

  const schemas = {
    invoice: {
      type: "object",
      properties: {
        invoice_number: { type: "string", description: "Invoice number" },
        date: { type: "string", description: "Invoice date" },
        vendor_name: { type: "string", description: "Vendor company name" },
        total_amount: { type: "number", description: "Total amount" },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
            },
          },
        },
      },
    },
    resume: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              position: { type: "string" },
              duration: { type: "string" },
            },
          },
        },
        skills: { type: "array", items: { type: "string" } },
      },
    },
    bank: {
      type: "object",
      properties: {
        bank_name: { type: "string", description: "The name of bank in bank statement" },
        account_number: { type: "string", description: "Account number" },
        balance: { type: "number", description: "Account balance" },
        transactions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              description: { type: "string" },
              amount: { type: "number" },
            },
          },
        },
      },
    },
    receipt: {
      type: "object",
      properties: {
        merchant_name: { type: "string", description: "Merchant name" },
        date: { type: "string", description: "Purchase date" },
        total_amount: { type: "number", description: "Total amount" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
            },
          },
        },
      },
    },
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setExtractResult(null);

    try {
      const schema = schemas[selectedDocType as keyof typeof schemas];
      const result = await apiClient.extractInformation(file, schema);
      
      // Parse the content if it's a string
      const content = result.choices[0].message.content;
      const extractedData = typeof content === "string" ? JSON.parse(content) : content;
      setExtractResult(extractedData);

      toast({
        title: "Information extracted successfully!",
        description: "Data has been structured according to your schema",
      });
    } catch (error) {
      console.error("Information extract error:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDisplayData = () => {
    if (extractResult) {
      return JSON.stringify(extractResult, null, 2);
    }
    return "Upload a document to see extracted data here...";
  };

  return (
    <div id="info-extract" className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 service-info-extract rounded-full text-2xl mb-4">
          <Search className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Information Extract Demo</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Extract structured data from any document using custom schemas without training
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="flex flex-wrap justify-center gap-2">
        {documentTypes.map((type) => (
          <Button
            key={type.id}
            variant={selectedDocType === type.id ? "default" : "outline"}
            onClick={() => setSelectedDocType(type.id)}
            className={selectedDocType === type.id ? "service-info-extract" : ""}
          >
            <span className="mr-2">{type.icon}</span>
            {type.label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Schema Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(43,96%,56%)]">
              <Settings className="mr-2 h-5 w-5" />
              Schema Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={JSON.stringify(schemas[selectedDocType as keyof typeof schemas] || schemas.invoice, null, 2)}
              language="json"
              title="Schema Definition"
              className="text-xs"
            />
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(43,96%,56%)]">
              <Upload className="mr-2 h-5 w-5" />
              Document Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              maxSize={50}
              onFileSelect={handleFileUpload}
              placeholder={isProcessing ? "Processing document..." : "Drop your document here or click to upload"}
              description="Supports PDF, DOCX, Images (up to 50MB)"
            />

            {isProcessing && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Extracting information with Upstage API...</span>
                </div>
              </div>
            )}

            {extractResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700">
                  <strong>✓ Success!</strong> Information extracted successfully
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(43,96%,56%)]">
              <Search className="mr-2 h-5 w-5" />
              Extracted Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={getDisplayData()}
              language="json"
              title="JSON Output"
            />
          </CardContent>
        </Card>
      </div>

      {/* Implementation Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(43,96%,56%)]">
            <Code2 className="mr-2 h-5 w-5" />
            Implementation Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="python">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>

            {Object.entries(INFORMATION_EXTRACT_EXAMPLES).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <CodeBlock
                  code={code}
                  language={lang === 'curl' ? 'bash' : lang}
                  title={`${lang.charAt(0).toUpperCase() + lang.slice(1)} Example`}
                  showCopy
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 text-white">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Schema Design Best Practices
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2">📝 Clear Descriptions:</div>
              <ul className="space-y-1 text-yellow-100">
                <li>• Use descriptive property names and descriptions</li>
                <li>• Avoid generic terms like "field1", "data", "value"</li>
                <li>• Include expected format in descriptions</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2">🏗️ Schema Structure:</div>
              <ul className="space-y-1 text-yellow-100">
                <li>• Use arrays for repeating data (line items, experiences)</li>
                <li>• Limit to 50 properties per schema</li>
                <li>• Keep total schema length under 10,000 characters</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}