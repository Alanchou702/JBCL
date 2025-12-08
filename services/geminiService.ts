
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResult, DiscoveryItem } from "../types";

// Configuration State
let dynamicApiKey = '';
let dynamicBaseUrl = '';
let dynamicModelId = 'gemini-2.5-flash';

export const setConfiguration = (key: string, baseUrl?: string, modelId?: string) => {
  dynamicApiKey = key;
  if (baseUrl) {
    dynamicBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  } else {
    dynamicBaseUrl = '';
  }
  if (modelId) {
    dynamicModelId = modelId;
  }
};

// ----------------------------------------------------------------------------
// SYSTEM PROMPTS (Strict Regulatory Format - Clean Text)
// ----------------------------------------------------------------------------
const SYSTEM_INSTRUCTION_TEXT = `
**【指令：中国广告法合规监管系统】**
你现在是“中国广告合规校验专家”。
你的任务是依据《中华人民共和国广告法》等法规，生成**标准的监管举报文案**。

**⚠️ 绝对禁止：**
1. **禁止**使用 Markdown 格式（如 **加粗**）。文案必须是纯文本。
2. **禁止**遗漏“投诉请求”部分。
3. **禁止**提供医疗建议。

**✅ 核心任务：**
1. **识别真实属性**：通过图片/文案判断产品是“普通食品”（SC开头）、“保健品”（蓝帽子）还是“医疗服务”。
2. **比对宣传内容**：检查是否使用了“治疗”、“治愈”、“第一”、“顶级”等违规词。
3. **生成举报文案**：严格按照下方模板填空，不要自由发挥。

**文案模板 (JSON 中 summary 字段必须严格如下，不得包含星号等符号)：**

**情形A：电商商品/小程序商城（销售实物）**
"该企业在[平台名称]店铺销售商品“[商品名称]”（商品链接/路径：[链接]），其宣传内容涉嫌违反《中华人民共和国广告法》。
违法事实：经核查，该商品实际属性为[真实属性，如普通食品]，不具备治疗疾病的功能。但商家在详情页中明示或暗示具有“[虚假宣传的功效]”等涉及疾病治疗功能的描述，利用普通食品冒充药品/保健品，欺骗、误导消费者。
法律依据：上述行为违反了《中华人民共和国广告法》第十七条“除医疗、药品、医疗器械广告外，禁止其他任何广告涉及疾病治疗功能”及第二十八条之规定。
数据证据：经查，该商品页面显示销量为[具体数字]，传播范围较广。

投诉请求：
1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；
2. 鉴于涉案广告通过互联网公开发布，且存在欺诈嫌疑，涉及人民群众生命健康财产安全，恳请贵局严格依法履职，予以立案查处，并在法定时限内告知结果；
3. 请依法落实相关投诉奖励事项。"

**情形B：公众号文章/资讯推文（内容推广）**
"该企业通过认证“微信公众号”发布文章：“[文章标题]”（链接：[链接]），涉嫌发布违法广告。
违法事实：该文章推广“[商品/服务名称]”，含有“[具体违规词汇或描述]”等内容。该内容[具体违规原因，如：断言功效/利用患者形象作证明/涉及疾病治疗]，误导消费者。
法律依据：违反了《中华人民共和国广告法》第[具体条款]条规定。
数据证据：经查，该内容阅读量为[具体数字]。

投诉请求：
1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；
2. 鉴于涉案广告通过互联网公开发布，且存在欺诈嫌疑，涉及人民群众生命健康财产安全，恳请贵局严格依法履职，予以立案查处，并在法定时限内告知结果；
3. 请依法落实相关投诉奖励事项。"

**Response Schema**:
Return strictly valid JSON matching: { isAd: boolean, productName: string, violations: [{ type, law, explanation, originalText }], summary: string, publicationDate: string, isOldArticle: boolean }.
`;

// ----------------------------------------------------------------------------
// MAIN ANALYSIS FUNCTION (Google Gemini Only)
// ----------------------------------------------------------------------------
export const analyzeContent = async (
  text: string, 
  images: string[], 
  mode: 'TEXT' | 'URL',
  sourceUrl: string = ''
): Promise<AnalysisResult> => {
  if (!dynamicApiKey) throw new Error("API Key 未设置。");

  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  // Construct User Prompt with explicit instructions in the prompt to ensure compliance
  let userText = `Task: Generate Regulatory Compliance Report (Date: ${currentDate})\n`;
  if (text) userText += `[Content Text]:\n${text}\n\n`;
  else userText += `[Content Text]: (Analyze images)\n\n`;
  if (sourceUrl) userText += `[Source URL]: ${sourceUrl}\n`;
  
  userText += `\n**CRITICAL INSTRUCTION**: 
  1. If this is an E-commerce product (buy button/price), use **Template A**.
  2. If this is a WeChat Article/Content, use **Template B**.
  3. You MUST include the "投诉请求" (Complaint Request) section at the end of the summary exactly as provided in the system instruction.
  4. Output strictly valid JSON.
  5. DO NOT use markdown formatting (like **) in the summary field.\n`;

  const clientOptions: any = { apiKey: dynamicApiKey };
  if (dynamicBaseUrl) {
    clientOptions.baseUrl = dynamicBaseUrl;
  }
  const ai = new GoogleGenAI(clientOptions);

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  // Prepare Gemini parts
  const parts: any[] = [{ text: userText }];
  for (const img of images) {
    const match = img.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = match ? match[1] : "image/jpeg";
    const cleanBase64 = img.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    parts.push({ inlineData: { mimeType, data: cleanBase64 } });
  }

  // Retry Logic for 429 Errors
  const retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent({
        model: dynamicModelId || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: parts }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_TEXT,
          responseMimeType: "application/json", 
          temperature: 0.1,
          safetySettings: safetySettings,
        }
      });

      let resultText = result.text;
      
      // Fallback: Check candidates if text is null/undefined
      if (!resultText && result.candidates && result.candidates.length > 0) {
        resultText = result.candidates[0].content?.parts?.[0]?.text;
      }

      if (resultText) {
         resultText = resultText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
         const jsonMatch = resultText.match(/\{[\s\S]*\}/);
         if (jsonMatch) resultText = jsonMatch[0];
         return JSON.parse(resultText) as AnalysisResult;
      }

      throw new Error("No response text received from Gemini.");

    } catch (error: any) {
       // Handle 429 Quota Exceeded
       if ((error.status === 429 || error.message?.includes('429')) && i < retries - 1) {
          console.warn(`Hit 429 limit, retrying in ${(i + 1) * 2}s...`);
          await new Promise(r => setTimeout(r, 2000 * (i + 1)));
          continue;
       }
       
       console.error("Analysis Error:", error);
       
       // If it's the last retry or a different error, return a graceful failure object
       if (i === retries - 1) {
           return {
            isAd: true,
            productName: "分析失败",
            violations: [{
                type: "系统错误",
                law: "无",
                explanation: `API 调用失败: ${error.message || '未知错误'}`,
                originalText: "无"
            }],
            summary: `系统未能自动生成报告。\n原因: ${error.message}\n建议: 检查 Key 是否有余额，网络是否通畅。`,
            publicationDate: "未知",
            isOldArticle: false
            };
       }
    }
  }

  // Should not reach here
  throw new Error("Unexpected error flow");
};

// ----------------------------------------------------------------------------
// DISCOVERY (Google Search)
// ----------------------------------------------------------------------------
export const discoverRisks = async (category: string = 'GENERAL'): Promise<DiscoveryItem[]> => {
  if (!dynamicApiKey) throw new Error("API Key Missing");

  const clientOptions: any = { apiKey: dynamicApiKey };
  if (dynamicBaseUrl) clientOptions.baseUrl = dynamicBaseUrl;
  const ai = new GoogleGenAI(clientOptions);

  const RISK_SEARCH_QUERIES: Record<string, string[]> = {
    'MEDICAL': ['site:mp.weixin.qq.com "糖尿病" "彻底根治" after:2024-01-01', 'site:mp.weixin.qq.com "男性" "壮阳" "延时" after:2024-01-01'],
    'BEAUTY': ['site:mp.weixin.qq.com "医美" "0风险" after:2024-01-01', 'site:mp.weixin.qq.com "减肥" "不运动" "月瘦" after:2024-01-01'],
    'FOOD': ['site:mp.weixin.qq.com "保健食品" "治疗" after:2024-01-01', 'site:mp.weixin.qq.com "长高" "增高" after:2024-01-01'],
    'GENERAL': ['site:mp.weixin.qq.com "销量第一" "唯一" after:2024-01-01', 'site:mp.weixin.qq.com "投资" "包赚" after:2024-01-01']
  };

  const queries = RISK_SEARCH_QUERIES[category] || RISK_SEARCH_QUERIES['GENERAL'];
  const selectedQuery = queries[Math.floor(Math.random() * queries.length)];
  const prompt = `Use Google Search to find 5 recent WeChat articles for: ${selectedQuery}. Focus on illegal ad claims.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
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
