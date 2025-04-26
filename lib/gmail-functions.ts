import { searchEmails, getEmailDetails } from './gmail-api';

// Define types for our functions
export interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  labelIds: string[];
}

export interface EmailDetails {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  headers: {
    subject: string;
    from: string;
    to: string;
    date: string;
  };
  body: string;
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    partId: string;
  }>;
}

export interface SearchMailsResponse {
  emails: EmailSummary[];
  count: number;
  total_estimate: number;
}

export interface ReadMailResponse {
  email: EmailDetails;
}

export interface ErrorResponse {
  error: string;
}

type FunctionResponse<T> = T | ErrorResponse;

/**
 * Handlers for Gmail-related OpenAI functions
 */
export const gmailFunctions = {
  /**
   * Search for emails using Gmail's search syntax
   */
  search_mails: async (args: { query: string; max_results?: number }): Promise<FunctionResponse<SearchMailsResponse>> => {
    try {
      const { query, max_results } = args;
      const result = await searchEmails(query, max_results);
      
      return {
        emails: result.emails,
        count: result.emails.length,
        total_estimate: result.resultSizeEstimate
      };
    } catch (error: any) {
      return {
        error: error.message || 'An error occurred while searching emails',
      };
    }
  },

  /**
   * Get detailed information about a specific email
   */
  read_mail: async (args: { message_id: string }): Promise<FunctionResponse<ReadMailResponse>> => {
    try {
      const { message_id } = args;
      const email = await getEmailDetails(message_id);
      
      return {
        email
      };
    } catch (error: any) {
      return {
        error: error.message || 'An error occurred while reading the email',
      };
    }
  }
};

/**
 * Handler for all Gmail API functions
 * 
 * This function can be integrated with OpenAI's function calling
 */
export async function handleGmailFunctionCall(
  functionName: string, 
  args: any
): Promise<FunctionResponse<SearchMailsResponse> | FunctionResponse<ReadMailResponse>> {
  // Check if the function exists in our handlers
  if (functionName in gmailFunctions) {
    // Call the appropriate function handler
    const handler = gmailFunctions[functionName as keyof typeof gmailFunctions];
    return await handler(args);
  }
  
  // Return an error if the function is not supported
  return {
    error: `Function '${functionName}' is not supported`,
  };
} 