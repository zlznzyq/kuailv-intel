import { useState, useCallback } from "react";

// ============ DATA ============
const COMP_DATA = {
  餐饮: [
    "美菜","优大集（淘大集）","绿春翔","掌厨","川为","晓餐","山禾冻品",
    "户达到家","菜洋洋","菜大王","京喜通","新冻网","冻品到家","冻品云",
    "蜀海","彩食鲜","望家欢","乐禾","国字菜篮子","水万","拼食材","餐馆无忧"
  ],
  流通: [
    "标果","钛果","淘果","京喜通","美宜家","首衡集配","万邦集配","八家子集采",
    "般果","启果果","翠鲜缘","爱助农","强果","菜云网","嘉品云市","全品供应链",
    "易酒批","赵一鸣零食","零食很忙","鸣鸣很忙","钱大妈","真市美","帮便利",
    "拼便宜","彩华商贸（悦合集）","乐尔乐","永辉超市","物美","家乐福","比优特","全都有"
  ]
};

const PRIORITY = new Set(["美菜","标果","京喜通","菜大王","般果","蜀海","彩食鲜","首衡集配","鸣鸣很忙"]);

const IND_KEYWORDS = {
  餐饮: ["餐饮供应链","食材B2B","生鲜供应链","央厨","团餐配送","餐饮食材"],
  流通: ["零售流通","标品供应链","量贩零食","便利店","商超","经销商","快消流通"]
};

// ============ HELPERS ============
function getTodayStr() {
  return new Date().toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}).replace(/\//g,"-");
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
  const sun = new Date(now); sun.setDate(now.getDate() - day + 7);
  const fmt = d => `${d.getMonth()+1}月${d.getDate()}日`;
  return `${fmt(mon)}-${fmt(sun)}`;
}

function getIssueNum() {
  const start = new Date("2026-01-05");
  const now = new Date();
  return Math.max(1, Math.ceil((now - start) / (7*24*3600*1000)));
}

// ============ SMALL COMPONENTS ============
function Spinner() {
  return (
    <span style={{display:"inline-flex",gap:3,alignItems:"center",verticalAlign:"middle"}}>
      {[0,1,2].map(i=>(
        <span key={i} style={{
          width:5,height:5,borderRadius:"50%",background:"currentColor",
          animation:"blink 1.2s ease-in-out infinite",
          animationDelay:`${i*0.2}s`,opacity:0.7
        }}/>
      ))}
    </span>
  );
}

function ProgressRing({done, total, size=48}) {
  const r = size/2-5;
  const circ = 2*Math.PI*r;
  const pct = total ? done/total : 0;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8e8e8" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f97316" strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
        style={{transition:"stroke-dashoffset 0.4s ease"}}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        style={{transform:`rotate(90deg) translate(0,-${size}px)`,fontSize:11,fontWeight:700,fill:"#f97316"}}>
        {done}/{total}
      </text>
    </svg>
  );
}

function NewsItem({item, onRemove, idx}) {
  return (
    <div style={{
      borderLeft:"3px solid",
      borderLeftColor: item.isIndustry?"#60a5fa":"#f97316",
      background:"#fafafa",borderRadius:"0 8px 8px 0",
      padding:"14px 16px",marginBottom:10,position:"relative",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
            <span style={{
              fontSize:12,fontWeight:700,color:"#fff",
              background: item.isIndustry?"#3b82f6":"#f97316",
              padding:"2px 8px",borderRadius:4
            }}>
              {item.isIndustry ? (item.category||item.type||"行业动态") : item.company}
            </span>
            {item.type && !item.isIndustry && (
              <span style={{fontSize:11,color:"#94a3b8",border:"1px solid #e2e8f0",
                padding:"1px 7px",borderRadius:4}}>{item.type}</span>
            )}
            {item.isPriority && (
              <span style={{fontSize:11,color:"#f97316"}}>★ 重点</span>
            )}
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#1e293b",lineHeight:1.5,marginBottom:6}}>
            {idx+1}. {item.company && !item.isIndustry ? `${item.company}：` : ""}{item.title}
          </div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.8,marginBottom:8}}>{item.summary}</div>
          {item.url && item.url!=="暂无链接" && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              style={{fontSize:12,color:"#3b82f6",wordBreak:"break-all"}}>{item.url}</a>
          )}
        </div>
        <button onClick={onRemove} style={{
          border:"none",background:"none",cursor:"pointer",
          color:"#cbd5e1",fontSize:18,padding:4,flexShrink:0,lineHeight:1
        }}>×</button>
      </div>
    </div>
  );
}

const iStyle = {
  width:"100%",padding:"8px 10px",borderRadius:7,
  border:"1px solid #e2e8f0",background:"white",
  fontSize:13,marginBottom:8,boxSizing:"border-box",
  outline:"none",color:"#1e293b",fontFamily:"inherit"
};

function btnStyle(v) {
  return {
    padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",
    fontSize:13,fontWeight:600,transition:"opacity 0.15s",
    background: v==="primary"?"linear-gradient(135deg,#f97316,#ea580c)"
      : v==="blue"?"#3b82f6"
      : "rgba(0,0,0,0.06)",
    color: v==="ghost"?"#64748b":"white",
  };
}

function ManualAddForm({onAdd, sector, defaultType}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({company:"",title:"",summary:"",url:"",type: defaultType||"竞对动态"});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = () => {
    if(!form.title.trim()) { alert("请填写标题"); return; }
    onAdd({
      ...form,
      sector,
      isIndustry: form.type==="行业动态"||form.type==="推荐文章",
      isPriority: PRIORITY.has(form.company),
      _manual: true,
      id: Date.now()+Math.random()
    });
    setForm({company:"",title:"",summary:"",url:"",type: defaultType||"竞对动态"});
    setOpen(false);
  };

  return (
    <div style={{marginTop:8}}>
      {!open ? (
        <button onClick={()=>setOpen(true)} style={{
          border:"1px dashed #d1d5db",background:"none",borderRadius:8,
          padding:"8px 16px",color:"#94a3b8",fontSize:13,cursor:"pointer",width:"100%"
        }}>
          + 手动添加（自己发现的文章 / 公众号 / APP信息）
        </button>
      ) : (
        <div style={{border:"1px solid #e2e8f0",borderRadius:10,padding:16,background:"#f8fafc"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:10}}>添加条目</div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            {["竞对动态","行业动态","推荐文章"].map(t=>(
              <button key={t} onClick={()=>set("type",t)} style={{
                padding:"4px 12px",borderRadius:6,border:"1px solid",cursor:"pointer",fontSize:12,
                borderColor: form.type===t?"#f97316":"#e2e8f0",
                background: form.type===t?"rgba(249,115,22,0.08)":"white",
                color: form.type===t?"#f97316":"#64748b",
                fontWeight: form.type===t?600:400
              }}>{t}</button>
            ))}
          </div>
          {form.type==="竞对动态" && (
            <input value={form.company} onChange={e=>set("company",e.target.value)}
              placeholder="公司名称（如：美菜）" style={iStyle}/>
          )}
          <input value={form.title} onChange={e=>set("title",e.target.value)}
            placeholder="一句话标题（必填，如：美菜哈尔滨供应商大会召开）" style={iStyle}/>
          <textarea value={form.summary} onChange={e=>set("summary",e.target.value)}
            placeholder="摘要：2-3句话说清楚 谁做了什么 + 关键数据 + 影响"
            style={{...iStyle,height:72,resize:"vertical"}}/>
          <input value={form.url} onChange={e=>set("url",e.target.value)}
            placeholder="原文链接（选填，直接粘贴URL）" style={iStyle}/>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={submit} style={{...btnStyle("primary"),flex:1}}>✓ 确认添加</button>
            <button onClick={()=>setOpen(false)} style={btnStyle("ghost")}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [tab, setTab] = useState("collect");
  const [checklist, setChecklist] = useState({});
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState({餐饮:false, 流通:false});
  const [weeklyText, setWeeklyText] = useState("");
  const [wechatText, setWechatText] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [expandSector, setExpandSector] = useState({餐饮:true, 流通:true});
  const [apiError, setApiError] = useState("");

  const TODAY = getTodayStr();

  const toggleCheck = (name) => setChecklist(p=>({...p,[name]:!p[name]}));
  const checkedCount = (sector) => COMP_DATA[sector].filter(c=>checklist[c]).length;
  const totalChecked = Object.values(checklist).filter(Boolean).length;
  const totalComps = Object.values(COMP_DATA).flat().length;

  const removeItem = (id) => setNewsItems(p=>p.filter(x=>x.id!==id));
  const addItem = (item) => setNewsItems(p=>[...p, item]);
  const sectorItems = (sector, type) => newsItems.filter(x=>x.sector===sector&&x.type===type);

  const fetchSector = useCallback(async (sector) => {
    setLoading(p=>({...p,[sector]:true}));
    setApiError("");
    const targets = COMP_DATA[sector].slice(0,10);

    const prompt = `你是美团快驴进货战略商分团队的AI情报助手，专注于B2B食材供应链和零售流通行业。

请搜索以下${sector}竞对公司近两周的最新动态：
${targets.map(t=>`- ${t}${PRIORITY.has(t)?" ★重点":""}`).join("\n")}

同时搜索行业关键词近期重要动态（优先找深度分析文章）：
${IND_KEYWORDS[sector].join("、")}

重点关注：新开城市/扩张、新增品类、新商业模式、融资/合并/上市、暴雷/违规/处罚、重大战略合作、公开经营数据。

返回JSON数组，每条：
{
  "company": "公司名（行业动态填空字符串）",
  "title": "一句话标题（格式参考：美菜哈尔滨供应商大会如约召开、鸣鸣很忙港股上市开盘大涨80%）",
  "summary": "2-4句摘要，包含：背景+事件+关键数据+对行业意义",
  "url": "原文链接（无则填暂无链接）",
  "type": "竞对动态或行业动态或推荐文章",
  "isIndustry": false,
  "date": "如2026-02-06"
}

只返回JSON数组，不要其他任何文字。`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:4000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]
        })
      });

      if(!res.ok) {
        const err = await res.text();
        throw new Error(`API错误 ${res.status}: ${err.slice(0,200)}`);
      }

      const data = await res.json();
      let raw = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const s=raw.indexOf("["), e=raw.lastIndexOf("]");

      if(s!==-1&&e!==-1){
        const parsed = JSON.parse(raw.slice(s,e+1));
        const items = parsed.map((x,i)=>({
          ...x,
          sector,
          isIndustry: x.type==="行业动态"||x.type==="推荐文章"||!x.company,
          isPriority: PRIORITY.has(x.company),
          id: Date.now()+i+Math.random()
        }));
        setNewsItems(p=>[...p.filter(x=>x.sector!==sector||x._manual), ...items]);
        const found = new Set(items.map(x=>x.company).filter(Boolean));
        setChecklist(p=>{
          const next={...p};
          found.forEach(c=>{ if(COMP_DATA[sector]?.includes(c)) next[c]=true; });
          return next;
        });
      } else {
        setApiError("未能解析到动态数据，请重试");
      }
    } catch(err) {
      console.error(err);
      setApiError(err.message||"请求失败，请重试");
    } finally {
      setLoading(p=>({...p,[sector]:false}));
    }
  }, []);

  const generateReport = useCallback(async () => {
    if(newsItems.length===0){alert("请先搜索或添加竞对动态");return;}
    setGenLoading(true);
    setWeeklyText("");
    setWechatText("");

    const fmt = (items) => items.map((x,i)=>
      `${i+1}. ${x.company?"["+x.company+"] ":""}${x.title}\n摘要：${x.summary}\n链接：${x.url||"暂无"}`
    ).join("\n\n") || "（本周暂无）";

    const issueNum = getIssueNum();
    const weekRange = getWeekRange();

    const prompt = `你是美团快驴进货战略商分团队的周报编辑助手。

请根据以下动态生成标准格式竞对周报：

=== 餐饮竞对动态 ===
${fmt(sectorItems("餐饮","竞对动态"))}

=== 餐饮行业动态 ===
${fmt(sectorItems("餐饮","行业动态"))}

=== 餐饮推荐文章 ===
${fmt(sectorItems("餐饮","推荐文章"))}

=== 流通竞对动态 ===
${fmt(sectorItems("流通","竞对动态"))}

=== 流通行业动态 ===
${fmt(sectorItems("流通","行业动态"))}

=== 流通推荐文章 ===
${fmt(sectorItems("流通","推荐文章"))}

严格按以下格式输出，适合直接粘贴到大象/飞书文档：

竞对/行业动态周报 ${TODAY.slice(0,7).replace("-","年").replace("-","月")}第${issueNum}期（${weekRange}）

一、餐饮

1）竞对动态

[每条格式：
序号.公司名：一句话标题

摘要正文（2-4句，说清楚背景+事件+关键数据+影响，语言专业简洁）

原文链接]

2）行业动态

[同上格式，不需公司名前缀]

3）推荐文章（如有）

[文章标题+2句话说明价值+链接]

二、流通

1）竞对动态

[同餐饮格式]

2）行业动态

3）推荐文章（如有）

保留原始链接不变，语言专业简洁，中文输出。`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:4000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await res.json();
      const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      setWeeklyText(text);

      // 生成群消息版本
      const wcRes = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          messages:[{role:"user",content:`根据以下周报，生成一条适合企业微信/微信群的简短推送（200字内）：

格式：
🗞️ 竞对周报速览 ${TODAY}
本期要点：
• [3-5条，每条15字内，最重要的事]
📄 详见本周周报文档

周报内容：${text.slice(0,1000)}`}]
        })
      });
      const wd = await wcRes.json();
      setWechatText(wd.content.filter(b=>b.type==="text").map(b=>b.text).join(""));
    } catch(err) {
      setWeeklyText("生成失败："+err.message);
    } finally {
      setGenLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsItems, TODAY]);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text).then(()=>{
      setCopyMsg(label+" ✓ 已复制");
      setTimeout(()=>setCopyMsg(""), 3000);
    });
  };

  // ============ STYLES ============
  const S = {
    root:{minHeight:"100vh",background:"#f0f2f5",fontFamily:"'Noto Sans SC','PingFang SC',sans-serif",color:"#1e293b"},
    header:{
      background:"#fff",borderBottom:"1px solid #e8ecf0",
      padding:"0 24px",display:"flex",alignItems:"center",
      justifyContent:"space-between",height:58,
      position:"sticky",top:0,zIndex:100,
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)"
    },
    main:{maxWidth:1100,margin:"0 auto",padding:"20px 20px"},
    card:{background:"#fff",borderRadius:12,border:"1px solid #e8ecf0",marginBottom:16,overflow:"hidden"},
    cardHead:{
      padding:"14px 20px",borderBottom:"1px solid #f1f5f9",
      display:"flex",justifyContent:"space-between",alignItems:"center"
    },
    cardBody:{padding:"16px 20px"},
    badge:(color="#f97316")=>({
      display:"inline-flex",alignItems:"center",justifyContent:"center",
      minWidth:20,height:20,borderRadius:10,fontSize:11,fontWeight:700,
      background:color,color:"#fff",padding:"0 6px",marginLeft:5
    }),
    subHead:{
      fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"0.06em",
      marginBottom:10,display:"flex",alignItems:"center",gap:6,
      textTransform:"uppercase"
    },
  };

  const sectors = ["餐饮","流通"];

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
        @keyframes blink{0%,100%{opacity:0.2}50%{opacity:1}}
        *{box-sizing:border-box}
        textarea,input{font-family:inherit}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        a{color:#3b82f6}
      `}</style>

      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:"linear-gradient(135deg,#f97316,#dc6f0c)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20
          }}>🦞</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,lineHeight:1.2}}>快驴情报站</div>
            <div style={{fontSize:11,color:"#94a3b8"}}>美团快驴进货 · 战略商分</div>
          </div>
        </div>

        <div style={{display:"flex",gap:4}}>
          {[
            ["collect","📋 信息采集"],
            ["preview","📄 周报预览"],
            ["push","📤 推送消息"],
            ["checklist","✅ Check进度"]
          ].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",
              fontSize:13,fontWeight: tab===id?600:400,
              background: tab===id?"rgba(249,115,22,0.1)":"transparent",
              color: tab===id?"#f97316":"#64748b",
            }}>{label}</button>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <ProgressRing done={totalChecked} total={totalComps} size={44}/>
          <div style={{fontSize:12,color:"#64748b"}}>
            <div style={{fontWeight:700,color:"#f97316",fontSize:15}}>{newsItems.length} 条</div>
            <div>本期已采集</div>
          </div>
        </div>
      </header>

      <main style={S.main}>

        {/* ── COLLECT TAB ── */}
        {tab==="collect" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:700}}>信息采集工作台</h2>
                <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>
                  第{getIssueNum()}期 · {getWeekRange()} · {TODAY}
                </p>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {apiError && <span style={{fontSize:12,color:"#ef4444",maxWidth:200}}>{apiError}</span>}
                <button onClick={()=>fetchSector("餐饮")} disabled={loading["餐饮"]}
                  style={{...btnStyle("primary"),opacity:loading["餐饮"]?0.6:1}}>
                  {loading["餐饮"]?<><Spinner/> 搜索中…</>:"🔍 AI扫描餐饮"}
                </button>
                <button onClick={()=>fetchSector("流通")} disabled={loading["流通"]}
                  style={{...btnStyle("blue"),opacity:loading["流通"]?0.6:1}}>
                  {loading["流通"]?<><Spinner/> 搜索中…</>:"🔍 AI扫描流通"}
                </button>
              </div>
            </div>

            {sectors.map(sector=>(
              <div key={sector} style={S.card}>
                <div style={S.cardHead}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:15,fontWeight:700}}>
                      {sector==="餐饮"?"一、餐饮板块":"二、流通板块"}
                    </span>
                    <span style={S.badge()}>
                      {checkedCount(sector)}/{COMP_DATA[sector].length} checked
                    </span>
                    <span style={S.badge("#10b981")}>
                      {sectorItems(sector,"竞对动态").length} 竞对
                    </span>
                    {sectorItems(sector,"行业动态").length>0 && (
                      <span style={S.badge("#3b82f6")}>
                        {sectorItems(sector,"行业动态").length} 行业
                      </span>
                    )}
                  </div>
                  <button onClick={()=>setExpandSector(p=>({...p,[sector]:!p[sector]}))}
                    style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>
                    {expandSector[sector]?"▲":"▼"}
                  </button>
                </div>

                {expandSector[sector] && (
                  <div style={S.cardBody}>
                    {/* Check 区域 */}
                    <div style={{marginBottom:16,padding:"12px 14px",background:"#f8fafc",borderRadius:8}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:8}}>
                        竞对 CHECK — 点击标记已查看的公司 &nbsp;
                        <span style={{color:"#f97316",fontWeight:400}}>★=重点优先查</span>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {COMP_DATA[sector].map(name=>(
                          <button key={name} onClick={()=>toggleCheck(name)} style={{
                            padding:"4px 10px",borderRadius:5,cursor:"pointer",
                            fontSize:12,border:"1px solid",transition:"all 0.12s",
                            borderColor: checklist[name]?"#10b981":PRIORITY.has(name)?"#f97316":"#e2e8f0",
                            background: checklist[name]?"rgba(16,185,129,0.1)":"white",
                            color: checklist[name]?"#059669":PRIORITY.has(name)?"#f97316":"#94a3b8",
                            fontWeight: PRIORITY.has(name)?600:400,
                          }}>
                            {checklist[name]?"✓ ":PRIORITY.has(name)?"★ ":""}{name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 竞对动态 */}
                    <div style={S.subHead}>
                      <span>1）竞对动态</span>
                      <span style={S.badge()}>
                        {sectorItems(sector,"竞对动态").length}
                      </span>
                    </div>
                    {sectorItems(sector,"竞对动态").length===0
                      ? <div style={{color:"#94a3b8",fontSize:13,padding:"6px 0 10px"}}>
                          暂无 — 点击上方「AI扫描」或手动添加
                        </div>
                      : sectorItems(sector,"竞对动态").map((item,i)=>(
                          <NewsItem key={item.id} item={item} idx={i} onRemove={()=>removeItem(item.id)}/>
                        ))
                    }
                    <ManualAddForm
                      onAdd={(x)=>addItem({...x,type:"竞对动态",sector})}
                      sector={sector}
                      defaultType="竞对动态"
                    />

                    {/* 行业动态 */}
                    <div style={{...S.subHead,marginTop:20}}>
                      <span>2）行业动态</span>
                      <span style={S.badge("#3b82f6")}>
                        {sectorItems(sector,"行业动态").length}
                      </span>
                    </div>
                    {sectorItems(sector,"行业动态").length===0
                      ? <div style={{color:"#94a3b8",fontSize:13,padding:"6px 0 10px"}}>暂无</div>
                      : sectorItems(sector,"行业动态").map((item,i)=>(
                          <NewsItem key={item.id} item={item} idx={i} onRemove={()=>removeItem(item.id)}/>
                        ))
                    }
                    <ManualAddForm
                      onAdd={(x)=>addItem({...x,type:"行业动态",sector})}
                      sector={sector}
                      defaultType="行业动态"
                    />

                    {/* 推荐文章 */}
                    <div style={{...S.subHead,marginTop:20}}>
                      <span>3）推荐文章（如有）</span>
                    </div>
                    {sectorItems(sector,"推荐文章").length===0
                      ? <div style={{color:"#94a3b8",fontSize:13,padding:"6px 0 10px"}}>
                          暂无深度好文
                        </div>
                      : sectorItems(sector,"推荐文章").map((item,i)=>(
                          <NewsItem key={item.id} item={item} idx={i} onRemove={()=>removeItem(item.id)}/>
                        ))
                    }
                    <ManualAddForm
                      onAdd={(x)=>addItem({...x,type:"推荐文章",sector})}
                      sector={sector}
                      defaultType="推荐文章"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PREVIEW TAB ── */}
        {tab==="preview" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:700}}>周报预览</h2>
                <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>
                  共 {newsItems.length} 条动态 · 生成后可直接粘贴到大象/飞书文档
                </p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {copyMsg && <span style={{fontSize:13,color:"#10b981",fontWeight:600}}>{copyMsg}</span>}
                {weeklyText && (
                  <button onClick={()=>copyText(weeklyText,"周报全文")} style={btnStyle("ghost")}>
                    📋 复制全文
                  </button>
                )}
                <button onClick={generateReport} disabled={genLoading||newsItems.length===0}
                  style={{...btnStyle("primary"),opacity:(genLoading||newsItems.length===0)?0.5:1}}>
                  {genLoading?<><Spinner/> 生成中（约30秒）…</>:"⚡ 生成完整周报"}
                </button>
              </div>
            </div>

            {newsItems.length===0 && (
              <div style={{...S.card,padding:48,textAlign:"center",color:"#94a3b8"}}>
                <div style={{fontSize:40,marginBottom:12}}>📭</div>
                <div style={{fontSize:15,fontWeight:600,marginBottom:8,color:"#475569"}}>
                  还没有采集到动态
                </div>
                <div style={{fontSize:13,marginBottom:20}}>
                  请先在「信息采集」页面搜索或手动添加条目
                </div>
                <button style={btnStyle("primary")} onClick={()=>setTab("collect")}>
                  → 去采集信息
                </button>
              </div>
            )}

            {!weeklyText && newsItems.length>0 && (
              <div style={{...S.card,padding:40,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>📝</div>
                <div style={{fontSize:14,color:"#64748b"}}>
                  已有 <strong>{newsItems.length}</strong> 条动态，点击右上角「生成完整周报」
                </div>
              </div>
            )}

            {weeklyText && (
              <div style={S.card}>
                <div style={{...S.cardHead,justifyContent:"space-between"}}>
                  <span style={{fontWeight:700}}>📄 周报全文</span>
                  <button onClick={()=>copyText(weeklyText,"周报全文")}
                    style={{...btnStyle("primary"),padding:"6px 14px",fontSize:12}}>
                    📋 复制全文
                  </button>
                </div>
                <pre style={{
                  margin:0,padding:"20px 24px",fontSize:13,lineHeight:2,
                  color:"#1e293b",whiteSpace:"pre-wrap",wordBreak:"break-word",
                  maxHeight:580,overflowY:"auto",
                  fontFamily:"'Noto Sans SC','PingFang SC',sans-serif"
                }}>
                  {weeklyText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── PUSH TAB ── */}
        {tab==="push" && (
          <div>
            <div style={{marginBottom:20}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:700}}>推送消息</h2>
              <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>
                生成适合微信群 / 企业微信 / 大象群的简短消息
              </p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={S.card}>
                <div style={S.cardHead}>
                  <span style={{fontWeight:700}}>💬 群消息（复制发群里）</span>
                </div>
                <div style={S.cardBody}>
                  {!wechatText ? (
                    <div style={{
                      color:"#94a3b8",fontSize:13,textAlign:"center",
                      padding:"32px 0",lineHeight:2
                    }}>
                      请先在「周报预览」生成完整周报<br/>
                      群消息版本会自动同步过来
                    </div>
                  ) : (
                    <>
                      <div style={{
                        background:"#f0fdf4",border:"1px solid #bbf7d0",
                        borderRadius:8,padding:"14px 16px",
                        fontSize:14,lineHeight:2,color:"#166534",
                        whiteSpace:"pre-wrap",marginBottom:12
                      }}>{wechatText}</div>
                      <button onClick={()=>copyText(wechatText,"群消息")}
                        style={btnStyle("primary")}>
                        📋 复制群消息
                      </button>
                      {copyMsg && <span style={{marginLeft:10,fontSize:13,color:"#10b981"}}>{copyMsg}</span>}
                    </>
                  )}
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHead}>
                  <span style={{fontWeight:700}}>🐘 大象办公 使用流程</span>
                </div>
                <div style={S.cardBody}>
                  {[
                    ["Step 1","在「信息采集」完成AI扫描 + 手动补充自己发现的好文章"],
                    ["Step 2","在「周报预览」点击「生成完整周报」"],
                    ["Step 3","复制全文 → 打开大象文档 → 粘贴 → 稍作检查调整"],
                    ["Step 4","发群：在本页复制「群消息」，附上文档链接发到大象群"],
                    ["Step 5","「Check进度」页面勾选本周已查过的竞对，记录完成情况"],
                  ].map(([step, desc])=>(
                    <div key={step} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
                      <span style={{
                        minWidth:52,fontSize:11,fontWeight:700,color:"#f97316",
                        background:"rgba(249,115,22,0.08)",padding:"3px 8px",
                        borderRadius:4,textAlign:"center",flexShrink:0
                      }}>{step}</span>
                      <span style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{desc}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop:12,padding:"10px 14px",background:"#fffbeb",
                    borderRadius:8,fontSize:12,color:"#92400e",border:"1px solid #fde68a"
                  }}>
                    💡 大象文档目前暂无开放API，复制粘贴是最稳的方式。后续如有需要可对接内部webhook自动推送。
                  </div>
                </div>
              </div>
            </div>

            <div style={{...S.card,marginTop:0}}>
              <div style={S.cardHead}>
                <span style={{fontWeight:700}}>🔗 常用搜索渠道快捷入口</span>
              </div>
              <div style={{...S.cardBody,display:"flex",flexWrap:"wrap",gap:10}}>
                {[
                  ["Google","https://www.google.com/search?q="],
                  ["百度","https://www.baidu.com/s?wd="],
                  ["搜狗微信","https://weixin.sogou.com/weixin?type=2&query="],
                  ["萝卜投研","https://robo.datayes.com/"],
                  ["36氪","https://36kr.com/"],
                  ["新经销","https://www.xingjxiao.com/"],
                ].map(([name, url])=>(
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" style={{
                    padding:"8px 16px",borderRadius:8,
                    background:"#f8fafc",border:"1px solid #e2e8f0",
                    fontSize:13,color:"#475569",textDecoration:"none",fontWeight:500,
                  }}>
                    ↗ {name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHECKLIST TAB ── */}
        {tab==="checklist" && (
          <div>
            <div style={{marginBottom:20}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:700}}>竞对 Check 进度</h2>
              <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>
                对照SOP记录本期已查看的竞对 · 已完成 {totalChecked}/{totalComps}
              </p>
            </div>

            {sectors.map(sector=>(
              <div key={sector} style={S.card}>
                <div style={S.cardHead}>
                  <span style={{fontWeight:700}}>
                    {sector==="餐饮"?"一、餐饮竞对":"二、流通竞对"}
                  </span>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <ProgressRing done={checkedCount(sector)} total={COMP_DATA[sector].length}/>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{
                        const next={...checklist};
                        COMP_DATA[sector].forEach(c=>next[c]=true);
                        setChecklist(next);
                      }} style={{...btnStyle("ghost"),fontSize:12,padding:"4px 10px"}}>全选</button>
                      <button onClick={()=>{
                        const next={...checklist};
                        COMP_DATA[sector].forEach(c=>delete next[c]);
                        setChecklist(next);
                      }} style={{...btnStyle("ghost"),fontSize:12,padding:"4px 10px"}}>清空</button>
                    </div>
                  </div>
                </div>
                <div style={S.cardBody}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
                    {COMP_DATA[sector].map(name=>(
                      <div key={name} onClick={()=>toggleCheck(name)} style={{
                        display:"flex",alignItems:"center",gap:8,
                        padding:"10px 12px",borderRadius:8,cursor:"pointer",
                        border:"1px solid",transition:"all 0.15s",
                        borderColor: checklist[name]?"#10b981":PRIORITY.has(name)?"rgba(249,115,22,0.4)":"#e2e8f0",
                        background: checklist[name]?"rgba(16,185,129,0.06)":"white",
                      }}>
                        <div style={{
                          width:18,height:18,borderRadius:4,flexShrink:0,
                          border:"2px solid",
                          borderColor: checklist[name]?"#10b981":"#d1d5db",
                          background: checklist[name]?"#10b981":"white",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,color:"white",fontWeight:700
                        }}>
                          {checklist[name]?"✓":""}
                        </div>
                        <span style={{
                          fontSize:13,
                          color: checklist[name]?"#059669":PRIORITY.has(name)?"#f97316":"#374151",
                          fontWeight: PRIORITY.has(name)?600:400
                        }}>
                          {PRIORITY.has(name)?"★ ":""}{name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop:16,padding:"12px 14px",
                    background:"#f8fafc",borderRadius:8,fontSize:12,color:"#64748b"
                  }}>
                    <strong style={{color:"#475569"}}>SOP搜索渠道：</strong>
                    Google · 百度 ·&nbsp;
                    <a href="https://weixin.sogou.com/weixin?type=2&query=" target="_blank"
                      rel="noopener noreferrer">搜狗微信公众号 ↗</a>
                    &nbsp;· 竞对APP/小程序 · 抖音/视频号 · Wind / 萝卜投研
                  </div>
                </div>
              </div>
            ))}

            <div style={S.card}>
              <div style={S.cardHead}><span style={{fontWeight:700}}>本期汇总</span></div>
              <div style={{...S.cardBody,display:"flex",gap:20,flexWrap:"wrap"}}>
                {[
                  ["已Check竞对", `${totalChecked} / ${totalComps}`, totalChecked===totalComps?"#10b981":"#f97316"],
                  ["竞对动态", `${newsItems.filter(x=>x.type==="竞对动态").length} 条`, "#f97316"],
                  ["行业动态", `${newsItems.filter(x=>x.type==="行业动态").length} 条`, "#3b82f6"],
                  ["推荐文章", `${newsItems.filter(x=>x.type==="推荐文章").length} 篇`, "#8b5cf6"],
                ].map(([label,val,color])=>(
                  <div key={label} style={{textAlign:"center",flex:1,minWidth:100,
                    padding:"16px",background:"#f8fafc",borderRadius:10}}>
                    <div style={{fontSize:24,fontWeight:700,color}}>{val}</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
