// data.js: all content lives here so the daily "knowledge updater" can refresh it later.
export const CONFIG = {
  OWNER_EMAIL: "",          // feedback is emailed here via mailto if no endpoint is set
  FEEDBACK_ENDPOINT: "",    // optional: Formspree / your own backend URL (POST JSON)
  LLM_ENDPOINT: "",         // optional: your proxy to a free LLM (POST {messages} -> {text}); empty = built-in logic
  FREE_WEEKLY_LIMIT: 2,
  APP_URL: "https://example.com",
};

export const ROLES = ["Frontend","Backend","Full Stack","Android","DevOps","DevSecOps","Data Analyst","SEO","Inference Engineering","AI Engineer","AI and Data Scientist","Data Engineer","Machine Learning","PostgreSQL DBA","iOS","Blockchain","QA","Software Architect","API Design","Cyber Security","UX Design","Technical Writer","Game Developer","Server Side Game Developer","MLOps","Product Manager","Engineering Manager","Developer Relations","BI Analyst","AI Red Teaming","Network Engineer","Forward Deployed Engineer"];

export const FAMILY = {
  "Frontend":"web","Backend":"web","Full Stack":"web","API Design":"web","Software Architect":"web",
  "Android":"mobile","iOS":"mobile",
  "DevOps":"infra","PostgreSQL DBA":"infra","Network Engineer":"infra",
  "DevSecOps":"security","Cyber Security":"security","AI Red Teaming":"security",
  "Data Analyst":"data","BI Analyst":"data","Data Engineer":"data",
  "AI Engineer":"ai","AI and Data Scientist":"ai","Machine Learning":"ai","MLOps":"ai","Inference Engineering":"ai",
  "UX Design":"design","Product Manager":"product","Engineering Manager":"mgmt","QA":"qa",
  "SEO":"content","Technical Writer":"content","Developer Relations":"content",
  "Blockchain":"other","Game Developer":"other","Server Side Game Developer":"other","Forward Deployed Engineer":"other",
};

export const LEVELS = [
  { id:"fresher", label:"Fresher (0–1 yr)" },
  { id:"junior", label:"Junior (1–3 yrs)" },
  { id:"mid", label:"Mid (3–6 yrs)" },
  { id:"senior", label:"Senior (6–10 yrs)" },
  { id:"lead", label:"Lead / Director (10+ yrs)" },
];

export const FORMATS = [
  { id:"auto", label:"Auto: match the company and round (recommended)" },
  { id:"virtual", label:"Virtual (video call)" },
  { id:"inperson", label:"In person / face to face" },
  { id:"telephonic", label:"Telephonic (voice only, camera off)" },
  { id:"boardroom", label:"Boardroom / panel" },
  { id:"ceo", label:"CEO / founder" },
];

export const ACCENTS = [
  { id:"in", label:"English (Indian)", rec:"en-IN", tts:"en-IN" },
  { id:"hinglish", label:"Hinglish", rec:"en-IN", tts:"en-IN", hinglish:true },
  { id:"gb", label:"English (British)", rec:"en-GB", tts:"en-GB" },
  { id:"us", label:"English (American)", rec:"en-US", tts:"en-US" },
  { id:"za", label:"English (South African)", rec:"en-ZA", tts:"en-ZA" },
  { id:"ng", label:"English (Nigerian)", rec:"en-NG", tts:"en-NG" },
  { id:"pk", label:"English (Pakistani)", rec:"en-PK", tts:"en-IN" },
  { id:"bd", label:"English (Bangladeshi)", rec:"en-IN", tts:"en-IN" },
  { id:"cn", label:"English (Chinese accent)", rec:"en-SG", tts:"en-US" },
  { id:"id", label:"English (Indonesian accent)", rec:"en-SG", tts:"en-US" },
  { id:"br", label:"English (Brazilian accent)", rec:"en-US", tts:"en-US" },
  { id:"ru", label:"English (Russian accent)", rec:"en-US", tts:"en-US" },
  { id:"jp", label:"English (Japanese accent)", rec:"en-US", tts:"en-US" },
];

export const DIFFICULTY = {
  friendly: { label:"Friendly", silence:4000, maxDur:120000, interruptAt:0,      followUps:1, pass:55, tone:"warm" },
  normal:   { label:"Normal",   silence:3200, maxDur:100000, interruptAt:0,      followUps:1, pass:60, tone:"neutral" },
  tough:    { label:"Tough",    silence:2600, maxDur:75000,  interruptAt:45000,  followUps:2, pass:68, tone:"firm" },
  stress:   { label:"Stress",   silence:2200, maxDur:55000,  interruptAt:30000,  followUps:2, pass:72, tone:"pressure" },
};

// The daily updater rewrites knowledge.json in this shape. Defaults below are generic patterns, not claims about a specific company.
export const DEFAULT_KNOWLEDGE = {
  version: 1,
  updated: "2026-11-12",
  source: "built-in defaults (generic patterns)",
  companyTypes: {
    bigtech: { label:"Big tech / global product company",
      brief:["Teams here are small and ownership-driven, and we expect people to make good decisions with incomplete information.","We use structured interviews, so I'll be looking for clear reasoning more than perfect answers.","Collaboration across teams matters a lot for us, and so does writing clearly."],
      rounds:[{name:"Recruiter screen",mode:"screening"},{name:"Technical round 1",mode:"technical"},{name:"Technical round 2 (deep dive)",mode:"technical"},{name:"Design / case round",mode:"case"},{name:"Behavioral round",mode:"behavioral"},{name:"Hiring manager round",mode:"managerial"},{name:"HR round",mode:"hr"}] },
    services: { label:"IT services / consulting",
      brief:["Our projects are client-facing, so communication and adaptability are as important as skills.","We work in delivery teams with clear milestones and regular client reviews."],
      rounds:[{name:"HR screening",mode:"screening"},{name:"Technical round",mode:"technical"},{name:"Managerial round",mode:"managerial"},{name:"HR round",mode:"hr"}] },
    startup: { label:"Startup",
      brief:["We're a small team, so everyone wears multiple hats and moves fast.","There's very little process here; we value people who take initiative and own outcomes."],
      rounds:[{name:"Founder intro chat",mode:"screening"},{name:"Technical round",mode:"technical"},{name:"Culture & behavioral round",mode:"behavioral"},{name:"Founder / CEO round",mode:"ceo"}] },
    midproduct: { label:"Mid-size product company",
      brief:["We ship regularly and teams own their features from idea to production.","We follow a hybrid working model with regular code or design reviews."],
      rounds:[{name:"HR screening",mode:"screening"},{name:"Technical round",mode:"technical"},{name:"Managerial round",mode:"managerial"},{name:"HR round",mode:"hr"}] },
    finance: { label:"Bank / finance / consulting firm",
      brief:["We value structured thinking, accuracy and professionalism with clients.","Compliance and risk awareness are part of everyday work here."],
      rounds:[{name:"HR screening",mode:"screening"},{name:"Case round",mode:"case"},{name:"Behavioral round",mode:"behavioral"},{name:"Panel round",mode:"panel"},{name:"HR round",mode:"hr"}] },
    other: { label:"Other / not sure",
      brief:["We care about people who learn quickly and communicate clearly."],
      rounds:[{name:"Screening",mode:"screening"},{name:"Technical round",mode:"technical"},{name:"Behavioral round",mode:"behavioral"},{name:"HR round",mode:"hr"}] },
  },
  campusRounds: [{name:"Campus screening",mode:"screening"},{name:"Technical round",mode:"technical"},{name:"HR round",mode:"hr"}],
  seniorAdd: { senior:[{name:"Panel / boardroom round",mode:"panel"}], lead:[{name:"Panel / boardroom round",mode:"panel"},{name:"CEO / founder round",mode:"ceo"}] },
  trends: ["Structured behavioural questions (STAR) are widely used.","Recruiters increasingly ask how you use AI tools responsibly in your work.","Clear communication and ownership are weighted heavily, even in technical roles."],
};

export const MODE_LABEL = { screening:"Screening", technical:"Technical", case:"Case / Design", behavioral:"Behavioral", managerial:"Managerial", hr:"HR", panel:"Panel / Boardroom", ceo:"CEO / Founder", stress:"Stress" };
export const MODE_FORMAT = { screening:"telephonic", technical:"virtual", case:"virtual", behavioral:"virtual", managerial:"inperson", hr:"inperson", panel:"boardroom", ceo:"ceo", stress:"inperson" };

export const ROLE_KW = {
  web:["api","database","performance","cache","testing","scalab","security","component","state","deploy","latency","framework"],
  mobile:["lifecycle","offline","performance","architecture","release","memory","ui","testing","crash","api"],
  infra:["pipeline","automation","monitoring","incident","kubernetes","docker","cloud","terraform","availability","rollback","backup","network"],
  security:["threat","vulnerability","risk","encryption","authentication","incident","compliance","owasp","monitoring","least privilege"],
  data:["sql","query","pipeline","dashboard","metric","quality","stakeholder","model","insight","etl","warehouse","visuali"],
  ai:["model","training","evaluation","data","latency","drift","inference","prompt","accuracy","deployment","bias","retrieval"],
  design:["user","research","prototype","usability","accessibility","feedback","iteration","wireframe","metric","testing"],
  product:["user","metric","roadmap","priorit","stakeholder","customer","experiment","launch","strategy","trade-off"],
  mgmt:["team","delivery","hiring","feedback","priorit","stakeholder","mentor","roadmap","quality","culture"],
  qa:["test","automation","regression","bug","coverage","release","flaky","edge case","risk","ci"],
  content:["audience","search","keyword","documentation","metrics","community","content","developer","clarity","traffic"],
  other:["design","performance","scalab","testing","team","problem","solution","user","data"],
};

const gen = (q, kw=[]) => ({ q, kw });

export const TECH_Q = {
  web:[ gen("Explain what happens from the moment a user types a URL until the page is usable.",["dns","http","server","render","browser","cache","request"]),
        gen("How would you design and secure a REST API for a fast-growing product?",["auth","token","version","rate","validation","pagination","rest"]),
        gen("A page or endpoint has become slow in production. How do you find and fix the bottleneck?",["profile","cache","query","index","latency","monitor","bottleneck"]),
        gen("How do you manage state and data consistency in your applications?",["state","database","transaction","cache","consistency"]),
        gen("Tell me about a hard bug you tracked down. What was your process?",["debug","log","reproduce","root cause","test"]) ],
  mobile:[ gen("Walk me through the app lifecycle and how you handle state when the app goes to background.",["lifecycle","state","background","restore","memory"]),
        gen("How do you build an app that still works with poor or no network?",["offline","cache","sync","queue","retry","storage"]),
        gen("The app is slow and drains battery. How do you investigate?",["profile","memory","thread","battery","network","leak"]),
        gen("Which architecture pattern do you use and why?",["mvvm","mvc","architecture","testable","separation"]),
        gen("How do you safely release and roll back a mobile app version?",["staged","release","crash","rollback","monitor"]) ],
  infra:[ gen("Describe a CI/CD pipeline you would set up for a team shipping several times a day.",["build","test","deploy","pipeline","rollback","automation"]),
        gen("Production is down at 2 AM. Walk me through your incident response.",["alert","triage","rollback","communicate","postmortem","root cause"]),
        gen("How do you manage infrastructure as code and avoid configuration drift?",["terraform","version","review","state","drift","automation"]),
        gen("What would you monitor for a critical service, and how would you set alerts?",["latency","error","saturation","slo","alert","dashboard"]),
        gen("How do you apply least privilege and secrets management in the cloud?",["iam","secret","rotation","least privilege","audit"]) ],
  security:[ gen("How would you threat-model a new payment feature?",["threat","attack surface","stride","data flow","mitigation"]),
        gen("Walk me through how you would respond to a suspected data breach.",["contain","investigate","evidence","notify","recover","lessons"]),
        gen("How do you prioritise hundreds of vulnerabilities in a scan report?",["severity","exploit","impact","context","risk","patch"]),
        gen("Explain common web vulnerabilities from OWASP and how to prevent them.",["injection","xss","csrf","authentication","validation","encoding"]),
        gen("How do you bring security into a fast-moving development team without slowing them down?",["shift left","automation","training","review","pipeline"]) ],
  data:[ gen("How would you find the second highest salary per department using SQL, and what edge cases matter?",["window","rank","group","join","null","partition"]),
        gen("How do you make sure the data behind a dashboard can be trusted?",["quality","validation","source","definition","testing","lineage"]),
        gen("A leadership team asks 'why did revenue drop?'. How do you approach the analysis?",["segment","trend","hypothesis","metric","compare","root cause"]),
        gen("A nightly pipeline failed and the numbers are wrong. What do you do?",["monitor","retry","backfill","alert","idempotent","communicate"]),
        gen("How do you explain a complex finding to a non-technical stakeholder?",["audience","story","visual","insight","simple","action"]) ],
  ai:[ gen("How do you evaluate a model beyond accuracy, and how do you choose metrics?",["precision","recall","metric","baseline","validation","business"]),
        gen("Your model performed well offline but poorly in production. What could be wrong?",["drift","leakage","distribution","monitor","feature","skew"]),
        gen("How would you reduce latency and cost when serving a large model?",["batch","quantiz","cache","distill","gpu","throughput"]),
        gen("How do you reduce hallucinations and add guardrails to an LLM application?",["retrieval","grounding","evaluation","guardrail","prompt","citation"]),
        gen("How do you deploy, monitor and roll back ML models safely?",["pipeline","version","monitor","canary","rollback","drift"]) ],
  design:[ gen("Walk me through your design process on a recent project, from problem to launch.",["research","problem","prototype","test","iterate","metric"]),
        gen("How do you handle strong critique from stakeholders you disagree with?",["listen","data","user","trade-off","collaborate"]),
        gen("How do you make sure your designs are accessible?",["contrast","keyboard","screen reader","wcag","testing"]),
        gen("How do you measure whether a design was successful?",["metric","usability","conversion","feedback","test"]),
        gen("How would you redesign the onboarding of an app with high drop-off?",["research","funnel","friction","hypothesis","test"]) ],
  product:[ gen("How do you prioritise a roadmap when everyone wants their feature first?",["impact","effort","framework","data","stakeholder","trade-off"]),
        gen("Which metrics would you track for a new feature, and why?",["north star","retention","activation","metric","experiment"]),
        gen("Pick a product you love. How would you improve it?",["user","problem","segment","solution","metric"]),
        gen("Tell me about a product decision you made with incomplete data.",["assumption","risk","experiment","decision","learn"]),
        gen("Engineering says a feature will take twice as long as planned. What do you do?",["scope","trade-off","communicate","priorit","options"]) ],
  mgmt:[ gen("How do you handle a high performer who is hurting team morale?",["feedback","expectations","coach","impact","document"]),
        gen("How do you balance feature delivery against technical debt?",["trade-off","roadmap","risk","stakeholder","capacity"]),
        gen("How do you hire and onboard engineers so they become productive quickly?",["structured","bar","onboarding","mentor","feedback"]),
        gen("A project is going to miss its deadline. What do you do in the first 48 hours?",["assess","communicate","scope","risk","plan"]),
        gen("How do you grow people on your team and measure team health?",["growth","one-on-one","goals","feedback","metric"]) ],
  qa:[ gen("How would you design a test strategy for a new product from scratch?",["risk","pyramid","automation","manual","coverage","environment"]),
        gen("What makes automated tests flaky and how do you fix them?",["wait","data","isolation","environment","retry","root cause"]),
        gen("How do you write a bug report that a developer can act on immediately?",["steps","expected","actual","environment","severity","evidence"]),
        gen("How do you decide whether a build is ready to release?",["criteria","regression","risk","severity","sign-off"]),
        gen("Tell me about a serious bug that reached production. What did you learn?",["root cause","process","prevention","impact","learn"]) ],
  content:[ gen("How would you plan a content or SEO strategy for a new developer product?",["audience","keyword","intent","content","metric","technical"]),
        gen("How do you make complex technical topics easy to understand?",["audience","structure","example","simple","feedback"]),
        gen("How do you measure the impact of documentation, content or community work?",["metric","traffic","engagement","support","feedback"]),
        gen("Traffic dropped suddenly. How do you investigate?",["analytics","index","update","technical","competitor","root cause"]),
        gen("How do you work with engineers and product teams who are too busy to review your work?",["process","priorit","relationship","template","deadline"]) ],
  other:[ gen("Walk me through the most complex project you have worked on and your exact role.",["design","challenge","role","result","team"]),
        gen("How do you approach learning a new technology quickly for a project?",["plan","practice","project","documentation","feedback"]),
        gen("Design a solution for a problem at scale. How would you break it down?",["requirements","design","trade-off","scalab","test"]),
        gen("How do you ensure quality when deadlines are tight?",["priorit","test","risk","communicate","automation"]),
        gen("How do you debug something when you have almost no information?",["reproduce","hypothesis","log","isolate","test"]) ],
};

export const SENIOR_TECH_Q = [
  gen("How would you design this system to handle ten times today's load? Talk me through the trade-offs.",["scalab","trade-off","bottleneck","cache","partition","cost"]),
  gen("Describe a technical decision you made that you later regretted. What did you change?",["decision","trade-off","learn","impact","change"]),
  gen("How do you mentor others and raise the technical bar of a team?",["mentor","review","standard","feedback","growth"]),
];

export const GEN_Q = {
  screening:[ gen("Tell me about yourself and why you are interested in the {role} role.",["experience","skills","role","interest","goal"]),
              gen("Why {company}? What made you apply here?",["company","product","culture","growth","values"]),
              gen("What would you say are your strongest skills, and one area you are actively improving?",["strength","improve","example","learn"]),
              gen("What are you looking for in your next role?",["learn","growth","impact","team","challenge"]),
              gen("What is your notice period, and when could you realistically start?",["notice","start","available"]) ],
  behavioral:[ gen("Tell me about a time you disagreed with a teammate. How did you handle it?",["listen","perspective","resolve","outcome","communicat"]),
              gen("Tell me about a failure. What happened and what did you change afterwards?",["mistake","learn","ownership","change","result"]),
              gen("Describe a time you worked under a very tight deadline.",["priorit","plan","communicat","deliver","result"]),
              gen("Give me an example of when you took ownership beyond your job description.",["initiative","ownership","impact","result"]),
              gen("Tell me about feedback you received that was hard to hear.",["feedback","listen","improve","action","result"]),
              gen("Describe a time you influenced a decision without having authority.",["influence","data","stakeholder","align","result"]) ],
  managerial:[ gen("You have three urgent tasks and time for one. How do you decide?",["priorit","impact","stakeholder","communicat","trade-off"]),
              gen("How would you handle a team member who is consistently missing their targets?",["feedback","expectation","support","plan","document"]),
              gen("You must deliver bad news to a senior stakeholder. How do you do it?",["early","facts","options","ownership","plan"]),
              gen("Tell me about a decision you made with incomplete information.",["assumption","risk","decision","outcome","learn"]),
              gen("How do you keep people motivated through a long, difficult project?",["recognition","goal","communicat","support","clarity"]) ],
  hr:[ gen("What are your salary expectations, and how did you arrive at that number?",["market","experience","range","flexib","value"]),
       gen("Are you comfortable with our working model and with relocating if needed?",["comfort","flexib","relocat","hybrid"]),
       gen("How would you describe your ideal team culture?",["collaborat","feedback","respect","growth","ownership"]),
       gen("Where do you see yourself in five years?",["grow","skill","lead","contribute","goal"]),
       gen("Do you have any questions for us? What would you like to know about the role?",["team","expectation","growth","success","process"]) ],
  ceo:[ gen("Where do you see this industry in five years, and where does {company} fit?",["trend","market","future","opportunity","risk"]),
       gen("If you joined tomorrow, what is the first thing you would change at {company}, and why?",["observe","data","priorit","impact","humble"]),
       gen("Why should we bet on you rather than someone with more experience?",["value","example","learn","impact","ownership"]),
       gen("What is the biggest risk of hiring you, and how would you reduce it?",["honest","risk","mitigate","support","growth"]),
       gen("What does ownership mean to you? Give me a real example.",["ownership","responsib","result","initiative","example"]) ],
  stress:[ gen("Honestly, you look under-qualified for this role. Convince me otherwise.",["example","impact","skills","evidence","calm"]),
          gen("I have interviewed stronger candidates today. Why should I pick you?",["value","unique","example","confident","result"]) ],
  case:{ default:[ gen("Our app's daily active users dropped fifteen percent this month. How would you investigate?",["segment","trend","hypothesis","data","release","root cause"]),
                   gen("How would you improve the onboarding of a product with a high drop-off in the first week?",["funnel","research","friction","metric","test"]),
                   gen("We want to launch in a new country. How would you plan it?",["market","users","risk","metric","phase","local"]),
                   gen("Estimate how many people use food-delivery apps in your city every day. Walk me through your reasoning.",["population","assum","segment","estimate","sanity"]) ] },
};

export const COMPANY_PRE = {
  tough:["Let me be direct with you. This role is demanding, so I'll push on your answers.","I'll ask some probing follow-ups, please don't take them personally."],
  warm:["No pressure at all. I'm genuinely curious about how you think.","Take your time, this is a conversation, not an exam."],
};

export const FOLLOW_ACK = {
  warm:["Thanks, that's really helpful.","I like how you explained that.","Great, I can picture that clearly."],
  neutral:["Okay, thank you.","Got it.","Understood, thanks."],
  firm:["Alright.","Noted.","Okay, let me probe that a bit."],
  pressure:["Hmm.","Is that all?","I'm not fully convinced yet."],
};
export const HINGLISH_ACK = ["Achha, samajh gaya.","Theek hai, bahut badhiya.","Haan, yeh clear hai."];

export const TIPS = {
  content:["Answer the exact question in your first sentence, then support it with one real example.","Name specific tools, numbers and outcomes from your own work instead of general statements.","Before the interview, list 6 keywords from the job description and prepare one story for each."],
  structure:["Use STAR: Situation, Task, Action, Result. Spend most time on Action and Result.","Start with a one-line summary, give 2–3 points, then close with the outcome.","For technical questions use: definition → example → trade-off."],
  comm:["Replace filler words ('um', 'basically') with a calm one-second pause.","Aim for 120–150 words per minute; practise by reading aloud a news article with a timer.","Finish sentences with a downward tone instead of trailing off."],
  voice:["Keep a steady volume and vary your tone on key points so you don't sound monotone.","Breathe from your stomach before answering; a 2-second pause makes you sound confident.","Speak up slightly at the end of sentences. Don't let your voice fade."],
  body:["Look at the camera lens (not the screen) when making your main points.","Sit upright with relaxed shoulders and keep hands visible at chest height for natural gestures.","Smile briefly while greeting and when you talk about things you enjoy."],
  pressure:["When surprised, repeat the question, take a breath, and answer in three clear points.","Treat follow-ups as interest, not attack. Say 'Good question, here's how I think about it'.","If you don't know, say what you would do to find out; interviewers value reasoning."],
};

export const PLAN_EX = {
  content:["Write a 90-second answer to 'Tell me about yourself' and record it","Pick 3 JD keywords and write one STAR story for each","Explain one core concept from your role to a friend with an example"],
  structure:["Answer 3 random behavioural questions using STAR with a timer","Practise 'point → reason → example → point' on any topic for 1 minute","Rewrite one rambling answer into 5 sentences"],
  comm:["Read aloud for 5 minutes, pausing at every comma and full stop","Record a 1-minute talk and count your filler words; try to halve them","Shadow a clear speaker (TED talk) for 5 minutes"],
  voice:["Hum, then read aloud on one comfortable pitch for 3 minutes","Practise a loud/soft/medium sentence drill for 5 minutes","Record yourself and listen for sentences that fade at the end"],
  body:["Do a 3-minute mock answer looking only at the camera lens","Stand and sit tall for 2 minutes, then repeat while talking","Practise a 10-second warm greeting with a smile ten times"],
  pressure:["Ask a friend to interrupt you with 'why?' during a 2-minute answer","Answer 3 stress questions out loud in 30 seconds each","Practise saying 'let me think for a moment' calmly, then answering"],
};

export const WEIGHTS = {
  technical:{ content:.34, structure:.14, comm:.14, voice:.08, body:.12, pressure:.18 },
  leader:{ content:.22, structure:.16, comm:.20, voice:.10, body:.14, pressure:.18 },
  people:{ content:.18, structure:.20, comm:.22, voice:.10, body:.16, pressure:.14 },
};

export const CAT_LABEL = { content:"Answer content", structure:"Structure (STAR)", comm:"Communication", voice:"Voice", body:"Body language", pressure:"Handling hard questions" };

export const TOPICS = ["Is remote work better than working from an office?","A skill everyone should learn before turning 25","Describe a challenge you overcame and what it taught you","Should AI be allowed in classrooms and exams?","The best advice you have ever received","Social media: connecting or isolating people?","What makes a great leader?","Should companies adopt a four-day work week?","A book, film or show that changed your thinking","How should cities reduce traffic and pollution?","Is failure necessary for success?","The role of teamwork in solving big problems","If you could change one thing about your industry, what would it be?","How important is a college degree today?","What does work-life balance mean to you?","Should voting be compulsory?","Technology you could not live without","How can small businesses compete with large corporations?","Is it better to be a specialist or a generalist?","What would you do with one extra hour every day?","The importance of mental health at work","How can you build trust in a new team quickly?","Describe your ideal workday","Why does lifelong learning matter?"];

export const POLITICS = [
  { id:"credit", title:"Credit stolen in a meeting", scenario:"Your manager presents your idea in a leadership meeting as their own. Nobody knows it was yours. What do you do and say?",
    tests:[{label:"Talks to them privately / 1:1",re:/(privately|one[- ]on[- ]one|1[: ]?1|talk to (him|her|them)|after the meeting|offline)/i,w:25},{label:"Assumes positive intent",re:/(maybe|perhaps|might have|not intentional|misunderstanding|assume|unintentional)/i,w:20},{label:"Asks for visibility / attribution clearly",re:/(visibility|recognition|attribut|credit|acknowledg|how we present)/i,w:30},{label:"Proposes a way forward",re:/(going forward|next time|in future|document|share (my|the) work|send (a )?summary)/i,w:25}],
    avoid:[{label:"Accusatory words",re:/(stole|liar|cheat|unfair|backstab|thief)/i},{label:"Going to HR/skip-level first",re:/(hr|skip[- ]level|his boss|her boss).{0,30}(first|immediately|right away)/i}],
    model:"\"I'd like your help with something. The idea you presented in the meeting came from my analysis. Could we agree how we credit contributions going forward? I'd be glad to present the next update myself.\"" },
  { id:"deadline", title:"A peer keeps blocking you", scenario:"A colleague from another team keeps missing deadlines that block your work. How do you handle it?",
    tests:[{label:"Understands their constraints first",re:/(understand|ask (what|how)|their priorit|bandwidth|constraint|workload)/i,w:25},{label:"Uses facts and impact, not blame",re:/(impact|timeline|dependency|data|specific|date)/i,w:25},{label:"Agrees a clear plan or date",re:/(agree|align|plan|checkpoint|date|follow[- ]up|commit)/i,w:25},{label:"Escalates only after trying directly",re:/(escalat|manager|loop in).{0,40}(if|after|only)/i,w:25}],
    avoid:[{label:"Blame language",re:/(lazy|incompetent|useless|their fault|blame)/i}],
    model:"\"I noticed the delivery date has moved twice and it affects our launch. Could we walk through what's getting in the way and agree a date we can both commit to? If it's capacity, I'm happy to raise it with our managers together.\"" },
  { id:"risky", title:"Disagreeing with a director", scenario:"In a team meeting your director proposes a plan you believe is risky. What do you say?",
    tests:[{label:"Acknowledges the intent",re:/(i see|i understand|makes sense|good (idea|direction)|appreciate|thank)/i,w:20},{label:"Raises the concern with facts",re:/(risk|data|concern|evidence|example|impact)/i,w:30},{label:"Offers an alternative or a safeguard",re:/(alternative|option|pilot|phase|safeguard|suggest|what if)/i,w:30},{label:"Uses a question / respectful tone",re:/(could we|would it be|may i|how (might|about)|have we considered)/i,w:20}],
    avoid:[{label:"Dismissive language",re:/(wrong|bad idea|won't work|stupid|ridiculous)/i}],
    model:"\"I like the goal of moving faster. One risk I see is the migration window. Have we considered piloting with one team first so we can limit the impact if something goes wrong?\"" },
  { id:"commit", title:"Disagree and commit", scenario:"A decision was made that you disagree with. How do you show you are still a team player?",
    tests:[{label:"Shares the view once, constructively",re:/(shared|voiced|raised|expressed|put forward).{0,40}(concern|view|opinion|input)|my (view|concern|input)/i,w:30},{label:"Commits to the decision",re:/(commit|support|back (it|the)|fully behind|move forward)/i,w:30},{label:"Monitors / flags with data later",re:/(monitor|track|metric|review|revisit|data)/i,w:25},{label:"Avoids undermining it",re:/(positive|professional|team|constructive)/i,w:15}],
    avoid:[{label:"Sabotage / complaining",re:/(complain|gossip|ignore the decision|do it my way|sabotage)/i}],
    model:"\"I shared my concern and the data behind it. Since the decision is made, I'll fully support it, and I suggest we agree on a metric to review in 6 weeks so we can adjust if needed.\"" },
  { id:"gossip", title:"Office gossip", scenario:"A senior colleague starts gossiping to you about another teammate. How do you respond?",
    tests:[{label:"Stays neutral / doesn't join in",re:/(neutral|don't (join|engage)|not (comfortable|my place)|stay out|not engage)/i,w:35},{label:"Redirects politely",re:/(change the subject|redirect|focus on|move (on|back)|work)/i,w:25},{label:"Suggests talking to the person directly",re:/(talk to (them|him|her)|directly|raise it with)/i,w:20},{label:"Stays respectful to the colleague",re:/(respect|polite|professional|kind|courteous)/i,w:20}],
    avoid:[{label:"Joining in / spreading it",re:/(i also heard|tell everyone|spread|totally agree.*(lazy|useless))/i}],
    model:"\"I'd rather not talk about them when they're not here. If there's an issue, maybe it's worth raising with them directly. On another note, did you see the new roadmap?\"" },
  { id:"extra", title:"Extra work, no recognition", scenario:"You are asked to take on extra work with no extra title or pay. How do you respond?",
    tests:[{label:"Shows willingness without resentment",re:/(happy to|glad to|willing|open to|interested)/i,w:25},{label:"Clarifies scope, time and priorities",re:/(scope|priorit|capacity|bandwidth|timeline|deprioriti|trade-off)/i,w:30},{label:"Links to growth / recognition",re:/(growth|development|recogni|visibility|promotion|career|responsibilit)/i,w:30},{label:"Asks for a follow-up conversation",re:/(discuss|review|revisit|check in|follow[- ]up|in (3|three|six|6) (months|weeks))/i,w:15}],
    avoid:[{label:"Refusing flatly or complaining",re:/(not my job|no way|unfair|refuse|i won't)/i}],
    model:"\"I'm glad to help. To make sure I do it well, could we clarify what I should deprioritise? And since this adds responsibility, I'd like to discuss how it fits into my growth plan at our next review.\"" },
];

export const REWRITES = [
  { blunt:"Your code is a mess. Fix it before I review.", keys:[/(could we|would you|can we|happy to|suggest|perhaps|would it be)/i,/(readab|refactor|clean|structure|improv)/i,/(noticed|observed|i saw|i see)/i], model:"I noticed a few areas where readability could be improved. Could we pair on them before the review?" },
  { blunt:"That deadline is impossible. You didn't think this through.", keys:[/(could we|can we|would it be|help me understand)/i,/(timeline|scope|date|estimate|capacity)/i,/(option|adjust|phase|priorit|alternative)/i], model:"Help me understand how the timeline was estimated. Could we look at the scope together and explore options for phasing it?" },
  { blunt:"You're wrong, the numbers don't say that.", keys:[/(see it differently|perspective|different (view|reading))/i,/(data|numbers|figures|report)/i,/(walk|share|review|check|compare)/i], model:"I see it a bit differently based on the data I have. Could we walk through the numbers together to align?" },
  { blunt:"I don't have time for your meeting.", keys:[/(unfortunately|appreciate|thank)/i,/(bandwidth|schedule|calendar|priorit|capacity)/i,/(alternative|instead|async|email|next week|shorter|summary)/i], model:"I appreciate the invite, but my bandwidth is limited this week. Could you share an agenda, or could we sync asynchronously?" },
  { blunt:"Nobody told me about this change!", keys:[/(would have helped|i wasn't aware|wasn't aware|missed)/i,/(going forward|in future|next time|loop me in|keep me informed)/i,/(thank|appreciate|understand)/i], model:"I wasn't aware of this change. Going forward, could you loop me in earlier so I can plan accordingly?" },
  { blunt:"This is not my responsibility.", keys:[/(happy to|glad to|let me|i can)/i,/(owner|team|right (person|team)|point you|connect you)/i,/(clarify|understand|scope|ownership)/i], model:"I'm happy to help find the right owner. I believe the platform team handles this, so let me connect you with them." },
];

export const JARGON = [
  { term:"Circle back", meaning:"Return to this topic later.", ex:"\"Let's circle back on pricing after the demo.\"" },
  { term:"Bandwidth", meaning:"Available time or capacity.", ex:"\"I don't have the bandwidth this week.\"" },
  { term:"Align / alignment", meaning:"Make sure everyone agrees on the same goal.", ex:"\"Let's align with design before building.\"" },
  { term:"Stakeholder", meaning:"Anyone affected by or interested in the work.", ex:"\"We need to update key stakeholders.\"" },
  { term:"Take it offline", meaning:"Discuss it separately, not in this meeting.", ex:"\"Let's take this offline so we stay on time.\"" },
  { term:"Low-hanging fruit", meaning:"Easy wins with high value.", ex:"\"Fix the low-hanging fruit first.\"" },
  { term:"Deep dive", meaning:"A detailed look at a topic.", ex:"\"We'll do a deep dive next sprint.\"" },
  { term:"Ownership", meaning:"Being accountable for results from start to finish.", ex:"\"I'll take ownership of the migration.\"" },
];

export const NEGOTIATION = {
  recruiters:["Priya Nair","Daniel Moore","Aisha Khan","Rohan Mehta","Sofia Almeida"],
  currencies:[{id:"INR",label:"INR (annual, in LPA)"},{id:"USD",label:"USD (annual)"},{id:"EUR",label:"EUR (annual)"},{id:"GBP",label:"GBP (annual)"}],
};
