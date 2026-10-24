# Picture spots

## Filled (stock photos from Unsplash)
63 spots across the home, case study, services, specialisms, insights, media, portfolio, video library and article pages use generic photos of classrooms, blocks, crayons, pencils, books and notebooks. They load from Unsplash until you run:

```
python3 scripts/download-images.py
```

That saves them to `assets/images/unsplash/`, switches every page to the local copies, and creates `assets/images/social-share.jpg`. Credits: see `CREDITS.md`.

## Still empty on purpose (add your own photos)
| Page | Spot | Ratio | What to put there |
|---|---|---|---|
| index.html | Hero portrait | 3:4 | Practitioner portrait, natural light |
| index.html | "Her philosophy" photo | 3:4 | Working session (with consent) |
| index.html | Availability map | 4:3 | Map or location graphic |
| about.html | Large portrait banner | 21:9 | Portrait with the environment visible |
| about.html | Candid photo | 3:4 | Candid, working environment |
| about.html | Mosaic tile "m-a" | mosaic | Working with a child (consent required) |
| about.html | Final portrait | 3:4 | A different portrait from the hero |
| contact.html | Portrait | 3:4 | Friendly portrait |

To fill one, replace `<span>Photography pending</span>` in that spot with
`<img src="assets/images/your-photo.jpg" alt="Describe the photo" loading="lazy">`.

## Private gallery
Photos, videos and progress notes are not files in the project. Upload them from `gallery-admin.html` (see `docs/r2-setup-guide.md`).
