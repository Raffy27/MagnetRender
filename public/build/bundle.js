
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
    function to_number(value) {
        return value === '' ? null : +value;
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

    const file$a = "src/components/Select.svelte";

    function create_fragment$a(ctx) {
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
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

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
    			add_location(label_1, file$a, 6, 0, 91);
    			attr_dev(select, "class", "block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500");
    			if (/*value*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[5].call(select));
    			add_location(select, file$a, 10, 1, 238);
    			attr_dev(path, "d", "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z");
    			add_location(path, file$a, 15, 90, 679);
    			attr_dev(svg, "class", "fill-current h-4 w-4");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			add_location(svg, file$a, 15, 1, 590);
    			attr_dev(div0, "class", "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700");
    			add_location(div0, file$a, 14, 1, 491);
    			attr_dev(div1, "class", "relative mb-2");
    			add_location(div1, file$a, 9, 0, 209);
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
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[5]),
    					listen_dev(
    						select,
    						"change",
    						function () {
    							if (is_function(/*onchange*/ ctx[2])) /*onchange*/ ctx[2].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (!current || dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
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
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Select', slots, ['default']);
    	let { label } = $$props;
    	let { value = 0 } = $$props;
    	let { onchange = null } = $$props;
    	const writable_props = ['label', 'value', 'onchange'];

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
    		if ('onchange' in $$props) $$invalidate(2, onchange = $$props.onchange);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ label, value, onchange });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('onchange' in $$props) $$invalidate(2, onchange = $$props.onchange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, onchange, $$scope, slots, select_change_handler];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { label: 1, value: 0, onchange: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$a.name
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

    	get onchange() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onchange(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Input.svelte generated by Svelte v3.44.0 */

    const file$9 = "src/components/Input.svelte";

    // (7:4) {#if unit}
    function create_if_block$5(ctx) {
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
    			add_location(span, file$9, 7, 8, 186);
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(7:4) {#if unit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let input_placeholder_value;
    	let mounted;
    	let dispose;
    	let if_block = /*unit*/ ctx[2] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			attr_dev(span, "class", "uppercase tracking-wide text-gray-700 text-xs font-bold mb-2");
    			add_location(span, file$9, 4, 0, 75);
    			attr_dev(input, "class", "appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", input_placeholder_value = /*hint*/ ctx[3] || null);
    			add_location(input, file$9, 10, 0, 256);
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
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*hint*/ 8 && input_placeholder_value !== (input_placeholder_value = /*hint*/ ctx[3] || null)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Input', slots, []);
    	let { label, unit = null, hint = null, value } = $$props;
    	const writable_props = ['label', 'unit', 'hint', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('hint' in $$props) $$invalidate(3, hint = $$props.hint);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ label, unit, hint, value });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('hint' in $$props) $$invalidate(3, hint = $$props.hint);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, unit, hint, input_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { label: 1, unit: 2, hint: 3, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$9.name
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

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/NumInput.svelte generated by Svelte v3.44.0 */

    const file$8 = "src/components/NumInput.svelte";

    // (7:4) {#if unit}
    function create_if_block$4(ctx) {
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
    			add_location(span, file$8, 7, 8, 190);
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(7:4) {#if unit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let input_placeholder_value;
    	let mounted;
    	let dispose;
    	let if_block = /*unit*/ ctx[2] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			attr_dev(span, "class", "uppercase tracking-wide text-gray-700 text-xs font-bold mb-2");
    			add_location(span, file$8, 4, 0, 79);
    			attr_dev(input, "class", "appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "placeholder", input_placeholder_value = /*hint*/ ctx[3] || null);
    			add_location(input, file$8, 10, 0, 260);
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
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*hint*/ 8 && input_placeholder_value !== (input_placeholder_value = /*hint*/ ctx[3] || null)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NumInput', slots, []);
    	let { label, unit = null, hint = null, value = 0 } = $$props;
    	const writable_props = ['label', 'unit', 'hint', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NumInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('hint' in $$props) $$invalidate(3, hint = $$props.hint);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ label, unit, hint, value });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('hint' in $$props) $$invalidate(3, hint = $$props.hint);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, unit, hint, input_input_handler];
    }

    class NumInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { label: 1, unit: 2, hint: 3, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumInput",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<NumInput> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<NumInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<NumInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<NumInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<NumInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<NumInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<NumInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<NumInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<NumInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/RangeInput.svelte generated by Svelte v3.44.0 */

    const file$7 = "src/components/RangeInput.svelte";

    // (8:4) {#if unit}
    function create_if_block$3(ctx) {
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
    			add_location(span, file$7, 8, 8, 222);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(8:4) {#if unit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*unit*/ ctx[2] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			attr_dev(span, "class", "uppercase tracking-wide text-gray-700 text-xs font-bold mb-2");
    			add_location(span, file$7, 5, 0, 111);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "step", /*step*/ ctx[3]);
    			attr_dev(input, "min", /*min*/ ctx[4]);
    			attr_dev(input, "max", /*max*/ ctx[5]);
    			attr_dev(input, "class", "block w-full py-3 px-4 mb-3 leading-tight");
    			add_location(input, file$7, 11, 0, 292);
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
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (/*unit*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*step*/ 8) {
    				attr_dev(input, "step", /*step*/ ctx[3]);
    			}

    			if (dirty & /*min*/ 16) {
    				attr_dev(input, "min", /*min*/ ctx[4]);
    			}

    			if (dirty & /*max*/ 32) {
    				attr_dev(input, "max", /*max*/ ctx[5]);
    			}

    			if (dirty & /*value*/ 1) {
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
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RangeInput', slots, []);
    	let { label, unit = null, value = 0 } = $$props;
    	let { step = 1, min = 0, max = 100 } = $$props;
    	const writable_props = ['label', 'unit', 'value', 'step', 'min', 'max'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RangeInput> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('min' in $$props) $$invalidate(4, min = $$props.min);
    		if ('max' in $$props) $$invalidate(5, max = $$props.max);
    	};

    	$$self.$capture_state = () => ({ label, unit, value, step, min, max });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('min' in $$props) $$invalidate(4, min = $$props.min);
    		if ('max' in $$props) $$invalidate(5, max = $$props.max);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, unit, step, min, max, input_change_input_handler];
    }

    class RangeInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			label: 1,
    			unit: 2,
    			value: 0,
    			step: 3,
    			min: 4,
    			max: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RangeInput",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<RangeInput> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ColorInput.svelte generated by Svelte v3.44.0 */

    const file$6 = "src/components/ColorInput.svelte";

    // (7:4) {#if unit}
    function create_if_block$2(ctx) {
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
    			add_location(span, file$6, 7, 8, 173);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(7:4) {#if unit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*unit*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			attr_dev(span, "class", "uppercase tracking-wide text-gray-700 text-xs font-bold mb-2");
    			add_location(span, file$6, 4, 0, 62);
    			attr_dev(input, "class", "appearance-none block w-full");
    			attr_dev(input, "type", "color");
    			add_location(input, file$6, 10, 0, 243);
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
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (/*unit*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*value*/ 1) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ColorInput', slots, []);
    	let { label, unit = null, value } = $$props;
    	const writable_props = ['label', 'unit', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ColorInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ label, unit, value });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, unit, input_input_handler];
    }

    class ColorInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { label: 1, unit: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorInput",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<ColorInput> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<ColorInput> was created without expected prop 'value'");
    		}
    	}

    	get label() {
    		throw new Error("<ColorInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<ColorInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<ColorInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<ColorInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<ColorInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ColorInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/InputForm.svelte generated by Svelte v3.44.0 */
    const file$5 = "src/InputForm.svelte";

    // (15:1) <Select label="Magnet Type" bind:value={rp.type} onchange={() => dispatch('newtype')}>
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
    			add_location(option0, file$5, 15, 2, 519);
    			option1.__value = 1;
    			option1.value = option1.__value;
    			add_location(option1, file$5, 16, 2, 554);
    			option2.__value = 2;
    			option2.value = option2.__value;
    			add_location(option2, file$5, 17, 2, 588);
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
    		source: "(15:1) <Select label=\\\"Magnet Type\\\" bind:value={rp.type} onchange={() => dispatch('newtype')}>",
    		ctx
    	});

    	return block;
    }

    // (28:24) 
    function create_if_block_2$1(ctx) {
    	let numinput0;
    	let updating_value;
    	let t;
    	let numinput1;
    	let updating_value_1;
    	let current;

    	function numinput0_value_binding_2(value) {
    		/*numinput0_value_binding_2*/ ctx[10](value);
    	}

    	let numinput0_props = { label: "Width", unit: "mm", hint: "300" };

    	if (/*rp*/ ctx[0].dim.width !== void 0) {
    		numinput0_props.value = /*rp*/ ctx[0].dim.width;
    	}

    	numinput0 = new NumInput({ props: numinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput0, 'value', numinput0_value_binding_2));

    	function numinput1_value_binding_2(value) {
    		/*numinput1_value_binding_2*/ ctx[11](value);
    	}

    	let numinput1_props = { label: "Height", unit: "mm", hint: "300" };

    	if (/*rp*/ ctx[0].dim.height !== void 0) {
    		numinput1_props.value = /*rp*/ ctx[0].dim.height;
    	}

    	numinput1 = new NumInput({ props: numinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput1, 'value', numinput1_value_binding_2));

    	const block = {
    		c: function create() {
    			create_component(numinput0.$$.fragment);
    			t = space();
    			create_component(numinput1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(numinput0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(numinput1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const numinput0_changes = {};

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				numinput0_changes.value = /*rp*/ ctx[0].dim.width;
    				add_flush_callback(() => updating_value = false);
    			}

    			numinput0.$set(numinput0_changes);
    			const numinput1_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				numinput1_changes.value = /*rp*/ ctx[0].dim.height;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			numinput1.$set(numinput1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numinput0.$$.fragment, local);
    			transition_in(numinput1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numinput0.$$.fragment, local);
    			transition_out(numinput1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(numinput0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(numinput1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(28:24) ",
    		ctx
    	});

    	return block;
    }

    // (24:24) 
    function create_if_block_1$1(ctx) {
    	let numinput0;
    	let updating_value;
    	let t0;
    	let numinput1;
    	let updating_value_1;
    	let t1;
    	let numinput2;
    	let updating_value_2;
    	let current;

    	function numinput0_value_binding_1(value) {
    		/*numinput0_value_binding_1*/ ctx[7](value);
    	}

    	let numinput0_props = { label: "Width", unit: "mm", hint: "5" };

    	if (/*rp*/ ctx[0].dim.width !== void 0) {
    		numinput0_props.value = /*rp*/ ctx[0].dim.width;
    	}

    	numinput0 = new NumInput({ props: numinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput0, 'value', numinput0_value_binding_1));

    	function numinput1_value_binding_1(value) {
    		/*numinput1_value_binding_1*/ ctx[8](value);
    	}

    	let numinput1_props = { label: "Height", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.height !== void 0) {
    		numinput1_props.value = /*rp*/ ctx[0].dim.height;
    	}

    	numinput1 = new NumInput({ props: numinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput1, 'value', numinput1_value_binding_1));

    	function numinput2_value_binding_1(value) {
    		/*numinput2_value_binding_1*/ ctx[9](value);
    	}

    	let numinput2_props = {
    		label: "Inner Radius",
    		unit: "mm",
    		hint: "3"
    	};

    	if (/*rp*/ ctx[0].dim.radius !== void 0) {
    		numinput2_props.value = /*rp*/ ctx[0].dim.radius;
    	}

    	numinput2 = new NumInput({ props: numinput2_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput2, 'value', numinput2_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(numinput0.$$.fragment);
    			t0 = space();
    			create_component(numinput1.$$.fragment);
    			t1 = space();
    			create_component(numinput2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(numinput0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(numinput1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(numinput2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const numinput0_changes = {};

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				numinput0_changes.value = /*rp*/ ctx[0].dim.width;
    				add_flush_callback(() => updating_value = false);
    			}

    			numinput0.$set(numinput0_changes);
    			const numinput1_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				numinput1_changes.value = /*rp*/ ctx[0].dim.height;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			numinput1.$set(numinput1_changes);
    			const numinput2_changes = {};

    			if (!updating_value_2 && dirty & /*rp*/ 1) {
    				updating_value_2 = true;
    				numinput2_changes.value = /*rp*/ ctx[0].dim.radius;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			numinput2.$set(numinput2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numinput0.$$.fragment, local);
    			transition_in(numinput1.$$.fragment, local);
    			transition_in(numinput2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numinput0.$$.fragment, local);
    			transition_out(numinput1.$$.fragment, local);
    			transition_out(numinput2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(numinput0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(numinput1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(numinput2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(24:24) ",
    		ctx
    	});

    	return block;
    }

    // (20:1) {#if rp.type == 0}
    function create_if_block$1(ctx) {
    	let numinput0;
    	let updating_value;
    	let t0;
    	let numinput1;
    	let updating_value_1;
    	let t1;
    	let numinput2;
    	let updating_value_2;
    	let current;

    	function numinput0_value_binding(value) {
    		/*numinput0_value_binding*/ ctx[4](value);
    	}

    	let numinput0_props = { label: "Height", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.height !== void 0) {
    		numinput0_props.value = /*rp*/ ctx[0].dim.height;
    	}

    	numinput0 = new NumInput({ props: numinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput0, 'value', numinput0_value_binding));

    	function numinput1_value_binding(value) {
    		/*numinput1_value_binding*/ ctx[5](value);
    	}

    	let numinput1_props = { label: "Width", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.width !== void 0) {
    		numinput1_props.value = /*rp*/ ctx[0].dim.width;
    	}

    	numinput1 = new NumInput({ props: numinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput1, 'value', numinput1_value_binding));

    	function numinput2_value_binding(value) {
    		/*numinput2_value_binding*/ ctx[6](value);
    	}

    	let numinput2_props = { label: "Depth", unit: "mm", hint: "10" };

    	if (/*rp*/ ctx[0].dim.depth !== void 0) {
    		numinput2_props.value = /*rp*/ ctx[0].dim.depth;
    	}

    	numinput2 = new NumInput({ props: numinput2_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput2, 'value', numinput2_value_binding));

    	const block = {
    		c: function create() {
    			create_component(numinput0.$$.fragment);
    			t0 = space();
    			create_component(numinput1.$$.fragment);
    			t1 = space();
    			create_component(numinput2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(numinput0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(numinput1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(numinput2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const numinput0_changes = {};

    			if (!updating_value && dirty & /*rp*/ 1) {
    				updating_value = true;
    				numinput0_changes.value = /*rp*/ ctx[0].dim.height;
    				add_flush_callback(() => updating_value = false);
    			}

    			numinput0.$set(numinput0_changes);
    			const numinput1_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				numinput1_changes.value = /*rp*/ ctx[0].dim.width;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			numinput1.$set(numinput1_changes);
    			const numinput2_changes = {};

    			if (!updating_value_2 && dirty & /*rp*/ 1) {
    				updating_value_2 = true;
    				numinput2_changes.value = /*rp*/ ctx[0].dim.depth;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			numinput2.$set(numinput2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numinput0.$$.fragment, local);
    			transition_in(numinput1.$$.fragment, local);
    			transition_in(numinput2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numinput0.$$.fragment, local);
    			transition_out(numinput1.$$.fragment, local);
    			transition_out(numinput2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(numinput0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(numinput1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(numinput2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(20:1) {#if rp.type == 0}",
    		ctx
    	});

    	return block;
    }

    // (65:3) <Select label="File Type" bind:value={rp.fileType}>
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
    			add_location(option0, file$5, 65, 4, 2493);
    			option1.__value = 1;
    			option1.value = option1.__value;
    			add_location(option1, file$5, 66, 4, 2528);
    			option2.__value = 2;
    			option2.value = option2.__value;
    			add_location(option2, file$5, 67, 4, 2563);
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
    		source: "(65:3) <Select label=\\\"File Type\\\" bind:value={rp.fileType}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let form;
    	let select0;
    	let updating_value;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let div2;
    	let div0;
    	let rangeinput0;
    	let updating_value_1;
    	let t2;
    	let div1;
    	let rangeinput1;
    	let updating_value_2;
    	let t3;
    	let div5;
    	let div3;
    	let numinput0;
    	let updating_value_3;
    	let t4;
    	let div4;
    	let numinput1;
    	let updating_value_4;
    	let t5;
    	let div8;
    	let div6;
    	let colorinput0;
    	let updating_value_5;
    	let t6;
    	let div7;
    	let colorinput1;
    	let updating_value_6;
    	let t7;
    	let div11;
    	let div9;
    	let input;
    	let updating_value_7;
    	let t8;
    	let div10;
    	let select1;
    	let updating_value_8;
    	let t9;
    	let div12;
    	let button0;
    	let t11;
    	let button1;
    	let t13;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	function select0_value_binding(value) {
    		/*select0_value_binding*/ ctx[3](value);
    	}

    	let select0_props = {
    		label: "Magnet Type",
    		onchange: /*func*/ ctx[2],
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*rp*/ ctx[0].type !== void 0) {
    		select0_props.value = /*rp*/ ctx[0].type;
    	}

    	select0 = new Select({ props: select0_props, $$inline: true });
    	binding_callbacks.push(() => bind(select0, 'value', select0_value_binding));
    	const if_block_creators = [create_if_block$1, create_if_block_1$1, create_if_block_2$1];
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

    	function rangeinput0_value_binding(value) {
    		/*rangeinput0_value_binding*/ ctx[12](value);
    	}

    	let rangeinput0_props = {
    		label: "Perspective",
    		min: "0.001",
    		max: "0.3",
    		step: "0.001"
    	};

    	if (/*rp*/ ctx[0].perspective !== void 0) {
    		rangeinput0_props.value = /*rp*/ ctx[0].perspective;
    	}

    	rangeinput0 = new RangeInput({ props: rangeinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(rangeinput0, 'value', rangeinput0_value_binding));

    	function rangeinput1_value_binding(value) {
    		/*rangeinput1_value_binding*/ ctx[13](value);
    	}

    	let rangeinput1_props = {
    		label: "Scale",
    		min: "0.001",
    		max: "2",
    		step: "0.001"
    	};

    	if (/*rp*/ ctx[0].scale !== void 0) {
    		rangeinput1_props.value = /*rp*/ ctx[0].scale;
    	}

    	rangeinput1 = new RangeInput({ props: rangeinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(rangeinput1, 'value', rangeinput1_value_binding));

    	function numinput0_value_binding_3(value) {
    		/*numinput0_value_binding_3*/ ctx[14](value);
    	}

    	let numinput0_props = {
    		label: "Left Margin",
    		unit: "px",
    		hint: "10"
    	};

    	if (/*rp*/ ctx[0].dim.left !== void 0) {
    		numinput0_props.value = /*rp*/ ctx[0].dim.left;
    	}

    	numinput0 = new NumInput({ props: numinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput0, 'value', numinput0_value_binding_3));

    	function numinput1_value_binding_3(value) {
    		/*numinput1_value_binding_3*/ ctx[15](value);
    	}

    	let numinput1_props = {
    		label: "Top Margin",
    		unit: "px",
    		hint: "10"
    	};

    	if (/*rp*/ ctx[0].dim.top !== void 0) {
    		numinput1_props.value = /*rp*/ ctx[0].dim.top;
    	}

    	numinput1 = new NumInput({ props: numinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(numinput1, 'value', numinput1_value_binding_3));

    	function colorinput0_value_binding(value) {
    		/*colorinput0_value_binding*/ ctx[16](value);
    	}

    	let colorinput0_props = { label: "First Color", unit: "hex" };

    	if (/*rp*/ ctx[0].colors.first !== void 0) {
    		colorinput0_props.value = /*rp*/ ctx[0].colors.first;
    	}

    	colorinput0 = new ColorInput({ props: colorinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(colorinput0, 'value', colorinput0_value_binding));

    	function colorinput1_value_binding(value) {
    		/*colorinput1_value_binding*/ ctx[17](value);
    	}

    	let colorinput1_props = { label: "Second Color", unit: "hex" };

    	if (/*rp*/ ctx[0].colors.second !== void 0) {
    		colorinput1_props.value = /*rp*/ ctx[0].colors.second;
    	}

    	colorinput1 = new ColorInput({ props: colorinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(colorinput1, 'value', colorinput1_value_binding));

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[18](value);
    	}

    	let input_props = { label: "File Name" };

    	if (/*rp*/ ctx[0].fileName !== void 0) {
    		input_props.value = /*rp*/ ctx[0].fileName;
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, 'value', input_value_binding));

    	function select1_value_binding(value) {
    		/*select1_value_binding*/ ctx[19](value);
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
    			create_component(rangeinput0.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(rangeinput1.$$.fragment);
    			t3 = space();
    			div5 = element("div");
    			div3 = element("div");
    			create_component(numinput0.$$.fragment);
    			t4 = space();
    			div4 = element("div");
    			create_component(numinput1.$$.fragment);
    			t5 = space();
    			div8 = element("div");
    			div6 = element("div");
    			create_component(colorinput0.$$.fragment);
    			t6 = space();
    			div7 = element("div");
    			create_component(colorinput1.$$.fragment);
    			t7 = space();
    			div11 = element("div");
    			div9 = element("div");
    			create_component(input.$$.fragment);
    			t8 = space();
    			div10 = element("div");
    			create_component(select1.$$.fragment);
    			t9 = space();
    			div12 = element("div");
    			button0 = element("button");
    			button0.textContent = "Export";
    			t11 = space();
    			button1 = element("button");
    			button1.textContent = "Save Preset";
    			t13 = space();
    			button2 = element("button");
    			button2.textContent = "Load Preset";
    			attr_dev(div0, "class", "w-full md:w-1/2 px-2");
    			add_location(div0, file$5, 33, 2, 1365);
    			attr_dev(div1, "class", "w-full md:w-1/2 px-2");
    			add_location(div1, file$5, 36, 2, 1512);
    			attr_dev(div2, "class", "flex flex-wrap -mx-2");
    			add_location(div2, file$5, 32, 1, 1328);
    			attr_dev(div3, "class", "w-full md:w-1/2 px-2");
    			add_location(div3, file$5, 42, 2, 1695);
    			attr_dev(div4, "class", "w-full md:w-1/2 px-2");
    			add_location(div4, file$5, 45, 2, 1822);
    			attr_dev(div5, "class", "flex flex-wrap -mx-2 mb-2");
    			add_location(div5, file$5, 41, 1, 1653);
    			attr_dev(div6, "class", "w-full md:w-1/2 px-2");
    			add_location(div6, file$5, 51, 2, 1997);
    			attr_dev(div7, "class", "w-full md:w-1/2 px-2");
    			add_location(div7, file$5, 54, 2, 2121);
    			attr_dev(div8, "class", "flex flex-wrap -mx-2 mb-2");
    			add_location(div8, file$5, 50, 1, 1955);
    			attr_dev(div9, "class", "w-full md:w-2/3 px-2");
    			add_location(div9, file$5, 60, 2, 2297);
    			attr_dev(div10, "class", "w-full md:w-1/3 px-2");
    			add_location(div10, file$5, 63, 2, 2399);
    			attr_dev(div11, "class", "flex flex-wrap -mx-2 mb-2");
    			add_location(div11, file$5, 59, 1, 2255);
    			attr_dev(button0, "class", "shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded");
    			add_location(button0, file$5, 73, 2, 2677);
    			attr_dev(button1, "class", "shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded");
    			add_location(button1, file$5, 77, 2, 2895);
    			attr_dev(button2, "class", "shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded");
    			add_location(button2, file$5, 81, 2, 3113);
    			attr_dev(div12, "class", "flex justify-center space-x-2 mb-2");
    			add_location(div12, file$5, 72, 1, 2626);
    			attr_dev(form, "class", "w-full min-w-sm");
    			add_location(form, file$5, 13, 0, 398);
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
    			mount_component(rangeinput0, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(rangeinput1, div1, null);
    			append_dev(form, t3);
    			append_dev(form, div5);
    			append_dev(div5, div3);
    			mount_component(numinput0, div3, null);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			mount_component(numinput1, div4, null);
    			append_dev(form, t5);
    			append_dev(form, div8);
    			append_dev(div8, div6);
    			mount_component(colorinput0, div6, null);
    			append_dev(div8, t6);
    			append_dev(div8, div7);
    			mount_component(colorinput1, div7, null);
    			append_dev(form, t7);
    			append_dev(form, div11);
    			append_dev(div11, div9);
    			mount_component(input, div9, null);
    			append_dev(div11, t8);
    			append_dev(div11, div10);
    			mount_component(select1, div10, null);
    			append_dev(form, t9);
    			append_dev(form, div12);
    			append_dev(div12, button0);
    			append_dev(div12, t11);
    			append_dev(div12, button1);
    			append_dev(div12, t13);
    			append_dev(div12, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", prevent_default(/*click_handler*/ ctx[20]), false, true, false),
    					listen_dev(button1, "click", prevent_default(/*click_handler_1*/ ctx[21]), false, true, false),
    					listen_dev(button2, "click", prevent_default(/*click_handler_2*/ ctx[22]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const select0_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
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

    			const rangeinput0_changes = {};

    			if (!updating_value_1 && dirty & /*rp*/ 1) {
    				updating_value_1 = true;
    				rangeinput0_changes.value = /*rp*/ ctx[0].perspective;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			rangeinput0.$set(rangeinput0_changes);
    			const rangeinput1_changes = {};

    			if (!updating_value_2 && dirty & /*rp*/ 1) {
    				updating_value_2 = true;
    				rangeinput1_changes.value = /*rp*/ ctx[0].scale;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			rangeinput1.$set(rangeinput1_changes);
    			const numinput0_changes = {};

    			if (!updating_value_3 && dirty & /*rp*/ 1) {
    				updating_value_3 = true;
    				numinput0_changes.value = /*rp*/ ctx[0].dim.left;
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			numinput0.$set(numinput0_changes);
    			const numinput1_changes = {};

    			if (!updating_value_4 && dirty & /*rp*/ 1) {
    				updating_value_4 = true;
    				numinput1_changes.value = /*rp*/ ctx[0].dim.top;
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			numinput1.$set(numinput1_changes);
    			const colorinput0_changes = {};

    			if (!updating_value_5 && dirty & /*rp*/ 1) {
    				updating_value_5 = true;
    				colorinput0_changes.value = /*rp*/ ctx[0].colors.first;
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			colorinput0.$set(colorinput0_changes);
    			const colorinput1_changes = {};

    			if (!updating_value_6 && dirty & /*rp*/ 1) {
    				updating_value_6 = true;
    				colorinput1_changes.value = /*rp*/ ctx[0].colors.second;
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			colorinput1.$set(colorinput1_changes);
    			const input_changes = {};

    			if (!updating_value_7 && dirty & /*rp*/ 1) {
    				updating_value_7 = true;
    				input_changes.value = /*rp*/ ctx[0].fileName;
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input.$set(input_changes);
    			const select1_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				select1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_8 && dirty & /*rp*/ 1) {
    				updating_value_8 = true;
    				select1_changes.value = /*rp*/ ctx[0].fileType;
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			select1.$set(select1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select0.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(rangeinput0.$$.fragment, local);
    			transition_in(rangeinput1.$$.fragment, local);
    			transition_in(numinput0.$$.fragment, local);
    			transition_in(numinput1.$$.fragment, local);
    			transition_in(colorinput0.$$.fragment, local);
    			transition_in(colorinput1.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			transition_in(select1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select0.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(rangeinput0.$$.fragment, local);
    			transition_out(rangeinput1.$$.fragment, local);
    			transition_out(numinput0.$$.fragment, local);
    			transition_out(numinput1.$$.fragment, local);
    			transition_out(colorinput0.$$.fragment, local);
    			transition_out(colorinput1.$$.fragment, local);
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

    			destroy_component(rangeinput0);
    			destroy_component(rangeinput1);
    			destroy_component(numinput0);
    			destroy_component(numinput1);
    			destroy_component(colorinput0);
    			destroy_component(colorinput1);
    			destroy_component(input);
    			destroy_component(select1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputForm', slots, []);
    	const dispatch = createEventDispatcher();
    	let { rp } = $$props;
    	const writable_props = ['rp'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputForm> was created with unknown prop '${key}'`);
    	});

    	const func = () => dispatch('newtype');

    	function select0_value_binding(value) {
    		if ($$self.$$.not_equal(rp.type, value)) {
    			rp.type = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput0_value_binding(value) {
    		if ($$self.$$.not_equal(rp.dim.height, value)) {
    			rp.dim.height = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput1_value_binding(value) {
    		if ($$self.$$.not_equal(rp.dim.width, value)) {
    			rp.dim.width = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput2_value_binding(value) {
    		if ($$self.$$.not_equal(rp.dim.depth, value)) {
    			rp.dim.depth = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput0_value_binding_1(value) {
    		if ($$self.$$.not_equal(rp.dim.width, value)) {
    			rp.dim.width = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput1_value_binding_1(value) {
    		if ($$self.$$.not_equal(rp.dim.height, value)) {
    			rp.dim.height = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput2_value_binding_1(value) {
    		if ($$self.$$.not_equal(rp.dim.radius, value)) {
    			rp.dim.radius = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput0_value_binding_2(value) {
    		if ($$self.$$.not_equal(rp.dim.width, value)) {
    			rp.dim.width = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput1_value_binding_2(value) {
    		if ($$self.$$.not_equal(rp.dim.height, value)) {
    			rp.dim.height = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function rangeinput0_value_binding(value) {
    		if ($$self.$$.not_equal(rp.perspective, value)) {
    			rp.perspective = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function rangeinput1_value_binding(value) {
    		if ($$self.$$.not_equal(rp.scale, value)) {
    			rp.scale = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput0_value_binding_3(value) {
    		if ($$self.$$.not_equal(rp.dim.left, value)) {
    			rp.dim.left = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function numinput1_value_binding_3(value) {
    		if ($$self.$$.not_equal(rp.dim.top, value)) {
    			rp.dim.top = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function colorinput0_value_binding(value) {
    		if ($$self.$$.not_equal(rp.colors.first, value)) {
    			rp.colors.first = value;
    			$$invalidate(0, rp);
    		}
    	}

    	function colorinput1_value_binding(value) {
    		if ($$self.$$.not_equal(rp.colors.second, value)) {
    			rp.colors.second = value;
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

    	const click_handler = () => dispatch('exportimg');
    	const click_handler_1 = () => dispatch('save');
    	const click_handler_2 = () => dispatch('load');

    	$$self.$$set = $$props => {
    		if ('rp' in $$props) $$invalidate(0, rp = $$props.rp);
    	};

    	$$self.$capture_state = () => ({
    		Select,
    		Input,
    		NumInput,
    		RangeInput,
    		ColorInput,
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
    		func,
    		select0_value_binding,
    		numinput0_value_binding,
    		numinput1_value_binding,
    		numinput2_value_binding,
    		numinput0_value_binding_1,
    		numinput1_value_binding_1,
    		numinput2_value_binding_1,
    		numinput0_value_binding_2,
    		numinput1_value_binding_2,
    		rangeinput0_value_binding,
    		rangeinput1_value_binding,
    		numinput0_value_binding_3,
    		numinput1_value_binding_3,
    		colorinput0_value_binding,
    		colorinput1_value_binding,
    		input_value_binding,
    		select1_value_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class InputForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { rp: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputForm",
    			options,
    			id: create_fragment$5.name
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

    /* src/schemas/Prism.svelte generated by Svelte v3.44.0 */

    const file$4 = "src/schemas/Prism.svelte";

    function create_fragment$4(ctx) {
    	let svg_1;
    	let style;
    	let t0;
    	let defs;
    	let marker0;
    	let path0;
    	let marker1;
    	let path1;
    	let marker2;
    	let path2;
    	let marker3;
    	let path3;
    	let clipPath;
    	let path4;
    	let path4_d_value;
    	let path4_fill_value;
    	let path5;
    	let path5_d_value;
    	let path5_fill_value;
    	let path6;
    	let path6_d_value;
    	let path6_fill_value;
    	let path7;
    	let path7_d_value;
    	let path8;
    	let path8_d_value;
    	let path9;
    	let path9_d_value;
    	let text0;
    	let t1_value = /*renderParams*/ ctx[1].dim.width + "";
    	let t1;
    	let t2;
    	let text0_x_value;
    	let text0_y_value;
    	let path10;
    	let path10_d_value;
    	let path11;
    	let path11_d_value;
    	let path12;
    	let path12_d_value;
    	let text1;
    	let t3_value = /*renderParams*/ ctx[1].dim.height + "";
    	let t3;
    	let t4;
    	let text1_x_value;
    	let text1_y_value;
    	let path13;
    	let path13_d_value;
    	let path14;
    	let path14_d_value;
    	let path15;
    	let path15_d_value;
    	let text2;
    	let t5_value = /*renderParams*/ ctx[1].dim.depth + "";
    	let t5;
    	let t6;
    	let text2_x_value;
    	let text2_y_value;
    	let path16;
    	let path16_d_value;
    	let path17;
    	let path17_d_value;
    	let path18;
    	let path18_d_value;
    	let svg_1_viewBox_value;

    	const block = {
    		c: function create() {
    			svg_1 = svg_element("svg");
    			style = svg_element("style");
    			t0 = text(".arrow-marker {\n  fill: #999;\n}\n\n.arrow-dimension-line {\n  fill: none;\n  stroke-width: 0.75;\n  stroke: #999;\n}\n\n.arrow,\n        .arrow-inverted-start,\n        .arrow-inverted-end {\n  fill: none;\n  stroke-width: 1.5;\n  stroke: #999;\n}\n\n.arrow {\n  marker-start: url(#arrow-start);\n  marker-end: url(#arrow-end);\n}\n\n.arrow-inverted-start {\n  marker-end: url(#arrow-inverted-start);\n}\n\n.arrow-inverted-end {\n  marker-start: url(#arrow-inverted-end);\n}\n\n.border {\n  stroke-width: 2;\n  stroke: black;\n}\n");
    			defs = svg_element("defs");
    			marker0 = svg_element("marker");
    			path0 = svg_element("path");
    			marker1 = svg_element("marker");
    			path1 = svg_element("path");
    			marker2 = svg_element("marker");
    			path2 = svg_element("path");
    			marker3 = svg_element("marker");
    			path3 = svg_element("path");
    			clipPath = svg_element("clipPath");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			text0 = svg_element("text");
    			t1 = text(t1_value);
    			t2 = text(" mm");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			text1 = svg_element("text");
    			t3 = text(t3_value);
    			t4 = text(" mm");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			text2 = svg_element("text");
    			t5 = text(t5_value);
    			t6 = text(" mm");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			add_location(style, file$4, 17, 4, 641);
    			attr_dev(path0, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path0, "class", "arrow-marker");
    			add_location(path0, file$4, 55, 12, 1293);
    			attr_dev(marker0, "id", "arrow-start");
    			attr_dev(marker0, "orient", "auto");
    			attr_dev(marker0, "markerWidth", "10");
    			attr_dev(marker0, "markerHeight", "5");
    			attr_dev(marker0, "refX", "6.6666666666667");
    			attr_dev(marker0, "refY", "2.5");
    			add_location(marker0, file$4, 54, 8, 1173);
    			attr_dev(path1, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path1, "class", "arrow-marker");
    			add_location(path1, file$4, 58, 12, 1486);
    			attr_dev(marker1, "id", "arrow-end");
    			attr_dev(marker1, "orient", "auto");
    			attr_dev(marker1, "markerWidth", "10");
    			attr_dev(marker1, "markerHeight", "5");
    			attr_dev(marker1, "refX", "3.3333333333333");
    			attr_dev(marker1, "refY", "2.5");
    			add_location(marker1, file$4, 57, 8, 1368);
    			attr_dev(path2, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path2, "class", "arrow-marker");
    			add_location(path2, file$4, 62, 12, 1702);
    			attr_dev(marker2, "id", "arrow-inverted-start");
    			attr_dev(marker2, "orient", "auto");
    			attr_dev(marker2, "markerWidth", "10");
    			attr_dev(marker2, "markerHeight", "5");
    			attr_dev(marker2, "refX", "3.3333333333333");
    			attr_dev(marker2, "refY", "2.5");
    			add_location(marker2, file$4, 60, 8, 1561);
    			attr_dev(path3, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path3, "class", "arrow-marker");
    			add_location(path3, file$4, 66, 12, 1916);
    			attr_dev(marker3, "id", "arrow-inverted-end");
    			attr_dev(marker3, "orient", "auto");
    			attr_dev(marker3, "markerWidth", "10");
    			attr_dev(marker3, "markerHeight", "5");
    			attr_dev(marker3, "refX", "6.6666666666667");
    			attr_dev(marker3, "refY", "2.5");
    			add_location(marker3, file$4, 64, 8, 1777);
    			attr_dev(path4, "d", path4_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8] / 2}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] / 2}H${/*left*/ ctx[10]}Z`);
    			attr_dev(path4, "fill", path4_fill_value = /*colors*/ ctx[3].first);
    			add_location(path4, file$4, 69, 12, 2030);
    			attr_dev(clipPath, "id", "north-clip");
    			add_location(clipPath, file$4, 68, 8, 1991);
    			add_location(defs, file$4, 53, 4, 1158);
    			attr_dev(path5, "d", path5_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8]}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}H${/*left*/ ctx[10]}Z`);
    			attr_dev(path5, "fill", path5_fill_value = /*colors*/ ctx[3].second);
    			add_location(path5, file$4, 73, 4, 2259);
    			attr_dev(path6, "d", path6_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8]}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}H${/*left*/ ctx[10]}Z`);
    			attr_dev(path6, "fill", path6_fill_value = /*colors*/ ctx[3].first);
    			attr_dev(path6, "clip-path", "url(#north-clip)");
    			add_location(path6, file$4, 75, 4, 2445);
    			attr_dev(path7, "d", path7_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 3}v16`);
    			attr_dev(path7, "class", "arrow-dimension-line");
    			add_location(path7, file$4, 77, 4, 2659);
    			attr_dev(path8, "d", path8_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 3}v16`);
    			attr_dev(path8, "class", "arrow-dimension-line");
    			add_location(path8, file$4, 78, 4, 2746);
    			attr_dev(path9, "d", path9_d_value = `M${/*left*/ ctx[10] + 10} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 14}h${/*width*/ ctx[9] - 2 * 10}`);
    			attr_dev(path9, "class", "arrow");
    			add_location(path9, file$4, 79, 4, 2839);
    			attr_dev(text0, "x", text0_x_value = /*left*/ ctx[10] + /*width*/ ctx[9] / 2);
    			attr_dev(text0, "y", text0_y_value = /*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 34);
    			attr_dev(text0, "font-size", "21");
    			attr_dev(text0, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text0, "fill", "#999");
    			set_style(text0, "text-anchor", "middle");
    			add_location(text0, file$4, 80, 4, 2926);
    			attr_dev(path10, "d", path10_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11]}h16`);
    			attr_dev(path10, "class", "arrow-dimension-line");
    			add_location(path10, file$4, 82, 4, 3121);
    			attr_dev(path11, "d", path11_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11] + /*height*/ ctx[8]}h16`);
    			attr_dev(path11, "class", "arrow-dimension-line");
    			add_location(path11, file$4, 83, 4, 3206);
    			attr_dev(path12, "d", path12_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 11} ${/*top*/ ctx[11] + 10}v${/*height*/ ctx[8] - 2 * 10}`);
    			attr_dev(path12, "class", "arrow");
    			add_location(path12, file$4, 84, 4, 3298);
    			attr_dev(text1, "x", text1_x_value = /*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 24);
    			attr_dev(text1, "y", text1_y_value = /*top*/ ctx[11] + /*height*/ ctx[8] / 2 + 10);
    			attr_dev(text1, "font-size", "21");
    			attr_dev(text1, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text1, "fill", "#999");
    			set_style(text1, "text-anchor", "left");
    			add_location(text1, file$4, 85, 4, 3384);
    			attr_dev(path13, "d", path13_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 3}l${/*ll_w*/ ctx[7]} ${/*ll_h*/ ctx[6]}`);
    			attr_dev(path13, "class", "arrow-dimension-line");
    			add_location(path13, file$4, 87, 4, 3580);
    			attr_dev(path14, "d", path14_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11] + /*height*/ ctx[8] + 3}l${/*ll_w*/ ctx[7]} ${/*ll_h*/ ctx[6]}`);
    			attr_dev(path14, "class", "arrow-dimension-line");
    			add_location(path14, file$4, 88, 4, 3688);
    			attr_dev(path15, "d", path15_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9] + /*ll_w*/ ctx[7] / 2 + 3 + Math.cos(/*alpha*/ ctx[2]) * 10} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + /*ll_h*/ ctx[6] / 2 + 3 - Math.sin(/*alpha*/ ctx[2]) * 10}L${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + /*ll_w*/ ctx[7] / 2 + 3 - Math.cos(/*alpha*/ ctx[2]) * 10} ${/*top*/ ctx[11] + /*height*/ ctx[8] + /*ll_h*/ ctx[6] / 2 + 3 + Math.sin(/*alpha*/ ctx[2]) * 10}`);
    			attr_dev(path15, "class", "arrow");
    			add_location(path15, file$4, 89, 4, 3795);
    			attr_dev(text2, "x", text2_x_value = /*left*/ ctx[10] + /*width*/ ctx[9] + /*top_width*/ ctx[5] / 2);
    			attr_dev(text2, "y", text2_y_value = /*top*/ ctx[11] + /*height*/ ctx[8] + /*top_height*/ ctx[4] / 2 + 21);
    			attr_dev(text2, "font-size", "21");
    			attr_dev(text2, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text2, "fill", "#999");
    			set_style(text2, "text-anchor", "left");
    			attr_dev(text2, "transform", "translate(15, 15)");
    			add_location(text2, file$4, 90, 4, 4017);
    			attr_dev(path16, "d", path16_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}H${/*left*/ ctx[10] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}H${/*left*/ ctx[10]}Z`);
    			attr_dev(path16, "fill", "none");
    			attr_dev(path16, "class", "border");
    			add_location(path16, file$4, 92, 4, 4252);
    			attr_dev(path17, "d", path17_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8]}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}`);
    			attr_dev(path17, "fill", "none");
    			attr_dev(path17, "class", "border");
    			add_location(path17, file$4, 93, 4, 4373);
    			attr_dev(path18, "d", path18_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]} ${/*top*/ ctx[11]}`);
    			attr_dev(path18, "class", "border");
    			add_location(path18, file$4, 95, 4, 4556);
    			attr_dev(svg_1, "viewBox", svg_1_viewBox_value = `0 0 ${640 / /*renderParams*/ ctx[1].scale} ${440 / /*renderParams*/ ctx[1].scale}`);
    			attr_dev(svg_1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg_1, file$4, 16, 0, 512);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg_1, anchor);
    			append_dev(svg_1, style);
    			append_dev(style, t0);
    			append_dev(svg_1, defs);
    			append_dev(defs, marker0);
    			append_dev(marker0, path0);
    			append_dev(defs, marker1);
    			append_dev(marker1, path1);
    			append_dev(defs, marker2);
    			append_dev(marker2, path2);
    			append_dev(defs, marker3);
    			append_dev(marker3, path3);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, path4);
    			append_dev(svg_1, path5);
    			append_dev(svg_1, path6);
    			append_dev(svg_1, path7);
    			append_dev(svg_1, path8);
    			append_dev(svg_1, path9);
    			append_dev(svg_1, text0);
    			append_dev(text0, t1);
    			append_dev(text0, t2);
    			append_dev(svg_1, path10);
    			append_dev(svg_1, path11);
    			append_dev(svg_1, path12);
    			append_dev(svg_1, text1);
    			append_dev(text1, t3);
    			append_dev(text1, t4);
    			append_dev(svg_1, path13);
    			append_dev(svg_1, path14);
    			append_dev(svg_1, path15);
    			append_dev(svg_1, text2);
    			append_dev(text2, t5);
    			append_dev(text2, t6);
    			append_dev(svg_1, path16);
    			append_dev(svg_1, path17);
    			append_dev(svg_1, path18);
    			/*svg_1_binding*/ ctx[13](svg_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*left, top, top_height, top_width, width, height*/ 3888 && path4_d_value !== (path4_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8] / 2}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] / 2}H${/*left*/ ctx[10]}Z`)) {
    				attr_dev(path4, "d", path4_d_value);
    			}

    			if (dirty & /*colors*/ 8 && path4_fill_value !== (path4_fill_value = /*colors*/ ctx[3].first)) {
    				attr_dev(path4, "fill", path4_fill_value);
    			}

    			if (dirty & /*left, top, top_height, top_width, width, height*/ 3888 && path5_d_value !== (path5_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8]}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}H${/*left*/ ctx[10]}Z`)) {
    				attr_dev(path5, "d", path5_d_value);
    			}

    			if (dirty & /*colors*/ 8 && path5_fill_value !== (path5_fill_value = /*colors*/ ctx[3].second)) {
    				attr_dev(path5, "fill", path5_fill_value);
    			}

    			if (dirty & /*left, top, top_height, top_width, width, height*/ 3888 && path6_d_value !== (path6_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8]}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}H${/*left*/ ctx[10]}Z`)) {
    				attr_dev(path6, "d", path6_d_value);
    			}

    			if (dirty & /*colors*/ 8 && path6_fill_value !== (path6_fill_value = /*colors*/ ctx[3].first)) {
    				attr_dev(path6, "fill", path6_fill_value);
    			}

    			if (dirty & /*left, top, top_height, height*/ 3344 && path7_d_value !== (path7_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 3}v16`)) {
    				attr_dev(path7, "d", path7_d_value);
    			}

    			if (dirty & /*left, width, top, top_height, height*/ 3856 && path8_d_value !== (path8_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 3}v16`)) {
    				attr_dev(path8, "d", path8_d_value);
    			}

    			if (dirty & /*left, top, top_height, height, width*/ 3856 && path9_d_value !== (path9_d_value = `M${/*left*/ ctx[10] + 10} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 14}h${/*width*/ ctx[9] - 2 * 10}`)) {
    				attr_dev(path9, "d", path9_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t1_value !== (t1_value = /*renderParams*/ ctx[1].dim.width + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*left, width*/ 1536 && text0_x_value !== (text0_x_value = /*left*/ ctx[10] + /*width*/ ctx[9] / 2)) {
    				attr_dev(text0, "x", text0_x_value);
    			}

    			if (dirty & /*top, top_height, height*/ 2320 && text0_y_value !== (text0_y_value = /*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 34)) {
    				attr_dev(text0, "y", text0_y_value);
    			}

    			if (dirty & /*left, top_width, width, top*/ 3616 && path10_d_value !== (path10_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11]}h16`)) {
    				attr_dev(path10, "d", path10_d_value);
    			}

    			if (dirty & /*left, top_width, width, top, height*/ 3872 && path11_d_value !== (path11_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11] + /*height*/ ctx[8]}h16`)) {
    				attr_dev(path11, "d", path11_d_value);
    			}

    			if (dirty & /*left, top_width, width, top, height*/ 3872 && path12_d_value !== (path12_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 11} ${/*top*/ ctx[11] + 10}v${/*height*/ ctx[8] - 2 * 10}`)) {
    				attr_dev(path12, "d", path12_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t3_value !== (t3_value = /*renderParams*/ ctx[1].dim.height + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*left, top_width, width*/ 1568 && text1_x_value !== (text1_x_value = /*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 24)) {
    				attr_dev(text1, "x", text1_x_value);
    			}

    			if (dirty & /*top, height*/ 2304 && text1_y_value !== (text1_y_value = /*top*/ ctx[11] + /*height*/ ctx[8] / 2 + 10)) {
    				attr_dev(text1, "y", text1_y_value);
    			}

    			if (dirty & /*left, width, top, top_height, height, ll_w, ll_h*/ 4048 && path13_d_value !== (path13_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + 3}l${/*ll_w*/ ctx[7]} ${/*ll_h*/ ctx[6]}`)) {
    				attr_dev(path13, "d", path13_d_value);
    			}

    			if (dirty & /*left, top_width, width, top, height, ll_w, ll_h*/ 4064 && path14_d_value !== (path14_d_value = `M${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + 3} ${/*top*/ ctx[11] + /*height*/ ctx[8] + 3}l${/*ll_w*/ ctx[7]} ${/*ll_h*/ ctx[6]}`)) {
    				attr_dev(path14, "d", path14_d_value);
    			}

    			if (dirty & /*left, width, ll_w, alpha, top, top_height, height, ll_h, top_width*/ 4084 && path15_d_value !== (path15_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9] + /*ll_w*/ ctx[7] / 2 + 3 + Math.cos(/*alpha*/ ctx[2]) * 10} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8] + /*ll_h*/ ctx[6] / 2 + 3 - Math.sin(/*alpha*/ ctx[2]) * 10}L${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9] + /*ll_w*/ ctx[7] / 2 + 3 - Math.cos(/*alpha*/ ctx[2]) * 10} ${/*top*/ ctx[11] + /*height*/ ctx[8] + /*ll_h*/ ctx[6] / 2 + 3 + Math.sin(/*alpha*/ ctx[2]) * 10}`)) {
    				attr_dev(path15, "d", path15_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t5_value !== (t5_value = /*renderParams*/ ctx[1].dim.depth + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*left, width, top_width*/ 1568 && text2_x_value !== (text2_x_value = /*left*/ ctx[10] + /*width*/ ctx[9] + /*top_width*/ ctx[5] / 2)) {
    				attr_dev(text2, "x", text2_x_value);
    			}

    			if (dirty & /*top, height, top_height*/ 2320 && text2_y_value !== (text2_y_value = /*top*/ ctx[11] + /*height*/ ctx[8] + /*top_height*/ ctx[4] / 2 + 21)) {
    				attr_dev(text2, "y", text2_y_value);
    			}

    			if (dirty & /*left, top, top_height, width, height*/ 3856 && path16_d_value !== (path16_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}H${/*left*/ ctx[10] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}H${/*left*/ ctx[10]}Z`)) {
    				attr_dev(path16, "d", path16_d_value);
    			}

    			if (dirty & /*left, top, top_height, top_width, width, height*/ 3888 && path17_d_value !== (path17_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5]} ${/*top*/ ctx[11]}H${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]}V${/*top*/ ctx[11] + /*height*/ ctx[8]}L${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4] + /*height*/ ctx[8]}`)) {
    				attr_dev(path17, "d", path17_d_value);
    			}

    			if (dirty & /*left, width, top, top_height, top_width*/ 3632 && path18_d_value !== (path18_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[9]} ${/*top*/ ctx[11] + /*top_height*/ ctx[4]}L${/*left*/ ctx[10] + /*top_width*/ ctx[5] + /*width*/ ctx[9]} ${/*top*/ ctx[11]}`)) {
    				attr_dev(path18, "d", path18_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && svg_1_viewBox_value !== (svg_1_viewBox_value = `0 0 ${640 / /*renderParams*/ ctx[1].scale} ${440 / /*renderParams*/ ctx[1].scale}`)) {
    				attr_dev(svg_1, "viewBox", svg_1_viewBox_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg_1);
    			/*svg_1_binding*/ ctx[13](null);
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
    	let top;
    	let left;
    	let width;
    	let height;
    	let depth;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Prism', slots, []);
    	let { svg } = $$props;
    	let { renderParams } = $$props;
    	let colors;
    	let alpha, top_height, top_width, ll_h, ll_w;
    	const writable_props = ['svg', 'renderParams'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Prism> was created with unknown prop '${key}'`);
    	});

    	function svg_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			svg = $$value;
    			$$invalidate(0, svg);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    	};

    	$$self.$capture_state = () => ({
    		svg,
    		renderParams,
    		colors,
    		alpha,
    		top_height,
    		top_width,
    		ll_h,
    		ll_w,
    		depth,
    		height,
    		width,
    		left,
    		top
    	});

    	$$self.$inject_state = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    		if ('colors' in $$props) $$invalidate(3, colors = $$props.colors);
    		if ('alpha' in $$props) $$invalidate(2, alpha = $$props.alpha);
    		if ('top_height' in $$props) $$invalidate(4, top_height = $$props.top_height);
    		if ('top_width' in $$props) $$invalidate(5, top_width = $$props.top_width);
    		if ('ll_h' in $$props) $$invalidate(6, ll_h = $$props.ll_h);
    		if ('ll_w' in $$props) $$invalidate(7, ll_w = $$props.ll_w);
    		if ('depth' in $$props) $$invalidate(12, depth = $$props.depth);
    		if ('height' in $$props) $$invalidate(8, height = $$props.height);
    		if ('width' in $$props) $$invalidate(9, width = $$props.width);
    		if ('left' in $$props) $$invalidate(10, left = $$props.left);
    		if ('top' in $$props) $$invalidate(11, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(11, { top, left, width, height, depth } = renderParams.normalDim, top, ($$invalidate(10, left), $$invalidate(1, renderParams)), ($$invalidate(9, width), $$invalidate(1, renderParams)), ($$invalidate(8, height), $$invalidate(1, renderParams)), ($$invalidate(12, depth), $$invalidate(1, renderParams)));
    		}

    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(3, { colors } = renderParams, colors);
    		}

    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(2, alpha = renderParams.perspective * Math.PI / 2 / 0.3);
    		}

    		if ($$self.$$.dirty & /*alpha*/ 4) {
    			if (alpha < Math.PI / 12) $$invalidate(2, alpha = Math.PI / 12);
    		}

    		if ($$self.$$.dirty & /*depth, alpha*/ 4100) {
    			$$invalidate(4, top_height = depth * Math.sin(alpha));
    		}

    		if ($$self.$$.dirty & /*depth, alpha*/ 4100) {
    			$$invalidate(5, top_width = depth * Math.cos(alpha));
    		}

    		if ($$self.$$.dirty & /*alpha*/ 4) {
    			$$invalidate(6, ll_h = 16 * Math.cos(alpha));
    		}

    		if ($$self.$$.dirty & /*alpha*/ 4) {
    			$$invalidate(7, ll_w = 16 * Math.sin(alpha));
    		}
    	};

    	return [
    		svg,
    		renderParams,
    		alpha,
    		colors,
    		top_height,
    		top_width,
    		ll_h,
    		ll_w,
    		height,
    		width,
    		left,
    		top,
    		depth,
    		svg_1_binding
    	];
    }

    class Prism extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { svg: 0, renderParams: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prism",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*svg*/ ctx[0] === undefined && !('svg' in props)) {
    			console.warn("<Prism> was created without expected prop 'svg'");
    		}

    		if (/*renderParams*/ ctx[1] === undefined && !('renderParams' in props)) {
    			console.warn("<Prism> was created without expected prop 'renderParams'");
    		}
    	}

    	get svg() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get renderParams() {
    		throw new Error("<Prism>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set renderParams(value) {
    		throw new Error("<Prism>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/schemas/Ring.svelte generated by Svelte v3.44.0 */

    const file$3 = "src/schemas/Ring.svelte";

    function create_fragment$3(ctx) {
    	let svg_1;
    	let style;
    	let t0;
    	let defs;
    	let mask0;
    	let rect0;
    	let ellipse0;
    	let ellipse0_cx_value;
    	let ellipse0_cy_value;
    	let clipPath0;
    	let ellipse1;
    	let ellipse1_cx_value;
    	let ellipse1_cy_value;
    	let mask1;
    	let rect1;
    	let ellipse2;
    	let ellipse2_cx_value;
    	let ellipse2_cy_value;
    	let mask2;
    	let rect2;
    	let ellipse3;
    	let ellipse3_cx_value;
    	let ellipse3_cy_value;
    	let clipPath1;
    	let path0;
    	let path0_d_value;
    	let clipPath2;
    	let path1;
    	let path1_d_value;
    	let marker0;
    	let path2;
    	let marker1;
    	let path3;
    	let marker2;
    	let path4;
    	let marker3;
    	let path5;
    	let path6;
    	let path6_d_value;
    	let path7;
    	let path7_d_value;
    	let path8;
    	let path8_d_value;
    	let text0;
    	let t1_value = 2 * /*renderParams*/ ctx[1].dim.radius + "";
    	let t1;
    	let t2;
    	let text0_x_value;
    	let text0_y_value;
    	let g;
    	let rect3;
    	let rect3_height_value;
    	let rect3_fill_value;
    	let rect4;
    	let rect4_height_value;
    	let rect4_fill_value;
    	let rect5;
    	let rect5_x_value;
    	let rect5_y_value;
    	let rect5_width_value;
    	let rect5_height_value;
    	let rect5_fill_value;
    	let rect6;
    	let rect6_x_value;
    	let rect6_y_value;
    	let rect6_width_value;
    	let rect6_height_value;
    	let rect6_fill_value;
    	let path9;
    	let path9_d_value;
    	let path10;
    	let path10_d_value;
    	let path11;
    	let path11_d_value;
    	let text1;
    	let t3_value = /*renderParams*/ ctx[1].dim.height + "";
    	let t3;
    	let t4;
    	let text1_x_value;
    	let text1_y_value;
    	let path12;
    	let path12_d_value;
    	let path13;
    	let path13_d_value;
    	let path14;
    	let path14_d_value;
    	let text2;
    	let t5_value = /*renderParams*/ ctx[1].dim.width + "";
    	let t5;
    	let t6;
    	let text2_x_value;
    	let text2_y_value;
    	let ellipse4;
    	let ellipse4_cx_value;
    	let ellipse4_cy_value;
    	let ellipse4_rx_value;
    	let path15;
    	let path15_d_value;
    	let path16;
    	let path16_d_value;
    	let path17;
    	let path17_d_value;
    	let path18;
    	let path18_d_value;
    	let ellipse5;
    	let ellipse5_cx_value;
    	let ellipse5_cy_value;
    	let svg_1_viewBox_value;

    	const block = {
    		c: function create() {
    			svg_1 = svg_element("svg");
    			style = svg_element("style");
    			t0 = text(".border {\n  stroke-width: 2;\n  stroke: black;\n}\n\n.arrow-marker {\n  fill: #999;\n}\n\n.arrow-dimension-line {\n  fill: none;\n  stroke-width: 0.75;\n  stroke: #999;\n}\n\n.arrow,\n        .arrow-inverted-start,\n        .arrow-inverted-end {\n  fill: none;\n  stroke-width: 1.5;\n  stroke: #999;\n}\n\n.arrow {\n  marker-start: url(#arrow-start);\n  marker-end: url(#arrow-end);\n}\n\n.arrow-inverted-start {\n  marker-end: url(#arrow-inverted-start);\n}\n\n.arrow-inverted-end {\n  marker-start: url(#arrow-inverted-end);\n}\n");
    			defs = svg_element("defs");
    			mask0 = svg_element("mask");
    			rect0 = svg_element("rect");
    			ellipse0 = svg_element("ellipse");
    			clipPath0 = svg_element("clipPath");
    			ellipse1 = svg_element("ellipse");
    			mask1 = svg_element("mask");
    			rect1 = svg_element("rect");
    			ellipse2 = svg_element("ellipse");
    			mask2 = svg_element("mask");
    			rect2 = svg_element("rect");
    			ellipse3 = svg_element("ellipse");
    			clipPath1 = svg_element("clipPath");
    			path0 = svg_element("path");
    			clipPath2 = svg_element("clipPath");
    			path1 = svg_element("path");
    			marker0 = svg_element("marker");
    			path2 = svg_element("path");
    			marker1 = svg_element("marker");
    			path3 = svg_element("path");
    			marker2 = svg_element("marker");
    			path4 = svg_element("path");
    			marker3 = svg_element("marker");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			text0 = svg_element("text");
    			t1 = text(t1_value);
    			t2 = text(" mm");
    			g = svg_element("g");
    			rect3 = svg_element("rect");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			rect6 = svg_element("rect");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			text1 = svg_element("text");
    			t3 = text(t3_value);
    			t4 = text(" mm");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			text2 = svg_element("text");
    			t5 = text(t5_value);
    			t6 = text(" mm");
    			ellipse4 = svg_element("ellipse");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			ellipse5 = svg_element("ellipse");
    			add_location(style, file$3, 35, 4, 1041);
    			attr_dev(rect0, "width", "100%");
    			attr_dev(rect0, "height", "100%");
    			attr_dev(rect0, "fill", "white");
    			add_location(rect0, file$3, 73, 12, 1607);
    			attr_dev(ellipse0, "cx", ellipse0_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(ellipse0, "cy", ellipse0_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2]);
    			attr_dev(ellipse0, "rx", /*radius*/ ctx[4]);
    			attr_dev(ellipse0, "ry", /*inner_y*/ ctx[8]);
    			attr_dev(ellipse0, "fill", "black");
    			add_location(ellipse0, file$3, 74, 12, 1668);
    			attr_dev(mask0, "id", "mask-hole");
    			add_location(mask0, file$3, 72, 8, 1573);
    			attr_dev(ellipse1, "cx", ellipse1_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(ellipse1, "cy", ellipse1_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2]);
    			attr_dev(ellipse1, "rx", /*radius*/ ctx[4]);
    			attr_dev(ellipse1, "ry", /*inner_y*/ ctx[8]);
    			add_location(ellipse1, file$3, 77, 12, 1813);
    			attr_dev(clipPath0, "id", "clip-hole");
    			add_location(clipPath0, file$3, 76, 8, 1775);
    			attr_dev(rect1, "width", "100%");
    			attr_dev(rect1, "height", "100%");
    			attr_dev(rect1, "fill", "white");
    			add_location(rect1, file$3, 80, 12, 1952);
    			attr_dev(ellipse2, "cx", ellipse2_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(ellipse2, "cy", ellipse2_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8]);
    			attr_dev(ellipse2, "rx", /*radius*/ ctx[4]);
    			attr_dev(ellipse2, "ry", /*inner_y*/ ctx[8]);
    			attr_dev(ellipse2, "fill", "black");
    			add_location(ellipse2, file$3, 81, 12, 2013);
    			attr_dev(mask1, "id", "mask-hole-bottom");
    			add_location(mask1, file$3, 79, 8, 1911);
    			attr_dev(rect2, "width", "100%");
    			attr_dev(rect2, "height", "100%");
    			attr_dev(rect2, "fill", "white");
    			add_location(rect2, file$3, 84, 12, 2173);
    			attr_dev(ellipse3, "cx", ellipse3_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(ellipse3, "cy", ellipse3_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] / 2);
    			attr_dev(ellipse3, "rx", /*radius*/ ctx[4]);
    			attr_dev(ellipse3, "ry", /*inner_y*/ ctx[8]);
    			attr_dev(ellipse3, "fill", "black");
    			add_location(ellipse3, file$3, 85, 12, 2234);
    			attr_dev(mask2, "id", "mask-hole-south-pole");
    			add_location(mask2, file$3, 83, 8, 2128);
    			attr_dev(path0, "d", path0_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${/*width*/ ctx[3]} 0 v${/*height*/ ctx[9]} a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${-/*width*/ ctx[3]} 0 z`);
    			add_location(path0, file$3, 88, 12, 2390);
    			attr_dev(clipPath1, "id", "magnet-clip");
    			add_location(clipPath1, file$3, 87, 8, 2350);
    			attr_dev(path1, "d", path1_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${/*width*/ ctx[3]} 0 v${/*height*/ ctx[9] / 2} a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${-/*width*/ ctx[3]} 0 z`);
    			add_location(path1, file$3, 91, 12, 2583);
    			attr_dev(clipPath2, "id", "north-clip");
    			add_location(clipPath2, file$3, 90, 8, 2544);
    			attr_dev(path2, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path2, "class", "arrow-marker");
    			add_location(path2, file$3, 94, 12, 2859);
    			attr_dev(marker0, "id", "arrow-start");
    			attr_dev(marker0, "orient", "auto");
    			attr_dev(marker0, "markerWidth", "10");
    			attr_dev(marker0, "markerHeight", "5");
    			attr_dev(marker0, "refX", "6.6666666666667");
    			attr_dev(marker0, "refY", "2.5");
    			add_location(marker0, file$3, 93, 8, 2739);
    			attr_dev(path3, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path3, "class", "arrow-marker");
    			add_location(path3, file$3, 97, 12, 3052);
    			attr_dev(marker1, "id", "arrow-end");
    			attr_dev(marker1, "orient", "auto");
    			attr_dev(marker1, "markerWidth", "10");
    			attr_dev(marker1, "markerHeight", "5");
    			attr_dev(marker1, "refX", "3.3333333333333");
    			attr_dev(marker1, "refY", "2.5");
    			add_location(marker1, file$3, 96, 8, 2934);
    			attr_dev(path4, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path4, "class", "arrow-marker");
    			add_location(path4, file$3, 101, 12, 3268);
    			attr_dev(marker2, "id", "arrow-inverted-start");
    			attr_dev(marker2, "orient", "auto");
    			attr_dev(marker2, "markerWidth", "10");
    			attr_dev(marker2, "markerHeight", "5");
    			attr_dev(marker2, "refX", "3.3333333333333");
    			attr_dev(marker2, "refY", "2.5");
    			add_location(marker2, file$3, 99, 8, 3127);
    			attr_dev(path5, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path5, "class", "arrow-marker");
    			add_location(path5, file$3, 105, 12, 3482);
    			attr_dev(marker3, "id", "arrow-inverted-end");
    			attr_dev(marker3, "orient", "auto");
    			attr_dev(marker3, "markerWidth", "10");
    			attr_dev(marker3, "markerHeight", "5");
    			attr_dev(marker3, "refX", "6.6666666666667");
    			attr_dev(marker3, "refY", "2.5");
    			add_location(marker3, file$3, 103, 8, 3343);
    			add_location(defs, file$3, 71, 4, 1558);
    			attr_dev(path6, "d", path6_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]} ${/*ttop*/ ctx[6] + 21 + 3}L${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}`);
    			attr_dev(path6, "class", "arrow-dimension-line");
    			add_location(path6, file$3, 108, 4, 3565);
    			attr_dev(path7, "d", path7_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 + /*radius*/ ctx[4]} ${/*ttop*/ ctx[6] + 21 + 3}L${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 + /*radius*/ ctx[4]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}`);
    			attr_dev(path7, "class", "arrow-dimension-line");
    			add_location(path7, file$3, 109, 4, 3686);
    			attr_dev(path8, "d", path8_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4] + 10} ${/*ttop*/ ctx[6] + 21 + 10}h${2 * /*radius*/ ctx[4] - 2 * 10}`);
    			attr_dev(path8, "class", "arrow");
    			add_location(path8, file$3, 110, 4, 3807);
    			attr_dev(text0, "x", text0_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(text0, "y", text0_y_value = /*ttop*/ ctx[6] + 21);
    			attr_dev(text0, "font-size", "21");
    			attr_dev(text0, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text0, "text-anchor", "middle");
    			set_style(text0, "fill", "#999");
    			add_location(text0, file$3, 111, 4, 3898);
    			attr_dev(rect3, "x", /*left*/ ctx[10]);
    			attr_dev(rect3, "y", /*top*/ ctx[5]);
    			attr_dev(rect3, "width", /*width*/ ctx[3]);
    			attr_dev(rect3, "height", rect3_height_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2]);
    			set_style(rect3, "clip-path", "url(#magnet-clip)");
    			attr_dev(rect3, "fill", rect3_fill_value = /*colors*/ ctx[7].second);
    			add_location(rect3, file$3, 114, 8, 4114);
    			attr_dev(rect4, "x", /*left*/ ctx[10]);
    			attr_dev(rect4, "y", /*top*/ ctx[5]);
    			attr_dev(rect4, "width", /*width*/ ctx[3]);
    			attr_dev(rect4, "height", rect4_height_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2]);
    			set_style(rect4, "clip-path", "url(#north-clip)");
    			attr_dev(rect4, "fill", rect4_fill_value = /*colors*/ ctx[7].first);
    			add_location(rect4, file$3, 115, 8, 4252);
    			attr_dev(g, "mask", "url(#mask-hole)");
    			add_location(g, file$3, 113, 4, 4079);
    			attr_dev(rect5, "x", rect5_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]);
    			attr_dev(rect5, "y", rect5_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8]);
    			attr_dev(rect5, "width", rect5_width_value = 2 * /*radius*/ ctx[4]);
    			attr_dev(rect5, "height", rect5_height_value = /*height*/ ctx[9] + /*inner_y*/ ctx[8]);
    			attr_dev(rect5, "fill", rect5_fill_value = darken(/*colors*/ ctx[7].second, -1 / 4));
    			attr_dev(rect5, "clip-path", "url(#clip-hole)");
    			attr_dev(rect5, "mask", "url(#mask-hole-bottom)");
    			add_location(rect5, file$3, 117, 4, 4393);
    			attr_dev(rect6, "x", rect6_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]);
    			attr_dev(rect6, "y", rect6_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8]);
    			attr_dev(rect6, "width", rect6_width_value = 2 * /*radius*/ ctx[4]);
    			attr_dev(rect6, "height", rect6_height_value = /*height*/ ctx[9] / 2 + /*inner_y*/ ctx[8]);
    			attr_dev(rect6, "fill", rect6_fill_value = darken(/*colors*/ ctx[7].first, -1 / 4));
    			attr_dev(rect6, "clip-path", "url(#clip-hole)");
    			attr_dev(rect6, "mask", "url(#mask-hole-south-pole)");
    			add_location(rect6, file$3, 119, 4, 4594);
    			attr_dev(path9, "d", path9_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] + 3} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}h16`);
    			attr_dev(path9, "class", "arrow-dimension-line");
    			add_location(path9, file$3, 122, 4, 4820);
    			attr_dev(path10, "d", path10_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] + 3} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9]}h16`);
    			attr_dev(path10, "class", "arrow-dimension-line");
    			add_location(path10, file$3, 123, 4, 4901);
    			attr_dev(path11, "d", path11_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] + 14} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + 10}v${/*height*/ ctx[9] - 2 * 10}`);
    			attr_dev(path11, "class", "arrow");
    			add_location(path11, file$3, 124, 4, 4989);
    			attr_dev(text1, "x", text1_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] + 20);
    			attr_dev(text1, "y", text1_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] / 2 + 21 / 2);
    			attr_dev(text1, "font-size", "21");
    			attr_dev(text1, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text1, "fill", "#999");
    			set_style(text1, "text-anchor", "left");
    			add_location(text1, file$3, 125, 4, 5071);
    			attr_dev(path12, "d", path12_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + 3}v${/*rad_y*/ ctx[2] + 7}`);
    			attr_dev(path12, "class", "arrow-dimension-line");
    			add_location(path12, file$3, 127, 4, 5265);
    			attr_dev(path13, "d", path13_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + 3}v${/*rad_y*/ ctx[2] + 7}`);
    			attr_dev(path13, "class", "arrow-dimension-line");
    			add_location(path13, file$3, 128, 4, 5355);
    			attr_dev(path14, "d", path14_d_value = `M${/*left*/ ctx[10] + 10} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2] + 7}h${/*width*/ ctx[3] - 2 * 10}`);
    			attr_dev(path14, "class", "arrow");
    			add_location(path14, file$3, 129, 4, 5451);
    			attr_dev(text2, "x", text2_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(text2, "y", text2_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2] + 30);
    			attr_dev(text2, "font-size", "21");
    			attr_dev(text2, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text2, "fill", "#999");
    			set_style(text2, "text-anchor", "middle");
    			add_location(text2, file$3, 130, 4, 5538);
    			attr_dev(ellipse4, "cx", ellipse4_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(ellipse4, "cy", ellipse4_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2]);
    			attr_dev(ellipse4, "rx", ellipse4_rx_value = /*width*/ ctx[3] / 2);
    			attr_dev(ellipse4, "ry", /*rad_y*/ ctx[2]);
    			attr_dev(ellipse4, "class", "border");
    			attr_dev(ellipse4, "fill", "none");
    			add_location(ellipse4, file$3, 132, 4, 5734);
    			attr_dev(path15, "d", path15_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9]}a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 0 ${/*width*/ ctx[3]} 0`);
    			attr_dev(path15, "class", "border");
    			attr_dev(path15, "fill", "none");
    			add_location(path15, file$3, 134, 4, 5842);
    			attr_dev(path16, "d", path16_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}v${/*height*/ ctx[9]}`);
    			attr_dev(path16, "class", "border");
    			add_location(path16, file$3, 135, 4, 5954);
    			attr_dev(path17, "d", path17_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}v${/*height*/ ctx[9]}`);
    			attr_dev(path17, "class", "border");
    			add_location(path17, file$3, 136, 4, 6020);
    			attr_dev(path18, "d", path18_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8]}a${/*radius*/ ctx[4]} ${/*inner_y*/ ctx[8]} 0 0 1 ${2 * /*radius*/ ctx[4]} 0`);
    			attr_dev(path18, "class", "border");
    			attr_dev(path18, "fill", "none");
    			attr_dev(path18, "clip-path", "url(#clip-hole)");
    			add_location(path18, file$3, 137, 4, 6092);
    			attr_dev(ellipse5, "cx", ellipse5_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2);
    			attr_dev(ellipse5, "cy", ellipse5_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2]);
    			attr_dev(ellipse5, "rx", /*radius*/ ctx[4]);
    			attr_dev(ellipse5, "ry", /*inner_y*/ ctx[8]);
    			attr_dev(ellipse5, "class", "border");
    			attr_dev(ellipse5, "fill", "none");
    			add_location(ellipse5, file$3, 138, 4, 6252);
    			attr_dev(svg_1, "viewBox", svg_1_viewBox_value = `0 0 ${640 / /*renderParams*/ ctx[1].scale} ${440 / /*renderParams*/ ctx[1].scale}`);
    			attr_dev(svg_1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg_1, file$3, 34, 0, 912);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg_1, anchor);
    			append_dev(svg_1, style);
    			append_dev(style, t0);
    			append_dev(svg_1, defs);
    			append_dev(defs, mask0);
    			append_dev(mask0, rect0);
    			append_dev(mask0, ellipse0);
    			append_dev(defs, clipPath0);
    			append_dev(clipPath0, ellipse1);
    			append_dev(defs, mask1);
    			append_dev(mask1, rect1);
    			append_dev(mask1, ellipse2);
    			append_dev(defs, mask2);
    			append_dev(mask2, rect2);
    			append_dev(mask2, ellipse3);
    			append_dev(defs, clipPath1);
    			append_dev(clipPath1, path0);
    			append_dev(defs, clipPath2);
    			append_dev(clipPath2, path1);
    			append_dev(defs, marker0);
    			append_dev(marker0, path2);
    			append_dev(defs, marker1);
    			append_dev(marker1, path3);
    			append_dev(defs, marker2);
    			append_dev(marker2, path4);
    			append_dev(defs, marker3);
    			append_dev(marker3, path5);
    			append_dev(svg_1, path6);
    			append_dev(svg_1, path7);
    			append_dev(svg_1, path8);
    			append_dev(svg_1, text0);
    			append_dev(text0, t1);
    			append_dev(text0, t2);
    			append_dev(svg_1, g);
    			append_dev(g, rect3);
    			append_dev(g, rect4);
    			append_dev(svg_1, rect5);
    			append_dev(svg_1, rect6);
    			append_dev(svg_1, path9);
    			append_dev(svg_1, path10);
    			append_dev(svg_1, path11);
    			append_dev(svg_1, text1);
    			append_dev(text1, t3);
    			append_dev(text1, t4);
    			append_dev(svg_1, path12);
    			append_dev(svg_1, path13);
    			append_dev(svg_1, path14);
    			append_dev(svg_1, text2);
    			append_dev(text2, t5);
    			append_dev(text2, t6);
    			append_dev(svg_1, ellipse4);
    			append_dev(svg_1, path15);
    			append_dev(svg_1, path16);
    			append_dev(svg_1, path17);
    			append_dev(svg_1, path18);
    			append_dev(svg_1, ellipse5);
    			/*svg_1_binding*/ ctx[11](svg_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*left, width*/ 1032 && ellipse0_cx_value !== (ellipse0_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse0, "cx", ellipse0_cx_value);
    			}

    			if (dirty & /*top, rad_y*/ 36 && ellipse0_cy_value !== (ellipse0_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2])) {
    				attr_dev(ellipse0, "cy", ellipse0_cy_value);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(ellipse0, "rx", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*inner_y*/ 256) {
    				attr_dev(ellipse0, "ry", /*inner_y*/ ctx[8]);
    			}

    			if (dirty & /*left, width*/ 1032 && ellipse1_cx_value !== (ellipse1_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse1, "cx", ellipse1_cx_value);
    			}

    			if (dirty & /*top, rad_y*/ 36 && ellipse1_cy_value !== (ellipse1_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2])) {
    				attr_dev(ellipse1, "cy", ellipse1_cy_value);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(ellipse1, "rx", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*inner_y*/ 256) {
    				attr_dev(ellipse1, "ry", /*inner_y*/ ctx[8]);
    			}

    			if (dirty & /*left, width*/ 1032 && ellipse2_cx_value !== (ellipse2_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse2, "cx", ellipse2_cx_value);
    			}

    			if (dirty & /*top, rad_y, inner_y*/ 292 && ellipse2_cy_value !== (ellipse2_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8])) {
    				attr_dev(ellipse2, "cy", ellipse2_cy_value);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(ellipse2, "rx", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*inner_y*/ 256) {
    				attr_dev(ellipse2, "ry", /*inner_y*/ ctx[8]);
    			}

    			if (dirty & /*left, width*/ 1032 && ellipse3_cx_value !== (ellipse3_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse3, "cx", ellipse3_cx_value);
    			}

    			if (dirty & /*top, rad_y, height*/ 548 && ellipse3_cy_value !== (ellipse3_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] / 2)) {
    				attr_dev(ellipse3, "cy", ellipse3_cy_value);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(ellipse3, "rx", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*inner_y*/ 256) {
    				attr_dev(ellipse3, "ry", /*inner_y*/ ctx[8]);
    			}

    			if (dirty & /*left, top, rad_y, width, height*/ 1580 && path0_d_value !== (path0_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${/*width*/ ctx[3]} 0 v${/*height*/ ctx[9]} a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${-/*width*/ ctx[3]} 0 z`)) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*left, top, rad_y, width, height*/ 1580 && path1_d_value !== (path1_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${/*width*/ ctx[3]} 0 v${/*height*/ ctx[9] / 2} a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 1 ${-/*width*/ ctx[3]} 0 z`)) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*left, width, radius, ttop, top, rad_y*/ 1148 && path6_d_value !== (path6_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]} ${/*ttop*/ ctx[6] + 21 + 3}L${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}`)) {
    				attr_dev(path6, "d", path6_d_value);
    			}

    			if (dirty & /*left, width, radius, ttop, top, rad_y*/ 1148 && path7_d_value !== (path7_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 + /*radius*/ ctx[4]} ${/*ttop*/ ctx[6] + 21 + 3}L${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 + /*radius*/ ctx[4]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}`)) {
    				attr_dev(path7, "d", path7_d_value);
    			}

    			if (dirty & /*left, width, radius, ttop*/ 1112 && path8_d_value !== (path8_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4] + 10} ${/*ttop*/ ctx[6] + 21 + 10}h${2 * /*radius*/ ctx[4] - 2 * 10}`)) {
    				attr_dev(path8, "d", path8_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t1_value !== (t1_value = 2 * /*renderParams*/ ctx[1].dim.radius + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*left, width*/ 1032 && text0_x_value !== (text0_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(text0, "x", text0_x_value);
    			}

    			if (dirty & /*ttop*/ 64 && text0_y_value !== (text0_y_value = /*ttop*/ ctx[6] + 21)) {
    				attr_dev(text0, "y", text0_y_value);
    			}

    			if (dirty & /*left*/ 1024) {
    				attr_dev(rect3, "x", /*left*/ ctx[10]);
    			}

    			if (dirty & /*top*/ 32) {
    				attr_dev(rect3, "y", /*top*/ ctx[5]);
    			}

    			if (dirty & /*width*/ 8) {
    				attr_dev(rect3, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*top, rad_y, height*/ 548 && rect3_height_value !== (rect3_height_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2])) {
    				attr_dev(rect3, "height", rect3_height_value);
    			}

    			if (dirty & /*colors*/ 128 && rect3_fill_value !== (rect3_fill_value = /*colors*/ ctx[7].second)) {
    				attr_dev(rect3, "fill", rect3_fill_value);
    			}

    			if (dirty & /*left*/ 1024) {
    				attr_dev(rect4, "x", /*left*/ ctx[10]);
    			}

    			if (dirty & /*top*/ 32) {
    				attr_dev(rect4, "y", /*top*/ ctx[5]);
    			}

    			if (dirty & /*width*/ 8) {
    				attr_dev(rect4, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*top, rad_y, height*/ 548 && rect4_height_value !== (rect4_height_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2])) {
    				attr_dev(rect4, "height", rect4_height_value);
    			}

    			if (dirty & /*colors*/ 128 && rect4_fill_value !== (rect4_fill_value = /*colors*/ ctx[7].first)) {
    				attr_dev(rect4, "fill", rect4_fill_value);
    			}

    			if (dirty & /*left, width, radius*/ 1048 && rect5_x_value !== (rect5_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4])) {
    				attr_dev(rect5, "x", rect5_x_value);
    			}

    			if (dirty & /*top, rad_y, inner_y*/ 292 && rect5_y_value !== (rect5_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8])) {
    				attr_dev(rect5, "y", rect5_y_value);
    			}

    			if (dirty & /*radius*/ 16 && rect5_width_value !== (rect5_width_value = 2 * /*radius*/ ctx[4])) {
    				attr_dev(rect5, "width", rect5_width_value);
    			}

    			if (dirty & /*height, inner_y*/ 768 && rect5_height_value !== (rect5_height_value = /*height*/ ctx[9] + /*inner_y*/ ctx[8])) {
    				attr_dev(rect5, "height", rect5_height_value);
    			}

    			if (dirty & /*colors*/ 128 && rect5_fill_value !== (rect5_fill_value = darken(/*colors*/ ctx[7].second, -1 / 4))) {
    				attr_dev(rect5, "fill", rect5_fill_value);
    			}

    			if (dirty & /*left, width, radius*/ 1048 && rect6_x_value !== (rect6_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4])) {
    				attr_dev(rect6, "x", rect6_x_value);
    			}

    			if (dirty & /*top, rad_y, inner_y*/ 292 && rect6_y_value !== (rect6_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8])) {
    				attr_dev(rect6, "y", rect6_y_value);
    			}

    			if (dirty & /*radius*/ 16 && rect6_width_value !== (rect6_width_value = 2 * /*radius*/ ctx[4])) {
    				attr_dev(rect6, "width", rect6_width_value);
    			}

    			if (dirty & /*height, inner_y*/ 768 && rect6_height_value !== (rect6_height_value = /*height*/ ctx[9] / 2 + /*inner_y*/ ctx[8])) {
    				attr_dev(rect6, "height", rect6_height_value);
    			}

    			if (dirty & /*colors*/ 128 && rect6_fill_value !== (rect6_fill_value = darken(/*colors*/ ctx[7].first, -1 / 4))) {
    				attr_dev(rect6, "fill", rect6_fill_value);
    			}

    			if (dirty & /*left, width, top, rad_y*/ 1068 && path9_d_value !== (path9_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] + 3} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}h16`)) {
    				attr_dev(path9, "d", path9_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 1580 && path10_d_value !== (path10_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] + 3} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9]}h16`)) {
    				attr_dev(path10, "d", path10_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 1580 && path11_d_value !== (path11_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] + 14} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + 10}v${/*height*/ ctx[9] - 2 * 10}`)) {
    				attr_dev(path11, "d", path11_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t3_value !== (t3_value = /*renderParams*/ ctx[1].dim.height + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*left, width*/ 1032 && text1_x_value !== (text1_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] + 20)) {
    				attr_dev(text1, "x", text1_x_value);
    			}

    			if (dirty & /*top, rad_y, height*/ 548 && text1_y_value !== (text1_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] / 2 + 21 / 2)) {
    				attr_dev(text1, "y", text1_y_value);
    			}

    			if (dirty & /*left, top, rad_y, height*/ 1572 && path12_d_value !== (path12_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + 3}v${/*rad_y*/ ctx[2] + 7}`)) {
    				attr_dev(path12, "d", path12_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 1580 && path13_d_value !== (path13_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + 3}v${/*rad_y*/ ctx[2] + 7}`)) {
    				attr_dev(path13, "d", path13_d_value);
    			}

    			if (dirty & /*left, top, rad_y, height, width*/ 1580 && path14_d_value !== (path14_d_value = `M${/*left*/ ctx[10] + 10} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2] + 7}h${/*width*/ ctx[3] - 2 * 10}`)) {
    				attr_dev(path14, "d", path14_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t5_value !== (t5_value = /*renderParams*/ ctx[1].dim.width + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*left, width*/ 1032 && text2_x_value !== (text2_x_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(text2, "x", text2_x_value);
    			}

    			if (dirty & /*top, rad_y, height*/ 548 && text2_y_value !== (text2_y_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9] + /*rad_y*/ ctx[2] + 30)) {
    				attr_dev(text2, "y", text2_y_value);
    			}

    			if (dirty & /*left, width*/ 1032 && ellipse4_cx_value !== (ellipse4_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse4, "cx", ellipse4_cx_value);
    			}

    			if (dirty & /*top, rad_y*/ 36 && ellipse4_cy_value !== (ellipse4_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2])) {
    				attr_dev(ellipse4, "cy", ellipse4_cy_value);
    			}

    			if (dirty & /*width*/ 8 && ellipse4_rx_value !== (ellipse4_rx_value = /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse4, "rx", ellipse4_rx_value);
    			}

    			if (dirty & /*rad_y*/ 4) {
    				attr_dev(ellipse4, "ry", /*rad_y*/ ctx[2]);
    			}

    			if (dirty & /*left, top, rad_y, height, width*/ 1580 && path15_d_value !== (path15_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] + /*height*/ ctx[9]}a${/*width*/ ctx[3] / 2} ${/*rad_y*/ ctx[2]} 0 0 0 ${/*width*/ ctx[3]} 0`)) {
    				attr_dev(path15, "d", path15_d_value);
    			}

    			if (dirty & /*left, top, rad_y, height*/ 1572 && path16_d_value !== (path16_d_value = `M${/*left*/ ctx[10]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}v${/*height*/ ctx[9]}`)) {
    				attr_dev(path16, "d", path16_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 1580 && path17_d_value !== (path17_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2]}v${/*height*/ ctx[9]}`)) {
    				attr_dev(path17, "d", path17_d_value);
    			}

    			if (dirty & /*left, width, radius, top, rad_y, inner_y*/ 1340 && path18_d_value !== (path18_d_value = `M${/*left*/ ctx[10] + /*width*/ ctx[3] / 2 - /*radius*/ ctx[4]} ${/*top*/ ctx[5] + /*rad_y*/ ctx[2] - /*inner_y*/ ctx[8]}a${/*radius*/ ctx[4]} ${/*inner_y*/ ctx[8]} 0 0 1 ${2 * /*radius*/ ctx[4]} 0`)) {
    				attr_dev(path18, "d", path18_d_value);
    			}

    			if (dirty & /*left, width*/ 1032 && ellipse5_cx_value !== (ellipse5_cx_value = /*left*/ ctx[10] + /*width*/ ctx[3] / 2)) {
    				attr_dev(ellipse5, "cx", ellipse5_cx_value);
    			}

    			if (dirty & /*top, rad_y*/ 36 && ellipse5_cy_value !== (ellipse5_cy_value = /*top*/ ctx[5] + /*rad_y*/ ctx[2])) {
    				attr_dev(ellipse5, "cy", ellipse5_cy_value);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(ellipse5, "rx", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*inner_y*/ 256) {
    				attr_dev(ellipse5, "ry", /*inner_y*/ ctx[8]);
    			}

    			if (dirty & /*renderParams*/ 2 && svg_1_viewBox_value !== (svg_1_viewBox_value = `0 0 ${640 / /*renderParams*/ ctx[1].scale} ${440 / /*renderParams*/ ctx[1].scale}`)) {
    				attr_dev(svg_1, "viewBox", svg_1_viewBox_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg_1);
    			/*svg_1_binding*/ ctx[11](null);
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

    function darken(hex, lum) {
    	hex = String(hex).replace(/[^0-9a-f]/gi, '');

    	if (hex.length < 6) {
    		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    	}

    	lum = lum || 0;
    	var rgb = "#", c, i;

    	for (i = 0; i < 3; i++) {
    		c = parseInt(hex.substr(i * 2, 2), 16);
    		c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
    		rgb += ("00" + c).substr(c.length);
    	}

    	return rgb;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let top;
    	let left;
    	let width;
    	let height;
    	let radius;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ring', slots, []);
    	let { svg } = $$props;
    	let { renderParams } = $$props;
    	let ttop = 0;
    	let colors;
    	let rad_y, inner_y;
    	const writable_props = ['svg', 'renderParams'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ring> was created with unknown prop '${key}'`);
    	});

    	function svg_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			svg = $$value;
    			$$invalidate(0, svg);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    	};

    	$$self.$capture_state = () => ({
    		svg,
    		renderParams,
    		ttop,
    		colors,
    		rad_y,
    		inner_y,
    		darken,
    		width,
    		radius,
    		top,
    		height,
    		left
    	});

    	$$self.$inject_state = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    		if ('ttop' in $$props) $$invalidate(6, ttop = $$props.ttop);
    		if ('colors' in $$props) $$invalidate(7, colors = $$props.colors);
    		if ('rad_y' in $$props) $$invalidate(2, rad_y = $$props.rad_y);
    		if ('inner_y' in $$props) $$invalidate(8, inner_y = $$props.inner_y);
    		if ('width' in $$props) $$invalidate(3, width = $$props.width);
    		if ('radius' in $$props) $$invalidate(4, radius = $$props.radius);
    		if ('top' in $$props) $$invalidate(5, top = $$props.top);
    		if ('height' in $$props) $$invalidate(9, height = $$props.height);
    		if ('left' in $$props) $$invalidate(10, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(5, { top, left, width, height, radius } = renderParams.normalDim, top, ($$invalidate(10, left), $$invalidate(1, renderParams)), ($$invalidate(3, width), $$invalidate(1, renderParams)), ($$invalidate(9, height), $$invalidate(1, renderParams)), ($$invalidate(4, radius), $$invalidate(1, renderParams)));
    		}

    		if ($$self.$$.dirty & /*renderParams, top*/ 34) {
    			if (renderParams) {
    				$$invalidate(6, ttop = top);
    				$$invalidate(5, top += 21 + 20);
    			}
    		}

    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(7, { colors } = renderParams, colors);
    		}

    		if ($$self.$$.dirty & /*width, renderParams*/ 10) {
    			$$invalidate(2, rad_y = width * renderParams.perspective);
    		}

    		if ($$self.$$.dirty & /*rad_y, radius, width*/ 28) {
    			$$invalidate(8, inner_y = rad_y * 2 * radius / width);
    		}
    	};

    	return [
    		svg,
    		renderParams,
    		rad_y,
    		width,
    		radius,
    		top,
    		ttop,
    		colors,
    		inner_y,
    		height,
    		left,
    		svg_1_binding
    	];
    }

    class Ring extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { svg: 0, renderParams: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ring",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*svg*/ ctx[0] === undefined && !('svg' in props)) {
    			console.warn("<Ring> was created without expected prop 'svg'");
    		}

    		if (/*renderParams*/ ctx[1] === undefined && !('renderParams' in props)) {
    			console.warn("<Ring> was created without expected prop 'renderParams'");
    		}
    	}

    	get svg() {
    		throw new Error("<Ring>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Ring>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get renderParams() {
    		throw new Error("<Ring>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set renderParams(value) {
    		throw new Error("<Ring>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/schemas/Cylinder.svelte generated by Svelte v3.44.0 */

    const file$2 = "src/schemas/Cylinder.svelte";

    function create_fragment$2(ctx) {
    	let svg_1;
    	let style;
    	let t0;
    	let defs;
    	let clipPath0;
    	let path0;
    	let path0_d_value;
    	let clipPath1;
    	let path1;
    	let path1_d_value;
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
    	let rect0_height_value;
    	let rect0_style_value;
    	let rect1;
    	let rect1_height_value;
    	let rect1_style_value;
    	let path6;
    	let path6_d_value;
    	let path7;
    	let path7_d_value;
    	let path8;
    	let path8_d_value;
    	let text0;
    	let t1_value = /*renderParams*/ ctx[1].dim.height + "";
    	let t1;
    	let t2;
    	let text0_x_value;
    	let text0_y_value;
    	let path9;
    	let path9_d_value;
    	let path10;
    	let path10_d_value;
    	let path11;
    	let path11_d_value;
    	let text1;
    	let t3_value = /*renderParams*/ ctx[1].dim.width + "";
    	let t3;
    	let t4;
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
    	let svg_1_viewBox_value;

    	const block = {
    		c: function create() {
    			svg_1 = svg_element("svg");
    			style = svg_element("style");
    			t0 = text(".arrow-marker {\n  fill: #999;\n}\n\n.arrow-dimension-line {\n  fill: none;\n  stroke-width: 0.75;\n  stroke: #999;\n}\n\n.arrow,\n        .arrow-inverted-start,\n        .arrow-inverted-end {\n  fill: none;\n  stroke-width: 1.5;\n  stroke: #999;\n}\n\n.arrow {\n  marker-start: url(#arrow-start);\n  marker-end: url(#arrow-end);\n}\n\n.arrow-inverted-start {\n  marker-end: url(#arrow-inverted-start);\n}\n\n.arrow-inverted-end {\n  marker-start: url(#arrow-inverted-end);\n}\n\n.border {\n  stroke-width: 2;\n  stroke: black;\n}\n");
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
    			t1 = text(t1_value);
    			t2 = text(" mm");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			text1 = svg_element("text");
    			t3 = text(t3_value);
    			t4 = text(" mm");
    			ellipse = svg_element("ellipse");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			add_location(style, file$2, 11, 4, 378);
    			attr_dev(path0, "d", path0_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${/*width*/ ctx[2]} 0 v${/*height*/ ctx[5]} a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${-/*width*/ ctx[2]} 0 z`);
    			add_location(path0, file$2, 49, 12, 950);
    			attr_dev(clipPath0, "id", "magnet-clip");
    			add_location(clipPath0, file$2, 48, 8, 910);
    			attr_dev(path1, "d", path1_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${/*width*/ ctx[2]} 0 v${/*height*/ ctx[5] / 2} a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${-/*width*/ ctx[2]} 0 z`);
    			add_location(path1, file$2, 53, 12, 1159);
    			attr_dev(clipPath1, "id", "north-clip");
    			add_location(clipPath1, file$2, 52, 8, 1120);
    			attr_dev(path2, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path2, "class", "arrow-marker");
    			add_location(path2, file$2, 57, 12, 1451);
    			attr_dev(marker0, "id", "arrow-start");
    			attr_dev(marker0, "orient", "auto");
    			attr_dev(marker0, "markerWidth", "10");
    			attr_dev(marker0, "markerHeight", "5");
    			attr_dev(marker0, "refX", "6.6666666666667");
    			attr_dev(marker0, "refY", "2.5");
    			add_location(marker0, file$2, 56, 8, 1331);
    			attr_dev(path3, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path3, "class", "arrow-marker");
    			add_location(path3, file$2, 60, 12, 1644);
    			attr_dev(marker1, "id", "arrow-end");
    			attr_dev(marker1, "orient", "auto");
    			attr_dev(marker1, "markerWidth", "10");
    			attr_dev(marker1, "markerHeight", "5");
    			attr_dev(marker1, "refX", "3.3333333333333");
    			attr_dev(marker1, "refY", "2.5");
    			add_location(marker1, file$2, 59, 8, 1526);
    			attr_dev(path4, "d", "M0 0V5L10 2.5Z");
    			attr_dev(path4, "class", "arrow-marker");
    			add_location(path4, file$2, 64, 12, 1860);
    			attr_dev(marker2, "id", "arrow-inverted-start");
    			attr_dev(marker2, "orient", "auto");
    			attr_dev(marker2, "markerWidth", "10");
    			attr_dev(marker2, "markerHeight", "5");
    			attr_dev(marker2, "refX", "3.3333333333333");
    			attr_dev(marker2, "refY", "2.5");
    			add_location(marker2, file$2, 62, 8, 1719);
    			attr_dev(path5, "d", "M10 0V5L0 2.5Z");
    			attr_dev(path5, "class", "arrow-marker");
    			add_location(path5, file$2, 68, 12, 2074);
    			attr_dev(marker3, "id", "arrow-inverted-end");
    			attr_dev(marker3, "orient", "auto");
    			attr_dev(marker3, "markerWidth", "10");
    			attr_dev(marker3, "markerHeight", "5");
    			attr_dev(marker3, "refX", "6.6666666666667");
    			attr_dev(marker3, "refY", "2.5");
    			add_location(marker3, file$2, 66, 8, 1935);
    			add_location(defs, file$2, 47, 4, 895);
    			attr_dev(rect0, "x", /*left*/ ctx[6]);
    			attr_dev(rect0, "y", /*top*/ ctx[7]);
    			attr_dev(rect0, "width", /*width*/ ctx[2]);
    			attr_dev(rect0, "height", rect0_height_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4]);
    			attr_dev(rect0, "style", rect0_style_value = `clip-path:url(#magnet-clip);fill:${/*colors*/ ctx[3].second}`);
    			add_location(rect0, file$2, 72, 8, 2169);
    			attr_dev(rect1, "x", /*left*/ ctx[6]);
    			attr_dev(rect1, "y", /*top*/ ctx[7]);
    			attr_dev(rect1, "width", /*width*/ ctx[2]);
    			attr_dev(rect1, "height", rect1_height_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4]);
    			attr_dev(rect1, "style", rect1_style_value = `clip-path:url(#north-clip);fill:${/*colors*/ ctx[3].first}`);
    			add_location(rect1, file$2, 73, 8, 2309);
    			add_location(g, file$2, 71, 4, 2157);
    			attr_dev(path6, "d", path6_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2] + 3} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}h16`);
    			attr_dev(path6, "class", "arrow-dimension-line");
    			add_location(path6, file$2, 75, 4, 2452);
    			attr_dev(path7, "d", path7_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2] + 3} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5]}h16`);
    			attr_dev(path7, "class", "arrow-dimension-line");
    			add_location(path7, file$2, 76, 4, 2533);
    			attr_dev(path8, "d", path8_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2] + 14} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + 10}v${/*height*/ ctx[5] - 2 * 10}`);
    			attr_dev(path8, "class", "arrow");
    			add_location(path8, file$2, 77, 4, 2621);
    			attr_dev(text0, "x", text0_x_value = /*left*/ ctx[6] + /*width*/ ctx[2] + 20);
    			attr_dev(text0, "y", text0_y_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] / 2 + 21 / 2);
    			attr_dev(text0, "font-size", "21");
    			attr_dev(text0, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text0, "fill", "#999");
    			set_style(text0, "text-anchor", "left");
    			add_location(text0, file$2, 78, 4, 2703);
    			attr_dev(path9, "d", path9_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + 3}v${/*rad_y*/ ctx[4] + 7}`);
    			attr_dev(path9, "class", "arrow-dimension-line");
    			add_location(path9, file$2, 80, 4, 2897);
    			attr_dev(path10, "d", path10_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + 3}v${/*rad_y*/ ctx[4] + 7}`);
    			attr_dev(path10, "class", "arrow-dimension-line");
    			add_location(path10, file$2, 81, 4, 2987);
    			attr_dev(path11, "d", path11_d_value = `M${/*left*/ ctx[6] + 10} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4] + 7}h${/*width*/ ctx[2] - 2 * 10}`);
    			attr_dev(path11, "class", "arrow");
    			add_location(path11, file$2, 82, 4, 3083);
    			attr_dev(text1, "x", text1_x_value = /*left*/ ctx[6] + /*width*/ ctx[2] / 2);
    			attr_dev(text1, "y", text1_y_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4] + 30);
    			attr_dev(text1, "font-size", "21");
    			attr_dev(text1, "font-family", "Arial, Helvetica, sans-serif");
    			set_style(text1, "fill", "#999");
    			set_style(text1, "text-anchor", "middle");
    			add_location(text1, file$2, 83, 4, 3170);
    			attr_dev(ellipse, "cx", ellipse_cx_value = /*left*/ ctx[6] + /*width*/ ctx[2] / 2);
    			attr_dev(ellipse, "cy", ellipse_cy_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4]);
    			attr_dev(ellipse, "rx", ellipse_rx_value = /*width*/ ctx[2] / 2);
    			attr_dev(ellipse, "ry", /*rad_y*/ ctx[4]);
    			attr_dev(ellipse, "class", "border");
    			attr_dev(ellipse, "fill", "none");
    			add_location(ellipse, file$2, 85, 4, 3366);
    			attr_dev(path12, "d", path12_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5]}a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 0 ${/*width*/ ctx[2]} 0`);
    			attr_dev(path12, "class", "border");
    			attr_dev(path12, "fill", "none");
    			add_location(path12, file$2, 87, 4, 3474);
    			attr_dev(path13, "d", path13_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[5]}`);
    			attr_dev(path13, "class", "border");
    			add_location(path13, file$2, 88, 4, 3586);
    			attr_dev(path14, "d", path14_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[5]}`);
    			attr_dev(path14, "class", "border");
    			add_location(path14, file$2, 89, 4, 3652);
    			attr_dev(svg_1, "viewBox", svg_1_viewBox_value = `0 0 ${640 / /*renderParams*/ ctx[1].scale} ${440 / /*renderParams*/ ctx[1].scale}`);
    			attr_dev(svg_1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg_1, file$2, 10, 0, 249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg_1, anchor);
    			append_dev(svg_1, style);
    			append_dev(style, t0);
    			append_dev(svg_1, defs);
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
    			append_dev(svg_1, g);
    			append_dev(g, rect0);
    			append_dev(g, rect1);
    			append_dev(svg_1, path6);
    			append_dev(svg_1, path7);
    			append_dev(svg_1, path8);
    			append_dev(svg_1, text0);
    			append_dev(text0, t1);
    			append_dev(text0, t2);
    			append_dev(svg_1, path9);
    			append_dev(svg_1, path10);
    			append_dev(svg_1, path11);
    			append_dev(svg_1, text1);
    			append_dev(text1, t3);
    			append_dev(text1, t4);
    			append_dev(svg_1, ellipse);
    			append_dev(svg_1, path12);
    			append_dev(svg_1, path13);
    			append_dev(svg_1, path14);
    			/*svg_1_binding*/ ctx[8](svg_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*left, top, rad_y, width, height*/ 244 && path0_d_value !== (path0_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${/*width*/ ctx[2]} 0 v${/*height*/ ctx[5]} a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${-/*width*/ ctx[2]} 0 z`)) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*left, top, rad_y, width, height*/ 244 && path1_d_value !== (path1_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${/*width*/ ctx[2]} 0 v${/*height*/ ctx[5] / 2} a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 1 ${-/*width*/ ctx[2]} 0 z`)) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*left*/ 64) {
    				attr_dev(rect0, "x", /*left*/ ctx[6]);
    			}

    			if (dirty & /*top*/ 128) {
    				attr_dev(rect0, "y", /*top*/ ctx[7]);
    			}

    			if (dirty & /*width*/ 4) {
    				attr_dev(rect0, "width", /*width*/ ctx[2]);
    			}

    			if (dirty & /*top, rad_y, height*/ 176 && rect0_height_value !== (rect0_height_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4])) {
    				attr_dev(rect0, "height", rect0_height_value);
    			}

    			if (dirty & /*colors*/ 8 && rect0_style_value !== (rect0_style_value = `clip-path:url(#magnet-clip);fill:${/*colors*/ ctx[3].second}`)) {
    				attr_dev(rect0, "style", rect0_style_value);
    			}

    			if (dirty & /*left*/ 64) {
    				attr_dev(rect1, "x", /*left*/ ctx[6]);
    			}

    			if (dirty & /*top*/ 128) {
    				attr_dev(rect1, "y", /*top*/ ctx[7]);
    			}

    			if (dirty & /*width*/ 4) {
    				attr_dev(rect1, "width", /*width*/ ctx[2]);
    			}

    			if (dirty & /*top, rad_y, height*/ 176 && rect1_height_value !== (rect1_height_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4])) {
    				attr_dev(rect1, "height", rect1_height_value);
    			}

    			if (dirty & /*colors*/ 8 && rect1_style_value !== (rect1_style_value = `clip-path:url(#north-clip);fill:${/*colors*/ ctx[3].first}`)) {
    				attr_dev(rect1, "style", rect1_style_value);
    			}

    			if (dirty & /*left, width, top, rad_y*/ 212 && path6_d_value !== (path6_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2] + 3} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}h16`)) {
    				attr_dev(path6, "d", path6_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 244 && path7_d_value !== (path7_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2] + 3} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5]}h16`)) {
    				attr_dev(path7, "d", path7_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 244 && path8_d_value !== (path8_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2] + 14} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + 10}v${/*height*/ ctx[5] - 2 * 10}`)) {
    				attr_dev(path8, "d", path8_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t1_value !== (t1_value = /*renderParams*/ ctx[1].dim.height + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*left, width*/ 68 && text0_x_value !== (text0_x_value = /*left*/ ctx[6] + /*width*/ ctx[2] + 20)) {
    				attr_dev(text0, "x", text0_x_value);
    			}

    			if (dirty & /*top, rad_y, height*/ 176 && text0_y_value !== (text0_y_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] / 2 + 21 / 2)) {
    				attr_dev(text0, "y", text0_y_value);
    			}

    			if (dirty & /*left, top, rad_y, height*/ 240 && path9_d_value !== (path9_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + 3}v${/*rad_y*/ ctx[4] + 7}`)) {
    				attr_dev(path9, "d", path9_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 244 && path10_d_value !== (path10_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + 3}v${/*rad_y*/ ctx[4] + 7}`)) {
    				attr_dev(path10, "d", path10_d_value);
    			}

    			if (dirty & /*left, top, rad_y, height, width*/ 244 && path11_d_value !== (path11_d_value = `M${/*left*/ ctx[6] + 10} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4] + 7}h${/*width*/ ctx[2] - 2 * 10}`)) {
    				attr_dev(path11, "d", path11_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && t3_value !== (t3_value = /*renderParams*/ ctx[1].dim.width + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*left, width*/ 68 && text1_x_value !== (text1_x_value = /*left*/ ctx[6] + /*width*/ ctx[2] / 2)) {
    				attr_dev(text1, "x", text1_x_value);
    			}

    			if (dirty & /*top, rad_y, height*/ 176 && text1_y_value !== (text1_y_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5] + /*rad_y*/ ctx[4] + 30)) {
    				attr_dev(text1, "y", text1_y_value);
    			}

    			if (dirty & /*left, width*/ 68 && ellipse_cx_value !== (ellipse_cx_value = /*left*/ ctx[6] + /*width*/ ctx[2] / 2)) {
    				attr_dev(ellipse, "cx", ellipse_cx_value);
    			}

    			if (dirty & /*top, rad_y*/ 144 && ellipse_cy_value !== (ellipse_cy_value = /*top*/ ctx[7] + /*rad_y*/ ctx[4])) {
    				attr_dev(ellipse, "cy", ellipse_cy_value);
    			}

    			if (dirty & /*width*/ 4 && ellipse_rx_value !== (ellipse_rx_value = /*width*/ ctx[2] / 2)) {
    				attr_dev(ellipse, "rx", ellipse_rx_value);
    			}

    			if (dirty & /*rad_y*/ 16) {
    				attr_dev(ellipse, "ry", /*rad_y*/ ctx[4]);
    			}

    			if (dirty & /*left, top, rad_y, height, width*/ 244 && path12_d_value !== (path12_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4] + /*height*/ ctx[5]}a${/*width*/ ctx[2] / 2} ${/*rad_y*/ ctx[4]} 0 0 0 ${/*width*/ ctx[2]} 0`)) {
    				attr_dev(path12, "d", path12_d_value);
    			}

    			if (dirty & /*left, top, rad_y, height*/ 240 && path13_d_value !== (path13_d_value = `M${/*left*/ ctx[6]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[5]}`)) {
    				attr_dev(path13, "d", path13_d_value);
    			}

    			if (dirty & /*left, width, top, rad_y, height*/ 244 && path14_d_value !== (path14_d_value = `M${/*left*/ ctx[6] + /*width*/ ctx[2]} ${/*top*/ ctx[7] + /*rad_y*/ ctx[4]}v${/*height*/ ctx[5]}`)) {
    				attr_dev(path14, "d", path14_d_value);
    			}

    			if (dirty & /*renderParams*/ 2 && svg_1_viewBox_value !== (svg_1_viewBox_value = `0 0 ${640 / /*renderParams*/ ctx[1].scale} ${440 / /*renderParams*/ ctx[1].scale}`)) {
    				attr_dev(svg_1, "viewBox", svg_1_viewBox_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg_1);
    			/*svg_1_binding*/ ctx[8](null);
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
    	let top;
    	let left;
    	let width;
    	let height;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Cylinder', slots, []);
    	let { svg } = $$props;
    	let { renderParams } = $$props;
    	let colors;
    	let rad_y;
    	const writable_props = ['svg', 'renderParams'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cylinder> was created with unknown prop '${key}'`);
    	});

    	function svg_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			svg = $$value;
    			$$invalidate(0, svg);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    	};

    	$$self.$capture_state = () => ({
    		svg,
    		renderParams,
    		colors,
    		rad_y,
    		width,
    		height,
    		left,
    		top
    	});

    	$$self.$inject_state = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    		if ('colors' in $$props) $$invalidate(3, colors = $$props.colors);
    		if ('rad_y' in $$props) $$invalidate(4, rad_y = $$props.rad_y);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('height' in $$props) $$invalidate(5, height = $$props.height);
    		if ('left' in $$props) $$invalidate(6, left = $$props.left);
    		if ('top' in $$props) $$invalidate(7, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(7, { top, left, width, height } = renderParams.normalDim, top, ($$invalidate(6, left), $$invalidate(1, renderParams)), ($$invalidate(2, width), $$invalidate(1, renderParams)), ($$invalidate(5, height), $$invalidate(1, renderParams)));
    		}

    		if ($$self.$$.dirty & /*renderParams*/ 2) {
    			$$invalidate(3, { colors } = renderParams, colors);
    		}

    		if ($$self.$$.dirty & /*width, renderParams*/ 6) {
    			$$invalidate(4, rad_y = width * renderParams.perspective);
    		}
    	};

    	return [svg, renderParams, width, colors, rad_y, height, left, top, svg_1_binding];
    }

    class Cylinder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { svg: 0, renderParams: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cylinder",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*svg*/ ctx[0] === undefined && !('svg' in props)) {
    			console.warn("<Cylinder> was created without expected prop 'svg'");
    		}

    		if (/*renderParams*/ ctx[1] === undefined && !('renderParams' in props)) {
    			console.warn("<Cylinder> was created without expected prop 'renderParams'");
    		}
    	}

    	get svg() {
    		throw new Error("<Cylinder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Cylinder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get renderParams() {
    		throw new Error("<Cylinder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set renderParams(value) {
    		throw new Error("<Cylinder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Preview.svelte generated by Svelte v3.44.0 */
    const file$1 = "src/Preview.svelte";

    // (15:37) 
    function create_if_block_2(ctx) {
    	let cylinder;
    	let updating_svg;
    	let current;

    	function cylinder_svg_binding(value) {
    		/*cylinder_svg_binding*/ ctx[4](value);
    	}

    	let cylinder_props = { renderParams: /*renderParams*/ ctx[1] };

    	if (/*svg*/ ctx[0] !== void 0) {
    		cylinder_props.svg = /*svg*/ ctx[0];
    	}

    	cylinder = new Cylinder({ props: cylinder_props, $$inline: true });
    	binding_callbacks.push(() => bind(cylinder, 'svg', cylinder_svg_binding));

    	const block = {
    		c: function create() {
    			create_component(cylinder.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cylinder, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cylinder_changes = {};
    			if (dirty & /*renderParams*/ 2) cylinder_changes.renderParams = /*renderParams*/ ctx[1];

    			if (!updating_svg && dirty & /*svg*/ 1) {
    				updating_svg = true;
    				cylinder_changes.svg = /*svg*/ ctx[0];
    				add_flush_callback(() => updating_svg = false);
    			}

    			cylinder.$set(cylinder_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cylinder.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cylinder.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cylinder, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(15:37) ",
    		ctx
    	});

    	return block;
    }

    // (13:37) 
    function create_if_block_1(ctx) {
    	let ring;
    	let updating_svg;
    	let current;

    	function ring_svg_binding(value) {
    		/*ring_svg_binding*/ ctx[3](value);
    	}

    	let ring_props = { renderParams: /*renderParams*/ ctx[1] };

    	if (/*svg*/ ctx[0] !== void 0) {
    		ring_props.svg = /*svg*/ ctx[0];
    	}

    	ring = new Ring({ props: ring_props, $$inline: true });
    	binding_callbacks.push(() => bind(ring, 'svg', ring_svg_binding));

    	const block = {
    		c: function create() {
    			create_component(ring.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(ring, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ring_changes = {};
    			if (dirty & /*renderParams*/ 2) ring_changes.renderParams = /*renderParams*/ ctx[1];

    			if (!updating_svg && dirty & /*svg*/ 1) {
    				updating_svg = true;
    				ring_changes.svg = /*svg*/ ctx[0];
    				add_flush_callback(() => updating_svg = false);
    			}

    			ring.$set(ring_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ring.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ring.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ring, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(13:37) ",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if renderParams.type == 0}
    function create_if_block(ctx) {
    	let prism;
    	let updating_svg;
    	let current;

    	function prism_svg_binding(value) {
    		/*prism_svg_binding*/ ctx[2](value);
    	}

    	let prism_props = { renderParams: /*renderParams*/ ctx[1] };

    	if (/*svg*/ ctx[0] !== void 0) {
    		prism_props.svg = /*svg*/ ctx[0];
    	}

    	prism = new Prism({ props: prism_props, $$inline: true });
    	binding_callbacks.push(() => bind(prism, 'svg', prism_svg_binding));

    	const block = {
    		c: function create() {
    			create_component(prism.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(prism, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const prism_changes = {};
    			if (dirty & /*renderParams*/ 2) prism_changes.renderParams = /*renderParams*/ ctx[1];

    			if (!updating_svg && dirty & /*svg*/ 1) {
    				updating_svg = true;
    				prism_changes.svg = /*svg*/ ctx[0];
    				add_flush_callback(() => updating_svg = false);
    			}

    			prism.$set(prism_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prism.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prism.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(prism, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:4) {#if renderParams.type == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*renderParams*/ ctx[1].type == 0) return 0;
    		if (/*renderParams*/ ctx[1].type == 1) return 1;
    		if (/*renderParams*/ ctx[1].type == 2) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "min-w-full h-full border-2 border-dashed rounded-md");
    			add_location(div, file$1, 9, 0, 218);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Preview', slots, []);
    	let { renderParams } = $$props;
    	let { svg } = $$props;
    	const writable_props = ['renderParams', 'svg'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Preview> was created with unknown prop '${key}'`);
    	});

    	function prism_svg_binding(value) {
    		svg = value;
    		$$invalidate(0, svg);
    	}

    	function ring_svg_binding(value) {
    		svg = value;
    		$$invalidate(0, svg);
    	}

    	function cylinder_svg_binding(value) {
    		svg = value;
    		$$invalidate(0, svg);
    	}

    	$$self.$$set = $$props => {
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    	};

    	$$self.$capture_state = () => ({ Prism, Ring, Cylinder, renderParams, svg });

    	$$self.$inject_state = $$props => {
    		if ('renderParams' in $$props) $$invalidate(1, renderParams = $$props.renderParams);
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [svg, renderParams, prism_svg_binding, ring_svg_binding, cylinder_svg_binding];
    }

    class Preview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { renderParams: 1, svg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Preview",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*renderParams*/ ctx[1] === undefined && !('renderParams' in props)) {
    			console.warn("<Preview> was created without expected prop 'renderParams'");
    		}

    		if (/*svg*/ ctx[0] === undefined && !('svg' in props)) {
    			console.warn("<Preview> was created without expected prop 'svg'");
    		}
    	}

    	get renderParams() {
    		throw new Error("<Preview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set renderParams(value) {
    		throw new Error("<Preview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get svg() {
    		throw new Error("<Preview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Preview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div3;
    	let div1;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let inputform;
    	let updating_rp;
    	let t4;
    	let div2;
    	let preview;
    	let updating_renderParams;
    	let updating_svg;
    	let current;

    	function inputform_rp_binding(value) {
    		/*inputform_rp_binding*/ ctx[8](value);
    	}

    	let inputform_props = {};

    	if (/*renderParams*/ ctx[2] !== void 0) {
    		inputform_props.rp = /*renderParams*/ ctx[2];
    	}

    	inputform = new InputForm({ props: inputform_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputform, 'rp', inputform_rp_binding));
    	inputform.$on("save", /*save*/ ctx[4]);
    	inputform.$on("exportimg", /*exportImg*/ ctx[6]);
    	inputform.$on("load", /*load*/ ctx[5]);
    	inputform.$on("newtype", /*newType*/ ctx[7]);

    	function preview_renderParams_binding(value) {
    		/*preview_renderParams_binding*/ ctx[9](value);
    	}

    	function preview_svg_binding(value) {
    		/*preview_svg_binding*/ ctx[10](value);
    	}

    	let preview_props = {};

    	if (/*renderParams*/ ctx[2] !== void 0) {
    		preview_props.renderParams = /*renderParams*/ ctx[2];
    	}

    	if (/*svg*/ ctx[3] !== void 0) {
    		preview_props.svg = /*svg*/ ctx[3];
    	}

    	preview = new Preview({ props: preview_props, $$inline: true });
    	binding_callbacks.push(() => bind(preview, 'renderParams', preview_renderParams_binding));
    	binding_callbacks.push(() => bind(preview, 'svg', preview_svg_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = text(" v");
    			t2 = text(/*version*/ ctx[1]);
    			t3 = space();
    			create_component(inputform.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			create_component(preview.$$.fragment);
    			add_location(h1, file, 176409, 4, 4041818);
    			attr_dev(div0, "class", "container text-center");
    			add_location(div0, file, 176408, 3, 4041778);
    			attr_dev(div1, "id", "left");
    			attr_dev(div1, "class", "flex flex-col flex-wrap space-y-6 md:w-1/3");
    			add_location(div1, file, 176407, 2, 4041708);
    			attr_dev(div2, "id", "right");
    			attr_dev(div2, "class", "md:w-2/3 pl-2");
    			add_location(div2, file, 176413, 2, 4041982);
    			attr_dev(div3, "class", "flex flex-col md:flex-row flex-wrap md:flex-nowrap");
    			add_location(div3, file, 176406, 1, 4041641);
    			attr_dev(main, "class", "h-full");
    			add_location(main, file, 176405, 0, 4041618);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div1, t3);
    			mount_component(inputform, div1, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(preview, div2, null);
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

    			if (!updating_svg && dirty & /*svg*/ 8) {
    				updating_svg = true;
    				preview_changes.svg = /*svg*/ ctx[3];
    				add_flush_callback(() => updating_svg = false);
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

    function normalizeDimensions(rp, max) {
    	let dim = Object.assign({}, rp.dim);

    	// Save invariant properties
    	let _top = dim.top, _left = dim.left;

    	delete dim.top;
    	delete dim.left;

    	const maxVal = Object.keys(dim).reduce(
    		(acc, cur) => {
    			return Math.max(acc, dim[cur]);
    		},
    		0
    	);

    	for (const prop in dim) {
    		dim[prop] = dim[prop] / maxVal * max;
    	}

    	rp.normalDim = dim;

    	// Restore invariant properties
    	rp.normalDim.top = _top;

    	rp.normalDim.left = _left;
    	console.log('RP', rp);
    	console.log('DIM', dim);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const { ipcRenderer } = require('electron');
    	let { name } = $$props;
    	let { version } = $$props;

    	let renderPresets = [
    		{
    			type: 0,
    			dim: {
    				top: 30,
    				left: 30,
    				width: 10,
    				height: 2,
    				depth: 3
    			},
    			colors: { first: '#d64c4c', second: '#4f4f4f' },
    			perspective: 0.19,
    			scale: 1,
    			fileName: 'Magnet-neodim-{type}-{w}x{h}x{d}',
    			fileType: 0
    		},
    		{
    			type: 1,
    			dim: {
    				top: 30,
    				left: 30,
    				width: 15,
    				height: 6,
    				radius: 3
    			},
    			colors: { first: '#d64c4c', second: '#4f4f4f' },
    			perspective: 0.19,
    			scale: 1,
    			fileName: 'Magnet-neodim-{type}-{w}x{h}-{r}',
    			fileType: 0
    		},
    		{
    			type: 2,
    			dim: {
    				top: 30,
    				left: 30,
    				width: 15,
    				height: 6,
    				radius: 6
    			},
    			colors: { first: '#d64c4c', second: '#4f4f4f' },
    			perspective: 0.19,
    			scale: 1,
    			fileName: 'Magnet-neodim-{type}-{w}x{h}',
    			fileType: 0
    		}
    	];

    	let svg = '';
    	let renderParams = Object.assign({}, renderPresets[0]);

    	function save() {
    		ipcRenderer.send('save-rp', renderParams);
    	}

    	function load() {
    		ipcRenderer.send('load-rp');
    	}

    	ipcRenderer.on('rp', (e, args) => {
    		$$invalidate(2, renderParams = args);
    	});

    	function exportImg() {
    		ipcRenderer.send('export-img', { renderParams, svg: svg.outerHTML });
    	}

    	function newType() {
    		console.log('New type', renderParams.type);
    		console.log('Render presets', renderPresets);
    		$$invalidate(2, renderParams = Object.assign({}, renderPresets[renderParams.type]));
    		console.log('Render params', renderParams);
    	}

    	const writable_props = ['name', 'version'];

    	Object_1.keys($$props).forEach(key => {
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

    	function preview_svg_binding(value) {
    		svg = value;
    		$$invalidate(3, svg);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('version' in $$props) $$invalidate(1, version = $$props.version);
    	};

    	$$self.$capture_state = () => ({
    		InputForm,
    		Preview,
    		ipcRenderer,
    		name,
    		version,
    		normalizeDimensions,
    		renderPresets,
    		svg,
    		renderParams,
    		save,
    		load,
    		exportImg,
    		newType
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('version' in $$props) $$invalidate(1, version = $$props.version);
    		if ('renderPresets' in $$props) renderPresets = $$props.renderPresets;
    		if ('svg' in $$props) $$invalidate(3, svg = $$props.svg);
    		if ('renderParams' in $$props) $$invalidate(2, renderParams = $$props.renderParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*renderParams*/ 4) {
    			{
    				console.log('Reactive normalization');
    				normalizeDimensions(renderParams, 350);
    			}
    		}
    	};

    	return [
    		name,
    		version,
    		renderParams,
    		svg,
    		save,
    		load,
    		exportImg,
    		newType,
    		inputform_rp_binding,
    		preview_renderParams_binding,
    		preview_svg_binding
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
