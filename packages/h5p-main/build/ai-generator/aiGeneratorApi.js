"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createAiGeneratorRouter;
const express_1 = __importDefault(require("express"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// Initialize Anthropic client
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey ? new sdk_1.default({ apiKey: anthropicApiKey }) : null;
function createAiGeneratorRouter(h5pEditor) {
    const router = express_1.default.Router();
    router.post('/ai-generate', async (req, res) => {
        try {
            if (!anthropicApiKey || !anthropic) {
                throw new Error('ANTHROPIC_API_KEY environment variable not set');
            }
            const { prompt } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }
            console.log('Generating H5P content for prompt:', prompt);
            // Generate H5P content using Claude 3.5 Sonnet
            const aiResponse = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: `Create an H5P interactive content based on this idea: "${prompt}". 
                        
I need you to analyze what type of H5P content would be most appropriate for this idea and create the JSON structure needed to create it via the H5P API.

Here's what I need in your response:
1. A brief explanation of what type of H5P content you're creating and why it fits the request
2. The exact JSON structure I should submit to the /h5p/new endpoint, including:
   - library: The H5P content type with version (e.g., "H5P.MultiChoice 1.16")
   - params: The complete content-specific parameters including metadata and content definition

Common H5P content types include:
- H5P.MultiChoice (for multiple-choice questions)
- H5P.InteractiveVideo (for videos with interactive elements)
- H5P.Blanks (for fill-in-the-blanks exercises)
- H5P.DragQuestion (for drag and drop activities)
- H5P.TrueFalse (for true/false questions)
- H5P.Summary (for summary activities)
- H5P.QuestionSet (for collections of different question types)

Please format your response in this exact structure:
\`\`\`json
{
  "library": "H5P.ContentTypeNameHere MainVersionNumber.MinorVersionNumber",
  "params": {
    "metadata": {
      "title": "Title goes here",
      "license": "U"
    },
    "params": {
      // Content-specific parameters
    }
  }
}
\`\`\`

Don't include any explanations in your response, just the complete, valid JSON that's ready to be sent to the H5P API.`
                    }
                ]
            });
            const aiResponseContent = aiResponse.content[0].text;
            // Extract JSON from AI response
            let contentJson;
            const jsonMatch = aiResponseContent.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    contentJson = JSON.parse(jsonMatch[1]);
                }
                catch (parseError) {
                    console.error('Failed to parse JSON from AI response:', parseError);
                    return res.status(500).json({ error: 'Failed to generate valid H5P content' });
                }
            }
            else {
                console.error('No JSON found in AI response');
                return res.status(500).json({ error: 'Failed to generate valid H5P content structure' });
            }
            // Create H5P content using the generated JSON
            const contentId = await h5pEditor.saveOrUpdateContent(undefined, // Create new content
            contentJson.params, contentJson.library, req.user);
            return res.status(200).json({ contentId });
        }
        catch (error) {
            console.error('Error generating H5P content:', error);
            return res.status(500).json({ error: 'Failed to generate H5P content' });
        }
    });
    return router;
}
//# sourceMappingURL=aiGeneratorApi.js.map