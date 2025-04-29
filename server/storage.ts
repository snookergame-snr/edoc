import {
  User, InsertUser,
  Document, InsertDocument,
  DocumentCategory, InsertDocumentCategory,
  DownloadHistory, InsertDownloadHistory,
  Workflow, InsertWorkflow,
  CirculationDocument, InsertCirculationDocument,
  StorageFile, InsertStorageFile,
  ActivityLog, InsertActivityLog,
  users, documents, documentCategories, downloadHistory, 
  workflows, circulationDocuments, storageFiles, activityLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Document category operations
  getDocumentCategories(): Promise<DocumentCategory[]>;
  getDocumentCategory(id: number): Promise<DocumentCategory | undefined>;
  createDocumentCategory(category: InsertDocumentCategory): Promise<DocumentCategory>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByCategory(categoryId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  incrementDownloadCount(id: number): Promise<Document>;
  
  // Download history operations
  createDownloadHistory(history: InsertDownloadHistory): Promise<DownloadHistory>;
  getDownloadHistoryByDocument(documentId: number): Promise<DownloadHistory[]>;
  
  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  
  // Circulation document operations
  getCirculationDocuments(): Promise<CirculationDocument[]>;
  getCirculationDocument(id: number): Promise<CirculationDocument | undefined>;
  getCirculationDocumentsByUser(userId: number): Promise<CirculationDocument[]>;
  createCirculationDocument(document: InsertCirculationDocument): Promise<CirculationDocument>;
  updateCirculationDocumentStatus(id: number, status: string, step: number, assignedTo?: number): Promise<CirculationDocument>;
  
  // Storage file operations
  getStorageFiles(userId: number, parentId?: number): Promise<StorageFile[]>;
  getStorageFile(id: number): Promise<StorageFile | undefined>;
  createStorageFile(file: InsertStorageFile): Promise<StorageFile>;
  deleteStorageFile(id: number): Promise<boolean>;
  restoreStorageFile(id: number): Promise<StorageFile>;
  getStorageUsage(userId: number): Promise<number>; // Returns usage in bytes
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  
  // Session store
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // DOCUMENT CATEGORY OPERATIONS
  async getDocumentCategories(): Promise<DocumentCategory[]> {
    return await db.select().from(documentCategories);
  }
  
  async getDocumentCategory(id: number): Promise<DocumentCategory | undefined> {
    const [category] = await db.select().from(documentCategories).where(eq(documentCategories.id, id));
    return category;
  }
  
  async createDocumentCategory(category: InsertDocumentCategory): Promise<DocumentCategory> {
    const [newCategory] = await db.insert(documentCategories).values(category).returning();
    return newCategory;
  }
  
  // DOCUMENT OPERATIONS
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async getDocumentsByCategory(categoryId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.categoryId, categoryId));
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }
  
  async incrementDownloadCount(id: number): Promise<Document> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    const [updatedDocument] = await db
      .update(documents)
      .set({ downloadCount: document.downloadCount + 1 })
      .where(eq(documents.id, id))
      .returning();
    
    return updatedDocument;
  }
  
  // DOWNLOAD HISTORY OPERATIONS
  async createDownloadHistory(history: InsertDownloadHistory): Promise<DownloadHistory> {
    const [newHistory] = await db.insert(downloadHistory).values(history).returning();
    return newHistory;
  }
  
  async getDownloadHistoryByDocument(documentId: number): Promise<DownloadHistory[]> {
    return await db.select().from(downloadHistory).where(eq(downloadHistory.documentId, documentId));
  }
  
  // WORKFLOW OPERATIONS
  async getWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows);
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }
  
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }
  
  // CIRCULATION DOCUMENT OPERATIONS
  async getCirculationDocuments(): Promise<CirculationDocument[]> {
    return await db.select().from(circulationDocuments);
  }
  
  async getCirculationDocument(id: number): Promise<CirculationDocument | undefined> {
    const [document] = await db.select().from(circulationDocuments).where(eq(circulationDocuments.id, id));
    return document;
  }
  
  async getCirculationDocumentsByUser(userId: number): Promise<CirculationDocument[]> {
    return await db
      .select()
      .from(circulationDocuments)
      .where(
        eq(circulationDocuments.createdBy, userId) || 
        eq(circulationDocuments.assignedTo, userId)
      );
  }
  
  async createCirculationDocument(document: InsertCirculationDocument): Promise<CirculationDocument> {
    const [newDocument] = await db.insert(circulationDocuments).values(document).returning();
    return newDocument;
  }
  
  async updateCirculationDocumentStatus(
    id: number, 
    status: string, 
    step: number, 
    assignedTo?: number
  ): Promise<CirculationDocument> {
    let updateData: any = { status, currentStep: step };
    
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }
    
    const [updatedDocument] = await db
      .update(circulationDocuments)
      .set(updateData)
      .where(eq(circulationDocuments.id, id))
      .returning();
      
    return updatedDocument;
  }
  
  // STORAGE FILE OPERATIONS
  async getStorageFiles(userId: number, parentId?: number): Promise<StorageFile[]> {
    if (parentId === undefined) {
      return await db
        .select()
        .from(storageFiles)
        .where(
          and(
            eq(storageFiles.ownerId, userId),
            eq(storageFiles.isDeleted, false),
            isNull(storageFiles.parentId)
          )
        );
    } else {
      return await db
        .select()
        .from(storageFiles)
        .where(
          and(
            eq(storageFiles.ownerId, userId),
            eq(storageFiles.isDeleted, false),
            eq(storageFiles.parentId, parentId)
          )
        );
    }
  }
  
  async getStorageFile(id: number): Promise<StorageFile | undefined> {
    const [file] = await db.select().from(storageFiles).where(eq(storageFiles.id, id));
    return file;
  }
  
  async createStorageFile(file: InsertStorageFile): Promise<StorageFile> {
    const [newFile] = await db.insert(storageFiles).values(file).returning();
    return newFile;
  }
  
  async deleteStorageFile(id: number): Promise<boolean> {
    const now = new Date();
    const [file] = await db
      .update(storageFiles)
      .set({ isDeleted: true, deletedAt: now })
      .where(eq(storageFiles.id, id))
      .returning();
      
    return !!file;
  }
  
  async restoreStorageFile(id: number): Promise<StorageFile> {
    const [restoredFile] = await db
      .update(storageFiles)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(storageFiles.id, id))
      .returning();
      
    if (!restoredFile) {
      throw new Error(`Storage file with ID ${id} not found`);
    }
    
    return restoredFile;
  }
  
  async getStorageUsage(userId: number): Promise<number> {
    const files = await db
      .select()
      .from(storageFiles)
      .where(
        and(
          eq(storageFiles.ownerId, userId),
          eq(storageFiles.isDeleted, false),
          eq(storageFiles.isFolder, false)
        )
      );
      
    return files.reduce((total, file) => total + file.fileSize, 0);
  }
  
  // ACTIVITY LOG OPERATIONS
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }
  
  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }
}

// Export the database storage instance for use in the application
export const storage = new DatabaseStorage();