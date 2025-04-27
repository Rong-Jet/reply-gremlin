# reply-gremlin
Email handling voice assistant that helps reply to and organise emails, all in a real-time conversational experience.

## How to use

### Running the application

1. **Set up the OpenAI API:**

   - If you're new to the OpenAI API, [sign up for an account](https://platform.openai.com/signup).
   - Follow the [Quickstart](https://platform.openai.com/docs/quickstart) to retrieve your API key.

2. **Clone the Repository:**

   ```bash
   git clone https://github.com/Rong-Jet/reply-gremlin.git
   ```

3. **Set your API key:**

   2 options:

   - Set the `OPENAI_API_KEY` environment variable [globally in your system](https://platform.openai.com/docs/quickstart#create-and-export-an-api-key)
   - Set the `OPENAI_API_KEY` environment variable in the project:
     Create a `.env` file at the root of the project and add the following line:
     ```bash
     OPENAI_API_KEY=<your_api_key>
     ```

4. **Setup: Backend**
   
   [Backend README](backend-python/README.md)
  
7. **Setup: Frontend**
   Navigate to the project directory and run:

   ```bash
   npm install --legacy-peer-deps
   ```

8. **Run the app:**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).
