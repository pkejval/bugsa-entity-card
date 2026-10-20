/** Finite number for numeric-looking input (numbers, numeric strings), otherwise null. */
export function toNumber(raw) {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

const OPERATOR_PRIORITY = { ">=": 0, ">": 1, "<=": 2, "<": 3 };

function compare(left, operator, right) {
  switch (operator) {
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case "=":
      return left === right;
    case "!=":
      return left !== right;
    default:
      return false;
  }
}

/**
 * Picks the rule that applies to `raw` (a state or attribute value).
 *
 * Numeric rule values compare against the numeric value; text rule values (only `=` / `!=`)
 * compare case-insensitively against the text. Priority: exact match, then the inequality whose
 * threshold is nearest to the value (ties: >=, >, <=, <, then list order), then `!=`.
 */
export function pickMatchingRule(rules, raw) {
  if (!rules?.length || raw === undefined || raw === null) {
    return null;
  }

  const numeric = toNumber(raw);
  const text = typeof raw === "object" ? "" : String(raw).trim().toLowerCase();
  const exact = [];
  const inequality = [];
  const notEqual = [];

  rules.forEach((rule, index) => {
    const entry = { rule, index };

    if (typeof rule.value === "number") {
      if (numeric === null || !compare(numeric, rule.operator, rule.value)) {
        return;
      }
      if (rule.operator === "=") {
        exact.push(entry);
      } else if (rule.operator === "!=") {
        notEqual.push(entry);
      } else {
        inequality.push(entry);
      }
      return;
    }

    if (rule.operator !== "=" && rule.operator !== "!=") {
      return;
    }
    const same = text === String(rule.value).toLowerCase();
    if (rule.operator === "=" && same) {
      exact.push(entry);
    } else if (rule.operator === "!=" && !same) {
      notEqual.push(entry);
    }
  });

  if (exact.length > 0) {
    return exact[0].rule;
  }

  if (inequality.length > 0) {
    inequality.sort((a, b) => {
      const distance = Math.abs(numeric - a.rule.value) - Math.abs(numeric - b.rule.value);
      if (distance !== 0) {
        return distance;
      }
      const priority =
        (OPERATOR_PRIORITY[a.rule.operator] ?? 99) - (OPERATOR_PRIORITY[b.rule.operator] ?? 99);
      return priority !== 0 ? priority : a.index - b.index;
    });
    return inequality[0].rule;
  }

  return notEqual.length > 0 ? notEqual[0].rule : null;
}
