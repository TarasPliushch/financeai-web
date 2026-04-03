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
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);

  useEffect(() => { loadLists(); }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const response = await api.getShoppingLists();
      if (response.success && response.lists) {
        const parsedLists = response.lists.map((l: any) => ({
          id: l.id, name: l.name, items: (l.items || []).map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity || '', isCompleted: i.isChecked === true || i.isCompleted === true })),
          reminderDate: l.reminderDate ? new Date(l.reminderDate) : undefined, reminderLeadMinutes: l.reminderLeadMinutes || 30, createdAt: new Date(l.createdAt), serverId: l.id,
          completedCount: (l.items || []).filter((i: any) => i.isChecked === true || i.isCompleted === true).length, totalCount: (l.items || []).length,
        }));
        setLists(parsedLists);
      }
    } catch (error) { toast.error('Помилка завантаження'); }
    finally { setIsLoading(false); }
  };

  const handleEditList = (list: ShoppingList) => setEditingList(list);
  const handleDeleteList = async (list: ShoppingList) => { if (!confirm(`Видалити список "${list.name}"?`)) return; try { await api.deleteShoppingList(list.serverId || list.id); setLists(lists.filter(l => l.id !== list.id)); toast.success('Список видалено'); } catch (error) { toast.error('Помилка видалення'); } };

  const handleAddList = async (name: string, reminderDate: Date | null, reminderLeadMinutes: number) => {
    try { const response = await api.createShoppingList({ name: name.trim(), reminderDate: reminderDate ? reminderDate.toISOString() : null, reminderLeadMinutes }); if (response.success && response.list) { const newList = { id: response.list.id, name: response.list.name, items: [], reminderDate: response.list.reminderDate ? new Date(response.list.reminderDate) : undefined, reminderLeadMinutes: response.list.reminderLeadMinutes || 30, createdAt: new Date(response.list.createdAt), serverId: response.list.id, completedCount: 0, totalCount: 0 }; setLists([newList, ...lists]); toast.success(`Список "${name}" створено`); return true; } return false; } catch (error) { toast.error('Помилка створення'); return false; }
  };

  const handleUpdateList = async (updatedList: ShoppingList) => { try { await api.updateShoppingList(updatedList.serverId || updatedList.id, { name: updatedList.name, reminderDate: updatedList.reminderDate?.toISOString() || null, reminderLeadMinutes: updatedList.reminderLeadMinutes }); setLists(lists.map(l => l.id === updatedList.id ? updatedList : l)); toast.success('Список оновлено'); } catch (error) { toast.error('Помилка оновлення'); } };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Списки покупок</h1><button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl bg-primary text-white font-medium">+ Новий список</button></div>
      {lists.length === 0 ? (<div className="text-center py-12 bg-white/5 rounded-xl"><div className="text-6xl mb-4">🛒</div><p className="text-muted-foreground">Немає списків</p></div>) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map(list => (<div key={list.id} className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer" onClick={() => setSelectedList(list)}><div className="flex items-start justify-between"><div className="flex-1"><h3 className="font-semibold text-lg">{list.name}</h3><p className="text-sm text-muted-foreground mt-1">{list.completedCount}/{list.totalCount} виконано</p></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); handleEditList(list); }} className="p-2 rounded-lg hover:bg-white/10" title="Редагувати"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-7 7H10v-4l7-7z"/><path d="M4 20h16"/></svg></button><button onClick={(e) => { e.stopPropagation(); handleDeleteList(list); }} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400" title="Видалити"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 3h6"/></svg></button></div></div>{list.totalCount > 0 && (<div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(list.completedCount / list.totalCount) * 100}%` }} /></div>)}{list.reminderDate && (<div className="mt-2 text-xs text-muted-foreground">🔔 {format(list.reminderDate, 'dd MMM, HH:mm', { locale: uk })}</div>)}</div>))}
        </div>
      )}
      {showAddModal && <AddListModal onClose={() => setShowAddModal(false)} onSave={handleAddList} />}
      {editingList && <EditListModal list={editingList} onClose={() => setEditingList(null)} onSave={async (data) => { await api.updateShoppingList(editingList.serverId || editingList.id, data); loadLists(); setEditingList(null); }} />}
      {selectedList && <ListDetailModal list={selectedList} onClose={() => setSelectedList(null)} onUpdate={handleUpdateList} refreshLists={loadLists} />}
    </div>
  );
};

const AddListModal: React.FC<{ onClose: () => void; onSave: (name: string, date: Date | null, minutes: number) => Promise<boolean> }> = ({ onClose, onSave }) => {
  const [name, setName] = useState(''); const [hasReminder, setHasReminder] = useState(false); const [reminderDate, setReminderDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); const [reminderMinutes, setReminderMinutes] = useState(30); const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) { toast.error('Введіть назву списку'); return; } setIsSaving(true); await onSave(name, hasReminder ? reminderDate : null, reminderMinutes); setIsSaving(false); onClose(); };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-2xl bg-background border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="p-5 border-b border-white/10 flex justify-between"><h2 className="text-xl font-semibold">Новий список</h2><button onClick={onClose}>✕</button></div><form onSubmit={handleSubmit} className="p-5 space-y-4"><input type="text" placeholder="Назва списку" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5" required /><label className="flex items-center gap-2"><input type="checkbox" checked={hasReminder} onChange={(e) => setHasReminder(e.target.checked)} /><span>Встановити нагадування</span></label>{hasReminder && (<><input type="datetime-local" value={reminderDate.toISOString().slice(0, 16)} onChange={(e) => setReminderDate(new Date(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5" /><select value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5"><option value={0}>Одразу</option><option value={30}>За 30 хв</option><option value={60}>За 1 год</option><option value={120}>За 2 год</option><option value={1440}>За 1 день</option></select></>)}<div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 hover:bg-white/10">Скасувати</button><button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">{isSaving ? 'Створення...' : 'Створити'}</button></div></form></div></div>);
};

const EditListModal: React.FC<{ list: ShoppingList; onClose: () => void; onSave: (data: any) => void }> = ({ list, onClose, onSave }) => {
  const [name, setName] = useState(list.name); const [hasReminder, setHasReminder] = useState(!!list.reminderDate); const [reminderDate, setReminderDate] = useState(list.reminderDate || new Date()); const [reminderMinutes, setReminderMinutes] = useState(list.reminderLeadMinutes); const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); await onSave({ name, reminderDate: hasReminder ? reminderDate.toISOString() : null, reminderLeadMinutes: reminderMinutes }); setIsSaving(false); };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-2xl bg-background border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="p-5 border-b border-white/10 flex justify-between"><h2 className="text-xl font-semibold">Редагувати список</h2><button onClick={onClose}>✕</button></div><form onSubmit={handleSubmit} className="p-5 space-y-4"><input type="text" placeholder="Назва списку" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5" required /><label className="flex items-center gap-2"><input type="checkbox" checked={hasReminder} onChange={(e) => setHasReminder(e.target.checked)} /><span>Встановити нагадування</span></label>{hasReminder && (<><input type="datetime-local" value={reminderDate.toISOString().slice(0, 16)} onChange={(e) => setReminderDate(new Date(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5" /><select value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5"><option value={0}>Одразу</option><option value={30}>За 30 хв</option><option value={60}>За 1 год</option><option value={120}>За 2 год</option><option value={1440}>За 1 день</option></select></>)}<div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 hover:bg-white/10">Скасувати</button><button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">{isSaving ? 'Збереження...' : 'Зберегти'}</button></div></form></div></div>);
};

const ListDetailModal: React.FC<{ list: ShoppingList; onClose: () => void; onUpdate: (list: ShoppingList) => void; refreshLists: () => Promise<void> }> = ({ list, onClose, onUpdate, refreshLists }) => {
  const [items, setItems] = useState<ShoppingItem[]>(list.items); const [newName, setNewName] = useState(''); const [newQty, setNewQty] = useState('');
  const handleToggle = async (item: ShoppingItem) => { const updated = items.map(i => i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i); setItems(updated); onUpdate({ ...list, items: updated, completedCount: updated.filter(i => i.isCompleted).length }); await refreshLists(); };
  const handleDeleteItem = async (item: ShoppingItem) => { const updated = items.filter(i => i.id !== item.id); setItems(updated); onUpdate({ ...list, items: updated, completedCount: updated.filter(i => i.isCompleted).length, totalCount: updated.length }); await refreshLists(); };
  const handleAdd = async () => { if (!newName.trim()) return; const newItem = { id: Date.now().toString(), name: newName.trim(), quantity: newQty.trim(), isCompleted: false }; const updated = [...items, newItem]; setItems(updated); setNewName(''); setNewQty(''); onUpdate({ ...list, items: updated, completedCount: updated.filter(i => i.isCompleted).length, totalCount: updated.length }); await refreshLists(); };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-lg rounded-2xl bg-background border border-white/10 shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}><div className="p-5 border-b border-white/10 flex justify-between"><div><h2 className="text-xl font-semibold">{list.name}</h2><p className="text-sm text-muted-foreground mt-1">{items.filter(i => i.isCompleted).length}/{items.length} виконано</p></div><button onClick={onClose}>✕</button></div>{items.length > 0 && (<div className="px-5 pt-4"><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${items.length ? (items.filter(i => i.isCompleted).length / items.length) * 100 : 0}%` }} /></div></div>)}<div className="flex-1 overflow-y-auto p-5 space-y-2">{items.length === 0 ? (<div className="text-center py-12 text-muted-foreground"><div className="text-4xl mb-3">📝</div><p>Список порожній</p></div>) : (items.map(item => (<div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"><button onClick={() => handleToggle(item)} className="flex-shrink-0 text-xl">{item.isCompleted ? '✅' : '◻️'}</button><div className="flex-1"><p className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>{item.name}</p>{item.quantity && <p className="text-xs text-muted-foreground">{item.quantity}</p>}</div><button onClick={() => handleDeleteItem(item)} className="p-1 rounded-lg text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">🗑️</button></div>)))}</div><div className="p-5 border-t border-white/10"><div className="flex gap-2"><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Назва товару" className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5" /><input type="text" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="Кількість" className="w-24 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5" /><button onClick={handleAdd} disabled={!newName.trim()} className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">Додати</button></div></div></div></div>);
};
