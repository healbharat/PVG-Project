
import { GoogleGenAI } from "@google/genai";

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      const data = result.split(',')[1];
      if (!mimeType || !data) {
        reject(new Error("Failed to parse base64 string."));
        return;
      }
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeImage = async (imageFile: File): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  
  const { mimeType, data } = await fileToBase64(imageFile);

  const imagePart = {
    inlineData: {
      mimeType,
      data,
    },
  };

  const textPart = {
    text: `Analyze this image. If it is a doctor's prescription or medical receipt, meticulously transcribe all text. Detail medication names, dosages (e.g., 500mg), frequency (e.g., 'once a day', 'twice daily'), and quantity. Structure the output clearly, listing each medication and its instructions separately. If the image is not a prescription, provide a detailed description of its contents.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    
    return response.text;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
};
