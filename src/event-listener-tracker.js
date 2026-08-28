function normalizeOptions(options) {
	return options !== null && typeof options === 'object'
		? options
		: { capture: options };
}

export default class EventListenerTracker {
	_map = new Map(); // hint: [type][listener][capture] = { listener, signal, signalListener }

	addListener(type, listener, options) {
		const {
			capture = false,
			once = false,
			signal
		} = normalizeOptions(options);

		const isAbortSignal = signal instanceof AbortSignal;
		if (isAbortSignal && signal.aborted) {
			return; // already aborted, don't even add
		}

		if (!this._map.has(type)) {
			this._map.set(type, new Map());
		}

		const typeMap = this._map.get(type);
		if (!typeMap.has(listener)) {
			typeMap.set(listener, new Map());
		}

		const listenerMap = typeMap.get(listener);
		if (!listenerMap.has(capture)) {
			let signalListener;
			if (isAbortSignal) {
				signalListener = () => {
					this.removeListener(type, listener, options);
				};
				signal.addEventListener('abort', signalListener, { once: true });
			}

			if (once) {
				const removeListener = () => {
					this.removeListener(type, listener, options);
				};
				listenerMap.set(capture, {
					listener: function (...args) {
						removeListener();
						return typeof listener === 'function'
							? listener.call(this, ...args)
							: listener.handleEvent(...args);
					},
					signal,
					signalListener
				});
			} else {
				listenerMap.set(capture, { listener, signal, signalListener });
			}
		}

		return listenerMap.get(capture).listener;
	}

	removeListener(type, listener, options) {
		const { capture = false } = normalizeOptions(options);

		let mappedListener;
		if (this._map.has(type)) {
			const typeMap = this._map.get(type);
			if (typeMap.has(listener)) {
				const listenerMap = typeMap.get(listener);
				if (listenerMap.has(capture)) {
					const {
						listener: capturedListener,
						signal,
						signalListener
					} = listenerMap.get(capture);

					mappedListener = capturedListener;

					if (signal instanceof AbortSignal) {
						signal.removeEventListener('abort', signalListener, { once: true });
					}

					listenerMap.delete(capture);
					if (listenerMap.size === 0) {
						typeMap.delete(listener);
						if (typeMap.size === 0) {
							this._map.delete(type);
						}
					}
				}
			}
		}

		return mappedListener;
	}

	hasType(type) {
		return this._map.has(type);
	}
}
