# Notion Landing Page - Copy/Paste Structure

This is a ready-to-build structure for a Notion page that introduces DrawForge
and links out to (or embeds) the live app. Copy each section into a Notion
page as its own block group, in this order.

> Replace `https://your-deployed-url.example.com` below with your real
> deployed URL once you've hosted the `app/` build (see README §5).

---

## 1. Hero

**Block type:** Heading 1 + paragraph + button-style link, centered.

```
🖌️ DrawForge

Turn Any Image Into a Drawing Lesson

Upload a reference and learn to draw it step by step - free, private,
and built for beginners.

[ Open DrawForge → ]  (link to your deployed URL)
```

---

## 2. How It Works

**Block type:** 5-column layout (or numbered list on mobile).

```
1. Upload — Drop in a reference photo. It stays on your device.
2. Analyze — Free on-device vision models find the face and pose.
3. Construct — A Loomis-style guide is built: sphere, center line, jaw.
4. Practice — Work through 8-10 stages next to your reference.
5. Finish — Land on a clean final sketch, ready to download.
```

---

## 3. Upload

**Block type:** Callout block.

```
📤  Ready to start? Open the app and tap "Upload Image" - JPG, PNG and
WEBP are all supported, including straight from your phone's camera.
```

---

## 4. Drawing Styles

**Block type:** 4-column gallery/toggle list.

```
✨ Anime — large expressive eyes, simplified features
🖋️ Manga — sharper angles, dynamic hair
🎨 Cartoon — bold shapes, strong silhouette
🧑‍🎨 Realistic — true proportions, visible facial planes
```

---

## 5. Examples

**Block type:** Image gallery / toggle list showing the stage progression.

```
Reference → Construction → Features → Details → Final Drawing

"Start with basic forms, add structure, build details, and finish with
clean lines."
```

(Add screenshots of your own generated tutorials here once you've tried the
app - don't reuse screenshots from any other product.)

---

## 6. Open App

**Block type:** Embed block (`/embed`) pointing at your deployed app URL, or a
large button if you'd rather link out in a new tab.

```
[ /embed https://your-deployed-url.example.com ]
```

DrawForge's routing and layout are designed to work inside a resized Notion
embed block, including on mobile.

---

## 7. Feedback

**Block type:** Heading + a Notion form, or a simple mailto/Typeform link.

```
💬 Have feedback or found an issue?
[ Share feedback ]  (link to a form, email, or Notion database)
```

---

## Notes on embedding

- The app uses hash-based routing (`/#/...`), so it works correctly from any
  embedded path or subdomain without extra server configuration.
- It never requests fullscreen, so it behaves well inside Notion's embed
  frame at any size.
- If you self-host instead of using a platform like Netlify/Vercel/Cloudflare
  Pages, make sure your server does not send `X-Frame-Options: DENY` or a
  restrictive `Content-Security-Policy: frame-ancestors` header, or Notion
  won't be able to embed it.
