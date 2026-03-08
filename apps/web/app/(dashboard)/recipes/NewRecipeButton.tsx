"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RecipeForm } from "./RecipeForm";

export function NewRecipeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Recipe
      </Button>
      <RecipeForm open={open} onOpenChange={setOpen} />
    </>
  );
}
