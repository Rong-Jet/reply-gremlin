import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

// Authentication constants
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];
const TOKEN_PATH = path.join(process.cwd(), 'gmail-token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

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
    // Load client secrets from a local file
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    // Create OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    // Check if we have previously stored a token
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    }
    
    // If no stored token, get a new one
    return await getNewToken(oAuth2Client);
  } catch (error) {
    console.error('Error loading client secret file or getting auth token:', error);
    throw error;
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
    const attachments = [];
    
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