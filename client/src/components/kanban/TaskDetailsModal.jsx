import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Send, 
  Calendar, 
  Clock, 
  Paperclip, 
  History, 
  MessageSquare,
  AlertCircle,
  Download,
  FileText,
  UploadCloud
} from 'lucide-react';
import { 
  Modal, 
  Button, 
  Select, 
  Input, 
  Textarea, 
  Avatar, 
  PriorityBadge, 
  StatusBadge, 
  useToast 
} from '../ui';
import { 
  fetchTaskDetails, 
  createSubtask, 
  updateSubtask, 
  deleteSubtask, 
  createComment, 
  updateTask,
  deleteTask,
  uploadTaskAttachments,
  deleteTaskAttachment
} from '../../store/taskSlice';

export const TaskDetailsModal = ({ isOpen, onClose, task, workspaceId }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const { currentTaskDetails, isLoading } = useSelector((state) => state.task);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('subtasks'); // 'subtasks' | 'comments' | 'attachments' | 'history'

  const taskId = task?._id || task?.id;

  useEffect(() => {
    if (isOpen && taskId && workspaceId) {
      dispatch(fetchTaskDetails({ workspaceId, taskId }));
    }
  }, [dispatch, isOpen, taskId, workspaceId]);

  const activeTask = currentTaskDetails?.task || task;
  const subtasks = currentTaskDetails?.subtasks || activeTask?.subtasks || [];
  const comments = currentTaskDetails?.comments || activeTask?.comments || [];
  const history = currentTaskDetails?.history || [];
  const attachments = currentTaskDetails?.task?.attachments || activeTask?.attachments || [];

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !workspaceId || !taskId) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setIsUploading(true);
    try {
      await dispatch(uploadTaskAttachments({ workspaceId, taskId, formData })).unwrap();
      toast.success('Files Uploaded', 'Attachments have been uploaded successfully.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error('Upload Failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!workspaceId || !taskId) return;
    try {
      await dispatch(deleteTaskAttachment({ workspaceId, taskId, attachmentId })).unwrap();
      toast.info('Attachment Removed');
    } catch (err) {
      toast.error('Failed to remove attachment', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!workspaceId || !taskId) return;
    try {
      await dispatch(updateTask({ workspaceId, taskId, data: { status: newStatus } })).unwrap();
      toast.success('Status Updated', `Task status changed to ${newStatus}`);
    } catch (err) {
      toast.error('Update Failed', err);
    }
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    if (!workspaceId || !taskId) return;
    try {
      await dispatch(updateTask({ workspaceId, taskId, data: { priority: newPriority } })).unwrap();
      toast.success('Priority Updated', `Priority changed to ${newPriority}`);
    } catch (err) {
      toast.error('Update Failed', err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !workspaceId || !taskId) return;

    try {
      await dispatch(createSubtask({
        workspaceId,
        taskId,
        data: { title: newSubtaskTitle.trim() },
      })).unwrap();
      setNewSubtaskTitle('');
      toast.success('Subtask Added', 'Subtask successfully created.');
    } catch (err) {
      toast.error('Failed to add subtask', err);
    }
  };

  const handleToggleSubtask = async (subtask) => {
    if (!workspaceId || !taskId) return;
    try {
      await dispatch(updateSubtask({
        workspaceId,
        taskId,
        subtaskId: subtask._id || subtask.id,
        data: { completed: !subtask.completed },
      })).unwrap();
    } catch (err) {
      toast.error('Failed to update subtask', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!workspaceId || !taskId) return;
    try {
      await dispatch(deleteSubtask({
        workspaceId,
        taskId,
        subtaskId,
      })).unwrap();
      toast.info('Subtask Deleted');
    } catch (err) {
      toast.error('Failed to delete subtask', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !workspaceId || !taskId) return;

    setIsSubmittingComment(true);
    try {
      await dispatch(createComment({
        workspaceId,
        taskId,
        data: { content: newCommentContent.trim() },
      })).unwrap();
      setNewCommentContent('');
      toast.success('Comment Posted');
    } catch (err) {
      toast.error('Failed to post comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!workspaceId || !taskId) return;
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await dispatch(deleteTask({ workspaceId, taskId })).unwrap();
        toast.info('Task Deleted');
        onClose();
      } catch (err) {
        toast.error('Failed to delete task', err);
      }
    }
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTask?.title || 'Task Details'}
      description={`Task ID: ${taskId?.slice(-6) || 'N/A'}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleDeleteTask}
          >
            Delete Task
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status & Priority Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-ivory/50 rounded-lg border border-border">
          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Status Column
            </label>
            <Select
              id="modal-task-status"
              value={activeTask?.status || 'TODO'}
              onChange={handleStatusChange}
              options={[
                { label: 'Backlog', value: 'BACKLOG' },
                { label: 'To Do', value: 'TODO' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'In Review', value: 'IN_REVIEW' },
                { label: 'Done', value: 'DONE' },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Priority Level
            </label>
            <Select
              id="modal-task-priority"
              value={activeTask?.priority || 'MEDIUM'}
              onChange={handlePriorityChange}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical', value: 'CRITICAL' },
              ]}
            />
          </div>
        </div>

        {/* Description Section */}
        <div>
          <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">
            Description
          </h4>
          <p className="text-xs text-charcoal-secondary bg-white p-3 rounded-lg border border-border leading-relaxed min-h-[60px]">
            {activeTask?.description || 'No description provided for this task.'}
          </p>
        </div>

        {/* Metadata Details (Due Date, Project, Assignees) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-lg border border-border">
            <span className="text-[11px] text-charcoal-secondary block mb-1">Due Date</span>
            <div className="flex items-center gap-1.5 font-medium text-charcoal">
              <Calendar className="w-3.5 h-3.5 text-forest" />
              {activeTask?.dueDate 
                ? new Date(activeTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'No due date'}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-border">
            <span className="text-[11px] text-charcoal-secondary block mb-1">Project</span>
            <div className="font-medium text-charcoal truncate">
              {activeTask?.project?.name || 'Default Project'}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-border col-span-2 sm:col-span-1">
            <span className="text-[11px] text-charcoal-secondary block mb-1">Assignees</span>
            <div className="flex items-center gap-1.5">
              {activeTask?.assignees && activeTask.assignees.length > 0 ? (
                activeTask.assignees.map((user) => (
                  <Avatar key={user._id || user.id} name={user.name} src={user.avatar} size="xs" />
                ))
              ) : (
                <span className="text-charcoal-secondary text-xs">Unassigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Subtasks, Comments, Activity History */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('subtasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'subtasks'
                  ? 'bg-forest text-white'
                  : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Subtasks ({subtasks.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'comments'
                  ? 'bg-forest text-white'
                  : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comments ({comments.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'attachments'
                  ? 'bg-forest text-white'
                  : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attachments ({attachments.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'history'
                  ? 'bg-forest text-white'
                  : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Activity History
            </button>
          </div>

          {/* Subtasks Tab */}
          {activeTab === 'subtasks' && (
            <div className="space-y-3">
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <Input
                  id="new-subtask-input"
                  placeholder="Add a new subtask checklist item..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </form>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {subtasks.length === 0 ? (
                  <p className="text-xs text-charcoal-secondary/60 text-center py-4">
                    No subtasks yet. Break this task down into bite-sized items.
                  </p>
                ) : (
                  subtasks.map((st) => (
                    <div
                      key={st._id || st.id}
                      className="flex items-center justify-between p-2.5 bg-ivory/30 rounded-lg border border-border hover:bg-ivory/60 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(st)}
                        className="flex items-center gap-2.5 text-left flex-1"
                      >
                        {st.completed ? (
                          <CheckSquare className="w-4 h-4 text-forest" />
                        ) : (
                          <Square className="w-4 h-4 text-charcoal-secondary" />
                        )}
                        <span
                          className={`text-xs ${
                            st.completed
                              ? 'line-through text-charcoal-secondary'
                              : 'text-charcoal font-medium'
                          }`}
                        >
                          {st.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st._id || st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-charcoal-secondary hover:text-danger transition-opacity"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddComment} className="space-y-2">
                <Textarea
                  id="new-comment-textarea"
                  placeholder="Share feedback, updates or mention teammates..."
                  rows={2}
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingComment}
                    leftIcon={<Send className="w-3 h-3" />}
                    disabled={!newCommentContent.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </form>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-charcoal-secondary/60 text-center py-4">
                    No comments yet. Start the conversation!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment._id || comment.id}
                      className="p-3 bg-ivory/30 rounded-lg border border-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={comment.author?.name || 'User'}
                            src={comment.author?.avatar}
                            size="xs"
                          />
                          <span className="text-xs font-semibold text-charcoal">
                            {comment.author?.name || 'Teammate'}
                          </span>
                        </div>
                        <span className="text-[10px] text-charcoal-secondary">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal leading-relaxed pl-6">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload Box */}
              <div className="border-2 border-dashed border-border rounded-xl p-4 bg-ivory/30 text-center hover:bg-ivory/50 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  id="task-file-upload-input"
                  data-testid="task-file-upload-input"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-charcoal">
                      Upload task files and documents
                    </p>
                    <p className="text-[11px] text-charcoal-secondary mt-0.5">
                      PNG, JPG, PDF, DOCX, CSV up to 10MB per file
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Paperclip className="w-3.5 h-3.5" />}
                  >
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </div>
              </div>

              {/* Attachments List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {attachments.length === 0 ? (
                  <p className="text-xs text-charcoal-secondary/60 text-center py-4">
                    No attachments added yet. Upload files to share specs, mockups, or documents.
                  </p>
                ) : (
                  attachments.map((att) => {
                    const isImg = att.mimeType?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    return (
                      <div
                        key={att._id || att.id || att.publicId}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border hover:shadow-xs transition-shadow group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isImg ? (
                            <div className="w-9 h-9 rounded bg-forest/5 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded bg-sage/10 border border-border shrink-0 flex items-center justify-center text-forest">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-charcoal hover:text-forest truncate block hover:underline"
                              title={att.name}
                            >
                              {att.name}
                            </a>
                            <div className="flex items-center gap-2 text-[10px] text-charcoal-secondary mt-0.5">
                              <span>{formatFileSize(att.size)}</span>
                              <span>&bull;</span>
                              <span>
                                {att.createdAt
                                  ? new Date(att.createdAt).toLocaleDateString()
                                  : 'Uploaded'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="p-1.5 text-charcoal-secondary hover:text-forest transition-colors rounded hover:bg-ivory"
                            title="Download / View"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att._id || att.id)}
                            className="p-1.5 text-charcoal-secondary hover:text-danger transition-colors rounded hover:bg-status-danger/10"
                            title="Remove attachment"
                            data-testid={`delete-attachment-${att._id || att.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Activity History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-charcoal-secondary/60 text-center py-4">
                  No activity history recorded yet.
                </p>
              ) : (
                history.map((log) => (
                  <div
                    key={log._id || log.id}
                    className="flex items-start gap-2.5 p-2 bg-ivory/20 rounded border border-border/70 text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold text-charcoal">
                        {log.actor?.name || 'User'}
                      </span>{' '}
                      <span className="text-charcoal-secondary">
                        {log.action?.toLowerCase().replace(/_/g, ' ')}
                      </span>
                      {log.metadata?.from && log.metadata?.to && (
                        <span className="text-charcoal-secondary ml-1 font-mono text-[11px]">
                          ({log.metadata.from} &rarr; {log.metadata.to})
                        </span>
                      )}
                      <div className="text-[10px] text-charcoal-secondary/60 mt-0.5">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;
