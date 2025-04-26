import { 
  handleGmailFunctionCall, 
  SearchMailsResponse, 
  ReadMailResponse,
  ErrorResponse
} from '../lib/gmail-functions';

// Type guard to check if response is an error
function isErrorResponse(response: any): response is ErrorResponse {
  return 'error' in response;
}

// Type guard for search response
function isSearchMailsResponse(response: any): response is SearchMailsResponse {
  return 'emails' in response && Array.isArray(response.emails);
}

// Type guard for read mail response
function isReadMailResponse(response: any): response is ReadMailResponse {
  return 'email' in response && typeof response.email === 'object';
}

/**
 * Example usage of Gmail API functions
 */
async function example() {
  try {
    console.log('Searching for unread emails...');
    const searchResult = await handleGmailFunctionCall('search_mails', {
      query: 'is:unread',
      max_results: 5
    });
    
    // Check if we have an error
    if (isErrorResponse(searchResult)) {
      console.error('Error searching emails:', searchResult.error);
      return;
    }
    
    if (isSearchMailsResponse(searchResult)) {
      console.log(`Found ${searchResult.emails.length} unread emails:`);
      console.log(JSON.stringify(searchResult, null, 2));
      
      // If we found any emails, read the first one
      if (searchResult.emails && searchResult.emails.length > 0) {
        const firstEmail = searchResult.emails[0];
        console.log(`\nReading email with ID: ${firstEmail.id}`);
        
        const emailDetails = await handleGmailFunctionCall('read_mail', {
          message_id: firstEmail.id
        });
        
        if (isErrorResponse(emailDetails)) {
          console.error('Error reading email:', emailDetails.error);
          return;
        }
        
        if (isReadMailResponse(emailDetails)) {
          console.log('Email details:');
          console.log(JSON.stringify(emailDetails, null, 2));
        }
      }
    }
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
example().catch(console.error); 