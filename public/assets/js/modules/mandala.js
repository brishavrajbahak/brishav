let cachedConfig;

const GROUP_COLORS = {
  core: 'var(--cyan)',
  skills: 'var(--pink)',
  tools: 'var(--violet)',
  domains: 'var(--text)',
};

export async function getMandalaConfig() {
  if (!cachedConfig) {
    cachedConfig = fetch('assets/data/mandala-config.json').then(response => response.json());
  }
  return cachedConfig;
}

export async function renderMandala(container, options = {}) {
  if (!container) return;

  const config = options.config || await getMandalaConfig();
  const focusIds = new Set(options.focusIds || []);
  const compact = Boolean(options.compact);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size = compact ? 340 : 480;
  const center = size / 2;
  const radii = compact ? [0, 74, 126, 166] : [0, 102, 168, 220];

  const nodePositions = buildNodePositions(config, center, radii);
  const highlighted = focusIds.size ? expandFocus(config.relationships, focusIds) : focusIds;

  container.innerHTML = '';
  container.classList.add('mandala-shell');

  const figure = document.createElement('figure');
  figure.className = `mandala-figure${compact ? ' is-compact' : ''}`;
  figure.setAttribute('role', 'group');
  figure.setAttribute('aria-label', options.ariaLabel || config.title || 'Mandala visualization');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'mandala-svg');
  svg.setAttribute('aria-hidden', 'true');

  const lineLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  lineLayer.setAttribute('class', 'mandala-lines');
  svg.appendChild(lineLayer);

  for (const edge of config.relationships) {
    const from = nodePositions.get(edge.from);
    const to = nodePositions.get(edge.to);
    if (!from || !to) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y));
    line.setAttribute('class', highlighted.has(edge.from) && highlighted.has(edge.to) ? 'is-highlighted' : '');
    lineLayer.appendChild(line);
  }

  const nodeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodeLayer.setAttribute('class', 'mandala-nodes');
  svg.appendChild(nodeLayer);

  const detail = document.createElement('figcaption');
  detail.className = 'mandala-detail';
  detail.innerHTML = `
    <div class="mandala-detail-label">${options.title || config.title}</div>
    <div class="mandala-detail-title">${options.subtitle || 'Signal paths across skills, tools, and applied domains.'}</div>
  `;

  config.nodes.forEach(node => {
    const pos = nodePositions.get(node.id);
    const color = GROUP_COLORS[node.group] || 'var(--cyan)';
    const active = highlighted.size === 0 || highlighted.has(node.id);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `mandala-node${active ? ' is-active' : ''}${!reducedMotion && options.pulseId === node.id ? ' is-pulse' : ''}`);
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', `${node.label}. ${node.summary}`);
    group.dataset.nodeId = node.id;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', node.group === 'core' ? String(compact ? 28 : 34) : String(compact ? 14 : 16));
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', node.group === 'core' ? '0.15' : active ? '0.14' : '0.08');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', node.group === 'core' ? '2.5' : '1.8');
    group.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(pos.x));
    label.setAttribute('y', String(pos.y + (node.group === 'core' ? 4 : 3)));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'mandala-node-label');
    label.textContent = node.group === 'core' ? node.label : abbreviateLabel(node.label, compact);
    group.appendChild(label);

    const caption = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    caption.setAttribute('x', String(pos.x));
    caption.setAttribute('y', String(pos.y + (node.group === 'core' ? 42 : 30)));
    caption.setAttribute('text-anchor', 'middle');
    caption.setAttribute('class', 'mandala-node-caption');
    caption.textContent = node.group === 'core' ? '' : node.label;
    group.appendChild(caption);

    const onActivate = () => {
      detail.innerHTML = `
        <div class="mandala-detail-label">${labelForGroup(config, node.group)}</div>
        <div class="mandala-detail-title">${node.label}</div>
        <p>${node.summary}</p>
      `;
    };

    group.addEventListener('mouseenter', onActivate);
    group.addEventListener('focus', onActivate);
    group.addEventListener('click', onActivate);
    nodeLayer.appendChild(group);
  });

  figure.appendChild(svg);
  figure.appendChild(detail);
  container.appendChild(figure);
}

function buildNodePositions(config, center, radii) {
  const positions = new Map();
  const grouped = config.groups.map(group => ({
    ...group,
    nodes: config.nodes.filter(node => node.group === group.id),
  }));

  grouped.forEach((group, groupIndex) => {
    if (group.id === 'core') {
      const node = group.nodes[0];
      if (node) positions.set(node.id, { x: center, y: center });
      return;
    }

    const ringRadius = radii[groupIndex] || radii[radii.length - 1];
    const total = group.nodes.length;
    const startAngle = -Math.PI / 2 + groupIndex * 0.2;

    group.nodes.forEach((node, nodeIndex) => {
      const angle = startAngle + (Math.PI * 2 * nodeIndex) / total;
      positions.set(node.id, {
        x: center + Math.cos(angle) * ringRadius,
        y: center + Math.sin(angle) * ringRadius,
      });
    });
  });

  return positions;
}

function labelForGroup(config, groupId) {
  return config.groups.find(group => group.id === groupId)?.label || 'Signal';
}

function abbreviateLabel(label, compact) {
  if (!compact) return label;
  if (label.length <= 12) return label;
  return `${label.slice(0, 10)}…`;
}

function expandFocus(relationships, focusIds) {
  const expanded = new Set(focusIds);
  relationships.forEach(({ from, to }) => {
    if (focusIds.has(from) || focusIds.has(to)) {
      expanded.add(from);
      expanded.add(to);
    }
  });
  return expanded;
}
