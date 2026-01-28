
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assureqai';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username: String,
  role: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
const User = mongoose.model('User', userSchema);

async function assignProject() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const username = 'client';

    // 1. Find or Create Project
    let project = await Project.findOne({ name: 'Internal Client Demo' });
    if (!project) {
      project = new Project({
        name: 'Internal Client Demo',
        isActive: true,
      });
      await project.save();
      console.log(`Created new project: ${project.name} (${project._id})`);
    } else {
      console.log(`Using existing project: ${project.name} (${project._id})`);
    }

    // 2. Find User
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`User ${username} not found! Run create-client-user.js first.`);
      return;
    }

    // 3. Update User
    user.projectId = project._id;
    await user.save();
    console.log(`User ${username} assigned to project ${project._id}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

assignProject();
