
import { GoogleGenAI, Type } from "@google/genai";

export interface Medicine {
  name: string;
  dosage: string | null;
  frequency: string | null;
  quantity: string | null;
  notes: string | null;
}

export interface PrescriptionData {
  patientName: string | null;
  medicines: Medicine[];
  otherInfo: string | null;
}

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

export const analyzeImage = async (imageFile: File): Promise<PrescriptionData> => {
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
    text: `Analyze the attached image.
    If it's a medical prescription, extract the following information in the specified JSON format:
    - The patient's full name.
    - A list of all medications. For each medication, extract its name, dosage (e.g., "500mg"), frequency (e.g., "twice a day"), quantity, and any specific notes. Only include properties if the information is clearly present for that medication.
    - Any other general notes or instructions from the prescription.
    
    If the image is NOT a prescription, provide a general description of the image content in the 'otherInfo' field, leave patientName as an empty string, and medicines as an empty array.`,
  };

  const prescriptionSchema = {
    type: Type.OBJECT,
    properties: {
        patientName: { type: Type.STRING, description: "The full name of the patient. Should be an empty string if not found." },
        medicines: {
            type: Type.ARRAY,
            description: "A list of prescribed medications. An empty array if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the medication." },
                    dosage: { type: Type.STRING, description: "The dosage of the medication (e.g., '500mg')." },
                    frequency: { type: Type.STRING, description: "How often to take the medication (e.g., 'Twice a day')." },
                    quantity: { type: Type.STRING, description: "The total quantity of the medication prescribed." },
                    notes: { type: Type.STRING, description: "Any other notes or instructions for this specific medication." },
                },
                required: ["name"]
            }
        },
        otherInfo: { type: Type.STRING, description: "Any other transcribed text, general notes from the prescription, or a description of the image if it's not a prescription." }
    },
    required: ["patientName", "medicines", "otherInfo"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionSchema,
      },
    });
    
    const jsonResponse = response.text.trim();
    return JSON.parse(jsonResponse) as PrescriptionData;

  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    if (error.message.includes('JSON')) {
        throw new Error("Failed to parse the response from the AI model. The format might be incorrect.");
    }
    throw new Error("Failed to get a response from the AI model.");
  }
};
