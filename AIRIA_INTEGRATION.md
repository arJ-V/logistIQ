# Airia Integration Guide

This document explains how to configure and use the Airia agents integration in LogistIQ.

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Airia API Configuration
NEXT_PUBLIC_AIRIA_API_KEY=your_airia_api_key_here
NEXT_PUBLIC_AIRIA_BASE_URL=https://api.airia.com

# DeepL Translation (existing)
DEEPL_API_KEY=your_deepl_api_key_here
```

### 2. Obtaining Airia API Credentials

1. **Generate an API Key**:
   - In Airia, go to Settings > API Keys
   - Click "New API Key"
   - Name it (e.g., "LogistIQ Integration")
   - Define its scope (full access recommended)
   - Click "Create"
   - Store the API key securely

2. **Get Agent Connection Info**:
   - For each agent, navigate to the agent in Airia
   - Click the ellipsis (`...`) next to the agent
   - Select "Connection Info"
   - Note the API endpoint and GUID

### 3. Configure Agent Endpoints (Optional)

If your agents have specific endpoints, update the `AIRIA_AGENTS` array in `/lib/airia-client.ts`:

```typescript
export const AIRIA_AGENTS: AiriaAgent[] = [
  {
    name: "Route_Validator",
    guid: "71c23734-2a91-4345-bcdf-887717c73769",
    endpoint: "https://your-specific-endpoint.com/route-validator" // Optional
  },
  // ... other agents
];
```

## How It Works

### 1. PDF Processing Flow

1. User uploads PDF documents through the create shipment modal
2. PDFs are converted to text using the `/api/pdf-to-text` endpoint
3. Extracted text is sent to Airia agents for analysis
4. Results are displayed in the validation and analysis pages

### 2. Agent Processing

The system processes documents through all 8 Airia agents:

- **Route_Validator**: Validates shipping routes and logistics
- **Value_validator**: Checks declared values and pricing
- **Regulatory_compliance_checker**: Ensures regulatory compliance
- **Supplier_History_Analyzer**: Analyzes supplier performance history
- **Risk Scorer_&_Prioritizer**: Calculates risk scores and priorities
- **Document_consistency_checker**: Checks document consistency
- **hs_code_validator**: Validates HS codes and classifications
- **Origin_validator**: Verifies country of origin claims

### 3. Results Processing

Agent results are processed and categorized into:

- **Critical Issues**: High-priority problems requiring immediate action
- **Warnings**: Potential issues that should be reviewed
- **Recommendations**: Optimization opportunities and cost savings

## Usage

### In the Validation Page (`/validate/[id]`)

The validation page automatically:
1. Processes uploaded documents through all agents
2. Shows real-time processing status
3. Displays agent progress and completion
4. Navigates to analysis page when complete

### In the Analysis Page (`/analysis/[id]`)

The analysis page displays:
1. Risk assessment based on agent results
2. Categorized issues and warnings
3. Cost savings recommendations
4. Action items for resolution

### Manual Agent Processing

You can also process documents manually using the `useAiriaAgents` hook:

```typescript
import { useAiriaAgents } from '@/hooks/use-airia-agents'

const { processWithAllAgents, processSingleAgent, results } = useAiriaAgents()

// Process with all agents
await processWithAllAgents('document text content')

// Process with specific agent
await processSingleAgent('agent-guid-here', 'document text content')
```

## Error Handling

The system includes comprehensive error handling:

- Network errors are caught and displayed
- Agent failures are logged and shown to users
- PDF processing errors are handled gracefully
- Fallback behavior for missing or invalid data

## Customization

### Adding New Agents

1. Add the agent to the `AIRIA_AGENTS` array in `/lib/airia-client.ts`
2. Update the icon and color mappings in the validation page
3. Ensure the agent name matches the Airia configuration

### Modifying Result Processing

Update the result processing logic in `/app/analysis/[id]/page.tsx` to handle different response formats or add new categorization rules.

## Troubleshooting

### Common Issues

1. **API Key Not Working**:
   - Verify the API key is correctly set in environment variables
   - Check that the key has the necessary permissions
   - Ensure the key is not expired

2. **Agent Not Responding**:
   - Verify the agent GUID is correct
   - Check the agent endpoint configuration
   - Ensure the agent is active in Airia

3. **PDF Processing Fails**:
   - Verify the PDF file is not corrupted
   - Check that the file is a valid PDF format
   - Ensure the file size is within limits

### Debug Mode

Enable debug logging by adding to your environment:

```env
NEXT_PUBLIC_DEBUG_AIRIA=true
```

This will log detailed information about agent communications and responses.

## Security Considerations

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys regularly

2. **Data Privacy**:
   - Ensure uploaded documents are processed securely
   - Consider data retention policies
   - Implement proper access controls

## Support

For issues with the Airia integration:

1. Check the browser console for error messages
2. Verify environment configuration
3. Test with a simple document first
4. Contact support with specific error details
