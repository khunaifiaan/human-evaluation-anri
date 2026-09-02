import fs from "node:fs";
import path from "node:path";

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

const root = process.cwd();
const rows = parseCsv(fs.readFileSync(path.join(root, "data", "human_eval_sample.csv"), "utf8").replace(/^\uFEFF/, ""));
const [headers, ...body] = rows;
const records = body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
const publicItems = records.map((record) => ({
  order: Number(record.eval_order),
  imageId: record.image_id,
  caption: record.v13_caption,
  imageUrl: `/photos/${encodeURIComponent(record.image_id)}`,
}));
const confidentialItems = records.map((record) => ({
  order: Number(record.eval_order),
  imageId: record.image_id,
  stratum: record.stratum,
  groundTruth: record.ground_truth,
  caption: record.v13_caption,
}));

fs.mkdirSync(path.join(root, "data", "generated"), { recursive: true });
fs.writeFileSync(path.join(root, "data", "generated", "items-public.ts"), `export const evaluationItems = ${JSON.stringify(publicItems, null, 2)} as const;\n`);
fs.writeFileSync(path.join(root, "data", "generated", "items-confidential.ts"), `import \"server-only\";\n\nexport const confidentialItems = ${JSON.stringify(confidentialItems, null, 2)} as const;\n`);
console.log(`Generated ${records.length} evaluation items.`);
