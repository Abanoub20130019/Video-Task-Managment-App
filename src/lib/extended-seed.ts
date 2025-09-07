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

export async function extendedSeedDatabase() {
  try {
    console.log('Starting extended database seeding...');
    await dbConnect();
    console.log('Database connected successfully');

    // Get existing data counts
    const existingUsers = await User.countDocuments();
    const existingClients = await Client.countDocuments();
    const existingProjects = await Project.countDocuments();

    console.log(`Found ${existingUsers} users, ${existingClients} clients, ${existingProjects} projects`);

    // Add more users if needed
    if (existingUsers < 50) {
      // Generate secure passwords for each additional user
      const generateSecurePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      // Generate secure passwords for all additional users
      const securePasswords = await Promise.all([
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

      const additionalUsers = [
        {
          name: 'Sarah Mitchell',
          email: 'sarah.mitchell@example.com',
          password: securePasswords[0],
          role: 'project_manager',
        },
        {
          name: 'David Chen',
          email: 'david.chen@example.com',
          password: securePasswords[1],
          role: 'crew_member',
        },
        {
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@example.com',
          password: securePasswords[2],
          role: 'crew_member',
        },
        {
          name: 'Michael Thompson',
          email: 'michael.thompson@example.com',
          password: securePasswords[3],
          role: 'crew_member',
        },
        {
          name: 'Jessica Park',
          email: 'jessica.park@example.com',
          password: securePasswords[4],
          role: 'crew_member',
        },
        {
          name: 'Christopher Lee',
          email: 'christopher.lee@example.com',
          password: securePasswords[5],
          role: 'project_manager',
        },
        {
          name: 'Amanda White',
          email: 'amanda.white@example.com',
          password: securePasswords[6],
          role: 'crew_member',
        },
        {
          name: 'Daniel Kim',
          email: 'daniel.kim@example.com',
          password: securePasswords[7],
          role: 'crew_member',
        },
        {
          name: 'Rachel Green',
          email: 'rachel.green@example.com',
          password: securePasswords[8],
          role: 'crew_member',
        },
        {
          name: 'Kevin Brown',
          email: 'kevin.brown@example.com',
          password: securePasswords[9],
          role: 'crew_member',
        },
      ];

      console.log('🔐 Extended seed users will have secure random passwords generated');

      // Check for existing emails and filter out duplicates
      const existingEmails = await User.find({ email: { $in: additionalUsers.map(u => u.email) } }).select('email');
      const existingEmailSet = new Set(existingEmails.map(u => u.email));

      const usersToAdd = additionalUsers.filter(user => !existingEmailSet.has(user.email));

      if (usersToAdd.length > 0) {
        const userResult = await User.insertMany(usersToAdd);
        console.log(`✅ Added ${userResult.length} additional users`);
      } else {
        console.log('ℹ️ All additional users already exist, skipping user creation');
      }
    }

    // Add more clients
    if (existingClients < 20) {
      const additionalClients = [
        {
          name: 'Urban Development Corp',
          email: 'info@urbandevelopment.com',
          phone: '+1-555-3000',
          company: 'Urban Development Corporation',
          address: '555 Development Blvd, City, State 12360',
        },
        {
          name: 'Green Energy Solutions',
          email: 'contact@greenenergy.com',
          phone: '+1-555-3100',
          company: 'Green Energy Solutions LLC',
          address: '666 Renewable St, City, State 12361',
        },
        {
          name: 'Digital Marketing Pro',
          email: 'hello@digitalmarketingpro.com',
          phone: '+1-555-3200',
          company: 'Digital Marketing Pro',
          address: '777 Marketing Ave, City, State 12362',
        },
        {
          name: 'Luxury Real Estate',
          email: 'inquiry@luxuryrealestate.com',
          phone: '+1-555-3300',
          company: 'Luxury Real Estate Group',
          address: '888 Property Lane, City, State 12363',
        },
        {
          name: 'Tech Startup Hub',
          email: 'team@techstartuphub.com',
          phone: '+1-555-3400',
          company: 'Tech Startup Hub Inc',
          address: '999 Innovation Dr, City, State 12364',
        },
      ];

      // Check for existing client emails and filter out duplicates
      const existingClientEmails = await Client.find({ email: { $in: additionalClients.map(c => c.email) } }).select('email');
      const existingClientEmailSet = new Set(existingClientEmails.map(c => c.email));

      const clientsToAdd = additionalClients.filter(client => !existingClientEmailSet.has(client.email));

      if (clientsToAdd.length > 0) {
        const clientResult = await Client.insertMany(clientsToAdd);
        console.log(`✅ Added ${clientResult.length} additional clients`);
      } else {
        console.log('ℹ️ All additional clients already exist, skipping client creation');
      }
    }

    // Add more equipment
    if (await Equipment.countDocuments() < 30) {
      const additionalEquipment = [
        {
          name: 'Panasonic GH5 Camera',
          type: 'Camera',
          availability: true,
          location: 'Studio C',
        },
        {
          name: 'RED DSMC2 Camera',
          type: 'Camera',
          availability: false,
          location: 'Studio A',
        },
        {
          name: 'Blackmagic Pocket Cinema',
          type: 'Camera',
          availability: true,
          location: 'Mobile Unit',
        },
        {
          name: 'ARRI Alexa Mini',
          type: 'Camera',
          availability: true,
          location: 'Studio B',
        },
        {
          name: 'GoPro HERO 9',
          type: 'Action Camera',
          availability: true,
          location: 'Equipment Room',
        },
        {
          name: 'Zhiyun Crane 3 Gimbal',
          type: 'Stabilizer',
          availability: true,
          location: 'Equipment Room',
        },
        {
          name: 'Sachtler Flowtech Tripod',
          type: 'Support',
          availability: true,
          location: 'Equipment Room',
        },
        {
          name: 'Rode VideoMicro',
          type: 'Microphone',
          availability: true,
          location: 'Audio Booth',
        },
        {
          name: 'Audio-Technica AT2020',
          type: 'Microphone',
          availability: true,
          location: 'Audio Booth',
        },
        {
          name: 'Zoom H8 Recorder',
          type: 'Audio Recorder',
          availability: true,
          location: 'Audio Booth',
        },
      ];

      // Check for existing equipment names and filter out duplicates
      const existingEquipmentNames = await Equipment.find({ name: { $in: additionalEquipment.map(e => e.name) } }).select('name');
      const existingEquipmentNameSet = new Set(existingEquipmentNames.map(e => e.name));

      const equipmentToAdd = additionalEquipment.filter(equipment => !existingEquipmentNameSet.has(equipment.name));

      if (equipmentToAdd.length > 0) {
        const equipmentResult = await Equipment.insertMany(equipmentToAdd);
        console.log(`✅ Added ${equipmentResult.length} additional equipment items`);
      } else {
        console.log('ℹ️ All additional equipment already exists, skipping equipment creation');
      }
    }

    // Add more projects
    if (existingProjects < 20) {
      // Get all users and clients for reference
      const allUsers = await User.find();
      const allClients = await Client.find();

      // Ensure we have enough users and clients
      if (allUsers.length === 0 || allClients.length === 0) {
        console.log('Not enough users or clients to create projects. Skipping project creation.');
      } else {
        // Find project managers safely
        const projectManagers = allUsers.filter(u => u.role === 'project_manager');
        const defaultProjectManager = projectManagers.length > 0 ? projectManagers[0]._id : allUsers[0]._id;

        // Create projects with safe client/user references
        const additionalProjects = [
          {
            name: 'Corporate Wellness Campaign',
            description: 'Video series for employee wellness program',
            clientId: allClients[Math.min(allClients.length - 1, 0)]._id,
            projectManagerId: defaultProjectManager,
            status: 'active',
            budget: 35000,
            startDate: new Date('2024-11-01'),
            endDate: new Date('2024-12-15'),
            progress: 20,
          },
          {
            name: 'Product Launch Event',
            description: 'Live streaming and recording of tech product launch',
            clientId: allClients[Math.min(allClients.length - 1, 0)]._id,
            projectManagerId: projectManagers.length > 1 ? projectManagers[1]._id : defaultProjectManager,
            status: 'planning',
            budget: 45000,
            startDate: new Date('2024-12-01'),
            endDate: new Date('2025-01-15'),
            progress: 5,
          },
          {
            name: 'Educational Content Series',
            description: 'Online course video content for e-learning platform',
            clientId: allClients[Math.min(allClients.length - 1, 0)]._id,
            projectManagerId: defaultProjectManager,
            status: 'active',
            budget: 28000,
            startDate: new Date('2024-10-15'),
            endDate: new Date('2024-12-01'),
            progress: 35,
          },
          {
            name: 'Brand Documentary',
            description: 'Company history and culture documentary',
            clientId: allClients[Math.min(allClients.length - 1, 0)]._id,
            projectManagerId: projectManagers.length > 1 ? projectManagers[1]._id : defaultProjectManager,
            status: 'active',
            budget: 52000,
            startDate: new Date('2024-09-20'),
            endDate: new Date('2024-11-20'),
            progress: 60,
          },
          {
            name: 'Social Media Content',
            description: 'Short-form video content for social media platforms',
            clientId: allClients[Math.min(allClients.length - 1, 0)]._id,
            projectManagerId: defaultProjectManager,
            status: 'active',
            budget: 18000,
            startDate: new Date('2024-11-10'),
            endDate: new Date('2024-12-10'),
            progress: 15,
          },
          {
            name: 'Training Video Update',
            description: 'Update existing training videos with new content',
            clientId: allClients[0]._id,
            projectManagerId: defaultProjectManager,
            status: 'planning',
            budget: 22000,
            startDate: new Date('2024-12-15'),
            endDate: new Date('2025-02-01'),
            progress: 0,
          },
          {
            name: 'Customer Testimonial Series',
            description: 'Video testimonials from satisfied customers',
            clientId: allClients[Math.min(1, allClients.length - 1)]._id,
            projectManagerId: projectManagers.length > 1 ? projectManagers[1]._id : defaultProjectManager,
            status: 'active',
            budget: 15000,
            startDate: new Date('2024-10-01'),
            endDate: new Date('2024-11-01'),
            progress: 75,
          },
          {
            name: 'Virtual Event Coverage',
            description: 'Live streaming and recording of virtual conference',
            clientId: allClients[Math.min(2, allClients.length - 1)]._id,
            projectManagerId: defaultProjectManager,
            status: 'completed',
            budget: 38000,
            startDate: new Date('2024-08-01'),
            endDate: new Date('2024-09-01'),
            progress: 100,
          },
        ];

        // Check for existing project names and filter out duplicates
        const existingProjectNames = await Project.find({ name: { $in: additionalProjects.map(p => p.name) } }).select('name');
        const existingProjectNameSet = new Set(existingProjectNames.map(p => p.name));

        const projectsToAdd = additionalProjects.filter(project => !existingProjectNameSet.has(project.name));

        if (projectsToAdd.length > 0) {
          const createdProjects = await Project.insertMany(projectsToAdd);
          console.log(`✅ Added ${createdProjects.length} additional projects`);

          // Add schedules only for newly created projects
          if (allUsers.length >= 5) {
            const schedules = [
              {
                projectId: createdProjects[0]._id,
                title: 'Wellness Campaign Kickoff',
                startDate: new Date('2024-11-05T10:00:00'),
                endDate: new Date('2024-11-05T16:00:00'),
                location: 'Corporate Headquarters',
                assignedResources: [allUsers[Math.min(3, allUsers.length - 1)]._id, allUsers[Math.min(4, allUsers.length - 1)]._id],
              },
              {
                projectId: createdProjects[1]._id,
                title: 'Product Launch Rehearsal',
                startDate: new Date('2024-12-10T14:00:00'),
                endDate: new Date('2024-12-10T18:00:00'),
                location: 'Event Venue',
                assignedResources: [allUsers[Math.min(5, allUsers.length - 1)]._id, allUsers[Math.min(6, allUsers.length - 1)]._id],
              },
              {
                projectId: createdProjects[2]._id,
                title: 'Educational Content Shoot',
                startDate: new Date('2024-11-01T09:00:00'),
                endDate: new Date('2024-11-03T17:00:00'),
                location: 'Studio A',
                assignedResources: [
                  allUsers[Math.min(7, allUsers.length - 1)]._id,
                  allUsers[Math.min(8, allUsers.length - 1)]._id,
                  allUsers[Math.min(9, allUsers.length - 1)]._id
                ],
              },
              {
                projectId: createdProjects[3]._id,
                title: 'Company Interviews',
                startDate: new Date('2024-10-15T13:00:00'),
                endDate: new Date('2024-10-17T17:00:00'),
                location: 'Executive Offices',
                assignedResources: [allUsers[Math.min(10, allUsers.length - 1)]._id, allUsers[Math.min(11, allUsers.length - 1)]._id],
              },
              {
                projectId: createdProjects[4]._id,
                title: 'Social Media Shoot Day 1',
                startDate: new Date('2024-11-15T08:00:00'),
                endDate: new Date('2024-11-15T18:00:00'),
                location: 'Photography Studio',
                assignedResources: [allUsers[Math.min(12, allUsers.length - 1)]._id, allUsers[Math.min(13, allUsers.length - 1)]._id],
              },
            ];

            await Schedule.insertMany(schedules);
            console.log(`✅ Added ${schedules.length} schedules for new projects`);
          } else {
            console.log('ℹ️ Not enough users to create schedules. Skipping schedule creation.');
          }
        } else {
          console.log('ℹ️ All additional projects already exist, skipping project creation');
        }
      }
    }

    console.log('🎉 Extended database seeding completed successfully!');
    return { success: true, message: 'Extended database seeded with additional data' };
  } catch (error) {
    console.error('❌ Error in extended seeding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });

    return {
      success: false,
      message: `Error in extended seeding: ${errorMessage}`,
      details: errorStack
    };
  }
}