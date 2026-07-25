import { afterEach, describe, expect, it, vi } from 'vitest';

import { serializeError } from '@src/foundation/errors';
import {
  CircularMarker,
  DefaultLogLevel,
  DefaultMaxRedactDepth,
  DefaultRedactionMask,
  LogLevel,
  LogLevelSeverity,
  TruncatedMarker,
  UnreadableMarker,
  consoleLogSink,
  createLogger,
  isLevelEnabled,
  isLogLevel,
  memoryLogSink,
  redactContext,
  type LogContext,
  type LogRecord,
  type LogSink,
  type MemoryLogSink,
} from '@src/foundation/logger';

/** Freezes the clock so every asserted record carries a known timestamp. */
const at = (timestamp: number) => () => timestamp;

/** Reads the first captured record — throws rather than letting `undefined` slip into an assertion. */
const first = (sink: MemoryLogSink): LogRecord => {
  const record = sink.records.at(0);
  if (record === undefined) throw new Error('expected at least one record');
  return record;
};

/** Lists the messages a sink captured, in order. */
const messages = (sink: MemoryLogSink): readonly string[] => sink.records.map((record) => record.message);

/** Builds a sink whose `write` always throws — the broken third-party destination. */
const throwingSink = (error: unknown, name = 'broken'): LogSink => ({
  name,
  write: () => {
    throw error;
  },
});

/** Builds an object whose only enumerable property throws when read. */
const withThrowingGetter = (key: string): LogContext => {
  const target: LogContext = {};
  Object.defineProperty(target, key, {
    enumerable: true,
    get: () => {
      throw new Error('getter exploded');
    },
  });
  return target;
};

/** Builds a `Proxy` that throws from every trap the walk could reach. */
const hostileProxy = (): LogContext =>
  new Proxy({} as LogContext, {
    get: () => {
      throw new Error('get trap');
    },
    ownKeys: () => {
      throw new Error('ownKeys trap');
    },
    getPrototypeOf: () => {
      throw new Error('getPrototypeOf trap');
    },
    has: () => {
      throw new Error('has trap');
    },
  });

/** Nests `leaf` under `levels` layers of `{ nested: … }`. */
const nest = (levels: number, leaf: LogContext): LogContext => {
  let node: LogContext = leaf;
  for (let index = 0; index < levels; index += 1) node = { nested: node };
  return node;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LogLevel — ordering and threshold', () => {
  it('orders severities trace < debug < info < warn < error', () => {
    const ordered = [LogLevel.Trace, LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error];
    const severities = ordered.map((level) => LogLevelSeverity[level]);

    expect(severities).toEqual([...severities].sort((left, right) => left - right));
    expect(new Set(severities).size).toBe(ordered.length);
  });

  it('passes a level at or above the threshold and drops one below', () => {
    expect(isLevelEnabled(LogLevel.Warn, LogLevel.Info)).toBe(true);
    expect(isLevelEnabled(LogLevel.Info, LogLevel.Info)).toBe(true);
    expect(isLevelEnabled(LogLevel.Debug, LogLevel.Info)).toBe(false);
  });

  it('drops every level against a silent threshold, silent included', () => {
    expect(isLevelEnabled(LogLevel.Error, LogLevel.Silent)).toBe(false);
    expect(isLevelEnabled(LogLevel.Trace, LogLevel.Silent)).toBe(false);
    expect(isLevelEnabled(LogLevel.Silent, LogLevel.Silent)).toBe(false);
  });

  it('never passes silent as an emitted level, even against the lowest threshold', () => {
    expect(isLevelEnabled(LogLevel.Silent, LogLevel.Trace)).toBe(false);
  });

  it('recognizes known levels and rejects anything else, prototype members included', () => {
    expect(isLogLevel('info')).toBe(true);
    expect(isLogLevel(LogLevel.Silent)).toBe(true);
    expect(isLogLevel('verbose')).toBe(false);
    expect(isLogLevel('toString')).toBe(false);
    expect(isLogLevel(30)).toBe(false);
    expect(isLogLevel(undefined)).toBe(false);
  });
});

describe('createLogger — level threshold', () => {
  it('defaults to info, dropping trace and debug', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink] });

    logger.trace('t');
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(logger.getLevel()).toBe(DefaultLogLevel);
    expect(messages(sink)).toEqual(['i', 'w', 'e']);
  });

  it('emits everything at the trace threshold', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], level: LogLevel.Trace });

    logger.trace('t');
    logger.debug('d');
    logger.info('i');

    expect(messages(sink)).toEqual(['t', 'd', 'i']);
  });

  it('drops every call at the silent threshold', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], level: LogLevel.Silent });

    logger.trace('t');
    logger.info('i');
    logger.error('e', new Error('boom'));

    expect(sink.records).toEqual([]);
  });

  it('never reaches a sink for a suppressed call', () => {
    const onError = vi.fn();
    const logger = createLogger({ sinks: [throwingSink(new Error('sink'))], level: LogLevel.Error, onError });

    expect(() => logger.debug('suppressed')).not.toThrow();
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports whether a level would currently be emitted', () => {
    const logger = createLogger({ level: LogLevel.Warn });

    expect(logger.isEnabled(LogLevel.Info)).toBe(false);
    expect(logger.isEnabled(LogLevel.Warn)).toBe(true);
    expect(logger.isEnabled(LogLevel.Error)).toBe(true);
  });

  it('ignores an unrecognized level in the options, falling back to the default', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], level: 'verbose' as LogLevel });

    logger.info('kept');

    expect(logger.getLevel()).toBe(DefaultLogLevel);
    expect(messages(sink)).toEqual(['kept']);
  });
});

describe('createLogger — fan-out', () => {
  it('delivers one record to every sink', () => {
    const firstSink = memoryLogSink();
    const secondSink = memoryLogSink();
    const logger = createLogger({ sinks: [firstSink, secondSink], now: at(1_000) });

    logger.info('shipped', { orderId: 7 });

    const expected = { level: LogLevel.Info, message: 'shipped', timestamp: 1_000, context: { orderId: 7 } };
    expect(first(firstSink)).toEqual(expected);
    expect(first(secondSink)).toEqual(expected);
  });

  it('shares the same record object across the fan-out', () => {
    const firstSink = memoryLogSink();
    const secondSink = memoryLogSink();
    createLogger({ sinks: [firstSink, secondSink] }).warn('once');

    expect(first(firstSink)).toBe(first(secondSink));
  });

  it('stamps an empty context rather than omitting it', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink], now: at(5) }).info('bare');

    expect(first(sink).context).toEqual({});
    expect(first(sink).error).toBeUndefined();
  });

  it('is a no-op with no sinks registered', () => {
    const logger = createLogger();

    expect(() => logger.error('nowhere', new Error('boom'))).not.toThrow();
  });

  it('ignores a later mutation of the caller’s sink array', () => {
    const sink = memoryLogSink();
    const sinks: LogSink[] = [sink];
    const logger = createLogger({ sinks });

    sinks.push(throwingSink(new Error('added late')));
    logger.info('safe');

    expect(messages(sink)).toEqual(['safe']);
  });
});

describe('createLogger — sink isolation', () => {
  it('absorbs a throwing sink and still delivers to the others', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [throwingSink(new Error('down')), sink] });

    expect(() => logger.info('survives')).not.toThrow();
    expect(messages(sink)).toEqual(['survives']);
  });

  it('routes a sink failure to onError with the sink and the record', () => {
    const failure = new Error('sink down');
    const broken = throwingSink(failure);
    const onError = vi.fn();
    createLogger({ sinks: [broken], onError, now: at(9) }).warn('degraded', { attempt: 2 });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure, {
      sink: broken,
      record: { level: LogLevel.Warn, message: 'degraded', timestamp: 9, context: { attempt: 2 } },
    });
  });

  it('swallows an onError that itself throws', () => {
    const logger = createLogger({
      sinks: [throwingSink(new Error('sink'))],
      onError: () => {
        throw new Error('handler exploded');
      },
    });

    expect(() => logger.error('still safe')).not.toThrow();
  });

  it('swallows a sink failure when no onError was supplied', () => {
    const logger = createLogger({ sinks: [throwingSink('a thrown string')] });

    expect(() => logger.info('quiet')).not.toThrow();
  });
});

describe('createLogger — child context', () => {
  it('merges the parent context into every child record', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { service: 'checkout' } });

    logger.child({ requestId: 'r-1' }).info('handled');

    expect(first(sink).context).toEqual({ service: 'checkout', requestId: 'r-1' });
  });

  it('composes nested children, keeping every ancestor field', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { service: 'checkout' } });

    logger.child({ requestId: 'r-1' }).child({ step: 'payment' }).child({ attempt: 2 }).info('deep');

    expect(first(sink).context).toEqual({ service: 'checkout', requestId: 'r-1', step: 'payment', attempt: 2 });
  });

  it('lets the nearer scope win on a key conflict', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { scope: 'root', service: 'checkout' } });

    logger.child({ scope: 'child' }).child({ scope: 'grandchild' }).info('conflict');

    expect(first(sink).context).toEqual({ scope: 'grandchild', service: 'checkout' });
  });

  it('lets the call site outrank every bound context', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { scope: 'root' } });

    logger.child({ scope: 'child' }).info('call wins', { scope: 'call' });

    expect(first(sink).context).toEqual({ scope: 'call' });
  });

  it('leaves the parent untouched when a child binds fields', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { service: 'checkout' } });

    logger.child({ requestId: 'r-1' }).info('child');
    logger.info('parent');

    expect(sink.records.map((record) => record.context)).toEqual([
      { service: 'checkout', requestId: 'r-1' },
      { service: 'checkout' },
    ]);
  });

  it('shares one level cell with the whole tree, so setLevel is a single dial', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink] });
    const grandchild = logger.child({ a: 1 }).child({ b: 2 });

    grandchild.debug('dropped');
    logger.setLevel(LogLevel.Debug);
    grandchild.debug('kept');

    expect(grandchild.getLevel()).toBe(LogLevel.Debug);
    expect(messages(sink)).toEqual(['kept']);
  });

  it('propagates a child’s setLevel back up the tree', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink] });

    logger.child({ a: 1 }).setLevel(LogLevel.Error);
    logger.info('dropped');
    logger.error('kept');

    expect(messages(sink)).toEqual(['kept']);
  });

  it('redacts fields bound on a child, not only call-site ones', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).child({ token: 'child-token' }).info('bound');

    expect(first(sink).context).toEqual({ token: DefaultRedactionMask });
  });
});

describe('createLogger — setLevel at runtime', () => {
  it('lowers the threshold to let suppressed levels through', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink] });

    logger.debug('before');
    logger.setLevel(LogLevel.Trace);
    logger.trace('after');

    expect(messages(sink)).toEqual(['after']);
  });

  it('raises the threshold to drop what used to pass', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], level: LogLevel.Trace });

    logger.info('before');
    logger.setLevel(LogLevel.Error);
    logger.info('after');

    expect(messages(sink)).toEqual(['before']);
  });

  it('ignores an unknown level instead of silently muting the logger', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink] });

    logger.setLevel('loud' as LogLevel);
    logger.info('still emitted');

    expect(logger.getLevel()).toBe(LogLevel.Info);
    expect(messages(sink)).toEqual(['still emitted']);
  });
});

describe('createLogger — error logging', () => {
  it('serializes the error through serializeError', () => {
    const sink = memoryLogSink();
    const failure = new TypeError('bad input');
    createLogger({ sinks: [sink] }).error('save failed', failure);

    expect(first(sink).error).toEqual(serializeError(failure));
    expect(first(sink).error?.name).toBe('TypeError');
    expect(first(sink).error?.message).toBe('bad input');
  });

  it('keeps the serialized cause chain', () => {
    const sink = memoryLogSink();
    const failure = new Error('outer', { cause: new Error('inner') });
    createLogger({ sinks: [sink] }).error('wrapped', failure);

    expect(first(sink).error).toEqual(serializeError(failure));
    expect(first(sink).error?.cause?.message).toBe('inner');
  });

  it('serializes a non-Error thrown value into the same shape', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).error('threw a string', 'boom');

    // `serializeError` normalizes a stackless value by constructing an `Error`, which captures the stack
    // where it runs — so the stack is the one member two calls on the same input legitimately differ on.
    const { stack, ...identity } = serializeError('boom');
    expect(stack).toBeDefined();
    expect(first(sink).error).toMatchObject(identity);
    expect(first(sink).error?.stack).toContain('boom');
  });

  it('takes an error-like plain object as the error, not as context', () => {
    const sink = memoryLogSink();
    const thrown = { message: 'from another realm', name: 'RealmError' };
    createLogger({ sinks: [sink] }).error('caught', thrown);

    const { stack, ...identity } = serializeError(thrown);
    expect(stack).toBeDefined();
    expect(first(sink).error).toMatchObject(identity);
    expect(first(sink).context).toEqual({});
  });

  it('takes a plain, non-error-like object as context', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).error('validation failed', { field: 'email' });

    expect(first(sink).context).toEqual({ field: 'email' });
    expect(first(sink).error).toBeUndefined();
  });

  it('accepts an error and a context together', () => {
    const sink = memoryLogSink();
    const failure = new Error('timeout');
    createLogger({ sinks: [sink] }).error('call failed', failure, { endpoint: '/orders' });

    expect(first(sink).context).toEqual({ endpoint: '/orders' });
    expect(first(sink).error).toEqual(serializeError(failure));
  });

  it('treats an explicit undefined error as the context disambiguator', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).error('no error here', undefined, { message: 'a context field' });

    expect(first(sink).context).toEqual({ message: 'a context field' });
    expect(first(sink).error).toBeUndefined();
  });

  it('omits the error member entirely when none was logged', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).error('plain');

    expect('error' in first(sink)).toBe(false);
  });

  it('redacts the context of an error call as well', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).error('auth failed', new Error('401'), { authorization: 'Bearer abc' });

    expect(first(sink).context).toEqual({ authorization: DefaultRedactionMask });
  });
});

describe('redactContext — masking', () => {
  it('masks a top-level match and leaves everything else', () => {
    expect(redactContext({ userId: 7, password: 'hunter2' })).toEqual({
      userId: 7,
      password: DefaultRedactionMask,
    });
  });

  it('masks every default key', () => {
    const redacted = redactContext({
      password: 'p',
      token: 't',
      secret: 's',
      authorization: 'a',
      apiKey: 'k',
    });

    expect(Object.values(redacted)).toEqual(Array<string>(5).fill(DefaultRedactionMask));
  });

  it('matches keys case-insensitively', () => {
    expect(redactContext({ PASSWORD: 'p', Authorization: 'a', ApiKey: 'k', ToKeN: 't' })).toEqual({
      PASSWORD: DefaultRedactionMask,
      Authorization: DefaultRedactionMask,
      ApiKey: DefaultRedactionMask,
      ToKeN: DefaultRedactionMask,
    });
  });

  it('masks nested matches at any depth', () => {
    const redacted = redactContext({
      request: { headers: { authorization: 'Bearer abc' }, path: '/orders' },
      user: { id: 3, credentials: { password: 'hunter2' } },
    });

    expect(redacted).toEqual({
      request: { headers: { authorization: DefaultRedactionMask }, path: '/orders' },
      user: { id: 3, credentials: { password: DefaultRedactionMask } },
    });
  });

  it('masks matches inside arrays', () => {
    expect(redactContext({ attempts: [{ token: 'one' }, { token: 'two' }] })).toEqual({
      attempts: [{ token: DefaultRedactionMask }, { token: DefaultRedactionMask }],
    });
  });

  it('replaces a matched key wholesale instead of walking its value', () => {
    expect(redactContext({ secret: { nested: { deep: 'value' } } })).toEqual({ secret: DefaultRedactionMask });
  });

  it('takes custom keys in place of the defaults, and a custom mask', () => {
    expect(redactContext({ ssn: '000', password: 'kept' }, ['SSN'], '***')).toEqual({
      ssn: '***',
      password: 'kept',
    });
  });

  it('redacts nothing when given an empty key list', () => {
    expect(redactContext({ password: 'kept' }, [])).toEqual({ password: 'kept' });
  });

  it('copies rather than mutating the caller’s object', () => {
    const source: LogContext = { password: 'hunter2', nested: { token: 'abc' } };
    const redacted = redactContext(source);

    expect(source.password).toBe('hunter2');
    expect(source.nested).toEqual({ token: 'abc' });
    expect(redacted).not.toBe(source);
  });

  it('passes non-plain values through instead of flattening them to {}', () => {
    const date = new Date(0);
    const redacted = redactContext({ date, count: 1, flag: null });

    expect(redacted.date).toBe(date);
    expect(redacted).toEqual({ date, count: 1, flag: null });
  });

  it('returns {} for a context that is not a plain object', () => {
    expect(redactContext(new Date(0) as unknown as LogContext)).toEqual({});
  });
});

describe('redactContext — hostile input', () => {
  it('cuts a self-reference instead of hanging', { timeout: 2_000 }, () => {
    const circular: LogContext = { name: 'root' };
    circular.self = circular;

    expect(redactContext(circular)).toEqual({ name: 'root', self: CircularMarker });
  });

  it('cuts a mutual reference cycle', { timeout: 2_000 }, () => {
    const left: LogContext = { side: 'left' };
    const right: LogContext = { side: 'right', left };
    left.right = right;

    expect(redactContext(left)).toEqual({
      side: 'left',
      right: { side: 'right', left: CircularMarker },
    });
  });

  it('still redacts through a cycle', { timeout: 2_000 }, () => {
    const circular: LogContext = { token: 'abc' };
    circular.self = circular;

    expect(redactContext(circular)).toEqual({ token: DefaultRedactionMask, self: CircularMarker });
  });

  it('renders a value repeated across siblings rather than calling the second one circular', () => {
    const shared: LogContext = { id: 7 };

    expect(redactContext({ left: shared, right: shared })).toEqual({ left: { id: 7 }, right: { id: 7 } });
  });

  it('produces a result that survives JSON.stringify', () => {
    const circular: LogContext = { name: 'root' };
    circular.self = circular;

    expect(() => JSON.stringify(redactContext(circular))).not.toThrow();
  });

  it('marks a property whose getter throws', () => {
    expect(redactContext(withThrowingGetter('boom'))).toEqual({ boom: UnreadableMarker });
  });

  it('marks a nested property whose getter throws', () => {
    expect(redactContext({ nested: withThrowingGetter('boom') })).toEqual({
      nested: { boom: UnreadableMarker },
    });
  });

  it('truncates fail-closed past the depth cap, leaking nothing below it', () => {
    const redacted = redactContext(nest(DefaultMaxRedactDepth + 4, { password: 'hunter2' }));
    const serialized = JSON.stringify(redacted);

    expect(serialized).toContain(TruncatedMarker);
    expect(serialized).not.toContain('hunter2');
  });

  it('keeps a value that sits just inside the depth cap', () => {
    const redacted = redactContext(nest(DefaultMaxRedactDepth - 2, { keep: 'visible' }));

    expect(JSON.stringify(redacted)).toContain('visible');
  });

  it('degrades a hostile proxy to {} instead of throwing', () => {
    expect(() => redactContext(hostileProxy())).not.toThrow();
    expect(redactContext(hostileProxy())).toEqual({});
  });
});

describe('createLogger — redaction through the emit path', () => {
  it('redacts before any sink is called', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink] }).info('login', {
      email: 'a@b.c',
      password: 'hunter2',
      headers: { Authorization: 'Bearer abc' },
    });

    expect(first(sink).context).toEqual({
      email: 'a@b.c',
      password: DefaultRedactionMask,
      headers: { Authorization: DefaultRedactionMask },
    });
  });

  it('honours custom redactKeys and mask options', () => {
    const sink = memoryLogSink();
    createLogger({ sinks: [sink], redactKeys: ['ssn'], redactionMask: '<hidden>' }).info('kyc', {
      ssn: '000-00-0000',
      password: 'not-configured',
    });

    expect(first(sink).context).toEqual({ ssn: '<hidden>', password: 'not-configured' });
  });

  it('does not mutate the context object the caller passed', () => {
    const sink = memoryLogSink();
    const context: LogContext = { token: 'abc' };
    createLogger({ sinks: [sink] }).info('call', context);

    expect(context.token).toBe('abc');
    expect(first(sink).context).toEqual({ token: DefaultRedactionMask });
  });

  it('emits a cycle-free record for a circular context', { timeout: 2_000 }, () => {
    const sink = memoryLogSink();
    const circular: LogContext = { name: 'root' };
    circular.self = circular;

    createLogger({ sinks: [sink] }).info('cyclic', circular);

    // Merging copies the top level, so the cycle closes one step in: the copy's `self` is the ORIGINAL
    // object, and that object's own `self` is the first repeat the walk recognizes.
    expect(first(sink).context).toEqual({ name: 'root', self: { name: 'root', self: CircularMarker } });
    expect(() => JSON.stringify(first(sink))).not.toThrow();
  });
});

describe('createLogger — no method throws', () => {
  it('survives a hostile context on every level method', () => {
    const logger = createLogger({ sinks: [memoryLogSink()], level: LogLevel.Trace });
    const hostile = hostileProxy();

    expect(() => logger.trace('t', hostile)).not.toThrow();
    expect(() => logger.debug('d', hostile)).not.toThrow();
    expect(() => logger.info('i', hostile)).not.toThrow();
    expect(() => logger.warn('w', hostile)).not.toThrow();
    expect(() => logger.error('e', hostile)).not.toThrow();
  });

  it('still emits the line when a call-site context is unusable', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { service: 'checkout' } });

    expect(() => logger.info('kept', withThrowingGetter('boom'))).not.toThrow();
    expect(first(sink)).toMatchObject({ message: 'kept', context: { service: 'checkout' } });
  });

  it('survives a clock that throws', () => {
    const logger = createLogger({
      sinks: [memoryLogSink()],
      now: () => {
        throw new Error('no clock');
      },
    });

    expect(() => logger.info('timeless')).not.toThrow();
  });

  it('survives every sink throwing at once', () => {
    const logger = createLogger({
      sinks: [throwingSink(new Error('one'), 'a'), throwingSink('two', 'b'), throwingSink(null, 'c')],
    });

    expect(() => logger.error('all down', new Error('root cause'))).not.toThrow();
  });

  it('survives a hostile child context and keeps the child usable', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink], context: { service: 'checkout' } });

    const child = ((): ReturnType<typeof logger.child> => {
      expect(() => logger.child(hostileProxy())).not.toThrow();
      return logger.child(hostileProxy());
    })();

    expect(() => child.info('still logs')).not.toThrow();
    expect(first(sink).context).toEqual({ service: 'checkout' });
  });

  it('survives a hostile base context passed to the factory', () => {
    const sink = memoryLogSink();

    expect(() => createLogger({ sinks: [sink], context: hostileProxy() })).not.toThrow();
    createLogger({ sinks: [sink], context: hostileProxy() }).info('built');

    expect(first(sink).context).toEqual({});
  });

  it('survives hostile values in the error slot', () => {
    const logger = createLogger({ sinks: [memoryLogSink()] });
    const selfReferencing = new Error('outer');
    Object.assign(selfReferencing, { cause: selfReferencing });

    expect(() => logger.error('cyclic cause', selfReferencing)).not.toThrow();
    expect(() => logger.error('null thrown', null)).not.toThrow();
    expect(() => logger.error('proxy thrown', hostileProxy())).not.toThrow();
  });

  it('survives a non-string message from an untyped caller', () => {
    const logger = createLogger({ sinks: [memoryLogSink()] });

    expect(() => logger.info(42 as unknown as string)).not.toThrow();
    expect(() => logger.info(undefined as unknown as string)).not.toThrow();
  });

  it('survives garbage passed to setLevel', () => {
    const logger = createLogger({ sinks: [memoryLogSink()] });

    expect(() => logger.setLevel(null as unknown as LogLevel)).not.toThrow();
    expect(() => logger.setLevel({} as unknown as LogLevel)).not.toThrow();
    expect(logger.getLevel()).toBe(LogLevel.Info);
  });
});

describe('consoleLogSink', () => {
  it('routes each level to its own console method', () => {
    const trace = vi.spyOn(console, 'trace').mockImplementation(() => {});
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger({ sinks: [consoleLogSink()], level: LogLevel.Trace });

    logger.trace('t');
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(trace).toHaveBeenCalledWith('[log] t');
    expect(debug).toHaveBeenCalledWith('[log] d');
    expect(info).toHaveBeenCalledWith('[log] i');
    expect(warn).toHaveBeenCalledWith('[log] w');
    expect(error).toHaveBeenCalledWith('[log] e');
  });

  it('passes context and error as separate arguments, and only when present', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('boom');
    const logger = createLogger({ sinks: [consoleLogSink()] });

    logger.info('bare');
    logger.info('with context', { orderId: 7 });
    logger.error('with both', failure, { orderId: 7 });

    expect(info).toHaveBeenNthCalledWith(1, '[log] bare');
    expect(info).toHaveBeenNthCalledWith(2, '[log] with context', { orderId: 7 });
    expect(error).toHaveBeenCalledWith('[log] with both', { orderId: 7 }, serializeError(failure));
  });

  it('takes a custom prefix, and drops the separator for an empty one', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    createLogger({ sinks: [consoleLogSink({ prefix: '[checkout]' })] }).info('tagged');
    createLogger({ sinks: [consoleLogSink({ prefix: '' })] }).info('untagged');

    expect(info).toHaveBeenNthCalledWith(1, '[checkout] tagged');
    expect(info).toHaveBeenNthCalledWith(2, 'untagged');
  });

  it('reads console at call time, so a stub installed after construction is used', () => {
    const sink = consoleLogSink();
    const logger = createLogger({ sinks: [sink] });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('late stub');

    expect(info).toHaveBeenCalledTimes(1);
  });
});

describe('memoryLogSink', () => {
  it('captures records in order and clears on reset', () => {
    const sink = memoryLogSink();
    const logger = createLogger({ sinks: [sink] });

    logger.info('one');
    logger.warn('two');
    expect(messages(sink)).toEqual(['one', 'two']);

    sink.reset();
    expect(sink.records).toEqual([]);

    logger.error('three');
    expect(messages(sink)).toEqual(['three']);
  });

  it('names itself for onError reporting', () => {
    expect(memoryLogSink().name).toBe('memory');
    expect(consoleLogSink().name).toBe('console');
  });
});
