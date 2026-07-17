import { createOptimizedPicture } from '../../scripts/aem.js';

function getTextContent(node, fallback = '') {
  if (!node) return fallback;
  const text = node.textContent?.trim();
  return text || fallback;
}

function createAction(label, href, variant) {
  const action = document.createElement('a');
  action.href = href || '#';
  action.className = `hero-action ${variant}`;
  action.textContent = label;
  return action;
}

export default function decorate(block) {
  block.classList.add('hero');

  const titleNode = block.querySelector('h1, h2, h3');
  const eyebrowNode = block.querySelector('strong, em');
  const paragraphNode = [...block.querySelectorAll('p')].find(
    (p) => p.textContent.trim() && !p.querySelector('a'),
  );
  const links = [...block.querySelectorAll('a')].filter((link) => link.href && link.textContent.trim());
  const noteNode = [...block.querySelectorAll('p')].find(
    (p) => p.textContent.trim().length > 20 && p.textContent.toLowerCase().includes('servizio'),
  );

  const imageNode = block.querySelector('picture') || block.querySelector('img');
  const titleText = getTextContent(titleNode, 'Con Plenitude l’energia del sole può diventare risparmio.');
  const eyebrowText = getTextContent(eyebrowNode, 'TAG H1');
  const paragraphText = getTextContent(paragraphNode, 'Scegli la nostra soluzione per sfruttare virtualmente l’energia solare senza la necessità di installare un impianto fotovoltaico in casa.');
  const primaryLabel = getTextContent(links[0], 'Per i nuovi clienti luce');
  const secondaryLabel = getTextContent(links[1], 'Per i già clienti luce');
  const noteText = getTextContent(noteNode, 'Servizio sottoscrivibile solo dai clienti domestici Plenitude con offerta luce compatibile attiva e con contatore 2G con rilevazione quartoraria attiva (Vedi FAQ dedicate).');

  const media = document.createElement('div');
  media.className = 'hero-media';
  media.setAttribute('aria-hidden', 'true');

  if (imageNode) {
    if (imageNode.tagName === 'PICTURE') {
      const img = imageNode.querySelector('img');
      if (img) {
        const optimizedPicture = createOptimizedPicture(img.src, img.alt || '', true, [{ width: '1400' }]);
        media.append(optimizedPicture);
      }
    } else {
      const optimizedPicture = createOptimizedPicture(imageNode.src, imageNode.alt || '', true, [{ width: '1400' }]);
      media.append(optimizedPicture);
    }
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'hero-media-fallback';
    media.append(fallback);
  }

  const content = document.createElement('div');
  content.className = 'hero-content';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'hero-eyebrow';
  eyebrow.textContent = eyebrowText;

  const heading = document.createElement('h1');
  heading.className = 'hero-title';
  heading.textContent = titleText;

  const copy = document.createElement('p');
  copy.className = 'hero-copy';
  copy.textContent = paragraphText;

  const actions = document.createElement('div');
  actions.className = 'hero-actions';
  actions.append(createAction(primaryLabel, links[0]?.getAttribute('href') || '#', 'primary'));
  actions.append(createAction(secondaryLabel, links[1]?.getAttribute('href') || '#', 'secondary'));

  const note = document.createElement('p');
  note.className = 'hero-note';
  note.textContent = noteText;

  content.append(eyebrow, heading, copy, actions, note);
  block.replaceChildren(media, content);
}
