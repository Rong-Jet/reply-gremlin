const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to token files
const homeDir = os.homedir();
const tokenDir = path.join(homeDir, '.gmail-mcp');
const currentTokenPath = path.join(tokenDir, 'credentials.json');
const newTokenPath = path.join(tokenDir, 'gmail-token.json');

async function moveToken() {
  try {
    console.log('Setting up Gmail token...');
    
    // Check if the current token file exists
    if (fs.existsSync(currentTokenPath)) {
      try {
        const currentContent = fs.readFileSync(currentTokenPath, 'utf8');
        const currentData = JSON.parse(currentContent);
        
        // Check if it looks like a token file (has access_token and refresh_token)
        if (currentData.access_token && currentData.refresh_token) {
          console.log('Found token in credentials.json, moving to gmail-token.json...');
          
          // Save to the new token location
          fs.writeFileSync(newTokenPath, currentContent);
          console.log('Token saved to:', newTokenPath);
          
          console.log('Setup complete!');
          return true;
        } else {
          console.log('File doesn\'t appear to be a token. No changes made.');
          return false;
        }
      } catch (err) {
        console.error('Error processing token file:', err);
        return false;
      }
    } else {
      console.log('No credentials.json token file found. No changes made.');
      return false;
    }
  } catch (error) {
    console.error('Error setting up token:', error);
    return false;
  }
}

// Run the setup
moveToken(); 