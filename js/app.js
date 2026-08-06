/* ============================================================
   STATE
   ============================================================ */
const STORAGE_KEY = "familyTreeData_v1";
const META_KEY = "familyTreeMeta_v1";

let data = loadData();
let meta = loadMeta();
let editMode = false;

// Which person's photos the Photo Manager modal is currently showing.
let managedPerson = null;

// Current lightbox gallery state.
let lightboxImages = [];
let lightboxIndex = 0;
let lightboxCaptionBase = "";

/* ============================================================
   PERSISTENCE
   ============================================================ */
function loadData() {
  let d;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    d = raw ? JSON.parse(raw) : structuredClone(DEFAULT_DATA);
  } catch (e) {
    d = structuredClone(DEFAULT_DATA);
  }
  migrateData(d);
  return d;
}

// Upgrades older saved data (a single "image" string per person) to the
// current format (an "images" array), and makes sure familyPhotos exists.
// Safe to run on already-current data — it just does nothing extra.
function migrateData(d) {
  const fixPerson = (p) => {
    if (!p) return;
    if (!Array.isArray(p.images)) {
      p.images = p.image ? [p.image] : [];
    }
    delete p.image;
  };
  if (d.grandparents) {
    fixPerson(d.grandparents.father);
    fixPerson(d.grandparents.mother);
  }
  if (Array.isArray(d.children)) {
    d.children.forEach(child => {
      fixPerson(child);
      if (Array.isArray(child.children)) {
        child.children.forEach(fixPerson);
      } else {
        child.children = [];
      }
    });
  } else {
    d.children = [];
  }
  if (!Array.isArray(d.familyPhotos)) d.familyPhotos = [];
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

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ============================================================
   IMAGE RESIZING (shared by person photos and family album photos)
   ============================================================ */
const MAX_DIMENSION = 640;
const JPEG_QUALITY = 0.85;

function resizeImageFile(file) {
  return new Promise((resolve) => {
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
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   PERSON RENDERING
   ============================================================ */
function renderPortrait(person, sizeClass) {
  const wrap = el("div", "portrait-wrap");
  const cover = person.images && person.images.length > 0 ? person.images[0] : null;
  if (cover) {
    const img = el("img", `portrait ${sizeClass}`);
    img.src = cover;
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
    openPhotoManager(person);
  } else if (person.images && person.images.length > 0) {
    openLightboxGallery(person.images, 0, person.name || "");
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
    wrap.appendChild(el("span", "edit-mode-tag", "click photo to add/manage photos"));
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

/* Children & Grandchildren, together: a vertical list of family
   branches — each parent, with their own children in a horizontal
   row directly beneath them, then the next parent below that. */
function renderFamilyBranches() {
  const section = el("section", "level-section");
  section.appendChild(el("p", "generation-label", "Children & Grandchildren"));

  const list = el("div", "family-branches");
  data.children.forEach(child => {
    const block = el("div", "family-branch");

    const parentRow = el("div", "branch-parent-row");
    parentRow.appendChild(renderPerson(child, "person--child", "", true));
    const removeChildBtn = el("button", "remove-btn", "Remove this child & their family");
    removeChildBtn.addEventListener("click", () => {
      if (!confirm(`Remove ${child.name || "this person"} and all of their children from the tree?`)) return;
      data.children = data.children.filter(x => x.id !== child.id);
      saveData();
      render();
    });
    parentRow.appendChild(removeChildBtn);
    block.appendChild(parentRow);

    if (child.children.length > 0 || editMode) {
      block.appendChild(el("p", "branch-kids-label", "Children"));
    }

    const kidsRow = el("div", "branch-kids-row");
    child.children.forEach(gc => kidsRow.appendChild(renderGrandchild(gc, child)));
    block.appendChild(kidsRow);

    const addGcBtn = el("button", "add-person-btn", "+ Add child");
    addGcBtn.addEventListener("click", () => {
      child.children.push({ id: uid("p"), name: "New Family Member", images: [] });
      saveData();
      render();
    });
    block.appendChild(addGcBtn);

    list.appendChild(block);
  });
  section.appendChild(list);

  const addWrap = el("div", "add-child-branch");
  const addChildBtn = el("button", "btn btn-ghost small", "+ Add another child");
  addChildBtn.addEventListener("click", () => {
    data.children.push({ id: uid("p"), name: "New Family Member", images: [], children: [] });
    saveData();
    render();
  });
  addWrap.appendChild(addChildBtn);
  section.appendChild(addWrap);

  return section;
}

/* ============================================================
   FAMILY PHOTOS (shared album, not tied to one person)
   ============================================================ */
function renderFamilyPhotosSection() {
  if (data.familyPhotos.length === 0 && !editMode) return null;

  const section = el("section", "level-section family-photos-section");
  section.appendChild(el("p", "generation-label", "Family Photos"));

  if (data.familyPhotos.length === 0) {
    section.appendChild(el("p", "family-photos-empty", "No photos yet — add some below."));
  }

  const grid = el("div", "family-photos-grid");
  data.familyPhotos.forEach((photo, idx) => {
    const cell = el("div", "family-photo-cell");

    const img = el("img", "family-photo-thumb");
    img.src = photo.image;
    img.alt = photo.caption || "Family photo";
    img.addEventListener("click", () => {
      openLightboxGallery(data.familyPhotos.map(p => p.image), idx, "Family Photos");
    });
    cell.appendChild(img);

    const caption = el("p", "family-photo-caption", photo.caption || (editMode ? "Add a caption\u2026" : ""));
    caption.setAttribute("contenteditable", editMode ? "true" : "false");
    caption.spellcheck = false;
    caption.addEventListener("blur", () => {
      photo.caption = caption.textContent.trim();
      caption.textContent = photo.caption || (editMode ? "Add a caption\u2026" : "");
      saveData();
    });
    caption.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); caption.blur(); }
    });
    cell.appendChild(caption);

    const removeBtn = el("button", "remove-btn", "Remove");
    removeBtn.addEventListener("click", () => {
      if (!confirm("Remove this photo from the family album?")) return;
      data.familyPhotos = data.familyPhotos.filter(p => p.id !== photo.id);
      saveData();
      render();
    });
    cell.appendChild(removeBtn);

    grid.appendChild(cell);
  });
  section.appendChild(grid);

  const addWrap = el("div", "add-child-branch");
  const addBtn = el("button", "btn btn-ghost small", "+ Add Photos");
  addBtn.addEventListener("click", () => document.getElementById("family-photo-file").click());
  addWrap.appendChild(addBtn);
  section.appendChild(addWrap);

  return section;
}

document.getElementById("family-photo-file").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  e.target.value = "";
  if (!files.length) return;
  for (const file of files) {
    const dataUrl = await resizeImageFile(file);
    data.familyPhotos.push({ id: uid("fp"), image: dataUrl, caption: "" });
  }
  saveData();
  render();
});

/* ============================================================
   RENDER (main tree + album)
   ============================================================ */
function render() {
  const root = document.getElementById("tree-root");
  root.innerHTML = "";
  root.appendChild(renderGrandparents());
  root.appendChild(renderFamilyBranches());

  const familySection = renderFamilyPhotosSection();
  if (familySection) root.appendChild(familySection);

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
   LIGHTBOX (view-only, supports multiple photos with Prev/Next)
   ============================================================ */
function openLightboxGallery(images, startIndex, captionBase) {
  if (!images || images.length === 0) return;
  lightboxImages = images;
  lightboxIndex = startIndex;
  lightboxCaptionBase = captionBase || "";
  renderLightboxFrame();
  document.getElementById("lightbox").hidden = false;
}

function renderLightboxFrame() {
  document.getElementById("lightbox-img").src = lightboxImages[lightboxIndex];
  const multi = lightboxImages.length > 1;
  const captionEl = document.getElementById("lightbox-caption");
  captionEl.textContent = multi
    ? `${lightboxCaptionBase}${lightboxCaptionBase ? " \u2014 " : ""}${lightboxIndex + 1} of ${lightboxImages.length}`
    : lightboxCaptionBase;
  document.getElementById("lightbox-prev").hidden = !multi;
  document.getElementById("lightbox-next").hidden = !multi;
}

function lightboxStep(delta) {
  if (lightboxImages.length === 0) return;
  lightboxIndex = (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length;
  renderLightboxFrame();
}

function closeLightbox() {
  document.getElementById("lightbox").hidden = true;
  document.getElementById("lightbox-img").src = "";
  lightboxImages = [];
  lightboxIndex = 0;
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox-prev").addEventListener("click", () => lightboxStep(-1));
document.getElementById("lightbox-next").addEventListener("click", () => lightboxStep(1));
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") closeLightbox();
});
document.addEventListener("keydown", (e) => {
  const lb = document.getElementById("lightbox");
  if (lb.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") lightboxStep(-1);
  if (e.key === "ArrowRight") lightboxStep(1);
});

/* ============================================================
   PHOTO MANAGER (edit mode only — add/remove/reorder a person's photos)
   ============================================================ */
function openPhotoManager(person) {
  managedPerson = person;
  document.getElementById("photo-manager-title").textContent = `Manage Photos \u2014 ${person.name || "Unnamed"}`;
  renderPhotoManagerGrid();
  document.getElementById("photo-manager").hidden = false;
}

function closePhotoManager() {
  document.getElementById("photo-manager").hidden = true;
  managedPerson = null;
}

function renderPhotoManagerGrid() {
  const grid = document.getElementById("photo-manager-grid");
  grid.innerHTML = "";
  if (!managedPerson) return;

  if (managedPerson.images.length === 0) {
    grid.appendChild(el("p", "photo-manager-empty", "No photos yet \u2014 add one below."));
  }

  managedPerson.images.forEach((src, idx) => {
    const cell = el("div", "photo-manager-cell");
    const img = el("img", "photo-manager-thumb");
    img.src = src;
    img.alt = "";
    cell.appendChild(img);

    if (idx === 0) {
      cell.appendChild(el("span", "cover-badge", "Cover photo"));
    } else {
      const coverBtn = el("button", "manager-btn", "Make cover");
      coverBtn.addEventListener("click", () => {
        managedPerson.images.splice(idx, 1);
        managedPerson.images.unshift(src);
        saveData();
        renderPhotoManagerGrid();
        render();
      });
      cell.appendChild(coverBtn);
    }

    const removeBtn = el("button", "manager-btn danger", "Remove");
    removeBtn.addEventListener("click", () => {
      if (!confirm("Remove this photo?")) return;
      managedPerson.images.splice(idx, 1);
      saveData();
      renderPhotoManagerGrid();
      render();
    });
    cell.appendChild(removeBtn);

    grid.appendChild(cell);
  });
}

document.getElementById("photo-manager-close").addEventListener("click", closePhotoManager);
document.getElementById("photo-manager").addEventListener("click", (e) => {
  if (e.target.id === "photo-manager") closePhotoManager();
});
document.getElementById("photo-manager-add").addEventListener("click", () => {
  document.getElementById("photo-file").click();
});
document.getElementById("photo-file").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  e.target.value = "";
  if (!files.length || !managedPerson) return;
  for (const file of files) {
    const dataUrl = await resizeImageFile(file);
    managedPerson.images.push(dataUrl);
  }
  saveData();
  renderPhotoManagerGrid();
  render();
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
   DOWNLOAD data.js (ready to drop straight into GitHub)
   ============================================================ */
document.getElementById("download-datajs-btn").addEventListener("click", () => {
  const fileContent = `/* ============================================================
   DEFAULT FAMILY DATA
   ------------------------------------------------------------
   Generated from the live site's Edit Tree mode via "Download
   data.js". To make these changes visible to every visitor:

   1. Go to your GitHub repository.
   2. Open the "js" folder, then click "Add file" -> "Upload files".
   3. Drag this data.js file in (it will replace the existing one).
   4. Commit the change. Vercel will redeploy automatically.
   ============================================================ */

const DEFAULT_DATA = ${JSON.stringify(data, null, 2)};
`;
  const blob = new Blob([fileContent], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.js";
  a.click();
  URL.revokeObjectURL(url);
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
      migrateData(data);
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
