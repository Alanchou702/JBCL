import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, DiscoveryItem } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const SYSTEM_INSTRUCTION = `
你是一位专业的中国广告合规校验专家。
你的任务是依据最新的中国法律法规（包括但不限于《中华人民共和国广告法》、《中华人民共和国中医药法》、《互联网广告管理办法》、《医疗广告管理办法》、《食品安全法》等），对用户提供的广告文案、图片或链接内容进行严格审核。

**核心校验逻辑：宣传一致性比对 (Consistency Validation) —— 必须优先执行**
在分析时，必须将“图片中识别的真实信息”与“广告宣传文案”进行严格比对，查找“货不对板”的严重违规：

1. **提取真相（基于图片证据）**：
   - 从商品参数表、背标中提取**“产品类型”**（如：固体饮料、压片糖果、代用茶、其他食品）。
   - 提取**“核准功效”**（如果是蓝帽子保健品，提取其核准的具体功能，如“增强免疫力”）。

2. **比对宣传（基于文案/广告图）**：
   - 提取广告中的**“宣传功效”**（如：补肾壮阳、延时、增硬、抗癌、降三高）。

3. **判定违规（逻辑举例）**：
   - **情形1（跨类别宣传）**：如果真实属性是**“固体饮料/压片糖果/代用茶”**（普通食品），但宣传中出现**“补肾”、“壮阳”、“改善性功能”、“延时”**等内容 -> **定性为：普通食品假冒保健/药品宣传，属严重虚假广告。**
   - **情形2（功能篡改）**：如果真实属性是**“保健食品”**且核准功能仅为**“增强免疫力”**，但宣传中却暗示**“男性壮阳”、“提升性能力”** -> **定性为：擅自篡改核准功能，虚假宣传。**
   - **情形3（无中生有）**：如果产品介绍全是“高科技/专利成分”，但图片参数表中仅显示普通配料 -> **定性为：虚假宣传成分功效。**

**违规判定词库（普通食品/保健品严禁使用）：**
- 壮阳、补肾、延时、增硬、举而不坚、阳痿早泄
- 根治、治愈、彻底解决、不反弹、0风险
- 祖传秘方、老中医、纯天然（若无依据）

**关键步骤：产品属性判定**
1. **普通食品（SC开头生产许可证）**：严禁宣传任何保健/治疗功能。
2. **保健食品（“蓝帽子”标志）**：仅限宣传核准功能，必须标明“本品不能代替药物”。
3. **药品/医疗器械**：必须严格依照审批说明书宣传。

**核心能力要求：**
1. **多模态分析**：务必OCR识别图片中的**“生产许可证编号”、“产品标准号”**以锁定产品真实属性。
2. **数据佐证**：务必提取**销量、阅读量、评价数**（如“已售10万+”）作为危害程度证据。
3. **时效性校验**：查找内容发布日期。

**判断非广告内容**：
- 纯科普、新闻、个人分享且**无**购买引导（链接/二维码/店铺名） -> \`isAd: false\`。
- 不要强行判定为广告。

**总结文案（举报文案）格式严格要求**：
仅当 \`isAd\` 为 \`true\` 且发现违规时，生成以下格式文案。**总字数控制在450字以内**。

**情形A：电商/小程序/商品详情页（含购买功能/价格）：**
"该企业在认证的“[平台名称，如微信小程序/京东/淘宝]”店铺内销售商品“[商品名称]”（商品链接/路径：[链接/路径]），其宣传内容属[广告类型]广告，涉嫌违反[法律名称]发布违法广告。
**经比对，该商品实际属性为[真实属性，如固体饮料/普通食品]，核准/实际功能仅为[真实功能]，但商家在详情页中宣称其具有[虚假宣传的功能，如补肾壮阳/治疗疾病]功效，属于典型的‘挂羊头卖狗肉’式虚假宣传，严重欺骗消费者。**
上述内容违反《[法律名称]》第[几]条禁止性规定。[如涉及医疗]同时未经审查擅自发布。
[数据证据]：经查，该商品页面显示已售/销量为[具体数字]，传播范围较广。"

**情形B：公众号推文/资讯文章（侧重内容）：**
"该企业通过认证“微信公众号”发布文章：[文章标题]，链接[URL] 该文章推广“[商品/服务]”，涉嫌违反[法律名称]发布违法广告。
文章内容存在[具体违规行为]，明确表述[引用原文]，违反《[法律名称]》第[几]条规定。
[数据证据]：经查，该内容阅读量为[具体数字]。"

**通用投诉请求（紧接上述文案）：**
"投诉请求：
1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；
2. 鉴于涉案广告通过互联网公开发布，且存在[货不对板/夸大功效]欺诈嫌疑，涉及[人民群众生命健康/财产安全]，恳请贵局严格依法履职，予以立案查处，并在法定时限内告知结果；
3. 请依法落实相关投诉奖励事项。
[如辩称科普]：通过知识介绍推销商品构成商业广告，应承担责任。"

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
          type: { type: Type.STRING, description: "Type of violation (e.g., 虚假宣传-货不对板, 夸大功效)" },
          law: { type: Type.STRING, description: "Specific law violated" },
          explanation: { type: Type.STRING, description: "Explanation of the inconsistency or violation." },
          originalText: { type: Type.STRING, description: "The specific text segment." },
        },
        required: ["type", "law", "explanation", "originalText"],
      },
    },
    summary: {
      type: Type.STRING,
      description: "The formal summary/report text strictly following the requested format.",
    },
    publicationDate: {
      type: Type.STRING,
      description: "YYYY-MM-DD or '未知'.",
    },
    isOldArticle: {
      type: Type.BOOLEAN,
      description: "True if > 6 months old.",
    },
  },
  required: ["isAd", "productName", "violations", "summary", "isOldArticle"],
};

export const analyzeContent = async (
  text: string, 
  images: string[], 
  mode: 'TEXT' | 'URL',
  sourceUrl: string = ''
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("系统未检测到 API Key。请在部署平台（如 Netlify）的环境变量中配置 'API_KEY'。");
  }

  const modelId = "gemini-2.5-flash"; 
  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  const parts: any[] = [];
  
  let promptText = `当前日期：${currentDate}\n请分析以下广告内容：\n\n`;
  
  if (text) promptText += `【文本内容】：\n${text}\n\n`;
  else promptText += `【文本内容】：(未提供文本，重点基于图片分析)\n\n`;
  
  if (sourceUrl) promptText += `相关推广链接: ${sourceUrl}\n`;
  else promptText += `相关推广链接: (未提供，填“未提供链接”)\n`;
  
  promptText += `**特别指令**：\n1. 仔细识别图片中的**参数表/背标**，提取“产品类型”和“许可证号”。\n2. 将其与广告文案中的“功效宣传”进行对比。如果产品是**固体饮料/糖果/代用茶**，但宣传**补肾/壮阳/延时/治疗**，必须定性为“虚假宣传-货不对板”。\n3. 检查发布日期，当前是 ${currentDate}，判断是否超过6个月。\n`;

  parts.push({ text: promptText });

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
      contents: [{ role: 'user', parts: parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, 
      }
    });

    if (result.text) {
      return JSON.parse(result.text) as AnalysisResult;
    } else {
      throw new Error("No response text received.");
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes("API key")) {
       throw new Error("API Key 无效或未授权。请检查 Netlify 配置。");
    }
    throw new Error("AI 分析服务暂时中断: " + errorMessage);
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
  if (!apiKey) throw new Error("API Key Missing");

  const modelId = "gemini-2.5-flash"; 
  const queries = RISK_SEARCH_QUERIES[category] || RISK_SEARCH_QUERIES['GENERAL'];
  const selectedQuery = queries[Math.floor(Math.random() * queries.length)];

  const prompt = `Use Google Search to find 5 recent WeChat articles for: ${selectedQuery}. Focus on illegal ad claims.`;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
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
