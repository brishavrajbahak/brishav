import { renderMandala } from './mandala.js';
import { createCommandRegistry, suggestCommands } from './terminal-commands.js';

export function initTerminalRuntime({ analytics, buildMeta, openPlayground, openAndAnalyze }) {
  const terminal = document.getElementById('heroTerminal');
  const originalInput = document.getElementById('terminalInput');
  const originalOutput = document.getElementById('terminalOutput');
  const originalCursor = document.getElementById('terminalCursor');
  if (!terminal || !originalInput || !originalOutput) return;

  const output = originalOutput.cloneNode(false);
  output.id = originalOutput.id;
  originalOutput.replaceWith(output);

  const input = originalInput.cloneNode(true);
  input.value = '';
  input.placeholder = 'whoami --deep';
  originalInput.replaceWith(input);

  if (originalCursor) {
    originalCursor.textContent = '';
  }

  const state = {
    history: [],
    historyIndex: 0,
    queue: [],
    typing: false,
  };

  const registry = createCommandRegistry({
    buildMeta,
    openPlayground,
    openAndAnalyze,
    scrollToSection(id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });

  resetTerminal();
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      state.history.push(value);
      state.historyIndex = state.history.length;
      appendCommand(value);
      execute(value);
      input.value = '';
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (state.historyIndex > 0) {
        state.historyIndex -= 1;
        input.value = state.history[state.historyIndex] || '';
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1;
        input.value = state.history[state.historyIndex] || '';
      } else {
        state.historyIndex = state.history.length;
        input.value = '';
      }
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const matches = suggestCommands(input.value, registry.commandNames);
      if (matches.length === 1) {
        input.value = hydrateSuggestion(input.value, matches[0]);
      } else if (matches.length > 1) {
        queueLines([`Possibilities: ${matches.join(', ')}`]);
      }
    }
  });

  output.addEventListener('click', () => input.focus());
  document.getElementById('heroTerminal')?.addEventListener('click', () => input.focus());

  function execute(value) {
    const baseCommand = value.trim().split(/\s+/)[0].toLowerCase();
    analytics?.trackEvent('terminal_command', { command: baseCommand });
    const result = registry.execute(value);

    if (result.type === 'noop') return;
    if (result.lines?.length) queueLines(result.lines);
    if (result.type === 'clear') {
      resetTerminal();
      return;
    }

    if (result.type === 'mandala') {
      analytics?.trackEvent('mandala_view', { source: 'terminal' });
      const embed = document.createElement('div');
      embed.className = 'terminal-embed';
      output.appendChild(embed);
      output.scrollTop = output.scrollHeight;
      renderMandala(embed, {
        compact: true,
        title: 'Terminal Mandala',
        subtitle: 'Signal paths currently in focus.',
        focusIds: result.focusIds,
        pulseId: 'analytics',
        ariaLabel: 'Terminal mandala view',
      });
    }

    if (result.type === 'action' && typeof result.action === 'function') {
      window.setTimeout(() => result.action(), 120);
    }
  }

  function resetTerminal() {
    output.innerHTML = '';
    state.queue = [];
    state.typing = false;
    const seenKey = 'advanced-v1-onboarding-seen';

    if (!sessionStorage.getItem(seenKey)) {
      queueLines(["Welcome. Type 'help' or 'mandala' to begin."]);
      sessionStorage.setItem(seenKey, '1');
    } else {
      queueLines(['Advanced terminal ready. Type help to inspect commands.']);
    }
  }

  function appendCommand(value) {
    const line = document.createElement('div');
    line.className = 'terminal-line is-command';
    line.innerHTML = `<span class="terminal-prompt">$</span><span>${escapeHtml(value)}</span>`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function queueLines(lines) {
    lines.forEach(line => state.queue.push(line));
    processQueue();
  }

  function processQueue() {
    if (state.typing || !state.queue.length) return;
    state.typing = true;

    const text = state.queue.shift();
    const line = document.createElement('div');
    line.className = 'terminal-line';
    output.appendChild(line);

    let index = 0;
    const speed = 12;
    const type = () => {
      if (index < text.length) {
        line.textContent += text[index];
        index += 1;
        output.scrollTop = output.scrollHeight;
        window.setTimeout(type, speed);
      } else {
        state.typing = false;
        processQueue();
      }
    };

    type();
  }
}

function hydrateSuggestion(input, suggestion) {
  const parts = input.trim().split(/\s+/);
  if (!parts[0]) return suggestion;
  if (parts[0].toLowerCase() === 'analyze' && parts.length > 1) {
    return `analyze ${suggestion}`;
  }
  return suggestion;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
