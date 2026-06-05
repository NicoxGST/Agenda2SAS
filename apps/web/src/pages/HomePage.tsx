import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Gestión operativa</p>
          <h1>Controla tu agenda, servicios y productos desde un mismo lugar.</h1>
          <p className="page-copy home-copy">
            Linares Tech ofrece una plataforma de gestión fácil y moderna para
            empresas que necesitan administrar reservas, servicios activos y
            productos disponibles, con una experiencia fluida desde el primer
            clic.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/servicios">
              Ver servicios
            </Link>
            <Link className="button button-secondary" to="/productos">
              Ver productos
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>+120</strong>
              <span>Clientes satisfechos</span>
            </div>
            <div>
              <strong>+85</strong>
              <span>Proyectos entregados</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Soporte disponible</span>
            </div>
          </div>
        </div>

        <div className="hero-panel hero-banner">
          <div className="banner-copy">
            <span className="eyebrow">Soluciones digitales</span>
            <h2>Transformamos tus operaciones en experiencias sencillas.</h2>
            <p>
              Desde administración de servicios hasta inventario, nuestra
              plataforma está diseñada para empresas que quieren crecer con
              orden y claridad.
            </p>
          </div>
        </div>
      </section>

      <section className="section home-carousel-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Nuestros trabajos</p>
            <h2>Proyectos destacados</h2>
          </div>
          <p className="page-copy">
            Aquí podrás ver algunos trabajos recientes y casos de uso que
            reflejan cómo aplicamos nuestra experiencia en desarrollos reales.
          </p>
        </div>

        <div className="carousel">
          <div className="carousel-card">
            <div className="carousel-image" />
            <p>Proyecto 1</p>
          </div>
          <div className="carousel-card">
            <div className="carousel-image" />
            <p>Proyecto 2</p>
          </div>
          <div className="carousel-card">
            <div className="carousel-image" />
            <p>Proyecto 3</p>
          </div>
          <div className="carousel-card">
            <div className="carousel-image" />
            <p>Proyecto 4</p>
          </div>
        </div>
      </section>

      <section className="section home-about-section">
        <div className="about-grid">
          <div>
            <p className="eyebrow">Quiénes somos</p>
            <h2>Somos una empresa centrada en la eficiencia digital.</h2>
            <p className="page-copy">
              En Linares Tech acompañamos a negocios en la implementación de
              soluciones que optimizan procesos, mejoran la experiencia de los
              clientes y hacen más clara la operación diaria.
            </p>
          </div>

          <div className="about-details">
            <div>
              <strong>Visión</strong>
              <p>Ser el aliado tecnológico preferido en gestión operativa local.</p>
            </div>
            <div>
              <strong>Misión</strong>
              <p>Crear herramientas accesibles que empoderen a equipos y negocios.</p>
            </div>
            <div>
              <strong>Valores</strong>
              <p>Transparencia, rapidez y atención personalizada en cada etapa.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-history-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Nuestra historia</p>
            <h2>Una trayectoria basada en resultados reales.</h2>
          </div>
        </div>

        <div className="timeline">
          <div className="timeline-item">
            <span>2023</span>
            <div>
              <strong>Nacimiento del proyecto</strong>
              <p>Iniciamos con soluciones de agenda para PYMES y clientes locales.</p>
            </div>
          </div>
          <div className="timeline-item">
            <span>2024</span>
            <div>
              <strong>Expansión de servicios</strong>
              <p>Integración de administración de servicios y productos en una sola plataforma.</p>
            </div>
          </div>
          <div className="timeline-item">
            <span>2025</span>
            <div>
              <strong>Consolidación digital</strong>
              <p>Mejoramos la experiencia con diseño moderno, velocidad y soporte constante.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
