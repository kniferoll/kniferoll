import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useKitchenStore } from "@/stores/kitchenStore";
import { supabase, getDeviceToken } from "@/lib/supabase";
import type { KitchenUnit } from "@kniferoll/types";

interface UnitPickerModalProps {
  onClose: () => void;
  onUnitSelected: (unit: KitchenUnit) => void;
}

const CATEGORIES = ["pan", "container", "weight", "volume", "count", "other"];

export function UnitPickerModal({
  onClose,
  onUnitSelected,
}: UnitPickerModalProps) {
  const { currentKitchen } = useKitchenStore();
  const [allUnits, setAllUnits] = useState<KitchenUnit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitCategory, setNewUnitCategory] = useState<string>("other");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!currentKitchen?.id) return;

      try {
        const { data, error } = await supabase
          .from("kitchen_units")
          .select("*")
          .eq("kitchen_id", currentKitchen.id)
          .order("category", { ascending: true })
          .order("use_count", { ascending: false });

        if (error) {
          console.error("Error fetching units:", error);
        } else {
          setAllUnits(data || []);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [currentKitchen?.id]);

  const filteredUnits = allUnits.filter(
    (unit) =>
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.display_name &&
        unit.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const unitsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredUnits.filter((u) => u.category === category);
    return acc;
  }, {} as Record<string, KitchenUnit[]>);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !currentKitchen?.id || isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from("kitchen_units")
        .insert({
          kitchen_id: currentKitchen.id,
          name: newUnitName.trim(),
          category: newUnitCategory,
          created_by: getDeviceToken(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating unit:", error);
      } else if (data) {
        setAllUnits((prev) => [...prev, data]);
        setNewUnitName("");
        setShowCreateForm(false);
        onUnitSelected(data);
      }
    } catch (error) {
      console.error("Error creating unit:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-gray-500/50 dark:bg-slate-950/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-gray-600 dark:text-slate-400">Loading units...</p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-gray-500/50 dark:bg-slate-950/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
            Select Unit
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b dark:border-slate-700">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {showCreateForm ? (
            <form onSubmit={handleCreateUnit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Unit Name
                </label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g., 'red cambro'"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newUnitCategory}
                  onChange={(e) => setNewUnitCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newUnitName.trim() || isCreating}
                  className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUnitName("");
                  }}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-50 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {CATEGORIES.map((category) => {
                const categoryUnits = unitsByCategory[category];
                if (categoryUnits.length === 0) return null;

                return (
                  <div
                    key={category}
                    className="p-4 border-b dark:border-slate-700 last:border-b-0"
                  >
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {categoryUnits.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => onUnitSelected(unit)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-slate-50">
                            {unit.name}
                          </div>
                          {unit.display_name && (
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              {unit.display_name}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredUnits.length === 0 && searchQuery && (
                <div className="p-4 text-center text-gray-500 dark:text-slate-400">
                  No units found. Create a new one?
                </div>
              )}
            </>
          )}
        </div>

        {!showCreateForm && (
          <div className="p-4 border-t dark:border-slate-700">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setNewUnitName(searchQuery);
                setNewUnitCategory("other");
              }}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-50 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              + Create New Unit
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
