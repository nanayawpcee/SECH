"use client";

import { useMemo, useState } from "react";
import {
  ORG_CHART,
  ORG_CATEGORY_META,
  collectParentIds,
  findPostHolder,
  type OrgCategory,
  type OrgNode,
} from "@/lib/org-chart";

/**
 * Renders the organogram tree from `ORG_CHART`. The shape of the chart lives
 * entirely in that data file — this component only knows how to draw a node
 * and recurse, so new posts never require changes here.
 */

/** Branches wider than this whose children are all leaves wrap into a grid
 *  instead of one very wide row (Administration alone has 15 direct reports). */
const GRID_THRESHOLD = 6;

function OrgNodeView({
  node,
  collapsed,
  onToggle,
}: {
  node: OrgNode;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}) {
  const meta = ORG_CATEGORY_META[node.category];
  const holder = findPostHolder(node.roleKey);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isCollapsed = collapsed.has(node.id);

  const allLeaves = children.every((c) => !c.children?.length);
  const useGrid = allLeaves && children.length > GRID_THRESHOLD;

  return (
    <li
      className={`org-item${node.dotted ? " org-item--dotted" : ""}`}
      // Drives the connector colour so each branch keeps its own line colour,
      // matching the source chart.
      style={{ ["--org-line" as string]: meta.line } as React.CSSProperties}
    >
      <div
        className="org-card"
        style={{
          background: meta.bg,
          borderColor: meta.border,
          color: meta.text,
        }}
      >
        <span className="org-card__text">
          <span className="org-card__label">{node.label}</span>
          {holder && <span className="org-card__holder">{holder.name}</span>}
        </span>

        {hasChildren && (
          <button
            type="button"
            className="org-card__toggle"
            onClick={() => onToggle(node.id)}
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${node.label}`}
            style={{ background: meta.border }}
          >
            {isCollapsed ? "+" : "−"}
          </button>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <ul className={`org-children${useGrid ? " org-children--grid" : ""}`}>
          {children.map((child) => (
            <OrgNodeView
              key={child.id}
              node={child}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChart() {
  const parentIds = useMemo(() => collectParentIds(ORG_CHART), []);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(parentIds));

  const allExpanded = collapsed.size === 0;

  const legend = (Object.keys(ORG_CATEGORY_META) as OrgCategory[]).filter(
    // Administration and Governance share a palette; show the pair once.
    (c) => c !== "administration",
  );

  return (
    <div className="org">
      {/* ── Controls ── */}
      <div className="org__controls">
        <div className="org__buttons">
          <button
            type="button"
            onClick={expandAll}
            disabled={allExpanded}
            className="org__btn org__btn--solid"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="org__btn org__btn--ghost"
          >
            Collapse all
          </button>
        </div>
        <p className="org__hint">
          Select <strong>+</strong> / <strong>−</strong> on a post to show or hide
          the units reporting to it.
        </p>
      </div>

      {/* ── Legend ── */}
      <ul className="org__legend">
        {legend.map((key) => {
          const meta = ORG_CATEGORY_META[key];
          return (
            <li key={key} className="org__legend-item">
              <span
                className="org__legend-swatch"
                style={{ background: meta.border }}
              />
              {meta.label}
            </li>
          );
        })}
        <li className="org__legend-item">
          <span className="org__legend-swatch org__legend-swatch--dashed" />
          Independent reporting line
        </li>
      </ul>

      {/* ── Chart ── */}
      <div className="org__scroll">
        <ul className="org-tree">
          <OrgNodeView
            node={ORG_CHART}
            collapsed={collapsed}
            onToggle={toggle}
          />
        </ul>
      </div>
    </div>
  );
}
