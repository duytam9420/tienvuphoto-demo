/*!
 * Tiến Vũ Motion 1.0.0 — hiệu ứng gắn bằng lớp CSS của Elementor (Advanced → CSS Classes).
 *
 * Port từ Lucian UX/UI Prompt; giữ nguyên dòng giấy phép của từng phần tử:
 *   Lucian UX/UI Prompt #212 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#212
 *   Lucian UX/UI Prompt #216 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#216
 *   Lucian UX/UI Prompt #237 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#237
 *   Lucian UX/UI Prompt #282 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#282
 *   Lucian UX/UI Prompt #260 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#260
 *   Lucian UX/UI Prompt #251 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#251
 *   Lucian UX/UI Prompt #223 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#223
 *   Lucian UX/UI Prompt #241 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#241
 *   Lucian UX/UI Prompt #389 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#389
 *   Lucian UX/UI Prompt #394 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#394
 *   Lucian UX/UI Prompt #002 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#002
 *   Lucian UX/UI Prompt #370 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#370
 *   Lucian UX/UI Prompt #258 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#258
 *   Lucian UX/UI Prompt #207 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#207
 *
 * Mỗi hiệu ứng tìm phần tử theo lớp CSS, không cần data-*. Không chạy khi: chưa có html.tv-js (giảm chuyển động),
 * trong trình soạn thảo Elementor, hoặc trình duyệt thiếu IntersectionObserver. Một vòng rAF chung cho mọi hiệu ứng theo cuộn.
 */
(function () {
	'use strict';

	var d = document, html = d.documentElement, W = window;
	if (!html.classList.contains('tv-js')) return;
	if (!('IntersectionObserver' in W) || !W.requestAnimationFrame || (d.body && d.body.classList.contains('elementor-editor-active'))) {
		html.classList.remove('tv-js');
		return;
	}

	var mqDesk = W.matchMedia('(min-width: 768px)');
	var mqWide = W.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
	var mqFine = W.matchMedia('(hover: hover) and (pointer: fine)');

	function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
	function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
	function kidsOf(el) {
		var inner = null;
		for (var i = 0; i < el.children.length; i++) if (el.children[i].classList.contains('e-con-inner')) inner = el.children[i];
		return Array.prototype.slice.call((inner || el).children);
	}
	function onMq(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

	// ---------------------------------------------------------------- vòng cuộn chung
	var scrollFns = [], resizeFns = [], ticking = false;
	function frame() { ticking = false; for (var i = 0; i < scrollFns.length; i++) scrollFns[i](); }
	function request() { if (!ticking) { ticking = true; W.requestAnimationFrame(frame); } }
	W.addEventListener('scroll', request, { passive: true });
	var rt = 0;
	W.addEventListener('resize', function () {
		clearTimeout(rt);
		rt = setTimeout(function () { for (var i = 0; i < resizeFns.length; i++) resizeFns[i](); request(); }, 120);
	});
	function near(el, margin) {
		var r = el.getBoundingClientRect(), m = margin || 0;
		return r.bottom > -m && r.top < W.innerHeight + m && (r.width || r.height);
	}

	/** Tách chữ trong el thành <span class=cls> (giữ nguyên thẻ em/strong/a); inner=true thì thêm <span> bên trong. */
	function splitWords(el, cls, inner) {
		var out = [], nodes = [], tw = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
		while (tw.nextNode()) nodes.push(tw.currentNode);
		nodes.forEach(function (tn) {
			if (!tn.nodeValue.trim()) return;
			var frag = d.createDocumentFragment();
			tn.nodeValue.split(/(\s+)/).forEach(function (p) {
				if (!p) return;
				if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
				var box = d.createElement('span');
				box.className = cls;
				if (inner) { var s = d.createElement('span'); s.textContent = p; box.appendChild(s); } else box.textContent = p;
				frag.appendChild(box);
				out.push(box);
			});
			tn.parentNode.replaceChild(frag, tn);
		});
		return out;
	}

	// ---------------------------------------------------------------- #212 header ẩn khi cuộn xuống
	(function header() {
		var hd = d.getElementById('site-header');
		if (!hd) return;
		var bar = d.createElement('span');
		bar.className = 'tv-header-progress';
		bar.setAttribute('aria-hidden', 'true');
		hd.appendChild(bar);
		var last = W.pageYOffset, acc = 0;
		scrollFns.push(function () {
			var y = W.pageYOffset, dy = y - last;
			last = y;
			acc = (dy > 0) === (acc > 0) ? acc + dy : dy;
			hd.classList.toggle('tv-solid', y > 20);
			var lock = hd.contains(d.activeElement) || hd.querySelector('[aria-expanded="true"]');
			if (y < 60 || lock) hd.classList.remove('tv-hide');
			else if (acc > 8) hd.classList.add('tv-hide');
			else if (acc < -6) hd.classList.remove('tv-hide');
			var max = Math.max(1, html.scrollHeight - W.innerHeight);
			bar.style.setProperty('--tv-p', clamp(y / max, 0, 1).toFixed(4));
		});
		hd.addEventListener('focusin', function () { hd.classList.remove('tv-hide'); });
	})();

	// ---------------------------------------------------------------- #216 .tv-hero
	$$('.tv-hero').forEach(function (root) {
		var t = 180;
		$$('.elementor-widget', root).forEach(function (w) {
			var title = w.classList.contains('elementor-widget-heading') && w.querySelector('h1.elementor-heading-title, h2.elementor-heading-title');
			if (title) {
				var start = Math.max(300, t), words = splitWords(title, 'tv-w', true);
				words.forEach(function (b, i) { b.firstChild.style.setProperty('--d', start + i * 70); });
				w.classList.add('tv-sw');
				t = start + Math.min(words.length, 8) * 70 + 50;
			} else {
				w.classList.add('tv-s');
				w.style.setProperty('--d', w.classList.contains('elementor-widget-image') ? Math.max(t, 900) : t);
				t = Math.min(t + 120, 1100);
			}
		});
		var played = false;
		function play() {
			if (played) return;
			played = true;
			W.requestAnimationFrame(function () { W.requestAnimationFrame(function () { root.classList.add('tv-in'); }); });
		}
		var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.15 });
		io.observe(root);
	});

	// ---------------------------------------------------------------- #237 .tv-reveal-mask
	(function mask() {
		var els = $$('.tv-reveal-mask');
		if (!els.length) return;
		function lines(words) {
			var top = null, line = -1;
			words.forEach(function (b) {
				var y = b.offsetTop;
				if (top === null || Math.abs(y - top) > 4) { top = y; line++; }
				b.firstChild.style.setProperty('--i', line);
			});
		}
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (e) {
				if (!e.isIntersecting) return;
				io.unobserve(e.target);
				lines(e.target._tvWords);
				e.target.classList.add('tv-in');
			});
		}, { threshold: 0.3 });
		els.forEach(function (w) {
			var title = w.querySelector('.elementor-heading-title') || w;
			w._tvWords = splitWords(title, 'tv-w', true);
			w.classList.add('tv-split');
			io.observe(w);
		});
	})();

	// ---------------------------------------------------------------- #282 .tv-photo-reveal
	(function photos() {
		var els = $$('.tv-photo-reveal');
		if (!els.length) return;
		function draw() {
			var vh = W.innerHeight, y = W.pageYOffset, maxScroll = Math.max(0, html.scrollHeight - vh);
			els.forEach(function (el) {
				var r = el.getBoundingClientRect();
				if (!r.height) return;
				// Mốc mở hết: đỉnh ảnh ở 42% chiều cao màn hình (như bản gốc); ảnh quá gần cuối trang để cuộn tới mốc đó
				// thì mốc lùi xuống vị trí thấp nhất cuộn được, nên ảnh luôn mở hết khi chạm đáy trang.
				var open = Math.max(vh * 0.42, r.top + y - maxScroll);
				var c = clamp((r.top - open) / (vh * 0.48), 0, 1);
				el.style.setProperty('--c', c.toFixed(3));
				var cap = el.nextElementSibling;
				if (cap && cap.classList.contains('elementor-widget-text-editor')) cap.style.setProperty('--c', c.toFixed(3));
			});
		}
		// Lần vẽ đầu có chuyển tiếp 1 s: ảnh đang ở trong màn hình lúc mở trang sẽ mở ra mượt thay vì bật ngay.
		els.forEach(function (el) { el.classList.add('tv-ease'); });
		W.requestAnimationFrame(function () {
			W.requestAnimationFrame(function () {
				draw();
				setTimeout(function () { els.forEach(function (el) { el.classList.remove('tv-ease'); }); }, 1100);
			});
		});
		scrollFns.push(draw);
	})();

	// ---------------------------------------------------------------- #260 .tv-text-fill
	$$('.tv-text-fill').forEach(function (el) {
		var target = el.querySelector('.elementor-heading-title') || el;
		var words = splitWords(target, 'tv-fw', false);
		words.forEach(function (w) { if (w.parentNode.closest && w.parentNode.closest('em, strong, b, i')) w.classList.add('em'); });
		var n = words.length;
		function draw() {
			if (!near(el, 200)) return;
			var r = el.getBoundingClientRect(), vh = W.innerHeight;
			var t = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.45), 0, 1), f = t * 1.15 * n;
			for (var i = 0; i < n; i++) {
				var v = clamp(f - i, 0, 1);
				words[i].style.setProperty('--f', v.toFixed(2));
				words[i].classList.toggle('on', v >= 1);
			}
		}
		scrollFns.push(draw);
		draw();
	});

	// ---------------------------------------------------------------- #251 .tv-stagger
	(function stagger() {
		var els = $$('.tv-stagger');
		if (!els.length) return;
		function col(k) {
			var i = 0, p = k.previousElementSibling;
			while (p && Math.abs(p.offsetTop - k.offsetTop) < 4) { i++; p = p.previousElementSibling; }
			return i;
		}
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (e) {
				var k = e.target;
				if (e.isIntersecting) {
					if (!k.classList.contains('tv-in')) k.style.setProperty('--d', (Math.min(col(k), 5) * 0.09).toFixed(2) + 's');
					k.classList.add('tv-in');
				} else if (e.rootBounds && e.boundingClientRect.top > e.rootBounds.bottom - 1) {
					k.classList.remove('tv-in');
				}
			});
		}, { threshold: 0.18 });
		els.forEach(function (el) {
			kidsOf(el).forEach(function (k) { k.classList.add('tv-st'); io.observe(k); });
		});
	})();

	// ---------------------------------------------------------------- #223 .tv-stack
	$$('.tv-stack').forEach(function (el) {
		var cards = kidsOf(el), live = false;
		cards.forEach(function (c, i) {
			c.style.setProperty('--i', i);
			var sh = d.createElement('span');
			sh.className = 'tv-shade';
			sh.setAttribute('aria-hidden', 'true');
			c.appendChild(sh);
			c._tvShade = sh;
		});
		function set() {
			live = mqDesk.matches;
			el.classList.toggle('tv-live', live);
			cards.forEach(function (c) {
				c.classList.toggle('tv-card', live);
				if (!live) { c.style.transform = ''; c._tvShade.style.opacity = ''; }
			});
		}
		function draw() {
			if (!live || !near(el, 300)) return;
			var tops = cards.map(function (c) { return c.getBoundingClientRect().top; });
			var stick = cards.map(function (c) { return parseFloat(W.getComputedStyle(c).top) || 0; });
			cards.forEach(function (c, i) {
				var depth = 0, h = c.offsetHeight || 1;
				for (var j = i + 1; j < cards.length; j++) depth += clamp(1 - (tops[j] - stick[j]) / h, 0, 1);
				c.style.transform = depth ? 'scale(' + (1 - depth * 0.06).toFixed(3) + ')' : '';
				c._tvShade.style.opacity = (depth * 0.18).toFixed(3);
			});
		}
		onMq(mqDesk, function () { set(); request(); });
		set();
		scrollFns.push(draw);
	});

	// ---------------------------------------------------------------- #241 .tv-hscroll
	$$('.tv-hscroll').forEach(function (track) {
		var pin = track.parentElement, run = pin && pin.parentElement;
		if (!pin || !pin.classList.contains('e-con-inner') || !run) return; // cần section Boxed: run > .e-con-inner(pin) > track
		var cards = Array.prototype.slice.call(track.children), live = false, dist = 0, top = 0, padTop = 0;
		var ft = d.createElement('div'), bar = d.createElement('div'), dots = d.createElement('div'), spacer = d.createElement('div');
		ft.className = 'tv-hs-ft'; bar.className = 'tv-hs-bar'; dots.className = 'tv-hs-dots'; spacer.className = 'tv-hs-spacer';
		ft.setAttribute('aria-hidden', 'true'); spacer.setAttribute('aria-hidden', 'true');
		bar.appendChild(d.createElement('i'));
		cards.forEach(function () { dots.appendChild(d.createElement('i')); });
		ft.appendChild(bar); ft.appendChild(dots);
		function teardown() {
			live = false;
			track.classList.remove('tv-live');
			pin.classList.remove('tv-hs-pin');
			track.style.transform = '';
			if (ft.parentNode) ft.parentNode.removeChild(ft);
			if (spacer.parentNode) spacer.parentNode.removeChild(spacer);
		}
		function measure() {
			if (!mqWide.matches) { teardown(); return; }
			track.classList.add('tv-live');
			pin.classList.add('tv-hs-pin');
			if (!ft.parentNode) pin.appendChild(ft);
			if (!spacer.parentNode) run.appendChild(spacer);
			dist = Math.max(0, track.scrollWidth - pin.clientWidth + parseFloat(W.getComputedStyle(pin).paddingRight || 0));
			var adm = parseFloat(W.getComputedStyle(html).getPropertyValue('--wp-admin--admin-bar--height')) || 0;
			if (!dist || pin.offsetHeight > W.innerHeight - adm) { teardown(); return; }
			top = Math.max(adm, (W.innerHeight - pin.offsetHeight) / 2);
			pin.style.setProperty('--tv-hs-top', top + 'px');
			spacer.style.height = dist + 'px';
			padTop = parseFloat(W.getComputedStyle(run).paddingTop) || 0;
			live = true;
		}
		function progress() { return clamp(top - (run.getBoundingClientRect().top + padTop), 0, dist); }
		function draw() {
			if (!live || !near(run, 200)) return;
			var x = progress(), p = dist ? x / dist : 0;
			track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
			bar.firstChild.style.transform = 'scaleX(' + p.toFixed(3) + ')';
			var cur = Math.round(p * (cards.length - 1));
			for (var i = 0; i < dots.children.length; i++) dots.children[i].classList.toggle('on', i === cur);
		}
		// Bàn phím: thẻ được focus mà đang khuất thì cuộn trang tới vị trí làm thẻ hiện ra.
		track.addEventListener('focusin', function (e) {
			if (!live) return;
			var card = cards.filter(function (c) { return c.contains(e.target); })[0];
			if (!card) return;
			var want = clamp(card.offsetLeft - (pin.clientWidth - card.offsetWidth) / 2, 0, dist);
			var runTop = run.getBoundingClientRect().top + W.pageYOffset;
			W.scrollTo(0, runTop + padTop - top + want);
		});
		resizeFns.push(measure);
		onMq(mqWide, function () { measure(); request(); });
		measure();
		scrollFns.push(draw);
		draw();
	});

	// ---------------------------------------------------------------- #389 .tv-strips
	$$('.tv-strips').forEach(function (el) {
		var kids = kidsOf(el), cur = 0, live = false;
		function open(i) {
			cur = i;
			kids.forEach(function (k, j) { k.classList.toggle('on', live && j === i); });
		}
		kids.forEach(function (k, i) {
			var sh = d.createElement('span');
			sh.className = 'tv-strip-shade';
			sh.setAttribute('aria-hidden', 'true');
			k.insertBefore(sh, k.children[1] || null);
			k.addEventListener('pointerenter', function () { if (live) open(i); });
			k.addEventListener('focusin', function () { if (live) open(i); });
		});
		function set() {
			live = mqWide.matches;
			el.classList.toggle('tv-live', live);
			kids.forEach(function (k) { k.classList.toggle('tv-strip', live); });
			open(cur);
		}
		onMq(mqWide, set);
		set();
	});

	// ---------------------------------------------------------------- #394 .tv-velocity
	$$('.tv-velocity').forEach(function (el) {
		var rows = $$('.elementor-heading-title', el).map(function (t, i) {
			var text = t.textContent.trim(), row = d.createElement('span');
			row.className = 'tv-vrow';
			for (var k = 0; k < 4; k++) {
				var s = d.createElement('span');
				s.textContent = text;
				if (k) s.setAttribute('aria-hidden', 'true');
				row.appendChild(s);
			}
			t.textContent = '';
			t.appendChild(row);
			return { el: row, x: -i * 120, dir: i % 2 ? 1 : -1, w: 0 };
		});
		if (!rows.length) return;
		var lastY = W.pageYOffset, boost = 0, sign = 1, last = 0, vis = false, skew = 0, running = false;
		W.addEventListener('scroll', function () {
			if (!vis) return;
			var dy = W.pageYOffset - lastY;
			lastY = W.pageYOffset;
			boost = Math.min(40, boost + Math.abs(dy) * 0.25);
			if (dy) sign = dy > 0 ? 1 : -1;
		}, { passive: true });
		function tick(now) {
			if (!vis) { running = false; last = 0; return; }
			var dt = Math.max(0, Math.min(50, now - (last || now))) / 16.7;
			last = now;
			boost *= Math.pow(0.92, dt);
			skew += ((boost > 1 ? sign * Math.min(8, boost * 0.35) : 0) - skew) * 0.15 * dt;
			rows.forEach(function (r) {
				if (!r.w) r.w = r.el.firstChild.offsetWidth;
				if (!r.w) return;
				r.x += r.dir * sign * (0.5 + boost) * dt;
				if (r.x < -r.w) r.x += r.w;
				if (r.x > 0) r.x -= r.w;
				r.el.style.transform = 'translate3d(' + r.x.toFixed(1) + 'px,0,0) skewX(' + (-skew * r.dir).toFixed(2) + 'deg)';
			});
			W.requestAnimationFrame(tick);
		}
		// Dừng vòng lặp khi ra khỏi màn hình.
		new IntersectionObserver(function (es) {
			vis = es[0].isIntersecting;
			lastY = W.pageYOffset;
			if (vis && !running) { running = true; W.requestAnimationFrame(tick); }
		}).observe(el);
		resizeFns.push(function () { rows.forEach(function (r) { r.w = 0; }); });
	});

	// ---------------------------------------------------------------- #002 .tv-magnetic
	(function magnetic() {
		var els = $$('.tv-magnetic').map(function (w) {
			return { w: w, btn: w.querySelector('.elementor-button'), txt: w.querySelector('.elementor-button-text'), ico: w.querySelector('.elementor-button-icon') };
		}).filter(function (m) { return m.btn; });
		if (!els.length) return;
		var px = 0, py = 0, pending = false;
		function reset(m) { m.btn.style.translate = ''; if (m.txt) m.txt.style.translate = ''; if (m.ico) m.ico.style.translate = ''; }
		function apply() {
			pending = false;
			els.forEach(function (m) {
				var r = m.btn.getBoundingClientRect();
				var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
				var p = Math.max(0, 1 - Math.hypot(dx, dy) / 240);
				if (!p) { if (m.on) { m.on = false; reset(m); } return; }
				m.on = true;
				m.btn.style.translate = (dx * 0.12 * p).toFixed(1) + 'px ' + (dy * 0.22 * p).toFixed(1) + 'px';
				if (m.txt) m.txt.style.translate = (dx * 0.05 * p).toFixed(1) + 'px ' + (dy * 0.08 * p).toFixed(1) + 'px';
				if (m.ico) m.ico.style.translate = (dx * 0.1 * p).toFixed(1) + 'px ' + (dy * 0.14 * p).toFixed(1) + 'px';
			});
		}
		d.addEventListener('pointermove', function (e) {
			if (e.pointerType !== 'mouse' || !mqFine.matches) return;
			px = e.clientX; py = e.clientY;
			if (!pending) { pending = true; W.requestAnimationFrame(apply); }
		}, { passive: true });
		d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) els.forEach(function (m) { m.on = false; reset(m); }); });
	})();

	// ---------------------------------------------------------------- #370 .tv-timeline
	$$('.tv-timeline').forEach(function (el) {
		var evs = kidsOf(el);
		var fill = d.createElement('span');
		fill.className = 'tv-tl-fill';
		fill.setAttribute('aria-hidden', 'true');
		el.insertBefore(fill, el.firstChild);
		evs.forEach(function (ev) {
			ev.classList.add('tv-ev');
			var dot = d.createElement('span');
			dot.className = 'tv-tl-dot';
			dot.setAttribute('aria-hidden', 'true');
			ev.insertBefore(dot, ev.firstChild);
		});
		function draw() {
			if (!near(el, 300)) return;
			var r = el.getBoundingClientRect(), tip = W.innerHeight * 0.6 - r.top;
			var atEnd = W.pageYOffset + W.innerHeight >= html.scrollHeight - 2;
			var p = atEnd ? 1 : clamp(tip / (r.height || 1), 0, 1);
			el.style.setProperty('--p', p.toFixed(4));
			evs.forEach(function (ev) { ev.classList.toggle('on', atEnd || ev.offsetTop + 18 <= tip); });
		}
		scrollFns.push(draw);
		draw();
	});

	// ---------------------------------------------------------------- #258 .tv-blur-up
	(function blurUp() {
		var vis = new IntersectionObserver(function (es) {
			es.forEach(function (e) { e.target.classList.toggle('tv-vis', e.isIntersecting); });
		}, { rootMargin: '100px' });
		$$('.tv-blur-up img').forEach(function (img) {
			if (img.complete && img.naturalWidth) return;
			var box = img.closest('.elementor-image-box-img, .elementor-widget-image') || img.parentElement;
			img.classList.add('tv-lq');
			box.classList.add('tv-lq-box', 'tv-loading');
			vis.observe(box);
			function done() {
				box.classList.remove('tv-loading');
				vis.unobserve(box);
				// Một khung hình ở trạng thái mờ rồi mới chuyển sang rõ (bỏ transition:none của .tv-lq).
				W.requestAnimationFrame(function () { W.requestAnimationFrame(function () { img.classList.remove('tv-lq'); }); });
			}
			img.addEventListener('load', done, { once: true });
			img.addEventListener('error', done, { once: true });
		});
	})();

	// ---------------------------------------------------------------- #207 .tv-logo-marquee (dải nhãn hàng chạy ngang)
	// Bản gốc là hai cột thẻ chạy dọc; ở đây một hàng chạy ngang: các phần tử con của container được chuyển vào một
	// "đường ray", nhân lên cho đủ rộng rồi nhân đôi cả bộ (bản sao aria-hidden, không nhận focus) và trượt -50% lặp vô tận.
	// Dừng khi rê chuột / focus bàn phím và khi ra khỏi màn hình. Giảm chuyển động hoặc tắt JS: hàng chữ đứng yên, xuống dòng.
	$$('.tv-logo-marquee').forEach(function (el) {
		var items = kidsOf(el);
		if (!items.length) return;
		var host = items[0].parentNode, track = d.createElement('div');
		track.className = 'tv-lm-track';
		items.forEach(function (k) { track.appendChild(k); });
		host.appendChild(track);
		function clone(k) {
			var c = k.cloneNode(true);
			c.setAttribute('aria-hidden', 'true');
			$$('a, button, [tabindex]', c).forEach(function (a) { a.setAttribute('tabindex', '-1'); });
			return c;
		}
		var need = Math.max(el.clientWidth, W.screen ? W.screen.width : 0) + 40, guard = 0;
		while (track.scrollWidth < need && guard++ < 12) items.forEach(function (k) { track.appendChild(clone(k)); });
		var setW = track.scrollWidth;
		Array.prototype.slice.call(track.children).forEach(function (k) { track.appendChild(k.hasAttribute('aria-hidden') ? k.cloneNode(true) : clone(k)); });
		track.style.setProperty('--tv-lm-t', Math.max(20, Math.round(setW / 45)) + 's');   // ~45 px/giây
		el.classList.add('tv-lm-on');
		new IntersectionObserver(function (es) { el.classList.toggle('tv-lm-off', !es[0].isIntersecting); }).observe(el);
	});

	html.classList.add('tv-ready');
	request();
})();
