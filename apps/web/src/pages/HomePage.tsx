import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const FOTOS = [
  "/fotos/foto0.jpeg",
  "/fotos/foto1.jpeg",
  "/fotos/foto2.jpeg",
  "/fotos/foto3.jpeg",
  "/fotos/foto4.jpeg",
  "/fotos/foto5.jpeg",
  "/fotos/foto6.jpeg",
  "/fotos/foto7.jpeg",
  "/fotos/foto8.jpeg",
  "/fotos/foto9.jpeg",
];

const SERVICES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hv2-svc-icon-svg">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Armado de PC",
    desc: "Ensamblamos tu PC gaming o de trabajo a medida. Componentes de primera línea, gestión de cables y pruebas completas.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hv2-svc-icon-svg">
        <rect x="2" y="3" width="20" height="14" rx="2" /><polyline points="8 21 12 17 16 21" />
      </svg>
    ),
    title: "Notebooks",
    desc: "Diagnóstico, reparación de pantallas, teclados, batería y más. Todas las marcas.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hv2-svc-icon-svg">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: "Mantención",
    desc: "Limpieza profunda, cambio de pasta térmica y mantenimiento preventivo para alargar la vida útil de tu equipo.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hv2-svc-icon-svg">
        <rect x="6" y="2" width="12" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    title: "Consolas",
    desc: "Reparación de PlayStation, Xbox y Nintendo Switch. Limpieza, cambio de pasta, puertos y lectores.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hv2-svc-icon-svg">
        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
      </svg>
    ),
    title: "Upgrades",
    desc: "Mejora el rendimiento de tu equipo: más RAM, SSD NVMe, nueva GPU o cualquier componente.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hv2-svc-icon-svg">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Diagnóstico",
    desc: "Revisión completa del equipo para identificar fallas, sobrecalentamiento, virus o problemas de hardware.",
  },
];

const TIMELINE = [
  { year: "2020", title: "Apertura del taller", desc: "Comenzamos ofreciendo mantención y diagnóstico en Linares." },
  { year: "2022", title: "PC gaming", desc: "Expandimos al armado de PC gaming y upgrades de alta gama." },
  { year: "2024", title: "+300 trabajos", desc: "Superamos los 300 trabajos exitosos y seguimos creciendo." },
  { year: "Hoy",  title: "Referente tecnológico", desc: "El taller de confianza de cientos de clientes en la región del Maule." },
];

function slideClass(i: number, current: number, total: number): string {
  const prev = (current - 1 + total) % total;
  const next = (current + 1) % total;
  if (i === current) return "lt-slide-active";
  if (i === prev)    return "lt-slide-prev";
  if (i === next)    return "lt-slide-next";
  return "";
}

function ImageCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % FOTOS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  function prev() {
    setCurrent((c) => (c - 1 + FOTOS.length) % FOTOS.length);
  }

  function next() {
    setCurrent((c) => (c + 1) % FOTOS.length);
  }

  return (
    <div className="lt-carousel">
      {FOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Trabajo ${i + 1} — Linares Tech`}
          className={`lt-carousel-slide ${slideClass(i, current, FOTOS.length)}`}
        />
      ))}

      <button className="lt-carousel-btn lt-carousel-prev" onClick={prev} type="button" aria-label="Anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button className="lt-carousel-btn lt-carousel-next" onClick={next} type="button" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="lt-carousel-dots">
        {FOTOS.map((_, i) => (
          <button
            key={i}
            className={`lt-carousel-dot ${i === current ? "lt-dot-active" : ""}`}
            onClick={() => setCurrent(i)}
            type="button"
            aria-label={`Foto ${i + 1}`}
          />
        ))}
      </div>

      <div className="lt-carousel-counter">{current + 1} / {FOTOS.length}</div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="home-v2">

      {/* ══════════════ HERO ══════════════ */}
      <section className="hv2-hero">
        <div className="hv2-hero-overlay" />
        <div className="hv2-container hv2-hero-content">
          <span className="hv2-eyebrow">Linares, Maule — Desde 2020</span>
          <h1 className="hv2-hero-title">
            Tu equipo en<br />
            <span className="hv2-title-accent">las mejores manos.</span>
          </h1>
          <p className="hv2-hero-sub">
            Especialistas en armado de PC, reparación de notebooks y consolas,
            y mantenimiento de equipos. Más de 300 trabajos exitosos en Linares.
          </p>
          <div className="hv2-hero-actions">
            <Link className="button hv2-btn-primary" to="/servicios">
              Ver servicios
            </Link>
            <a className="button hv2-btn-outline" href="#contacto">
              Contáctanos
            </a>
          </div>
        </div>

        <div className="hv2-hero-scroll" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <div className="hv2-stats-bar">
        <div className="hv2-container hv2-stats-inner">
          <div className="hv2-stat">
            <strong>6+</strong>
            <span>Años de experiencia</span>
          </div>
          <div className="hv2-stat-divider" />
          <div className="hv2-stat">
            <strong>+300</strong>
            <span>Trabajos exitosos</span>
          </div>
          <div className="hv2-stat-divider" />
          <div className="hv2-stat">
            <strong>Lun – Sáb</strong>
            <span>10:00 – 17:30 hrs</span>
          </div>
          <div className="hv2-stat-divider" />
          <div className="hv2-stat">
            <strong>Linares</strong>
            <span>Villa Nemesio Antunez</span>
          </div>
        </div>
      </div>

      {/* ══════════════ SERVICIOS ══════════════ */}
      <section className="hv2-section">
        <div className="hv2-container">
          <div className="hv2-section-head">
            <p className="eyebrow">Especialidades</p>
            <h2>¿En qué te podemos ayudar?</h2>
            <p className="page-copy">
              Desde un simple mantenimiento hasta un armado completo de PC gaming —
              cubrimos todas tus necesidades tecnológicas.
            </p>
          </div>

          <div className="hv2-services-grid">
            {SERVICES.map((s) => (
              <div className="hv2-service-card" key={s.title}>
                <div className="hv2-svc-icon-wrap">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="hv2-services-cta">
            <Link className="button button-secondary" to="/servicios">
              Ver catálogo completo →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ GALERÍA ══════════════ */}
      <section className="hv2-gallery-section">
        <div className="hv2-container hv2-gallery-head">
          <p className="eyebrow">Galería</p>
          <h2>Nuestros trabajos</h2>
          <p className="page-copy">
            Cada armado es único. Estos son algunos de los proyectos que hemos
            completado para nuestros clientes.
          </p>
        </div>
        <ImageCarousel />
      </section>

      {/* ══════════════ QUIÉNES SOMOS ══════════════ */}
      <section className="hv2-section hv2-about-section">
        <div className="hv2-container hv2-about-grid">
          <div className="hv2-about-copy">
            <p className="eyebrow">Quiénes somos</p>
            <h2>Nacimos en Linares para servir a Linares.</h2>
            <p className="page-copy">
              Desde 2020 operamos en la ciudad de Linares ayudando a familias,
              estudiantes y empresas a mantener sus equipos al día. Empezamos
              con un taller pequeño y hoy somos el referente local en tecnología.
            </p>
            <p className="page-copy hv2-about-p2">
              Trabajamos con marcas líderes como ASUS, MSI, Cooler Master,
              AMD y NVIDIA — garantizando calidad en cada componente que instalamos.
            </p>

            <div className="hv2-brands">
              {["ASUS", "MSI", "AMD", "NVIDIA", "Cooler Master", "GAMEMAX"].map((b) => (
                <span className="hv2-brand-chip" key={b}>{b}</span>
              ))}
            </div>
          </div>

          <div className="hv2-timeline">
            {TIMELINE.map((item) => (
              <div className="hv2-tl-item" key={item.year}>
                <div className="hv2-tl-year">{item.year}</div>
                <div className="hv2-tl-body">
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CONTACTO ══════════════ */}
      <section className="hv2-section hv2-contact-section" id="contacto">
        <div className="hv2-container">
          <div className="hv2-section-head">
            <p className="eyebrow">Contacto</p>
            <h2>Hablemos. Estamos para ayudarte.</h2>
            <p className="page-copy">
              Escríbenos, llámanos o visítanos directo al taller. Atención rápida y sin vueltas.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon contact-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.41a16 16 0 0 0 6.22 6.22l1.97-1.97a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3>WhatsApp / Teléfono</h3>
              <p>Lunes a Sábado, 10:00 – 17:30 hrs</p>
              <a href="https://wa.me/56985833034" target="_blank" rel="noopener noreferrer">
                +56 9 8583 3034
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon contact-icon-orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3>Correo electrónico</h3>
              <p>Respondemos en menos de 24 horas</p>
              <a href="mailto:nicolaslinarestech2002@gmail.com">
                nicolaslinarestech2002@gmail.com
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon contact-icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <h3>Instagram</h3>
              <p>Sigue nuestros trabajos y novedades</p>
              <a href="https://www.instagram.com/linares_tech" target="_blank" rel="noopener noreferrer">
                @linares_tech
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ UBICACIÓN ══════════════ */}
      <section className="hv2-section">
        <div className="hv2-container">
          <div className="hv2-section-head">
            <p className="eyebrow">Dónde estamos</p>
            <h2>Visítanos en Linares</h2>
          </div>

          <div className="location-grid">
            <div className="location-map location-map-live">
              <iframe
                className="location-map-frame"
                title="Ubicación Linares Tech — El Amanecer 1657, Linares"
                src="https://maps.google.com/maps?q=El+Amanecer+1657,+Linares,+Maule,+Chile&t=&z=16&ie=UTF8&iwloc=&output=embed&hl=es"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="location-details">
              <div className="location-detail-item">
                <span className="location-detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <div>
                  <h4>Horario de atención</h4>
                  <p>Lunes a Sábado: 10:00 – 17:30</p>
                </div>
              </div>

              <div className="location-detail-item">
                <span className="location-detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div>
                  <h4>Dirección</h4>
                  <p>El Amanecer #1657, Villa Nemesio Antunez<br />Linares, Maule, Chile</p>
                </div>
              </div>

              <div className="location-detail-item">
                <span className="location-detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.41a16 16 0 0 0 6.22 6.22l1.97-1.97a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <div>
                  <h4>WhatsApp / Teléfono</h4>
                  <p>+56 9 8583 3034</p>
                </div>
              </div>

              <div className="location-detail-item">
                <span className="location-detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </span>
                <div>
                  <h4>Instagram</h4>
                  <p>@linares_tech</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="hv2-footer">
        <div className="hv2-container hv2-footer-inner">
          <div className="brand">
            <img src="/logo.jpeg" alt="LinaresTech" className="brand-logo brand-logo--footer" />
            <span className="brand-name">LinaresTech</span>
          </div>
          <p>© 2020 – 2025 Linares Tech. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
