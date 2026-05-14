"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { formatTHB } from "@/lib/utils";
import {
  createIncomeForMonth,
  updateIncome,
  deleteIncomeById,
} from "./actions";

export interface IncomeRow {
  id: string;
  amount: number;
  received_date: string;
  source: string;
  note: string;
}

interface Props {
  periodMonth: string; // YYYY-MM-01
  incomes: IncomeRow[];
  totalIncome: number;
}

export function IncomePopup({ periodMonth, incomes, totalIncome }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = incomes.filter((i) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      String(i.amount).includes(q) ||
      (i.source ?? "").toLowerCase().includes(q) ||
      (i.note ?? "").toLowerCase().includes(q) ||
      i.received_date.includes(q)
    );
  });

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createIncomeForMonth({
          period_month: periodMonth,
          amount: Number(formData.get("amount") ?? 0),
          received_date: String(formData.get("received_date") ?? ""),
          source: String(formData.get("source") ?? "") || null,
          note: String(formData.get("note") ?? "") || null,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    const id = String(formData.get("id") ?? "");
    startTransition(async () => {
      try {
        await updateIncome({
          id,
          amount: Number(formData.get("amount") ?? 0),
          received_date: String(formData.get("received_date") ?? ""),
          source: String(formData.get("source") ?? "") || null,
          note: String(formData.get("note") ?? "") || null,
        });
        setEditingId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("ลบรายรับนี้?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteIncomeById(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  const today = periodMonth.slice(0, 10); // default add-date = first of selected month

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={() => setOpen(true)}
      >
        จัดการรายรับ ({incomes.length})
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="รายรับของเดือน"
        description={`รวม ${formatTHB(totalIncome)} · ${incomes.length} รายการ`}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Add form */}
          <section className="rounded-md border-[1.5px] border-hairline-light bg-canvas-light p-3">
            <p className="caption-sm uppercase tracking-[0.5px] text-mute-light mb-2">
              เพิ่มรายรับใหม่
            </p>
            <form action={handleAdd} className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="add-date">วันที่</Label>
                <Input
                  id="add-date"
                  name="received_date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-amount">จำนวน</Label>
                <Input
                  id="add-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="add-source">แหล่งที่มา</Label>
                <Input
                  id="add-source"
                  name="source"
                  placeholder="เช่น เงินเดือน, โบนัส"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="add-note">หมายเหตุ</Label>
                <Input id="add-note" name="note" />
              </div>
              <div className="col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={pending}
                >
                  เพิ่ม
                </Button>
              </div>
            </form>
          </section>

          {/* Search */}
          <div className="space-y-1">
            <Label htmlFor="income-search">ค้นหา</Label>
            <Input
              id="income-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="วันที่, จำนวน, แหล่งที่มา, หมายเหตุ"
            />
          </div>

          {/* List */}
          <section>
            {filtered.length === 0 ? (
              <p className="caption-md text-mute-light">
                {incomes.length === 0
                  ? "ยังไม่มีรายรับเดือนนี้"
                  : "ไม่พบรายการที่ตรงกับค้นหา"}
              </p>
            ) : (
              <ul className="rounded-md border-[1.5px] border-hairline-light divide-y-[1.5px] divide-hairline-light max-h-72 overflow-y-auto">
                {filtered.map((i) => {
                  const editing = editingId === i.id;
                  if (editing) {
                    return (
                      <li key={i.id} className="px-3 py-3 bg-tint-cream">
                        <form
                          action={handleUpdate}
                          className="grid grid-cols-2 gap-2"
                        >
                          <input type="hidden" name="id" value={i.id} />
                          <div className="space-y-1">
                            <Label htmlFor={`e-date-${i.id}`}>วันที่</Label>
                            <Input
                              id={`e-date-${i.id}`}
                              name="received_date"
                              type="date"
                              defaultValue={i.received_date}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`e-amount-${i.id}`}>จำนวน</Label>
                            <Input
                              id={`e-amount-${i.id}`}
                              name="amount"
                              type="number"
                              step="0.01"
                              min="0.01"
                              defaultValue={i.amount}
                              required
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <Label htmlFor={`e-source-${i.id}`}>
                              แหล่งที่มา
                            </Label>
                            <Input
                              id={`e-source-${i.id}`}
                              name="source"
                              defaultValue={i.source}
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <Label htmlFor={`e-note-${i.id}`}>หมายเหตุ</Label>
                            <Input
                              id={`e-note-${i.id}`}
                              name="note"
                              defaultValue={i.note}
                            />
                          </div>
                          <div className="flex gap-2 col-span-2">
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              disabled={pending}
                            >
                              บันทึก
                            </Button>
                            <Button
                              type="button"
                              variant="secondary-light"
                              size="sm"
                              onClick={() => setEditingId(null)}
                              disabled={pending}
                            >
                              ยกเลิก
                            </Button>
                          </div>
                        </form>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={i.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] tabular font-semibold text-tint-mint-fg">
                          {formatTHB(i.amount)}
                        </p>
                        <p className="caption-md text-mute-light truncate">
                          {i.received_date}
                          {i.source && ` · ${i.source}`}
                          {i.note && ` · ${i.note}`}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="secondary-light"
                          size="sm"
                          onClick={() => setEditingId(i.id)}
                          disabled={pending}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(i.id)}
                          disabled={pending}
                        >
                          ลบ
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {error && (
            <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-coral text-tint-coral-fg px-3 py-2 text-[12px]">
              {error}
            </div>
          )}

          <footer className="flex justify-end pt-1">
            <Button
              type="button"
              variant="secondary-light"
              size="md"
              onClick={() => setOpen(false)}
            >
              ปิด
            </Button>
          </footer>
        </div>
      </Modal>
    </>
  );
}
