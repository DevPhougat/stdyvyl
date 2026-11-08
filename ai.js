
// Stdyvyx local AI engine. No API key, cloud inference, or per-message billing.
// WebLLM runs on the visitor's device using WebGPU. First model download can be large.
let enginePromise = null;
let engine = null;
let progressListener = null;
const MODEL_CANDIDATES = [
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
  "Phi-3.5-mini-instruct-q4f16_1-MLC"
];

export function setProgressListener(fn){ progressListener = fn; }
function progress(text){ if(progressListener) progressListener(text); }

export async function loadAI(){
  if(engine) return engine;
  if(enginePromise) return enginePromise;
  enginePromise = (async()=>{
    if(!("gpu" in navigator)) throw new Error("WebGPU is not available in this browser/device. Try the latest Chrome or Edge on a supported computer.");
    progress("Loading the local AI engine…");
    const webllm = await import("https://esm.run/@mlc-ai/web-llm");
    const available = webllm.prebuiltAppConfig.model_list.map(m=>m.model_id);
    const modelId = MODEL_CANDIDATES.find(id=>available.includes(id)) || available.find(id=>/1B|1.5B|1.7B/i.test(id)) || available.find(id=>/3B/i.test(id));
    if(!modelId) throw new Error("No small compatible model was found in this WebLLM build.");
    progress("Preparing " + modelId + " — the first download may take a while.");
    engine = await webllm.CreateMLCEngine(modelId,{
      initProgressCallback:(report)=>{
        const pct = report.progress != null ? Math.round(report.progress*100)+"%" : "";
        progress((report.text || "Downloading model…") + (pct ? " "+pct : ""));
      }
    });
    progress("Local AI is ready ✨");
    return engine;
  })();
  try{return await enginePromise;}catch(e){enginePromise=null;throw e;}
}

export async function askAI(messages, onToken=()=>{}){
  const ai = await loadAI();
  const stream = await ai.chat.completions.create({
    messages: [
      {role:"system",content:"You are Stdyvyx, a friendly, patient and accurate personal study tutor. Explain clearly, adapt to the learner, use examples and step-by-step reasoning. If a question is ambiguous, ask a short clarification. Be honest when unsure. Use readable Markdown."},
      ...messages
    ],
    temperature:0.7,
    max_tokens:900,
    stream:true
  });
  let full="";
  for await (const chunk of stream){
    const token=chunk.choices?.[0]?.delta?.content || "";
    if(token){full+=token;onToken(token,full);}
  }
  return full;
}
