"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { updateBankAccount } from "./actions";

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
            <Label htmlFor={`bank-nick-${bank.id}`}>ชื่ออ้างอิง</Label>
            <Input
              id={`bank-nick-${bank.id}`}
              name="nickname"
              defaultValue={bank.nickname}
              required
              autoFocus
            />
          </div>

          {budgetAccounts.length === 0 ? (
            <p className="caption-md text-mute-light">
              ยังไม่มีบัญชีไว้ผูก — สร้างบัญชีใน "บัญชี" ก่อน
            </p>
          ) : (
            <div className="space-y-2">
              <p className="caption-sm uppercase tracking-[0.5px] text-mute-light">
                ผูกกับบัญชี (เลือก = ผูก, ไม่เลือก = ปลดผูก)
              </p>
              <div className="rounded-md border-[1.5px] border-hairline-light bg-canvas-light divide-y-[1.5px] divide-hairline-light max-h-56 overflow-y-auto">
                {budgetAccounts.map((b) => {
                  const checked = linkedSet.has(b.id);
                  return (
                    <label
                      key={b.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-soft"
                    >
                      <input
                        type="checkbox"
                        name="link_budget_account_ids"
                        value={b.id}
                        defaultChecked={checked}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-[14px] text-ink flex-1">{b.name}</span>
                      {checked && (
                        <span className="caption-sm text-tint-mint-fg">
                          ผูกอยู่
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
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
