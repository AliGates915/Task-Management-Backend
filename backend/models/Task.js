import mongoose from 'mongoose';

/* =========================
   SubTask Schema
========================= */
const subTaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  hoursSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

/* =========================
   Day Schema
========================= */
const daySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  subTasks: {
    type: [subTaskSchema],
    default: [] // 🔥 MUST HAVE
  }
}, { _id: false });

/* =========================
   Task Schema
========================= */
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed'],
    default: 'pending'
  },
  days: {
    type: [daySchema],
    default: [] // 🔥 MUST HAVE
  },
  progress: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Task', taskSchema);