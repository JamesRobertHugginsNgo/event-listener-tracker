import EventListenerTracker from './event-listener-tracker.js';

import assert from 'node:assert';
import test, { describe } from 'node:test';

describe('event-listener-tracker.test.js', () => {
	test('set event listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.set('change', listener);

		assert.strictEqual(listener, result);
		assert.strictEqual(tracker._map.get('change').size, 1);
		assert.ok(tracker.has('change'));
		assert.ok(tracker.has('change', listener));
		assert.ok(tracker.has('change', listener, false));
	});

	test('set 2 event listeners', () => {
		const tracker = new EventListenerTracker();
		const listener1 = () => void 0;
		const listener2 = () => void 0;

		const result1 = tracker.set('change', listener1);
		const result2 = tracker.set('change', listener2);

		assert.strictEqual(listener1, result1);
		assert.strictEqual(listener2, result2);
		assert.strictEqual(tracker._map.get('change').size, 2);
	});

	test('set a listener twice', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.set('change', listener);
		tracker.set('change', listener);

		assert.strictEqual(tracker._map.get('change').size, 1);
	});

	test('set a listener as captured and non captured', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.set('change', listener);
		tracker.set('change', listener, { capture: true });

		const typeMap = tracker._map.get('change');
		assert.strictEqual(typeMap.size, 1);

		const listenerMap = typeMap.get(listener);
		assert.ok(listenerMap.has(true));
		assert.ok(listenerMap.has(false));

		assert.ok(tracker.has('change', listener, true));
		assert.ok(tracker.has('change', listener, { capture: false }));
	});

	test('set a "once" listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.set('change', listener, { once: true });

		assert.notStrictEqual(listener, result);
		assert.strictEqual(tracker._map.get('change').size, 1);
		assert.ok(tracker.has('change'));
	});

	test('set a "once" listener then calling it', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.set('change', listener, { once: true });
		result();

		assert.ok(!tracker._map.has('change'));
		assert.ok(!tracker.has('change'));
	});

	test('set a listener then trigger abort', () => {
		const tracker = new EventListenerTracker();
		const abortController = new AbortController();
		const listener = () => void 0;

		tracker.set('change', listener, { signal: abortController.signal });
		abortController.abort();

		assert.ok(!tracker.has('change'));
	});

	test('add listener after abort ending with no listener', () => {
		const tracker = new EventListenerTracker();
		const abortController = new AbortController();
		const listener = () => void 0;

		abortController.abort();
		const result = tracker.set('change', listener, { signal: abortController.signal });

		assert.strictEqual(result, undefined);
		assert.ok(!tracker.has('change'));
	});

	test('delete a listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.set('change', listener);
		tracker.delete('change', listener);

		assert.ok(!tracker._map.has('change'));
		assert.ok(!tracker.has('change'));
	});

	test('delete a non existing listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.delete('change', listener);

		assert.strictEqual(result, undefined);
		assert.ok(!tracker.has('change'));
	});

	test('delete one of two added listeners (captured and non captured)', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.set('change', listener);
		tracker.set('change', listener, { capture: true });
		tracker.delete('change', listener, { capture: true });

		const typeMap = tracker._map.get('change');
		assert.strictEqual(typeMap.size, 1);

		const listenerMap = typeMap.get(listener);
		assert.ok(!listenerMap.has(true));
		assert.ok(listenerMap.has(false));

		assert.ok(tracker.has('change'));
	});
});
