import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Tags, Plus, Edit, Trash2, Boxes } from 'lucide-react';
import api from '../api/client.js';
import { Category } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { CategoryModal } from '../components/modals/CategoryModal.js';

export const Categories: React.FC = () => {
  const { refreshKey, triggerGlobalRefresh } = useOutletContext<{
    refreshKey: number;
    triggerGlobalRefresh: () => void;
  }>();
  const { isManager } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshKey]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category '${name}'?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      triggerGlobalRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Item Categories</h1>
          <p className="text-sm text-slate-500">
            Hierarchical catalog classification and category-wise inventory grouping
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setEditingCat(null);
              setCatModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 shadow-xs transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Tags className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                </div>

                {isManager && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingCat(cat);
                        setCatModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 mt-3">{cat.description}</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                <span>Associated Catalog Items:</span>
              </span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {cat._count?.items ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {catModalOpen && (
        <CategoryModal
          isOpen={catModalOpen}
          onClose={() => setCatModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          categoryToEdit={editingCat}
        />
      )}
    </div>
  );
};

