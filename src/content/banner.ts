import bannerCss from './banner.css?raw';

const HOST_ATTR = 'data-slop-banner';
const QUOTE_TAG = 'DIV';

const WARNING_ICON = `
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4" />
    <path d="M12 17h.01" />
  </svg>`;

function stopEvent(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

function createHost(root: HTMLElement): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute(HOST_ATTR, 'true');
  // The outer post root is an <article>; a quoted post root is a <div role="link">.
  host.dataset.kind = root.tagName === QUOTE_TAG ? 'quote' : 'post';
  // Keep clicks on the banner from opening the post.
  host.addEventListener('click', stopEvent);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = bannerCss;
  shadow.appendChild(style);

  const banner = document.createElement('div');
  banner.className = 'slop-banner';
  banner.setAttribute('role', 'note');
  banner.setAttribute('aria-label', 'AI slop: likely low-effort AI-generated text');
  banner.innerHTML = `${WARNING_ICON}<span class="label">AI slop</span><span class="reason">Likely low-effort AI-generated text</span>`;
  shadow.appendChild(banner);
  return host;
}

export function hasBanner(root: HTMLElement): boolean {
  return Array.from(root.children).some((child) => child.hasAttribute(HOST_ATTR));
}

export function addBanner(root: HTMLElement): void {
  if (root.hasAttribute(HOST_ATTR) || hasBanner(root)) {
    return;
  }
  root.prepend(createHost(root));
}

export function removeBanner(root: HTMLElement): void {
  Array.from(root.children)
    .filter((child) => child.hasAttribute(HOST_ATTR))
    .forEach((child) => child.remove());
}

export function removeAllBanners(): void {
  document.querySelectorAll(`[${HOST_ATTR}]`).forEach((node) => node.remove());
}
