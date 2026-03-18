# StudyFlow - AI-Powered Educational Learning Platform

- [1. 📖 Introduction](#1--introduction)
- [2. 🎯 Problem Statement](#2--problem-statement)
- [3. 🚀 Live Demo](#3--live-demo)
- [4. 🎬 Live Video Demonstration](#4--live-video-demonstration)
- [5. ✨ Key Features](#5--key-features)
- [6. 🛠️ Technical Stack](#6--technical-stack)
- [7. 📦 Installation](#7--installation)
- [8. 📁 Project Structure](#8--project-structure)
- [9. 🤝 Contributing](#9--contributing)
- [10. 📄 License](#10--license)
- [11. 🙏 Acknowledgments](#11--acknowledgments)

---

## 1. 📖 Introduction

StudyFlow is an innovative AI-powered educational platform that revolutionizes the way students learn and educators teach. By leveraging cutting-edge artificial intelligence, we create personalized learning experiences that adapt to individual needs, making education more engaging, effective, and accessible.

Our platform combines intelligent content generation, interactive learning modules, comprehensive progress tracking, and real-time AI assistance to deliver a complete educational ecosystem. Whether you're a student seeking to master new concepts or an educator looking to enhance your teaching methods, StudyFlow provides the tools and insights needed for academic success.

## 2. 🎯 Problem Statement

Traditional educational approaches face several critical challenges in today's digital age:

- **Generic Content Delivery**: One-size-fits-all educational content that doesn't adapt to individual learning styles and paces
- **Limited Personalization**: Lack of personalized learning paths that address specific strengths and weaknesses
- **Ineffective Progress Tracking**: Difficulty in accurately measuring learning progress and identifying knowledge gaps
- **Resource Accessibility**: Limited access to diverse, high-quality educational materials and real-time assistance
- **Engagement Issues**: Traditional learning methods often fail to maintain student engagement and motivation
- **Assessment Challenges**: Static assessments that don't provide immediate feedback or adapt to student performance

StudyFlow addresses these challenges by:

- **AI-Driven Personalization**: Creating adaptive learning experiences tailored to each individual
- **Intelligent Content Generation**: Producing dynamic, relevant educational content using advanced AI
- **Real-Time Analytics**: Providing comprehensive insights into learning progress and performance
- **Accessible AI Assistance**: Offering 24/7 intelligent tutoring and support
- **Gamified Learning**: Implementing engaging, interactive elements to boost motivation
- **Adaptive Assessment**: Creating dynamic quizzes and evaluations that adjust to student performance

## 3. 🚀 Live Demo

🌐 **[Experience StudyFlow Live](https://study-flow.taskforges.com)**

### ⚠️ Important Notes

- **Server Startup**: The backend is deployed on Render's free tier, so initial server response may take anywhere from a few seconds to a few minutes. Please be patient during the first request.

### Demo Credentials

- **Email**: sokarama79@gmail.com
- **Password**: sokarama79@gmail.com

## 4. 🎬 Live Video Demonstration

## Video Demonstrations

Watch our platform in action:

[![Study Flow Demo](https://img.youtube.com/vi/SaCoIQQgDlw/maxresdefault.jpg)](https://youtu.be/SaCoIQQgDlw?si=RofbgUg8D2AZxgqq)

## 5. ✨ Key Features

### 🧠 AI-Powered Learning Engine

- **Intelligent Content Generation**: Dynamically creates lessons, quizzes, and educational materials using OpenAI GPT and Google's Gemini AI
- **Adaptive Learning Paths**: Personalizes learning journeys based on individual progress and performance analytics
- **Smart Tutoring System**: Provides contextual assistance and explanations through our AI chatbot with platform-specific guidance
- **Weakness Detection**: Analyzes performance patterns to identify and focus on challenging topics

### 📚 Comprehensive Subject Management

- **Structured Learning**: Organized subjects with topic-based curriculum structure
- **Progress Tracking**: Real-time visualization of completion rates and learning milestones
- **Subject Discovery**: Explore and add subjects to create personalized learning paths
- **Topic Mastery**: Track detailed progress within each subject's topics

### 🎯 Interactive Assessment System

- **AI-Generated Quizzes**: Creates adaptive quizzes tailored to topic difficulty and student performance
- **Instant Feedback**: Provides immediate results and explanations for better understanding
- **Multiple Question Types**: Supports various assessment formats including MCQs, short answers, and essay questions
- **Performance Analytics**: Detailed insights into quiz performance and improvement areas

### 🎮 Gamified Learning Experience

- **Interactive Games**: Educational games that make learning fun and engaging
- **Achievement System**: Rewards and badges for reaching learning milestones
- **Leaderboards**: Competitive elements to motivate continuous learning
- **Progress Visualization**: Beautiful charts and graphs to track learning journey

### 💻 Modern Technical Infrastructure

- **Real-Time Synchronization**: Live updates across all devices and sessions
- **Secure Authentication**: JWT-based authentication with refresh token support
- **File Management**: Upload and organize educational materials and resources
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices

### 🔍 Advanced Analytics & Insights

- **Learning Analytics**: Comprehensive dashboard with performance metrics
- **Weakness Analysis**: Identifies knowledge gaps and suggests improvement strategies
- **Time Tracking**: Monitors study time and learning patterns
- **Progress Reports**: Detailed reports for students and educators

## 6. 🛠️ Technical Stack

### Frontend Architecture

- **Framework**: Next.js 15.2.2 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**:
  - Radix UI primitives for accessibility
  - shadcn/ui for consistent design components
  - Custom components for platform-specific features
- **Icons & Graphics**: Lucide React, React Icons for comprehensive iconography
- **Animations**: Framer Motion for smooth, engaging user interactions
- **State Management**: Zustand for lightweight, efficient state handling
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Rich Content**:
  - Quill editor for rich text editing
  - React Markdown for content rendering
  - Syntax highlighting for code examples
- **Data Visualization**: Recharts for interactive charts and progress tracking

### Backend Infrastructure

- **Runtime**: Node.js with TypeScript for type safety
- **Framework**: Express.js with middleware architecture
- **Database**:
  - Neon PostgreSQL for scalable data storage
  - Drizzle ORM for type-safe database operations
  - Connection pooling for optimal performance
- **AI Integration**:
  - OpenAI GPT API for content generation
  - Google Gemini AI for alternative AI processing
  - SmythOS Agent Builder
  - LangChain for AI workflow orchestration
  - Pinecone vector database for semantic search and RAG
- **Authentication**: JWT with bcrypt for secure user management
- **File Storage**: AWS S3 compatible storage (Cloudflare R2)
- **Communication**:
  - Nodemailer for email notifications
  - Socket.IO for real-time features
- **Agent Orchestration**: SmythOS Agent Builder

### Development & DevOps

- **Package Management**: pnpm for efficient dependency management
- **Code Quality**: ESLint, Prettier for consistent code style
- **Build Tools**: Next.js built-in compiler and bundling
- **Database Management**: Drizzle Kit for migrations and schema management
- **Environment Management**: Environment-specific configurations
- **API Documentation**: RESTful API with comprehensive endpoint documentation

## 7. 📦 Installation

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** database (Neon recommended)
- **pnpm** package manager (recommended) or npm
- **Git** for version control

### API Keys Required

- **OpenAI API Key** for content generation
- **Google Gemini API Key** for AI processing
- **SmythOS Agent LLM Key** for agent orchestration
- **Pinecone API Key** for vector database
- **Cloudflare R2** credentials for file storage
- **Gmail App Password** for email notifications

### Environment Configuration

#### Client Environment (`.env.local`)

```env
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000
```

#### Server Environment (`.env`)

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require&channel_binding=require

# Server Configuration
PORT=8000
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SmythOS Agent LLM API Key
SMYTHOS_AGENTLLM_KEY=sk-your_smythos_agent_key

# Cloudflare R2 Bucket Credentials
TOKEN_VALUE=your_cloudflare_r2_token
ACCESS_KEY_ID=your_access_key_id
SECRET_ACCESS_KEY=your_secret_access_key
ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
PUBLIC_ACCESS_URL=https://pub-your_public_id.r2.dev
BUCKET_NAME=your_bucket_name

# AI API Keys
GEMINI_API_KEY="your_gemini_api_key"
OPENAI_API_KEY=sk-proj-your_openai_api_key

# Environment Configuration
NODE_ENV=development

# SmythOS API Endpoints
TOPIC_LIST_URL=https://your_topic_list_agent.agent.a.smyth.ai/api/generate_topic_list
MENTAL_STATUS_URL=https://your_mental_status_agent.agent.a.smyth.ai/api/evaluate_quiz

# Pinecone Vector Database
PINECONE_API_KEY=pcsk_your_pinecone_api_key
PINECONE_INDEX=your_index_name
```

### Quick Start

1. **Clone the Repository**

```bash
git clone https://github.com/Ajor-Saha/DeltaCoders-Final-Test
cd DeltaCoders-Final-Test
```

2. **Install Dependencies**

```bash
# Install client dependencies
cd client
pnpm install

# Install server dependencies
cd ../server
npm install
```

3. **Database Setup**

```bash
cd server

# Generate database schema
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push
```

4. **Start Development Environment**

Open two terminal windows:

**Terminal 1 - Backend Server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend Application:**

```bash
cd client
pnpm dev
```

5. **Access Your Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## 8. 📁 Project Structure

```
studyflow/
├── README.md                        # Project documentation
├── client/                          # Frontend Next.js application
│   ├── src/
│   │   ├── app/                     # App Router pages and layouts
│   │   │   ├── (admin)/            # Admin dashboard routes
│   │   │   ├── (application)/      # Main application routes
│   │   │   ├── (auth)/             # Authentication pages
│   │   │   ├── globals.css         # Global styles
│   │   │   └── layout.tsx          # Root layout
│   │   ├── components/             # Reusable React components
│   │   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   │   ├── admin/              # Admin-specific components
│   │   │   ├── charts/             # Data visualization components
│   │   │   ├── chatbot/            # AI chatbot components
│   │   │   ├── games/              # Educational game components
│   │   │   └── header/             # Navigation components
│   │   ├── config/                 # Configuration files
│   │   ├── constants/              # Application constants
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utility functions
│   │   ├── schemas/                # Zod validation schemas
│   │   ├── store/                  # Zustand state management
│   │   └── types/                  # TypeScript type definitions
│   ├── public/                     # Static assets
│   │   └── asset/                  # Images and media files
│   └── package.json                # Frontend dependencies
│
├── server/                         # Backend Express.js application
│   ├── src/
│   │   ├── index.ts               # Server entry point
│   │   ├── config/                # Server configuration
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth-controllers.ts
│   │   │   ├── dashboard-controllers.ts
│   │   │   ├── aibot-controllers.ts
│   │   │   └── ...
│   │   ├── data/                  # Static data and seeds
│   │   ├── db/                    # Database configuration
│   │   │   ├── index.ts          # Database connection
│   │   │   └── schema.ts         # Drizzle schema definitions
│   │   ├── middleware/            # Express middleware
│   │   ├── routes/                # API route definitions
│   │   ├── types/                 # TypeScript types
│   │   └── utils/                 # Helper functions
│   ├── drizzle/                   # Database migrations
│   └── package.json               # Backend dependencies
```

### Development Guidelines

- **Code Style**: Follow TypeScript best practices with strict type checking
- **Commit Convention**: Use conventional commits for clear history
- **Testing**: Write unit tests for critical functionality
- **Documentation**: Keep inline documentation updated
- **Performance**: Optimize for Core Web Vitals and loading speed

## 9. 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the Repository**

   ```bash
   git fork https://github.com/Ajor-Saha/DeltaCoders-Final-Test

   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **Make Changes**
   - Follow our coding standards
   - Add tests for new functionality
   - Update documentation

4. **Submit Pull Request**
   ```bash
   git commit -m "feat: add amazing new feature"
   git push origin feature/amazing-new-feature
   ```

### Contribution Guidelines

- **Bug Reports**: Use GitHub issues with detailed reproduction steps
- **Feature Requests**: Discuss new features in GitHub discussions
- **Code Style**: Follow existing patterns and ESLint rules
- **Testing**: Ensure all tests pass before submitting
- **Documentation**: Update relevant documentation for changes

## 10. 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for complete details.

## 11. 🙏 Acknowledgments

We're grateful to the following technologies and communities:

### Development Tools

- **TypeScript** for type safety and developer experience
- **ESLint** and **Prettier** for code quality
- **GitHub** for version control and collaboration

### Special Thanks

- The open-source community for incredible tools and libraries
- Beta testers and early adopters for valuable feedback
- Educational institutions for inspiring our mission

---

### **🎓 Built with ❤️ for the future of education**

**StudyFlow** - Empowering learners and educators with AI-driven personalized education.
