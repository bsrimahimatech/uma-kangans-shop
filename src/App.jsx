import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingBag, Plus, Minus, X, Lock, Trash2, ImagePlus, MessageCircle, Mail, ChevronLeft, Check, Sparkles } from "lucide-react";
import { supabase } from "./supabaseClient";

const SHOP = {
  name: "Uma Kangans",
  nameLine2: "and Fancy",
  tagline: "1 gram jewellery — affordable luxury",
  whatsapp: "917732050812",
  email: "boyapatisandhya1997@gmail.com",
  address: "Flat No-207, SMS Heights, beside KL University, Guntur, 522302",
  hours: "9:00 AM – 8:00 PM",
  phoneDisplay: "+91 77320 50812",
};

const ADMIN_PASSWORD = "uma1gram";
const CATEGORIES = ["Chains", "Necklace Sets", "Bangles", "Earrings", "Hair Pins", "Other"];

// ---------- Supabase helpers ----------
async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadProducts error:", error);
    return [];
  }
  return (data || []).map(rowToProduct);
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    designNo: row.design_no,
    price: row.price,
    category: row.category,
    image: row.image_url,
    inStock: row.in_stock,
    addedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function productToRow(p) {
  return {
    name: p.name,
    design_no: p.designNo || null,
    price: p.price,
    category: p.category,
    image_url: p.image || null,
    in_stock: p.inStock,
  };
}

async function insertProducts(products) {
  const rows = products.map(productToRow);
  const { data, error } = await supabase.from("products").insert(rows).select();
  if (error) {
    console.error("insertProducts error:", error);
    return { ok: false, data: [] };
  }
  return { ok: true, data: (data || []).map(rowToProduct) };
}

async function updateProduct(id, patch) {
  const row = productToRow(patch);
  const { error } = await supabase.from("products").update(row).eq("id", id);
  if (error) {
    console.error("updateProduct error:", error);
    return false;
  }
  return true;
}

async function deleteProductRow(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("deleteProduct error:", error);
    return false;
  }
  return true;
}

async function toggleStockRow(id, inStock) {
  const { error } = await supabase.from("products").update({ in_stock: inStock }).eq("id", id);
  if (error) {
    console.error("toggleStock error:", error);
    return false;
  }
  return true;
}

function formatRupee(n) {
  const num = Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ---------- Wax-seal design-number badge (signature element) ----------
function SealBadge({ no }) {
  if (!no) return null;
  return (
    <div className="seal-badge" aria-label={`Design number ${no}`}>
      <span className="seal-badge-no">{no}</span>
    </div>
  );
}

// ---------- Toast ----------
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <Check size={16} strokeWidth={3} />
      <span>{message}</span>
    </div>
  );
}

// ---------- Product Card ----------
function ProductCard({ product, qty, onAdd, onChangeQty }) {
  return (
    <div className="product-card">
      <div className="product-img-wrap">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-img" />
        ) : (
          <div className="product-img-placeholder">
            <Sparkles size={28} strokeWidth={1.5} />
          </div>
        )}
        <SealBadge no={product.designNo} />
        {!product.inStock && <div className="sold-strip">Out of stock</div>}
      </div>
      <div className="product-body">
        <p className="product-cat">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-row">
          <span className="product-price">{formatRupee(product.price)}</span>
          {qty > 0 ? (
            <div className="qty-stepper">
              <button aria-label="Decrease quantity" onClick={() => onChangeQty(product.id, qty - 1)}>
                <Minus size={14} />
              </button>
              <span>{qty}</span>
              <button aria-label="Increase quantity" onClick={() => onChangeQty(product.id, qty + 1)}>
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              className="add-btn"
              disabled={!product.inStock}
              onClick={() => onAdd(product.id)}
            >
              {product.inStock ? "Add" : "Unavailable"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Cart Drawer ----------
function CartDrawer({ open, onClose, cartItems, products, onChangeQty, onCheckout }) {
  const lines = cartItems
    .map(({ id, qty }) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((l) => l.product);
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  return (
    <>
      <div className={`drawer-scrim ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="cart-header">
          <h2>Your bag</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close bag">
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={32} strokeWidth={1.3} />
            <p>Your bag is empty.</p>
            <span>Browse the catalogue and add a piece you like.</span>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ product, qty }) => (
                <div className="cart-line" key={product.id}>
                  <div className="cart-line-img">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <Sparkles size={18} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="cart-line-info">
                    <p className="cart-line-name">{product.name}</p>
                    <p className="cart-line-no">D.No: {product.designNo || "—"}</p>
                    <div className="cart-line-bottom">
                      <div className="qty-stepper small">
                        <button onClick={() => onChangeQty(product.id, qty - 1)} aria-label="Decrease quantity">
                          <Minus size={12} />
                        </button>
                        <span>{qty}</span>
                        <button onClick={() => onChangeQty(product.id, qty + 1)} aria-label="Increase quantity">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="cart-line-price">{formatRupee(product.price * qty)}</span>
                    </div>
                  </div>
                  <button
                    className="cart-line-remove"
                    onClick={() => onChangeQty(product.id, 0)}
                    aria-label={`Remove ${product.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total</span>
                <span className="cart-total-amount">{formatRupee(total)}</span>
              </div>
              <p className="cart-note">Final price &amp; payment (UPI/COD) confirmed directly with the shop.</p>
              <button className="checkout-btn" onClick={onCheckout}>
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ---------- Checkout Modal ----------
function CheckoutModal({ open, onClose, cartItems, products, onPlaced }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState({});

  const lines = cartItems
    .map(({ id, qty }) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((l) => l.product);
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  if (!open) return null;

  function buildMessage() {
    const itemLines = lines
      .map((l) => `• ${l.product.name} (D.No: ${l.product.designNo || "—"}) x${l.qty} — ${formatRupee(l.product.price * l.qty)}`)
      .join("\n");
    return `New order — ${SHOP.name} ${SHOP.nameLine2}\n\n${itemLines}\n\nTotal: ${formatRupee(total)}\n\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}${form.notes ? `\nNotes: ${form.notes}` : ""}`;
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleWhatsApp() {
    if (!validate()) return;
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${SHOP.whatsapp}?text=${msg}`, "_blank");
    onPlaced();
  }

  function handleEmail() {
    if (!validate()) return;
    const subject = encodeURIComponent(`New order — ${form.name}`);
    const body = encodeURIComponent(buildMessage());
    window.open(`mailto:${SHOP.email}?subject=${subject}&body=${body}`, "_blank");
    onPlaced();
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm your details</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-summary">
          {lines.map((l) => (
            <div key={l.product.id} className="checkout-summary-row">
              <span>{l.product.name} × {l.qty}</span>
              <span>{formatRupee(l.product.price * l.qty)}</span>
            </div>
          ))}
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>{formatRupee(total)}</span>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="10-digit mobile number"
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <label>
            Delivery address
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House no, street, city, pincode"
              rows={2}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </label>
          <label>
            Notes (optional)
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any size or color preference"
            />
          </label>
        </div>

        <p className="checkout-note">
          Sending opens WhatsApp or your mail app with the order pre-filled — the shop will confirm price and arrange UPI/COD payment with you directly.
        </p>

        <div className="checkout-actions">
          <button className="checkout-action whatsapp" onClick={handleWhatsApp}>
            <MessageCircle size={17} /> Send via WhatsApp
          </button>
          <button className="checkout-action email" onClick={handleEmail}>
            <Mail size={17} /> Send via Email
          </button>
        </div>
      </div>
    </div>
  );
}
function AdminPanel({ products, setProducts, onBack }) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [quickAdding, setQuickAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function tryLogin(e) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  async function handleSave(product) {
    setSaving(true);
    if (product.id) {
      const ok = await updateProduct(product.id, product);
      if (ok) {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...product } : p)));
        setToast("Product updated");
      } else {
        setToast("Could not save — try again");
      }
    } else {
      const { ok, data } = await insertProducts([product]);
      if (ok && data.length) {
        setProducts((prev) => [data[0], ...prev]);
        setToast("Product added");
      } else {
        setToast("Could not add — try again");
      }
    }
    setSaving(false);
    setEditing(null);
  }

  async function handleQuickAddBatch(newProducts) {
    setSaving(true);
    const { ok, data } = await insertProducts(newProducts);
    if (ok) {
      setProducts((prev) => [...data, ...prev]);
      setToast(`${data.length} product${data.length === 1 ? "" : "s"} added`);
    } else {
      setToast("Could not save batch — try again");
    }
    setSaving(false);
    setQuickAdding(false);
  }

  async function handleDelete(id) {
    setSaving(true);
    const ok = await deleteProductRow(id);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setToast("Product removed");
    } else {
      setToast("Could not remove — try again");
    }
    setSaving(false);
  }

  async function handleToggleStock(id, current) {
    const ok = await toggleStockRow(id, !current);
    if (ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, inStock: !current } : p)));
    } else {
      setToast("Could not update — try again");
    }
  }

  if (!authed) {
    return (
      <div className="admin-login-screen">
        <button className="back-link" onClick={onBack}>
          <ChevronLeft size={16} /> Back to shop
        </button>
        <div className="admin-login-box">
          <Lock size={24} strokeWidth={1.5} />
          <h2>Admin access</h2>
          <p>Enter the shop password to manage products.</p>
          <form onSubmit={tryLogin}>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            {pwError && <span className="field-error">Incorrect password</span>}
            <button type="submit" className="admin-login-btn">
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className="admin-topbar">
        <button className="back-link" onClick={onBack}>
          <ChevronLeft size={16} /> Back to shop
        </button>
        <h2>Manage products</h2>
        <div className="admin-topbar-actions">
          <button className="admin-quickadd-btn" onClick={() => setQuickAdding(true)}>
            <ImagePlus size={16} /> Quick add
          </button>
          <button className="admin-add-btn" onClick={() => setEditing("new")}>
            <Plus size={16} /> Add product
          </button>
        </div>
      </div>

      {saving && <p className="saving-indicator">Saving…</p>}

      {products.length === 0 ? (
        <div className="admin-empty">
          <p>No products yet. Add today's first design to get started.</p>
        </div>
      ) : (
        <div className="admin-table">
          {products
            .slice()
            .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
            .map((p) => (
              <div className="admin-row" key={p.id}>
                <div className="admin-row-img">
                  {p.image ? <img src={p.image} alt={p.name} /> : <Sparkles size={18} />}
                </div>
                <div className="admin-row-info">
                  <p className="admin-row-name">{p.name}</p>
                  <p className="admin-row-meta">
                    {p.category} · D.No {p.designNo || "—"} · {formatRupee(p.price)}
                  </p>
                </div>
                <button
                  className={`stock-toggle ${p.inStock ? "in" : "out"}`}
                  onClick={() => handleToggleStock(p.id, p.inStock)}
                >
                  {p.inStock ? "In stock" : "Out of stock"}
                </button>
                <button className="icon-btn" onClick={() => setEditing(p)} aria-label="Edit">
                  Edit
                </button>
                <button className="icon-btn danger" onClick={() => handleDelete(p.id)} aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>
      )}

      {quickAdding && (
        <QuickAddFlow onCancel={() => setQuickAdding(false)} onFinish={handleQuickAddBatch} />
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

function QuickAddFlow({ onCancel, onFinish }) {
  const [queue, setQueue] = useState(null);
  const [index, setIndex] = useState(0);
  const [lastCategory, setLastCategory] = useState(CATEGORIES[0]);
  const pickerRef = useRef(null);
  const nameRef = useRef(null);

  async function handlePick(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const withUrls = await Promise.all(
      files.map(async (file) => ({
        image: await fileToDataUrl(file),
        name: "",
        designNo: "",
        price: "",
        category: lastCategory,
        inStock: true,
        done: false,
      }))
    );
    setQueue(withUrls);
    setIndex(0);
  }

  useEffect(() => {
    if (queue) nameRef.current?.focus();
  }, [index, queue]);

  function updateCurrent(patch) {
    setQueue((q) => q.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function currentValid() {
    const item = queue[index];
    return item.name.trim() && item.price && Number(item.price) > 0;
  }

  function goNext() {
    if (!currentValid()) return;
    setLastCategory(queue[index].category);
    updateCurrent({ done: true });
    if (index < queue.length - 1) {
      setIndex(index + 1);
    } else {
      finishAll();
    }
  }

  function skipCurrent() {
    if (index < queue.length - 1) setIndex(index + 1);
    else finishAll();
  }

  function finishAll() {
    const finished = queue
      .filter((item) => item.done || (item.name.trim() && item.price))
      .map(({ done, ...rest }) => ({ ...rest, price: Number(rest.price) }));
    if (finished.length === 0) {
      onCancel();
      return;
    }
    onFinish(finished);
  }

  if (!queue) {
    return (
      <div className="modal-scrim" onClick={onCancel}>
        <div className="modal quickadd-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Quick add</h2>
            <button className="icon-btn" onClick={onCancel} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="quickadd-intro">
            <ImagePlus size={32} strokeWidth={1.3} />
            <p>Select all of today's photos at once — you'll fill in the name and price for each, one after another.</p>
            <button className="admin-quickadd-btn solid" onClick={() => pickerRef.current?.click()}>
              Select photos
            </button>
            <input
              ref={pickerRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePick}
              hidden
            />
          </div>
        </div>
      </div>
    );
  }

  const item = queue[index];
  const remaining = queue.length - index - 1;

  return (
    <div className="modal-scrim">
      <div className="modal quickadd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Photo {index + 1} of {queue.length}
          </h2>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="quickadd-progress">
          {queue.map((q, i) => (
            <span
              key={i}
              className={`quickadd-dot ${i === index ? "current" : q.done ? "done" : ""}`}
            />
          ))}
        </div>

        <div className="quickadd-body">
          <div className="quickadd-image">
            <img src={item.image} alt="" />
          </div>
          <div className="form-grid quickadd-form">
            <label>
              Name
              <input
                ref={nameRef}
                value={item.name}
                onChange={(e) => updateCurrent({ name: e.target.value })}
                placeholder="e.g. Panchaloham chain"
                onKeyDown={(e) => e.key === "Enter" && goNext()}
              />
            </label>
            <div className="form-row-2">
              <label>
                Design no.
                <input
                  value={item.designNo}
                  onChange={(e) => updateCurrent({ designNo: e.target.value })}
                  placeholder="e.g. L71"
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                />
              </label>
              <label>
                Price (₹)
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateCurrent({ price: e.target.value })}
                  placeholder="e.g. 450"
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                />
              </label>
            </div>
            <label>
              Category
              <select value={item.category} onChange={(e) => updateCurrent({ category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="quickadd-actions">
          <button className="quickadd-skip" onClick={skipCurrent}>
            Skip this photo
          </button>
          <button className="save-btn" onClick={goNext} disabled={!item.name.trim() || !item.price}>
            {remaining > 0 ? `Save & next (${remaining} left)` : "Save & finish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      designNo: "",
      category: CATEGORIES[0],
      price: "",
      image: "",
      inStock: true,
    }
  );
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm({ ...form, image: dataUrl });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.price || Number(form.price) <= 0) e.price = "Enter a valid price";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ ...form, price: Number(form.price) });
  }

  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal product-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial ? "Edit product" : "Add product"}</h2>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="image-upload-row">
            <div className="image-upload-preview" onClick={() => fileRef.current?.click()}>
              {form.image ? <img src={form.image} alt="" /> : <ImagePlus size={24} strokeWidth={1.5} />}
            </div>
            <div>
              <button type="button" className="upload-btn" onClick={() => fileRef.current?.click()}>
                {form.image ? "Change photo" : "Upload photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
            </div>
          </div>

          <label>
            Product name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Panchaloham chain"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <div className="form-row-2">
            <label>
              Design no.
              <input
                value={form.designNo}
                onChange={(e) => setForm({ ...form, designNo: e.target.value })}
                placeholder="e.g. L71"
              />
            </label>
            <label>
              Price (₹)
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 450"
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </label>
          </div>

          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
            />
            In stock
          </label>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {initial ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main App ----------
// ============================================================
// PART 3 — Main App + CSS
// Paste this AFTER parts 1 & 2 in your App.jsx
// ============================================================

// ---------- Main App ----------
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // [{id, qty}]
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [view, setView] = useState("shop"); // "shop" | "admin"
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");

  // Load products from Supabase on mount
  useEffect(() => {
    loadProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  // Cart helpers
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  function addToCart(id) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id, qty: 1 }];
    });
    setToast("Added to bag");
  }

  function changeQty(id, qty) {
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.id !== id));
    else setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
  }

  function getQty(id) {
    return cart.find((c) => c.id === id)?.qty || 0;
  }

  function handleOrderPlaced() {
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setToast("Order sent! The shop will confirm with you shortly.");
  }

  // Filter products
  const categories = ["All", ...CATEGORIES];
  const visible = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.designNo || "").toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (view === "admin") {
    return (
      <>
        <Style />
        <AdminPanel products={products} setProducts={setProducts} onBack={() => setView("shop")} />
      </>
    );
  }

  return (
    <>
      <Style />

      {/* ── Header ── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand" onClick={() => setView("shop")} role="button" tabIndex={0}>
            <div className="brand-mark">UK</div>
            <div className="brand-text">
              <span className="brand-name">
                {SHOP.name} <em>&amp;</em> {SHOP.nameLine2}
              </span>
              <span className="brand-tagline">{SHOP.tagline}</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Open bag, ${cartCount} items`}
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">New arrivals daily</p>
          <h1 className="hero-heading">
            Gold-finish jewellery<br />
            <span className="hero-accent">at everyday prices.</span>
          </h1>
          <p className="hero-sub">
            1-gram gold plating · Bangles, chains, necklace sets, earrings &amp; more
          </p>
        </div>
        <div className="hero-ornament" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 5" />
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="8" fill="currentColor" />
            {[0,45,90,135,180,225,270,315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 100 + 74 * Math.sin(rad);
              const y = 100 - 74 * Math.cos(rad);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="currentColor" opacity="0.7" />;
            })}
          </svg>
        </div>
      </section>

      {/* ── Catalogue ── */}
      <main className="catalogue">
        {/* Search + filter bar */}
        <div className="filter-bar">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              className="search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or design no."
              aria-label="Search products"
            />
          </div>
          <div className="category-pills" role="list">
            {categories.map((c) => (
              <button
                key={c}
                role="listitem"
                className={`pill ${activeCategory === c ? "active" : ""}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading collection…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={36} strokeWidth={1.2} />
            <p>No pieces found.</p>
            <span>Try a different search or category.</span>
          </div>
        ) : (
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                qty={getQty(p.id)}
                onAdd={addToCart}
                onChangeQty={changeQty}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-mark small">UK</div>
            <div>
              <p className="footer-shop-name">{SHOP.name} &amp; {SHOP.nameLine2}</p>
              <p className="footer-tagline">{SHOP.tagline}</p>
            </div>
          </div>
          <div className="footer-details">
            <p>📍 {SHOP.address}</p>
            <p>📞 {SHOP.phoneDisplay}</p>
            <p>🕘 {SHOP.hours}</p>
            <p>✉️ {SHOP.email}</p>
          </div>
          <div className="footer-admin">
            <button className="admin-link" onClick={() => setView("admin")}>
              <Lock size={13} /> Manage products
            </button>
          </div>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} {SHOP.name} &amp; {SHOP.nameLine2}. All rights reserved.</p>
      </footer>

      {/* ── Drawers / Modals ── */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        products={products}
        onChangeQty={changeQty}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cart}
        products={products}
        onPlaced={handleOrderPlaced}
      />

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </>
  );
}

// ============================================================
// CSS — inject via a <style> tag using the Style component
// ============================================================
function Style() {
  return (
    <style>{`
/* ── Reset & base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Palette — warm champagne gold + deep burgundy + ivory */
  --gold:       #C9973A;
  --gold-lt:    #E8C97A;
  --gold-dk:    #9A6F1E;
  --cream:      #FBF7F0;
  --ivory:      #F5EFE4;
  --burgundy:   #5C1F2E;
  --charcoal:   #1E1714;
  --muted:      #8A7A6A;
  --border:     #E4D9C8;
  --white:      #FFFFFF;

  /* Typography */
  --font-display: 'Georgia', 'Times New Roman', serif;
  --font-body:    system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* Spacing */
  --header-h: 64px;
  --r-card:   12px;
  --r-btn:    8px;
  --shadow:   0 2px 16px rgba(92,31,46,0.09);
  --shadow-lg:0 8px 32px rgba(92,31,46,0.14);
}

html { scroll-behavior: smooth; }

body {
  background: var(--cream);
  color: var(--charcoal);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ── Header ── */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--burgundy);
  box-shadow: 0 2px 12px rgba(92,31,46,0.22);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.brand-mark {
  width: 40px; height: 40px;
  background: var(--gold);
  color: var(--white);
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.5px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.brand-mark.small { width: 32px; height: 32px; font-size: 12px; }
.brand-text { display: flex; flex-direction: column; }
.brand-name {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--gold-lt);
  line-height: 1.2;
  letter-spacing: 0.3px;
}
.brand-name em { font-style: italic; color: var(--gold); }
.brand-tagline {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-top: 1px;
}
.header-actions { display: flex; align-items: center; gap: 10px; }
.cart-btn {
  position: relative;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: var(--white);
  border-radius: 50%;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.cart-btn:hover { background: rgba(255,255,255,0.22); }
.cart-badge {
  position: absolute;
  top: -4px; right: -4px;
  background: var(--gold);
  color: var(--white);
  border-radius: 50%;
  width: 18px; height: 18px;
  font-size: 10px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--burgundy);
}

/* ── Hero ── */
.hero {
  position: relative;
  background: linear-gradient(135deg, var(--burgundy) 0%, #3E1020 100%);
  color: var(--white);
  padding: 64px 20px 56px;
  overflow: hidden;
}
.hero-inner {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}
.hero-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--gold-lt);
  margin-bottom: 14px;
}
.hero-heading {
  font-family: var(--font-display);
  font-size: clamp(28px, 5vw, 46px);
  font-weight: normal;
  line-height: 1.22;
  color: var(--white);
  margin-bottom: 14px;
}
.hero-accent {
  color: var(--gold-lt);
  font-style: italic;
}
.hero-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.65);
  letter-spacing: 0.3px;
}
.hero-ornament {
  position: absolute;
  right: -40px; top: 50%;
  transform: translateY(-50%);
  width: 240px; height: 240px;
  color: var(--gold);
  opacity: 0.18;
  pointer-events: none;
}

/* ── Catalogue ── */
.catalogue {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
}
.search-wrap {
  position: relative;
  max-width: 380px;
}
.search-icon {
  position: absolute;
  left: 12px; top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px;
  color: var(--muted);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-btn);
  background: var(--white);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--charcoal);
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--gold); }
.search-input::placeholder { color: var(--muted); }

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  padding: 6px 16px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: var(--white);
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}
.pill:hover { border-color: var(--gold); color: var(--gold-dk); }
.pill.active {
  background: var(--burgundy);
  border-color: var(--burgundy);
  color: var(--white);
}

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}

/* ── Product card ── */
.product-card {
  background: var(--white);
  border-radius: var(--r-card);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}
.product-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.product-img-wrap {
  position: relative;
  aspect-ratio: 1;
  background: var(--ivory);
  overflow: hidden;
}
.product-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}
.product-card:hover .product-img { transform: scale(1.04); }
.product-img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
}
.sold-strip {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(92,31,46,0.85);
  color: var(--white);
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 6px;
}
.product-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.product-cat {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
}
.product-name {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--charcoal);
  line-height: 1.3;
}
.product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 8px;
}
.product-price {
  font-weight: 700;
  font-size: 16px;
  color: var(--burgundy);
}

/* ── Buttons ── */
.add-btn {
  padding: 7px 16px;
  background: var(--burgundy);
  color: var(--white);
  border: none;
  border-radius: var(--r-btn);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
  white-space: nowrap;
}
.add-btn:hover:not(:disabled) { background: var(--gold-dk); }
.add-btn:disabled {
  background: var(--border);
  color: var(--muted);
  cursor: not-allowed;
}

/* ── Qty stepper ── */
.qty-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ivory);
  border: 1.5px solid var(--border);
  border-radius: 100px;
  padding: 3px 8px;
}
.qty-stepper button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--burgundy);
  display: flex; align-items: center; justify-content: center;
  padding: 2px;
  border-radius: 50%;
  transition: background 0.15s;
}
.qty-stepper button:hover { background: var(--border); }
.qty-stepper span {
  font-size: 14px;
  font-weight: 700;
  color: var(--charcoal);
  min-width: 18px;
  text-align: center;
}
.qty-stepper.small { padding: 2px 6px; gap: 6px; }
.qty-stepper.small span { font-size: 13px; }

/* ── Wax-seal badge ── */
.seal-badge {
  position: absolute;
  top: 8px; right: 8px;
  width: 36px; height: 36px;
  background: var(--gold);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.18);
}
.seal-badge::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px dashed rgba(201,151,58,0.5);
}
.seal-badge-no {
  font-size: 10px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: 0.3px;
}

/* ── Empty / loading states ── */
.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 72px 20px;
  color: var(--muted);
  text-align: center;
}
.empty-state p, .loading-state p { font-size: 16px; color: var(--charcoal); }
.empty-state span { font-size: 13px; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Cart drawer ── */
.drawer-scrim {
  position: fixed; inset: 0;
  background: rgba(30,23,20,0.45);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.28s;
}
.drawer-scrim.open { opacity: 1; pointer-events: all; }

.cart-drawer {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(400px, 100vw);
  background: var(--white);
  z-index: 201;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  box-shadow: -4px 0 24px rgba(92,31,46,0.12);
}
.cart-drawer.open { transform: translateX(0); }

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--burgundy);
  color: var(--white);
}
.cart-header h2 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: normal;
}

.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--muted);
  padding: 40px;
  text-align: center;
}
.cart-empty p { font-size: 16px; color: var(--charcoal); }
.cart-empty span { font-size: 13px; }

.cart-lines {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cart-line {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: var(--ivory);
  border-radius: var(--r-card);
  border: 1px solid var(--border);
}
.cart-line-img {
  width: 56px; height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--border);
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted);
}
.cart-line-img img { width: 100%; height: 100%; object-fit: cover; }
.cart-line-info { flex: 1; min-width: 0; }
.cart-line-name { font-size: 14px; font-weight: 600; line-height: 1.3; }
.cart-line-no { font-size: 11px; color: var(--muted); margin-top: 2px; }
.cart-line-bottom {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; gap: 8px;
}
.cart-line-price { font-weight: 700; font-size: 14px; color: var(--burgundy); }
.cart-line-remove {
  background: none; border: none; cursor: pointer;
  color: var(--muted); padding: 4px;
  transition: color 0.15s;
}
.cart-line-remove:hover { color: var(--burgundy); }

.cart-footer {
  padding: 20px;
  border-top: 1px solid var(--border);
  background: var(--white);
}
.cart-total-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.cart-total-amount { font-size: 20px; font-weight: 700; color: var(--burgundy); }
.cart-note { font-size: 11px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
.checkout-btn {
  width: 100%;
  padding: 14px;
  background: var(--burgundy);
  color: var(--white);
  border: none;
  border-radius: var(--r-btn);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: background 0.18s;
}
.checkout-btn:hover { background: var(--gold-dk); }

/* ── Modals ── */
.modal-scrim {
  position: fixed; inset: 0;
  background: rgba(30,23,20,0.5);
  z-index: 300;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.modal {
  background: var(--white);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0;
  background: var(--white);
  z-index: 1;
}
.modal-header h2 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: normal;
  color: var(--burgundy);
}

/* ── Checkout modal ── */
.checkout-modal { padding-bottom: 24px; }
.checkout-summary {
  margin: 16px 20px;
  padding: 14px;
  background: var(--ivory);
  border-radius: var(--r-card);
  border: 1px solid var(--border);
}
.checkout-summary-row {
  display: flex; justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: var(--charcoal);
}
.checkout-summary-total {
  display: flex; justify-content: space-between;
  font-weight: 700;
  font-size: 15px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
  padding-top: 8px;
  color: var(--burgundy);
}
.checkout-note {
  margin: 0 20px 16px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.checkout-actions {
  display: flex; flex-direction: column; gap: 10px;
  padding: 0 20px;
}
.checkout-action {
  display: flex; align-items: center; justify-content: center;
  gap: 8px;
  padding: 13px;
  border: none;
  border-radius: var(--r-btn);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.18s;
}
.checkout-action:hover { opacity: 0.86; }
.checkout-action.whatsapp { background: #25D366; color: var(--white); }
.checkout-action.email { background: var(--burgundy); color: var(--white); }

/* ── Form elements ── */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 20px;
}
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
label input, label textarea, label select {
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-btn);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--charcoal);
  background: var(--white);
  outline: none;
  transition: border-color 0.2s;
}
label input:focus, label textarea:focus, label select:focus {
  border-color: var(--gold);
}
label textarea { resize: vertical; min-height: 68px; }
.field-error { font-size: 11px; color: #c0392b; font-weight: 600; text-transform: none; letter-spacing: 0; }
.checkbox-row {
  flex-direction: row !important;
  align-items: center;
  gap: 8px !important;
  cursor: pointer;
}
.checkbox-row input { width: 16px; height: 16px; cursor: pointer; }

/* ── Form actions ── */
.form-actions {
  display: flex; gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  margin-top: 6px;
}
.cancel-btn, .save-btn {
  flex: 1; padding: 12px;
  border-radius: var(--r-btn);
  font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.18s;
}
.cancel-btn {
  background: var(--ivory); color: var(--muted);
  border: 1.5px solid var(--border);
}
.cancel-btn:hover { border-color: var(--muted); }
.save-btn {
  background: var(--burgundy); color: var(--white);
  border: none;
}
.save-btn:hover:not(:disabled) { background: var(--gold-dk); }
.save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Image upload ── */
.image-upload-row {
  display: flex; align-items: center; gap: 16px;
  padding: 0 20px;
}
.image-upload-preview {
  width: 80px; height: 80px;
  border-radius: var(--r-card);
  border: 2px dashed var(--border);
  background: var(--ivory);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted); cursor: pointer;
  flex-shrink: 0;
}
.image-upload-preview img { width: 100%; height: 100%; object-fit: cover; }
.upload-btn {
  padding: 8px 16px;
  background: var(--ivory);
  border: 1.5px solid var(--border);
  border-radius: var(--r-btn);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.18s;
}
.upload-btn:hover { border-color: var(--gold); }

/* ── Admin ── */
.admin-login-screen {
  min-height: 100vh;
  background: var(--cream);
  display: flex;
  flex-direction: column;
  padding: 20px;
}
.back-link {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none;
  font-size: 14px; color: var(--muted);
  cursor: pointer; padding: 0;
  margin-bottom: 24px;
  transition: color 0.18s;
}
.back-link:hover { color: var(--charcoal); }
.admin-login-box {
  max-width: 340px;
  margin: 0 auto;
  background: var(--white);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 36px 32px;
  text-align: center;
  display: flex; flex-direction: column; gap: 12px;
  color: var(--charcoal);
  box-shadow: var(--shadow);
}
.admin-login-box h2 { font-family: var(--font-display); font-weight: normal; color: var(--burgundy); }
.admin-login-box p { font-size: 13px; color: var(--muted); }
.admin-login-box form {
  display: flex; flex-direction: column; gap: 10px; margin-top: 8px;
}
.admin-login-box input {
  padding: 11px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-btn);
  font-size: 14px;
  outline: none;
}
.admin-login-box input:focus { border-color: var(--gold); }
.admin-login-btn {
  padding: 12px;
  background: var(--burgundy);
  color: var(--white);
  border: none;
  border-radius: var(--r-btn);
  font-size: 14px; font-weight: 700;
  cursor: pointer;
}

.admin-screen {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}
.admin-topbar {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.admin-topbar h2 {
  font-family: var(--font-display);
  font-size: 20px; font-weight: normal;
  color: var(--burgundy);
  flex: 1;
}
.admin-topbar-actions { display: flex; gap: 8px; }
.admin-add-btn, .admin-quickadd-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  border-radius: var(--r-btn);
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.18s;
}
.admin-add-btn {
  background: var(--burgundy); color: var(--white); border: none;
}
.admin-add-btn:hover { background: var(--gold-dk); }
.admin-quickadd-btn {
  background: var(--ivory); color: var(--charcoal);
  border: 1.5px solid var(--border);
}
.admin-quickadd-btn:hover { border-color: var(--gold); }
.admin-quickadd-btn.solid {
  background: var(--gold); color: var(--white);
  border-color: var(--gold);
}

.saving-indicator {
  font-size: 13px; color: var(--muted);
  text-align: center; margin-bottom: 12px;
  animation: pulse 1s infinite;
}
@keyframes pulse { 50% { opacity: 0.4; } }

.admin-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}
.admin-table { display: flex; flex-direction: column; gap: 10px; }
.admin-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
}
.admin-row-img {
  width: 48px; height: 48px;
  border-radius: 8px;
  background: var(--ivory);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--muted);
}
.admin-row-img img { width: 100%; height: 100%; object-fit: cover; }
.admin-row-info { flex: 1; min-width: 0; }
.admin-row-name { font-size: 14px; font-weight: 600; }
.admin-row-meta { font-size: 12px; color: var(--muted); }

.stock-toggle {
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 12px; font-weight: 600;
  cursor: pointer; border: none;
  flex-shrink: 0;
  transition: all 0.18s;
}
.stock-toggle.in { background: #e8f5e9; color: #2e7d32; }
.stock-toggle.out { background: #fdecea; color: #c62828; }
.stock-toggle:hover { opacity: 0.75; }

.icon-btn {
  background: none; border: 1px solid var(--border);
  border-radius: var(--r-btn);
  font-size: 13px; font-weight: 600;
  color: var(--charcoal);
  padding: 6px 12px;
  cursor: pointer; transition: all 0.18s;
}
.icon-btn:hover { border-color: var(--gold); color: var(--gold-dk); }
.icon-btn.danger { color: #c62828; }
.icon-btn.danger:hover { border-color: #c62828; background: #fdecea; }

/* ── QuickAdd modal ── */
.quickadd-modal { max-width: 560px; }
.quickadd-intro {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 32px 24px;
  color: var(--muted); text-align: center;
}
.quickadd-intro p { font-size: 14px; line-height: 1.6; }
.quickadd-progress {
  display: flex; gap: 6px; justify-content: center;
  padding: 12px 20px 0;
}
.quickadd-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--border);
  transition: background 0.2s;
}
.quickadd-dot.current { background: var(--gold); }
.quickadd-dot.done { background: var(--burgundy); }
.quickadd-body {
  display: flex; gap: 16px;
  padding: 16px 20px;
  align-items: flex-start;
}
.quickadd-image {
  width: 140px; height: 140px;
  border-radius: var(--r-card);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--ivory);
}
.quickadd-image img { width: 100%; height: 100%; object-fit: cover; }
.quickadd-form { flex: 1; padding: 0; }
.quickadd-actions {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  padding: 12px 20px 20px;
  border-top: 1px solid var(--border);
}
.quickadd-skip {
  background: none; border: none;
  font-size: 13px; color: var(--muted);
  cursor: pointer; text-decoration: underline;
}

/* ── Product form modal ── */
.product-form-modal form {
  padding-top: 16px;
  padding-bottom: 0;
}
.product-form-modal .image-upload-row {
  padding-bottom: 4px;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 28px; left: 50%;
  transform: translateX(-50%);
  background: var(--charcoal);
  color: var(--white);
  padding: 11px 20px;
  border-radius: 100px;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  z-index: 999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  animation: slideUp 0.25s ease;
  white-space: nowrap;
}
@keyframes slideUp {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

/* ── Footer ── */
.site-footer {
  background: var(--charcoal);
  color: rgba(255,255,255,0.75);
  padding: 40px 20px 20px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 28px 40px;
  margin-bottom: 28px;
}
.footer-brand {
  display: flex; gap: 12px; align-items: flex-start;
  min-width: 180px;
}
.footer-shop-name {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--gold-lt);
  margin-bottom: 3px;
}
.footer-tagline { font-size: 12px; color: rgba(255,255,255,0.4); }
.footer-details {
  display: flex; flex-direction: column;
  gap: 6px; font-size: 13px; line-height: 1.5;
}
.footer-admin {
  margin-left: auto;
  display: flex; align-items: flex-start;
}
.admin-link {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.45);
  border-radius: var(--r-btn);
  font-size: 12px; padding: 7px 14px;
  cursor: pointer; transition: all 0.18s;
}
.admin-link:hover { color: var(--gold-lt); border-color: var(--gold); }
.footer-copy {
  max-width: 1200px;
  margin: 0 auto;
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 16px;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .hero { padding: 44px 20px 40px; }
  .hero-ornament { display: none; }
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .admin-topbar { flex-direction: column; align-items: flex-start; }
  .quickadd-body { flex-direction: column; }
  .quickadd-image { width: 100%; height: 180px; }
  .form-row-2 { grid-template-columns: 1fr; }
  .footer-admin { margin-left: 0; }
  .brand-text { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
    `}</style>
  );
}
