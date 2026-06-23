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

// ---------- Admin Panel ----------
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
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [view, setView] = useState("shop");
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;
    loadProducts().then((p) => {
      if (!mounted) return;
      setProducts(p);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setLoadError(true);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const changeQty = useCallback((id, qty) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.id !== id);
      const exists = prev.find((l) => l.id === id);
      if (exists) return prev.map((l) => (l.id === id ? { ...l, qty } : l));
      return [...prev, { id, qty }];
    });
  }, []);

  const addToCart = useCallback(
    (id) => {
      changeQty(id, 1);
      setToast("Added to bag");
    },
    [changeQty]
  );

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const categories = ["All", ...CATEGORIES];
  const visibleProducts = products.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  if (view === "admin") {
    return (
      <div className="uk-app">
        <GlobalStyles />
        <AdminPanel products={products} setProducts={setProducts} onBack={() => setView("shop")} />
      </div>
    );
  }

  return (
    <div className="uk-app">
      <GlobalStyles />

      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-line1">{SHOP.name}</span>
            <span className="brand-line2">{SHOP.nameLine2}</span>
          </div>
          <button className="bag-btn" onClick={() => setCartOpen(true)} aria-label="Open bag">
            <ShoppingBag size={20} strokeWidth={1.7} />
            {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">1 GRAM JEWELLERY · GUNTUR</p>
          <h1>Step into a world of affordable luxury.</h1>
          <p className="hero-sub">{SHOP.tagline}. New designs added daily — order straight to WhatsApp.</p>
        </div>
      </section>

      <nav className="category-bar">
        {categories.map((c) => (
          <button
            key={c}
            className={`category-chip ${activeCategory === c ? "active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      <main className="catalog">
        {loading ? (
          <div className="empty-state">
            <p>Loading catalogue…</p>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <p>Couldn't load the catalogue.</p>
            <span>Please check your connection and refresh the page.</span>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={28} strokeWidth={1.3} />
            <p>{products.length === 0 ? "New designs are on their way." : "No pieces in this category yet."}</p>
            <span>Check back soon, or browse another category.</span>
          </div>
        ) : (
          <div className="product-grid">
            {visibleProducts.map((p) => {
              const line = cart.find((l) => l.id === p.id);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  qty={line ? line.qty : 0}
                  onAdd={addToCart}
                  onChangeQty={changeQty}
                />
              );
            })}
          </div>
        )}
      </main>

      <footer className="shop-footer">
        <p>{SHOP.address}</p>
        <p>
          {SHOP.hours} · {SHOP.phoneDisplay}
        </p>
        <button className="admin-link" onClick={() => setView("admin")}>
          <Lock size={12} /> Shop admin
        </button>
      </footer>

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
        onPlaced={() => {
          setCheckoutOpen(false);
          setCart([]);
          setToast("Order sent — the shop will confirm shortly");
        }}
      />

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      :root {
        --navy: #0F1629;
        --gold: #C9A05C;
        --gold-light: #E0C28A;
        --cream: #FAF6EE;
        --maroon: #6B1626;
        --card: #FFFFFF;
        --ink: #1C1A22;
        --ink-soft: #6B6878;
        --border: #E8E2D4;
      }
      * { box-sizing: border-box; }
      html, body, #root { margin: 0; padding: 0; }
      .uk-app {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--cream);
        color: var(--ink);
        min-height: 100vh;
        width: 100%;
      }
      .uk-app h1, .uk-app h2, .uk-app .brand-line1, .uk-app .brand-line2 {
        font-family: 'Playfair Display', Georgia, serif;
      }
      button { font-family: inherit; cursor: pointer; border: none; background: none; }
      input, textarea, select { font-family: inherit; }
      input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
        outline: 2px solid var(--gold); outline-offset: 2px;
      }

      .topbar { background: var(--navy); position: sticky; top: 0; z-index: 30; }
      .topbar-inner {
        max-width: 1100px; margin: 0 auto; padding: 14px 20px;
        display: flex; align-items: center; justify-content: space-between;
      }
      .brand { display: flex; flex-direction: column; line-height: 1.1; }
      .brand-line1 { color: var(--gold-light); font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
      .brand-line2 { color: var(--gold-light); font-size: 13px; font-style: italic; opacity: 0.85; }
      .bag-btn { position: relative; color: var(--cream); padding: 8px; border-radius: 50%; }
      .bag-btn:hover { background: rgba(255,255,255,0.08); }
      .bag-count {
        position: absolute; top: 0; right: 0; background: var(--maroon); color: #fff;
        font-size: 10px; font-weight: 700; border-radius: 999px; min-width: 16px; height: 16px;
        display: flex; align-items: center; justify-content: center; padding: 0 3px;
      }

      .hero { background: linear-gradient(180deg, var(--navy) 0%, #18213a 100%); padding: 38px 20px 30px; }
      .hero-inner { max-width: 1100px; margin: 0 auto; }
      .hero-eyebrow { color: var(--gold); font-size: 11px; letter-spacing: 2px; font-weight: 600; margin: 0 0 10px; }
      .hero h1 { color: var(--cream); font-size: 28px; line-height: 1.25; margin: 0 0 10px; max-width: 480px; font-weight: 600; }
      .hero-sub { color: #C7C3D4; font-size: 14px; line-height: 1.5; max-width: 420px; margin: 0; }

      .category-bar {
        display: flex; gap: 8px; overflow-x: auto; padding: 14px 20px; max-width: 1100px; margin: 0 auto;
        scrollbar-width: none;
      }
      .category-bar::-webkit-scrollbar { display: none; }
      .category-chip {
        flex-shrink: 0; padding: 7px 16px; border-radius: 999px; border: 1px solid var(--border);
        background: var(--card); font-size: 13px; color: var(--ink-soft); font-weight: 500;
        transition: all 0.15s;
      }
      .category-chip.active { background: var(--navy); color: var(--gold-light); border-color: var(--navy); }

      .catalog { max-width: 1100px; margin: 0 auto; padding: 4px 20px 60px; }
      .product-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
      }
      @media (min-width: 640px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 900px) { .product-grid { grid-template-columns: repeat(4, 1fr); } }

      .product-card {
        background: var(--card); border-radius: 14px; overflow: hidden; border: 1px solid var(--border);
        display: flex; flex-direction: column;
      }
      .product-img-wrap {
        position: relative; aspect-ratio: 1; background: #F1ECE0;
        display: flex; align-items: center; justify-content: center; overflow: hidden;
      }
      .product-img { width: 100%; height: 100%; object-fit: cover; }
      .product-img-placeholder { color: #C9BFA0; }
      .sold-strip {
        position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15,22,41,0.85);
        color: #fff; font-size: 11px; text-align: center; padding: 4px 0; font-weight: 600; letter-spacing: 0.4px;
      }
      .seal-badge {
        position: absolute; top: 8px; left: 8px; width: 34px; height: 34px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, var(--gold-light), var(--gold) 60%, #9d7a3c 100%);
        display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.25);
      }
      .seal-badge-no { font-size: 9px; font-weight: 800; color: var(--navy); letter-spacing: 0.2px; }

      .product-body { padding: 10px 12px 12px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .product-cat { font-size: 10px; color: var(--ink-soft); letter-spacing: 0.6px; text-transform: uppercase; margin: 0; }
      .product-name {
        font-size: 13.5px; font-weight: 600; margin: 0; color: var(--ink);
        font-family: inherit; line-height: 1.3;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        min-height: 34px;
      }
      .product-row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
      .product-price { font-size: 15px; font-weight: 700; color: var(--maroon); }
      .add-btn {
        background: var(--navy); color: var(--gold-light); font-size: 12px; font-weight: 600;
        padding: 7px 14px; border-radius: 8px;
      }
      .add-btn:disabled { background: #D8D2C0; color: #8A8474; cursor: not-allowed; }
      .add-btn:not(:disabled):hover { background: #1a2540; }

      .qty-stepper {
        display: flex; align-items: center; gap: 8px; background: #F1ECE0; border-radius: 8px; padding: 4px 6px;
      }
      .qty-stepper button { color: var(--navy); display: flex; padding: 2px; }
      .qty-stepper span { font-size: 13px; font-weight: 600; min-width: 16px; text-align: center; }
      .qty-stepper.small { padding: 3px 5px; gap: 6px; }

      .empty-state {
        display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 20px;
        color: var(--ink-soft); text-align: center;
      }
      .empty-state p { font-weight: 600; color: var(--ink); margin: 0; }
      .empty-state span { font-size: 13px; }

      .shop-footer {
        background: var(--navy); color: #B9B5C6; text-align: center; padding: 26px 20px 30px;
        font-size: 12.5px; line-height: 1.7;
      }
      .shop-footer p { margin: 0; }
      .admin-link {
        display: inline-flex; align-items: center; gap: 5px; margin-top: 14px; color: #7C7891;
        font-size: 11px; letter-spacing: 0.3px;
      }
      .admin-link:hover { color: var(--gold-light); }

      .drawer-scrim {
        position: fixed; inset: 0; background: rgba(15,22,41,0.45); opacity: 0; pointer-events: none;
        transition: opacity 0.25s; z-index: 40;
      }
      .drawer-scrim.open { opacity: 1; pointer-events: auto; }
      .cart-drawer {
        position: fixed; top: 0; right: 0; height: 100%; width: min(380px, 100%); background: var(--cream);
        transform: translateX(100%); transition: transform 0.3s ease; z-index: 41; display: flex; flex-direction: column;
        box-shadow: -8px 0 24px rgba(0,0,0,0.15);
      }
      .cart-drawer.open { transform: translateX(0); }
      .cart-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 18px 14px; border-bottom: 1px solid var(--border); }
      .cart-header h2 { font-size: 19px; margin: 0; }
      .icon-btn { color: var(--ink); padding: 6px; border-radius: 8px; display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; }
      .icon-btn:hover { background: rgba(0,0,0,0.05); }
      .icon-btn.danger { color: var(--maroon); }

      .cart-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 60px 24px; color: var(--ink-soft); text-align: center; }
      .cart-empty p { font-weight: 600; color: var(--ink); margin: 4px 0 0; }
      .cart-empty span { font-size: 13px; }

      .cart-lines { flex: 1; overflow-y: auto; padding: 8px 18px; }
      .cart-line { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
      .cart-line-img { width: 52px; height: 52px; border-radius: 10px; background: #F1ECE0; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #C9BFA0; }
      .cart-line-img img { width: 100%; height: 100%; object-fit: cover; }
      .cart-line-info { flex: 1; min-width: 0; }
      .cart-line-name { font-size: 13px; font-weight: 600; margin: 0; }
      .cart-line-no { font-size: 11px; color: var(--ink-soft); margin: 2px 0 6px; }
      .cart-line-bottom { display: flex; align-items: center; justify-content: space-between; }
      .cart-line-price { font-size: 13px; font-weight: 700; color: var(--maroon); }
      .cart-line-remove { color: var(--ink-soft); padding: 4px; }
      .cart-line-remove:hover { color: var(--maroon); }

      .cart-footer { padding: 14px 18px 20px; border-top: 1px solid var(--border); }
      .cart-total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; margin-bottom: 6px; }
      .cart-total-amount { color: var(--maroon); }
      .cart-note { font-size: 11.5px; color: var(--ink-soft); margin: 0 0 12px; line-height: 1.4; }
      .checkout-btn { width: 100%; background: var(--navy); color: var(--gold-light); padding: 13px; border-radius: 10px; font-weight: 700; font-size: 14px; }
      .checkout-btn:hover { background: #1a2540; }

      .modal-scrim {
        position: fixed; inset: 0; background: rgba(15,22,41,0.5); z-index: 50;
        display: flex; align-items: flex-end; justify-content: center;
      }
      @media (min-width: 640px) { .modal-scrim { align-items: center; } }
      .modal {
        background: var(--cream); border-radius: 18px 18px 0 0; width: 100%; max-width: 460px;
        max-height: 90vh; overflow-y: auto; padding: 20px 20px 24px;
      }
      @media (min-width: 640px) { .modal { border-radius: 18px; } }
      .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .modal-header h2 { font-size: 19px; margin: 0; }

      .checkout-summary { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; }
      .checkout-summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: var(--ink-soft); }
      .checkout-summary-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border); }

      .form-grid { display: flex; flex-direction: column; gap: 12px; }
      .form-grid label { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 600; color: var(--ink-soft); }
      .form-grid input, .form-grid textarea, .form-grid select {
        border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; font-size: 14px; color: var(--ink); background: #fff;
        resize: none;
      }
      .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .field-error { color: var(--maroon); font-weight: 500; font-size: 11.5px; }
      .checkbox-row { flex-direction: row !important; align-items: center; gap: 8px !important; }
      .checkbox-row input { width: 16px; height: 16px; }

      .checkout-note { font-size: 12px; color: var(--ink-soft); line-height: 1.5; margin: 14px 0; }
      .checkout-actions { display: flex; flex-direction: column; gap: 10px; }
      .checkout-action {
        display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: 10px;
        font-weight: 700; font-size: 14px;
      }
      .checkout-action.whatsapp { background: #1F7A52; color: #fff; }
      .checkout-action.whatsapp:hover { background: #19623F; }
      .checkout-action.email { background: var(--navy); color: var(--gold-light); }
      .checkout-action.email:hover { background: #1a2540; }

      .admin-login-screen, .admin-screen { max-width: 760px; margin: 0 auto; padding: 24px 20px 60px; min-height: 100vh; }
      .back-link { display: inline-flex; align-items: center; gap: 4px; color: var(--ink-soft); font-size: 13px; font-weight: 600; margin-bottom: 18px; }
      .back-link:hover { color: var(--ink); }
      .admin-login-box {
        background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px 24px;
        display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; max-width: 320px; margin: 40px auto 0;
        color: var(--navy);
      }
      .admin-login-box h2 { margin: 8px 0 0; font-size: 19px; }
      .admin-login-box p { font-size: 13px; color: var(--ink-soft); margin: 0 0 14px; }
      .admin-login-box form { display: flex; flex-direction: column; gap: 8px; width: 100%; }
      .admin-login-box input { border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; font-size: 14px; text-align: center; }
      .admin-login-btn { background: var(--navy); color: var(--gold-light); padding: 11px; border-radius: 9px; font-weight: 700; font-size: 13.5px; margin-top: 4px; }

      .admin-topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
      .admin-topbar h2 { font-size: 21px; margin: 0; flex: 1; }
      .admin-topbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .admin-add-btn { display: flex; align-items: center; gap: 6px; background: var(--navy); color: var(--gold-light); padding: 9px 16px; border-radius: 9px; font-weight: 600; font-size: 13px; }
      .admin-add-btn:hover { background: #1a2540; }
      .admin-quickadd-btn { display: flex; align-items: center; gap: 6px; background: var(--card); border: 1px solid var(--gold); color: var(--maroon); padding: 9px 16px; border-radius: 9px; font-weight: 600; font-size: 13px; }
      .admin-quickadd-btn:hover { background: #FBF4E6; }
      .admin-quickadd-btn.solid { background: var(--maroon); border-color: var(--maroon); color: #fff; padding: 11px 22px; margin-top: 6px; }
      .admin-quickadd-btn.solid:hover { background: #551019; }
      .saving-indicator { font-size: 12px; color: var(--ink-soft); margin: -8px 0 12px; }

      .admin-empty { background: var(--card); border: 1px dashed var(--border); border-radius: 14px; padding: 40px 20px; text-align: center; color: var(--ink-soft); font-size: 13.5px; }

      .admin-table { display: flex; flex-direction: column; gap: 8px; }
      .admin-row {
        display: flex; align-items: center; gap: 12px; background: var(--card); border: 1px solid var(--border);
        border-radius: 12px; padding: 10px 12px; flex-wrap: wrap;
      }
      .admin-row-img { width: 44px; height: 44px; border-radius: 8px; background: #F1ECE0; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #C9BFA0; }
      .admin-row-img img { width: 100%; height: 100%; object-fit: cover; }
      .admin-row-info { flex: 1; min-width: 140px; }
      .admin-row-name { font-size: 13.5px; font-weight: 600; margin: 0; }
      .admin-row-meta { font-size: 11.5px; color: var(--ink-soft); margin: 2px 0 0; }
      .stock-toggle { font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 999px; }
      .stock-toggle.in { background: #E3F0E8; color: #1F7A52; }
      .stock-toggle.out { background: #F3E3E3; color: var(--maroon); }

      .product-form-modal .image-upload-row { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
      .image-upload-preview {
        width: 64px; height: 64px; border-radius: 10px; background: #F1ECE0; display: flex; align-items: center;
        justify-content: center; overflow: hidden; cursor: pointer; color: #C9BFA0; flex-shrink: 0;
      }
      .image-upload-preview img { width: 100%; height: 100%; object-fit: cover; }
      .upload-btn { background: #F1ECE0; color: var(--navy); padding: 8px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; }
      .upload-btn:hover { background: #E8E2D4; }

      .form-actions { display: flex; gap: 10px; margin-top: 6px; }
      .cancel-btn { flex: 1; padding: 11px; border-radius: 9px; border: 1px solid var(--border); font-weight: 600; font-size: 13.5px; color: var(--ink-soft); }
      .save-btn { flex: 1; padding: 11px; border-radius: 9px; background: var(--navy); color: var(--gold-light); font-weight: 700; font-size: 13.5px; }
      .save-btn:hover { background: #1a2540; }

      .quickadd-modal { max-width: 480px; }
      .quickadd-intro { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 20px 10px 10px; color: var(--navy); }
      .quickadd-intro p { font-size: 13.5px; color: var(--ink-soft); max-width: 320px; margin: 0; line-height: 1.5; }
      .quickadd-progress { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
      .quickadd-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border); }
      .quickadd-dot.current { background: var(--maroon); width: 9px; height: 9px; }
      .quickadd-dot.done { background: var(--gold); }
      .quickadd-body { display: flex; flex-direction: column; gap: 14px; }
      .quickadd-image { width: 100%; aspect-ratio: 1.4; border-radius: 12px; overflow: hidden; background: #F1ECE0; max-height: 220px; }
      .quickadd-image img { width: 100%; height: 100%; object-fit: contain; }
      .quickadd-form { gap: 10px; }
      .quickadd-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
      .quickadd-skip { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; padding: 6px; align-self: center; }
      .quickadd-skip:hover { color: var(--maroon); }
      .quickadd-actions .save-btn { padding: 13px; font-size: 14px; }
      .quickadd-actions .save-btn:disabled { background: #D8D2C0; color: #8A8474; cursor: not-allowed; }

      @media (prefers-reduced-motion: reduce) {
        .cart-drawer, .drawer-scrim, .category-chip { transition: none !important; }
      }
    `}</style>
  );
}
