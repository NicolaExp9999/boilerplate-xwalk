import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const ROW = {
  LOGOS: 0,
  IMAGE: 1,
  CONTENT: 2,
};

function getRowImage(row) {
  if (!row) return null;
  const img = row.querySelector('picture img, img');
  if (!img) return null;
  return { src: img.src, alt: img.alt || '', row };
}

function parseLogos(row) {
  if (!row) return [];

  const items = row.querySelectorAll(':scope > ul > li, :scope > div > ul > li');
  if (items.length) {
    return [...items].map((item) => {
      const img = item.querySelector('picture img, img');
      const link = item.querySelector('a');
      if (!img) return null;
      return {
        src: img.src,
        alt: img.alt || '',
        href: link?.getAttribute('href') || link?.href || '#',
        row: item,
      };
    }).filter(Boolean);
  }

  const chunks = [...row.querySelectorAll(':scope > div > hr, :scope > hr')];
  if (chunks.length) {
    const logos = [];
    const current = row.querySelector(':scope > div');
    const segments = current ? [current] : [];
    row.querySelectorAll(':scope > div').forEach((div) => {
      if (div.querySelector('picture, img')) segments.push(div);
    });
    segments.forEach((segment) => {
      const img = segment.querySelector('picture img, img');
      if (!img) return;
      const link = segment.querySelector('a');
      logos.push({
        src: img.src,
        alt: img.alt || '',
        href: link?.getAttribute('href') || link?.href || '#',
        row: segment,
      });
    });
    return logos;
  }

  const img = row.querySelector('picture img, img');
  if (!img) return [];
  const link = row.querySelector('a');
  return [{
    src: img.src,
    alt: img.alt || '',
    href: link?.getAttribute('href') || link?.href || '#',
    row,
  }];
}

function parseContent(row) {
  if (!row) {
    return {
      eyebrow: '',
      title: '',
      bodyHtml: '',
      primary: null,
      secondary: null,
      note: '',
    };
  }

  const root = row.querySelector(':scope > div') || row;
  const heading = root.querySelector('h1, h2, h3, h4, h5, h6');
  const paragraphs = [...root.querySelectorAll('p')];
  const links = [...root.querySelectorAll('a[href]')];

  const eyebrowNode = paragraphs.find((p) => !p.querySelector('a') && p !== heading?.nextElementSibling);
  const copyNode = paragraphs.find((p) => !p.querySelector('a') && p !== eyebrowNode && p.textContent.trim().length > 40);
  const noteNode = [...paragraphs].reverse().find((p) => !p.querySelector('a'));

  const primaryLink = links.find((link) => link.closest('strong, em') || link.classList.contains('primary')) || links[0];
  const secondaryLink = links.find((link) => link !== primaryLink && !link.closest('strong, em')) || links[1];

  return {
    eyebrow: eyebrowNode?.textContent?.trim() || '',
    title: heading?.textContent?.trim() || '',
    bodyHtml: copyNode?.innerHTML?.trim() || paragraphs.find((p) => !p.querySelector('a') && p !== eyebrowNode && p !== noteNode)?.innerHTML?.trim() || '',
    primary: primaryLink ? {
      label: primaryLink.textContent.trim(),
      href: primaryLink.getAttribute('href') || primaryLink.href,
      row: primaryLink.closest('p') || primaryLink,
    } : null,
    secondary: secondaryLink ? {
      label: secondaryLink.textContent.trim(),
      href: secondaryLink.getAttribute('href') || secondaryLink.href,
      row: secondaryLink.closest('p') || secondaryLink,
    } : null,
    note: noteNode?.textContent?.trim() || '',
    eyebrowRow: eyebrowNode,
    titleRow: heading,
    copyRow: copyNode,
    noteRow: noteNode,
  };
}

function createLogoLink(logo) {
  const link = document.createElement('a');
  link.href = logo.href || '#';
  link.className = 'hero-logo-link';

  const optimizedPicture = createOptimizedPicture(logo.src, logo.alt, true, [{ width: '300' }]);
  moveInstrumentation(logo.row, link);
  link.append(optimizedPicture);

  return link;
}

function createAction(label, href, variant, row) {
  if (!label) return null;

  const action = document.createElement('a');
  action.href = href || '#';
  action.className = `hero-action ${variant}`;
  action.textContent = label;
  if (row) moveInstrumentation(row, action);
  return action;
}

function createHeroPicture(image, alt, eager) {
  const pictureWrap = document.createElement('div');
  pictureWrap.className = 'hero-picture';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-picture-image';

  if (image?.src) {
    const optimizedPicture = createOptimizedPicture(image.src, alt, eager, [{ width: '1600' }]);
    moveInstrumentation(image.row, imageWrap);
    imageWrap.append(optimizedPicture);
  } else {
    imageWrap.classList.add('hero-picture-fallback');
  }

  pictureWrap.append(imageWrap);
  return pictureWrap;
}

export default function decorate(block) {
  const rows = [...block.children];
  let template = 'default';
  if (block.classList.contains('image-bottom')) {
    template = 'image-bottom';
  } else if (block.classList.contains('background-color')) {
    template = 'background-color';
  }

  const logos = parseLogos(rows[ROW.LOGOS]);
  const heroImage = getRowImage(rows[ROW.IMAGE]);
  const imageAlt = rows[ROW.IMAGE]?.querySelector('img')?.alt || '';
  const content = parseContent(rows[ROW.CONTENT]);

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-wrapper';

  const data = document.createElement('div');
  data.className = 'hero-data';

  if (logos.length) {
    const logosWrap = document.createElement('div');
    logosWrap.className = 'hero-logos';
    logos.forEach((logo, index) => {
      if (index > 0) {
        const divider = document.createElement('span');
        divider.className = 'hero-logos-divider';
        divider.setAttribute('aria-hidden', 'true');
        logosWrap.append(divider);
      }
      logosWrap.append(createLogoLink(logo));
    });
    data.append(logosWrap);
  }

  if (content.eyebrow) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'hero-eyebrow';
    eyebrow.textContent = content.eyebrow;
    moveInstrumentation(content.eyebrowRow, eyebrow);
    data.append(eyebrow);
  }

  if (content.title) {
    const heading = document.createElement('h1');
    heading.className = 'hero-title';
    heading.textContent = content.title;
    moveInstrumentation(content.titleRow, heading);
    data.append(heading);
  }

  if (content.bodyHtml) {
    const copy = document.createElement('div');
    copy.className = 'hero-copy';
    copy.innerHTML = content.bodyHtml;
    moveInstrumentation(content.copyRow, copy);
    data.append(copy);
  }

  const primaryAction = createAction(
    content.primary?.label,
    content.primary?.href,
    'primary',
    content.primary?.row,
  );
  const secondaryAction = createAction(
    content.secondary?.label,
    content.secondary?.href,
    'secondary',
    content.secondary?.row,
  );

  if (primaryAction || secondaryAction) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    if (primaryAction) actions.append(primaryAction);
    if (secondaryAction) actions.append(secondaryAction);
    data.append(actions);
  }

  if (content.note) {
    const note = document.createElement('p');
    note.className = 'hero-note';
    note.textContent = content.note;
    moveInstrumentation(content.noteRow, note);
    data.append(note);
  }

  wrapper.append(data);
  block.replaceChildren(wrapper);

  if (template === 'default') {
    const media = createHeroPicture(heroImage, imageAlt, true);
    media.classList.add('hero-picture-background');
    block.prepend(media);

    if (!block.classList.contains('none')) {
      const shadow = document.createElement('div');
      shadow.className = 'hero-shadow';
      shadow.setAttribute('aria-hidden', 'true');
      block.insertBefore(shadow, wrapper);
    }
  } else if (template === 'image-bottom') {
    const media = createHeroPicture(heroImage, imageAlt, false);
    block.append(media);
  }
}
