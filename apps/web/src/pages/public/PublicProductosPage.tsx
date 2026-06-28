import { useEffect, useState } from "react";

import type { Product } from "../../services/products.service";
import { getPublicProducts } from "../../services/products.service";

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

export function PublicProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState("default");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getPublicProducts();
        if (!ignore) setProducts(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const activeProducts = products.filter((p) => p.isActive);

  const filteredActive = activeProducts
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "az")         return a.name.localeCompare(b.name, "es");
      if (sort === "za")         return b.name.localeCompare(a.name, "es");
      return 0;
    });

  const available   = filteredActive.filter((p) => p.stock > 0);
  const unavailable = filteredActive.filter((p) => p.stock === 0);

  return (
    <div className="pub-page-outer">
    <div className="pub-page">
      <div className="pub-hero">
        <div className="pub-hero-deco" />
        <span className="pub-hero-eyebrow">Tienda</span>
        <h1>Nuestros productos</h1>
        <p>
          Repuestos, insumos y accesorios disponibles para tu equipo. Consulta
          stock y precios actualizados.
        </p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <div className="empty-state">Cargando productos…</div>
      ) : activeProducts.length === 0 ? (
        <div className="empty-state">No hay productos disponibles por el momento.</div>
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
                  placeholder="Buscar producto…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="pub-sort-select"
                aria-label="Ordenar productos"
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
              <p className="eyebrow">En stock</p>
              <h2>{available.length} producto{available.length === 1 ? "" : "s"} disponible{available.length === 1 ? "" : "s"}</h2>
            </div>
          </div>

          {filteredActive.length === 0 ? (
            <div className="empty-state">No se encontraron productos con ese criterio.</div>
          ) : (
            <>
              {available.length > 0 && (
                <div className="pub-catalog-grid">
                  {available.map((p) => (
                    <div className="pub-catalog-card" key={p.id}>
                      <div className="pub-card-icon-wrap pub-card-icon-wrap-orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pub-card-icon-svg">
                          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </div>
                      <h3 className="pub-card-name">{p.name}</h3>
                      <p className="pub-card-desc">{p.description}</p>
                      <div className="pub-card-footer">
                        <span className="pub-card-price">{formatCurrency(p.price)}</span>
                        <span className="pill pill-muted pub-card-stock">
                          Stock: {p.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {unavailable.length > 0 && (
                <>
                  <div className="pub-section-header pub-section-header-mt">
                    <p className="eyebrow">Sin stock</p>
                    <h2>Próximamente disponibles</h2>
                  </div>
                  <div className="pub-catalog-grid">
                    {unavailable.map((p) => (
                      <div className="pub-catalog-card pub-catalog-card-dim" key={p.id}>
                        <div className="pub-card-icon-wrap pub-card-icon-wrap-muted">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pub-card-icon-svg">
                            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </div>
                        <h3 className="pub-card-name">{p.name}</h3>
                        <p className="pub-card-desc">{p.description}</p>
                        <div className="pub-card-footer">
                          <span className="pub-card-price">{formatCurrency(p.price)}</span>
                          <span className="pill pill-muted">Sin stock</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <div className="pub-cta-bar">
        <div>
          <h2>¿Necesitas un repuesto?</h2>
          <p>Consúltanos por disponibilidad o solicita un producto que no ves en el catálogo.</p>
        </div>
        <a className="button button-primary" href="mailto:contacto@linares-tech.cl">
          Consultar stock
        </a>
      </div>
    </div>
    </div>
  );
}