import { GoogleGenAI } from "@google/genai";

function readFirstImagePart(response) {
  const candidates = response?.candidates ?? [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];

    for (const part of parts) {
      if (part?.inlineData?.data) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png"
        };
      }
    }
  }

  return null;
}

function readResponseText(response) {
  const candidates = response?.candidates ?? [];
  const textParts = [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];
    for (const part of parts) {
      if (typeof part?.text === "string" && part.text.trim()) {
        textParts.push(part.text.trim());
      }
    }
  }

  return textParts.join("\n\n");
}

export async function beautifyImageWithNanobanana({
  apiKey,
  model,
  sourceImage,
  prompt
}) {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: sourceImage.mimeType,
              data: sourceImage.base64
            }
          }
        ]
      }
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  });

  const generatedImage = readFirstImagePart(response);

  if (!generatedImage) {
    const modelMessage = readResponseText(response);
    throw new Error(
      modelMessage ||
        "No generated image was returned. Check model support and prompt settings."
    );
  }

  return {
    ...generatedImage,
    text: readResponseText(response)
  };
}
