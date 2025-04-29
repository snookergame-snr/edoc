import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  department: text("department").notNull(),
  role: text("role").notNull(), // admin, manager, staff
  email: text("email"),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Document categories
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // internal_form, external_form, template
  parentId: integer("parent_id").references(() => documentCategories.id),
});

export const insertDocumentCategorySchema = createInsertSchema(documentCategories).omit({
  id: true,
});

// Documents (for download center)
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // docx, pdf, xlsx, etc.
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  categoryId: integer("category_id").references(() => documentCategories.id),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  downloadCount: integer("download_count").notNull().default(0),
  tags: text("tags").array(),
  accessRoles: text("access_roles").array(), // Which roles can access this document
  accessDepartments: text("access_departments").array(), // Which departments can access
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  downloadCount: true,
  uploadDate: true,
  lastUpdated: true,
});

// Document download history
export const downloadHistory = pgTable("download_history", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  downloadDate: timestamp("download_date").notNull().defaultNow(),
  ipAddress: text("ip_address"),
});

export const insertDownloadHistorySchema = createInsertSchema(downloadHistory).omit({
  id: true,
  downloadDate: true,
});

// Workflows for circulation
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(), // JSON array of approval steps
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isLocked: boolean("is_locked").default(false), // Can't be modified if locked
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
});

// Circulation documents
export const circulationDocuments = pgTable("circulation_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  documentNumber: text("document_number").notNull(),
  content: text("content"),
  status: text("status").notNull(), // draft, pending, approved, rejected
  currentStep: integer("current_step").default(0),
  workflowId: integer("workflow_id").references(() => workflows.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  filePath: text("file_path"),
  fileType: text("file_type"),
  assignedTo: integer("assigned_to").references(() => users.id),
  comments: jsonb("comments"), // JSON array of comments
  tags: text("tags").array(),
});

export const insertCirculationDocumentSchema = createInsertSchema(circulationDocuments).omit({
  id: true,
  createdAt: true,
});

// Personal storage files
export const storageFiles = pgTable("storage_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // docx, pdf, xlsx, jpg, png
  fileSize: integer("file_size").notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  parentId: integer("parent_id").references(() => storageFiles.id), // For folder structure
  isFolder: boolean("is_folder").default(false),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  accessLevel: text("access_level").notNull(), // private, department, public
  sharedWith: text("shared_with").array(), // Array of user IDs or department names
});

export const insertStorageFileSchema = createInsertSchema(storageFiles).omit({
  id: true,
  uploadDate: true,
  lastModified: true,
  deletedAt: true,
});

// Storage activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  action: text("action").notNull(), // upload, download, delete, approve, reject, etc.
  resourceType: text("resource_type").notNull(), // document, circulation, storage
  resourceId: integer("resource_id").notNull(),
  details: jsonb("details"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DocumentCategory = typeof documentCategories.$inferSelect;
export type InsertDocumentCategory = z.infer<typeof insertDocumentCategorySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DownloadHistory = typeof downloadHistory.$inferSelect;
export type InsertDownloadHistory = z.infer<typeof insertDownloadHistorySchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type CirculationDocument = typeof circulationDocuments.$inferSelect;
export type InsertCirculationDocument = z.infer<typeof insertCirculationDocumentSchema>;

export type StorageFile = typeof storageFiles.$inferSelect;
export type InsertStorageFile = z.infer<typeof insertStorageFileSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
