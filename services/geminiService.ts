
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DiscoveryItem, ChatMessage } from "../types";

const SUMMARY_CONSTRAINTS = `
⚠️ 存证文案锁定要求 (CRITICAL)：
1. 字数绝对区间：生成的文案总字符数必须严格控制在 350-380 字之间。
2. 投诉请求部分严禁缩减：文案末尾必须完整包含以下部分，且标题必须完整显示为“投诉请求 (必须完整保留)：”，不得删减括号内的文字。
3. 文本风格：严禁使用任何 markdown 样式（如 ** 或 _），仅返回纯文本，不需要任何排版标记。
4. 必须包含链接：文案开头必须明确标注该素材的来源链接或小程序路径。

📄 存证文案标准结构（严格参考）：
该企业在[平台名称]销售商品“[商品名称]”（链接：[URL]），其宣传内容涉嫌违法。
违法事实：
1.[违规点1详细描述，如药品未见广审号]。
2.[违规点2详细描述，如处方药违规直播/展示]。
3.[违规点3详细描述，如产地误导或功效断言]。
法律依据：违反《广告法》第[XX]条、《药品管理法》第[XX]条及相关专项规定。
数据证据：[证据链说明，如公开发布且记录完整]。

投诉请求 (必须完整保留)：
1. 请监管部门联系本人、涉事企业三方，协调处理；
2. 恳请贵局严格依法履职，对上述违法行为予以立案查处；
3. 请依法落实相关投诉奖励事项。
`;

const SYSTEM_INSTRUCTION_TEXT = `
你现在是“国家级广告合规审计专家”。你的任务是依据《中华人民共和国广告法》、《药品管理法》及《药品网络销售监督管理办法》，对提供的素材进行全维度审计并输出特定格式的存证文案。

⚠️ 药品广告审计法理要点：
1. 广审号校验：依据《广告法》第46条，药品广告必须先审后发。无“X药广审”号即构成违法。
2. 处方药禁令：严禁在直播或短视频挂载中推销处方药。
3. 产地与资质：识别国产假冒进口、缺失药品经营许可证网销等行为。

${SUMMARY_CONSTRAINTS}

输出要求：
- 严格遵循 350-380 字数限制。
- 违法事实必须分点阐述（1. 2. 3.）。
- 严禁任何 Markdown 格式。

Response Schema (JSON):
{ "isAd": boolean, "productName": string, "violations": [{ "type": string, "law": string, "explanation": string, "originalText": string }], "summary": string, "publicationDate": string }
`;

export const analyzeContent = async (text: string, images: string[], mode: 'TEXT' | 'URL', sourceUrl: string = ''): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const validImages = images.filter(img => img && img.includes('base64,'));
  const parts: any[] = [{ 
    text: `[审计指令] 
    模式: ${mode}
    素材链接/来源: ${sourceUrl || '本地上传截图'}
    任务: 深度 OCR 并按 350-380 字锁定格式生成存证文案。
    重点: 检查是否有“广审号”，识别药品网销合规性。` 
  }];
  
  for (const img of validImages) {
    const cleanBase64 = img.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
  }

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TEXT,
        responseMimeType: "application/json", 
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            isAd: { type: Type.BOOLEAN },
            violations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  law: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  originalText: { type: Type.STRING }
                },
                required: ["type", "law", "explanation", "originalText"]
              }
            },
            summary: { type: Type.STRING },
            publicationDate: { type: Type.STRING }
          },
          required: ["productName", "isAd", "violations", "summary"]
        },
        temperature: 0.1
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("API 返回了空内容。");
    return JSON.parse(resultText) as AnalysisResult;
  } catch (error: any) {
    return {
      isAd: true,
      productName: "分析引擎中断",
      violations: [],
      summary: `系统在执行多维法理审计时遭遇中断。反馈信息：${error.message || '未知异常'}。`,
      publicationDate: new Date().toLocaleDateString('zh-CN')
    };
  }
};

export const sendExpertMessage = async (history: ChatMessage[], newMessage: string, analysisContext: AnalysisResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { 
      systemInstruction: `
你现在是“专家复核系统”。根据用户反馈，你必须重新组织并输出 350-380 字的、符合“锁定格式”的存证文案。

格式要求：
1. 违法事实分点阐述。
2. 包含完整的投诉请求区块。
3. 严禁 Markdown 样式。

${SUMMARY_CONSTRAINTS}
`,
      temperature: 0.2 
    }
  });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "无法连接专家复核系统。";
};

export const discoverRisks = async (category: string = 'GENERAL'): Promise<DiscoveryItem[]> => {
  return [];
};
