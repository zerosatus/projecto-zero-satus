// logger.js - Sistema central de logs (equivalente ao kDebugMode do Flutter)
(function () {
  'use strict';

  const host = location.hostname;
  const params = new URLSearchParams(location.search);

  const isDev =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.endsWith('.local') ||
    params.get('debug') === '1';

  const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
  const currentLevel = LEVELS[params.get('log') || (isDev ? 'debug' : 'silent')];

  const mutedModules = new Set(
    (params.get('mute') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );

  function shouldLog(level, module) {
    if (currentLevel === 0) return false;
    if (mutedModules.has(module)) return false;
    return LEVELS[level] <= currentLevel;
  }

  function format(module, args) {
    return [`[${module}]`, ...args];
  }

  function createLogger(module) {
    return {
      log:     (...a) => { if (shouldLog('debug', module)) console.log(...format(module, a)); },
      info:    (...a) => { if (shouldLog('info',  module)) console.info(...format(module, a)); },
      warn:    (...a) => { if (shouldLog('warn',  module)) console.warn(...format(module, a)); },
      error:   (...a) => { console.error(...format(module, a)); },
      success: (...a) => { if (shouldLog('info',  module)) console.log('%c✅', 'color:#10b981', ...format(module, a)); },
      group:   (label) => { if (shouldLog('debug', module)) console.group(`[${module}] ${label}`); },
      groupEnd: () => { if (shouldLog('debug', module)) console.groupEnd(); },
    };
  }

  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    group: console.group.bind(console),
    groupEnd: console.groupEnd.bind(console),
  };

  function detectModule(args) {
    if (!args.length) return 'App';
    const first = args[0];
    if (typeof first === 'string') {
      const m = first.match(/^\[([^\]]+)\]/);
      if (m) return m[1];
    }
    return 'App';
  }

  console.log = (...args) => {
    const module = detectModule(args);
    if (shouldLog('debug', module)) original.log(...args);
  };
  console.info = (...args) => {
    const module = detectModule(args);
    if (shouldLog('info', module)) original.info(...args);
  };
  console.warn = (...args) => {
    const module = detectModule(args);
    if (shouldLog('warn', module)) original.warn(...args);
  };
  console.error = (...args) => { original.error(...args); };
  console.group = (...args) => {
    const module = detectModule(args);
    if (shouldLog('debug', module)) original.group(...args);
  };
  console.groupEnd = (...args) => { original.groupEnd(...args); };

  window.Logger = {
    create: createLogger,
    isDev,
    level: Object.keys(LEVELS).find(k => LEVELS[k] === currentLevel),
    mute:   (m) => mutedModules.add(m),
    unmute: (m) => mutedModules.delete(m),
  };
  window.createLogger = createLogger;

  if (!isDev) {
    original.log(
      '%cZero Satus — modo produção (logs silenciados). Use ?debug=1 para depurar.',
      'color:#8b5cf6; font-weight:bold;'
    );
  }
})();