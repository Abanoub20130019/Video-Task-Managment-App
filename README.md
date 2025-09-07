# Video Task Management System

A comprehensive task management system designed specifically for video shooting projects, built with Next.js 15, TypeScript, and MongoDB.

## 🚀 Features

### ✅ Core Functionality
- **User Authentication**: Secure login/signup with role-based permissions (Admin, Project Manager, Crew Member)
- **Project Management**: Create, edit, delete, and track video projects with budgets and timelines
- **Task Management**: Kanban board with drag-and-drop task management, priority levels, and due dates
- **Calendar Integration**: Visual calendar for scheduling shoots and managing resources
- **Resource Allocation**: Equipment and personnel management with availability tracking
- **Budget Tracking**: Cost management with budget vs actual comparisons across categories
- **Real-time Collaboration**: Comments and file sharing for team communication
- **Automated Notifications**: Smart alerts for due dates, overdue tasks, and project updates

### 🎨 Advanced Features
- **Visual Dashboards**: Gantt charts for project timelines and progress visualization
- **Client Portal**: Dedicated portal for clients to view progress and approve deliverables
- **External Integrations**: Google Calendar, Slack, and Trello integration capabilities
- **Reporting & Analytics**: Comprehensive metrics, trends, and project insights
- **Search & Filtering**: Advanced search and filter capabilities across all data
- **Mobile Responsive**: Fully responsive design for all device sizes
- **Security Features**: Rate limiting, input validation, and secure API endpoints

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS with responsive design
- **Database**: MongoDB Atlas (or local MongoDB)
- **Deployment**: Optimized for Vercel deployment

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🚀 Quick Start

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd video-task-manager
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3001
   MONGODB_URI=mongodb://localhost:27017/video-task-manager
   ```

3. **Start MongoDB** (if using local):
   ```bash
   mongod
   ```

4. **Run the Application**:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   - Open [http://localhost:3001](http://localhost:3001)
   - Sign up for a new account or use seeded admin: `admin@example.com` / `password123`

6. **Populate Sample Data**:
   - Login as admin
   - Go to Dashboard and click "Seed Database"
   - This creates sample projects, tasks, users, and equipment

## 🎯 User Guide

### For Production Teams
1. **Dashboard**: Overview of all projects, tasks, and notifications
2. **Projects**: Create and manage video production projects
3. **Tasks**: Use Kanban board to track task progress
4. **Calendar**: Schedule shoots and view resource availability
5. **Resources**: Allocate equipment and personnel to projects
6. **Budget**: Track costs and manage project budgets
7. **Reports**: View analytics and project performance metrics

### For Clients
1. **Client Portal**: Access via `/client/[projectId]`
2. **Project Overview**: View project progress and timeline
3. **Task Tracking**: See completed and pending tasks
4. **Approvals**: Approve completed work and deliverables
5. **Communication**: Contact production team directly

### For Administrators
1. **User Management**: Manage team members and permissions
2. **Equipment Management**: Track and maintain production equipment
3. **Integrations**: Configure external tool connections
4. **System Monitoring**: View system health and usage metrics

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get current session

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `GET /api/tasks` - List tasks (with optional project filter)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Resources & Equipment
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Add new equipment
- `GET /api/allocations` - List resource allocations
- `POST /api/allocations` - Create resource allocation

### Budget & Finance
- `GET /api/budgets` - List budget items
- `POST /api/budgets` - Create budget item

### Communication
- `GET /api/comments` - List comments
- `POST /api/comments` - Create comment
- `GET /api/notifications` - Get user notifications

### Scheduling
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule

## 🔒 Security Features

- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: Comprehensive validation for all user inputs
- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control
- **Security Headers**: XSS protection, CSRF prevention, content security policy
- **Data Sanitization**: Input sanitization to prevent injection attacks

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with multi-column layouts
- **Tablet**: Adapted layouts with touch-friendly controls
- **Mobile**: Single-column layouts with collapsible navigation

## 🔗 External Integrations

### Google Calendar
- Sync project schedules with Google Calendar
- Create calendar events for shoots and deadlines
- Two-way synchronization capabilities

### Slack
- Send project updates and notifications
- Task assignment alerts
- Team communication integration

### Trello
- Sync tasks with Trello boards
- Create cards for new tasks
- Update task status across platforms

## 📊 Reporting & Analytics

- **Project Metrics**: Completion rates, budget tracking, timeline analysis
- **Team Performance**: Task completion, productivity metrics
- **Financial Reports**: Budget vs actual, cost analysis
- **Timeline Visualization**: Gantt charts and progress tracking
- **Custom Dashboards**: Configurable analytics views

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy (nginx) for production

## 🧪 Testing

### End-to-End Testing Checklist
- [ ] User registration and login
- [ ] Project creation and management
- [ ] Task creation and Kanban board functionality
- [ ] Calendar scheduling and event management
- [ ] Resource allocation and equipment tracking
- [ ] Budget creation and cost tracking
- [ ] Comment system and file uploads
- [ ] Notification system
- [ ] Client portal functionality
- [ ] External integrations (test mode)
- [ ] Mobile responsiveness across devices
- [ ] Search and filtering functionality
- [ ] Admin features and user management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Contact the development team

---

**Built with ❤️ for video production teams worldwide**