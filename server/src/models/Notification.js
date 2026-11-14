import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'TASK_ASSIGNED',
        'TASK_UPDATED',
        'TASK_COMPLETED',
        'COMMENT_ADDED',
        'PROJECT_INVITATION',
        'WORKSPACE_INVITATION',
        'DEADLINE_APPROACHING',
        'TASK_OVERDUE',
        'MEMBER_JOINED',
        'DEADLINE_ALERT',
        'INVITATION',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    idempotencyKey: {
      type: String,
      index: { unique: true, sparse: true },
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['PROJECT', 'TASK', 'COMMENT', 'WORKSPACE'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
