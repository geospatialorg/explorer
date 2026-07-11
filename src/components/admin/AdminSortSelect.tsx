"use client";

interface Option {
  value: string;
  label: string;
}

interface Props {
  current: string;
  options: Option[];
  paramName?: string;
  preserveParams?: Record<string, string>;
}

export function AdminSortSelect({ current, options, paramName = "sort", preserveParams = {} }: Props) {
  function navigate(value: string) {
    const p = new URLSearchParams({ ...preserveParams, [paramName]: value });
    window.location.href = `${window.location.pathname}?${p}`;
  }

  return (
    <select
      defaultValue={current}
      onChange={(e) => navigate(e.target.value)}
      className="border rounded-md text-sm px-2 h-8"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
