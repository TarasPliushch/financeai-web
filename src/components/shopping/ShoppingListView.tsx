// src/components/shopping/ShoppingListView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingList, ShoppingItem } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export const ShoppingListView: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const response = await api.getShoppingLists();
      if (response.success && response.lists) {
        const parsedLists = response.lists.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          reminderDate: l.reminderDate ? new Date(l.reminderDate) : undefined,
          completedCount: l.items?.filter((i: any) => i.isCompleted).length || 0,
          totalCount: l.items?.length || 0,
        }));
        setLists(parsedLists);
      }
    } catch (error) {
      toast.error('Помилка завантаження списків');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (list: ShoppingList) => {
    if (!confirm(`Видалити список "${list.name}"?`)) return;
    try {
      await api.deleteShoppingList(list.serverId || list.id);
      setLists(lists.filter(l => l.id !== list.id));
      toast.success('Список видалено');
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Списки покупок</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity"
        >
          <span className="text-xl">+</span>
          Новий список
        </button>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-muted-foreground">Немає списків</p>
          <p className="text-sm text-muted-foreground">Натисніть + щоб створити список покупок</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map(list => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onPress={() => setSelectedList(list)}
              onDelete={() => handleDelete(list)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddShoppingListModal
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              const response = await api.createShoppingList(data);
              if (response.success && response.list) {
                const newList = {
                  ...response.list,
                  createdAt: new Date(response.list.createdAt),
                  reminderDate: response.list.reminderDate ? new Date(response.list.reminderDate) : undefined,
                  completedCount: 0,
                  totalCount: 0,
                  items: [],
                };
                setLists([...lists, newList]);
                toast.success('Список створено');
                setShowAddModal(false);
              }
            } catch (error) {
              toast.error('Помилка створення');
            }
          }}
        />
      )}

      {/* Shopping List Detail Modal */}
      {selectedList && (
        <ShoppingListDetailModal
          list={selectedList}
          onClose={() => setSelectedList(null)}
          onUpdate={(updatedList) => {
            setLists(lists.map(l => l.id === updatedList.id ? updatedList : l));
          }}
        />
      )}
    </div>
  );
};

// ShoppingListCard Component
interface ShoppingListCardProps {
  list: ShoppingList;
  onPress: () => void;
  onDelete: () => void;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({ list, onPress, onDelete }) => {
  const progress = list.totalCount > 0 ? (list.completedCount / list.totalCount) * 100 : 0;
  const isComplete = list.completedCount === list.totalCount && list.totalCount > 0;

  return (
    <div
      onClick={onPress}
      className="p-4 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <div>
            <h3 className="font-semibold">{list.name}</h3>
            <p className="text-xs text-muted-foreground">
              {list.completedCount}/{list.totalCount} виконано
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          🗑️
        </button>
      </div>

      {/* Progress Bar */}
      {list.totalCount > 0 && (
        <div className="space-y-1">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reminder */}
      {list.reminderDate && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <span>🔔</span>
          <span>Нагадування: {format(list.reminderDate, 'dd MMM, HH:mm', { locale: uk })}</span>
        </div>
      )}

      {/* Preview Items */}
      {list.items.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground truncate">
          {list.items.slice(0, 3).map(i => i.name).join(', ')}
          {list.items.length > 3 && '...'}
        </div>
      )}
    </div>
  );
};

// AddShoppingListModal Component
interface AddShoppingListModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const AddShoppingListModal: React.FC<AddShoppingListModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm'));
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const leadOptions = [
    { value: 0, label: 'Одразу' },
    { value: 5, label: 'за 5 хв' },
    { value: 15, label: 'за 15 хв' },
    { value: 30, label: 'за 30 хв' },
    { value: 60, label: 'за 1 год' },
    { value: 120, label: 'за 2 год' },
    { value: 1440, label: 'за 1 день' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Введіть назву списку');
      return;
    }
    setIsLoading(true);
    await onSave({
      name,
      reminderDate: hasReminder ? new Date(reminderDate).toISOString() : null,
      reminderLeadMinutes,
      items: [],
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Новий список покупок</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва списку</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Продукти, Техніка, Подарунки..."
              required
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={(e) => setHasReminder(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Встановити нагадування</span>
            </label>
          </div>

          {hasReminder && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Дата і час</label>
                <input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Нагадати</label>
                <select
                  value={reminderLeadMinutes}
                  onChange={(e) => setReminderLeadMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {leadOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ShoppingListDetailModal Component
interface ShoppingListDetailModalProps {
  list: ShoppingList;
  onClose: () => void;
  onUpdate: (updatedList: ShoppingList) => void;
}

const ShoppingListDetailModal: React.FC<ShoppingListDetailModalProps> = ({ list, onClose, onUpdate }) => {
  const [items, setItems] = useState<ShoppingItem[]>(list.items || []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const handleToggleItem = async (item: ShoppingItem) => {
    const updatedItems = items.map(i =>
      i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i
    );
    setItems(updatedItems);
    await saveList(updatedItems);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      quantity: newItemQuantity.trim(),
      isCompleted: false,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setNewItemName('');
    setNewItemQuantity('');
    await saveList(updatedItems);
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    const updatedItems = items.filter(i => i.id !== item.id);
    setItems(updatedItems);
    await saveList(updatedItems);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    const updatedItems = items.map(i =>
      i.id === editingItem.id ? editingItem : i
    );
    setItems(updatedItems);
    setEditingItem(null);
    await saveList(updatedItems);
  };

  const saveList = async (newItems: ShoppingItem[]) => {
    setIsSaving(true);
    try {
      const updatedList = { ...list, items: newItems };
      await api.updateShoppingList(list.serverId || list.id, {
        name: list.name,
        items: newItems.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          isCompleted: i.isCompleted,
        })),
        reminderDate: list.reminderDate?.toISOString(),
        reminderLeadMinutes: list.reminderLeadMinutes,
      });
      onUpdate({
        ...updatedList,
        completedCount: newItems.filter(i => i.isCompleted).length,
        totalCount: newItems.length,
      });
    } catch (error) {
      toast.error('Помилка збереження');
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = items.filter(i => i.isCompleted).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">{list.name}</h2>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{items.length} виконано
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">✕</button>
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="px-4 pt-4">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl">📝</span>
              <p className="mt-2">Список порожній</p>
              <p className="text-sm">Додайте перший товар</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30">
                <button
                  onClick={() => handleToggleItem(item)}
                  className="flex-shrink-0"
                >
                  <span className="text-xl">
                    {item.isCompleted ? '✅' : '◻️'}
                  </span>
                </button>
                <div className="flex-1">
                  <p className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>
                    {item.name}
                  </p>
                  {item.quantity && (
                    <p className="text-xs text-muted-foreground">{item.quantity}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Item Form */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Назва товару"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <input
              type="text"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              placeholder="Кількість"
              className="w-24 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || isSaving}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              Додати
            </button>
          </div>
        </div>

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-sm rounded-2xl bg-background border border-border shadow-xl">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Редагувати товар</h3>
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Назва"
                />
                <input
                  type="text"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Кількість"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleUpdateItem}
                    className="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90"
                  >
                    Зберегти
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <div className="absolute bottom-4 right-4 bg-background rounded-full p-2 shadow-lg">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
