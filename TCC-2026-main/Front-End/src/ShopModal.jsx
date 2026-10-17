import "./ShopModal.css";

export default function ShopModal({ shop, open, onClose, onBuy, busy = false }) {
  if (!open || !shop) return null;
  return (
    <div className="shop-overlay" onClick={onClose}>
      <section className="shop-modal" onClick={(event) => event.stopPropagation()}>
        <header className="shop-header">
          <div><p className="shop-kicker">Comerciante itinerante</p><h2>{shop.name}</h2></div>
          <button className="shop-close" onClick={onClose} aria-label="Fechar loja">×</button>
        </header>
        <p className="shop-greeting">{shop.greeting}</p>
        <div className="shop-items">
          {shop.items.map((item) => (
            <article className="shop-item" key={item.code}>
              <div className="shop-item__info">
                <div className="shop-item__title"><strong>{item.name}</strong><span className={`rarity rarity--${item.rarity}`}>{item.rarity}</span></div>
                <p>{item.description}</p>
                {item.stats && <small>Bônus: {Object.entries(item.stats).map(([key, value]) => `${key} +${value}`).join(" · ")}</small>}
                {item.effect && <small>Uso: {Object.entries(item.effect).map(([key, value]) => `${key} +${value}`).join(" · ")}</small>}
              </div>
              <div className="shop-item__buy"><span>🪙 {item.price}</span><button disabled={busy || item.price <= 0} onClick={() => onBuy(item)}>Comprar</button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
