import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAbortError } from '@src/foundation/errors';
import { UploadHttpError, xhrUploadTransport, type UploadTransportContext } from '@src/foundation/uploads';

// Node project — `XMLHttpRequest` does not exist here, which is exactly what makes the stub total: the transport
// can only touch the API surface `FakeXhr` implements, so an accidental reliance on a real browser behaviour
// shows up as a crash rather than passing silently.
//
// The stub is event-driven like the real thing (`addEventListener` + a `fire` the test drives), because that is
// the part with the interesting behaviour: which event wins the race to settle the promise. `xhr.abort()` fires
// `abort` on the instance, so the "abort during flight" path exercises both the signal listener and the
// instance event, proving the settle-once latch rather than assuming it.

/** A minimal event target — the two `addEventListener` surfaces the transport uses (`xhr` and `xhr.upload`). */
class FakeEventTarget {
  readonly handlers = new Map<string, ((event: unknown) => void)[]>();

  addEventListener(type: string, handler: (event: unknown) => void): void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  fire(type: string, event: unknown = {}): void {
    for (const handler of [...(this.handlers.get(type) ?? [])]) handler(event);
  }
}

/** A stand-in for `XMLHttpRequest` recording what the transport did to it. */
class FakeXhr extends FakeEventTarget {
  static instances: FakeXhr[] = [];

  readonly upload = new FakeEventTarget();
  readonly headers: Record<string, string> = {};
  method = '';
  url = '';
  withCredentials = false;
  status = 200;
  responseText = '';
  body: unknown;
  sent = false;
  aborted = false;

  constructor() {
    super();
    FakeXhr.instances.push(this);
  }

  /** The instance the transport under test created. */
  static get last(): FakeXhr {
    const instance = FakeXhr.instances.at(-1);
    if (instance === undefined) throw new Error('No XMLHttpRequest was created.');
    return instance;
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  send(body: unknown): void {
    this.sent = true;
    this.body = body;
  }

  abort(): void {
    this.aborted = true;
    this.fire('abort');
  }

  /** Completes the request with a status + body, as the real `load` event does. */
  respond(status: number, responseText = ''): void {
    this.status = status;
    this.responseText = responseText;
    this.fire('load');
  }
}

/** Installs the stub and returns a context whose signal the test controls. */
function setup(): { context: UploadTransportContext; controller: AbortController; onProgress: ReturnType<typeof vi.fn> } {
  const controller = new AbortController();
  const onProgress = vi.fn();
  return { context: { signal: controller.signal, onProgress }, controller, onProgress };
}

function makeFile(name = 'a.txt', size = 10, type = 'text/plain'): File {
  return new File([new Uint8Array(size)], name, { type });
}

vi.stubGlobal('XMLHttpRequest', FakeXhr);

afterEach(() => {
  FakeXhr.instances = [];
});

describe('xhrUploadTransport — request shape', () => {
  it('POSTs multipart with the file under the default field name', () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const file = makeFile('report.pdf');

    void transport.upload(file, setup().context);

    const request = FakeXhr.last;
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/api/files');
    expect(request.sent).toBe(true);
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('honours method, fieldName, headers, and withCredentials', () => {
    const transport = xhrUploadTransport({
      url: '/api/files',
      method: 'PUT',
      fieldName: 'attachment',
      headers: { 'X-Tenant': 'acme' },
      withCredentials: true,
    });

    void transport.upload(makeFile(), setup().context);

    const request = FakeXhr.last;
    expect(request.method).toBe('PUT');
    expect(request.withCredentials).toBe(true);
    expect(request.headers['X-Tenant']).toBe('acme');
    expect((request.body as FormData).get('attachment')).toBeInstanceOf(File);
  });

  it('drops a Content-Type header rather than corrupting the multipart boundary', () => {
    const transport = xhrUploadTransport({
      url: '/api/files',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    void transport.upload(makeFile(), setup().context);

    expect(FakeXhr.last.headers['Content-Type']).toBeUndefined();
    expect(FakeXhr.last.headers['Accept']).toBe('application/json');
  });
});

describe('xhrUploadTransport — progress', () => {
  it('forwards upload progress events with the transport total', () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const { context, onProgress } = setup();

    void transport.upload(makeFile(), context);
    FakeXhr.last.upload.fire('progress', { loaded: 40, total: 120, lengthComputable: true });

    expect(onProgress).toHaveBeenCalledWith(40, 120);
  });

  it('omits the total when the length is not computable', () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const { context, onProgress } = setup();

    void transport.upload(makeFile(), context);
    FakeXhr.last.upload.fire('progress', { loaded: 40, total: 0, lengthComputable: false });

    expect(onProgress).toHaveBeenCalledWith(40, undefined);
  });
});

describe('xhrUploadTransport — outcomes', () => {
  it('resolves a 2xx JSON body as parsed JSON', async () => {
    const transport = xhrUploadTransport<{ id: string }>({ url: '/api/files' });
    const promise = transport.upload(makeFile(), setup().context);

    FakeXhr.last.respond(201, '{"id":"file-1"}');

    await expect(promise).resolves.toEqual({ id: 'file-1' });
  });

  it('resolves a non-JSON body as raw text, and an empty body as undefined', async () => {
    const transport = xhrUploadTransport<string>({ url: '/api/files' });

    const text = transport.upload(makeFile(), setup().context);
    FakeXhr.last.respond(200, 'file-1');
    await expect(text).resolves.toBe('file-1');

    const empty = transport.upload(makeFile(), setup().context);
    FakeXhr.last.respond(204, '');
    await expect(empty).resolves.toBeUndefined();
  });

  it('rejects a non-2xx with an UploadHttpError carrying the status and body', async () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const promise = transport.upload(makeFile('big.bin'), setup().context);

    FakeXhr.last.respond(413, 'payload too large');

    await expect(promise).rejects.toBeInstanceOf(UploadHttpError);
    await promise.catch((error: unknown) => {
      expect(error).toBeInstanceOf(UploadHttpError);
      expect((error as UploadHttpError).status).toBe(413);
      expect((error as UploadHttpError).body).toBe('payload too large');
      expect((error as UploadHttpError).message).toContain('big.bin');
    });
  });

  it('rejects a network error as status 0, which the default policy treats as transient', async () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const promise = transport.upload(makeFile(), setup().context);

    FakeXhr.last.fire('error');

    await promise.catch((error: unknown) => {
      expect((error as UploadHttpError).status).toBe(0);
    });
    await expect(promise).rejects.toBeInstanceOf(UploadHttpError);
  });

  it('rejects a timeout as status 0', async () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const promise = transport.upload(makeFile(), setup().context);

    FakeXhr.last.fire('timeout');

    await promise.catch((error: unknown) => {
      expect((error as UploadHttpError).status).toBe(0);
      expect((error as Error).message).toContain('timed out');
    });
    await expect(promise).rejects.toBeInstanceOf(UploadHttpError);
  });
});

describe('xhrUploadTransport — cancellation', () => {
  it('aborts the request and rejects with an AbortError when the signal fires', async () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const { context, controller } = setup();
    const promise = transport.upload(makeFile(), context);

    controller.abort();

    expect(FakeXhr.last.aborted).toBe(true);
    await promise.catch((error: unknown) => {
      // The recognizer the queue uses to decide "cancelled, do not retry".
      expect(isAbortError(error)).toBe(true);
    });
    await expect(promise).rejects.toThrow('aborted');
  });

  it('rejects immediately without opening a request when the signal is already aborted', async () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const { context, controller } = setup();
    controller.abort();

    const promise = transport.upload(makeFile(), context);

    expect(FakeXhr.instances).toHaveLength(0);
    await promise.catch((error: unknown) => {
      expect(isAbortError(error)).toBe(true);
    });
    await expect(promise).rejects.toThrow('aborted');
  });

  it('settles exactly once when a late load follows an abort', async () => {
    const transport = xhrUploadTransport({ url: '/api/files' });
    const { context, controller } = setup();
    const promise = transport.upload(makeFile(), context);

    controller.abort();
    // A racing engine can still deliver `load`; the latch must keep the abort as the outcome.
    FakeXhr.last.respond(200, '{"id":"late"}');

    await promise.catch((error: unknown) => {
      expect(isAbortError(error)).toBe(true);
    });
    await expect(promise).rejects.toThrow('aborted');
  });
});
