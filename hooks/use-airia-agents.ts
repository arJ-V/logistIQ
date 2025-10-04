import { useState, useCallback } from 'react';
import { airiaClient, AiriaResponse, PDFToTextResult } from '@/lib/airia-client';

export interface AgentProcessingState {
  isProcessing: boolean;
  currentAgent: string | null;
  progress: number;
  results: AiriaResponse[];
  errors: string[];
  completedAgents: string[];
}

export function useAiriaAgents() {
  const [state, setState] = useState<AgentProcessingState>({
    isProcessing: false,
    currentAgent: null,
    progress: 0,
    results: [],
    errors: [],
    completedAgents: []
  });

  const [pdfText, setPdfText] = useState<string>('');

  /**
   * Convert PDF to text
   */
  const convertPDFToText = useCallback(async (file: File): Promise<PDFToTextResult> => {
    try {
      const result = await airiaClient.convertPDFToText(file);
      if (result.success && result.text) {
        setPdfText(result.text);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, `PDF conversion failed: ${errorMessage}`]
      }));
      return {
        success: false,
        error: errorMessage,
        filename: file.name
      };
    }
  }, []);

  /**
   * Process text through all agents
   */
  const processWithAllAgents = useCallback(async (textInput?: string): Promise<AiriaResponse[]> => {
    const input = textInput || pdfText;
    
    if (!input.trim()) {
      const error = 'No text input provided';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, error]
      }));
      return [];
    }

    setState({
      isProcessing: true,
      currentAgent: null,
      progress: 0,
      results: [],
      errors: [],
      completedAgents: []
    });

    try {
      const results = await airiaClient.processWithAllAgents(input);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentAgent: null,
        progress: 100,
        results,
        completedAgents: results.map(r => r.agent_name)
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentAgent: null,
        errors: [...prev.errors, errorMessage]
      }));
      return [];
    }
  }, [pdfText]);

  /**
   * Process text through specific agents
   */
  const processWithSpecificAgents = useCallback(async (
    agentGuids: string[], 
    textInput?: string
  ): Promise<AiriaResponse[]> => {
    const input = textInput || pdfText;
    
    if (!input.trim()) {
      const error = 'No text input provided';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, error]
      }));
      return [];
    }

    setState({
      isProcessing: true,
      currentAgent: null,
      progress: 0,
      results: [],
      errors: [],
      completedAgents: []
    });

    try {
      const results = await airiaClient.processWithSpecificAgents(input, agentGuids);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentAgent: null,
        progress: 100,
        results,
        completedAgents: results.map(r => r.agent_name)
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentAgent: null,
        errors: [...prev.errors, errorMessage]
      }));
      return [];
    }
  }, [pdfText]);

  /**
   * Process a single agent
   */
  const processSingleAgent = useCallback(async (
    agentGuid: string, 
    textInput?: string
  ): Promise<AiriaResponse | null> => {
    const input = textInput || pdfText;
    
    if (!input.trim()) {
      const error = 'No text input provided';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, error]
      }));
      return null;
    }

    const agent = airiaClient.getAgentByGuid(agentGuid);
    if (!agent) {
      const error = `Agent with GUID ${agentGuid} not found`;
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, error]
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      currentAgent: agent.name,
      progress: 0
    }));

    try {
      const result = await airiaClient.sendToAgent(agentGuid, input);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentAgent: null,
        progress: 100,
        results: [...prev.results, result],
        completedAgents: [...prev.completedAgents, result.agent_name]
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentAgent: null,
        errors: [...prev.errors, errorMessage]
      }));
      return null;
    }
  }, [pdfText]);

  /**
   * Reset the processing state
   */
  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      currentAgent: null,
      progress: 0,
      results: [],
      errors: [],
      completedAgents: []
    });
    setPdfText('');
  }, []);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: []
    }));
  }, []);

  return {
    // State
    ...state,
    pdfText,
    
    // Actions
    convertPDFToText,
    processWithAllAgents,
    processWithSpecificAgents,
    processSingleAgent,
    resetState,
    clearErrors,
    
    // Utilities
    getAllAgents: airiaClient.getAllAgents,
    getAgentByGuid: airiaClient.getAgentByGuid
  };
}
