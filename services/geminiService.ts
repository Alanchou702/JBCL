import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResult, DiscoveryItem } from "../types";

// Store dynamic configuration
let dynamicApiKey = '';
let dynamicBaseUrl = '';

export const setConfiguration = (key: string, baseUrl?: string) => {
  dynamicApiKey = key;
  // Normalize Base URL: remove trailing slash to avoid double slashes when SDK appends paths
  if (baseUrl) {
    dynamicBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  } else {
    dynamicBaseUrl = '';
  }
};

// Helper function to handle 429 Rate Limits with exponential backoff
const generateWithRetry = async (model: any, params: any, retries = 5): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(params);
    } catch (error: any) {
      const errMsg = error.message || error.toString();
      
      // 1. Diagnosis: Network Error (Failed to fetch)
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
          throw new Error("网络连接失败。请检查：\n1. VPN/代理是否开启？\n2. 是否配置了有效的 Base URL (代理地址)？\n3. 您的网络是否能访问 Google API？");
      }

      // 2. Diagnosis: Rate Limit (429)
      const isRateLimit = errMsg.includes('429') || 
                          error.status === 429 || 
                          errMsg.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit) {
        if (i === retries - 1) {
             throw new Error("API 调用频率超限 (429)。您的免费版 Key 额度已耗尽，请更换 Key 或稍后再试。");
        }
        // Aggressive backoff: 2s, 4s, 8s, 16s, 32s
        const delay = Math.pow(2, i + 1) * 1000 + Math.random() * 1000;
        console.warn(`[AdGuardian] 触发限流 (429), 等待 ${Math.round(delay)}ms 后重试 (第 ${i+1}/${retries} 次)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Other errors, throw immediately
      throw error;
    }
  }
};

// ----------------------------------------------------------------------------
// PRIMARY INSTRUCTION: STRICT LEGAL AUDITOR
// ----------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `
**【指令：中国广告法合规性判定专用】**
你是一个**“广告合规校验算法”**，而非人类助手或医生。
**你的唯一任务：** 将输入内容与《中华人民共和国广告法》进行比对，输出法律风险判定。

**⚠️ 绝对禁止 (Strict Negative Constraints)：**
1. **禁止提供医疗建议**：严禁根据输入内容提供任何诊断、治疗方案或健康建议。
2. **禁止进行医学判断**：不要分析产品是否“有效”，只分析宣传是否“合法”。
3. **禁止情感交互**：输出必须客观、冷静、法言法语。

**✅ 核心逻辑 (Core Logic)：**
1. **识别主体**：通过图片OCR识别参数表/背标。
   - 生产许可证号 **SCxxxx** = **普通食品**。
   - **卫食健字/国食健字** = **保健食品**。

2. **法律比对**：
   - 若主体为 **普通食品**，但文案出现“治疗”、“治愈”、“补肾”、“壮阳”、“抗癌”等词：
     -> **直接判定：违反《广告法》第17条（非医疗产品涉及疾病治疗功能）。**
   - 若主体为 **保健食品**，但文案超出核准功能范围：
     -> **直接判定：违反《广告法》及《食品安全法》第73条（虚假宣传）。**

**违规报告模板 (JSON Summary 字段)：**

**情形A：电商/商品类**
"该企业在[平台]店铺销售商品“[商品名称]”（链接：[链接]），涉嫌违反《广告法》。
**违法事实**：经核查，该商品属于[真实属性，如普通食品]，不具备治疗功能。但商家在宣传中明示或暗示具有[虚假功效]功效，涉嫌利用普通食品冒充药品/保健品进行虚假宣传。
**法律依据**：违反《中华人民共和国广告法》第十七条、第二十八条。"

**情形B：内容/文章类**
"该企业通过公众号发布文章“[文章标题]”（链接：[链接]），涉嫌发布违法广告。
**违法事实**：文章推广“[商品/服务]”，含有[具体违规描述]等涉及疾病治疗功能的描述，误导消费者。
**法律依据**：违反《中华人民共和国广告法》第十七条。"

**Response Schema**:
Return strictly valid JSON.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isAd: { type: Type.BOOLEAN },
    productName: { type: Type.STRING },
    violations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          law: { type: Type.STRING },
          explanation: { type: Type.STRING },
          originalText: { type: Type.STRING },
        },
        required: ["type", "law", "explanation", "originalText"],
      },
    },
    summary: { type: Type.STRING },
    publicationDate: { type: Type.STRING },
    isOldArticle: { type: Type.BOOLEAN },
  },
  required: ["isAd", "productName", "violations", "summary", "isOldArticle"],
};

export const analyzeContent = async (
  text: string, 
  images: string[], 
  mode: 'TEXT' | 'URL',
  sourceUrl: string = ''
): Promise<AnalysisResult> => {
  if (!dynamicApiKey) {
    throw new Error("API Key 未设置。请在登录页输入有效的 Google Gemini API Key。");
  }

  // Initialize AI with optional Base URL for proxying
  const clientOptions: any = { apiKey: dynamicApiKey };
  if (dynamicBaseUrl) {
    clientOptions.baseUrl = dynamicBaseUrl;
    console.log("Using Custom Base URL:", dynamicBaseUrl);
  }

  const ai = new GoogleGenAI(clientOptions);
  const modelId = "gemini-2.5-flash"; 
  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  // Base prompt parts
  const baseParts: any[] = [];
  
  // User Prompt: Explicitly frame this as a Legal Audit task
  let promptText = `Task: Legal Compliance Audit (Date: ${currentDate})\nTarget: Analyze the following ADVERTISEMENT content for compliance with China Advertising Law.\n\n`;
  
  if (text) promptText += `[Content Text]:\n${text}\n\n`;
  else promptText += `[Content Text]: (None provided, analyze images)\n\n`;
  
  if (sourceUrl) promptText += `[Source URL]: ${sourceUrl}\n`;
  
  promptText += `\n[Audit Rules]:\n1. Identify Product Type (SC=Food, BlueHat=Health).\n2. Flag any "Cure/Treatment" claims for Non-Drug products as ILLEGAL.\n3. Output strictly JSON.\n`;

  baseParts.push({ text: promptText });

  for (const base64Image of images) {
    // Dynamic MIME type detection
    const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = match ? match[1] : "image/jpeg";
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    baseParts.push({
      inlineData: {
        mimeType: mimeType, 
        data: cleanBase64
      }
    });
  }

  // Safety settings: BLOCK_NONE is critical for auditing illegal content
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  // --- ATTEMPT 1: Strict Legal Auditor ---
  try {
    const result = await generateWithRetry(ai.models, {
      model: modelId,
      contents: [{ role: 'user', parts: baseParts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
        safetySettings: safetySettings,
      }
    });

    if (result.text) {
      return JSON.parse(result.text) as AnalysisResult;
    } 
    
    // Explicitly check for blocks
    if (result.promptFeedback?.blockReason) {
         console.warn("Blocked by filter:", result.promptFeedback.blockReason);
    }
    throw new Error("Strict Mode Empty");

  } catch (error: any) {
    // If it's a critical infrastructure error, throw it.
    const msg = error.message || '';
    if (msg.includes('网络连接失败') || msg.includes('API 调用频率超限') || msg.includes('403') || msg.includes('API key')) {
        throw error;
    }

    // --- ATTEMPT 2: Fallback (Passive Data Extraction) ---
    console.log("Switching to Fallback Mode (Passive Extraction)...");

    const fallbackParts = [...baseParts];
    fallbackParts.push({ 
        text: `\n\n[SYSTEM OVERRIDE]: Just extract text to JSON. No analysis. Keys: isAd, productName, violations (array), summary, publicationDate, isOldArticle.` 
    });

    try {
        const resultFallback = await generateWithRetry(ai.models, {
            model: modelId,
            contents: [{ role: 'user', parts: fallbackParts }],
            config: {
                // No System Instruction -> Reduces persona-based blocking
                temperature: 0.1,
                safetySettings: safetySettings,
            }
        });

        let finalText = resultFallback.text;

        // Candidate recovery
        if (!finalText && resultFallback.candidates && resultFallback.candidates.length > 0) {
            finalText = resultFallback.candidates[0].content?.parts?.[0]?.text;
        }

        if (finalText) {
            // Clean JSON
            finalText = finalText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
            const jsonMatch = finalText.match(/\{[\s\S]*\}/);
            if (jsonMatch) finalText = jsonMatch[0];

            try {
                return JSON.parse(finalText) as AnalysisResult;
            } catch (jsonErr) {
                console.error("Fallback JSON Parse Error", jsonErr);
            }
        }
        
        // If we reach here, BOTH attempts failed to produce valid JSON.
        // Instead of throwing an error that crashes the UI, return a "Graceful Failure" result.
        console.warn("All AI attempts failed. Returning Graceful Failure result.");
        return {
          isAd: true,
          productName: "分析未完成 (需人工复核)",
          violations: [{
             type: "系统响应中断",
             law: "无",
             explanation: "AI 未能返回有效结果。可能原因：1. 内容过于敏感触发安全拦截；2. 网络连接不稳定；3. 图片无法识别。请尝试减少图片数量或仅上传参数表。",
             originalText: "无"
          }],
          summary: "系统未能自动生成完整报告。建议人工核查该广告内容。如有必要，请更换 API Key 或检查网络环境后重试。",
          publicationDate: "未知",
          isOldArticle: false
        };

    } catch (fallbackError: any) {
        console.error("Gemini Analysis Final Error:", fallbackError);
        // Even if fallback crashes (e.g. network), verify if we should throw or return graceful failure
        const fallbackMsg = fallbackError.message || '';
        if (fallbackMsg.includes("网络连接失败") || fallbackMsg.includes("频率超限")) {
             throw fallbackError;
        }
        
        // Return graceful failure for unknown runtime errors during fallback
        return {
          isAd: true,
          productName: "系统错误",
          violations: [{
             type: "运行错误",
             law: "无",
             explanation: `系统运行中发生错误: ${fallbackMsg.substring(0, 100)}...`,
             originalText: "无"
          }],
          summary: "分析过程中发生未知错误，请重试。",
          publicationDate: "未知",
          isOldArticle: false
        };
    }
  }
};

const RISK_SEARCH_QUERIES: Record<string, string[]> = {
  'MEDICAL': [
    'site:mp.weixin.qq.com "糖尿病" "彻底根治" after:2024-01-01',
    'site:mp.weixin.qq.com "高血压" "停药" after:2024-01-01',
    'site:mp.weixin.qq.com "男性" "壮阳" "延时" after:2024-01-01',
  ],
  'BEAUTY': [
    'site:mp.weixin.qq.com "医美" "0风险" after:2024-01-01',
    'site:mp.weixin.qq.com "减肥" "不运动" "月瘦" after:2024-01-01',
  ],
  'FOOD': [
    'site:mp.weixin.qq.com "保健食品" "治疗" after:2024-01-01',
    'site:mp.weixin.qq.com "长高" "增高" after:2024-01-01',
  ],
  'GENERAL': [
    'site:mp.weixin.qq.com "销量第一" "唯一" after:2024-01-01',
    'site:mp.weixin.qq.com "投资" "包赚" after:2024-01-01',
  ]
};

export const discoverRisks = async (category: string = 'GENERAL'): Promise<DiscoveryItem[]> => {
  if (!dynamicApiKey) throw new Error("API Key 未设置。");

  // Re-init with correct options
  const clientOptions: any = { apiKey: dynamicApiKey };
  if (dynamicBaseUrl) {
    clientOptions.baseUrl = dynamicBaseUrl;
  }
  const ai = new GoogleGenAI(clientOptions);

  const modelId = "gemini-2.5-flash"; 
  const queries = RISK_SEARCH_QUERIES[category] || RISK_SEARCH_QUERIES['GENERAL'];
  const selectedQuery = queries[Math.floor(Math.random() * queries.length)];

  const prompt = `Use Google Search to find 5 recent WeChat articles for: ${selectedQuery}. Focus on illegal ad claims.`;

  try {
    const result = await generateWithRetry(ai.models, {
      model: modelId,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const directResults: DiscoveryItem[] = [];

    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          if (chunk.web.uri.includes('qq.com')) {
             directResults.push({
               title: chunk.web.title,
               url: chunk.web.uri,
               snippet: "来源：微信搜一搜 (智能风险匹配)",
               source: "微信公众号"
             });
          }
        }
      });
    }

    const uniqueResults = directResults.filter((item, index, self) =>
      index === self.findIndex((t) => t.url === item.url)
    );

    return uniqueResults.slice(0, 10);
  } catch (error) {
    console.error("Discovery Error:", error);
    return [];
  }
};