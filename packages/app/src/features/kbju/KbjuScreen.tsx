import React, { useMemo, useState } from "react";
import { ScrollView, View, Pressable, TextInput } from "react-native";
import { Box, Txt, Card, Btn, MetricCard } from "@summer/ui";
import { DAYS, SHORT, KBJU_BONUS_WHY, type FoodItem } from "@summer/domain";
import { selectKbju } from "@summer/state";
import { useActions, useAppStore } from "../../provider/StoreProvider";

export function KbjuScreen() {
  const [dayIndex, setDayIndex] = useState(0);
  const kb = useAppStore((s) => selectKbju(s, dayIndex));
  const foods = useAppStore((s) => s.foods);

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Txt className="text-2xl font-medium text-ink">КБЖУ дня</Txt>

      {/* day selector */}
      <View className="flex-row flex-wrap gap-1.5">
        {DAYS.map((d, i) => {
          const on = i === dayIndex;
          return (
            <Pressable
              key={d.index}
              onPress={() => setDayIndex(i)}
              className={`px-3 py-1.5 rounded-md ${on ? "bg-primary" : "bg-line/60"}`}
            >
              <Txt className={`text-[13px] font-medium ${on ? "text-white" : "text-ink"}`}>
                {SHORT[i]} {d.date.split(" ")[0]}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <Txt className="text-[13px] text-muted">
        Норма на {kb.day.name}
        {kb.bonus ? ` · +${kb.bonus} ккал за ${KBJU_BONUS_WHY[dayIndex]}` : " · базовая"}
      </Txt>

      {/* remaining cards */}
      <View className="flex-row flex-wrap gap-3">
        <RemainCard label="Калории" unit="ккал" rest={kb.remaining.kcal} norm={kb.norm.kcal} con={kb.consumed.kcal} />
        <RemainCard label="Белки" unit="г" rest={kb.remaining.p} norm={kb.norm.p} con={kb.consumed.p} />
        <RemainCard label="Жиры" unit="г" rest={kb.remaining.f} norm={kb.norm.f} con={kb.consumed.f} />
        <RemainCard label="Углеводы" unit="г" rest={kb.remaining.c} norm={kb.norm.c} con={kb.consumed.c} />
      </View>

      <AddMeal date={kb.day.date} foods={foods} />

      <Card>
        <Txt className="text-base font-medium text-ink mb-2">Приёмы пищи</Txt>
        {kb.meals.length === 0 ? (
          <Txt className="text-[13px] text-muted">Пока ничего не добавлено</Txt>
        ) : (
          kb.meals.map((m) => (
            <MealRow key={m.id} id={m.id} date={kb.day.date} name={m.name} kcal={m.kcal} p={m.p} f={m.f} c={m.c} />
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function RemainCard({
  label, unit, rest, norm, con,
}: { label: string; unit: string; rest: number; norm: number; con: number }) {
  const over = con > norm;
  const pct = norm ? Math.min(100, Math.round((con / norm) * 100)) : 0;
  return (
    <View className="bg-surface border border-line rounded-md p-3 flex-1 min-w-[150px]">
      <Txt className="text-[12px] text-muted mb-1">{label} — остаток</Txt>
      <Txt className={`text-2xl font-medium ${over ? "text-danger" : "text-ink"}`}>
        {Math.round(rest)}<Txt className="text-[13px] text-muted"> {unit}</Txt>
      </Txt>
      <View className="h-1.5 bg-line rounded overflow-hidden mt-2">
        <View className={`h-full rounded ${over ? "bg-danger" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </View>
      <Txt className="text-[12px] text-muted mt-1.5">
        {Math.round(con)} из {norm} {unit}{over ? " · перебор" : ""}
      </Txt>
    </View>
  );
}

function MealRow({
  id, date, name, kcal, p, f, c,
}: { id: string; date: string; name: string; kcal: number; p: number; f: number; c: number }) {
  const actions = useActions();
  return (
    <View className="flex-row items-center border-t border-line/60 py-2">
      <Txt className="text-[13px] text-ink flex-1">{name || "—"}</Txt>
      <Txt className="text-[13px] text-muted w-[120px] text-right">
        {kcal} ккал · Б{p}/Ж{f}/У{c}
      </Txt>
      <Pressable onPress={() => actions.removeMeal(date, id)} hitSlop={8} className="pl-3">
        <Txt className="text-danger text-base">×</Txt>
      </Pressable>
    </View>
  );
}

const inputCls =
  "border border-line rounded-md px-2.5 py-2 text-[13px] text-ink";

function AddMeal({ date, foods }: { date: string; foods: Record<string, FoodItem> }) {
  const actions = useActions();
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [f, setF] = useState("");
  const [c, setC] = useState("");

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return Object.values(foods)
      .filter((fd) => fd.name.toLowerCase().includes(q))
      .slice(0, 6);
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
      <View className="relative">
        <TextInput
          className={inputCls}
          placeholder="Блюдо"
          value={name}
          onChangeText={setName}
        />
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
