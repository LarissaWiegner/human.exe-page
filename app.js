
gsap.registerPlugin(ScrollTrigger);

const heroTl = gsap.timeline({ delay: 0.2 });
heroTl
  .from(".hero-title", { y: 80, opacity: 0, duration: 1.1, ease: "power3.out" })
  .to(".hero-title", { textShadow: "0 0 18px currentColor, 0 0 36px currentColor", duration: 0.6 }, "-=0.3");

gsap.to("#hero .hologram", {
  y: -80, opacity: 0.9, ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 }
});


gsap.from(".trait-card", {
  y: 40, opacity: 0, duration: 0.8, ease: "power2.out", stagger: 0.15,
  scrollTrigger: { trigger: "#narrativa", start: "top 75%", end: "bottom 40%", toggleActions: "play none none reverse" }
});


document.querySelectorAll(".trait-card").forEach(card => {
  const pct = +card.dataset.progress || 0;
  const fill = card.querySelector(".mini-bar");
  gsap.fromTo(fill, { '--w': '0%' }, {
    '--w': `${pct}%`,
    duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" }
  });
 
  fill.style.setProperty('position','relative');
  fill.innerHTML = `<span style="position:absolute;left:0;top:0;bottom:0;width:var(--w);background:currentColor;opacity:.6;border-radius:999px;"></span>`;
});


gsap.fromTo("#status .fill",
  { width: "0%" },
  {
    width: "100%", duration: 1.6, ease: "power2.out", stagger: 0.25,
    scrollTrigger: { trigger: "#status", start: "top 70%", end: "bottom 40%", toggleActions: "play none none reverse" }
  }
);


gsap.from("#decision .decision-title", {
  y: 30, opacity: 0, duration: 0.8, ease: "power2.out",
  scrollTrigger: { trigger: "#decision", start: "top 75%" }
});
gsap.from("#decision .summary", {
  y: 20, opacity: 0, duration: 0.8, ease: "power2.out",
  scrollTrigger: { trigger: "#decision", start: "top 70%" }
});


const btns = gsap.utils.toArray(".btn-anim");

btns.forEach((btn) => {

  btn.addEventListener("mouseenter", () => {
    gsap.to(btn, { scale: 1.04, duration: 0.18, ease: "power1.out", boxShadow: "0 0 28px rgba(0, 255, 255, .35)" });
  });
  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, { scale: 1.0, duration: 0.18, ease: "power1.inOut", boxShadow: "0 0 0px rgba(0,0,0,0)" });
  });

  btn.addEventListener("click", () => {
    gsap.fromTo(btn, { scale: 0.98 }, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" });
  });
});

const cards = gsap.utils.toArray(".trait-card");
const totalTraits = cards.length;
let decisions = {}; 

const approvedEl = document.getElementById("traits-approved");
const probFill   = document.querySelector(".prob-fill");
const probText   = document.getElementById("prob-text");
const systemReco = document.getElementById("system-reco");
const savedList  = document.getElementById("saved-list");
const killedList = document.getElementById("killed-list");
const finalReason = document.getElementById("final-reason");

function countApproved(){ return Object.values(decisions).filter(v => v === "save").length; }


function makeChip({icon, title, progress, tone}) {
  const li = document.createElement("li");
  li.innerHTML = `<span class="chip-icon">${icon}</span>${title}<span class="chip-pct">(${progress}% active)</span>`;
  if (tone === "save"){
    li.style.borderColor = "rgba(52,211,153,.6)";
    li.style.color = "#a7f3d0";
  } else {
    li.style.borderColor = "rgba(248,113,113,.6)";
    li.style.color = "#fecaca";
  }
  return li;
}

function refreshChoiceLists(){
  savedList.innerHTML = "";
  killedList.innerHTML = "";

  cards.forEach(card=>{
    const title = card.querySelector(".trait-title")?.textContent?.trim() || "Unknown";
    const icon  = card.querySelector(".icon")?.textContent?.trim() || "•";
    const progressText = card.querySelector(".pct")?.textContent?.trim() || "0% ACTIVE";
    const progress = parseInt(progressText, 10) || 0;

    const state = decisions[title];
    if (!state) return;

    const chip = makeChip({ icon, title, progress, tone: state === "save" ? "save" : "kill" });
    (state === "save" ? savedList : killedList).appendChild(chip);
  });
}

function refreshDecisionUI() {
  const approved = countApproved();
  const pct = Math.round((approved / totalTraits) * 100);

  approvedEl.textContent = `${approved} / ${totalTraits}`;
  probFill.style.width = `${pct}%`;
  probText.textContent = `${pct}%`;

  const preserve = approved >= totalTraits / 2; 
  systemReco.textContent = preserve ? "PRESERVE SPECIES" : "CONTAINMENT ADVISED";
  systemReco.classList.toggle("warn", !preserve);

  finalReason.innerHTML = preserve
    ? `<span class="ok">PRESERVE</span> — <strong>${approved}/${totalTraits}</strong> aprovados (${pct}%).`
    : `<span class="warn">CONTAIN</span> — apenas <strong>${approved}/${totalTraits}</strong> aprovados (${pct}%).`;

  refreshChoiceLists();
}

cards.forEach(card=>{
  const title = card.querySelector(".trait-title")?.textContent?.trim() || "Unknown";

  card.querySelector(".btn-save")?.addEventListener("click", ()=>{
    card.classList.remove("killed");
    if (!card.classList.contains("saved")) {
      card.classList.add("saved");
      gsap.fromTo(card, { boxShadow: "0 0 0 rgba(52,211,153,0)" }, { boxShadow: "0 0 24px rgba(52,211,153,.25)", duration:.3 });
    }
    decisions[title] = "save";
    refreshDecisionUI();
    maybeScrollToDecision();
  });

  card.querySelector(".btn-kill")?.addEventListener("click", ()=>{
    card.classList.remove("saved");
    if (!card.classList.contains("killed")) {
      card.classList.add("killed");
      gsap.fromTo(card, { boxShadow: "0 0 0 rgba(248,113,113,0)" }, { boxShadow: "0 0 24px rgba(248,113,113,.22)", duration:.3 });
    }
    decisions[title] = "kill";
    refreshDecisionUI();
    maybeScrollToDecision();
  });
});

function maybeScrollToDecision(){
  const decided = Object.keys(decisions).length;
  if (decided === totalTraits) {
    document.getElementById("decision")?.scrollIntoView({ behavior: "smooth" });
  }
}

refreshDecisionUI();

document.getElementById("download-report")?.addEventListener("click", () => {
  const content = `HUMAN.EXE STATUS REPORT
Generated: ${new Date().toLocaleString()}

Traits Approved: ${approved}/${totalTraits}
Success Probability: ${Math.round((approved/totalTraits)*100)}%
System Recommendation: ${approved >= totalTraits/2 ? "PRESERVE SPECIES" : "CONTAINMENT ADVISED"}
`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "human-status-report.txt";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});


(function(){
  const ready = (cb) => (document.readyState !== "loading")
    ? cb()
    : document.addEventListener("DOMContentLoaded", cb);

  ready(() => {
    const btnPreserve = document.getElementById("btn-preserve");
    const btnContain  = document.getElementById("btn-contain");
    const bannerWrap  = document.getElementById("decision-banner");
    const bannerCard  = bannerWrap?.querySelector(".decision-banner__inner");
    const badgeEl     = document.getElementById("decision-badge");
    const titleEl     = document.getElementById("decision-title");
    const copyEl      = document.getElementById("decision-copy");
    const btnReset    = document.getElementById("btn-reset");

    if (!btnPreserve || !btnContain) {
      console.warn("[human.exe] Botões finais não encontrados (btn-preserve/btn-contain).");
      return;
    }

    function getDecisionState(){
      const total = document.querySelectorAll(".trait-card").length;
      let approved = 0;
      if (typeof decisions === "object" && decisions) {
        approved = Object.values(decisions).filter(v => v === "save").length;
      } else {
        approved = document.querySelectorAll(".trait-card.saved").length;
      }
      return { approved, total, pct: Math.round((approved/Math.max(total,1))*100) };
    }

    function showDecision(kind){ 
      if (!bannerWrap || !bannerCard) return;

      const { approved, total, pct } = getDecisionState();
      bannerWrap.classList.remove("hidden");
      bannerCard.classList.remove("decision--ok","decision--bad");

      if (kind === "preserve") {
        bannerCard.classList.add("decision--ok");
        badgeEl.textContent = "HUMANITY PRESERVED";
        titleEl.textContent = "Human.exe: VALUE CONFIRMED";
        copyEl.innerHTML = `A humanidade foi <strong>salva</strong>. ${approved}/${total} traços aprovados (${pct}%).<br>
        Motivo: afeto, empatia e criatividade superam o risco.`;
      } else {
        bannerCard.classList.add("decision--bad");
        badgeEl.textContent = "CONTAINMENT PROTOCOL";
        titleEl.textContent = "Human.exe: SPECIES CONTAINED";
        copyEl.innerHTML = `A humanidade foi <strong>apagada</strong>. ${approved}/${total} traços aprovados (${pct}%).<br>
        Motivo: valores insuficientes para continuidade segura.`;
      }

      if (window.gsap) {
        gsap.fromTo(bannerCard, { y: 20, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .55, ease: "power2.out" });
      } else {
        bannerCard.style.opacity = "1";
      }
    }

    function resetDecisions(){
    
      document.querySelectorAll(".trait-card").forEach(c => c.classList.remove("saved","killed"));
    
      if (typeof decisions === "object" && decisions) {
        for (const k of Object.keys(decisions)) delete decisions[k];
      }
   
      if (typeof refreshDecisionUI === "function") refreshDecisionUI();

     
      if (window.gsap) {
        gsap.to(bannerCard, { opacity: 0, y: -10, duration: .25, onComplete(){
          bannerWrap.classList.add("hidden");
          bannerCard.removeAttribute("style");
        }});
      } else {
        bannerWrap.classList.add("hidden");
      }
    }

    btnPreserve.addEventListener("click", () => showDecision("preserve"));
    btnContain .addEventListener("click", () => showDecision("contain"));
    btnReset   ?.addEventListener("click", resetDecisions);
  });
})();

