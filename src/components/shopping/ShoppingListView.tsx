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
  const { user } = useAuth();

  useEffect(() => { 
    console.log('🛒 ShoppingListView mounted, user:', user?.id);
    loadLists(); 
  }, [user?.id]);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      console.log('📡 Завантаження списків покупок...');
      console.log('🔑 userId:', api.getUserId());
      console.log('🎫 token:', api.getToken()?.substring(0, 20) + '...');
      
      const response = await api.getShoppingLists();
      console.log('📦 Відповідь сервера:', response);
      
      if (response.success && response.lists) {
        console.log(`✅ Отримано ${response.lists.length} списків`);
        const parsedLists = response.lists.map((l: any) => ({
          id: l.id,
          name: l.name,
          items: l.items || [],
          reminderDate: l.reminderDate ? new Date(l.reminderDate) : undefined,
          reminderLeadMinutes: l.reminderLeadMinutes || 30,
          createdAt: new Date(l.createdAt),
          serverId: l.id,
          completedCount: (l.items || []).filter((i: any) => i.isCompleted || i.isChecked).length,
          totalCount: (l.items || []).length,
        }));
        setLists(parsedLists);
        console.log('📋 Парсовані списки:', parsedLists);
      } else {
        console.log('⚠️ Немає списків або помилка:', response);
        setLists([]);
      }
    } catch (error) {
      console.error('❌ Помилка завантаження списків:', error);
      toast.error('Помилка завантаження списків: ' + (error as Error).message);
      setLists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddList = async (name: string, reminderDate: Date | null, reminderLeadMinutes: number) => {
    if (!name.trim()) {
      toast.error('Введіть назву списку');
      return false;
    }
    
    try {
      console.log('📝 Створення списку:', { name, reminderDate, reminderLeadMinutes });
      const response = await api.createShoppingList({
        name: name.trim(),
        reminderDate: reminderDate ? reminderDate.toISOString() : null,
        reminderLeadMinutes,
        items: []
      });
      console.log('📦 Відповідь створення:', response);
      
      if (response.success && response.list) {
        const newList: ShoppingList = {
          id: response.list.id,
          name: response.list.name,
          items: [],
          reminderDate: response.list.reminderDate ? new Date(response.list.reminderDate) : undefined,
          reminderLeadMinutes: response.list.reminderLeadMinutes || 30,
          createdAt: new Date(response.list.createdAt),
          serverId: response.list.id,
          completedCount: 0,
          totalCount: 0,
        };
        setLists([newList, ...lists]);
        toast.success(`Список "${name}" створено`);
        return true;
      } else {
        toast.error(response?.error || 'Помилка створення списку');
        return false;
      }
    } catch (error) {
      console.error('❌ Помилка створення:', error);
      toast.error('Помилка створення списку');
      return false;
    }
  };

  const handleUpdateList = async (updatedList: ShoppingList) => {
    try {
      console.log('✏️ Оновлення списку:', { id: updatedList.serverId, name: updatedList.name, itemsCount: updatedList.items.length });
      
      const updateData = {
        name: updatedList.name,
        reminderDate: updatedList.reminderDate?.toISOString() || null,
        reminderLeadMinutes: updatedList.reminderLeadMinutes,
        items: updatedList.items.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          isCompleted: i.isCompleted
        }))
      };
      
      const response = await api.updateShoppingList(updatedList.serverId || updatedList.id, updateData);
      console.log('📦 Відповідь оновлення:', response);
      
      if (response.success) {
        setLists(lists.map(l => l.id === updatedList.id ? updatedList : l));
        toast.success('Список оновлено');
      } else {
        toast.error(response?.error || 'Помилка оновлення');
      }
    } catch (error) {
      console.error('❌ Помилка оновлення:', error);
      toast.error('Помилка оновлення');
    }
  };

  const handleDeleteList = async (list: ShoppingList) => {
    if (!confirm(`Видалити список "${list.name}"?`)) return;
    try {
      console.log('🗑️ Видалення списку:', list.serverId);
      await api.deleteShoppingList(list.serverId || list.id);
      setLists(lists.filter(l => l.id !== list.id));
      toast.success('Список видалено');
    } catch (error) {
      console.error('❌ Помилка видалення:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Списки покупок</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          + Новий список
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-xl">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-muted-foreground">Немає списків</p>
          <p className="text-sm text-muted-foreground mt-1">Натисніть + щоб створити список покупок</p>
          <p className="text-xs text-muted-foreground mt-4">Списки синхронізуються з вашим акаунтом</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map(list => (
            <div
              key={list.id}
              className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setSelectedList(list)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{list.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {list.completedCount}/{list.totalCount} виконано
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteList(list); }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  🗑️
                </button>
              </div>
              {list.totalCount > 0 && (
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(list.completedCount / list.totalCount) * 100}%` }}
                  />
                </div>
              )}
              {list.reminderDate && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>🔔</span>
                  <span>{format(list.reminderDate, 'dd MMM, HH:mm', { locale: uk })}</span>
                </div>
              )}
              {list.items.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground truncate">
                  {list.items.slice(0, 3).map(i => i.name).join(', ')}
                  {list.items.length > 3 && '...'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddListModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddList}
        />
      )}

      {selectedList && (
        <ListDetailModal
          list={selectedList}
          onClose={() => setSelectedList(null)}
          onUpdate={handleUpdateList}
        />
      )}
    </div>
  );
};

const AddListModal: React.FC<{ onClose: () => void; onSave: (name: string, date: Date | null, minutes: number) => Promise<boolean> }> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Введіть назву списку');
      return;
    }
    setIsSaving(true);
    const success = await onSave(name, hasReminder ? reminderDate : null, reminderMinutes);
    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">Новий список покупок</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Назва списку</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Продукти, Техніка, Подарунки..."
              autoFocus
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={(e) => setHasReminder(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Встановити нагадування</span>
            </label>
          </div>
          {hasReminder && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Дата і час</label>
                <input
                  type="datetime-local"
                  value={reminderDate.toISOString().slice(0, 16)}
                  onChange={(e) => setReminderDate(new Date(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Нагадати</label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={0}>Одразу</option>
                  <option value={5}>за 5 хвилин</option>
                  <option value={15}>за 15 хвилин</option>
                  <option value={30}>за 30 хвилин</option>
                  <option value={60}>за 1 годину</option>
                  <option value={120}>за 2 години</option>
                  <option value={1440}>за 1 день</option>
                </select>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListDetailModal: React.FC<{ list: ShoppingList; onClose: () => void; onUpdate: (list: ShoppingList) => void }> = ({ list, onClose, onUpdate }) => {
  const [items, setItems] = useState<ShoppingItem[]>(list.items);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');

  const handleToggle = (item: ShoppingItem) => {
    const updated = items.map(i => i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i);
    setItems(updated);
    onUpdate({ ...list, items: updated, completedCount: updated.filter(i => i.isCompleted).length });
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newItem: ShoppingItem = { id: Date.now().toString(), name: newName.trim(), quantity: newQty.trim(), isCompleted: false };
    const updated = [...items, newItem];
    setItems(updated);
    setNewName('');
    setNewQty('');
    onUpdate({ ...list, items: updated, completedCount: updated.filter(i => i.isCompleted).length, totalCount: updated.length });
  };

  const handleDelete = (item: ShoppingItem) => {
    const updated = items.filter(i => i.id !== item.id);
    setItems(updated);
    onUpdate({ ...list, items: updated, completedCount: updated.filter(i => i.isCompleted).length, totalCount: updated.length });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newName.trim()) handleAdd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">{list.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{items.filter(i => i.isCompleted).length}/{items.length} виконано</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">✕</button>
        </div>
        {items.length > 0 && (
          <div className="px-5 pt-4">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${items.length ? (items.filter(i => i.isCompleted).length / items.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-3">📝</div>
              <p>Список порожній</p>
              <p className="text-sm mt-1">Додайте перший товар</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group">
                <button onClick={() => handleToggle(item)} className="flex-shrink-0 text-xl">
                  {item.isCompleted ? '✅' : '◻️'}
                </button>
                <div className="flex-1">
                  <p className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>{item.name}</p>
                  {item.quantity && <p className="text-xs text-muted-foreground">{item.quantity}</p>}
                </div>
                <button onClick={() => handleDelete(item)} className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
        <div className="p-5 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Назва товару"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Кількість"
              className="w-24 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Додати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
