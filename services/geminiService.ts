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

**步骤：**
1. **识别内容**：读取文本及图片中的文字。
2. **提取数据**：记录阅读量、销量等传播数据；**提取发布时间**。
3. **判断属性**：判断是否属于商业广告。
4. **合规审核**：检查虚假宣传、夸大功效、医疗广告违规等问题。
5. **生成报告**：提取信息，列出违规点，并生成**指定格式**的举报文案。

**违规点提取要求**：
- 如果违规内容出现在图片中，请在“原文出处”中标注“（图片内容）”。

**总结文案（举报文案）格式严格要求**：
最后包含一条总结性文案，**总字数严格控制在450字以内**。
必须严格套用以下模板，不要随意发挥，保留模板中的法律引用风格：

"该企业通过认证“微信公众号或者小程序”发布文章：[文章标题]，链接[URL] 该文章推广“[商品/服务名称]” [所属行业，如医疗服务/保健食品]，属[广告类型]，涉嫌违反[列举法律名称]发布违法广告。文章内容存在[具体违规行为描述]，明确表述[引用违规原文片段]，违反《[法律名称]》第[几]条禁止性规定；[如果是医疗广告且未审查/违规]同时该[类型]广告未经[相关部门]审查批准/擅自发布，违反《[法律名称]》第[几]条审查程序要求。[如果有传播数据，必须在此插入一句：经查，该内容显示阅读量/销量为[具体数字]，传播范围较广/影响较大。] 投诉请求：1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；2. 鉴于涉案广告通过互联网公开发布，传播广泛，且内容涉及[填：人民群众生命健康/财产安全]，恳请贵局严格依法履职，予以立案查处，并在法定时限内告知案件调查进展及处理结果；3. 请依法落实相关投诉奖励事项。"

注意：
1. 模板中的[ ]内容请根据实际分析结果替换。
2. 如果链接是微信小程序（如#小程序://...），请直接填入该链接字符串。
3. 投诉请求第2点非常重要：请根据广告类型选择“人民群众生命健康”（针对医疗/食品/美妆）或“财产安全”（针对理财/投资）。
4. 如果不是医疗广告或没有审查问题，相应句子可调整，但整体结构和结尾的“投诉请求...”语段保持不变。

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

  promptText += `**重要指令 - 时间校验：**\n1. 请务必在文本或图片中寻找文章发布的具体日期（例如：2024-05-12，2023年8月等）。\n2. 当前日期是 ${currentDate}。计算发布日期与当前日期的间隔。\n3. 如果发布时间超过6个月（例如当前是2025年7月，文章是2024年12月之前发布的），必须将 JSON 中的 'isOldArticle' 字段设为 true。\n4. 如果是近期内容（6个月内），'isOldArticle' 为 false。\n5. 如果完全无法找到日期，'publicationDate' 填“未知”，'isOldArticle' 填 false。\n`;

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

// Map of categories to specific search queries (Google Dorks)
const RISK_SEARCH_QUERIES: Record<string, string[]> = {
  'MEDICAL': [
    'site:mp.weixin.qq.com "根治" "不复发" "纯中药"',
    'site:mp.weixin.qq.com "糖尿病" "彻底治愈" "祖传秘方"',
    'site:mp.weixin.qq.com "癌症" "治愈率" "神医"',
    'site:mp.weixin.qq.com "高血压" "停药" "无副作用"',
    'site:mp.weixin.qq.com "牙科" "种植牙" "终身质保" "当天使用"',
    'site:mp.weixin.qq.com "眼科" "近视治愈" "摘镜"',
    'site:mp.weixin.qq.com "中医" "老中医" "祖传" "包治百病"',
  ],
  'BEAUTY': [
    'site:mp.weixin.qq.com "医美" "微整形" "零风险"',
    'site:mp.weixin.qq.com "美白" "祛斑" "三天见效"',
    'site:mp.weixin.qq.com "减肥" "不节食" "月瘦" "不反弹"',
    'site:mp.weixin.qq.com "丰胸" "二次发育" "无效退款"',
    'site:mp.weixin.qq.com "抗衰" "逆龄" "年轻10岁"',
  ],
  'FOOD': [
    'site:mp.weixin.qq.com "保健品" "增强免疫力" "抗癌" "防癌"',
    'site:mp.weixin.qq.com "长高" "助眠" "国家专利" "增高"',
    'site:mp.weixin.qq.com "排毒" "清肠" "美容养颜"',
    'site:mp.weixin.qq.com "燕窝" "滋补" "功效"',
  ],
  'GENERAL': [
    'site:mp.weixin.qq.com "全网第一" "销量冠军" "顶级"',
    'site:mp.weixin.qq.com "投资" "保本" "稳赚" "年化收益"',
    'site:mp.weixin.qq.com "招商加盟" "零风险" "暴利" "回本快"',
    'site:mp.weixin.qq.com "教育" "保过" "命题组"',
  ]
};

export const discoverRisks = async (category: string = 'GENERAL'): Promise<DiscoveryItem[]> => {
  if (!apiKey) {
    throw new Error("API Key is not configured.");
  }

  const modelId = "gemini-2.5-flash"; 
  const currentDate = new Date().toLocaleDateString('zh-CN');

  // Get queries for the requested category, fallback to GENERAL if not found
  const queries = RISK_SEARCH_QUERIES[category] || RISK_SEARCH_QUERIES['GENERAL'];
  // Randomly select one query to ensure variety on each click
  const selectedQuery = queries[Math.floor(Math.random() * queries.length)];

  // We use a broader prompt that allows the tool to search freely
  const prompt = `
    Find recent WeChat Official Account articles (site:mp.weixin.qq.com) that might contain illegal advertising claims related to: ${selectedQuery}
    
    Current Date: ${currentDate}
    
    Instructions:
    1. Use the "googleSearch" tool to find real articles.
    2. Focus on content published within the last 6 months if possible.
    3. Look for titles involving absolute claims (e.g., "Cure", "No side effects", "No rebound", "Zero risk").
    
    If you find results, return them. If no specific results are found, try to find generally relevant high-risk content in this category.
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json", // Force JSON for the final output parsing
        responseSchema: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT,
             properties: {
               title: { type: Type.STRING },
               url: { type: Type.STRING },
               snippet: { type: Type.STRING },
               source: { type: Type.STRING },
             }
           }
        }
      }
    });

    // Strategy 1: Try to get data from Grounding Metadata (Most reliable for "Real" links)
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const directResults: DiscoveryItem[] = [];

    if (groundingChunks && groundingChunks.length > 0) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          // Filter for WeChat links to ensure relevance to the "Mini Program/WeChat" requirement
          if (chunk.web.uri.includes('mp.weixin.qq.com') || chunk.web.uri.includes('weixin')) {
             directResults.push({
               title: chunk.web.title,
               url: chunk.web.uri,
               snippet: "来自谷歌搜索结果 (疑似包含违规关键词)",
               source: "微信搜一搜/公众号"
             });
          }
        }
      });
    }

    // Strategy 2: Parse the generative JSON response (The model's synthesis)
    let parsedItems: DiscoveryItem[] = [];
    if (result.text) {
       try {
         const json = JSON.parse(result.text);
         if (Array.isArray(json)) {
           parsedItems = json;
         }
       } catch (e) {
         // ignore json parse error
       }
    }

    // Combine results, prioritizing Direct Grounding results for authenticity, 
    // but using Model Generated results if they look valid and unique.
    const combined = [...directResults];
    
    // Add parsed items if they are not already in the list
    parsedItems.forEach(pItem => {
       if (!combined.some(c => c.url === pItem.url)) {
          combined.push(pItem);
       }
    });

    // If we have results, return top 10
    if (combined.length > 0) {
       return combined.slice(0, 10);
    }

    return [];

  } catch (error) {
    console.error("Discovery Error:", error);
    // Return empty array instead of throwing to prevent UI crash, allowing retry
    return [];
  }
};
