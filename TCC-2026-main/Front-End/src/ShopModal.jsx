import { useEffect, useMemo, useState } from "react";
import "./ShopModal.css";
import { getItemImage } from "./itemImages";

export default function ShopModal({ shop, open, onClose, onBuy, onSell, inventory = [], money = 0, busy = false }) {
  const [tab, setTab] = useState("buy");
  const [selectedId, setSelectedId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const sellableItems = useMemo(() => inventory.filter((item) => item.sellPrice > 0), [inventory]);
  const selectedItem = sellableItems.find((item) => item.id === selectedId) ?? sellableItems[0] ?? null;

  useEffect(() => {
    if (!open) {
      setTab("buy");
      setSelectedId(null);
      setQuantity(1);
      return;
    }
    if (selectedId != null && !sellableItems.some((item) => item.id === selectedId)) setSelectedId(null);
    if (selectedItem) setQuantity((current) => Math.min(Math.max(1, current), selectedItem.qty));
  }, [open, selectedId, sellableItems, selectedItem]);

  if (!open || !shop) return null;
  return (
    <div className="shop-overlay" onClick={onClose}>
      <section className="shop-modal" onClick={(event) => event.stopPropagation()}>
        <header className="shop-header">
          <div><p className="shop-kicker">Comerciante itinerante</p><h2>{shop.name}</h2></div>
          <button className="shop-close" onClick={onClose} aria-label="Fechar loja">×</button>
        </header>
        <div className="shop-wallet" aria-live="polite"><span>Suas moedas</span><strong>🪙 {money}</strong></div>
        <p className="shop-greeting">{shop.greeting}</p>
        <nav className="shop-tabs" aria-label="Seções da loja">
          <button className={tab === "buy" ? "shop-tab shop-tab--active" : "shop-tab"} onClick={() => setTab("buy")}>Comprar</button>
          <button className={tab === "sell" ? "shop-tab shop-tab--active" : "shop-tab"} onClick={() => setTab("sell")}>Vender itens</button>
        </nav>
        {tab === "buy" ? <div className="shop-items">
          {shop.items.map((item) => (
            <article className="shop-item" key={item.code}>
              <div className="shop-item__image">{getItemImage(item) ? <img src={getItemImage(item)} alt={item.name} /> : <span aria-label={item.name}>◆</span>}</div>
              <div className="shop-item__info">
                <div className="shop-item__title"><strong>{item.name}</strong><span className={`rarity rarity--${item.rarity}`}>{item.rarity}</span></div>
                <p>{item.description}</p>
                {item.stats && <small>Bônus: {Object.entries(item.stats).map(([key, value]) => `${key} +${value}`).join(" · ")}</small>}
                {item.effect && <small>Uso: {Object.entries(item.effect).map(([key, value]) => `${key} +${value}`).join(" · ")}</small>}
              </div>
              <div className="shop-item__buy"><span>🪙 {item.price}</span><button disabled={busy || item.price <= 0} onClick={() => onBuy(item)}>Comprar</button></div>
            </article>
          ))}
        </div> : <div className="shop-sell-layout">
          <div className="shop-sell-list">
            {sellableItems.length === 0 ? <p className="shop-empty">Você não tem itens que este comerciante possa comprar.</p> : sellableItems.map((item) => (
              <button key={item.id} type="button" className={selectedItem?.id === item.id ? "shop-sell-choice shop-sell-choice--active" : "shop-sell-choice"} onClick={() => { setSelectedId(item.id); setQuantity(1); }}>
                <span className="shop-sell-choice__image">{getItemImage(item) ? <img src={getItemImage(item)} alt="" /> : "◆"}</span>
                <span><strong>{item.name}</strong><small>Quantidade: {item.qty}</small></span>
                <b>🪙 {item.sellPrice}/un.</b>
              </button>
            ))}
          </div>
          <section className="shop-sell-detail" aria-live="polite">
            {selectedItem ? <>
              <div className="shop-sell-detail__image">{getItemImage(selectedItem) ? <img src={getItemImage(selectedItem)} alt={selectedItem.name} /> : <span>◆</span>}</div>
              <h3>{selectedItem.name}</h3>
              <p>{selectedItem.description || "Nenhuma descrição disponível para este item."}</p>
              <p className="shop-sell-price">Valor por unidade: 🪙 {selectedItem.sellPrice}</p>
              <div className="shop-quantity">
                <span>Quantidade</span>
                <div>
                  <button type="button" aria-label="Diminuir quantidade" disabled={busy || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                  <strong>{quantity}</strong>
                  <button type="button" aria-label="Aumentar quantidade" disabled={busy || quantity >= selectedItem.qty} onClick={() => setQuantity((value) => Math.min(selectedItem.qty, value + 1))}>+</button>
                </div>
              </div>
              <p className="shop-sell-total">Total a receber: <strong>🪙 {selectedItem.sellPrice * quantity}</strong></p>
              <button className="shop-sell-submit" type="button" disabled={busy || quantity < 1} onClick={() => onSell(selectedItem, quantity)}>Vender {quantity} {quantity === 1 ? "unidade" : "unidades"}</button>
            </> : <p className="shop-empty">Selecione um item vendável do inventário.</p>}
          </section>
        </div>}
      </section>
    </div>
  );
}
