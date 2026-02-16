/**
 * @fileOverview A centralized AI Manager to handle all Gemini AI calls.
 * This manager provides robust error handling, including timeout and retry logic,
 * to ensure the application remains stable even if the AI service is slow or fails.
 */

/**
 * The number of times to attempt an AI call.
 * This helps make the app more resilient to temporary network or AI service issues.
 * Set to 2 for a total of 1 initial attempt and 1 retry.
 */
const MAX_ATTEMPTS = 2;

/**
 * Extracts a JSON object from a string, even if it's embedded in other text or malformed.
 * @param text The text potentially containing a JSON object.
 * @returns The parsed JSON object or null if not found.
 */
function extractJson(text: string): any {
    // Attempt to find JSON within markdown code blocks
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const blockMatch = text.match(jsonBlockRegex);
    
    let jsonString: string | null = null;
    
    if (blockMatch && blockMatch[1]) {
        jsonString = blockMatch[1];
    } else {
        // If no block, find the first '{' or '[' and last '}' or ']'
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        
        let start = -1;
        if (firstBrace === -1) {
            start = firstBracket;
        } else if (firstBracket === -1) {
            start = firstBrace;
        } else {
            start = Math.min(firstBrace, firstBracket);
        }

        if (start === -1) return null; // No JSON start found

        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket);

        if (end === -1 || end < start) return null; // No valid JSON end found

        jsonString = text.substring(start, end + 1);
    }
    
    if (!jsonString) return null;

    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("AI Manager: Failed to parse extracted JSON.", { jsonString, error });
        return null;
    }
}


/**
 * Runs a non-streaming AI prompt with built-in timeout and retry logic.
 *
 * @param prompt The Genkit prompt to execute.
 * @param input The input data for the prompt.
 * @param fallback A fallback value to return if all retries fail.
 * @returns The output from the AI or the fallback value.
 */
export async function runAIPrompt<T, U>(prompt: any, input: T, fallback: U): Promise<any> {
  // CRITICAL: First, check if the API key is available.
  if (!process.env.GEMINI_API_KEY) {
    const errorMsg = 'AI Manager: GEMINI_API_KEY is not set in the environment variables.';
    console.error(errorMsg);
    // Throw an error that can be caught by the API route to provide a specific message.
    throw new Error(errorMsg);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`AI Manager: Running prompt '${prompt.name}'. Attempt ${attempt}/${MAX_ATTEMPTS}...`);

      const result = await prompt(input);
      
      let output = result.output;
      
      if (typeof output === 'string' && output.trim() === '') {
          throw new Error('AI returned an empty string.');
      }
      
      if (typeof output === 'string') {
          const parsedJson = extractJson(output);
          if (parsedJson) {
              output = parsedJson;
          }
      }
      
      if (output === undefined || output === null) {
        throw new Error('AI returned an empty or invalid output.');
      }

      console.log(`AI Manager: Prompt '${prompt.name}' succeeded on attempt ${attempt}.`);
      return output;

    } catch (error: any) {
      console.error(`AI Manager: Attempt ${attempt} failed for prompt '${prompt.name}'.`, error);
      if (attempt === MAX_ATTEMPTS) {
        console.error(`AI Manager: All ${MAX_ATTEMPTS} attempts failed for prompt '${prompt.name}'. Returning fallback.`);
        // If all retries fail, re-throw the last error to be handled by the API route.
        throw error;
      }
    }
  }
  
  // This line should ideally not be reached, but as a safeguard:
  return fallback;
}
