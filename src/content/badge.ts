import type { Verdict } from '../shared/types';
import { loadingVerdict } from '../jev/verdict';
import badgeCss from './badge.css?raw';

const HOST_ATTR = 'data-jev-auth-host';
const STYLE_ID = 'jev-auth-page-styles';

function ensurePageStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .jev-auth-host { display: inline-flex; align-items: center; vertical-align: middle; margin-inline-start: 6px; }
    .jev-auth-tooltip {
      position: fixed; z-index: 2147483646; min-width: 220px; max-width: 280px;
      padding: 10px 12px; border: 1px solid #ccfbf1; border-radius: 10px;
      background: #f0fdfa; color: #134e4a; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
      font: 12px/1.45 "Segoe UI", system-ui, sans-serif;
    }
    .jev-auth-tooltip[hidden] { display: none !important; }
    .jev-auth-tooltip h3 { margin: 0 0 6px; font-size: 13px; font-weight: 650; color: #134e4a; }
    .jev-auth-tooltip dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
    .jev-auth-tooltip dt { color: #0f766e; font-weight: 600; }
    .jev-auth-tooltip dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
    .jev-auth-tooltip p { margin: 8px 0 0; color: #3f3f46; }
  `;
  document.documentElement.appendChild(style);
}

function formatPct(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value * 100)}%`;
}

function tooltipHtml(verdict: Verdict): string {
  const rows = [
    ['AI-written', formatPct(verdict.isAi)],
    ['Misinfo cues', formatPct(verdict.isFake)],
  ];
  if (verdict.postType) {
    rows.push(['Post type', verdict.postType]);
  }
  if (typeof verdict.postTypeConfidence === 'number') {
    rows.push(['Type confidence', formatPct(verdict.postTypeConfidence)]);
  }
  if (verdict.model) {
    rows.push(['Model', verdict.model]);
  }

  const extras = rows
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
    .join('');

  const note = verdict.error
    ? `<p>${verdict.error}</p>`
    : '<p>Noul values are probabilities (0–1). Values near 50% mean Jev is unsure.</p>';

  return `<h3>${verdict.label}</h3><dl>${extras}</dl>${note}`;
}

function positionTooltip(tooltip: HTMLElement, button: HTMLElement): void {
  const rect = button.getBoundingClientRect();
  const gap = 8;
  const width = tooltip.offsetWidth || 240;
  const height = tooltip.offsetHeight || 120;
  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - width - 8;
  }
  if (top + height > window.innerHeight - 8) {
    top = rect.top - height - gap;
  }

  tooltip.style.left = `${Math.max(8, left)}px`;
  tooltip.style.top = `${Math.max(8, top)}px`;
}

export type BadgeController = {
  host: HTMLElement;
  setVerdict: (verdict: Verdict) => void;
  remove: () => void;
};

export function mountBadge(anchor: HTMLElement): BadgeController {
  ensurePageStyles();

  const existing = anchor.parentElement?.querySelector<HTMLElement>(`[${HOST_ATTR}]`);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('span');
  host.className = 'jev-auth-host';
  host.setAttribute(HOST_ATTR, 'true');

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = badgeCss;
  shadow.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'jev-auth-btn';
  button.innerHTML = '<span class="jev-auth-dot" aria-hidden="true"></span><span class="jev-auth-label"></span>';
  shadow.appendChild(button);

  const tooltip = document.createElement('div');
  tooltip.className = 'jev-auth-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  let current = loadingVerdict();
  let open = false;

  const apply = (verdict: Verdict) => {
    current = verdict;
    button.dataset.tone = verdict.tone;
    button.dataset.loading = verdict.kind === 'loading' ? 'true' : 'false';
    const label = button.querySelector('.jev-auth-label');
    if (label) {
      label.textContent = verdict.label;
    }
    button.setAttribute('aria-label', `Authenticity: ${verdict.label}`);
    tooltip.innerHTML = tooltipHtml(verdict);
    if (open) {
      positionTooltip(tooltip, button);
    }
  };

  const show = () => {
    open = true;
    tooltip.hidden = false;
    tooltip.innerHTML = tooltipHtml(current);
    positionTooltip(tooltip, button);
  };

  const hide = () => {
    open = false;
    tooltip.hidden = true;
  };

  const toggle = () => {
    if (open) {
      hide();
    } else {
      show();
    }
  };

  button.addEventListener('mouseenter', show);
  button.addEventListener('mouseleave', hide);
  button.addEventListener('focus', show);
  button.addEventListener('blur', hide);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  });

  const onScroll = () => {
    if (open) {
      hide();
    }
  };
  window.addEventListener('scroll', onScroll, true);

  apply(current);

  if (anchor.parentElement) {
    anchor.insertAdjacentElement('afterend', host);
  } else {
    anchor.appendChild(host);
  }

  return {
    host,
    setVerdict: apply,
    remove: () => {
      hide();
      tooltip.remove();
      host.remove();
      window.removeEventListener('scroll', onScroll, true);
    },
  };
}

export function removeAllBadges(): void {
  document.querySelectorAll(`[${HOST_ATTR}]`).forEach((node) => node.remove());
  document.querySelectorAll('.jev-auth-tooltip').forEach((node) => node.remove());
}
