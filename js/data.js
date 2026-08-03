/* ============================================================
   DEFAULT FAMILY DATA
   ------------------------------------------------------------
   This is only the STARTING data. Once someone edits names or
   photos in the browser, their changes are saved to that
   browser's storage automatically (see app.js).

   To change the data that EVERYONE sees when they first visit
   the site, edit the values below directly, commit, and push
   to GitHub — Vercel will redeploy automatically.

   Leave "image" as null to show an elegant initials placeholder.
   To set a real photo permanently, use the Export Data button in
   edit mode, open the downloaded file, copy the "image" data URL
   for that person, and paste it in here.
   ============================================================ */

const DEFAULT_DATA = {
  grandparents: {
    father: { id: "gp-father", name: "Grandfather's Name", image: null },
    mother: { id: "gp-mother", name: "Grandmother's Name", image: null }
  },
  children: [
    { id: "c1",  name: "First Child",   image: null, children: [
      { id: "c1-1", name: "Grandchild", image: null },
      { id: "c1-2", name: "Grandchild", image: null }
    ]},
    { id: "c2",  name: "Second Child",  image: null, children: [
      { id: "c2-1", name: "Grandchild", image: null }
    ]},
    { id: "c3",  name: "Third Child",   image: null, children: [
      { id: "c3-1", name: "Grandchild", image: null },
      { id: "c3-2", name: "Grandchild", image: null }
    ]},
    { id: "c4",  name: "Fourth Child",  image: null, children: [
      { id: "c4-1", name: "Grandchild", image: null }
    ]},
    { id: "c5",  name: "Fifth Child",   image: null, children: [
      { id: "c5-1", name: "Grandchild", image: null }
    ]},
    { id: "c6",  name: "Sixth Child",   image: null, children: [
      { id: "c6-1", name: "Grandchild", image: null }
    ]},
    { id: "c7",  name: "Seventh Child", image: null, children: [
      { id: "c7-1", name: "Grandchild", image: null }
    ]},
    { id: "c8",  name: "Eighth Child",  image: null, children: [
      { id: "c8-1", name: "Grandchild", image: null }
    ]},
    { id: "c9",  name: "Ninth Child",   image: null, children: [
      { id: "c9-1", name: "Grandchild", image: null }
    ]},
    { id: "c10", name: "Tenth Child",   image: null, children: [
      { id: "c10-1", name: "Grandchild", image: null }
    ]}
  ]
};
