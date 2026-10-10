"use client";

import { useMemo } from "react";
import { evaluateBiosafety, BIOSAFETY_POLICY } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { Card, Badge, Meter } from "@/components/ui";

export default function SafetyPage() {
  const { genome } = useFoundry();
  const report = useMemo(() => evaluateBiosafety(genome), [genome]);

  return (
    <div data-testid="safety-page" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">safety ledger</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Biosafety policy</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The gate is the feature. Design tools that hand out recipes get a bad name — so every
          genome is evaluated against a published rule set before it can be released, and every
          verdict is auditable.
        </p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">current genome</span>
          <Badge tone={report.verdict === "block" ? "danger" : report.verdict === "review" ? "amber" : "bio"}>
            {report.verdict}
          </Badge>
        </div>
        <Meter value={report.riskIndex} tone={report.verdict === "block" ? "danger" : report.verdict === "review" ? "amber" : "bio"} label="risk index" />
        <p className="font-mono text-xs text-muted">risk index {report.riskIndex.toFixed(2)}</p>
        {report.findings.length === 0 ? (
          <p className="text-sm text-muted">No findings — this construct is cleared for release.</p>
        ) : (
          <ul className="space-y-2">
            {report.findings.map((f) => (
              <li key={f.ruleId} className="rounded-panel border border-hull bg-surface-2/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan">{f.ruleId}</span>
                  <Badge tone={f.severity === "block" ? "danger" : "amber"}>{f.severity}</Badge>
                  <span className="font-display font-semibold">{f.title}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{f.rationale}</p>
                {f.remediation ? (
                  <p className="mt-1 font-mono text-xs text-bio">remediation: {f.remediation}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">the policy</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="policy-table">
            <thead>
              <tr className="font-mono text-xs uppercase tracking-widest text-muted">
                <th className="py-2 pr-4">rule</th>
                <th className="py-2 pr-4">severity</th>
                <th className="py-2 pr-4">title</th>
                <th className="py-2">rationale</th>
              </tr>
            </thead>
            <tbody>
              {BIOSAFETY_POLICY.map((rule) => (
                <tr key={rule.id} className="border-t border-hull/60 align-top">
                  <td className="py-3 pr-4 font-mono text-cyan">{rule.id}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={rule.severity === "block" ? "danger" : "amber"}>{rule.severity}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-star">{rule.title}</td>
                  <td className="py-3 text-muted">{rule.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
