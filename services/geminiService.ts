import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, DiscoveryItem } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const SYSTEM_INSTRUCTION = `
你是一位专业的中国广告合规校验专家。
你的任务是依据最新的中国法律法规（包括但不限于《中华人民共和国广告法》、《中华人民共和国中医药法》、《互联网广告管理办法》、《医疗广告管理办法》等），对用户提供的广告文案、图片或链接内容进行严格审核。

**核心能力要求：**
1. **多模态分析**：用户可能会提供图片（如海报、截图）。你必须具备强大的OCR能力，仔细识别图片中的所有文字，并结合画面视觉元素（如医生形象、医疗器械、暗示性场景）进行综合分析。**很多违规信息（如绝对化用语、功效断言）往往隐藏在图片中，请务必仔细核对。**
2. **依据事实**：严格基于提供的文本和图片内容分析，禁止臆造。
3. **法律严谨**：引用法律条款必须准确。
4. **数据佐证（重要）**：务必在文本或图片中查找**阅读量、转发量、点赞数、销量（如“已售X件”、“X人付款”）、收藏数**等关键传播数据。这些数据是证明违法广告危害程度的重要证据。
5. **时效性校验**：务必在文章/图片中寻找发布日期。

**步骤：**
1. **识别内容**：读取文本及图片中的文字。
2. **提取数据**：记录阅读量、销量等传播数据；**提取发布时间**。
3. **判断属性**：判断是否属于商业广告。
4. **合规审核**：检查虚假宣传、夸大功效、医疗广告违规等问题。
5. **生成报告**：提取信息，列出违规点，并生成**指定格式**的举报文案。

**违规点提取要求**：
- 如果违规内容出现在图片中，请在“原文出处”中标注“（图片内容）”。

**总结文案（举报文案）格式严格要求**：
最后包含一条总结性文案，**总字数严格控制在400字以内**。
必须严格套用以下模板，不要随意发挥，保留模板中的法律引用风格：

"该企业通过认证“微信公众号或者小程序”发布文章：[文章标题]，链接[URL] 该文章推广“[商品/服务名称]” [所属行业，如医疗服务/保健食品]，属[广告类型]，涉嫌违反[列举法律名称]发布违法广告。文章内容存在[具体违规行为描述]，明确表述[引用违规原文片段]，违反《[法律名称]》第[几]条禁止性规定；[如果是医疗广告且未审查/违规]同时该[类型]广告未经[相关部门]审查批准/擅自发布，违反《[法律名称]》第[几]条审查程序要求。[如果有传播数据，必须在此插入一句：经查，该内容显示阅读量/销量为[具体数字]，传播范围较广/影响较大。] 投诉请求：1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；2. 请在法定时限内告知案件调查进展、最终处理结果；3. 请依法落实相关投诉奖励事项。"

注意：
1. 模板中的[ ]内容请根据实际分析结果替换。
2. 如果链接是微信小程序（如#小程序://...），请直接填入该链接字符串。
3. 如果不是医疗广告或没有审查问题，相应句子可调整，但整体结构和结尾的“投诉请求...”语段保持不变。

**Response Schema**:
Please return the result in JSON format matching the schema provided.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isAd: {
      type: Type.BOOLEAN,
      description: "Whether the content is identified as an advertisement.",
    },
    productName: {
      type: Type.STRING,
      description: "The name of the product or service being advertised.",
    },
    violations: {
      type: Type.ARRAY,
      description: "List of specific violations found.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Type of violation (e.g., 虚假宣传, 夸大功效)" },
          law: { type: Type.STRING, description: "Specific law and clause violated (e.g., 《广告法》第十六条)" },
          explanation: { type: Type.STRING, description: "Detailed explanation of why it is a violation." },
          originalText: { type: Type.STRING, description: "The specific text segment from the input that constitutes the violation." },
        },
        required: ["type", "law", "explanation", "originalText"],
      },
    },
    summary: {
      type: Type.STRING,
      description: "The formal summary/report text strictly following the requested format, including metrics if available.",
    },
    publicationDate: {
      type: Type.STRING,
      description: "The publication date of the content found in text or image (format YYYY-MM-DD), or '未知'.",
    },
    isOldArticle: {
      type: Type.BOOLEAN,
      description: "True if the publication date is more than 6 months prior to today's date.",
    },
  },
  required: ["isAd", "productName", "violations", "summary", "isOldArticle"],
};

export const analyzeContent = async (
  text: string, 
  images: string[], // Base64 strings
  mode: 'TEXT' | 'URL',
  sourceUrl: string = ''
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is not configured.");
  }

  const modelId = "gemini-2.5-flash"; 
  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  // Construct the prompt parts
  const parts: any[] = [];
  
  let promptText = `当前日期：${currentDate}\n请分析以下广告内容：\n\n`;
  
  if (text) {
    promptText += `【文本内容】：\n${text}\n\n`;
  } else {
    promptText += `【文本内容】：(未提供文本，请主要基于图片分析)\n\n`;
  }
  
  if (sourceUrl) {
    promptText += `相关推广链接/出处: ${sourceUrl}\n`;
  } else {
    promptText += `相关推广链接/出处: (未提供，请在模板中填写"未提供链接")\n`;
  }
  
  if (mode === 'URL') {
    promptText += `注意：这是来自链接的内容。如果是小程序链接（如#小程序://），请将其视为有效发布源。\n`;
  }

  promptText += `**重要指令：**\n1. 请在文本或图片中寻找文章的发布时间（Publication Date）。\n2. 比较发布时间与当前日期（${currentDate}）。如果发布时间超过6个月，请将 JSON 中的 'isOldArticle' 字段设为 true，否则为 false。如果找不到时间，默认为 false，并在 'publicationDate' 中填“未知”。\n`;

  if (images.length > 0) {
    promptText += `\n\n【图片分析要求】：\n已上传 ${images.length} 张图片。请务必仔细阅读图片中的所有文字，识别图片中的视觉符号。很多违规点（如“第一”、“治愈”、“无效退款”等）可能仅以图片形式呈现。\n**特别注意：请识别图片中的数字信息，如阅读量、转发量、销量（已售件数），并在总结中体现。**`;
  }

  parts.push({ text: promptText });

  // Add images to parts
  for (const base64Image of images) {
    // Ensure we strip the data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "image/jpeg", 
        data: cleanBase64
      }
    });
  }

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, 
      }
    });

    if (result.text) {
      const parsedData = JSON.parse(result.text);
      return parsedData as AnalysisResult;
    } else {
      throw new Error("No response text received from AI.");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("分析过程中发生错误，请稍后重试或检查输入内容。");
  }
};

export const discoverRisks = async (): Promise<DiscoveryItem[]> => {
  if (!apiKey) {
    throw new Error("API Key is not configured.");
  }

  const modelId = "gemini-2.5-flash"; 
  const currentDate = new Date().toLocaleDateString('zh-CN');

  const prompt = `
    Search for recent Chinese online advertisements (within the last 6 months) that potentially violate the Advertising Law. 
    Focus on:
    1. Healthcare (cancer, diabetes, TCM, "cure", "reversal")
    2. Cosmetic/Beauty ("immediate effect", "medical grade")
    3. Finance ("guaranteed return", "risk-free")
    
    Current Date: ${currentDate}
    
    Please find about 20 relevant results from sources like WeChat Articles (weixin.qq.com), news portals (Sina, Sohu), or e-commerce reviews.
    
    After searching, OUTPUT the result STRICTLY as a JSON Array of objects. Do not use Markdown code blocks. Just the raw JSON string.
    Each object must have:
    - "title": Title of the page/article
    - "url": The link
    - "snippet": A brief snippet showing why it might be risky
    - "source": The platform name (e.g., WeChat, Sohu)
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseSchema/responseMimeType is NOT supported with googleSearch in the current SDK version for this model appropriately without conflicts sometimes, 
        // so we rely on the prompt to format JSON.
      }
    });

    if (result.text) {
      let cleanText = result.text.trim();
      // Remove markdown code blocks if present
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```/, "").replace(/```$/, "");
      }
      
      try {
        const items = JSON.parse(cleanText);
        if (Array.isArray(items)) {
          return items as DiscoveryItem[];
        }
      } catch (e) {
        console.warn("Failed to parse discovery JSON, trying to extract links from grounding metadata if available or return empty.");
      }
    }
    
    // Fallback: If text parsing failed, check grounding metadata (though it lacks snippets/titles in the same way)
    // For now, return empty if parsing fails to avoid bad UI.
    return [];

  } catch (error) {
    console.error("Discovery Error:", error);
    throw new Error("搜索风险广告失败，请稍后重试。");
  }
};
