import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getMapRegions(imageBase64: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "请识别这张地图中所有的红色区域。对于每个区域，请提供：1. 区域名称（如果能看清文字则使用文字，否则使用描述性名称）。2. 一组归一化坐标（0-1000），用于定义该区域的 SVG 路径（M x y L x y ... Z）。请以 JSON 数组的形式返回，格式为：[{ 'name': '...', 'path': '...' }]",
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            path: { type: Type.STRING },
          },
          required: ["name", "path"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
}
