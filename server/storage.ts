import {
  User,
  InsertUser,
  Document,
  InsertDocument,
  DocumentCategory,
  InsertDocumentCategory,
  DownloadHistory,
  InsertDownloadHistory,
  Workflow,
  InsertWorkflow,
  CirculationDocument,
  InsertCirculationDocument,
  StorageFile,
  InsertStorageFile,
  ActivityLog,
  InsertActivityLog
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documentCategories: Map<number, DocumentCategory>;
  private documents: Map<number, Document>;
  private downloadHistory: Map<number, DownloadHistory>;
  private workflows: Map<number, Workflow>;
  private circulationDocuments: Map<number, CirculationDocument>;
  private storageFiles: Map<number, StorageFile>;
  private activityLogs: Map<number, ActivityLog>;
  
  private currentUserId: number;
  private currentDocumentCategoryId: number;
  private currentDocumentId: number;
  private currentDownloadHistoryId: number;
  private currentWorkflowId: number;
  private currentCirculationDocumentId: number;
  private currentStorageFileId: number;
  private currentActivityLogId: number;
  
  constructor() {
    this.users = new Map();
    this.documentCategories = new Map();
    this.documents = new Map();
    this.downloadHistory = new Map();
    this.workflows = new Map();
    this.circulationDocuments = new Map();
    this.storageFiles = new Map();
    this.activityLogs = new Map();
    
    this.currentUserId = 1;
    this.currentDocumentCategoryId = 1;
    this.currentDocumentId = 1;
    this.currentDownloadHistoryId = 1;
    this.currentWorkflowId = 1;
    this.currentCirculationDocumentId = 1;
    this.currentStorageFileId = 1;
    this.currentActivityLogId = 1;
    
    // Initialize with some demo data
    this.initializeDemoData();
  }
  
  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // DOCUMENT CATEGORY OPERATIONS
  async getDocumentCategories(): Promise<DocumentCategory[]> {
    return Array.from(this.documentCategories.values());
  }
  
  async getDocumentCategory(id: number): Promise<DocumentCategory | undefined> {
    return this.documentCategories.get(id);
  }
  
  async createDocumentCategory(category: InsertDocumentCategory): Promise<DocumentCategory> {
    const id = this.currentDocumentCategoryId++;
    const newCategory: DocumentCategory = { ...category, id };
    this.documentCategories.set(id, newCategory);
    return newCategory;
  }
  
  // DOCUMENT OPERATIONS
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getDocumentsByCategory(categoryId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      doc => doc.categoryId === categoryId
    );
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const newDocument: Document = { 
      ...document, 
      id, 
      downloadCount: 0,
      uploadDate: now,
      lastUpdated: now
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }
  
  async incrementDownloadCount(id: number): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    const updatedDocument = {
      ...document,
      downloadCount: document.downloadCount + 1
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // DOWNLOAD HISTORY OPERATIONS
  async createDownloadHistory(history: InsertDownloadHistory): Promise<DownloadHistory> {
    const id = this.currentDownloadHistoryId++;
    const now = new Date();
    const newHistory: DownloadHistory = {
      ...history,
      id,
      downloadDate: now
    };
    this.downloadHistory.set(id, newHistory);
    return newHistory;
  }
  
  async getDownloadHistoryByDocument(documentId: number): Promise<DownloadHistory[]> {
    return Array.from(this.downloadHistory.values()).filter(
      history => history.documentId === documentId
    );
  }
  
  // WORKFLOW OPERATIONS
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }
  
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const id = this.currentWorkflowId++;
    const now = new Date();
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: now
    };
    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }
  
  // CIRCULATION DOCUMENT OPERATIONS
  async getCirculationDocuments(): Promise<CirculationDocument[]> {
    return Array.from(this.circulationDocuments.values());
  }
  
  async getCirculationDocument(id: number): Promise<CirculationDocument | undefined> {
    return this.circulationDocuments.get(id);
  }
  
  async getCirculationDocumentsByUser(userId: number): Promise<CirculationDocument[]> {
    return Array.from(this.circulationDocuments.values()).filter(
      doc => doc.createdBy === userId || doc.assignedTo === userId
    );
  }
  
  async createCirculationDocument(document: InsertCirculationDocument): Promise<CirculationDocument> {
    const id = this.currentCirculationDocumentId++;
    const now = new Date();
    const newDocument: CirculationDocument = {
      ...document,
      id,
      createdAt: now
    };
    this.circulationDocuments.set(id, newDocument);
    return newDocument;
  }
  
  async updateCirculationDocumentStatus(
    id: number, 
    status: string, 
    step: number, 
    assignedTo?: number
  ): Promise<CirculationDocument> {
    const document = this.circulationDocuments.get(id);
    if (!document) {
      throw new Error(`Circulation document with ID ${id} not found`);
    }
    
    const updatedDocument: CirculationDocument = {
      ...document,
      status,
      currentStep: step
    };
    
    if (assignedTo !== undefined) {
      updatedDocument.assignedTo = assignedTo;
    }
    
    this.circulationDocuments.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // STORAGE FILE OPERATIONS
  async getStorageFiles(userId: number, parentId?: number): Promise<StorageFile[]> {
    return Array.from(this.storageFiles.values()).filter(file => {
      if (file.isDeleted) return false;
      if (file.ownerId !== userId) return false;
      if (parentId === undefined) return file.parentId === null || file.parentId === undefined;
      return file.parentId === parentId;
    });
  }
  
  async getStorageFile(id: number): Promise<StorageFile | undefined> {
    return this.storageFiles.get(id);
  }
  
  async createStorageFile(file: InsertStorageFile): Promise<StorageFile> {
    const id = this.currentStorageFileId++;
    const now = new Date();
    const newFile: StorageFile = {
      ...file,
      id,
      uploadDate: now,
      lastModified: now,
      isDeleted: false,
      deletedAt: null
    };
    this.storageFiles.set(id, newFile);
    return newFile;
  }
  
  async deleteStorageFile(id: number): Promise<boolean> {
    const file = this.storageFiles.get(id);
    if (!file) {
      return false;
    }
    
    const now = new Date();
    const deletedFile: StorageFile = {
      ...file,
      isDeleted: true,
      deletedAt: now
    };
    
    this.storageFiles.set(id, deletedFile);
    return true;
  }
  
  async restoreStorageFile(id: number): Promise<StorageFile> {
    const file = this.storageFiles.get(id);
    if (!file) {
      throw new Error(`Storage file with ID ${id} not found`);
    }
    
    const restoredFile: StorageFile = {
      ...file,
      isDeleted: false,
      deletedAt: null
    };
    
    this.storageFiles.set(id, restoredFile);
    return restoredFile;
  }
  
  async getStorageUsage(userId: number): Promise<number> {
    const userFiles = Array.from(this.storageFiles.values()).filter(
      file => file.ownerId === userId && !file.isDeleted && !file.isFolder
    );
    
    return userFiles.reduce((total, file) => total + file.fileSize, 0);
  }
  
  // ACTIVITY LOG OPERATIONS
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const now = new Date();
    const newLog: ActivityLog = {
      ...log,
      id,
      timestamp: now
    };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
  
  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values());
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return logs.slice(0, limit);
  }
  
  // Initialize demo data for the application
  private initializeDemoData() {
    // Create some users
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      displayName: "ผู้ดูแลระบบ",
      department: "ฝ่ายไอที",
      role: "admin",
      email: "admin@hospital.com",
      profileImage: ""
    };
    
    const managerUser: InsertUser = {
      username: "somchai",
      password: "somchai123",
      displayName: "สมชาย มั่นคง",
      department: "แผนกบุคคล",
      role: "manager",
      email: "somchai@hospital.com",
      profileImage: ""
    };
    
    const staffUser1: InsertUser = {
      username: "suda",
      password: "suda123",
      displayName: "สุดา มานะ",
      department: "แผนกบัญชี",
      role: "staff",
      email: "suda@hospital.com",
      profileImage: ""
    };
    
    const staffUser2: InsertUser = {
      username: "chaiyos",
      password: "chaiyos123",
      displayName: "ชัยยศ ใจดี",
      department: "แผนกจัดซื้อ",
      role: "staff",
      email: "chaiyos@hospital.com",
      profileImage: ""
    };
    
    const admin = this.createUser(adminUser);
    const manager = this.createUser(managerUser);
    const staff1 = this.createUser(staffUser1);
    const staff2 = this.createUser(staffUser2);
    
    // Create document categories
    const internalFormCategory: InsertDocumentCategory = {
      name: "แบบฟอร์มภายใน",
      description: "แบบฟอร์มสำหรับใช้ภายในโรงพยาบาล",
      type: "internal_form",
      parentId: null
    };
    
    const externalFormCategory: InsertDocumentCategory = {
      name: "หนังสือราชการภายนอก",
      description: "แบบฟอร์มสำหรับติดต่อหน่วยงานภายนอก",
      type: "external_form",
      parentId: null
    };
    
    const internalDocCategory: InsertDocumentCategory = {
      name: "หนังสือภายใน",
      description: "เอกสารสำหรับติดต่อภายในหน่วยงาน",
      type: "template",
      parentId: null
    };
    
    const leaveFormCategory: InsertDocumentCategory = {
      name: "แบบฟอร์มลางาน",
      description: "แบบฟอร์มสำหรับขออนุมัติลา",
      type: "internal_form",
      parentId: 1 // Will be set to internalFormCategory.id
    };
    
    const requisitionFormCategory: InsertDocumentCategory = {
      name: "แบบฟอร์มเบิกของ",
      description: "แบบฟอร์มสำหรับเบิกวัสดุอุปกรณ์",
      type: "internal_form",
      parentId: 1 // Will be set to internalFormCategory.id
    };
    
    const trainingFormCategory: InsertDocumentCategory = {
      name: "แบบฟอร์มอบรม",
      description: "แบบฟอร์มสำหรับขออนุมัติอบรม/สัมมนา",
      type: "internal_form",
      parentId: 1 // Will be set to internalFormCategory.id
    };
    
    this.createDocumentCategory(internalFormCategory);
    this.createDocumentCategory(externalFormCategory);
    this.createDocumentCategory(internalDocCategory);
    this.createDocumentCategory(leaveFormCategory);
    this.createDocumentCategory(requisitionFormCategory);
    this.createDocumentCategory(trainingFormCategory);
    
    // Create some documents
    const leaveFormDoc: InsertDocument = {
      title: "แบบฟอร์มลางาน",
      description: "แบบฟอร์มใบลาทั่วไป สำหรับบุคลากรทุกแผนก",
      fileName: "leave_form.docx",
      fileType: "docx",
      filePath: "/uploads/forms/leave_form.docx",
      fileSize: 25600, // 25 KB
      categoryId: 4, // leaveFormCategory
      uploadedBy: 1, // admin
      tags: ["ลางาน", "ลาป่วย", "ลาพักร้อน"],
      accessRoles: ["admin", "manager", "staff"],
      accessDepartments: []
    };
    
    const requisitionFormDoc: InsertDocument = {
      title: "แบบฟอร์มเบิกวัสดุ",
      description: "แบบฟอร์มเบิกวัสดุอุปกรณ์สำนักงาน",
      fileName: "requisition_form.docx",
      fileType: "docx",
      filePath: "/uploads/forms/requisition_form.docx",
      fileSize: 30720, // 30 KB
      categoryId: 5, // requisitionFormCategory
      uploadedBy: 1, // admin
      tags: ["เบิกของ", "วัสดุสำนักงาน"],
      accessRoles: ["admin", "manager", "staff"],
      accessDepartments: []
    };
    
    const officialLetterDoc: InsertDocument = {
      title: "Template หนังสือราชการ",
      description: "รูปแบบการพิมพ์หนังสือราชการภายนอก",
      fileName: "official_letter_template.pdf",
      fileType: "pdf",
      filePath: "/uploads/templates/official_letter_template.pdf",
      fileSize: 51200, // 50 KB
      categoryId: 2, // externalFormCategory
      uploadedBy: 1, // admin
      tags: ["หนังสือราชการ", "template"],
      accessRoles: ["admin", "manager"],
      accessDepartments: []
    };
    
    const trainingFormDoc: InsertDocument = {
      title: "แบบฟอร์มขออนุมัติฝึกอบรม",
      description: "แบบฟอร์มขออนุมัติเข้ารับการฝึกอบรม/สัมมนา",
      fileName: "training_form.docx",
      fileType: "docx",
      filePath: "/uploads/forms/training_form.docx",
      fileSize: 28672, // 28 KB
      categoryId: 6, // trainingFormCategory
      uploadedBy: 1, // admin
      tags: ["ฝึกอบรม", "สัมมนา"],
      accessRoles: ["admin", "manager", "staff"],
      accessDepartments: []
    };
    
    const internalMemoDoc: InsertDocument = {
      title: "Template บันทึกข้อความ",
      description: "แบบฟอร์มบันทึกข้อความหนังสือภายใน",
      fileName: "internal_memo_template.docx",
      fileType: "docx",
      filePath: "/uploads/templates/internal_memo_template.docx",
      fileSize: 26624, // 26 KB
      categoryId: 3, // internalDocCategory
      uploadedBy: 1, // admin
      tags: ["บันทึกข้อความ", "หนังสือภายใน"],
      accessRoles: ["admin", "manager", "staff"],
      accessDepartments: []
    };
    
    const hospitalOrderDoc: InsertDocument = {
      title: "คำสั่งโรงพยาบาลเอกชล",
      description: "ตัวอย่างรูปแบบคำสั่งโรงพยาบาล",
      fileName: "hospital_order_template.pdf",
      fileType: "pdf",
      filePath: "/uploads/templates/hospital_order_template.pdf",
      fileSize: 45056, // 44 KB
      categoryId: 3, // internalDocCategory
      uploadedBy: 1, // admin
      tags: ["คำสั่ง", "ระเบียบ"],
      accessRoles: ["admin", "manager"],
      accessDepartments: []
    };
    
    this.createDocument(leaveFormDoc);
    this.createDocument(requisitionFormDoc);
    this.createDocument(officialLetterDoc);
    this.createDocument(trainingFormDoc);
    this.createDocument(internalMemoDoc);
    this.createDocument(hospitalOrderDoc);
    
    // Create workflows
    const leaveApprovalWorkflow: InsertWorkflow = {
      name: "ขั้นตอนการอนุมัติลางาน",
      description: "ลำดับขั้นตอนการอนุมัติการลางานของบุคลากร",
      steps: [
        { order: 1, role: "manager", description: "หัวหน้าแผนก" },
        { order: 2, role: "admin", description: "ฝ่ายบุคคล" }
      ],
      isDefault: true,
      createdBy: 1, // admin
      isLocked: true
    };
    
    const purchaseApprovalWorkflow: InsertWorkflow = {
      name: "ขั้นตอนการอนุมัติจัดซื้อ",
      description: "ลำดับขั้นตอนการอนุมัติการจัดซื้อวัสดุอุปกรณ์",
      steps: [
        { order: 1, role: "manager", description: "หัวหน้าแผนก" },
        { order: 2, role: "admin", description: "ฝ่ายจัดซื้อ" },
        { order: 3, role: "admin", description: "ผู้อำนวยการ" }
      ],
      isDefault: false,
      createdBy: 1, // admin
      isLocked: false
    };
    
    this.createWorkflow(leaveApprovalWorkflow);
    this.createWorkflow(purchaseApprovalWorkflow);
    
    // Create circulation documents
    const leaveRequest: InsertCirculationDocument = {
      title: "ขออนุมัติลาพักร้อน",
      documentNumber: "MEMO-2023-0125",
      content: "ขออนุมัติลาพักร้อนประจำปี จำนวน 5 วัน ตั้งแต่วันที่ 1-5 ก.ค. 2566",
      status: "pending",
      currentStep: 0,
      workflowId: 1, // leaveApprovalWorkflow
      createdBy: 3, // staff1 (สุดา)
      filePath: "/uploads/circulation/leave_request_1.pdf",
      fileType: "pdf",
      assignedTo: 2, // manager (สมชาย)
      comments: [],
      tags: ["ลาพักร้อน"]
    };
    
    const purchaseRequest: InsertCirculationDocument = {
      title: "ขออนุมัติจัดซื้อวัสดุสำนักงาน",
      documentNumber: "MEMO-2023-0129",
      content: "ขออนุมัติจัดซื้อวัสดุสำนักงาน ประจำเดือนมิถุนายน 2566",
      status: "pending",
      currentStep: 0,
      workflowId: 2, // purchaseApprovalWorkflow
      createdBy: 4, // staff2 (ชัยยศ)
      filePath: "/uploads/circulation/purchase_request_1.pdf",
      fileType: "pdf",
      assignedTo: 2, // manager (สมชาย)
      comments: [],
      tags: ["จัดซื้อ", "วัสดุสำนักงาน"]
    };
    
    const planUpdate: InsertCirculationDocument = {
      title: "แจ้งเวียนเรื่องการปรับแผนงานประจำปี",
      documentNumber: "MEMO-2023-0138",
      content: "แจ้งเวียนเรื่องการปรับแผนงานและงบประมาณประจำปี 2566",
      status: "in_progress",
      currentStep: 1,
      workflowId: null, // Custom workflow
      createdBy: 2, // manager (สมชาย)
      filePath: "/uploads/circulation/plan_update_1.pdf",
      fileType: "pdf",
      assignedTo: 1, // admin
      comments: [
        { userId: 2, text: "เอกสารผ่านการตรวจสอบแล้ว", timestamp: new Date() }
      ],
      tags: ["แผนงาน", "งบประมาณ"]
    };
    
    this.createCirculationDocument(leaveRequest);
    this.createCirculationDocument(purchaseRequest);
    this.createCirculationDocument(planUpdate);
    
    // Create activity logs
    const approvalLog: InsertActivityLog = {
      userId: 2, // manager (สมชาย)
      action: "approve",
      resourceType: "circulation",
      resourceId: 123, // Just a placeholder
      details: { documentNumber: "MEMO-2023-0118", title: "ขออนุมัติเข้าร่วมประชุม" }
    };
    
    const uploadLog: InsertActivityLog = {
      userId: 4, // staff2 (ชัยยศ)
      action: "upload",
      resourceType: "storage",
      resourceId: 456, // Just a placeholder
      details: { fileName: "รายงานสรุปการจัดซื้อประจำเดือน.pdf", fileSize: 1024000 }
    };
    
    const createDocLog: InsertActivityLog = {
      userId: 3, // staff1 (สุดา)
      action: "create",
      resourceType: "circulation",
      resourceId: 789, // Just a placeholder
      details: { documentNumber: "MEMO-2023-0125", title: "ขออนุมัติลาพักร้อน" }
    };
    
    const circulationLog: InsertActivityLog = {
      userId: 2, // manager (สมชาย)
      action: "create",
      resourceType: "circulation",
      resourceId: 101, // Just a placeholder
      details: { documentNumber: "MEMO-2023-0138", title: "แจ้งเวียนเรื่องการปรับแผนงานประจำปี" }
    };
    
    this.createActivityLog(approvalLog);
    this.createActivityLog(uploadLog);
    this.createActivityLog(createDocLog);
    this.createActivityLog(circulationLog);
    
    // Create storage files
    const personalFolder: InsertStorageFile = {
      name: "เอกสารส่วนตัว",
      description: "โฟลเดอร์เก็บเอกสารส่วนตัว",
      filePath: "/storage/2/personal",
      fileType: "folder",
      fileSize: 0,
      ownerId: 2, // manager (สมชาย)
      parentId: null,
      isFolder: true,
      accessLevel: "private",
      sharedWith: []
    };
    
    const workFolder: InsertStorageFile = {
      name: "เอกสารงาน",
      description: "โฟลเดอร์เก็บเอกสารงาน",
      filePath: "/storage/2/work",
      fileType: "folder",
      fileSize: 0,
      ownerId: 2, // manager (สมชาย)
      parentId: null,
      isFolder: true,
      accessLevel: "department",
      sharedWith: ["แผนกบุคคล"]
    };
    
    const reportFile: InsertStorageFile = {
      name: "รายงานประจำเดือน พ.ค. 2566",
      description: "รายงานผลการปฏิบัติงานประจำเดือนพฤษภาคม 2566",
      filePath: "/storage/2/work/report_may_2023.pdf",
      fileType: "pdf",
      fileSize: 2048000, // 2 MB
      ownerId: 2, // manager (สมชาย)
      parentId: 2, // workFolder
      isFolder: false,
      accessLevel: "department",
      sharedWith: ["แผนกบุคคล"]
    };
    
    const presentationFile: InsertStorageFile = {
      name: "นำเสนอแผนงานปี 2566",
      description: "สไลด์นำเสนอแผนงานประจำปี 2566",
      filePath: "/storage/2/work/plan_presentation_2023.pptx",
      fileType: "pptx",
      fileSize: 3145728, // 3 MB
      ownerId: 2, // manager (สมชาย)
      parentId: 2, // workFolder
      isFolder: false,
      accessLevel: "department",
      sharedWith: ["แผนกบุคคล"]
    };
    
    this.createStorageFile(personalFolder);
    this.createStorageFile(workFolder);
    this.createStorageFile(reportFile);
    this.createStorageFile(presentationFile);
  }
}

export const storage = new MemStorage();
