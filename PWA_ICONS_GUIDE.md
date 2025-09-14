# PWA Icons Guide - Larry AI

## Required icons for PWA

Create `/public/icons/` folder and add the following icons:

### Main icons (required):

- `icon-16x16.png` - 16x16px
- `icon-32x32.png` - 32x32px
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px (main)
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px (main)

### Additional icons:

- `safari-pinned-tab.svg` - SVG for Safari
- `shortcut-new-chat.png` - 96x96px (for quick access)
- `shortcut-upload.png` - 96x96px (for quick access)
- `badge.png` - 72x72px (for push notifications)

### Screenshots (optional):

- `desktop-screenshot.png` - 1280x720px
- `mobile-screenshot.png` - 390x844px

## Icon requirements:

1. **Format**: PNG for raster, SVG for vector
2. **Style**: Maskable (adaptive icon support)
3. **Background**: Transparent or white
4. **Content**: Larry AI logo centered
5. **Safe zone**: 10% margin from edges for maskable icons

## Recommendations:

- Use high-quality images
- Ensure icons look good on different backgrounds
- Test on different devices and platforms
- 192x192px icon will be used as main for Android
- 512x512px icon will be used for splash screen

## Folder structure:

```
public/
├── icons/
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── safari-pinned-tab.svg
│   ├── shortcut-new-chat.png
│   └── shortcut-upload.png
├── screenshots/
│   ├── desktop-screenshot.png
│   └── mobile-screenshot.png
└── manifest.json
```

After adding icons, PWA will be fully functional!
