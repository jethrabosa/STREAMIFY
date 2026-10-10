# Streamify

A real-time chat application built with React, Express, MongoDB, and Socket.IO.

![Demo App](/frontend/public/screenshot-for-readme.png)

[Video tutorial](https://youtu.be/ntKkVrQqBYY)

Highlights include JWT authentication, real-time messaging, one-to-one video calls, online user status, and Zustand state management.

## Requirements

- Node.js (LTS) and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- A Cloudinary account only if you want profile-picture or chat-image uploads

## Local setup

1. Install MongoDB Community Server for Windows and select the option to install it as a Windows service. Keep the default port (`27017`). MongoDB Compass is optional.
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `MONGODB_URI` in `backend/.env`. For a local database, use:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/streamify
   ```

   For MongoDB Atlas, use the connection string from your Atlas cluster instead.
4. Install project dependencies from the project root:

   ```shell
   npm run build
   ```

   This installs backend and frontend dependencies and builds the frontend.
5. Start the backend in one terminal:

   ```shell
   cd backend
   npm run dev
   ```
6. Start the frontend in a second terminal:

   ```shell
   cd frontend
   npm run dev
   ```
7. Open <http://localhost:5174>.

The app clears any saved login session when it starts, so you will be asked to sign in again after reopening or refreshing it. The backend listens on port `5001` by default and does not start until it can connect to MongoDB. If MongoDB is installed as a service but is stopped, start the **MongoDB Server** service from Windows Services.

## Google sign-in

Google sign-in requires a Google OAuth 2.0 **Web application** client ID:

1. Create a web client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and configure its OAuth consent screen.
2. Add your app's origins under **Authorized JavaScript origins**. For local use, add `http://localhost:5174` and `https://localhost:5173`. Add any HTTPS LAN or deployed app origin you use as well.
3. Copy the client ID (not a client secret) into `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`. The same client ID goes in both files. See the `.env.example` files for their locations.
4. Restart the backend and frontend. On Render, set both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` to the same value, then redeploy.

The login page shows Google's sign-in button above the email/password form. Google sign-in creates a Streamify account on first use and matches existing accounts by verified email.

## Open the app on a phone

For login and messaging, connect the phone and computer to the same Wi-Fi network, find the computer's IPv4 address with `ipconfig`, and open `http://<computer-ipv4>:5174` on the phone (for example, `http://192.168.1.20:5174`). The default `npm run dev` command serves HTTP so the phone does not need a development certificate. Allow Node.js through Windows Firewall on a private network if prompted.

Video calls require a secure browser context. To use the app over HTTPS during development, stop the HTTP server and run `npm run dev:https` in the frontend folder. Open `https://localhost:5173` on the computer or `https://<computer-ipv4>:5173` on the phone. The first HTTPS start creates a local certificate and may download the `mkcert` helper. Install and trust the development root certificate on the phone; the plugin prints its certificate folder when it starts. Install only `rootCA.pem` (never copy or install `rootCA-key.pem`). On iPhone/iPad, enable full trust under **Settings > General > About > Certificate Trust Settings**. Then allow camera/microphone access. For Android, follow the certificate installation prompts. If video calls are needed outside local development, deploy over HTTPS.

The HTTP development mode does not support camera or microphone access for video calls; use the HTTPS setup above for calls.

## Deploy a public link

To share the app with people on other Wi-Fi networks, deploy it online. The Render blueprint deploys the frontend and backend together, and MongoDB Atlas stores accounts and messages.

1. Push this project to a GitHub repository. Do not include `.env` files or credentials.
2. Create a MongoDB Atlas database and database user. In **Network Access**, allow connections from `0.0.0.0/0` so Render can reach the database; protect the database with a strong, unique database password.
3. In Render, choose **New > Blueprint**, connect the GitHub repository, and apply the `render.yaml` blueprint. The blueprint installs the frontend build dependencies, builds the frontend, and installs the backend production dependencies. Future commits pushed to `main` trigger a redeploy.
4. When prompted, enter the Atlas connection string for `MONGODB_URI`. Replace `<password>` with the database user's password and include the database name `streamify`. Render generates `JWT_SECRET` automatically.
5. Wait for the Render deployment to finish, then open the `onrender.com` URL shown for the service and share that HTTPS link.

The Render free web-service plan may sleep when unused, so its first request after a quiet period may take longer. Upgrade the service plan if it needs to stay responsive continuously. Profile-photo and chat-image uploads additionally require the Cloudinary environment variables listed above.

## Environment variables

`backend/.env.example` lists all supported variables. `MONGODB_URI` and `JWT_SECRET` are required. Set a private random value for `JWT_SECRET` before using the app beyond local development.

Image uploads use Cloudinary. To enable profile-picture and chat-image uploads, create a Cloudinary account and fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`. Authentication and text messaging do not require Cloudinary.

## Video calls

Open a chat and select the camera button to call an online user. Both participants must allow camera and microphone access. Browsers allow camera access on `localhost` during development; when deployed, the site must use HTTPS. Calls use WebRTC with a public STUN server. Some networks need a TURN relay to connect reliably or recover when direct peer-to-peer connectivity is unavailable. Configure your TURN provider in the frontend build environment:

```env
VITE_TURN_URLS=turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349?transport=tcp
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-credential
```

Restart the frontend dev server or rebuild/redeploy after changing these variables. `VITE_` values are included in browser code, so use provider-issued short-lived credentials where possible; do not put a long-lived secret in a public frontend build. The app also requests a screen wake lock during calls on supported browsers to reduce interruptions from the phone locking, but browser and operating-system behavior can still suspend calls when switching apps or losing network connectivity.

## Production build

```shell
npm run build
npm start
```
