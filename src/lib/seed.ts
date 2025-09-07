import dbConnect from './mongodb';
import User from '@/models/User';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Equipment from '@/models/Equipment';
import Schedule from '@/models/Schedule';
import ResourceAllocation from '@/models/ResourceAllocation';
import Budget from '@/models/Budget';
import crypto from 'crypto';

// Helper function for password hashing
const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: 1024 }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
};

export async function seedDatabase() {
  try {
    await dbConnect();

    // Clear existing data
    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Equipment.deleteMany({});
    await Schedule.deleteMany({});
    await ResourceAllocation.deleteMany({});
    await Budget.deleteMany({});

    // Create users with secure passwords
    // Generate secure passwords for each user
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    // For demo purposes, admin gets a known password, others get secure random ones
    const adminPassword = await hashPassword('Admin123!@#');
    const userPasswords = await Promise.all([
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
      hashPassword(generateSecurePassword()),
    ]);

    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPasswords[0],
        role: 'project_manager',
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: userPasswords[1],
        role: 'project_manager',
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        password: userPasswords[2],
        role: 'crew_member',
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: userPasswords[3],
        role: 'crew_member',
      },
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        password: userPasswords[4],
        role: 'crew_member',
      },
      {
        name: 'David Lee',
        email: 'david@example.com',
        password: userPasswords[5],
        role: 'crew_member',
      },
      {
        name: 'Emma Garcia',
        email: 'emma@example.com',
        password: userPasswords[6],
        role: 'crew_member',
      },
      {
        name: 'Frank Miller',
        email: 'frank@example.com',
        password: userPasswords[7],
        role: 'project_manager',
      },
      {
        name: 'Grace Taylor',
        email: 'grace@example.com',
        password: userPasswords[8],
        role: 'crew_member',
      },
      {
        name: 'Henry Wilson',
        email: 'henry@example.com',
        password: userPasswords[9],
        role: 'crew_member',
      },
      {
        name: 'Ivy Chen',
        email: 'ivy@example.com',
        password: userPasswords[10],
        role: 'crew_member',
      },
      {
        name: 'Jack Rodriguez',
        email: 'jack@example.com',
        password: userPasswords[11],
        role: 'crew_member',
      },
      {
        name: 'Kelly Martinez',
        email: 'kelly@example.com',
        password: userPasswords[12],
        role: 'crew_member',
      },
      {
        name: 'Liam Anderson',
        email: 'liam@example.com',
        password: userPasswords[13],
        role: 'crew_member',
      },
    ]);

    console.log('🔐 Admin login: admin@example.com / Admin123!@#');
    console.log('🔐 Other users have secure random passwords generated');

    // Create clients
    const clients = await Client.insertMany([
      {
        name: 'Sarah Johnson',
        email: 'sarah@wedding.com',
        phone: '+1-555-0123',
        company: 'Johnson Wedding Planning',
        address: '123 Main St, City, State 12345',
      },
      {
        name: 'TechCorp Inc.',
        email: 'contact@techcorp.com',
        phone: '+1-555-0456',
        company: 'TechCorp Inc.',
        address: '456 Business Ave, City, State 12346',
      },
      {
        name: 'GadgetWorld',
        email: 'info@gadgetworld.com',
        phone: '+1-555-0789',
        company: 'GadgetWorld LLC',
        address: '789 Innovation Blvd, City, State 12347',
      },
      {
        name: 'Maria Rodriguez',
        email: 'maria@corporateevents.com',
        phone: '+1-555-1012',
        company: 'Corporate Events Pro',
        address: '321 Event Plaza, City, State 12348',
      },
      {
        name: 'Robert Kim',
        email: 'robert@startup.io',
        phone: '+1-555-1314',
        company: 'Startup Innovations',
        address: '654 Tech Hub, City, State 12349',
      },
      {
        name: 'Lisa Thompson',
        email: 'lisa@familyvideos.com',
        phone: '+1-555-1516',
        company: 'Family Video Memories',
        address: '987 Memory Lane, City, State 12350',
      },
      {
        name: 'Global Marketing Solutions',
        email: 'info@globalmarketing.com',
        phone: '+1-555-1718',
        company: 'Global Marketing Solutions',
        address: '147 Marketing St, City, State 12351',
      },
      {
        name: 'David Park',
        email: 'david@restaurantgroup.com',
        phone: '+1-555-1920',
        company: 'Restaurant Group LLC',
        address: '258 Culinary Ave, City, State 12352',
      },
      {
        name: 'Jennifer White',
        email: 'jennifer@fitnessbrand.com',
        phone: '+1-555-2122',
        company: 'Fitness Brand Co',
        address: '369 Wellness Blvd, City, State 12353',
      },
      {
        name: 'Michael Brown',
        email: 'michael@constructionco.com',
        phone: '+1-555-2324',
        company: 'Construction Co Inc',
        address: '741 Builder St, City, State 12354',
      },
      {
        name: 'Anna Lee',
        email: 'anna@travelagency.com',
        phone: '+1-555-2526',
        company: 'Adventure Travel Agency',
        address: '852 Explorer Rd, City, State 12355',
      },
      {
        name: 'Peter Johnson',
        email: 'peter@musicstudio.com',
        phone: '+1-555-2728',
        company: 'Music Studio Productions',
        address: '963 Harmony Ave, City, State 12356',
      },
    ]);

    // Create equipment
    const equipment = await Equipment.insertMany([
      {
        name: 'Sony A7S III Camera',
        type: 'Camera',
        availability: true,
        location: 'Studio A',
      },
      {
        name: 'DJI Ronin Gimbal',
        type: 'Stabilizer',
        availability: true,
        location: 'Equipment Room',
      },
      {
        name: 'Sennheiser MKH 416',
        type: 'Microphone',
        availability: true,
        location: 'Audio Booth',
      },
      {
        name: 'LED Panel Light Kit',
        type: 'Lighting',
        availability: true,
        location: 'Lighting Storage',
      },
      {
        name: 'MacBook Pro M3',
        type: 'Computer',
        availability: true,
        location: 'Edit Bay 1',
      },
      {
        name: 'Canon EOS R5 Camera',
        type: 'Camera',
        availability: true,
        location: 'Studio B',
      },
      {
        name: 'Zoom H6 Recorder',
        type: 'Audio Recorder',
        availability: true,
        location: 'Audio Booth',
      },
      {
        name: 'Arri Skypanel S60',
        type: 'Lighting',
        availability: false,
        location: 'Lighting Storage',
      },
      {
        name: 'Blackmagic ATEM Mini',
        type: 'Switcher',
        availability: true,
        location: 'Control Room',
      },
      {
        name: 'Rode NTG3 Microphone',
        type: 'Microphone',
        availability: true,
        location: 'Audio Booth',
      },
      {
        name: 'DJI Mavic 3 Drone',
        type: 'Drone',
        availability: true,
        location: 'Drone Station',
      },
      {
        name: 'Adobe Creative Suite License',
        type: 'Software',
        availability: true,
        location: 'Digital Assets',
      },
      {
        name: '4K Monitor (27")',
        type: 'Monitor',
        availability: true,
        location: 'Edit Bay 2',
      },
      {
        name: 'Green Screen Kit',
        type: 'Props',
        availability: true,
        location: 'Props Storage',
      },
      {
        name: 'Tripod Set (Professional)',
        type: 'Support',
        availability: true,
        location: 'Equipment Room',
      },
    ]);

    // Create projects
    const projects = await Project.insertMany([
      {
        name: 'Johnson Wedding Video',
        description: 'Full wedding ceremony and reception video production',
        clientId: clients[0]._id,
        projectManagerId: users[1]._id,
        status: 'active',
        budget: 15000,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-11-15'),
        progress: 65,
      },
      {
        name: 'TechCorp Training Video',
        description: 'Corporate training video series for new employees',
        clientId: clients[1]._id,
        projectManagerId: users[2]._id,
        status: 'active',
        budget: 25000,
        startDate: new Date('2024-09-15'),
        endDate: new Date('2024-12-01'),
        progress: 40,
      },
      {
        name: 'GadgetWorld Product Demo',
        description: 'Product demonstration video for new smartwatch',
        clientId: clients[2]._id,
        projectManagerId: users[1]._id,
        status: 'planning',
        budget: 8000,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-30'),
        progress: 10,
      },
      {
        name: 'Corporate Events Conference',
        description: 'Live streaming and recording of annual corporate conference',
        clientId: clients[3]._id,
        projectManagerId: users[8]._id,
        status: 'active',
        budget: 35000,
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-12-15'),
        progress: 25,
      },
      {
        name: 'Startup Product Launch',
        description: 'Product launch event video and social media content',
        clientId: clients[4]._id,
        projectManagerId: users[2]._id,
        status: 'planning',
        budget: 12000,
        startDate: new Date('2024-11-10'),
        endDate: new Date('2024-12-10'),
        progress: 5,
      },
      {
        name: 'Family Reunion Documentary',
        description: 'Documentary style video for family reunion event',
        clientId: clients[5]._id,
        projectManagerId: users[1]._id,
        status: 'active',
        budget: 8500,
        startDate: new Date('2024-09-20'),
        endDate: new Date('2024-10-20'),
        progress: 80,
      },
      {
        name: 'Marketing Campaign Videos',
        description: 'Series of promotional videos for marketing campaign',
        clientId: clients[6]._id,
        projectManagerId: users[8]._id,
        status: 'active',
        budget: 28000,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-11-01'),
        progress: 70,
      },
      {
        name: 'Restaurant Opening Event',
        description: 'Opening ceremony and promotional video for new restaurant',
        clientId: clients[7]._id,
        projectManagerId: users[2]._id,
        status: 'completed',
        budget: 6500,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-08-01'),
        progress: 100,
      },
      {
        name: 'Fitness Brand Workout Series',
        description: 'Fitness workout video series for online platform',
        clientId: clients[8]._id,
        projectManagerId: users[1]._id,
        status: 'active',
        budget: 18000,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-01'),
        progress: 45,
      },
      {
        name: 'Construction Time-lapse',
        description: 'Time-lapse video of construction project',
        clientId: clients[9]._id,
        projectManagerId: users[8]._id,
        status: 'planning',
        budget: 9500,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-03-01'),
        progress: 0,
      },
      {
        name: 'Travel Destination Promo',
        description: 'Promotional video for travel destination',
        clientId: clients[10]._id,
        projectManagerId: users[2]._id,
        status: 'active',
        budget: 22000,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-11-30'),
        progress: 30,
      },
      {
        name: 'Music Video Production',
        description: 'Music video for indie artist',
        clientId: clients[11]._id,
        projectManagerId: users[1]._id,
        status: 'active',
        budget: 15000,
        startDate: new Date('2024-09-10'),
        endDate: new Date('2024-11-10'),
        progress: 55,
      },
    ]);

    // Create tasks for first project
    await Task.insertMany([
      {
        projectId: projects[0]._id,
        title: 'Pre-wedding consultation',
        description: 'Meet with couple to discuss video preferences and timeline',
        assignedTo: users[1]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-09-20'),
        estimatedHours: 4,
        actualHours: 3,
      },
      {
        projectId: projects[0]._id,
        title: 'Equipment setup for ceremony',
        description: 'Set up cameras and lighting for wedding ceremony',
        assignedTo: users[3]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-10-05'),
        estimatedHours: 6,
        actualHours: 5,
      },
      {
        projectId: projects[0]._id,
        title: 'Ceremony filming',
        description: 'Film the wedding ceremony',
        assignedTo: users[4]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-10-05'),
        estimatedHours: 8,
        actualHours: 7,
      },
      {
        projectId: projects[0]._id,
        title: 'Reception filming',
        description: 'Film reception speeches and dancing',
        assignedTo: users[4]._id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-10-05'),
        estimatedHours: 6,
        actualHours: 2,
      },
      {
        projectId: projects[0]._id,
        title: 'Raw footage review',
        description: 'Review and organize all raw footage',
        assignedTo: users[5]._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2024-10-10'),
        estimatedHours: 12,
        actualHours: 0,
      },
      {
        projectId: projects[0]._id,
        title: 'Video editing',
        description: 'Edit ceremony and reception footage into final video',
        assignedTo: users[5]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-11-01'),
        estimatedHours: 40,
        actualHours: 0,
      },
    ]);

    // Create tasks for second project
    await Task.insertMany([
      {
        projectId: projects[1]._id,
        title: 'Script writing',
        description: 'Write scripts for training video series',
        assignedTo: users[2]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-09-25'),
        estimatedHours: 16,
        actualHours: 14,
      },
      {
        projectId: projects[1]._id,
        title: 'Storyboard creation',
        description: 'Create storyboards for each training module',
        assignedTo: users[2]._id,
        status: 'completed',
        priority: 'medium',
        dueDate: new Date('2024-10-01'),
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        projectId: projects[1]._id,
        title: 'Studio setup',
        description: 'Set up filming studio for training videos',
        assignedTo: users[3]._id,
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date('2024-10-15'),
        estimatedHours: 4,
        actualHours: 1,
      },
      {
        projectId: projects[1]._id,
        title: 'Filming sessions',
        description: 'Film all training video modules',
        assignedTo: users[4]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-11-15'),
        estimatedHours: 32,
        actualHours: 0,
      },
    ]);

    // Create tasks for third project
    await Task.insertMany([
      {
        projectId: projects[2]._id,
        title: 'Product research',
        description: 'Research and understand product features',
        assignedTo: users[1]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-10-15'),
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        projectId: projects[2]._id,
        title: 'Demo script writing',
        description: 'Write demonstration script for product',
        assignedTo: users[1]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-10-20'),
        estimatedHours: 6,
        actualHours: 5,
      },
      {
        projectId: projects[2]._id,
        title: 'Filming setup',
        description: 'Set up equipment for product demonstration',
        assignedTo: users[6]._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2024-11-05'),
        estimatedHours: 4,
        actualHours: 0,
      },
      {
        projectId: projects[2]._id,
        title: 'Product demo filming',
        description: 'Film product demonstration video',
        assignedTo: users[7]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-11-15'),
        estimatedHours: 12,
        actualHours: 0,
      },
      {
        projectId: projects[2]._id,
        title: 'Post-production editing',
        description: 'Edit and finalize product demo video',
        assignedTo: users[9]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-11-25'),
        estimatedHours: 16,
        actualHours: 0,
      },
    ]);

    // Create tasks for fourth project (Corporate Events Conference)
    await Task.insertMany([
      {
        projectId: projects[3]._id,
        title: 'Venue scouting',
        description: 'Visit and evaluate conference venue',
        assignedTo: users[8]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-09-30'),
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        projectId: projects[3]._id,
        title: 'Technical requirements assessment',
        description: 'Assess streaming and recording technical needs',
        assignedTo: users[8]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-10-05'),
        estimatedHours: 12,
        actualHours: 10,
      },
      {
        projectId: projects[3]._id,
        title: 'Equipment deployment',
        description: 'Set up streaming and recording equipment',
        assignedTo: users[10]._id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-10-20'),
        estimatedHours: 16,
        actualHours: 4,
      },
      {
        projectId: projects[3]._id,
        title: 'Live streaming setup',
        description: 'Configure live streaming platform',
        assignedTo: users[11]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-10-25'),
        estimatedHours: 8,
        actualHours: 0,
      },
      {
        projectId: projects[3]._id,
        title: 'Conference recording',
        description: 'Record all conference sessions',
        assignedTo: users[12]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-11-01'),
        estimatedHours: 24,
        actualHours: 0,
      },
      {
        projectId: projects[3]._id,
        title: 'Post-event editing',
        description: 'Edit conference highlights and full recordings',
        assignedTo: users[13]._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2024-12-01'),
        estimatedHours: 40,
        actualHours: 0,
      },
    ]);

    // Create tasks for fifth project (Startup Product Launch)
    await Task.insertMany([
      {
        projectId: projects[4]._id,
        title: 'Brand research',
        description: 'Research startup brand and target audience',
        assignedTo: users[2]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-10-20'),
        estimatedHours: 6,
        actualHours: 5,
      },
      {
        projectId: projects[4]._id,
        title: 'Content strategy',
        description: 'Develop content strategy for launch',
        assignedTo: users[2]._id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-10-30'),
        estimatedHours: 8,
        actualHours: 3,
      },
      {
        projectId: projects[4]._id,
        title: 'Social media content creation',
        description: 'Create social media posts and videos',
        assignedTo: users[14]._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2024-11-20'),
        estimatedHours: 20,
        actualHours: 0,
      },
      {
        projectId: projects[4]._id,
        title: 'Launch event coverage',
        description: 'Film and stream product launch event',
        assignedTo: users[6]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-12-01'),
        estimatedHours: 16,
        actualHours: 0,
      },
    ]);

    // Create tasks for sixth project (Family Reunion Documentary)
    await Task.insertMany([
      {
        projectId: projects[5]._id,
        title: 'Family interviews',
        description: 'Conduct interviews with family members',
        assignedTo: users[1]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-09-25'),
        estimatedHours: 12,
        actualHours: 10,
      },
      {
        projectId: projects[5]._id,
        title: 'Event documentation',
        description: 'Document reunion activities and moments',
        assignedTo: users[7]._id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-09-30'),
        estimatedHours: 16,
        actualHours: 14,
      },
      {
        projectId: projects[5]._id,
        title: 'Photo integration',
        description: 'Incorporate family photos into documentary',
        assignedTo: users[9]._id,
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date('2024-10-10'),
        estimatedHours: 8,
        actualHours: 2,
      },
      {
        projectId: projects[5]._id,
        title: 'Final editing',
        description: 'Edit documentary with music and transitions',
        assignedTo: users[9]._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2024-10-15'),
        estimatedHours: 24,
        actualHours: 0,
      },
    ]);

    // Create schedules
    const schedules = await Schedule.insertMany([
      {
        projectId: projects[0]._id,
        title: 'Wedding Ceremony',
        startDate: new Date('2024-10-05T15:00:00'),
        endDate: new Date('2024-10-05T17:00:00'),
        location: 'St. Mary\'s Cathedral',
        assignedResources: [users[3]._id, users[4]._id],
      },
      {
        projectId: projects[0]._id,
        title: 'Wedding Reception',
        startDate: new Date('2024-10-05T18:00:00'),
        endDate: new Date('2024-10-05T23:00:00'),
        location: 'Grand Ballroom Hotel',
        assignedResources: [users[4]._id, users[5]._id],
      },
      {
        projectId: projects[1]._id,
        title: 'Training Video Filming',
        startDate: new Date('2024-10-20T09:00:00'),
        endDate: new Date('2024-10-25T17:00:00'),
        location: 'Studio B',
        assignedResources: [users[3]._id, users[4]._id],
      },
    ]);

    // Create resource allocations
    await ResourceAllocation.insertMany([
      {
        projectId: projects[0]._id,
        scheduleId: schedules[0]._id,
        equipmentId: equipment[0]._id, // Sony A7S III Camera
        allocatedFrom: new Date('2024-10-05T14:00:00'),
        allocatedTo: new Date('2024-10-05T18:00:00'),
        notes: 'Camera for wedding ceremony and reception',
      },
      {
        projectId: projects[0]._id,
        scheduleId: schedules[0]._id,
        equipmentId: equipment[1]._id, // DJI Ronin Gimbal
        allocatedFrom: new Date('2024-10-05T14:00:00'),
        allocatedTo: new Date('2024-10-05T18:00:00'),
        notes: 'Gimbal stabilizer for smooth footage',
      },
      {
        projectId: projects[0]._id,
        scheduleId: schedules[0]._id,
        userId: users[3]._id, // Alice Brown
        allocatedFrom: new Date('2024-10-05T14:00:00'),
        allocatedTo: new Date('2024-10-05T18:00:00'),
        notes: 'Camera operator for ceremony',
      },
      {
        projectId: projects[0]._id,
        scheduleId: schedules[1]._id,
        userId: users[4]._id, // Bob Wilson
        allocatedFrom: new Date('2024-10-05T17:00:00'),
        allocatedTo: new Date('2024-10-05T23:00:00'),
        notes: 'Camera operator for reception',
      },
      {
        projectId: projects[1]._id,
        scheduleId: schedules[2]._id,
        equipmentId: equipment[2]._id, // Sennheiser MKH 416
        allocatedFrom: new Date('2024-10-20T09:00:00'),
        allocatedTo: new Date('2024-10-25T17:00:00'),
        notes: 'Microphone for training video narration',
      },
      {
        projectId: projects[1]._id,
        scheduleId: schedules[2]._id,
        userId: users[3]._id, // Alice Brown
        allocatedFrom: new Date('2024-10-20T09:00:00'),
        allocatedTo: new Date('2024-10-25T17:00:00'),
        notes: 'Audio technician for training videos',
      },
      {
        projectId: projects[1]._id,
        scheduleId: schedules[2]._id,
        userId: users[4]._id, // Bob Wilson
        allocatedFrom: new Date('2024-10-20T09:00:00'),
        allocatedTo: new Date('2024-10-25T17:00:00'),
        notes: 'Video production assistant',
      },
      ]);
  
      // Create budget items
      await Budget.insertMany([
        {
          projectId: projects[0]._id,
          category: 'equipment',
          plannedAmount: 8000,
          actualAmount: 7500,
          description: 'Camera, lighting, and audio equipment rental',
        },
        {
          projectId: projects[0]._id,
          category: 'personnel',
          plannedAmount: 6000,
          actualAmount: 5800,
          description: 'Camera operators and crew wages',
        },
        {
          projectId: projects[0]._id,
          category: 'location',
          plannedAmount: 2000,
          actualAmount: 2200,
          description: 'Venue rental and permits',
        },
        {
          projectId: projects[0]._id,
          category: 'post-production',
          plannedAmount: 4000,
          actualAmount: 0,
          description: 'Video editing and post-production',
        },
        {
          projectId: projects[1]._id,
          category: 'equipment',
          plannedAmount: 5000,
          actualAmount: 4800,
          description: 'Professional video equipment and software',
        },
        {
          projectId: projects[1]._id,
          category: 'personnel',
          plannedAmount: 8000,
          actualAmount: 7500,
          description: 'Training video production team',
        },
        {
          projectId: projects[1]._id,
          category: 'post-production',
          plannedAmount: 3000,
          actualAmount: 0,
          description: 'Video editing and graphics',
        },
        {
          projectId: projects[2]._id,
          category: 'equipment',
          plannedAmount: 3000,
          actualAmount: 0,
          description: 'Camera and lighting equipment',
        },
        {
          projectId: projects[2]._id,
          category: 'marketing',
          plannedAmount: 2000,
          actualAmount: 0,
          description: 'Product launch marketing materials',
        },
      ]);

    console.log('Database seeded successfully!');
    return { success: true, message: 'Database seeded with dummy data' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, message: 'Error seeding database' };
  }
}