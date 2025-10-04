/**
 * Airia API Client for integrating with Airia agents
 */

export interface AiriaAgent {
  name: string;
  guid: string;
  endpoint: string;
}

export interface AiriaResponse {
  success: boolean;
  data?: any;
  error?: string;
  agent_name: string;
  execution_time?: number;
}

export interface PDFToTextResult {
  success: boolean;
  text?: string;
  error?: string;
  filename: string;
}

// Airia agents configuration
// Each agent uses the PipelineExecution API endpoint with its GUID
export const AIRIA_AGENTS: AiriaAgent[] = [
  {
    name: "Route_Validator",
    guid: "71c23734-2a91-4345-bcdf-887717c73769",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/71c23734-2a91-4345-bcdf-887717c73769"
  },
  {
    name: "Value_validator",
    guid: "07a2107e-9c9b-4cf1-b91c-85d6b07963d9",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/07a2107e-9c9b-4cf1-b91c-85d6b07963d9"
  },
  {
    name: "Regulatory_compliance_checker",
    guid: "cff07b49-dd72-4941-ab48-7da1907b6f4b",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/cff07b49-dd72-4941-ab48-7da1907b6f4b"
  },
  {
    name: "Supplier_History_Analyzer",
    guid: "5fdf36fa-632a-4154-ba92-d182bf93cb72",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/5fdf36fa-632a-4154-ba92-d182bf93cb72"
  },
  {
    name: "Risk Scorer_&_Prioritizer",
    guid: "bb5aa7e3-a134-4866-98d7-74c8b311fc53",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/bb5aa7e3-a134-4866-98d7-74c8b311fc53"
  },
  {
    name: "Document_consistency_checker",
    guid: "f0265e05-d232-45f7-aab5-c0bc2b870171",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/f0265e05-d232-45f7-aab5-c0bc2b870171"
  },
  {
    name: "hs_code_validator",
    guid: "09d34238-c58a-41ff-8034-7f9ebe3e1d73",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/09d34238-c58a-41ff-8034-7f9ebe3e1d73"
  },
  {
    name: "Origin_validator",
    guid: "f182b7d5-5da3-4a90-b535-122e88f96087",
    endpoint: "https://api.airia.ai/v2/PipelineExecution/f182b7d5-5da3-4a90-b535-122e88f96087"
  }
];

class AiriaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_AIRIA_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_AIRIA_BASE_URL || 'https://api.airia.ai';
  }

  /**
   * Convert PDF to text using client-side processing
   */
  async convertPDFToText(file: File): Promise<PDFToTextResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pdf-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to convert PDF: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        text: result.text,
        filename: file.name
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: file.name
      };
    }
  }

  /**
   * Send text input to a specific Airia agent
   */
  async sendToAgent(agentGuid: string, textInput: string): Promise<AiriaResponse> {
    const startTime = Date.now();
    const agent = AIRIA_AGENTS.find(a => a.guid === agentGuid);
    const agentName = agent?.name || 'Unknown';

    try {
      if (!agent) {
        throw new Error(`Agent with GUID ${agentGuid} not found`);
      }

      if (!this.apiKey) {
        throw new Error('API key not configured. Please set NEXT_PUBLIC_AIRIA_API_KEY in .env.local');
      }

      // Use the agent's PipelineExecution endpoint
      const endpoint = agent.endpoint || `${this.baseUrl}/v2/PipelineExecution/${agentGuid}`;

      console.log(`[Airia Client] Calling agent: ${agentName}`);
      console.log(`[Airia Client] Endpoint: ${endpoint}`);
      console.log(`[Airia Client] Input length: ${textInput.length} chars`);

      // Airia PipelineExecution API expects userId, userInput, and asyncOutput
      const requestBody = {
        userId: process.env.NEXT_PUBLIC_AIRIA_USER_ID || 'default-user',
        userInput: textInput,
        asyncOutput: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey, // Note: uppercase KEY
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log(`[Airia Client] Response status: ${response.status}`);
      console.log(`[Airia Client] Response body:`, responseText.substring(0, 200));

      if (!response.ok) {
        throw new Error(`Airia API error (${response.status}): ${responseText}`);
      }

      const data = JSON.parse(responseText);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: data,
        agent_name: agentName,
        execution_time: executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`[Airia Client] Error calling agent ${agentName}:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        agent_name: agentName,
        execution_time: executionTime
      };
    }
  }

  /**
   * Process text through all agents and return results
   */
  async processWithAllAgents(textInput: string): Promise<AiriaResponse[]> {
    const promises = AIRIA_AGENTS.map(agent => 
      this.sendToAgent(agent.guid, textInput)
    );

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Promise rejected',
          agent_name: AIRIA_AGENTS[index]?.name || 'Unknown'
        };
      }
    });
  }

  /**
   * Process text through specific agents
   */
  async processWithSpecificAgents(textInput: string, agentGuids: string[]): Promise<AiriaResponse[]> {
    const promises = agentGuids.map(guid => 
      this.sendToAgent(guid, textInput)
    );

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Promise rejected',
          agent_name: AIRIA_AGENTS.find(a => a.guid === agentGuids[index])?.name || 'Unknown'
        };
      }
    });
  }

  /**
   * Get agent information by GUID
   */
  getAgentByGuid(guid: string): AiriaAgent | undefined {
    return AIRIA_AGENTS.find(agent => agent.guid === guid);
  }

  /**
   * Get all available agents
   */
  getAllAgents(): AiriaAgent[] {
    return AIRIA_AGENTS;
  }
}

// Export singleton instance
export const airiaClient = new AiriaClient();

// Export types for use in components
export type { AiriaClient };
