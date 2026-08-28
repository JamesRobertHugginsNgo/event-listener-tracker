import EventListenerTracker from './event-listener-tracker.js';

import assert from 'node:assert';
import test, { describe } from 'node:test';

describe('listener-tracker.test.js', () => {
	test('add listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.addListener('change', listener);

		assert.strictEqual(listener, result);
		assert.strictEqual(tracker._map.get('change').size, 1);
		assert.ok(tracker.hasType('change'));
	});

	test('add 2 listeners', () => {
		const tracker = new EventListenerTracker();
		const listener1 = () => void 0;
		const listener2 = () => void 0;

		const result1 = tracker.addListener('change', listener1);
		const result2 = tracker.addListener('change', listener2);

		assert.strictEqual(listener1, result1);
		assert.strictEqual(listener2, result2);
		assert.strictEqual(tracker._map.get('change').size, 2);
		assert.ok(tracker.hasType('change'));
	});

	test('add listener twice', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.addListener('change', listener);
		tracker.addListener('change', listener);

		assert.strictEqual(tracker._map.get('change').size, 1);
		assert.ok(tracker.hasType('change'));
	});

	test('add listener as captured and non captured resulting in two listeners', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.addListener('change', listener);
		tracker.addListener('change', listener, { capture: true });

		const typeMap = tracker._map.get('change');
		assert.strictEqual(typeMap.size, 1);

		const listenerMap = typeMap.get(listener);
		assert.ok(listenerMap.has(true));
		assert.ok(listenerMap.has(false));

		assert.ok(tracker.hasType('change'));
	});

	test('add "once" listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.addListener('change', listener, { once: true });

		assert.notStrictEqual(listener, result);
		assert.strictEqual(tracker._map.get('change').size, 1);
		assert.ok(tracker.hasType('change'));
	});

	test('add "once" listener then resolve by calling resulting listener ending with no listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.addListener('change', listener, { once: true });
		result();

		assert.ok(!tracker._map.has('change'));
		assert.ok(!tracker.hasType('change'));
	});

	test('add listener then abort ending with no listener', () => {
		const tracker = new EventListenerTracker();
		const abortController = new AbortController();
		const listener = () => void 0;

		tracker.addListener('change', listener, { signal: abortController.signal });
		abortController.abort();

		assert.ok(!tracker.hasType('change'));
	});

	test('add listener after abort ending with no listener', () => {
		const tracker = new EventListenerTracker();
		const abortController = new AbortController();
		const listener = () => void 0;

		abortController.abort();
		const result = tracker.addListener('change', listener, { signal: abortController.signal });

		assert.strictEqual(result, undefined);
		assert.ok(!tracker.hasType('change'));
	});

	test('remove listener', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.addListener('change', listener);
		tracker.removeListener('change', listener);

		assert.ok(!tracker._map.has('change'));
		assert.ok(!tracker.hasType('change'));
	});

	test('remove non existing listener ending with no error', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		const result = tracker.removeListener('change', listener);

		assert.strictEqual(result, undefined);
		assert.ok(!tracker.hasType('change'));
	});

	test('remove one of two added listeners (captured and non captured)', () => {
		const tracker = new EventListenerTracker();
		const listener = () => void 0;

		tracker.addListener('change', listener);
		tracker.addListener('change', listener, { capture: true });
		tracker.removeListener('change', listener, { capture: true });

		const typeMap = tracker._map.get('change');
		assert.strictEqual(typeMap.size, 1);

		const listenerMap = typeMap.get(listener);
		assert.ok(!listenerMap.has(true));
		assert.ok(listenerMap.has(false));

		assert.ok(tracker.hasType('change'));
	});
});
