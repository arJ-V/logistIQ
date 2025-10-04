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
export const AIRIA_AGENTS: AiriaAgent[] = [
  {
    name: "Route_Validator",
    guid: "71c23734-2a91-4345-bcdf-887717c73769",
    endpoint: ""
  },
  {
    name: "Value_validator", 
    guid: "07a2107e-9c9b-4cf1-b91c-85d6b07963d9",
    endpoint: ""
  },
  {
    name: "Regulatory_compliance_checker",
    guid: "cff07b49-dd72-4941-ab48-7da1907b6f4b", 
    endpoint: ""
  },
  {
    name: "Supplier_History_Analyzer",
    guid: "5fdf36fa-632a-4154-ba92-d182bf93cb72",
    endpoint: ""
  },
  {
    name: "Risk Scorer_&_Prioritizer",
    guid: "bb5aa7e3-a134-4866-98d7-74c8b311fc53",
    endpoint: ""
  },
  {
    name: "Document_consistency_checker", 
    guid: "f0265e05-d232-45f7-aab5-c0bc2b870171",
    endpoint: ""
  },
  {
    name: "hs_code_validator",
    guid: "09d34238-c58a-41ff-8034-7f9ebe3e1d73",
    endpoint: ""
  },
  {
    name: "Origin_validator",
    guid: "f182b7d5-5da3-4a90-b535-122e88f96087",
    endpoint: ""
  }
];

class AiriaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_AIRIA_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_AIRIA_BASE_URL || 'https://api.airia.com';
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
    try {
      const agent = AIRIA_AGENTS.find(a => a.guid === agentGuid);
      if (!agent) {
        throw new Error(`Agent with GUID ${agentGuid} not found`);
      }

      // Use the agent's specific endpoint if available, otherwise use the generic endpoint
      const endpoint = agent.endpoint || `${this.baseUrl}/agents/${agentGuid}/process`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: textInput,
          agent_guid: agentGuid
        }),
      });

      if (!response.ok) {
        throw new Error(`Airia API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        agent_name: agent.name,
        execution_time: data.execution_time
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agent_name: AIRIA_AGENTS.find(a => a.guid === agentGuid)?.name || 'Unknown'
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
