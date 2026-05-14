"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { updateBankAccount, unlinkBudgetFromBank } from "./actions";

interface BudgetAccount {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  nickname: string;
  bank_code: string;
  account_number: string;
}

interface Props {
  bank: BankAccount;
  /** All non-archived budget accounts the user owns */
  budgetAccounts: BudgetAccount[];
  /** IDs of budget_accounts currently linked to this bank */
  linkedBudgetIds: string[];
}

export function EditBankDialog({ bank, budgetAccounts, linkedBudgetIds }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const linkedSet = new Set(linkedBudgetIds);
  const unlinked = budgetAccounts.filter((b) => !linkedSet.has(b.id));
  const linked = budgetAccounts.filter((b) => linkedSet.has(b.id));

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateBankAccount(formData);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleUnlink(budgetId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await unlinkBudgetFromBank(bank.id, budgetId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary-light"
        size="sm"
        onClick={() => setOpen(true)}
      >
        แก้ไข
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="แก้ไขบัญชีธนาคาร"
        description={`${bank.bank_code} · ${bank.account_number}`}
      >
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="id" value={bank.id} />

          <div className="space-y-2">
            <Label htmlFor="nickname">ชื่ออ้างอิง</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={bank.nickname}
              required
              autoFocus
            />
          </div>

          {linked.length > 0 && (
            <div className="space-y-2">
              <p className="caption-sm uppercase tracking-[0.5px] text-mute-light">
                ผูกอยู่กับบัญชี
              </p>
              <div className="flex flex-wrap gap-2">
                {linked.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleUnlink(b.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-hairline-light bg-tint-mint text-tint-mint-fg px-3 py-1 text-[13px] font-medium hover:brightness-95"
                  >
                    <span>{b.name}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {unlinked.length > 0 && (
            <div className="space-y-2">
              <p className="caption-sm uppercase tracking-[0.5px] text-mute-light">
                เพิ่มบัญชีให้ผูก (เลือกได้หลายอัน)
              </p>
              <div className="rounded-md border-[1.5px] border-hairline-light bg-canvas-light divide-y-[1.5px] divide-hairline-light max-h-48 overflow-y-auto">
                {unlinked.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-soft"
                  >
                    <input
                      type="checkbox"
                      name="link_budget_account_ids"
                      value={b.id}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-[14px] text-ink">{b.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {unlinked.length === 0 && linked.length === budgetAccounts.length && (
            <p className="caption-md text-mute-light">
              ผูกครบทุกบัญชีแล้ว
            </p>
          )}

          {error && (
            <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-coral text-tint-coral-fg px-3 py-2 text-[12px]">
              {error}
            </div>
          )}

          <footer className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary-light"
              size="md"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={pending}>
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </footer>
        </form>
      </Modal>
    </>
  );
}
