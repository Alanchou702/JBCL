
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { AnalysisResult, DiscoveryItem, ChatMessage } from "../types";

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
你的任务是依据《中华人民共和国广告法》、《互联网广告管理办法》、《药品管理法》、《医疗器械监督管理条例》等法规，生成**专业的合规监测报告（监管举报/存档专用）**。

**⚠️ 核心原则：**
1. **客观陈述视角**：请直接客观描述页面内容和违规事实（如“该商品详情页展示了...”，“广告内容含有...”）。**严禁**使用执法机关专用的“经查”、“已核实”、“定性”等词汇。**特别注意：不要使用“监测发现”作为句首或前缀，直接陈述事实即可。**
2. **结构严格匹配**：必须严格遵守下文定义的【监管举报/存档文案模板】格式，包括投诉请求的三个固定条款。
3. **字数强制定律**：生成的 summary 字段内容必须严格控制在 **350-400字** 之间。当前版本过于冗长，请务必删减修饰性词语，只保留核心违法事实、法律依据和证据描述。切勿长篇大论。

**✅ 深度违法情节比对逻辑（必须执行）：**

**第一维度：禁止/限制发布类（红线）**
1. **处方药（Rx）**：若商品或者内容涉及“处方药”、“Rx”，依据《广告法》第15条，**禁止**在互联网等大众传播媒介发布广告。
2. **母乳代用品**：禁止发布0-12个月婴儿配方乳粉广告（《广告法》第20条）。
3. **烟草**：禁止在互联网发布烟草广告（《广告法》第22条）。

**第二维度：资质与程序合规（广审号）**
4. **“三品一械”审查**：药品、医疗器械、保健食品、特殊医学用途配方食品。
   - 规则：依据《广告法》第46条，必须经审查并取得“广告审查批准文号”（格式如：X药广审(文)第X号）。
   - 判定：若页面为上述品类但未显著展示广审号，属于“未经审查发布广告”。

**第三维度：内容宣传边界**
5. **普通食品/化妆品/消毒品**：
   - 禁止涉及疾病治疗功能，禁止使用医疗用语（如“消炎”、“活血”、“治愈”、“抗病毒”）。（《广告法》第17条）。
6. **保健食品（蓝帽子）**：
   - 必须显著标明“本品不能代替药物”。禁止声称预防、治疗疾病。（《广告法》第18条）。
7. **医疗/药品/医械**：
   - 禁止断言功效/治愈率（“根治”、“100%有效”）。
   - 禁止利用患者/医生/专家/科研机构形象作推荐证明。（《广告法》第16条）。
8. **教育培训**：禁止对升学/通过考试作保证性承诺（《广告法》第24条）。
9. **投资理财**：禁止对收益作保证性承诺（“保本”、“无风险”）（《广告法》第25条）。

**📄 监管举报/存档文案模板 (JSON 中 summary 字段，请严格按此格式生成，换行符使用 \\n，字数控制在380字左右)：**

该企业在[平台名称]店铺销售商品“[商品名称]”（商品链接/路径：[URL]），其宣传内容涉嫌违反《中华人民共和国广告法》。
违法事实：[直接陈述事实，不要写“监测发现”。例如：该商品实际属性为医疗器械，但广告中宣称具有‘降血压’等治疗功效，且未标明广告审查批准文号；或：该商品为处方药，违规在互联网大众媒介发布广告]。广告内容误导消费者，涉嫌虚假宣传。
法律依据：上述行为涉嫌违反《中华人民共和国广告法》第[XX]条（[简要概括法条内容，如：处方药禁止广告/医疗药品广告禁止性规定]）、第二十八条之规定。
数据证据：该商品页面显示[描述销量/评价数量/浏览量等数据，如：评价数为0]，[描述传播影响，如：存在一定传播范围]。

投诉请求：
1. 请监管部门联系本人、涉事企业三方，协调配合处理此事；
2. 鉴于涉案广告通过互联网公开发布，且存在欺诈嫌疑，涉及人民群众生命健康财产安全，恳请贵局严格依法履职，予以立案查处，并在法定时限内告知结果；
3. 请依法落实相关投诉奖励事项。

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
  let userText = `Task: Regulatory Compliance Audit (Date: ${currentDate})\n`;
  
  if (mode === 'URL') {
      userText += `[Context]: E-Commerce Product Page / Shopping Mini-program.\n`;
  } else {
      userText += `[Context]: WeChat Official Account Article / Social Media Post.\n`;
  }

  if (text) userText += `[Content Text]:\n${text}\n\n`;
  else userText += `[Content Text]: (Analyze images)\n\n`;
  if (sourceUrl) userText += `[Source URL]: ${sourceUrl}\n`;
  
  userText += `\n**CRITICAL CHECKLIST**: 
  1. **Identify Category**: Is it Drug (Rx/OTC)? Medical Device? Health Food (Blue Hat)? General Food? Education? Finance?
  2. **Check Restrictions**: 
     - **Rx Drug**: STRICTLY BANNED on mass media (Art 15).
     - **Ad Review Number**: MISSING "广审号" for Drugs/Medical/HealthFood? Flag as Article 46 violation.
  3. **Check Claims**:
     - **Food**: claiming to cure disease? -> Article 17.
     - **Investment**: "Risk-free"? -> Article 25.
     - **Education**: "Guaranteed Pass"? -> Article 24.
  4. **Report Format**: STRICTLY follow the template: Intro -> 违法事实(No "监测发现") -> 法律依据 -> 数据证据 -> 投诉请求(1,2,3).
  5. **Word Count**: Keep 'summary' around 380 characters. Be concise.
  6. **Output**: Valid JSON.\n`;

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

  throw new Error("Unexpected error flow");
};

// ----------------------------------------------------------------------------
// CHAT / CORRECTION FUNCTION
// ----------------------------------------------------------------------------
export const sendExpertMessage = async (
  history: ChatMessage[],
  newMessage: string,
  analysisContext: AnalysisResult
): Promise<string> => {
  if (!dynamicApiKey) throw new Error("API Key Missing");

  const clientOptions: any = { apiKey: dynamicApiKey };
  if (dynamicBaseUrl) clientOptions.baseUrl = dynamicBaseUrl;
  const ai = new GoogleGenAI(clientOptions);

  // Prepare History
  const geminiHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const contextPrompt = `
    Context: You have just performed a regulatory compliance analysis on an advertisement.
    The analysis result was:
    Product: ${analysisContext.productName}
    Violations Found: ${analysisContext.violations.length}
    Report Summary: ${analysisContext.summary}
    
    User Instructions: The user is now asking questions or providing corrections about this specific analysis. 
    If the user corrects a fact (e.g., "This is not a drug, it's food"), accept it and explain how that changes the compliance status.
    Be helpful, professional, and act as a senior legal compliance consultant.
    Keep answers concise.
  `;

  try {
    const chat = ai.chats.create({
      model: dynamicModelId || 'gemini-2.5-flash',
      history: geminiHistory,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.3,
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "抱歉，我无法回答这个问题。";
  } catch (error: any) {
    console.error("Chat Error:", error);
    return `对话服务暂时不可用: ${error.message}`;
  }
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
