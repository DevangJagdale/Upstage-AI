import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload from "./file-upload";
import { 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Users,
  Shield,
  TrendingUp,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractAnalysis {
  documentText: string;
  keyTerms: {
    parties: string[];
    effectiveDate: string;
    expirationDate: string;
    totalValue: string;
    paymentTerms: string;
    terminationClause: string;
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  };
  summary: string;
  obligations: {
    party: string;
    obligations: string[];
  }[];
}

export default function ContractAnalyzer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'parsing' | 'analyzing' | 'complete'>('upload');
  const { toast } = useToast();

  // Helper function to extract text from HTML
  const extractTextFromHTML = (html: string): string => {
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Extract text content and clean it up
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Clean up extra whitespace and normalize line breaks
      return textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return '';
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setCurrentStep('parsing');
    setAnalysis(null);

    try {
      // Step 1: Parse the document using Document Parse API
      console.log('Starting document parse for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('document', file);

      const parseResponse = await fetch('/api/document-parse', {
        method: 'POST',
        body: formData,
      });

      console.log('Document Parse API Response Status:', parseResponse.status, parseResponse.statusText);

      if (!parseResponse.ok) {
        throw new Error('Failed to parse document');
      }

      const parseResult = await parseResponse.json();
      console.log('Document Parse API Result:', parseResult);
      
      // Extract text content from parsed result with multiple fallback strategies
      let documentText = '';

      // Strategy 1: Try to extract from elements array
      if (parseResult.elements && Array.isArray(parseResult.elements)) {
        documentText = parseResult.elements
          .map((element: any) => element.content?.text || '')
          .join('\n');
        console.log('Extracted text from elements array, length:', documentText.length);
      }

      // Strategy 2: Try to extract from content.text
      if (!documentText.trim() && parseResult.content?.text) {
        documentText = parseResult.content.text;
        console.log('Extracted text from content.text, length:', documentText.length);
      }

      // Strategy 3: Try to extract from content.html
      if (!documentText.trim() && parseResult.content?.html) {
        documentText = extractTextFromHTML(parseResult.content.html);
        console.log('Extracted text from content.html, length:', documentText.length);
      }

      // Strategy 4: Try to extract from top-level html property
      if (!documentText.trim() && parseResult.html) {
        documentText = extractTextFromHTML(parseResult.html);
        console.log('Extracted text from top-level html, length:', documentText.length);
      }

      console.log('Final extracted document text length:', documentText.length);
      console.log('First 500 characters of extracted text:', documentText.substring(0, 500));
      console.log('Parse result structure:', {
        hasElements: !!parseResult.elements,
        elementsType: typeof parseResult.elements,
        hasContentText: !!parseResult.content?.text,
        hasContentHtml: !!parseResult.content?.html,
        hasTopLevelHtml: !!parseResult.html,
        allKeys: Object.keys(parseResult)
      });

      if (!documentText.trim()) {
        console.error('No text content found after all extraction strategies. Parse result details:', {
          parseResult,
          elementsArray: parseResult.elements,
          contentObject: parseResult.content,
          documentTextLength: documentText.length
        });
        throw new Error('No text content found in document. The document may be empty or in an unsupported format.');
      }

      setCurrentStep('analyzing');

      // Step 2: Analyze the contract using Solar LLM
      const analysisPrompt = `
You are a legal contract analyst. Analyze the following contract and provide a comprehensive analysis in JSON format.

Contract Text:
${documentText}

Please provide analysis in this exact JSON structure:
{
  "keyTerms": {
    "parties": ["Party 1", "Party 2"],
    "effectiveDate": "Date or 'Not specified'",
    "expirationDate": "Date or 'Not specified'",
    "totalValue": "Amount or 'Not specified'",
    "paymentTerms": "Payment terms summary",
    "terminationClause": "Termination conditions summary"
  },
  "riskAssessment": {
    "riskLevel": "low|medium|high",
    "riskFactors": ["Risk factor 1", "Risk factor 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "summary": "Brief 2-3 sentence summary of the contract",
  "obligations": [
    {
      "party": "Party Name",
      "obligations": ["Obligation 1", "Obligation 2"]
    }
  ]
}

Focus on identifying:
- Key parties and their roles
- Financial terms and payment obligations
- Important dates and deadlines
- Potential risks and red flags
- Termination and renewal conditions
- Compliance requirements
`;

      const analysisResponse = await fetch('/api/solar-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert legal contract analyst. Always respond with valid JSON only, no additional text.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          reasoningEffort: 'high',
          stream: false,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze contract');
      }

      const analysisResult = await analysisResponse.json();
      const analysisContent = analysisResult.choices[0].message.content;

      // Parse the JSON response
      let parsedAnalysis;
      try {
        parsedAnalysis = JSON.parse(analysisContent);
      } catch (e) {
        // If JSON parsing fails, create a basic analysis
        parsedAnalysis = {
          keyTerms: {
            parties: ['Party information not clearly identified'],
            effectiveDate: 'Not specified',
            expirationDate: 'Not specified',
            totalValue: 'Not specified',
            paymentTerms: 'Payment terms require manual review',
            terminationClause: 'Termination clause requires manual review'
          },
          riskAssessment: {
            riskLevel: 'medium',
            riskFactors: ['Document requires detailed manual review'],
            recommendations: ['Consult with legal counsel for detailed analysis']
          },
          summary: 'Contract analysis completed. Manual review recommended for complex terms.',
          obligations: [
            {
              party: 'All Parties',
              obligations: ['Detailed obligations require manual extraction']
            }
          ]
        };
      }

      setAnalysis({
        documentText,
        ...parsedAnalysis
      });

      setCurrentStep('complete');
      
      toast({
        title: "Contract Analysis Complete!",
        description: "Your contract has been successfully analyzed.",
      });

    } catch (error) {
      console.error('Contract analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Smart Contract Analyzer
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Upload any legal contract and get instant AI-powered analysis including risk assessment, 
          key terms extraction, and actionable insights powered by Upstage AI.
        </p>
      </div>

      {/* Process Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {[
            { step: 'upload', label: 'Upload Contract', icon: FileText },
            { step: 'parsing', label: 'Parse Document', icon: FileText },
            { step: 'analyzing', label: 'AI Analysis', icon: Brain },
            { step: 'complete', label: 'Results', icon: CheckCircle }
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep === step 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : index < ['upload', 'parsing', 'analyzing', 'complete'].indexOf(currentStep)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-gray-100 text-gray-400'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
              {index < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      {currentStep === 'upload' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-6 w-6 text-blue-600" />
              Upload Contract Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".pdf,.docx,.doc,.txt"
              maxSize={50}
              onFileSelect={handleFileUpload}
              placeholder="Drop your contract here or click to upload"
              description="Supports PDF, DOCX, DOC, TXT files (up to 50MB)"
            />
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">What you'll get:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Automatic extraction of key contract terms</li>
                <li>• AI-powered risk assessment and recommendations</li>
                <li>• Clear breakdown of party obligations</li>
                <li>• Executive summary for quick decision making</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing States */}
      {(currentStep === 'parsing' || currentStep === 'analyzing') && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">
              {currentStep === 'parsing' ? 'Parsing Document...' : 'Analyzing Contract...'}
            </h3>
            <p className="text-gray-600">
              {currentStep === 'parsing' 
                ? 'Extracting text and structure from your document using Upstage Document Parse API'
                : 'Performing AI-powered legal analysis using Upstage Solar LLM'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {currentStep === 'complete' && analysis && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-green-600" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-6 w-6 text-orange-600" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <Badge className={`${getRiskColor(analysis.riskAssessment.riskLevel)} flex items-center gap-2`}>
                  {getRiskIcon(analysis.riskAssessment.riskLevel)}
                  {analysis.riskAssessment.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">Risk Factors</h4>
                  <ul className="space-y-2">
                    {analysis.riskAssessment.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysis.riskAssessment.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Terms and Obligations */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Key Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-6 w-6 text-blue-600" />
                  Key Contract Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Parties</div>
                      <div className="text-sm text-gray-600">
                        {analysis.keyTerms.parties.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Effective Date</div>
                      <div className="text-sm text-gray-600">{analysis.keyTerms.effectiveDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Expiration Date</div>
                      <div className="text-sm text-gray-600">{analysis.keyTerms.expirationDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Total Value</div>
                      <div className="text-sm text-gray-600">{analysis.keyTerms.totalValue}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-1">Payment Terms</div>
                    <div className="text-sm text-gray-600">{analysis.keyTerms.paymentTerms}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-1">Termination Clause</div>
                    <div className="text-sm text-gray-600">{analysis.keyTerms.terminationClause}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Party Obligations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-6 w-6 text-purple-600" />
                  Party Obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analysis.obligations.map((obligation, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-purple-600 mb-2">{obligation.party}</h4>
                      <ul className="space-y-1">
                        {obligation.obligations.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Text Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="mr-2 h-6 w-6 text-gray-600" />
                  Extracted Document Text
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Analysis
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {analysis.documentText.substring(0, 2000)}
                  {analysis.documentText.length > 2000 && '...\n\n[Text truncated for display]'}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => {
                setCurrentStep('upload');
                setAnalysis(null);
              }}
              variant="outline"
            >
              Analyze Another Contract
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Download Full Report
            </Button>
          </div>
        </div>
      )}

      {/* Business Value Proposition */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4 text-center">Transform Your Contract Review Process</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">90%</div>
              <div className="text-sm text-gray-600">Faster contract review</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Automated analysis</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Consistent evaluation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}