"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { renameBudgetAccount } from "./actions";

interface Props {
  account: { id: string; name: string };
}

export function EditBudgetDialog({ account }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await renameBudgetAccount(formData);
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
        title="แก้ไขชื่อบัญชี"
      >
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="id" value={account.id} />

          <div className="space-y-2">
            <Label htmlFor={`edit-name-${account.id}`}>ชื่อบัญชี</Label>
            <Input
              id={`edit-name-${account.id}`}
              name="name"
              defaultValue={account.name}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-coral text-tint-coral-fg px-3 py-2 text-[12px]">
              {error}
            </div>
          )}

          <footer className="flex justify-end gap-2">
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
