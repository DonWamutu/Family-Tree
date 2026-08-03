/* ============================================================
   STATE
   ============================================================ */
const STORAGE_KEY = "familyTreeData_v1";
const META_KEY = "familyTreeMeta_v1";

let data = loadData();
let meta = loadMeta();
let editMode = false;

// Tracks which person the currently-open file picker should apply to.
let pendingPhotoTarget = null;

/* ============================================================
   PERSISTENCE
   ============================================================ */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to default */ }
  return structuredClone(DEFAULT_DATA);
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { title: "The Family Tree", subtitle: "Four generations, one root." };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveMeta() {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/* ============================================================
   HELPERS
   ============================================================ */
function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function findPersonById(id) {
  if (data.grandparents.father.id === id) return data.grandparents.father;
  if (data.grandparents.mother.id === id) return data.grandparents.mother;
  for (const child of data.children) {
    if (child.id === id) return child;
    for (const gc of child.children) {
      if (gc.id === id) return gc;
    }
  }
  return null;
}

/* ============================================================
   RENDER
   ============================================================ */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderPortrait(person, sizeClass) {
  const wrap = el("div", "portrait-wrap");
  if (person.image) {
    const img = el("img", `portrait ${sizeClass}`);
    img.src = person.image;
    img.alt = person.name || "Family member";
    img.addEventListener("click", () => handlePortraitClick(person));
    wrap.appendChild(img);
  } else {
    const div = el("div", `portrait-initials ${sizeClass}`, initials(person.name));
    div.addEventListener("click", () => handlePortraitClick(person));
    wrap.appendChild(div);
  }
  return wrap;
}

function handlePortraitClick(person) {
  if (editMode) {
    pendingPhotoTarget = person;
    document.getElementById("photo-file").click();
  } else {
    openLightbox(person);
  }
}

function renderName(person) {
  const name = el("p", "person-name", person.name || "Unnamed");
  name.setAttribute("contenteditable", editMode ? "true" : "false");
  name.spellcheck = false;
  name.addEventListener("blur", () => {
    const value = name.textContent.trim() || "Unnamed";
    person.name = value;
    name.textContent = value;
    saveData();
  });
  name.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); name.blur(); }
  });
  return name;
}

function renderPerson(person, tierClass, sizeClass, showEditTag) {
  const wrap = el("div", `person ${tierClass}`);
  wrap.appendChild(renderPortrait(person, sizeClass));
  wrap.appendChild(renderName(person));
  if (showEditTag) {
    wrap.appendChild(el("span", "edit-mode-tag", "click photo to replace"));
  }
  return wrap;
}

function renderGrandparents() {
  const section = el("section", "grandparents-section");
  section.appendChild(el("p", "generation-label", "Grandparents"));

  const row = el("div", "grandparents-row");
  row.appendChild(renderPerson(data.grandparents.father, "person--primary", "", true));
  row.appendChild(el("span", "union-mark", "+"));
  row.appendChild(renderPerson(data.grandparents.mother, "person--primary", "", true));
  section.appendChild(row);

  const spine = el("div", "spine");
  section.appendChild(spine);

  return section;
}

function renderGrandchild(gc, parentChild) {
  const wrap = el("div", "person person--grandchild");
  wrap.appendChild(renderPortrait(gc, ""));
  wrap.appendChild(renderName(gc));
  const removeBtn = el("button", "remove-btn", "Remove");
  removeBtn.addEventListener("click", () => {
    if (!confirm(`Remove ${gc.name || "this person"} from the tree?`)) return;
    parentChild.children = parentChild.children.filter(x => x.id !== gc.id);
    saveData();
    render();
  });
  wrap.appendChild(removeBtn);
  return wrap;
}

/* Level 2: the ten children, all on one row, on their own — no
   grandchildren mixed in, so this level reads as a single clear tier. */
function renderChildrenLevel() {
  const section = el("section", "level-section");
  section.appendChild(el("p", "generation-label", "Children"));

  const row = el("div", "children-level");
  data.children.forEach(child => {
    const cell = el("div", "child-cell");
    cell.appendChild(renderPerson(child, "person--child", "", true));
    const removeChildBtn = el("button", "remove-btn", "Remove this child & their family");
    removeChildBtn.addEventListener("click", () => {
      if (!confirm(`Remove ${child.name || "this person"} and all of their children from the tree?`)) return;
      data.children = data.children.filter(x => x.id !== child.id);
      saveData();
      render();
    });
    cell.appendChild(removeChildBtn);
    row.appendChild(cell);
  });
  section.appendChild(row);

  const addWrap = el("div", "add-child-branch");
  const addChildBtn = el("button", "btn btn-ghost small", "+ Add another child");
  addChildBtn.addEventListener("click", () => {
    data.children.push({ id: uid("p"), name: "New Family Member", image: null, children: [] });
    saveData();
    render();
  });
  addWrap.appendChild(addChildBtn);
  section.appendChild(addWrap);

  return section;
}

/* Level 3: every grandchild, grouped in clusters so it's clear at a
   glance whose child each one is, but all sitting on the one tier
   below the children — never mixed into the level above. */
function renderGrandchildrenLevel() {
  const section = el("section", "level-section");
  section.appendChild(el("p", "generation-label", "Grandchildren"));

  const row = el("div", "grandchildren-level");
  data.children.forEach(child => {
    if (child.children.length === 0 && !editMode) return;

    const cluster = el("div", "gc-cluster");
    cluster.appendChild(el("p", "gc-cluster-label", `${child.name}\u2019s children`));

    const clusterRow = el("div", "gc-cluster-row");
    child.children.forEach(gc => clusterRow.appendChild(renderGrandchild(gc, child)));
    cluster.appendChild(clusterRow);

    const addGcBtn = el("button", "add-person-btn", "+ Add child");
    addGcBtn.addEventListener("click", () => {
      child.children.push({ id: uid("p"), name: "New Family Member", image: null });
      saveData();
      render();
    });
    cluster.appendChild(addGcBtn);

    row.appendChild(cluster);
  });
  section.appendChild(row);

  return section;
}

function render() {
  const root = document.getElementById("tree-root");
  root.innerHTML = "";
  root.appendChild(renderGrandparents());
  root.appendChild(renderChildrenLevel());
  root.appendChild(renderGrandchildrenLevel());

  document.body.classList.toggle("edit-mode", editMode);

  const titleEl = document.getElementById("site-title");
  const subtitleEl = document.getElementById("site-subtitle");
  titleEl.textContent = meta.title;
  subtitleEl.textContent = meta.subtitle;
  titleEl.setAttribute("contenteditable", editMode ? "true" : "false");
  subtitleEl.setAttribute("contenteditable", editMode ? "true" : "false");
}

/* ============================================================
   TITLE / SUBTITLE EDITING
   ============================================================ */
document.getElementById("site-title").addEventListener("blur", (e) => {
  meta.title = e.target.textContent.trim() || "The Family Tree";
  e.target.textContent = meta.title;
  saveMeta();
});
document.getElementById("site-subtitle").addEventListener("blur", (e) => {
  meta.subtitle = e.target.textContent.trim() || "";
  e.target.textContent = meta.subtitle;
  saveMeta();
});

/* ============================================================
   LIGHTBOX
   ============================================================ */
function openLightbox(person) {
  if (!person.image) return; // nothing to enlarge for initials placeholders
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = person.image;
  document.getElementById("lightbox-caption").textContent = person.name || "";
  lightbox.hidden = false;
}

function closeLightbox() {
  document.getElementById("lightbox").hidden = true;
  document.getElementById("lightbox-img").src = "";
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

/* ============================================================
   PHOTO UPLOAD (resized client-side, stored as a data URL)
   ============================================================ */
const MAX_DIMENSION = 640;
const JPEG_QUALITY = 0.85;

document.getElementById("photo-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // reset so the same file can be chosen again later
  if (!file || !pendingPhotoTarget) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round(height * (MAX_DIMENSION / width));
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round(width * (MAX_DIMENSION / height));
        height = MAX_DIMENSION;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      pendingPhotoTarget.image = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      pendingPhotoTarget = null;
      saveData();
      render();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

/* ============================================================
   ADMIN ACCESS
   ------------------------------------------------------------
   This is a light deterrent, not real security: anyone who reads
   this file can see the password. It's meant to stop family
   members from casually clicking into edit mode by accident, not
   to protect against someone determined to look at the source.
   Change the password below to something only you know.
   ============================================================ */
const ADMIN_PASSWORD = "familytree2026";
const ADMIN_KEY = "familyTreeIsAdmin_v1";

let isAdmin = localStorage.getItem(ADMIN_KEY) === "true";

const adminToolbar = document.getElementById("admin-toolbar");
const adminLink = document.getElementById("admin-link");
const editToggle = document.getElementById("edit-toggle");
const editActions = document.getElementById("edit-actions");

function applyAdminVisibility() {
  adminToolbar.hidden = !isAdmin;
  adminLink.textContent = isAdmin ? "Log Out of Admin" : "Site Admin";
}

adminLink.addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    editMode = false;
    localStorage.removeItem(ADMIN_KEY);
    editToggle.textContent = "Edit Tree";
    editToggle.classList.remove("is-active");
    editActions.hidden = true;
    applyAdminVisibility();
    render();
    return;
  }
  const attempt = prompt("Enter the admin password to edit the tree:");
  if (attempt === null) return;
  if (attempt === ADMIN_PASSWORD) {
    isAdmin = true;
    localStorage.setItem(ADMIN_KEY, "true");
    applyAdminVisibility();
  } else {
    alert("That password isn't right.");
  }
});

applyAdminVisibility();

/* ============================================================
   EDIT MODE TOGGLE (admin only)
   ============================================================ */
editToggle.addEventListener("click", () => {
  editMode = !editMode;
  editToggle.textContent = editMode ? "Done Editing" : "Edit Tree";
  editToggle.classList.toggle("is-active", editMode);
  editActions.hidden = !editMode;
  render();
});

/* ============================================================
   EXPORT / IMPORT / RESET
   ============================================================ */
document.getElementById("export-btn").addEventListener("click", () => {
  const payload = { meta, data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "family-tree-data.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-btn").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const payload = JSON.parse(evt.target.result);
      if (!payload.data || !payload.data.grandparents || !Array.isArray(payload.data.children)) {
        throw new Error("File does not look like a family tree export.");
      }
      data = payload.data;
      meta = payload.meta || meta;
      saveData();
      saveMeta();
      render();
      alert("Family tree data imported successfully.");
    } catch (err) {
      alert("Could not import this file: " + err.message);
    }
  };
  reader.readAsText(file);
});

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("This will erase all edits saved in this browser and restore the original names and photos. Continue?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(META_KEY);
  data = structuredClone(DEFAULT_DATA);
  meta = { title: "The Family Tree", subtitle: "Four generations, one root." };
  render();
});

/* ============================================================
   INIT
   ============================================================ */
render();
