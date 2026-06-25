/* ═══════════════════════════════════════════════════════
   AFOR EMPLOI — Maquette V3 — Interactions
═══════════════════════════════════════════════════════ */

// ── Navigation entre les vues ────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.mnl').forEach(b => b.classList.remove('active'));

  const view = document.getElementById('view-' + name);
  const btn  = document.getElementById('btn-' + name);
  if (view) view.classList.add('active');
  if (btn)  btn.classList.add('active');

  // scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Dark mode ─────────────────────────────────────────
function toggleDark() {
  document.body.classList.toggle('dark');
  const cb = document.getElementById('darkToggle');
  if (cb) cb.checked = document.body.classList.contains('dark');
}

// ── Sidebar collapse ─────────────────────────────────
function toggleSidebar(role) {
  const sb = document.getElementById('sidebar-' + role);
  if (sb) sb.classList.toggle('collapsed');
}

// ── Sidebar subgroups ─────────────────────────────────
function toggleGroup(btn) {
  btn.classList.toggle('open');
  const children = btn.nextElementSibling;
  if (children) children.classList.toggle('hidden');
}

// ── Chart tabs ────────────────────────────────────────
document.addEventListener('click', function (e) {
  const tab = e.target.closest('.cc-tab');
  if (!tab) return;
  const group = tab.closest('.cc-tabs');
  if (!group) return;
  group.querySelectorAll('.cc-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
});

// ── Filter pills ──────────────────────────────────────
document.addEventListener('click', function (e) {
  const pill = e.target.closest('.filter-pill');
  if (!pill) return;
  const group = pill.closest('.filter-pill-group');
  if (!group) return;
  group.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
});

// ── Animate bars on view change ───────────────────────
function animateBars(viewEl) {
  viewEl.querySelectorAll('.bar').forEach(bar => {
    const h = bar.style.height;
    bar.style.height = '0%';
    setTimeout(() => { bar.style.height = h; bar.style.transition = 'height 0.5s ease'; }, 50);
  });
  viewEl.querySelectorAll('.sl-fill, .proj-fill').forEach(fill => {
    const w = fill.style.width;
    fill.style.width = '0%';
    setTimeout(() => { fill.style.width = w; }, 80);
  });
}

// Patch showView to also animate
const _origShow = window.showView;
window.showView = function (name) {
  _origShow(name);
  const view = document.getElementById('view-' + name);
  if (view) setTimeout(() => animateBars(view), 60);
};

// ── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  // Animate initial view
  const initial = document.querySelector('.view.active');
  if (initial) setTimeout(() => animateBars(initial), 200);
});
