# perimeter-detection-ui-last

**perimeter-detection-ui-last** is a modern, responsive web application designed for real-time video-based Perimeter and Region of Interest (ROI) detection. It provides a secure and intuitive interface for security personnel to monitor video feeds, define restricted areas, and manage detection settings.

## 🚀 Usage & Goal

The primary goal of this application is to serve as the front-end interface for a perimeter detection system.
- **Real-time Monitoring**: Visualize video streams with overlay detection bounding boxes.
- **ROI Management**: Interactive tools to draw and save Regions of Interest directly on the video feed.
- **Security Dashboard**: View recent detection statistics and alerts.
- **Multi-Device Support**: Fully functional on desktop, tablet, and mobile devices.

## ✨ Key Features

- **Video Stream Integration**: Seamless handling of video elements for live feeds or playback.
- **Interactive ROI Drawing**: Uses **Konva** for high-performance canvas rendering, allowing precise drawing of polygonal zones.
- **Responsive Design**: Built with **Tailwind CSS** and **Reactstrap/Bootstrap** to adapt to any screen size.
- **Authentication**: Secure Login and Register flows with JWT-based session management.
- **Internationalization (i18n)**: Full multi-language support (English/Turkish) with auto-detection.
- **Dark/Light Mode**: (Architecture ready for theming customization).
- **Admin Dashboard**: Visual statistics and quick access to system status.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**:
  - [Tailwind CSS](https://tailwindcss.com/) (Utility-first styling)
  - [Reactstrap](https://reactstrap.github.io/) (Bootstrap 5 components)
  - SCSS (Custom global styles)
- **Canvas / Graphics**: [React Konva](https://konvajs.org/docs/react/index.html) (for ROI drawing)
- **State & Routing**: [React Router v7](https://reactrouter.com/), Context API
- **Internationalization**: [i18next](https://www.i18next.com/)
- **HTTP Client**: Axios

## 📂 Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # Shared reusable UI components
│   ├── DataTable.tsx
│   ├── Footer.tsx
│   ├── VideoROI/    # Specific components for video drawing
│   └── ...
├── context/         # React Contexts (AuthContext, etc.)
├── hooks/           # Custom React hooks
├── layouts/         # Page layout wrappers (Auth, Main)
├── locales/         # i18n translation JSON files
├── services/        # API service modules
├── types/           # TypeScript type definitions
├── utils/           # Helper functions
├── views/           # Main page views
│   ├── VideoROI.tsx # Core video monitoring interface
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── ...
├── App.tsx          # Main route definitions
└── main.tsx         # Application entry point
```

### Key Files
- **`src/views/VideoROI.tsx`**: The heart of the application. Handles video loading and the canvas overlay for drawing ROIs.
- **`src/components/VideoROI/DrawingCanvas.tsx`**: Encapsulates the Konva logic for drawing polygons over the video.

## ⚙️ Environment Configuration

The application uses a `.env` file to configure the backend connection.

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://your-api-url.com
```

- **`VITE_API_BASE_URL`**: The base URL for the backend API (e.g., `http://localhost:8000` or a production URL).

## 🚀 Setup & Run

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Development
Start the local development server:
```bash
npm run dev
```
Access the app at `http://localhost:5173` (or the port shown in terminal).

### Build for Production
Create an optimized production build:
```bash
npm run build
```
The output will be in the `dist/` folder.

### Preview Production Build
Locally preview the production build:
```bash
npm run preview
```

## 📱 Mobile & Responsive Behavior

- **Adaptive Toolbar**: The drawing toolbar in `VideoROI` automatically switches between vertical (desktop) and horizontal (mobile) layouts.
- **Touch Support**: ROI drawing supports touch events for mobile/tablet usage.
- **Responsive Layouts**: Dashboard and forms resize gracefully for smaller screens.

## 🌍 Localization

The app defaults to **English**.
- **Language Switcher**: Available in the top navbar or footer (depending on layout).
- **Adding Languages**: Add new JSON files in `src/locales/` and update `src/i18n.ts`.

## 🚢 Deployment Notes

- **Static Hosting**: The contents of the `dist/` folder can be deployed to any static host (Netlify, Vercel, AWS S3, Apache/Nginx).
- **SPA Routing**: Ensure your web server is configured to rewrite all 404s to `index.html` so React Router can handle deep links.

## 👨‍💻 Authorship

**Made by Oguz Cihan**

---
© 2026 Perimeter Detection Systems. All rights reserved.
