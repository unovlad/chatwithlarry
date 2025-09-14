# VAPID Keys Setup for Push Notifications

## What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are used to identify your application server when sending push notifications. They ensure that only your server can send notifications to your users.

## Setup Instructions

### Method 1: Using web-push CLI (Recommended)

1. Install web-push globally:

```bash
npm install -g web-push
```

2. Generate VAPID keys:

```bash
web-push generate-vapid-keys
```

3. Copy the output and add to your `.env.local` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### Method 2: Using Node.js script

Create a file `generate-vapid.js`:

```javascript
const webpush = require("web-push");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("Public Key:", vapidKeys.publicKey);
console.log("Private Key:", vapidKeys.privateKey);
```

Run it:

```bash
node generate-vapid.js
```

## After Generating Keys

1. Add the keys to your `.env.local` file
2. Uncomment the VAPID key line in `PushNotificationManager.tsx`:

```typescript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
});
```

3. Install web-push package for server-side notifications:

```bash
npm install web-push
```

## Security Notes

- Keep your private key secure and never expose it in client-side code
- Only the public key should be exposed to the client
- Consider rate limiting for notifications
- Implement user preferences for notification types

## Testing

- Use HTTPS for testing (required for push notifications)
- Test on different browsers and devices
- Check browser console for any errors
