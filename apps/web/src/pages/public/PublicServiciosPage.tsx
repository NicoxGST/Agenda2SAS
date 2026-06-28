import { useEffect, useState } from "react";

import type { Service } from "../../services/services.service";
import { getPublicServices } from "../../services/services.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function PublicServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState("default");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getPublicServices();
        if (!ignore) setServices(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const active = services.filter((s) => s.isActive);

  const filtered = active
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "az")         return a.name.localeCompare(b.name, "es");
      if (sort === "za")         return b.name.localeCompare(a.name, "es");
      return 0;
    });

  return (
    <div className="pub-page-outer">
    <div className="pub-page">
      <div className="pub-hero">
        <div className="pub-hero-deco" />
        <span className="pub-hero-eyebrow">Lo que ofrecemos</span>
        <h1>Nuestros servicios</h1>
        <p>
          Conoce todos los servicios disponibles. Contáctanos para agendar o
          consultar disponibilidad.
        </p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <div className="empty-state">Cargando servicios…</div>
      ) : active.length === 0 ? (
        <div className="empty-state">No hay servicios disponibles por el momento.</div>
      ) : (
        <>
          <div className="pub-filters-bar">
            <div className="pub-filters-controls">
              <div className="pub-search-wrap">
                <svg className="pub-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="pub-search-input"
                  type="text"
                  placeholder="Buscar servicio…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="pub-sort-select"
                aria-label="Ordenar servicios"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Ordenar por</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>
            <div className="pub-section-header pub-section-header-inline">
              <p className="eyebrow">Catálogo</p>
              <h2>{filtered.length} servicio{filtered.length === 1 ? "" : "s"} disponible{filtered.length === 1 ? "" : "s"}</h2>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">No se encontraron servicios con ese criterio.</div>
          ) : (
            <div className="pub-catalog-grid">
              {filtered.map((s) => (
                <div className="pub-catalog-card" key={s.id}>
                  <div className="pub-card-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pub-card-icon-svg">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <h3 className="pub-card-name">{s.name}</h3>
                  <p className="pub-card-desc">{s.description}</p>
                  <div className="pub-card-footer">
                    <span className="pub-card-price">{formatCurrency(s.price)}</span>
                    <span className="pill pill-muted">Disponible</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="pub-cta-bar">
        <div>
          <h2>¿Listo para agendar?</h2>
          <p>Escríbenos o llámanos y coordinamos tu servicio sin costo adicional.</p>
        </div>
        <a className="button button-primary" href="mailto:contacto@linares-tech.cl">
          Contactar ahora
        </a>
      </div>
    </div>
    </div>
  );
}