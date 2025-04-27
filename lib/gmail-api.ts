import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Authentication constants
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];
const TOKEN_PATH = path.join(os.homedir(), '.gmail-mcp', 'gmail-token.json');
const CREDENTIALS_PATH = path.join(os.homedir(), '.gmail-mcp', 'gcp-oauth.keys.json');

/**
 * Get and store new token after prompting for user authorization
 */
async function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  
  console.log('Authorize this app by visiting this URL:', authUrl);
  console.log('After authorization, copy the code from the browser and enter it below:');
  
  // This is a simplified version - in a real implementation, you'd want to use a proper input method
  // For example: const code = await promptForCode();
  // Here we're just waiting for manual input
  const code = await new Promise<string>((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question('Enter the code from the browser: ', (code: string) => {
      readline.close();
      resolve(code);
    });
  });

  // Get the token using the code
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  // Ensure the token directory exists
  const tokenDir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(tokenDir)) {
    console.log(`Creating token directory: ${tokenDir}`);
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  
  // Store the token for future use
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);
  
  return oAuth2Client;
}

/**
 * Load or create an OAuth2 client
 */
export async function getAuthClient(): Promise<OAuth2Client> {
  try {
    console.log('Looking for credentials at:', CREDENTIALS_PATH);
    
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('Credentials file not found at:', CREDENTIALS_PATH);
      throw new Error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
    }
    
    // Load client secrets from a local file
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    console.log('Credentials file found, parsing content');
    
    const credentials = JSON.parse(content);
    console.log('Credential keys:', Object.keys(credentials));
    
    // Handle different credential formats
    let clientId, clientSecret, redirectUri;
    
    if (credentials.installed) {
      clientId = credentials.installed.client_id;
      clientSecret = credentials.installed.client_secret;
      redirectUri = credentials.installed.redirect_uris?.[0] || 'http://localhost';
      console.log('Using "installed" credentials format');
    } else if (credentials.web) {
      clientId = credentials.web.client_id;
      clientSecret = credentials.web.client_secret;
      redirectUri = credentials.web.redirect_uris?.[0] || 'http://localhost';
      console.log('Using "web" credentials format');
    } else if (credentials.client_id && credentials.client_secret) {
      // Direct format with client_id and client_secret at the root
      clientId = credentials.client_id;
      clientSecret = credentials.client_secret;
      redirectUri = credentials.redirect_uri || 'http://localhost';
      console.log('Using direct credential format');
    } else {
      console.error('Unrecognized credential format:', Object.keys(credentials));
      throw new Error('Unrecognized credential format. Expected "installed", "web", or direct credentials.');
    }
    
    if (!clientId || !clientSecret) {
      throw new Error('Missing required credentials (client_id or client_secret)');
    }
    
    console.log('Creating OAuth2 client with credentials');
    // Create OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    
    // Check if we have previously stored a token
    if (fs.existsSync(TOKEN_PATH)) {
      console.log('Using token from:', TOKEN_PATH);
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    }
    
    console.log('No token found, initiating new authentication flow');
    // If no stored token, get a new one
    return await getNewToken(oAuth2Client);
  } catch (error) {
    console.error('Error loading client secret file or getting auth token:', error);
    throw error;
  }
}

/**
 * Verify credentials are accessible and properly formatted
 * Useful for diagnostics
 */
export async function verifyCredentials(): Promise<{valid: boolean; info: any}> {
  try {
    console.log('Verifying credentials at:', CREDENTIALS_PATH);
    
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('Credentials file not found at:', CREDENTIALS_PATH);
      return {valid: false, info: {error: 'Credentials file not found', path: CREDENTIALS_PATH}};
    }
    
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const contentPreview = content.substring(0, 100) + '...';
    console.log('Credentials file content (first 100 chars):', contentPreview);
    
    const credentials = JSON.parse(content);
    const credentialKeys = Object.keys(credentials);
    console.log('Credential keys:', credentialKeys);
    
    if (credentials.installed) {
      const installedKeys = Object.keys(credentials.installed);
      console.log('Found "installed" credentials format with keys:', installedKeys);
      const hasRequired = !!credentials.installed.client_id && !!credentials.installed.client_secret;
      return {
        valid: hasRequired, 
        info: {
          format: 'installed',
          keys: installedKeys,
          hasClientId: !!credentials.installed.client_id,
          hasClientSecret: !!credentials.installed.client_secret,
          hasRedirectUris: Array.isArray(credentials.installed.redirect_uris) && credentials.installed.redirect_uris.length > 0
        }
      };
    } else if (credentials.web) {
      const webKeys = Object.keys(credentials.web);
      console.log('Found "web" credentials format with keys:', webKeys);
      const hasRequired = !!credentials.web.client_id && !!credentials.web.client_secret;
      return {
        valid: hasRequired, 
        info: {
          format: 'web',
          keys: webKeys,
          hasClientId: !!credentials.web.client_id,
          hasClientSecret: !!credentials.web.client_secret,
          hasRedirectUris: Array.isArray(credentials.web.redirect_uris) && credentials.web.redirect_uris.length > 0
        }
      };
    } else if (credentials.client_id && credentials.client_secret) {
      console.log('Found direct credential format');
      return {
        valid: true, 
        info: {
          format: 'direct',
          keys: credentialKeys
        }
      };
    } else {
      console.error('Unrecognized credential format');
      return {
        valid: false, 
        info: {
          error: 'Unrecognized credential format',
          keys: credentialKeys,
          content: contentPreview
        }
      };
    }
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return {
      valid: false, 
      info: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Search emails in Gmail
 */
export async function searchEmails(query: string, maxResults: number = 10) {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });
    
    // List messages matching the query
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
    });
    
    const messages = response.data.messages || [];
    
    // Get basic details for each message
    const emailList = await Promise.all(messages.map(async (message) => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });
      
      const headers = msg.data.payload?.headers || [];
      
      const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find(header => header.name === 'Date')?.value || 'Unknown Date';
      
      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        date,
        snippet: msg.data.snippet || '',
        labelIds: msg.data.labelIds || [],
      };
    }));
    
    return {
      emails: emailList,
      resultSizeEstimate: response.data.resultSizeEstimate,
    };
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

/**
 * Get email details including body content
 */
export async function getEmailDetails(messageId: string) {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Get the full message
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    
    const headers = message.data.payload?.headers || [];
    const parts = message.data.payload?.parts || [];
    
    // Extract email details
    const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
    const to = headers.find(header => header.name === 'To')?.value || 'Unknown Recipient';
    const date = headers.find(header => header.name === 'Date')?.value || 'Unknown Date';
    
    // Extract the email body
    let body = '';
    
    // If there's a body in the payload
    if (message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    } 
    // Otherwise, try to find body in parts
    else if (parts.length > 0) {
      // Look for text/plain or text/html parts
      const textPart = parts.find(part => part.mimeType === 'text/plain');
      const htmlPart = parts.find(part => part.mimeType === 'text/html');
      
      // Prefer plain text if available
      if (textPart && textPart.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      } 
      // Otherwise use HTML
      else if (htmlPart && htmlPart.body?.data) {
        body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
      }
    }
    
    // Get attachments if any
    const attachments: Array<{
      id: string | undefined;
      filename: string;
      mimeType: string;
      size: number;
      partId: string;
    }> = [];
    
    const processAttachments = (parts: any[], path = '') => {
      if (!parts) return;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const partId = path ? `${path}.${i + 1}` : `${i + 1}`;
        
        if (part.filename && part.filename.length > 0) {
          attachments.push({
            id: part.body?.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body?.size || 0,
            partId,
          });
        }
        
        // Recursively process nested parts
        if (part.parts && part.parts.length > 0) {
          processAttachments(part.parts, partId);
        }
      }
    };
    
    processAttachments(parts);
    
    return {
      id: message.data.id,
      threadId: message.data.threadId,
      labelIds: message.data.labelIds || [],
      snippet: message.data.snippet || '',
      historyId: message.data.historyId,
      internalDate: message.data.internalDate,
      headers: {
        subject,
        from,
        to,
        date,
      },
      body,
      attachments,
    };
  } catch (error) {
    console.error('Error getting email details:', error);
    throw error;
  }
} 