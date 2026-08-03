import { useState } from 'react';
import type { AdminServiceResult } from '../lib/api';
import type { Service, ServiceInput } from '../types';
import { haptics } from '../telegram/haptics';

interface AdminServicesProps {
  services: Service[];
  onCreate: (input: ServiceInput) => Promise<AdminServiceResult>;
  onUpdate: (id: string, input: ServiceInput) => Promise<AdminServiceResult>;
  onDelete: (id: string) => Promise<AdminServiceResult>;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'Заполните все поля.',
  invalid_price: 'Цена должна быть больше нуля.',
  invalid_duration: 'Длительность должна быть больше нуля.',
  has_bookings: 'Нельзя удалить — на эту услугу уже есть записи.',
  network_error: 'Нет связи с сервером. Попробуйте ещё раз.',
};

const EMPTY_FORM: ServiceInput = { name: '', emoji: '', price: 0, durationMin: 30, description: '' };

export function AdminServices({ services, onCreate, onUpdate, onDelete }: AdminServicesProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreateForm = () => {
    haptics.selection();
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (service: Service) => {
    haptics.selection();
    setEditingId(service.id);
    setForm({
      name: service.name,
      emoji: service.emoji,
      price: service.price,
      durationMin: service.durationMin,
      description: service.description,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    const result = editingId ? await onUpdate(editingId, form) : await onCreate(form);
    setSaving(false);

    if (result.ok) {
      haptics.notification('success');
      closeForm();
    } else {
      haptics.notification('error');
      setFormError(ERROR_MESSAGES[result.error] ?? 'Не получилось сохранить.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    const result = await onDelete(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (!result.ok) {
      haptics.notification('error');
      alert(ERROR_MESSAGES[result.error] ?? 'Не получилось удалить.');
    } else {
      haptics.notification('success');
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 px-5 pb-6">
      {!formOpen && (
        <button
          type="button"
          onClick={openCreateForm}
          className="flex min-h-[44px] items-center justify-center rounded-xl border border-dashed border-border text-sm font-medium text-accent active:bg-surface-2"
        >
          + Добавить услугу
        </button>
      )}

      {formOpen && (
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-text">
            {editingId ? 'Изменить услугу' : 'Новая услуга'}
          </p>

          {formError && <p className="text-sm text-red-300">{formError}</p>}

          <div className="flex min-w-0 gap-2">
            <input
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="💇"
              className="min-h-[40px] w-14 min-w-0 shrink-0 rounded-lg border border-border bg-bg px-2 text-center text-text focus:border-accent focus:outline-none"
            />
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Название"
              className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
          </div>

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание"
            rows={2}
            className="min-h-[40px] min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />

          <div className="flex min-w-0 gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value.replace(/\D/g, '')) })}
              placeholder="Цена, ₽"
              className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              inputMode="numeric"
              value={form.durationMin || ''}
              onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value.replace(/\D/g, '')) })}
              placeholder="Мин."
              className="min-h-[40px] w-16 min-w-0 shrink-0 rounded-lg border border-border bg-bg px-2 text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-2 text-sm font-semibold text-bg disabled:opacity-60"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="flex min-h-[40px] items-center justify-center rounded-lg border border-border px-4 text-sm text-text-muted active:bg-surface-2"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {services.map((service) => (
        <div key={service.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-text">
              {service.emoji} {service.name}
            </span>
            <span className="text-sm font-semibold text-text">{service.price.toLocaleString('ru-RU')} ₽</span>
          </div>
          <p className="mt-1 text-sm text-text-muted">{service.durationMin} мин · {service.description}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => openEditForm(service)}
              className="flex min-h-[36px] flex-1 items-center justify-center rounded-xl border border-border text-xs font-medium text-text-muted active:bg-surface-2"
            >
              Изменить
            </button>
            <button
              type="button"
              disabled={deletingId === service.id}
              onClick={() => handleDelete(service.id)}
              className={`flex min-h-[36px] flex-1 items-center justify-center rounded-xl border text-xs font-medium active:bg-surface-2 disabled:opacity-50 ${
                confirmDeleteId === service.id
                  ? 'border-red-400/50 text-red-300'
                  : 'border-border text-text-muted'
              }`}
            >
              {deletingId === service.id ? 'Удаляем...' : confirmDeleteId === service.id ? 'Точно удалить?' : 'Удалить'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
