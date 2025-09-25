# StudyFlow - AI-Powered Educational Learning Platform

A comprehensive educational platform that combines AI-powered content generation, interactive learning, and progress tracking to deliver personalized learning experiences.

## 🚀 Features

### Core Features

- **AI-Powered Content Generation**: Dynamic lesson content and quiz generation using advanced AI
- **Interactive Learning Modules**: Comprehensive lessons, quizzes, and short questions
- **Progress Tracking**: Real-time tracking of topic completion and learning progress
- **Subject Management**: Organized learning paths with topic-based structure
- **Quiz System**: Adaptive quizzes with instant feedback
- **AI Helper**: Contextual assistance and explanations using AI

### Learning Features

- **Adaptive Quizzes**: AI-generated quizzes tailored to topic difficulty
- **Lesson Content**: Interactive lessons with markdown support
- **Short Questions**: Quick assessment tools
- **Resources Management**: Organized learning materials
- **Weakness Analysis**: Identify and focus on challenging topics
- **Games Integration**: Gamified learning experiences

### Technical Features

- **JWT Authentication**: Secure user authentication and authorization
- **Real-time Updates**: Live progress updates and content synchronization
- **Caching System**: Optimized content delivery and performance
- **File Upload**: Support for various educational materials
- **Email Integration**: Notifications and communication system

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.2.2 with React 19
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React, React Icons
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: Quill editor, React Markdown
- **Charts**: Recharts for data visualization

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI Integration**: Google GenAI, OpenAI, Langchain
- **Vector Database**: Pinecone for AI embeddings
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3
- **Email**: Nodemailer
- **Real-time**: Socket.IO

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- AWS S3 bucket (for file storage)
- OpenAI API key
- Google GenAI API key
- Pinecone account

### Environment Variables

#### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=EduLearn
```

#### Server (.env)

```env
# Database
DATABASE_URL=your_neon_database_url
DB_HOST=your_db_host
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
GOOGLE_GENAI_API_KEY=your_google_genai_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# App
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd DeltaCoders-Final-Test
```

1. **Install dependencies**

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

1. **Database Setup**

```bash
cd server

# Generate database schema
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open database studio
npm run db:studio
```

1. **Start Development Servers**

Terminal 1 - Backend:

```bash
cd server
npm run dev
```

Terminal 2 - Frontend:

```bash
cd client
npm run dev
```

1. **Access the Application**

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database Studio: http://localhost:4983 (if running)

## 📁 Project Structure

```fs
DeltaCoders-Final-Test/
├── client/                          # Frontend Next.js application
│   ├── src/
│   │   ├── app/                     # App router pages
│   │   │   ├── (admin)/            # Admin dashboard routes
│   │   │   ├── (application)/      # Public application routes
│   │   │   └── (auth)/             # Authentication routes
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                # Base UI components (shadcn)
│   │   │   └── custom/            # Custom components
│   │   ├── lib/                   # Utilities and configurations
│   │   └── styles/                # Global styles
│   ├── public/                    # Static assets
│   └── package.json
│
├── server/                        # Backend Express.js application
│   ├── src/
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Express middleware
│   │   ├── routes/              # API routes
│   │   ├── db/                  # Database configuration
│   │   ├── utils/               # Helper functions
│   │   └── index.ts            # Server entry point
│   └── package.json
│
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Subjects

- `GET /api/subject/all` - Get all subjects
- `GET /api/subject/:subjectId` - Get subject by ID
- `GET /api/subject/progress/:subjectId` - Get subject progress
- `POST /api/subject/add-subject` - Add user subject
- `DELETE /api/subject/remove/:userSubjectId` - Remove user subject

### Content Generation

- `POST /api/content/generate-lesson` - Generate AI lesson content
- `POST /api/quiz/generate` - Generate AI quiz
- `GET /api/quiz/load/:topicId` - Load existing quiz

### Progress Tracking

- `GET /api/progress/user` - Get user progress
- `POST /api/progress/update` - Update progress

## 🎯 Usage

### For Students

1. **Register/Login** to access the platform
2. **Browse Subjects** and add them to your learning path
3. **Explore Topics** within each subject
4. **Study Lessons** with AI-generated content
5. **Take Quizzes** to test your knowledge
6. **Track Progress** and identify weak areas
7. **Access Resources** for additional learning materials

### For Educators

1. **Generate Content** using AI-powered tools
2. **Create Quizzes** tailored to specific topics
3. **Monitor Progress** of learners
4. **Analyze Weaknesses** to provide targeted support
5. **Manage Resources** and learning materials

## 🧪 Development

### Available Scripts

#### Client

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

#### Server

```bash
npm run dev        # Start development server with watch mode
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run db:generate # Generate database schema
npm run db:migrate  # Run database migrations
npm run db:studio   # Open database studio
npm run db:push     # Push schema changes
```

### Code Style

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting (recommended)
- **Conventional Commits** for commit messages

## 🚀 Deployment

### Frontend (Vercel - Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Heroku)

1. Create a new application
2. Set environment variables
3. Connect to your database
4. Deploy using Git or Docker

### Database (Neon)

1. Create a Neon project
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npm run db:migrate`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT integration
- **Google** for GenAI services
- **Vercel** for Next.js framework
- **Neon** for PostgreSQL database
- **shadcn/ui** for beautiful UI components
- **Radix UI** for accessible primitives

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check documentation and API references

---

### **Built with ❤️ for the future of education**
