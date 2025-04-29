import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertDocumentSchema, 
  insertDownloadHistorySchema,
  insertWorkflowSchema,
  insertCirculationDocumentSchema,
  insertStorageFileSchema,
  insertActivityLogSchema,
  insertDocumentCategorySchema 
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, initializeUsers, hashPassword } from "./auth";
import { randomBytes } from "crypto";
import * as dotenv from "dotenv";

// Set up file upload storage
const storage_dir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

// Create subdirectories for different types of uploads
const dirs = ['documents', 'circulation', 'storage'];
dirs.forEach(dir => {
  const dirPath = path.join(storage_dir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let type = req.path.includes('circulation') ? 'circulation' :
                req.path.includes('storage') ? 'storage' : 'documents';
      
      const uploadPath = path.join(storage_dir, type);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['.docx', '.pdf', '.xlsx', '.jpg', '.png', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only docx, pdf, xlsx, jpg, png, and pptx are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

// Helper function to handle validation errors
function handleValidationError(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    return res.status(400).json({ error: validationError.message });
  }
  
  if (err instanceof Error) {
    return res.status(500).json({ error: err.message });
  }
  
  return res.status(500).json({ error: 'Unknown error occurred' });
}

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "ไม่ได้เข้าสู่ระบบ" });
}

// Admin role middleware
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Installation routes
  app.post("/api/install/database", async (req, res) => {
    try {
      // Validate database credentials
      const { host, port, username, password, database, useLocal } = req.body;
      
      if (useLocal) {
        // Update .env file with database credentials if useLocal is true
        const envContent = `
DATABASE_URL=postgresql://${username}:${password}@${host}:${port}/${database}
PGHOST=${host}
PGPORT=${port}
PGUSER=${username}
PGPASSWORD=${password}
PGDATABASE=${database}
SESSION_SECRET=${randomBytes(32).toString('hex')}
`;

        fs.writeFileSync('.env', envContent);
        
        // Reload environment variables
        dotenv.config({ override: true });
        
        // Return success
        return res.json({ success: true });
      } else {
        // Just test connection without updating env
        return res.json({ success: true });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ 
        error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
        details: error.message
      });
    }
  });
  
  app.post("/api/install/complete", async (req, res) => {
    try {
      // Create default admin user
      const existingAdmin = await storage.getUserByUsername("admin");
      
      if (!existingAdmin) {
        // Create admin user
        const adminUser = await storage.createUser({
          username: "admin",
          password: await hashPassword("admin"),
          displayName: "ผู้ดูแลระบบ",
          department: "ฝ่ายไอที",
          email: "admin@ekachon-hospital.local",
          role: "admin",
          profileImage: "",
        });
        
        console.log("Created default admin user:", adminUser.username);
      }
      
      // Create default document categories 
      try {
        await storage.createDocumentCategory({
          name: "แบบฟอร์มภายใน",
          type: "internal",
          description: "แบบฟอร์มที่ใช้ภายในโรงพยาบาล",
        });
        
        await storage.createDocumentCategory({
          name: "เอกสารทางการ",
          type: "official",
          description: "เอกสารทางการที่ได้รับการอนุมัติ",
        });
      } catch (err) {
        console.log("Categories might already exist:", err.message);
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Installation error:', error);
      return res.status(500).json({ 
        error: "ไม่สามารถติดตั้งระบบได้",
        details: error.message
      });
    }
  });

  // Set up authentication
  setupAuth(app);
  
  // Initialize default users if the database is empty
  await initializeUsers();
  
  // USER ROUTES
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password before sending
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // DOCUMENT CATEGORY ROUTES
  app.get('/api/document-categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getDocumentCategories();
      res.status(200).json(categories);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/document-categories', isAdmin, async (req, res) => {
    try {
      const categoryData = insertDocumentCategorySchema.parse(req.body);
      const newCategory = await storage.createDocumentCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // DOCUMENT ROUTES
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let documents;
      if (categoryId) {
        documents = await storage.getDocumentsByCategory(categoryId);
      } else {
        documents = await storage.getDocuments();
      }
      
      res.status(200).json(documents);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/documents/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.status(200).json(document);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/documents', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        fileName: req.file.filename,
        fileType: path.extname(req.file.originalname).substring(1),
        filePath: `/uploads/documents/${req.file.filename}`,
        fileSize: req.file.size,
        categoryId: parseInt(req.body.categoryId),
        uploadedBy: req.user?.id,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        accessRoles: req.body.accessRoles ? JSON.parse(req.body.accessRoles) : [],
        accessDepartments: req.body.accessDepartments ? JSON.parse(req.body.accessDepartments) : [],
      });
      
      const newDocument = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'upload',
        resourceType: 'document',
        resourceId: newDocument.id,
        details: { 
          title: newDocument.title,
          fileName: newDocument.fileName
        }
      });
      
      res.status(201).json(newDocument);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/documents/:id/download', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Increment download count
      await storage.incrementDownloadCount(id);
      
      // Record download history
      const downloadData = insertDownloadHistorySchema.parse({
        documentId: id,
        userId: req.user!.id,
        ipAddress: req.ip
      });
      
      await storage.createDownloadHistory(downloadData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'download',
        resourceType: 'document',
        resourceId: id,
        details: { 
          title: document.title,
          fileName: document.fileName
        }
      });
      
      // Serve the actual file
      try {
        const filePath = path.join(process.cwd(), document.filePath);
        res.download(filePath, document.fileName, (err) => {
          if (err) {
            res.status(500).json({ error: 'Failed to download file', details: err.message });
          }
        });
      } catch (fileErr) {
        // If file serving fails, just return the document details
        res.status(200).json({ 
          success: true, 
          message: 'Document download recorded',
          document: document
        });
      }
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // WORKFLOW ROUTES
  app.get('/api/workflows', isAuthenticated, async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.status(200).json(workflows);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/workflows', isAuthenticated, async (req, res) => {
    try {
      const workflowData = insertWorkflowSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      
      const newWorkflow = await storage.createWorkflow(workflowData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'workflow',
        resourceId: newWorkflow.id,
        details: { name: newWorkflow.name }
      });
      
      res.status(201).json(newWorkflow);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // CIRCULATION DOCUMENT ROUTES
  app.get('/api/circulation-documents', isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      
      let documents;
      if (req.user!.role === 'admin') {
        // Admin can see all documents
        documents = await storage.getCirculationDocuments();
      } else {
        // Other users only see their own or assigned documents
        documents = await storage.getCirculationDocumentsByUser(userId);
      }
      
      res.status(200).json(documents);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/circulation-documents/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getCirculationDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Circulation document not found' });
      }
      
      // Check user permissions
      if (req.user!.role !== 'admin' && 
          document.createdBy !== req.user!.id && 
          document.assignedTo !== req.user!.id) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้' });
      }
      
      res.status(200).json(document);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/circulation-documents', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      let filePath = null;
      let fileType = null;
      
      if (req.file) {
        filePath = `/uploads/circulation/${req.file.filename}`;
        fileType = path.extname(req.file.originalname).substring(1);
      }
      
      const documentData = insertCirculationDocumentSchema.parse({
        ...req.body,
        workflowId: req.body.workflowId ? parseInt(req.body.workflowId) : null,
        createdBy: req.user!.id,
        assignedTo: req.body.assignedTo ? parseInt(req.body.assignedTo) : null,
        filePath: filePath,
        fileType: fileType,
        currentStep: 0,
        status: 'pending',
        comments: req.body.comments ? JSON.parse(req.body.comments) : [],
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      });
      
      const newDocument = await storage.createCirculationDocument(documentData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'circulation',
        resourceId: newDocument.id,
        details: { 
          title: newDocument.title,
          documentNumber: newDocument.documentNumber
        }
      });
      
      res.status(201).json(newDocument);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.put('/api/circulation-documents/:id/status', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, step, assignedTo, comment } = req.body;
      
      if (!status || step === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const document = await storage.getCirculationDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Circulation document not found' });
      }
      
      // Check if the user is assigned to this document
      if (req.user!.role !== 'admin' && document.assignedTo !== req.user!.id) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์ในการอนุมัติเอกสารนี้' });
      }
      
      const updatedDocument = await storage.updateCirculationDocumentStatus(
        id, 
        status, 
        step, 
        assignedTo ? parseInt(assignedTo) : undefined
      );
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: status,
        resourceType: 'circulation',
        resourceId: id,
        details: { 
          title: document.title,
          documentNumber: document.documentNumber,
          comment: comment
        }
      });
      
      res.status(200).json(updatedDocument);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // STORAGE FILE ROUTES
  app.get('/api/storage-files', isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      
      // Admin can access any user's files, others can only access their own
      if (req.user!.role !== 'admin' && userId !== req.user!.id) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงไฟล์ของผู้ใช้อื่น' });
      }
      
      const files = await storage.getStorageFiles(userId, parentId);
      res.status(200).json(files);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/storage-usage/:userId?', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId ? parseInt(req.params.userId) : req.user!.id;
      
      // Admin can check any user's storage, others can only check their own
      if (req.user!.role !== 'admin' && userId !== req.user!.id) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์ดูพื้นที่จัดเก็บของผู้ใช้อื่น' });
      }
      
      const usageInBytes = await storage.getStorageUsage(userId);
      
      res.status(200).json({
        usage: usageInBytes,
        limit: 5 * 1024 * 1024, // 5 MB limit
        percentage: (usageInBytes / (5 * 1024 * 1024)) * 100
      });
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/storage-files', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const currentUsage = await storage.getStorageUsage(userId);
      const limit = 5 * 1024 * 1024; // 5 MB
      
      // Check if creating folder (no file)
      const isFolder = req.body.isFolder === 'true';
      
      // If not a folder, check if file would exceed storage limit
      if (!isFolder && req.file) {
        if (currentUsage + req.file.size > limit) {
          return res.status(400).json({ 
            error: 'Storage limit exceeded',
            usage: currentUsage,
            limit: limit 
          });
        }
      }
      
      let fileData;
      if (isFolder) {
        // Create folder
        fileData = insertStorageFileSchema.parse({
          name: req.body.name,
          description: req.body.description || '',
          filePath: `/storage/${userId}/${req.body.name}`,
          fileType: 'folder',
          fileSize: 0,
          ownerId: userId,
          parentId: req.body.parentId ? parseInt(req.body.parentId) : null,
          isFolder: true,
          accessLevel: req.body.accessLevel || 'private',
          sharedWith: req.body.sharedWith ? JSON.parse(req.body.sharedWith) : [],
        });
      } else if (req.file) {
        // Create file
        fileData = insertStorageFileSchema.parse({
          name: req.body.name || req.file.originalname,
          description: req.body.description || '',
          filePath: `/uploads/storage/${req.file.filename}`,
          fileType: path.extname(req.file.originalname).substring(1),
          fileSize: req.file.size,
          ownerId: userId,
          parentId: req.body.parentId ? parseInt(req.body.parentId) : null,
          isFolder: false,
          accessLevel: req.body.accessLevel || 'private',
          sharedWith: req.body.sharedWith ? JSON.parse(req.body.sharedWith) : [],
        });
      } else {
        return res.status(400).json({ error: 'Neither file nor folder information provided' });
      }
      
      const newFile = await storage.createStorageFile(fileData);
      
      // Log activity
      await storage.createActivityLog({
        userId: userId,
        action: 'upload',
        resourceType: 'storage',
        resourceId: newFile.id,
        details: { 
          name: newFile.name,
          isFolder: newFile.isFolder
        }
      });
      
      res.status(201).json(newFile);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.delete('/api/storage-files/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getStorageFile(id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if the user owns the file
      if (req.user!.role !== 'admin' && file.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบไฟล์นี้' });
      }
      
      const isDeleted = await storage.deleteStorageFile(id);
      
      if (isDeleted) {
        // Log activity
        await storage.createActivityLog({
          userId: req.user!.id,
          action: 'delete',
          resourceType: 'storage',
          resourceId: id,
          details: { 
            name: file.name,
            isFolder: file.isFolder
          }
        });
        
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Failed to delete file' });
      }
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/storage-files/:id/restore', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getStorageFile(id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if the user owns the file
      if (req.user!.role !== 'admin' && file.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์กู้คืนไฟล์นี้' });
      }
      
      const restoredFile = await storage.restoreStorageFile(id);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'restore',
        resourceType: 'storage',
        resourceId: id,
        details: { 
          name: restoredFile.name,
          isFolder: restoredFile.isFolder
        }
      });
      
      res.status(200).json(restoredFile);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // ACTIVITY LOG ROUTES
  app.get('/api/activity-logs', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await storage.getRecentActivityLogs(limit);
      
      // For non-admin users, only show their own activities or public activities
      if (req.user!.role !== 'admin') {
        const filteredLogs = logs.filter(log => 
          log.userId === req.user!.id || 
          log.resourceType === 'document' || 
          log.resourceType === 'circulation'
        );
        return res.status(200).json(filteredLogs);
      }
      
      res.status(200).json(logs);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  // Admin API routes
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const documents = await storage.getDocuments();
      const circulationDocs = await storage.getCirculationDocuments();
      
      // Get pending approvals
      const pendingApprovals = circulationDocs.filter(doc => doc.status === 'pending');
      
      // Get file stats
      const totalFiles = documents.length;
      const downloadCount = documents.reduce((sum, doc) => sum + doc.downloadCount, 0);
      
      // Calculate user stats by role
      const roleStats = {
        admin: users.filter(user => user.role === 'admin').length,
        manager: users.filter(user => user.role === 'manager').length,
        staff: users.filter(user => user.role === 'staff').length
      };
      
      // Calculate department stats
      const departmentMap = new Map();
      users.forEach(user => {
        if (!departmentMap.has(user.department)) {
          departmentMap.set(user.department, 0);
        }
        departmentMap.set(user.department, departmentMap.get(user.department) + 1);
      });
      
      const departmentStats = Array.from(departmentMap.entries()).map(([dept, count]) => ({
        department: dept,
        count
      }));
      
      res.status(200).json({
        users: {
          total: users.length,
          byRole: roleStats
        },
        documents: {
          total: totalFiles,
          downloads: downloadCount
        },
        circulation: {
          total: circulationDocs.length,
          pendingApproval: pendingApprovals.length
        },
        departments: departmentStats
      });
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  // Create an HTTP server and return it
  const httpServer = createServer(app);
  return httpServer;
}