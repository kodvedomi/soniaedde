import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, startLenis, getLenis, scrollToId, img, reduced } from './lib/motion';
import ScrollVelocity from './rb/ScrollVelocity';
import CountUp from './rb/CountUp';
import Magnet from './rb/Magnet';
import SpotlightCard from './rb/SpotlightCard';
import FlowingMenu from './rb/FlowingMenu';
import * as C from './content';
import { deliver } from './lib/notify';

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const ArrowUR = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);
const Play = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z" /></svg>
);
const IG = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);

const Img = ({ name, alt = '', ...rest }) => (
  <img src={img(name)} alt={alt} loading="lazy" style={{ objectPosition: C.focus[name] || '50% 30%' }} {...rest} />
);

const go = id => e => { e?.preventDefault(); scrollToId(id); };

/* ---------------- Loader ---------------- */
function Loader({ onDone }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useLayoutEffect(() => {
    const o = { v: 0 };
    const tl = gsap.timeline({ onComplete: onDone });
    tl.from('.loader__mark', { scale: 0.6, opacity: 0, duration: 0.9, ease: 'expo.out' })
      .to(o, { v: 100, duration: reduced() ? 0.2 : 1.5, ease: 'power2.inOut', onUpdate: () => setN(Math.round(o.v)) }, 0)
      .to('.loader__inner', { opacity: 0, y: -30, duration: 0.45, ease: 'power2.in' }, '+=0.1')
      .to(ref.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15');
    return () => tl.kill();
  }, []);
  return (
    <div className="loader" ref={ref}>
      <div className="loader__inner">
        <img className="loader__mark" src="media/mark.png" alt="" />
        <span className="loader__n">{String(n).padStart(3, '0')}</span>
      </div>
    </div>
  );
}

/* ---------------- Kurzor ---------------- */
function Cursor() {
  const dot = useRef(null);
  useEffect(() => {
    if (!window.matchMedia('(pointer:fine)').matches) return;
    const xTo = gsap.quickTo(dot.current, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(dot.current, 'y', { duration: 0.35, ease: 'power3' });
    const move = e => { xTo(e.clientX); yTo(e.clientY); };
    const over = e => dot.current.classList.toggle('is-big', !!e.target.closest('a,button,[data-cursor]'));
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over); };
  }, []);
  return <div className="cursor" ref={dot} aria-hidden="true" />;
}

/* ---------------- Navigace ---------------- */
function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop(); else l?.start();
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);
  const click = id => e => { setOpen(false); go(id)(e); };
  return (
    <header className={`nav ${solid ? 'is-solid' : ''} ${open ? 'is-open' : ''}`}>
      <a href="#top" className="nav__brand" onClick={click('top')} aria-label="Sonia Edde – úvod">
        <img src="media/mark.png" alt="" /><span>Sonia Edde</span>
      </a>
      <nav className="nav__links" aria-label="Hlavní menu">
        {C.nav.map(n => <a key={n.id} href={`#${n.id}`} onClick={click(n.id)}>{n.label}</a>)}
      </nav>
      <a href="#booking" className="btn btn--sm nav__cta" onClick={click('booking')}>Booking</a>
      <button className="nav__burger" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Menu"><span /><span /></button>
      <div className="mmenu" aria-hidden={!open}>
        {C.nav.map((n, i) => <a key={n.id} href={`#${n.id}`} onClick={click(n.id)} style={{ '--i': i }}><small>0{i + 1}</small>{n.label}</a>)}
        <a href="#booking" onClick={click('booking')} style={{ '--i': C.nav.length }} className="mmenu__cta"><small>✦</small>Booking</a>
        <div className="mmenu__foot">
          <a href={`mailto:${C.contact.email}`}>{C.contact.email}</a>
          <a href={C.contact.instagram} target="_blank" rel="noreferrer">{C.contact.instagramHandle}</a>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ ready, onReel }) {
  const root = useRef(null);
  const [src, setSrc] = useState(null);
  const [role, setRole] = useState(0);
  useEffect(() => {
    // na výšku (mobil, tablet) svislé video, jinak široký výřez – obojí jen Soňa
    const mq = window.matchMedia('(orientation: portrait)');
    const pick = () => setSrc(mq.matches
      ? { v: 'media/hero-sonia.mp4', p: 'media/hero-poster.webp' }
      : { v: 'media/hero-wide-sonia.mp4', p: 'media/hero-poster-wide.webp' });
    pick(); mq.addEventListener('change', pick);
    return () => mq.removeEventListener('change', pick);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setRole(r => (r + 1) % C.hero.roles.length), 2200);
    return () => clearInterval(t);
  }, []);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.hero__word span', { yPercent: 110 });
      gsap.set('.hero__fade', { opacity: 0, y: 24 });
      gsap.to('.hero__media', {
        scale: 0.88, borderRadius: '28px', ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.hero__title', {
        yPercent: -30, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      });
    }, root);
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      gsap.timeline()
        .to('.hero__word span', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.05 })
        .to('.hero__fade', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, '-=0.9');
    }, root);
    return () => ctx.revert();
  }, [ready]);
  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__media">
        {src && <video key={src.v} src={src.v} poster={src.p} autoPlay muted loop playsInline preload="auto" />}
        <div className="hero__shade" />
      </div>
      <div className="hero__inner">
        <p className="hero__fade hero__kicker"><span className="dot" /> Booking 2026 / 2027 otevřen</p>
        <h1 className="hero__title" aria-label="Sonia Edde">
          <span className="hero__word">{'SONIA'.split('').map((l, i) => <span key={i}>{l}</span>)}</span>
          <span className="hero__word hero__word--outline">{'EDDE'.split('').map((l, i) => <span key={i}>{l}</span>)}</span>
        </h1>
        <div className="hero__row">
          <div className="hero__fade hero__roles">
            <span className="roles__static">DJka · moderátorka · eventy</span>
            <span className="roles__swap" aria-hidden="true">
              {C.hero.roles.map((r, i) => <span key={r} className={i === role ? 'on' : ''}>{r}</span>)}
            </span>
          </div>
          <p className="hero__fade hero__lead">{C.hero.lead}</p>
          <div className="hero__fade hero__ctas">
            <Magnet padding={60} magnetStrength={3}>
              <a href="#booking" className="btn" onClick={go('booking')}>Poptat spolupráci <Arrow /></a>
            </Magnet>
            <button className="btn btn--ghost" onClick={onReel}><Play /> Showreel</button>
          </div>
        </div>
      </div>
      <a href="#o-mne" onClick={go('o-mne')} className="hero__scroll" aria-label="Posunout dolů"><span /></a>
    </section>
  );
}

/* ---------------- Marquee ---------------- */
function Ticker() {
  const a = C.marquee.services.join('  ✦  ') + '  ✦  ';
  const b = C.marquee.places.join('  ·  ') + '  ·  ';
  return (
    <div className="ticker" aria-hidden="true">
      <ScrollVelocity texts={[a, b]} velocity={40} numCopies={4} className="ticker__line" outlineAlternate skewWithVelocity={0.4} />
    </div>
  );
}

/* ---------------- O mně + čísla ---------------- */
function About() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const split = new SplitText('.about__statement', { type: 'words' });
      gsap.fromTo(split.words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.about__statement', start: 'top 80%', end: 'bottom 45%', scrub: true }
      });
      gsap.fromTo('.about__img', { clipPath: 'inset(18% 18% 18% 18% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none',
        scrollTrigger: { trigger: '.about__img', start: 'top 90%', end: 'top 30%', scrub: true }
      });
      gsap.fromTo('.about__img img', { scale: 1.25 }, {
        scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__img', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      return () => split.revert();
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section className="about wrap" id="o-mne" ref={root}>
      <div className="about__grid">
        <figure className="about__img"><Img name={'portrait-red'} alt="Sonia Edde" /></figure>
        <div className="about__copy">
          <p className="kicker">Kdo jsem</p>
          <p className="about__statement">{C.about.statement}</p>
          <p className="about__text">{C.about.text}</p>
        </div>
      </div>
      <div className="stats">
        {C.about.stats.map(s => (
          <div className="stat" key={s.label}>
            <strong className="stat__n"><CountUp to={s.n} duration={2.2} separator={s.sep ? '\u00a0' : ''} suffix={s.suffix} /></strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Služby ---------------- */
function Services() {
  return (
    <section className="services wrap">
      <div className="shead">
        <p className="kicker">Co dělám</p>
        <h2 className="h2">Tři role.<br /><em>Jedna energie.</em></h2>
      </div>
      <div className="services__grid">
        {C.services.map(s => (
          <a key={s.id} href={`#${s.id}`} onClick={go(s.id)} className="svc reveal" data-cursor>
            <SpotlightCard className="svc__card" spotlightColor="rgba(226,190,120,0.28)" theme="dark">
              <div className="svc__img"><Img name={s.img} alt="" /></div>
              <div className="svc__body">
                <span className="svc__no">{s.no}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="svc__more">Více <Arrow /></span>
              </div>
            </SpotlightCard>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------------- DJing ---------------- */
function DJ() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.dj__ph').forEach((el, i) => {
        gsap.fromTo(el, { y: 30 + i * 8 }, {
          y: -30 - i * 8, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section className="dj" id="dj" ref={root}>
      <div className="wrap dj__grid">
        <div className="dj__copy">
          <div className="sticky">
            <p className="kicker"><span className="num">01</span> {C.dj.kicker}</p>
            <h2 className="h2">{C.dj.title}</h2>
            {C.dj.text.map((t, i) => <p key={i} className="body" dangerouslySetInnerHTML={{ __html: t }} />)}
            <ul className="chips">{C.dj.events.map(e => <li key={e}>{e}</li>)}</ul>
            <p className="punch">{C.dj.punch}</p>
            <a href="#booking" className="btn" onClick={go('booking')}>Chci DJku na akci <Arrow /></a>
          </div>
        </div>
        <div className="dj__photos">
          {C.dj.photos.map((p, i) => (
            <figure key={p} className={`dj__ph dj__ph--${i}`}><Img name={p} alt="Sonia Edde za DJským pultem" /></figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Moderování ---------------- */
function Mod() {
  const items = C.mod.shows.map(s => ({ text: s.text, meta: s.meta, image: img(s.image), link: '#videa' }));
  return (
    <section className="mod" id="moderovani">
      <div className="wrap">
        <div className="mod__head">
          <p className="kicker"><span className="num">02</span> {C.mod.kicker}</p>
          <h2 className="h2 h2--xl">{C.mod.title}</h2>
          <div className="mod__intro">
            {C.mod.text.map((t, i) => <p key={i} className="body" dangerouslySetInnerHTML={{ __html: t }} />)}
          </div>
        </div>
        <ol className="radio reveal">
          {C.mod.radio.map((r, i) => (
            <li key={r.name}><span className="radio__i">0{i + 1}</span><strong>{r.name}</strong><small>{r.note}</small></li>
          ))}
        </ol>
        <p className="kicker mod__shows-k">{C.mod.showsTitle}</p>
      </div>
      <div className="shows">
        <FlowingMenu
          items={items}
          textColor="#f4efe6" bgColor="transparent" marqueeBgColor="#e2be78" marqueeTextColor="#0b0a0c"
          borderColor="rgba(244,239,230,0.14)" align="left" showArrow imageShape="rounded"
          onItemClick={(_, __, e) => { e?.preventDefault?.(); scrollToId('videa'); }}
        />
      </div>
      <div className="wrap mod__live">
        <figure className="mod__live-img reveal"><Img name={'stage'} alt="Sonia Edde moderuje na velkém pódiu" /></figure>
        <div>
          <h3 className="h3">Živé pódium je můj druhý domov</h3>
          {C.mod.live.map((t, i) => <p key={i} className="body" dangerouslySetInnerHTML={{ __html: t }} />)}
          <a href="#booking" className="btn btn--ghost" onClick={go('booking')}>Poptat moderování <Arrow /></a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Eventy ---------------- */
function Events() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.ev__media', { clipPath: 'inset(12% 22% 12% 22% round 32px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: '.ev__media', start: 'top 85%', end: 'center 50%', scrub: true }
      });
      gsap.from('.step', {
        y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.steps', start: 'top 80%' }
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section className="ev" id="eventy" ref={root}>
      <div className="wrap ev__head">
        <p className="kicker"><span className="num">03</span> {C.events.kicker}</p>
        <h2 className="h2 h2--xl">{C.events.title}</h2>
      </div>
      <div className="ev__media">
        <video src="media/event-loop.mp4" autoPlay muted loop playsInline preload="metadata" poster={img('crowd')} />
        <div className="ev__overlay" />
      </div>
      <div className="wrap ev__body">
        <div className="ev__text">{C.events.text.map((t, i) => <p key={i} className="body">{t}</p>)}</div>
        <ol className="steps">
          {C.events.steps.map((s, i) => (
            <li className="step" key={s.t}><span>0{i + 1}</span><h4>{s.t}</h4><p>{s.d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- Playboy ---------------- */
function Playboy() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.pb__img img', { scale: 1.2 }, {
        scale: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo('.pb__bg', { xPercent: 8 }, {
        xPercent: -18, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section className="pb" id="playboy" ref={root}>
      <div className="pb__bg" aria-hidden="true">COVER STAR</div>
      <div className="wrap pb__grid">
        <figure className="pb__img reveal">
          <Img name={'playboy'} alt="Sonia Edde – Playboy" />
          <span className="pb__badge"><strong>{C.playboy.year}</strong>Cover</span>
        </figure>
        <div className="pb__copy">
          <p className="kicker">{C.playboy.kicker}</p>
          <h2 className="h2 h2--xl">{C.playboy.title[0]} <em>{C.playboy.title[1]}</em></h2>
          {C.playboy.text.map((t, i) => <p key={i} className="body" dangerouslySetInnerHTML={{ __html: t }} />)}
          <ul className="chips">{C.playboy.tags.map(t => <li key={t}>{t}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Videa ---------------- */
function Videos({ onReel }) {
  return (
    <section className="videos wrap" id="videa">
      <div className="shead shead--row">
        <div>
          <p className="kicker">Videotéka</p>
          <h2 className="h2">Ukázky mé práce</h2>
        </div>
        <p className="body shead__note">Videa se otevřou na YouTube v nové záložce.</p>
      </div>
      <div className="videos__grid">
        <button className="vcard vcard--reel reveal" onClick={onReel} data-cursor>
          <Img name={'bangers-2'} alt="" />
          <span className="vcard__play"><Play /></span>
          <span className="vcard__meta"><small>Showreel</small><strong>Z mých akcí</strong></span>
        </button>
        {C.videos.map(v => (
          <a key={v.href} className="vcard reveal" href={v.href} target="_blank" rel="noreferrer">
            <Img name={v.img} alt="" />
            <span className="vcard__play"><Play /></span>
            <span className="vcard__meta"><small>{v.tag}</small><strong>{v.title} <ArrowUR /></strong></span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Most mezi světy (odkaz na Kód vědomí) ---------------- */
function Bridge() {
  return (
    <section className="bridge">
      <div className="bridge__glow" aria-hidden="true" />
      <div className="wrap bridge__in reveal">
        <img src="media/mark.png" alt="" className="bridge__mark" />
        <h2 className="bridge__title"><span>{C.bridge.title}</span></h2>
        <p className="bridge__text">{C.bridge.text}</p>
        <a className="btn btn--ghost" href={C.contact.kodVedomi} target="_blank" rel="noreferrer">{C.bridge.cta} <ArrowUR /></a>
      </div>
    </section>
  );
}

/* ---------------- Galerie ---------------- */
function Gallery({ onOpen }) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const t = track.current; if (!t) return;
    setEdge({ start: t.scrollLeft < 8, end: t.scrollLeft + t.clientWidth > t.scrollWidth - 8 });
  };
  const step = dir => {
    const t = track.current; const item = t.querySelector('.gal__item');
    const w = item ? item.getBoundingClientRect().width + 18 : t.clientWidth * 0.8;
    t.scrollBy({ left: dir * Math.max(w, t.clientWidth * 0.75), behavior: 'smooth' });
  };
  useEffect(() => {
    const t = track.current; update();
    // přetahování myší na počítači
    let down = false, sx = 0, sl = 0, moved = 0;
    const pd = e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = t.scrollLeft; t.classList.add('is-drag'); };
    const pm = e => { if (!down) return; const dx = e.clientX - sx; moved = Math.abs(dx); t.scrollLeft = sl - dx; };
    const pu = () => { down = false; t.classList.remove('is-drag'); };
    const clk = e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } };
    t.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
    t.addEventListener('click', clk, true); t.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      t.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu);
      t.removeEventListener('click', clk, true); t.removeEventListener('scroll', update); window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <section className="gal" id="galerie">
      <div className="wrap gal__head">
        <div>
          <p className="kicker">Galerie</p>
          <h2 className="h2">Na pódiu, v éteru,<br /><em>v pohybu</em></h2>
        </div>
        <div className="gal__nav">
          <button className="gal__arrow" onClick={() => step(-1)} disabled={edge.start} aria-label="Předchozí fotky">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </button>
          <button className="gal__arrow" onClick={() => step(1)} disabled={edge.end} aria-label="Další fotky"><Arrow /></button>
        </div>
      </div>
      <div className="gal__track" ref={track}>
        {C.gallery.map((g, i) => (
          <button key={g} className="gal__item" onClick={() => onOpen(i)} data-cursor aria-label="Zvětšit fotografii">
            <Img name={g} draggable="false" />
          </button>
        ))}
      </div>
      <p className="wrap gal__hint">Posouvej šipkami, tažením nebo prstem. Kliknutím fotku zvětšíš.</p>
    </section>
  );
}

function Lightbox({ index, onClose, onMove }) {
  useEffect(() => {
    if (index == null) return;
    const k = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onMove(1); if (e.key === 'ArrowLeft') onMove(-1); };
    window.addEventListener('keydown', k);
    getLenis()?.stop();
    return () => { window.removeEventListener('keydown', k); getLenis()?.start(); };
  }, [index]);
  if (index == null) return null;
  return (
    <div className="lb" onClick={onClose} role="dialog" aria-modal="true">
      <img src={img(C.gallery[index])} alt="" onClick={e => e.stopPropagation()} />
      <button className="lb__btn lb__prev" onClick={e => { e.stopPropagation(); onMove(-1); }} aria-label="Předchozí">‹</button>
      <button className="lb__btn lb__next" onClick={e => { e.stopPropagation(); onMove(1); }} aria-label="Další">›</button>
      <button className="lb__close" onClick={onClose} aria-label="Zavřít">✕</button>
      <span className="lb__count">{index + 1} / {C.gallery.length}</span>
    </div>
  );
}

function Reel({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    getLenis()?.stop();
    return () => { window.removeEventListener('keydown', k); getLenis()?.start(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="lb" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lb__frame" onClick={e => e.stopPropagation()}><video src="media/event.mp4" controls autoPlay playsInline /></div>
      <button className="lb__close" onClick={onClose} aria-label="Zavřít">✕</button>
    </div>
  );
}

/* ---------------- Booking ---------------- */
function Booking() {
  const [f, setF] = useState({ name: '', email: '', phone: '', service: 'DJing', date: '', unknown: false, place: '', length: '', sound: 'Nevím', msg: '' });
  const [sent, setSent] = useState('');
  const [busy, setBusy] = useState(false);
  const born = useRef(Date.now());
  const set = k => e => setF(s => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const submit = async e => {
    e.preventDefault();
    // ochrana proti robotům: skryté pole a příliš rychlé odeslání
    if (e.currentTarget.website?.value || Date.now() - born.current < 2500) { setSent('ok'); return; }
    const body = [
      `Jméno: ${f.name}`, `E-mail: ${f.email}`, `Telefon: ${f.phone || '—'}`,
      `Služba: ${f.service}`, `Termín: ${f.unknown || !f.date ? 'zatím nevím' : f.date}`, `Místo: ${f.place || '—'}`,
      `Délka vystoupení: ${f.length || '—'}`, `Zvuková aparatura: ${f.sound}`, '', f.msg
    ].join('\n');
    setBusy(true);
    setSent(await deliver(C.contact.email, `Web: poptávka ${f.service} – ${f.name}`, body, { name: f.name, email: f.email }));
    setBusy(false);
  };
  return (
    <section className="book" id="booking">
      <div className="wrap book__grid">
        <div className="book__copy">
          <p className="kicker">Booking</p>
          <h2 className="h2 h2--xl">{C.booking.title.map((l, i) => <span key={i} className="line">{i === 2 ? <em>{l}</em> : l}</span>)}</h2>
          {C.booking.text.map((t, i) => <p key={i} className="body">{t}</p>)}
          <p className="book__price">{C.booking.priceFrom}</p>
          <div className="book__contact">
            <a href={`mailto:${C.contact.email}`}>{C.contact.email}</a>
            <a href={C.contact.instagram} target="_blank" rel="noreferrer"><IG /> {C.contact.instagramHandle}</a>
          </div>
        </div>
        <form className="form" onSubmit={submit}>
          <input name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
          <fieldset className="form__svc">
            <legend>Co potřebuješ?</legend>
            {C.booking.services.map(s => (
              <label key={s} className={f.service === s ? 'on' : ''}>
                <input type="radio" name="service" value={s} checked={f.service === s} onChange={set('service')} />{s}
              </label>
            ))}
          </fieldset>
          <div className="form__row">
            <label className="fld"><span>Jméno *</span><input required value={f.name} onChange={set('name')} autoComplete="name" /></label>
            <label className="fld"><span>E-mail *</span><input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
          </div>
          <div className="form__row">
            <label className="fld"><span>Telefon</span><input type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
            <label className="fld"><span>Místo akce</span><input value={f.place} onChange={set('place')} /></label>
          </div>
          <div className="form__row">
            <label className={`fld ${f.unknown ? 'is-off' : ''}`}><span>Termín</span><input type="date" value={f.date} onChange={set('date')} disabled={f.unknown} /></label>
            <label className="fld"><span>Délka vystoupení</span><input value={f.length} onChange={set('length')} placeholder="např. 4 hodiny" /></label>
          </div>
          <div className="form__row form__row--mini">
            <label className="check"><input type="checkbox" checked={f.unknown} onChange={set('unknown')} /><span>Přesný termín ještě nevím</span></label>
            <label className="fld fld--sel"><span>Zvuková aparatura</span>
              <select value={f.sound} onChange={set('sound')}><option>Nevím</option><option>Zajistíme sami</option><option>Potřebujeme zajistit</option></select>
            </label>
          </div>
          <label className="fld"><span>Tvoje představa o akci</span><textarea rows="4" value={f.msg} onChange={set('msg')} placeholder="Typ akce, počet hostů, atmosféra…" /></label>
          <button className="btn btn--full" type="submit" disabled={busy}>{busy ? 'Odesílám…' : <>Odeslat nezávaznou poptávku <Arrow /></>}</button>
          {sent === 'ok' && <p className="form__ok" role="status">Děkuji, poptávka je odeslaná. Ozvu se ti co nejdřív na tvůj e-mail.</p>}
          {sent === 'mail' && <p className="form__ok" role="status">Otevřel se ti e-mail s připravenou poptávkou. Stačí ho odeslat.</p>}
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot__big" aria-hidden="true">SONIA EDDE</div>
      <div className="wrap foot__row">
        <img src="media/logo.png" alt="Sonia Edde" className="foot__logo" />
        <div className="foot__links">
          <a href={`mailto:${C.contact.email}`}>{C.contact.email}</a>
          <a href={C.contact.instagram} target="_blank" rel="noreferrer">Instagram</a>
          <a href={C.contact.facebook} target="_blank" rel="noreferrer">Facebook</a>
          <a href={C.contact.kodVedomi} target="_blank" rel="noreferrer">Kód vědomí</a>
        </div>
        <p className="foot__copy">© {new Date().getFullYear()} Sonia Edde</p>
      </div>
    </footer>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const [ready, setReady] = useState(false);
  const [reel, setReel] = useState(false);
  const [lb, setLb] = useState(null);

  useEffect(() => {
    startLenis();
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.utils.toArray('.h2').forEach(el => {
        gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
    });
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);
    window.addEventListener('load', () => ScrollTrigger.refresh());
    return () => { ctx.revert(); clearTimeout(t); };
  }, []);

  const move = d => setLb(i => (i + d + C.gallery.length) % C.gallery.length);

  return (
    <>
      {!ready && <Loader onDone={() => setReady(true)} />}
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero ready={ready} onReel={() => setReel(true)} />
        <Ticker />
        <About />
        <Services />
        <DJ />
        <Mod />
        <Events />
        <Playboy />
        <Videos onReel={() => setReel(true)} />
        <Gallery onOpen={setLb} />
        <Booking />
        <Bridge />
      </main>
      <Footer />
      <Lightbox index={lb} onClose={() => setLb(null)} onMove={move} />
      <Reel open={reel} onClose={() => setReel(false)} />
    </>
  );
}
