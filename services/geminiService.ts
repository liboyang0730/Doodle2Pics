
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService;
  private ai: GoogleGenAI;

  private constructor() {
    // Initialize GoogleGenAI with the API key from environment variables directly as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Transforms a sketch into a fully realized image based on a prompt.
   */
  async transformSketch(base64Image: string, prompt: string): Promise<string | null> {
    try {
      // Remove the data:image/png;base64, prefix
      const base64Data = base64Image.split(',')[1];
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            },
            {
              text: `This is a simple sketch. Please transform it into a high-quality, professional digital artwork. Style: ${prompt}. Keep the basic composition and shapes of the original sketch but add realistic textures, lighting, and details.`,
            },
          ],
        },
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Find the image part as response may contain both image and text parts
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  /**
   * Interprets what is in the sketch.
   */
  async describeSketch(base64Image: string): Promise<string> {
    try {
      const base64Data = base64Image.split(',')[1];
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            },
            { text: "What did I draw in this sketch? Give a short, creative description in Chinese." },
          ],
        },
      });
      // Correctly access .text property from GenerateContentResponse
      return response.text || "我无法理解这幅画。";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "识别出错了。";
    }
  }
}
