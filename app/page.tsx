import Link from "next/link";
import Logo from "../components/Logo";

export default function Landing() {
  return (
    <main>
      <nav className="landing-nav">
        <Logo />
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link href="/login">Log in</Link>
          <Link href="/signup" className="capture-button">Get started</Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">YOUR PERSONAL INFORMATION MEMORY</div>
          <h1>Remember the information.<br/><span>Forget where you saw it?</span></h1>
          <p>TraceMind helps you capture scattered information, understand it, and find it again using the way you remember it—not the exact words.</p>
          <div className="hero-actions">
            <Link href="/signup" className="capture-button">Start for free →</Link>
            <a href="#how" className="secondary-btn">See how it works</a>
          </div>
          <div className="trust-line">Screenshots · PDFs · Links · Voice · Text</div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-one"><span>🎓 Scholarship</span><strong>₹50,000</strong><small>Deadline: 15 Oct</small></div>
          <div className="memory-orb">✦<small>TraceMind</small></div>
          <div className="floating-card card-two"><span>⌕ Your search</span><strong>“engineering scholarship around 50k”</strong><small>94% match</small></div>
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-title"><div className="eyebrow">BUILT FOR REAL LIFE</div><h2>Everything you need to find information again.</h2></div>
        <div className="landing-grid">
          {[
            ["⌕","Natural-language search","Search by what you remember, even when you forgot the exact title."],
            ["📸","Capture anything","Save screenshots, PDFs, links, voice notes, or plain text."],
            ["✦","AI understanding","Turn messy content into clear summaries, categories and important details."],
            ["◷","Smart reminders","Detect deadlines and keep important dates from slipping away."],
            ["↗","Related memories","Connect information that belongs together, such as a PDF and its application page."],
            ["🔐","Privacy & control","Your information stays under your control. Delete or export it whenever you want."]
          ].map(([icon,title,desc]) => <div className="landing-feature" key={title}><div>{icon}</div><h3>{title}</h3><p>{desc}</p></div>)}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-title"><div className="eyebrow">HOW IT WORKS</div><h2>Three simple steps.</h2></div>
        <div className="steps">
          <div><b>01</b><h3>Capture</h3><p>Save the information before it disappears into your feed, chats or downloads.</p></div>
          <div><b>02</b><h3>Understand</h3><p>TraceMind processes it and highlights the details that matter.</p></div>
          <div><b>03</b><h3>Find it later</h3><p>Describe what you remember and TraceMind helps you trace it back.</p></div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Stop searching everywhere.</h2><p>Start building a memory of the information that matters to you.</p>
        <Link href="/signup" className="capture-button">Create your TraceMind →</Link>
      </section>

      <footer><Logo /><span>© 2026 TraceMind. Your information, your control.</span></footer>

      <style>{`
        .landing-nav{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 6%;background:#fff}
        .landing-links{display:flex;align-items:center;gap:25px;color:#666b7b;font-size:14px;font-weight:600}
        .hero{min-height:610px;padding:85px 8%;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:40px;background:radial-gradient(circle at 75% 45%,#e9e6ff 0,#f7f8fc 35%,#f7f8fc 70%)}
        .hero h1{font-size:55px;line-height:1.04;max-width:700px}.hero h1 span{color:#6558f5}.hero p{font-size:17px;line-height:1.7;color:#6b7080;max-width:610px}
        .hero-actions{display:flex;gap:10px;margin:28px 0}.trust-line{font-size:12px;color:#999dac}
        .hero-visual{min-height:450px;position:relative;display:grid;place-items:center}.memory-orb{width:190px;height:190px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#776cff,#4d43d4);color:#fff;font-size:70px;box-shadow:0 30px 80px rgba(101,88,245,.28)}.memory-orb small{position:absolute;margin-top:120px;font-size:12px;letter-spacing:2px}
        .floating-card{position:absolute;background:#fff;border:1px solid #e6e5f0;border-radius:16px;padding:16px;box-shadow:0 20px 60px rgba(30,31,55,.12);display:grid;gap:5px}.floating-card span{font-size:12px;color:#777b89}.floating-card strong{font-size:18px}.floating-card small{font-size:11px;color:#9a9dab}.card-one{top:65px;left:3%;transform:rotate(-4deg)}.card-two{right:0;bottom:50px;width:270px;transform:rotate(3deg)}
        .feature-section,.how-section{padding:95px 8%;background:#fff}.section-title{max-width:700px;margin-bottom:35px}.section-title h2{font-size:38px;margin-top:8px}.landing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.landing-feature{padding:25px;border:1px solid #e7e8ef;border-radius:17px}.landing-feature>div{font-size:25px}.landing-feature h3{margin:15px 0 7px}.landing-feature p,.steps p{color:#717585;line-height:1.6;font-size:14px}
        .how-section{background:#f7f8fc}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.steps>div{background:#fff;padding:28px;border-radius:17px;border:1px solid #e5e6ed}.steps b{color:#6558f5}.steps h3{font-size:21px}
        .cta-section{padding:100px 20px;text-align:center;background:#211d50;color:#fff}.cta-section h2{font-size:40px}.cta-section p{color:#c9c6e9;margin-bottom:28px}
        footer{padding:28px 8%;display:flex;justify-content:space-between;align-items:center;background:#fff;color:#8a8e9d;font-size:12px}
        @media(max-width:800px){.landing-links a:not(.capture-button){display:none}.hero{grid-template-columns:1fr;padding:65px 7%}.hero h1{font-size:40px}.hero-visual{min-height:360px}.landing-grid,.steps{grid-template-columns:1fr}.section-title h2{font-size:30px}footer{display:grid;gap:15px}}
      `}</style>
    </main>
  );
}
