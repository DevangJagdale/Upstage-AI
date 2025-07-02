// API client with fallback for static deployment
export class APIClient {
  private baseUrl: string;
  private isStatic: boolean;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    this.isStatic = !this.baseUrl || window.location.hostname.includes('netlify');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    if (this.isStatic) {
      // Return mock data for static deployment
      return this.getMockResponse(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  private getMockResponse(endpoint: string) {
    // Mock responses for demo purposes
    if (endpoint.includes('/document-parse')) {
      return Promise.resolve({
        elements: [
          {
            id: 1,
            category: 'text',
            content: {
              html: '<p>This is a mock response for static deployment demo.</p>',
              markdown: 'This is a mock response for static deployment demo.',
              text: 'This is a mock response for static deployment demo.'
            },
            page: 1
          }
        ]
      });
    }

    if (endpoint.includes('/information-extract')) {
      return Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              invoice_number: "DEMO-001",
              total_amount: 1234.56,
              vendor_name: "Demo Company"
            })
          }
        }]
      });
    }

    if (endpoint.includes('/solar-chat')) {
      return Promise.resolve({
        choices: [{
          message: {
            content: "This is a mock response from Solar LLM for the static demo. In a real deployment, this would connect to the Upstage API."
          }
        }]
      });
    }

    return Promise.resolve({ message: 'Mock response for static demo' });
  }
}

export const apiClient = new APIClient();