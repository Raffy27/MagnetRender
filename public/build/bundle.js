
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Select.svelte generated by Svelte v3.44.0 */

    const file$4 = "src/components/Select.svelte";

    function create_fragment$4(ctx) {
    	let label_1;
    	let t0;
    	let t1;
    	let div1;
    	let select;
    	let t2;
    	let div0;
    	let svg;
    	let path;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			select = element("select");
    			if (default_slot) default_slot.c();
    			t2 = space();
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(label_1, "class", "block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2");
    			attr_dev(label_1, "for", "grid-state");
    			add_location(label_1, file$4, 5, 0, 62);
    			attr_dev(select, "class", "block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500");
    			if (/*value*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file$4, 9, 1, 209);
    			attr_dev(path, "d", "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z");
    			add_location(path, file$4, 14, 90, 629);
    			attr_dev(svg, "class", "fill-current h-4 w-4");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			add_location(svg, file$4, 14, 1, 540);
    			attr_dev(div0, "class", "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700");
    			add_location(div0, file$4, 13, 1, 441);
    			attr_dev(div1, "class", "relative mb-2");
    			add_location(div1, file$4, 8, 0, 180);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, select);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			select_option(select, /*value*/ ctx[0]);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*value*/ 1) {
    				select_option(select, /*value*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Select', slots, ['default']);
    	let { label } = $$props;
    	let { value = 0 } = $$props;
    	const writable_props = ['label', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ label, value });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, $$scope, slots, select_change_handler];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { label: 1, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<Select> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Input.svelte generated by Svelte v3.44.0 */

    const file$3 = "src/components/Input.svelte";

    // (10:4) {#if unit}
    function create_if_block$1(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("(");
    			t1 = text(/*unit*/ ctx[2]);
    			t2 = text(")");
    			attr_dev(span, "class", "lowercase font-normal");
    			add_location(span, file$3, 10, 8, 227);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*unit*/ 4) set_data_dev(t1, /*unit*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(10:4) {#if unit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*unit*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			attr_dev(span, "class", "uppercase tracking-wide text-gray-700 text-xs font-bold mb-2");
    			add_location(span, file$3, 7, 0, 116);
    			attr_dev(input, "class", "appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*hint*/ ctx[3]);
    			add_location(input, file$3, 13, 0, 297);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			if (if_block) if_block.m(span, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (/*unit*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*hint*/ 8) {
    				attr_dev(input, "placeholder", /*hint*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Input', slots, []);
    	let { label } = $$props;
    	let { value } = $$props;
    	let { unit = '' } = $$props;
    	let { hint = '' } = $$props;
    	const writable_props = ['label', 'value', 'unit', 'hint'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('hint' in $$props) $$invalidate(3, hint = $$props.hint);
    	};

    	$$self.$capture_state = () => ({ label, value, unit, hint });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('hint' in $$props) $$invalidate(3, hint = $$props.hint);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, unit, hint, input_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { label: 1, value: 0, unit: 2, hint: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<Input> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/InputForm.svelte generated by Svelte v3.44.0 */
    const file$2 = "src/InputForm.svelte";

    // (12:1) <Select label="Magnet Type" bind:value={rp.type}>
    function create_default_slot_1(ctx) {
    	let option0;
    	let t1;
    	let option1;
    	let t3;
    	let option2;

    	const block = {
    		c: function create() {
    			option0 = element("option");
    			option0.textContent = "Prism";
    			t1 = space();
    			option1 = element("option");
    			option1.textContent = "Ring";
    			t3 = space();
    			option2 = element("option");
    			option2.textContent = "Cylinder";
    			option0.__value = 0;
    			option0.value = option0.__value;
    			add_location(option0, file$2, 12, 2, 312);
    			option1.__value = 1;
    			option1.value = option1.__value;
    			add_location(option1, file$2, 13, 2, 347);
    			option2.__value = 2;
    			option2.value = option2.__value;
    			add_location(option2, file$2, 14, 2, 381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, option1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, option2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(option1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(option2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(12:1) <Select label=\\\"Magnet Type\\\" bind:value={rp.type}>",
    		ctx
    	});

    	return block;
    }

    // (25:24) 
    function create_if_block_2(ctx) {
    	let input0;
    	let updating_value;
    	let t;
    	let input1;
    	let updating_value_1;
    	let current;

    	function input0_value_binding_2(value) {
    		/*input0_value_binding_2*/ ctx[9](value);
    	}

    	let input0_props = { label: "Radius", unit: "mm", hint: "5" };

    	if (/*rp*/ ctx[0].dim.width !== void 0) {
    		input0_props.value = /*rp*/ ctx[0].dim.width;
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding_2));

    	function input1_value_binding_2(value) {
    		/*input1_value_binding_2*/ ctx[10](value);
    	}

    	let input1_props = { label: "Height", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.height !== void 0) {
    		input1_props.value = /*rp*/ ctx[0].dim.height;
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, 'value', input1_value_binding_2));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t = space();
    			create_component(input1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*rp*/ ctx[0].dim.width;
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				input1_changes.value = /*rp*/ ctx[0].dim.height;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(25:24) ",
    		ctx
    	});

    	return block;
    }

    // (21:24) 
    function create_if_block_1(ctx) {
    	let input0;
    	let updating_value;
    	let t0;
    	let input1;
    	let updating_value_1;
    	let t1;
    	let input2;
    	let updating_value_2;
    	let current;

    	function input0_value_binding_1(value) {
    		/*input0_value_binding_1*/ ctx[6](value);
    	}

    	let input0_props = { label: "Height", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.height !== void 0) {
    		input0_props.value = /*rp*/ ctx[0].dim.height;
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding_1));

    	function input1_value_binding_1(value) {
    		/*input1_value_binding_1*/ ctx[7](value);
    	}

    	let input1_props = { label: "Radius", unit: "mm", hint: "5" };

    	if (/*rp*/ ctx[0].dim.radius !== void 0) {
    		input1_props.value = /*rp*/ ctx[0].dim.radius;
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, 'value', input1_value_binding_1));

    	function input2_value_binding_1(value) {
    		/*input2_value_binding_1*/ ctx[8](value);
    	}

    	let input2_props = {
    		label: "Inner Radius",
    		unit: "mm",
    		hint: "3"
    	};

    	if (/*rp*/ ctx[0].dim.inner !== void 0) {
    		input2_props.value = /*rp*/ ctx[0].dim.inner;
    	}

    	input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, 'value', input2_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t0 = space();
    			create_component(input1.$$.fragment);
    			t1 = space();
    			create_component(input2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(input1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(input2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*rp*/ ctx[0].dim.height;
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				input1_changes.value = /*rp*/ ctx[0].dim.radius;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*rp*/ 1) {
    				updating_value_2 = true;
    				input2_changes.value = /*rp*/ ctx[0].dim.inner;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(input1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(input2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:24) ",
    		ctx
    	});

    	return block;
    }

    // (17:1) {#if rp.type == 0}
    function create_if_block(ctx) {
    	let input0;
    	let updating_value;
    	let t0;
    	let input1;
    	let updating_value_1;
    	let t1;
    	let input2;
    	let updating_value_2;
    	let current;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[3](value);
    	}

    	let input0_props = { label: "Height", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.height !== void 0) {
    		input0_props.value = /*rp*/ ctx[0].dim.height;
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[4](value);
    	}

    	let input1_props = { label: "Width", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.width !== void 0) {
    		input1_props.value = /*rp*/ ctx[0].dim.width;
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, 'value', input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[5](value);
    	}

    	let input2_props = { label: "Depth", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.depth !== void 0) {
    		input2_props.value = /*rp*/ ctx[0].dim.depth;
    	}

    	input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, 'value', input2_value_binding));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t0 = space();
    			create_component(input1.$$.fragment);
    			t1 = space();
    			create_component(input2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(input1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(input2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*rp*/ ctx[0].dim.height;
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				input1_changes.value = /*rp*/ ctx[0].dim.width;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*rp*/ 1) {
    				updating_value_2 = true;
    				input2_changes.value = /*rp*/ ctx[0].dim.depth;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(input1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(input2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(17:1) {#if rp.type == 0}",
    		ctx
    	});

    	return block;
    }

    // (35:3) <Select label="File Type" bind:value={rp.fileType}>
    function create_default_slot(ctx) {
    	let option0;
    	let t1;
    	let option1;
    	let t3;
    	let option2;

    	const block = {
    		c: function create() {
    			option0 = element("option");
    			option0.textContent = "SVG";
    			t1 = space();
    			option1 = element("option");
    			option1.textContent = "JPG";
    			t3 = space();
    			option2 = element("option");
    			option2.textContent = "PNG";
    			option0.__value = 0;
    			option0.value = option0.__value;
    			add_location(option0, file$2, 35, 4, 1334);
    			option1.__value = 1;
    			option1.value = option1.__value;
    			add_location(option1, file$2, 36, 4, 1369);
    			option2.__value = 2;
    			option2.value = option2.__value;
    			add_location(option2, file$2, 37, 4, 1404);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, option1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, option2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(option1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(option2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(35:3) <Select label=\\\"File Type\\\" bind:value={rp.fileType}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let form;
    	let select0;
    	let updating_value;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let div2;
    	let div0;
    	let input;
    	let updating_value_1;
    	let t2;
    	let div1;
    	let select1;
    	let updating_value_2;
    	let t3;
    	let div3;
    	let button0;
    	let t5;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function select0_value_binding(value) {
    		/*select0_value_binding*/ ctx[2](value);
    	}

    	let select0_props = {
    		label: "Magnet Type",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*rp*/ ctx[0].type !== void 0) {
    		select0_props.value = /*rp*/ ctx[0].type;
    	}

    	select0 = new Select({ props: select0_props, $$inline: true });
    	binding_callbacks.push(() => bind(select0, 'value', select0_value_binding));
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*rp*/ ctx[0].type == 0) return 0;
    		if (/*rp*/ ctx[0].type == 1) return 1;
    		if (/*rp*/ ctx[0].type == 2) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[11](value);
    	}

    	let input_props = { label: "File Name" };

    	if (/*rp*/ ctx[0].fileName !== void 0) {
    		input_props.value = /*rp*/ ctx[0].fileName;
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, 'value', input_value_binding));

    	function select1_value_binding(value) {
    		/*select1_value_binding*/ ctx[12](value);
    	}

    	let select1_props = {
    		label: "File Type",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*rp*/ ctx[0].fileType !== void 0) {
    		select1_props.value = /*rp*/ ctx[0].fileType;
    	}

    	select1 = new Select({ props: select1_props, $$inline: true });
    	binding_callbacks.push(() => bind(select1, 'value', select1_value_binding));

    	const block = {
    		c: function create() {
    			form = element("form");
    			create_component(select0.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(input.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(select1.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Export";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Preview";
    			attr_dev(div0, "class", "w-full md:w-2/3 px-2");
    			add_location(div0, file$2, 30, 2, 1138);
    			attr_dev(div1, "class", "w-full md:w-1/3 px-2");
    			add_location(div1, file$2, 33, 2, 1240);
    			attr_dev(div2, "class", "flex flex-wrap -mx-2 mb-2");
    			add_location(div2, file$2, 29, 1, 1096);
    			attr_dev(button0, "class", "shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded");
    			add_location(button0, file$2, 43, 2, 1518);
    			attr_dev(button1, "class", "shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded");
    			add_location(button1, file$2, 46, 2, 1679);
    			attr_dev(div3, "class", "flex justify-center space-x-2 mb-2");
    			add_location(div3, file$2, 42, 1, 1467);
    			attr_dev(form, "class", "w-full min-w-sm");
    			add_location(form, file$2, 10, 0, 228);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			mount_component(select0, form, null);
    			append_dev(form, t0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(form, null);
    			}

    			append_dev(form, t1);
    			append_dev(form, div2);
    			append_dev(div2, div0);
    			mount_component(input, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(select1, div1, null);
    			append_dev(form, t3);
    			append_dev(form, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t5);
    			append_dev(div3, button1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", prevent_default(/*click_handler*/ ctx[13]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const select0_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				select0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				select0_changes.value = /*rp*/ ctx[0].type;
    				add_flush_callback(() => updating_value = false);
    			}

    			select0.$set(select0_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(form, t1);
    				} else {
    					if_block = null;
    				}
    			}

    			const input_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				input_changes.value = /*rp*/ ctx[0].fileName;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input.$set(input_changes);
    			const select1_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				select1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_2 && dirty & /*rp*/ 1) {
    				updating_value_2 = true;
    				select1_changes.value = /*rp*/ ctx[0].fileType;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			select1.$set(select1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select0.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(input.$$.fragment, local);
    			transition_in(select1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select0.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(input.$$.fragment, local);
    			transition_out(select1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(select0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			destroy_component(input);
    			destroy_component(select1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputForm', slots, []);
    	const dispatch = createEventDispatcher();
    	let { rp } = $$props;
    	const writable_props = ['rp'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputForm> was created with unknown prop '${key}'`);
    	});

    	function select0_value_binding(value) {
    		if ($$self.$$.not_equal(rp.type, value)) {
    			rp.type = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input0_value_binding(value) {
    		if ($$self.$$.not_equal(rp.dim.height, value)) {
    			rp.dim.height = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input1_value_binding(value) {
    		if ($$self.$$.not_equal(rp.dim.width, value)) {
    			rp.dim.width = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input2_value_binding(value) {
    		if ($$self.$$.not_equal(rp.dim.depth, value)) {
    			rp.dim.depth = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input0_value_binding_1(value) {
    		if ($$self.$$.not_equal(rp.dim.height, value)) {
    			rp.dim.height = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input1_value_binding_1(value) {
    		if ($$self.$$.not_equal(rp.dim.radius, value)) {
    			rp.dim.radius = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input2_value_binding_1(value) {
    		if ($$self.$$.not_equal(rp.dim.inner, value)) {
    			rp.dim.inner = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input0_value_binding_2(value) {
    		if ($$self.$$.not_equal(rp.dim.width, value)) {
    			rp.dim.width = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input1_value_binding_2(value) {
    		if ($$self.$$.not_equal(rp.dim.height, value)) {
    			rp.dim.height = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function input_value_binding(value) {
    		if ($$self.$$.not_equal(rp.fileName, value)) {
    			rp.fileName = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function select1_value_binding(value) {
    		if ($$self.$$.not_equal(rp.fileType, value)) {
    			rp.fileType = value;
    			$$invalidate(0, rp);
    		}
    	}

    	const click_handler = () => dispatch('render');

    	$$self.$$set = $$props => {
    		if ('rp' in $$props) $$invalidate(0, rp = $$props.rp);
    	};

    	$$self.$capture_state = () => ({
    		Select,
    		Input,
    		createEventDispatcher,
    		dispatch,
    		rp
    	});

    	$$self.$inject_state = $$props => {
    		if ('rp' in $$props) $$invalidate(0, rp = $$props.rp);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		rp,
    		dispatch,
    		select0_value_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input0_value_binding_1,
    		input1_value_binding_1,
    		input2_value_binding_1,
    		input0_value_binding_2,
    		input1_value_binding_2,
    		input_value_binding,
    		select1_value_binding,
    		click_handler
    	];
    }

    class InputForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { rp: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputForm",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rp*/ ctx[0] === undefined && !('rp' in props)) {
    			console.warn("<InputForm> was created without expected prop 'rp'");
    		}
    	}

    	get rp() {
    		throw new Error("<InputForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rp(value) {
    		throw new Error("<InputForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Preview.svelte generated by Svelte v3.44.0 */

    const file$1 = "src/Preview.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let svg;
    	let style;
    	let t1;
    	let defs;
    	let clipPath0;
    	let path0;
    	let clipPath1;
    	let path1;
    	let marker0;
    	let path2;
    	let marker1;
    	let path3;
    	let marker2;
    	let path4;
    	let marker3;
    	let path5;
    	let g;
    	let rect0;
    	let rect1;
    	let path6;
    	let path6_d_value;
    	let path7;
    	let path7_d_value;
    	let path8;
    	let path8_d_value;
    	let text0;
    	let t2;
    	let t3;
    	let text0_x_value;
    	let text0_y_value;
    	let path9;
    	let path9_d_value;
    	let path10;
    	let path10_d_value;
    	let path11;
    	let path11_d_value;
    	let text1;
    	let t4;
    	let t5;
    	let text1_x_value;
    	let text1_y_value;
    	let ellipse;
    	let ellipse_cx_value;
    	let ellipse_cy_value;
    	let ellipse_rx_value;
    	let path12;
    	let path12_d_value;
    	let path13;
    	let path13_d_value;
    	let path14;
    	let path14_d_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			svg = svg_element("svg");
    			style = svg_element("style");
    			t1 = text(".arrow-marker {\n  fill: #999;\n}\n\n.arrow-dimension-line {\n  fill: none;\n  stroke-width: 0.75;\n  stroke: #999;\n}\n\n.arrow,\n            .arrow-inverted-start,\n            .arrow-inverted-end {\n  fill: none;\n  stroke-width: 1.5;\n  stroke: #999;\n}\n\n.arrow {\n  marker-start: url(#arrow-start);\n  marker-end: url(#arrow-end);\n}\n\n.arrow-inverted-start {\n  marker-end: url(#arrow-inverted-start);\n}\n\n.arrow-inverted-end {\n  marker-start: url(#arrow-inverted-end);\n}\n\n.border {\n  stroke-width: 2;\n  stroke: black;\n}\n");
    			defs = svg_element("defs");
    			clipPath0 = svg_element("clipPath");
    			path0 = svg_element("path");
    			clipPath1 = svg_element("clipPath");
    			path1 = svg_element("path");
    			marker0 = svg_element("marker");
    			path2 = svg_element("path");
    			marker1 = svg_element("marker");
    			path3 = svg_element("path");
    			marker2 = svg_element("marker");
    			path4 = svg_element("path");
    			marker3 = svg_element("marker");
    			path5 = svg_element("path");
    			g = svg_element("g");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			text0 = svg_element("text");
    			t2 = text(/*height*/ ctx[0]);
    			t3 = text(" mm");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			text1 = svg_element("text");
    			t4 = text(/*width*/ ctx[1]);
    			t5 = text(" mm");
    			ellipse = svg_element("ellipse");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			attr_dev(div0, "class", "my-12");
    			add_location(div0, file$1, 6, 0, 127);
    			add_location(style, file$1, 9, 8, 268);
    			attr_dev(path0, "d", "M10 87.354838709677a175.8064516129 77.354838709677 0 0 1 351.61290322581 0 v281.29032258065 a175.8064516129 77.354838709677 0 0 1 -351.61290322581 0 z");
    			add_location(path0, file$1, 47, 16, 860);
    			attr_dev(clipPath0, "id", "magnet-clip");
    			add_location(clipPath0, file$1, 46, 12, 816);
    			attr_dev(path1, "d", "M10 87.354838709677a175.8064516129 77.354838709677 0 0 1 351.61290322581 0 v140.64516129032 a175.8064516129 77.354838709677 0 0 1 -351.61290322581 0 z");
    			add_location(path1, file$1, 51, 16, 1123);
    			attr_dev(clipPath1, "id", "north-clip");
    			add_location(clipPath1, file$1, 50, 12, 1080);
    			attr_dev(path2, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path2, "class", "arrow-marker");
    			add_location(path2, file$1, 55, 16, 1467);
    			attr_dev(marker0, "id", "arrow-start");
    			attr_dev(marker0, "orient", "auto");
    			attr_dev(marker0, "markerWidth", "10");
    			attr_dev(marker0, "markerHeight", "5");
    			attr_dev(marker0, "refX", "6.6666666666667");
    			attr_dev(marker0, "refY", "2.5");
    			add_location(marker0, file$1, 54, 12, 1343);
    			attr_dev(path3, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path3, "class", "arrow-marker");
    			add_location(path3, file$1, 58, 16, 1672);
    			attr_dev(marker1, "id", "arrow-end");
    			attr_dev(marker1, "orient", "auto");
    			attr_dev(marker1, "markerWidth", "10");
    			attr_dev(marker1, "markerHeight", "5");
    			attr_dev(marker1, "refX", "3.3333333333333");
    			attr_dev(marker1, "refY", "2.5");
    			add_location(marker1, file$1, 57, 12, 1550);
    			attr_dev(path4, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path4, "class", "arrow-marker");
    			add_location(path4, file$1, 62, 16, 1904);
    			attr_dev(marker2, "id", "arrow-inverted-start");
    			attr_dev(marker2, "orient", "auto");
    			attr_dev(marker2, "markerWidth", "10");
    			attr_dev(marker2, "markerHeight", "5");
    			attr_dev(marker2, "refX", "3.3333333333333");
    			attr_dev(marker2, "refY", "2.5");
    			add_location(marker2, file$1, 60, 12, 1755);
    			attr_dev(path5, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path5, "class", "arrow-marker");
    			add_location(path5, file$1, 66, 16, 2134);
    			attr_dev(marker3, "id", "arrow-inverted-end");
    			attr_dev(marker3, "orient", "auto");
    			attr_dev(marker3, "markerWidth", "10");
    			attr_dev(marker3, "markerHeight", "5");
    			attr_dev(marker3, "refX", "6.6666666666667");
    			attr_dev(marker3, "refY", "2.5");
    			add_location(marker3, file$1, 64, 12, 1987);
    			add_location(defs, file$1, 45, 8, 797);
    			attr_dev(rect0, "x", "10");
    			attr_dev(rect0, "y", "10");
    			attr_dev(rect0, "width", "351.61290322581");
    			attr_dev(rect0, "height", "436");
    			set_style(rect0, "clip-path", "url(#magnet-clip)");
    			set_style(rect0, "fill", "#36987D");
    			add_location(rect0, file$1, 70, 12, 2245);
    			attr_dev(rect1, "x", "10");
    			attr_dev(rect1, "y", "10");
    			attr_dev(rect1, "width", "351.61290322581");
    			attr_dev(rect1, "height", "436");
    			set_style(rect1, "clip-path", "url(#north-clip)");
    			set_style(rect1, "fill", "#CB5959");
    			add_location(rect1, file$1, 71, 12, 2366);
    			add_location(g, file$1, 69, 8, 2229);
    			attr_dev(path6, "d", path6_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1] + 3} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4]}h16`);
    			attr_dev(path6, "class", "arrow-dimension-line");
    			add_location(path6, file$1, 73, 8, 2495);
    			attr_dev(path7, "d", path7_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1] + 3} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0]}h16`);
    			attr_dev(path7, "class", "arrow-dimension-line");
    			add_location(path7, file$1, 74, 8, 2580);
    			attr_dev(path8, "d", path8_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1] + 14} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + 10}v${/*height*/ ctx[0] - 2 * 10}`);
    			attr_dev(path8, "class", "arrow");
    			add_location(path8, file$1, 75, 8, 2672);
    			attr_dev(text0, "x", text0_x_value = /*left*/ ctx[2] + /*width*/ ctx[1] + 20);
    			attr_dev(text0, "y", text0_y_value = /*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] / 2 - 10);
    			attr_dev(text0, "font-size", "21");
    			attr_dev(text0, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text0, "fill", "#999");
    			set_style(text0, "text-anchor", "left");
    			add_location(text0, file$1, 76, 8, 2758);
    			attr_dev(path9, "d", path9_d_value = `M${/*left*/ ctx[2]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + 3}v${/*rad_y*/ ctx[4] + 7}`);
    			attr_dev(path9, "class", "arrow-dimension-line");
    			add_location(path9, file$1, 78, 8, 2941);
    			attr_dev(path10, "d", path10_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + 3}v${/*rad_y*/ ctx[4] + 7}`);
    			attr_dev(path10, "class", "arrow-dimension-line");
    			add_location(path10, file$1, 79, 8, 3035);
    			attr_dev(path11, "d", path11_d_value = `M${/*left*/ ctx[2] + 10} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + /*rad_y*/ ctx[4] + 7}h${/*width*/ ctx[1] - 2 * 10}`);
    			attr_dev(path11, "class", "arrow");
    			add_location(path11, file$1, 80, 8, 3135);
    			attr_dev(text1, "x", text1_x_value = /*left*/ ctx[2] + /*width*/ ctx[1] / 2);
    			attr_dev(text1, "y", text1_y_value = /*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + /*rad_y*/ ctx[4] + 30);
    			attr_dev(text1, "font-size", "21");
    			attr_dev(text1, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text1, "fill", "#999");
    			set_style(text1, "text-anchor", "middle");
    			add_location(text1, file$1, 81, 8, 3226);
    			attr_dev(ellipse, "cx", ellipse_cx_value = /*left*/ ctx[2] + /*width*/ ctx[1] / 2);
    			attr_dev(ellipse, "cy", ellipse_cy_value = /*top*/ ctx[3] + /*rad_y*/ ctx[4]);
    			attr_dev(ellipse, "rx", ellipse_rx_value = /*width*/ ctx[1] / 2);
    			attr_dev(ellipse, "ry", /*rad_y*/ ctx[4]);
    			attr_dev(ellipse, "class", "border");
    			attr_dev(ellipse, "fill", "none");
    			add_location(ellipse, file$1, 83, 8, 3413);
    			attr_dev(path12, "d", path12_d_value = `M${/*left*/ ctx[2]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0]}a${/*width*/ ctx[1] / 2} ${/*rad_y*/ ctx[4]} 0 0 0 ${/*width*/ ctx[1]} 0`);
    			attr_dev(path12, "class", "border");
    			attr_dev(path12, "fill", "none");
    			add_location(path12, file$1, 85, 8, 3529);
    			attr_dev(path13, "d", path13_d_value = `M${/*left*/ ctx[2]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[0]}`);
    			attr_dev(path13, "class", "border");
    			add_location(path13, file$1, 86, 8, 3645);
    			attr_dev(path14, "d", path14_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[0]}`);
    			attr_dev(path14, "class", "border");
    			add_location(path14, file$1, 87, 8, 3715);
    			attr_dev(svg, "viewBox", "0 0 462 500");
    			attr_dev(svg, "width", "600");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$1, 8, 4, 185);
    			attr_dev(div1, "class", "w-full h-full");
    			add_location(div1, file$1, 7, 0, 153);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg);
    			append_dev(svg, style);
    			append_dev(style, t1);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath0);
    			append_dev(clipPath0, path0);
    			append_dev(defs, clipPath1);
    			append_dev(clipPath1, path1);
    			append_dev(defs, marker0);
    			append_dev(marker0, path2);
    			append_dev(defs, marker1);
    			append_dev(marker1, path3);
    			append_dev(defs, marker2);
    			append_dev(marker2, path4);
    			append_dev(defs, marker3);
    			append_dev(marker3, path5);
    			append_dev(svg, g);
    			append_dev(g, rect0);
    			append_dev(g, rect1);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, text0);
    			append_dev(text0, t2);
    			append_dev(text0, t3);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, text1);
    			append_dev(text1, t4);
    			append_dev(text1, t5);
    			append_dev(svg, ellipse);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*left, width, top*/ 14 && path6_d_value !== (path6_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1] + 3} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4]}h16`)) {
    				attr_dev(path6, "d", path6_d_value);
    			}

    			if (dirty & /*left, width, top, height*/ 15 && path7_d_value !== (path7_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1] + 3} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0]}h16`)) {
    				attr_dev(path7, "d", path7_d_value);
    			}

    			if (dirty & /*left, width, top, height*/ 15 && path8_d_value !== (path8_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1] + 14} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + 10}v${/*height*/ ctx[0] - 2 * 10}`)) {
    				attr_dev(path8, "d", path8_d_value);
    			}

    			if (dirty & /*height*/ 1) set_data_dev(t2, /*height*/ ctx[0]);

    			if (dirty & /*left, width*/ 6 && text0_x_value !== (text0_x_value = /*left*/ ctx[2] + /*width*/ ctx[1] + 20)) {
    				attr_dev(text0, "x", text0_x_value);
    			}

    			if (dirty & /*top, height*/ 9 && text0_y_value !== (text0_y_value = /*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] / 2 - 10)) {
    				attr_dev(text0, "y", text0_y_value);
    			}

    			if (dirty & /*left, top, height*/ 13 && path9_d_value !== (path9_d_value = `M${/*left*/ ctx[2]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + 3}v${/*rad_y*/ ctx[4] + 7}`)) {
    				attr_dev(path9, "d", path9_d_value);
    			}

    			if (dirty & /*left, width, top, height*/ 15 && path10_d_value !== (path10_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + 3}v${/*rad_y*/ ctx[4] + 7}`)) {
    				attr_dev(path10, "d", path10_d_value);
    			}

    			if (dirty & /*left, top, height, width*/ 15 && path11_d_value !== (path11_d_value = `M${/*left*/ ctx[2] + 10} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + /*rad_y*/ ctx[4] + 7}h${/*width*/ ctx[1] - 2 * 10}`)) {
    				attr_dev(path11, "d", path11_d_value);
    			}

    			if (dirty & /*width*/ 2) set_data_dev(t4, /*width*/ ctx[1]);

    			if (dirty & /*left, width*/ 6 && text1_x_value !== (text1_x_value = /*left*/ ctx[2] + /*width*/ ctx[1] / 2)) {
    				attr_dev(text1, "x", text1_x_value);
    			}

    			if (dirty & /*top, height*/ 9 && text1_y_value !== (text1_y_value = /*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0] + /*rad_y*/ ctx[4] + 30)) {
    				attr_dev(text1, "y", text1_y_value);
    			}

    			if (dirty & /*left, width*/ 6 && ellipse_cx_value !== (ellipse_cx_value = /*left*/ ctx[2] + /*width*/ ctx[1] / 2)) {
    				attr_dev(ellipse, "cx", ellipse_cx_value);
    			}

    			if (dirty & /*top*/ 8 && ellipse_cy_value !== (ellipse_cy_value = /*top*/ ctx[3] + /*rad_y*/ ctx[4])) {
    				attr_dev(ellipse, "cy", ellipse_cy_value);
    			}

    			if (dirty & /*width*/ 2 && ellipse_rx_value !== (ellipse_rx_value = /*width*/ ctx[1] / 2)) {
    				attr_dev(ellipse, "rx", ellipse_rx_value);
    			}

    			if (dirty & /*left, top, height, width*/ 15 && path12_d_value !== (path12_d_value = `M${/*left*/ ctx[2]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4] + /*height*/ ctx[0]}a${/*width*/ ctx[1] / 2} ${/*rad_y*/ ctx[4]} 0 0 0 ${/*width*/ ctx[1]} 0`)) {
    				attr_dev(path12, "d", path12_d_value);
    			}

    			if (dirty & /*left, top, height*/ 13 && path13_d_value !== (path13_d_value = `M${/*left*/ ctx[2]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[0]}`)) {
    				attr_dev(path13, "d", path13_d_value);
    			}

    			if (dirty & /*left, width, top, height*/ 15 && path14_d_value !== (path14_d_value = `M${/*left*/ ctx[2] + /*width*/ ctx[1]} ${/*top*/ ctx[3] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[0]}`)) {
    				attr_dev(path14, "d", path14_d_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let top;
    	let left;
    	let width;
    	let height;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Preview', slots, []);
    	let { renderParams } = $$props;
    	let rad_y = 30;
    	const writable_props = ['renderParams'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Preview> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('renderParams' in $$props) $$invalidate(5, renderParams = $$props.renderParams);
    	};

    	$$self.$capture_state = () => ({
    		renderParams,
    		rad_y,
    		height,
    		width,
    		left,
    		top
    	});

    	$$self.$inject_state = $$props => {
    		if ('renderParams' in $$props) $$invalidate(5, renderParams = $$props.renderParams);
    		if ('rad_y' in $$props) $$invalidate(4, rad_y = $$props.rad_y);
    		if ('height' in $$props) $$invalidate(0, height = $$props.height);
    		if ('width' in $$props) $$invalidate(1, width = $$props.width);
    		if ('left' in $$props) $$invalidate(2, left = $$props.left);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*renderParams*/ 32) {
    			$$invalidate(3, { top, left, width, height } = renderParams.dim, top, ($$invalidate(2, left), $$invalidate(5, renderParams)), ($$invalidate(1, width), $$invalidate(5, renderParams)), ($$invalidate(0, height), $$invalidate(5, renderParams)));
    		}
    	};

    	return [height, width, left, top, rad_y, renderParams];
    }

    class Preview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { renderParams: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Preview",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*renderParams*/ ctx[5] === undefined && !('renderParams' in props)) {
    			console.warn("<Preview> was created without expected prop 'renderParams'");
    		}
    	}

    	get renderParams() {
    		throw new Error("<Preview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set renderParams(value) {
    		throw new Error("<Preview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let inputform;
    	let updating_rp;
    	let t4;
    	let div1;
    	let preview;
    	let updating_renderParams;
    	let current;

    	function inputform_rp_binding(value) {
    		/*inputform_rp_binding*/ ctx[4](value);
    	}

    	let inputform_props = {};

    	if (/*renderParams*/ ctx[2] !== void 0) {
    		inputform_props.rp = /*renderParams*/ ctx[2];
    	}

    	inputform = new InputForm({ props: inputform_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputform, 'rp', inputform_rp_binding));
    	inputform.$on("render", /*render*/ ctx[3]);

    	function preview_renderParams_binding(value) {
    		/*preview_renderParams_binding*/ ctx[5](value);
    	}

    	let preview_props = {};

    	if (/*renderParams*/ ctx[2] !== void 0) {
    		preview_props.renderParams = /*renderParams*/ ctx[2];
    	}

    	preview = new Preview({ props: preview_props, $$inline: true });
    	binding_callbacks.push(() => bind(preview, 'renderParams', preview_renderParams_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = text(" v");
    			t2 = text(/*version*/ ctx[1]);
    			t3 = space();
    			create_component(inputform.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			create_component(preview.$$.fragment);
    			add_location(h1, file, 176312, 3, 4040001);
    			attr_dev(div0, "id", "left");
    			attr_dev(div0, "class", "flex flex-col flex-wrap space-y-6 md:w-1/2");
    			add_location(div0, file, 176311, 2, 4039931);
    			attr_dev(div1, "id", "right");
    			attr_dev(div1, "class", "md:w-1/2 pl-2");
    			add_location(div1, file, 176315, 2, 4040098);
    			attr_dev(div2, "class", "container flex flex-col md:flex-row flex-wrap md:flex-nowrap");
    			add_location(div2, file, 176310, 1, 4039854);
    			attr_dev(main, "class", "h-full");
    			add_location(main, file, 176309, 0, 4039831);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div0, t3);
    			mount_component(inputform, div0, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			mount_component(preview, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    			if (!current || dirty & /*version*/ 2) set_data_dev(t2, /*version*/ ctx[1]);
    			const inputform_changes = {};

    			if (!updating_rp && dirty & /*renderParams*/ 4) {
    				updating_rp = true;
    				inputform_changes.rp = /*renderParams*/ ctx[2];
    				add_flush_callback(() => updating_rp = false);
    			}

    			inputform.$set(inputform_changes);
    			const preview_changes = {};

    			if (!updating_renderParams && dirty & /*renderParams*/ 4) {
    				updating_renderParams = true;
    				preview_changes.renderParams = /*renderParams*/ ctx[2];
    				add_flush_callback(() => updating_renderParams = false);
    			}

    			preview.$set(preview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputform.$$.fragment, local);
    			transition_in(preview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputform.$$.fragment, local);
    			transition_out(preview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(inputform);
    			destroy_component(preview);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let { version } = $$props;

    	let renderParams = {
    		type: 2,
    		dim: {
    			top: 10,
    			left: 10,
    			width: 300,
    			height: 300
    		},
    		fileName: '',
    		fileType: ''
    	};

    	function render() {
    		for (let k in renderParams.dim) {
    			$$invalidate(2, renderParams.dim[k] = Number(renderParams.dim[k]), renderParams);
    		}

    		console.log('Render params = ');
    		console.log(renderParams);
    	}

    	const writable_props = ['name', 'version'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function inputform_rp_binding(value) {
    		renderParams = value;
    		$$invalidate(2, renderParams);
    	}

    	function preview_renderParams_binding(value) {
    		renderParams = value;
    		$$invalidate(2, renderParams);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('version' in $$props) $$invalidate(1, version = $$props.version);
    	};

    	$$self.$capture_state = () => ({
    		InputForm,
    		Preview,
    		name,
    		version,
    		renderParams,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('version' in $$props) $$invalidate(1, version = $$props.version);
    		if ('renderParams' in $$props) $$invalidate(2, renderParams = $$props.renderParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		version,
    		renderParams,
    		render,
    		inputform_rp_binding,
    		preview_renderParams_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0, version: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}

    		if (/*version*/ ctx[1] === undefined && !('version' in props)) {
    			console_1.warn("<App> was created without expected prop 'version'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get version() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'MagnetRender',
    		version: '0.0.3'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
