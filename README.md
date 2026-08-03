# The Family Tree

A private, elegant website for your family tree — grandparents at the top,
their ten children below, and each of their children (the grandchildren)
beneath them. Click any portrait to view it full-size. Switch on **Edit Tree**
to rename anyone or replace a photo.

No backend, no database, no payment of any kind — it's plain HTML, CSS and
JavaScript, so it can be hosted for free forever on Vercel.

---

## 1. Who can edit

Regular visitors only ever see the tree itself — there's no visible "Edit"
button anywhere for them. A small, low-key **Site Admin** link sits at the
very bottom of the page. Clicking it asks for a password; entering it
correctly reveals the **Edit Tree** button and keeps you logged in on that
device until you click **Log Out of Admin**.

The default password is:

```
familytree2026
```

**Change this before you share the link with anyone.** Open `js/app.js`,
find the line near the top that says:

```js
const ADMIN_PASSWORD = "familytree2026";
```

and replace the text between the quotes with your own password, then save
and push the change to GitHub (see the deployment steps below).

Be aware this is a simple deterrent, not real security — since the whole
site is plain code with no server, anyone determined enough to open the
`app.js` file could technically read the password. It's meant to stop
family members from accidentally clicking into edit mode, not to withstand
a serious attempt to break in. If that's not good enough for your needs,
say so and a proper login system can be added instead (it would need a
small paid backend, though — this current version is what keeps everything
free).

## 2. How editing actually works (read this first)

This site has no server and no login system — that's what makes it free and
simple. Because of that, there's one important thing to understand:

> **When someone clicks "Edit Tree" and changes a name or photo, that change
> is saved only in their own browser (on their own phone or computer).** It
> will still be there the next time *they* visit, but other visitors won't
> see it until you update the actual files in GitHub.

So there are two ways to use the editing feature:

- **Try things out / personal view** — anyone can click Edit Tree, rename
  people, swap photos, and it'll persist for them personally.
- **Make it permanent for everyone** — after editing, click **Export Data**.
  This downloads a small `family-tree-data.json` file. Send that file to
  whoever maintains the GitHub repo (probably you), and use it to update
  `js/data.js` (see step 6 below), then push the change. Vercel will
  automatically redeploy and everyone will see the update.

If this ever gets confusing for your family, the simplest approach is: **you**
are the one who keeps Edit Tree on, makes all the changes, exports the file,
and updates GitHub — everyone else just browses the finished site.

---

## 3. What's in this project

```
family-tree/
├── index.html          The page structure
├── css/style.css        All styling (colors, fonts, layout, responsiveness)
├── js/data.js            The starting names/photos — edit this for permanent changes
├── js/app.js             All the interactive behavior
└── README.md
```

---

## 4. Try it on your own computer first (optional but recommended)

1. Download or copy this whole `family-tree` folder onto your computer.
2. Double-click `index.html`. It will open in your web browser and work
   immediately — no installation needed.
3. Click **Edit Tree** to test renaming people and uploading photos.

---

## 5. Put the code on GitHub

GitHub is where your website's code will live, and Vercel will read it from
there. This is free.

1. Go to **https://github.com** and click **Sign up**. Create a free account.
2. Once logged in, click the **+** icon (top right) → **New repository**.
3. Name it something like `family-tree`. Leave it **Public** (or Private —
   both work fine with Vercel's free plan). Do **not** check "Add a
   README" since you already have one. Click **Create repository**.
4. On the next page, click the link that says **"uploading an existing
   file"**.
5. Drag the entire contents of your `family-tree` folder into the browser
   window (the `index.html` file, the `css` folder, the `js` folder, and
   `README.md`). Make sure the folder *structure* is preserved — GitHub
   will show you a file list before you commit.
6. Scroll down and click **Commit changes**.

Your code is now on GitHub.

---

## 6. Deploy it for free on Vercel

1. Go to **https://vercel.com** and click **Sign Up**.
2. Choose **Continue with GitHub** and authorize the connection — this is
   free and is the easiest way to link the two.
3. Once inside your Vercel dashboard, click **Add New...** → **Project**.
4. Find your `family-tree` repository in the list and click **Import**.
5. On the configuration screen:
   - **Framework Preset:** choose **Other**
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
6. Click **Deploy**.
7. After about 30–60 seconds, Vercel will show you a live URL like
   `family-tree-yourname.vercel.app`. That's your website — visit it,
   share the link with your family.

That's it. No payment details are required for this — Vercel's free
"Hobby" plan covers exactly this kind of personal site.

---

## 7. Making a permanent change (updating names/photos for everyone)

1. On the live site, click **Edit Tree**, make your changes, then click
   **Export Data**. This downloads `family-tree-data.json`.
2. Open that file in any text editor. You'll see something like:
   ```json
   {
     "meta": { "title": "The Family Tree", "subtitle": "..." },
     "data": {
       "grandparents": { "father": { "name": "...", "image": "data:image/jpeg;base64,..." }, ... },
       "children": [ ... ]
     }
   }
   ```
3. Open `js/data.js` in your GitHub repository (click the file, then the
   pencil/edit icon).
4. Copy the matching `name` and `image` values from your exported JSON into
   `DEFAULT_DATA` in `data.js`. (The `image` value is a long line of text
   starting with `data:image` — that's normal, it's the photo itself.)
5. Scroll down and click **Commit changes** directly on GitHub.
6. Vercel automatically detects the change and redeploys your site within
   a minute — no extra steps needed.

You can also add or remove people permanently the same way, by editing the
`children` arrays in `data.js` directly.

---

## 8. Design notes

- **Palette:** white background, near-black ink for text, antique gold for
  structure and accents, deep aubergine purple as a secondary accent.
- **Type:** *Cormorant Garamond* for names and headings, *EB Garamond* for
  supporting text — both free, loaded from Google Fonts.
- **Layout:** grandparents at the top, joined by a gold line down into a
  grid of their ten children, each with their own children nested beneath
  them. On narrow screens the grid stacks into single-column cards so
  everything stays readable on mobile.
- Photos are automatically resized in the browser before saving, so even
  large phone photos stay reasonably light.

---

## 9. Optional: a nicer web address

Vercel gives you a free `.vercel.app` address automatically. If you'd like
something like `smithfamilytree.com`, that requires buying a domain name
(usually $10–15/year from a registrar) and pointing it at Vercel in your
project's **Settings → Domains** — but this is entirely optional; the free
`.vercel.app` address works perfectly well on its own.
