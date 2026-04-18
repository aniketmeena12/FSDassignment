import mongoose from 'mongoose';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: [ROLES.USER, ROLES.ADMIN],
      default: ROLES.USER,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure email is unique in case of duplicate attempts
userSchema.index({ email: 1 }, { unique: true });

// Virtual for user's task count
userSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'assignedTo',
  count: true,
});

// Hash password before saving (will be implemented in service)
userSchema.pre('save', function (next) {
  // Password hashing will be handled in the service layer
  next();
});

// Override toJSON to exclude sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
