import type { Express, Request, Response } from "express";
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

// Set up file upload storage
const storage_dir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let type = req.path.includes('circulation') ? 'circulation' :
                 req.path.includes('storage') ? 'storage' : 'documents';
      
      const uploadPath = path.join(storage_dir, type);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
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

export async function registerRoutes(app: Express): Promise<Server> {
  // AUTH ROUTES
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // In a real app, you would create a JWT token here
      // For now, just return the user without the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({ 
        user: userWithoutPassword,
        token: 'dummy-token' // In a real app, this would be a JWT token
      });
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // USER ROUTES
  app.get('/api/users', async (req, res) => {
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
  
  app.get('/api/users/:id', async (req, res) => {
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
  app.get('/api/document-categories', async (req, res) => {
    try {
      const categories = await storage.getDocumentCategories();
      res.status(200).json(categories);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/document-categories', async (req, res) => {
    try {
      const categoryData = insertDocumentCategorySchema.parse(req.body);
      const newCategory = await storage.createDocumentCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // DOCUMENT ROUTES
  app.get('/api/documents', async (req, res) => {
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
  
  app.get('/api/documents/:id', async (req, res) => {
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
  
  app.post('/api/documents', upload.single('file'), async (req, res) => {
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
        uploadedBy: parseInt(req.body.uploadedBy),
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        accessRoles: req.body.accessRoles ? JSON.parse(req.body.accessRoles) : [],
        accessDepartments: req.body.accessDepartments ? JSON.parse(req.body.accessDepartments) : [],
      });
      
      const newDocument = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivityLog({
        userId: documentData.uploadedBy,
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
  
  app.get('/api/documents/:id/download', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to admin if not provided
      
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // In a real app, you would check permissions here
      
      // Increment download count
      await storage.incrementDownloadCount(id);
      
      // Record download history
      const downloadData = insertDownloadHistorySchema.parse({
        documentId: id,
        userId: userId,
        ipAddress: req.ip
      });
      
      await storage.createDownloadHistory(downloadData);
      
      // Log activity
      await storage.createActivityLog({
        userId: userId,
        action: 'download',
        resourceType: 'document',
        resourceId: id,
        details: { 
          title: document.title,
          fileName: document.fileName
        }
      });
      
      // In a real app, you would serve the file here
      // For this demo, just return success
      res.status(200).json({ 
        success: true, 
        message: 'Document download recorded',
        document: document
      });
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  // WORKFLOW ROUTES
  app.get('/api/workflows', async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.status(200).json(workflows);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/workflows', async (req, res) => {
    try {
      const workflowData = insertWorkflowSchema.parse(req.body);
      const newWorkflow = await storage.createWorkflow(workflowData);
      
      // Log activity
      await storage.createActivityLog({
        userId: workflowData.createdBy || 1,
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
  app.get('/api/circulation-documents', async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let documents;
      if (userId) {
        documents = await storage.getCirculationDocumentsByUser(userId);
      } else {
        documents = await storage.getCirculationDocuments();
      }
      
      res.status(200).json(documents);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/circulation-documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getCirculationDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Circulation document not found' });
      }
      
      res.status(200).json(document);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/circulation-documents', upload.single('file'), async (req, res) => {
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
        createdBy: parseInt(req.body.createdBy),
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
        userId: documentData.createdBy,
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
  
  app.put('/api/circulation-documents/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, step, assignedTo, userId, comment } = req.body;
      
      if (!status || step === undefined || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const document = await storage.getCirculationDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Circulation document not found' });
      }
      
      const updatedDocument = await storage.updateCirculationDocumentStatus(
        id, 
        status, 
        step, 
        assignedTo ? parseInt(assignedTo) : undefined
      );
      
      // Log activity
      await storage.createActivityLog({
        userId: parseInt(userId),
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
  app.get('/api/storage-files', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const files = await storage.getStorageFiles(userId, parentId);
      res.status(200).json(files);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.get('/api/storage-usage/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
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
  
  app.post('/api/storage-files', upload.single('file'), async (req, res) => {
    try {
      const userId = parseInt(req.body.ownerId);
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
          ...req.body,
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
          ...req.body,
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
  
  app.delete('/api/storage-files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const file = await storage.getStorageFile(id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check ownership
      if (file.ownerId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this file' });
      }
      
      const success = await storage.deleteStorageFile(id);
      
      if (!success) {
        return res.status(404).json({ error: 'File not found or could not be deleted' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: userId,
        action: 'delete',
        resourceType: 'storage',
        resourceId: id,
        details: { 
          name: file.name,
          isFolder: file.isFolder
        }
      });
      
      res.status(200).json({ success: true });
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  app.post('/api/storage-files/:id/restore', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = parseInt(req.body.userId);
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const file = await storage.getStorageFile(id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check ownership
      if (file.ownerId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to restore this file' });
      }
      
      const restoredFile = await storage.restoreStorageFile(id);
      
      // Log activity
      await storage.createActivityLog({
        userId: userId,
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
  app.get('/api/activity-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await storage.getRecentActivityLogs(limit);
      
      // Get user information for each log
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const user = await storage.getUser(log.userId);
        return {
          ...log,
          user: user ? {
            id: user.id,
            displayName: user.displayName,
            department: user.department,
            profileImage: user.profileImage
          } : undefined
        };
      }));
      
      res.status(200).json(enrichedLogs);
    } catch (err) {
      handleValidationError(err, res);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
