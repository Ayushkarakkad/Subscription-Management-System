import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Product, ProductVariant } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight,
  DollarSign
} from "lucide-react";

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "CLOUD_SERVICES",
    type: "SERVICE",
    sku: "",
    salesPrice: 49.0,
    costPrice: 15.0,
    description: "",
    notes: "",
    isActive: true
  });

  const [variantForm, setVariantForm] = useState({
    name: "Capacity",
    value: "1TB",
    sku: "",
    priceExtra: 0,
    isActive: true
  });

  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const canManage = role === "ADMIN" || role === "STAFF";

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get("/products", { params });
      if (res.data?.success) setProducts(res.data.data);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
        success("Product updated successfully");
      } else {
        await api.post("/products", productForm);
        success("Product created successfully");
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      await api.post(`/products/${selectedProductId}/variants`, variantForm);
      success("Variant added to product successfully");
      setIsVariantModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to add variant");
    }
  };

  const handleDeleteVariant = async (prodId: string, varId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    try {
      await api.delete(`/products/${prodId}/variants/${varId}`);
      success("Variant deleted successfully");
      fetchProducts();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to delete variant");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedProduct(expandedProduct === id ? null : id);
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "CLOUD_SERVICES",
      type: "SERVICE",
      sku: "",
      salesPrice: 49.0,
      costPrice: 15.0,
      description: "",
      notes: "",
      isActive: true
    });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      type: p.type,
      sku: p.sku || "",
      salesPrice: p.salesPrice,
      costPrice: p.costPrice,
      description: p.description || "",
      notes: p.notes || "",
      isActive: p.isActive
    });
    setIsProductModalOpen(true);
  };

  const openAddVariant = (productId: string) => {
    setSelectedProductId(productId);
    setVariantForm({
      name: "Tier",
      value: "Pro",
      sku: "",
      priceExtra: 0,
      isActive: true
    });
    setIsVariantModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Products & Variants
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Software products, SaaS offerings, add-ons and configurable item tiers
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="relative w-full sm:w-80"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="CLOUD_SERVICES">Cloud Services</option>
            <option value="DEVELOPER_TOOLS">Developer Tools</option>
            <option value="ANALYTICS">Analytics</option>
            <option value="SECURITY">Security</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <TableSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          title="No Products Found"
          description="Create your first SaaS software product or service."
          actionText={canManage ? "Add Product" : undefined}
          onAction={openCreateProduct}
        />
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const isExpanded = expandedProduct === p.id;
            const variants = p.variants || [];

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all"
              >
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="mt-1 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-base text-slate-900">
                          {p.name}
                        </span>
                        <Badge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        {p.description || "No description provided."}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-2">
                        <span>SKU: {p.sku || "—"}</span>
                        <span>•</span>
                        <span>{variants.length} Configured Variant(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end pl-9 sm:pl-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold uppercase">
                        Base Price
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        ${Number(p.salesPrice).toFixed(2)}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAddVariant(p.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Variant
                        </button>
                        <button
                          onClick={() => openEditProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Variants Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50/75 border-t border-slate-100 p-5 pl-14">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-500" /> Product Variants
                      </h4>
                    </div>

                    {variants.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">
                        No product variants defined yet. Click '+ Variant' to add one.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {variants.map((v) => (
                          <div
                            key={v.id}
                            className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {v.name}: <span className="text-blue-600">{v.value}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                SKU: {v.sku || "N/A"}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-xs text-slate-900">
                                {v.priceExtra > 0 ? `+$${v.priceExtra}` : "Standard"}
                              </span>
                              {canManage && (
                                <button
                                  onClick={() => handleDeleteVariant(p.id, v.id)}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                                  title="Delete variant"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New SaaS Product"}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="CLOUD_SERVICES">Cloud Services</option>
                <option value="DEVELOPER_TOOLS">Developer Tools</option>
                <option value="ANALYTICS">Analytics</option>
                <option value="SECURITY">Security</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SKU / Identifier
              </label>
              <input
                type="text"
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm({ ...productForm, sku: e.target.value })
                }
                placeholder="PROD-01"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sales Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={productForm.salesPrice}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    salesPrice: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.costPrice}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    costPrice: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title="Add Product Variant"
      >
        <form onSubmit={handleVariantSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variant Name *
              </label>
              <input
                type="text"
                required
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, name: e.target.value })
                }
                placeholder="e.g. Storage, Seats"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variant Value *
              </label>
              <input
                type="text"
                required
                value={variantForm.value}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, value: e.target.value })
                }
                placeholder="e.g. 100GB, 10 Users"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={variantForm.priceExtra}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    priceExtra: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variant SKU
              </label>
              <input
                type="text"
                value={variantForm.sku}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, sku: e.target.value })
                }
                placeholder="e.g. VAR-100GB"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVariantModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
            >
              Add Variant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export default ProductManagement;
