import React, { useMemo, useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Txt, Card, Btn } from "@summer/ui";
import type { FoodItem } from "@summer/domain";
import { useActions } from "../../../provider/StoreProvider";

const inputCls = "border border-line rounded-md px-2.5 py-2 text-[13px] text-ink";

export function AddMeal({ date, foods }: { date: string; foods: Record<string, FoodItem> }) {
  const actions = useActions();
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [f, setF] = useState("");
  const [c, setC] = useState("");

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return Object.values(foods).filter((fd) => fd.name.toLowerCase().includes(q)).slice(0, 6);
  }, [name, foods]);

  const pick = (fd: FoodItem) => {
    setName(fd.name);
    setKcal(String(fd.kcal));
    setP(String(fd.p));
    setF(String(fd.f));
    setC(String(fd.c));
  };

  const add = () => {
    const nm = name.trim();
    if (!nm) return;
    const pv = Number(p) || 0, fv = Number(f) || 0, cv = Number(c) || 0;
    let kc = Number(kcal) || 0;
    if (!kc) kc = Math.round(pv * 4 + fv * 9 + cv * 4);
    const meal = { name: nm, kcal: kc, p: pv, f: fv, c: cv };
    actions.addMeal(date, meal);
    actions.rememberFood(meal);
    setName(""); setKcal(""); setP(""); setF(""); setC("");
  };

  return (
    <Card className="gap-2">
      <Txt className="text-base font-medium text-ink">Добавить приём пищи</Txt>
      <View>
        <TextInput className={inputCls} placeholder="Блюдо" value={name} onChangeText={setName} />
        {suggestions.length > 0 ? (
          <View className="bg-surface border border-line rounded-md mt-1">
            {suggestions.map((fd) => (
              <Pressable key={fd.name} onPress={() => pick(fd)} className="px-2.5 py-2 border-t border-line/60">
                <Txt className="text-[13px] font-medium text-ink">{fd.name}</Txt>
                <Txt className="text-[12px] text-muted">{fd.kcal} ккал · Б{fd.p} · Ж{fd.f} · У{fd.c}</Txt>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <View className="flex-row gap-2">
        <TextInput className={`${inputCls} flex-1`} placeholder="Ккал" keyboardType="numeric" value={kcal} onChangeText={setKcal} />
        <TextInput className={`${inputCls} flex-1`} placeholder="Б" keyboardType="numeric" value={p} onChangeText={setP} />
        <TextInput className={`${inputCls} flex-1`} placeholder="Ж" keyboardType="numeric" value={f} onChangeText={setF} />
        <TextInput className={`${inputCls} flex-1`} placeholder="У" keyboardType="numeric" value={c} onChangeText={setC} />
      </View>
      <Btn title="Добавить" onPress={add} />
    </Card>
  );
}
