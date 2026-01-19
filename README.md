# Beau Label Frontend

A modern, responsive web application built with Next.js and Firebase, featuring a beautiful UI and robust authentication system.

## 🚀 Tech Stack

### Core Technologies

- **Next.js 15.3.2** - React framework for production
- **React 19.0.0** - JavaScript library for building user interfaces
- **Firebase** - Backend as a Service (BaaS) for authentication and hosting
- **TailwindCSS** - Utility-first CSS framework
- **JavaScript** - Most used language on web

### UI Components & Styling (ShadCN UI)

- **ShadCN UI** - Beautiful, accessible, and customizable components built with Radix UI and Tailwind CSS
- **Lucide React** - Beautiful icons
- **Next Themes** - Dark mode support
- **Sonner** - Toast notifications
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- Git

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd beau-label-frontend
   ```

2. **Install dependencies**

   ```bash
   # Using yarn
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with the following variables:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## 🚀 Development

1. **Start the development server**

   ```bash
   # Using yarn
   yarn dev
   ```

   The application will be available at `http://localhost:3000`

2. **Build for production**

   ```bash
   # Using yarn
   yarn build
   ```

3. **Start production server**

   ```bash
   # Using yarn
   yarn start
   ```

## 📁 Project Structure

```
beau-label-frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication related pages
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── public/              # Static assets
├── .github/             # GitHub Actions workflows
└── middleware.js        # Next.js middleware
```

## 🔧 Configuration Files

- `firebase.json` - Firebase configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `jsconfig.json` - JavaScript configuration
- `eslint.config.mjs` - ESLint configuration

## 🚀 Deployment & CI/CD

The project uses GitHub Actions for continuous integration and deployment (CI/CD). The deployment process is automated and will trigger when code is pushed to the main branch.

### CI/CD Pipeline (.github/workflows)

- **Automatic Deployment**: When code is pushed to the main branch, GitHub Actions automatically:
  1. Builds the Next.js application
  2. Runs linting and type checking
  3. Deploys to Firebase Hosting

### Manual Deployment (if needed)

If you need to deploy manually:

1. **Install Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**

   ```bash
   firebase login
   ```

3. **Deploy to Firebase**

   ```bash
   firebase deploy
   ```

## 🧪 Testing

Run the linter:

```bash
# Using yarn
yarn lint
```

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request
4. Once approved and merged to main, the CI/CD pipeline will automatically deploy your changes

## 📝 Code Style

- Follow the ESLint configuration
- Use Prettier for code formatting
- Follow the component structure in the `components` directory
- Use TypeScript for type safety

## 🔐 Authentication

The project uses Firebase Authentication. Make sure to:

1. Enable the required authentication methods in Firebase Console
2. Configure the authentication providers
3. Set up the appropriate security rules

## 🎨 UI/UX Guidelines

- Follow the ShadCN UI design system
- Use Tailwind CSS for styling
- Implement responsive design for all components
- Follow accessibility guidelines

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ShadCN UI Documentation](https://ui.shadcn.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## ⚠️ Troubleshooting

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables
3. Ensure all dependencies are installed
4. Clear the `.next` cache if needed:
   ```bash
   rm -rf .next
   ```
5. Check GitHub Actions logs if deployment fails

## 📄 License

[Add your license information here]
