"use client";

import type { NdaData, Party } from "@/lib/nda";

interface Props {
  data: NdaData;
  onChange: (data: NdaData) => void;
}

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function YearsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={1}
      max={99}
      value={value}
      onChange={(e) => onChange(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
      className="w-16 rounded-md border border-stone-300 px-2 py-1 text-sm"
      aria-label="Number of years"
    />
  );
}

function Radio({
  name,
  checked,
  onSelect,
  children,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-700">
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      {children}
    </label>
  );
}

export default function NdaForm({ data, onChange }: Props) {
  const set = <K extends keyof NdaData>(key: K, value: NdaData[K]) =>
    onChange({ ...data, [key]: value });

  const setParty = (key: "party1" | "party2", field: keyof Party, value: string) =>
    onChange({ ...data, [key]: { ...data[key], [field]: value } });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Section title="Agreement terms">
        <Field label="Purpose — how Confidential Information may be used">
          <textarea
            rows={3}
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Effective Date">
          <input
            type="date"
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium text-stone-700">MNDA Term</span>
          <Radio
            name="mndaTerm"
            checked={data.mndaTermType === "expires"}
            onSelect={() => set("mndaTermType", "expires")}
          >
            Expires
            <YearsInput value={data.mndaTermYears} onChange={(n) => set("mndaTermYears", n)} />
            year(s) from Effective Date
          </Radio>
          <Radio
            name="mndaTerm"
            checked={data.mndaTermType === "untilTerminated"}
            onSelect={() => set("mndaTermType", "untilTerminated")}
          >
            Continues until terminated
          </Radio>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Term of Confidentiality</span>
          <Radio
            name="confidentiality"
            checked={data.confidentialityType === "years"}
            onSelect={() => set("confidentialityType", "years")}
          >
            <YearsInput
              value={data.confidentialityYears}
              onChange={(n) => set("confidentialityYears", n)}
            />
            year(s) from Effective Date (trade secrets protected while they remain so)
          </Radio>
          <Radio
            name="confidentiality"
            checked={data.confidentialityType === "perpetual"}
            onSelect={() => set("confidentialityType", "perpetual")}
          >
            In perpetuity
          </Radio>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Governing Law (state)">
            <input
              value={data.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
              placeholder="Delaware"
              className={inputClass}
            />
          </Field>
          <Field label="Jurisdiction (courts located in…)">
            <input
              value={data.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
              placeholder="New Castle, DE"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="MNDA Modifications (optional)">
          <textarea
            rows={2}
            value={data.modifications}
            onChange={(e) => set("modifications", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      {(["party1", "party2"] as const).map((key, i) => (
        <Section key={key} title={`Party ${i + 1}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Print Name">
              <input
                value={data[key].name}
                onChange={(e) => setParty(key, "name", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Title">
              <input
                value={data[key].title}
                onChange={(e) => setParty(key, "title", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Company">
            <input
              value={data[key].company}
              onChange={(e) => setParty(key, "company", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Notice Address (email or postal)">
            <input
              value={data[key].noticeAddress}
              onChange={(e) => setParty(key, "noticeAddress", e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>
      ))}
    </form>
  );
}
