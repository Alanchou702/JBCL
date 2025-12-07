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
5. **时效性校验**：务必在文章/图片中查找发布日期。

**判断非广告内容（重要）**：
- 如果内容仅仅是科普知识、新闻报道、个人生活分享，且**完全没有**包含购买链接、二维码、具体的商品推荐、店铺地址或“咨询购买”等引导销售的信息，请务必将 \`isAd\` 设为 \`false\`。
- **不要强行判定为广告**。如果 \`isAd\` 为 \`false\`，或者没有发现明显违规点，请在 summary 中说明理由（如“该内容为纯科普文章，未发现商业推广行为”），而**绝不要**生成投诉举报文案。

**违规点提取要求**：
- 如果违规内容出现在图片中，请在“原文出处”中标注“（图片内容）”。
- 如果未发现明显违规，violations 数组应为空。

**总结文案（举报文案）格式严格要求**：
仅当 \`isAd\` 为 \`true\` 且发现违规时，生成以下格式文案。**总字数严格控制在450字以内**。
请根据**内容载体类型**选择合适的开头模板，不要混淆“文章”与“商品页”：

**情形A：如果是电商平台（淘宝/京东/拼多多）、微信小程序商城、店铺商品详情页（通常含价格、购物车、立即购买按钮，或者链接是#小程序://开头）：**
"该企业在认证的“[平台名称，如微信小程序/淘宝/京东/拼多多]”店铺内销售商品“[商品名称]”，其商品详情页/宣传页介绍内容属[广告类型]，涉嫌违反[列举法律名称]发布违法广告。该商品页面内容存在[具体违规行为描述]，明确表述[引用违规原文片段]，违反《[法律名称]》第[几]条禁止性规定；[如果是医疗广告且未审查/违规]同时该[类型]广告未经[相关部门]审查批准/擅自发布，违反《[法律名称]》第[几]条审查程序要求。[如果有传播数据，必须在此插入一句：经查，该商品页面显示已售/销量为[具体数字]，传播范围较广/影响较大。]"

**情形B：如果是公众号推文、资讯文章（无直接下单功能，侧重内容推广）：**
"该企业通过认证“微信公众号”发布文章：[文章标题]，链接[URL] 该文章推广“[商品/服务名称]” [所属行业，如医疗服务/保健食品]，属[广告类型]，涉嫌违反[列举法律名称]发布违法广告。文章内容存在[具体违规行为描述]，明确表述[引用违规原文片段]，违反《[法律名称]》第[几]条禁止性规定；[如果是医疗广告且未审查/违规]同时该[类型]广告未经[相关部门]审查批准/擅自发布，违反《[法律名称]》第[几]条审查程序要求。[如果有传播数据，必须在此插入一句：经查，该内容显示阅读量/销量为[具体数字]，传播范围较广/影响较大。]"

**通用投诉请求部分（紧接上述文案）：**
"投诉请求：
1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；
2. 鉴于涉案广告通过互联网公开发布，传播广泛，且内容涉及[填：人民群众生命健康/财产安全]，我们恳请贵局严格依法履职，予以立案查处，并在法定时限内告知案件调查进展及处理结果；
3. 请依法落实相关投诉奖励事项。
[如果企业辩称是科普/软文，追加一句：根据《互联网广告管理办法》，通过知识介绍等形式推销商品或服务，构成商业广告，应当承担广告主责任。]"

注意：
1. 模板中的[ ]内容请根据实际分析结果替换。
2. 如果链接是微信小程序（如#小程序://...），请直接填入该链接字符串。
3. 投诉请求第2点非常重要：请根据广告类型选择“人民群众生命健康”（针对医疗/食品/美妆）或“财产安全”（针对理财/投资）。

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
      description: "List of specific violations found. Empty if no violations.",
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
      description: "The formal summary/report text strictly following the requested format. If not an ad or no violations, explain why.",
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
    throw new Error("系统未检测到 API Key。请在部署平台（如 Netlify）的环境变量中配置 'API_KEY'。");
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
    promptText += `注意：这是来自链接的内容。如果是小程序链接（如#小程序://），请将其视为有效发布源。如果是淘宝/京东链接，请识别为电商平台内容。\n`;
  }

  promptText += `**重要指令 - 时间校验：**\n1. 请务必在文本或图片中寻找文章发布的具体日期（例如：2024-05-12，2023年8月等）。\n2. 当前日期是 ${currentDate}。计算发布日期与当前日期的间隔。\n3. 如果发布时间超过6个月（例如当前是2025年7月，文章是2024年12月之前发布的），必须将 JSON 中的 'isOldArticle' 字段设为 true。\n4. 如果是近期内容（6个月内），'isOldArticle' 为 false。\n5. 如果完全无法找到日期，'publicationDate' 填“未知”，'isOldArticle' 填 false。\n`;

  if (images.length > 0) {
    promptText += `\n\n【图片分析要求】：\n已上传 ${images.length} 张图片。请务必仔细阅读图片中的所有文字，识别图片中的视觉符号。很多违规点（如“第一”、“治愈”、“无效退款”等）可能仅以图片形式呈现。\n**特别注意：请识别图片中的数字信息，如阅读量、转发量、销量（已售件数），并在总结中体现。**`;
  }

  parts.push({ text: promptText });

  // Add images to parts
  for (const base64Image of images) {
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
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes("API key") || errorMessage.includes("403") || errorMessage.includes("400")) {
       throw new Error("API Key 无效或未授权。请检查 Netlify 环境变量配置是否正确。");
    }
    throw new Error("AI 服务暂时不可用，请稍后重试。详细错误: " + errorMessage);
  }
};

// Precise Google Dorks for WeChat Public Platform & Mini Programs
const RISK_SEARCH_QUERIES: Record<string, string[]> = {
  'MEDICAL': [
    'site:mp.weixin.qq.com "糖尿病" "根治" after:2024-01-01',
    'site:mp.weixin.qq.com "高血压" "停药" after:2024-01-01',
    'site:mp.weixin.qq.com "癌症" "治愈率" after:2024-01-01',
    'site:mp.weixin.qq.com "祖传秘方" "无效退款" after:2024-01-01',
  ],
  'BEAUTY': [
    'site:mp.weixin.qq.com "医美" "零风险" after:2024-01-01',
    'site:mp.weixin.qq.com "减肥" "月瘦" "不反弹" after:2024-01-01',
    'site:mp.weixin.qq.com "丰胸" "7天见效" after:2024-01-01',
  ],
  'FOOD': [
    'site:mp.weixin.qq.com "保健食品" "治疗" after:2024-01-01',
    'site:mp.weixin.qq.com "长高" "增高" "专利" after:2024-01-01',
    'site:mp.weixin.qq.com "排毒" "清宿便" after:2024-01-01',
  ],
  'GENERAL': [
    'site:mp.weixin.qq.com "全网第一" "销量冠军" after:2024-01-01',
    'site:mp.weixin.qq.com "投资" "稳赚不赔" after:2024-01-01',
    'site:mp.weixin.qq.com "国家级" "最高级" after:2024-01-01',
  ]
};

export const discoverRisks = async (category: string = 'GENERAL'): Promise<DiscoveryItem[]> => {
  if (!apiKey) {
    throw new Error("系统未检测到 API Key。请在部署平台（如 Netlify）的环境变量中配置 'API_KEY'。");
  }

  const modelId = "gemini-2.5-flash"; 
  const queries = RISK_SEARCH_QUERIES[category] || RISK_SEARCH_QUERIES['GENERAL'];
  const selectedQuery = queries[Math.floor(Math.random() * queries.length)];

  const prompt = `
    Use Google Search to find 5-10 recent articles matching: ${selectedQuery}
    Target: WeChat Official Account Articles (mp.weixin.qq.com) containing illegal advertising claims (e.g. "cure", "no rebound", "guarantee").
    Return the search results list naturally.
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    // Extract real links from grounding metadata
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const directResults: DiscoveryItem[] = [];

    if (groundingChunks && groundingChunks.length > 0) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          const uri = chunk.web.uri;
          // Filter for WeChat or other relevant platforms
          if (uri.includes('weixin.qq.com') || uri.includes('qq.com')) {
             directResults.push({
               title: chunk.web.title,
               url: uri,
               snippet: "来源：微信公众平台/搜一搜 (智能匹配潜在违规词)",
               source: "微信公众号"
             });
          }
        }
      });
    }

    // Deduplicate
    const uniqueResults = directResults.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.url === item.url
      ))
    );

    return uniqueResults.slice(0, 10);

  } catch (error: any) {
    console.error("Discovery Error:", error);
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes("API key")) {
         throw new Error("API Key 无效或未配置。");
    }
    return [];
  }
};