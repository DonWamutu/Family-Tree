/* ============================================================
   DEFAULT FAMILY DATA
   ------------------------------------------------------------
   This is only the STARTING data. Once someone edits names or
   photos in the browser, their changes are saved to that
   browser's storage automatically (see app.js).

   To change the data that EVERYONE sees when they first visit
   the site, edit the values below directly, commit, and push
   to GitHub — Vercel will redeploy automatically.

   Each person now has an "images" ARRAY rather than a single
   image, so more than one photo can be attached to them. The
   first photo in the array is the one shown as their portrait;
   use "Make cover" in the Photo Manager (Edit Tree mode) to
   change which one that is.

   "familyPhotos" is a separate shared album — group photos that
   aren't tied to any one person. Leave it as an empty array to
   start with none.
   ============================================================ */

const DEFAULT_DATA = {
  grandparents: {
    father: { id: "gp-father", name: "Grandfather's Name", images: [] },
    mother: { id: "gp-mother", name: "Grandmother's Name", images: [] }
  },
  children: [
    { id: "c1",  name: "First Child",   images: [], children: [
      { id: "c1-1", name: "Grandchild", images: [] },
      { id: "c1-2", name: "Grandchild", images: [] }
    ]},
    { id: "c2",  name: "Second Child",  images: [], children: [
      { id: "c2-1", name: "Grandchild", images: [] }
    ]},
    { id: "c3",  name: "Third Child",   images: [], children: [
      { id: "c3-1", name: "Grandchild", images: [] },
      { id: "c3-2", name: "Grandchild", images: [] }
    ]},
    { id: "c4",  name: "Fourth Child",  images: [], children: [
      { id: "c4-1", name: "Grandchild", images: [] }
    ]},
    { id: "c5",  name: "Fifth Child",   images: [], children: [
      { id: "c5-1", name: "Grandchild", images: [] }
    ]},
    { id: "c6",  name: "Sixth Child",   images: [], children: [
      { id: "c6-1", name: "Grandchild", images: [] }
    ]},
    { id: "c7",  name: "Seventh Child", images: [], children: [
      { id: "c7-1", name: "Grandchild", images: [] }
    ]},
    { id: "c8",  name: "Eighth Child",  images: [], children: [
      { id: "c8-1", name: "Grandchild", images: [] }
    ]},
    { id: "c9",  name: "Ninth Child",   images: [], children: [
      { id: "c9-1", name: "Grandchild", images: [] }
    ]},
    { id: "c10", name: "Tenth Child",   images: [], children: [
      { id: "c10-1", name: "Grandchild", images: [] }
    ]}
  ],
  familyPhotos: []
};
