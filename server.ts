import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_BOM,
  INITIAL_MANUFACTURING_ORDERS,
  INITIAL_LEDGER,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MICROSERVICES,
  INITIAL_CLOUD_CONFIG,
} from './src/data/mockData';
import {
  generateOtpCode,
  generateStrongPassword,
  calculatePasswordEntropy,
  computeTxHash,
  simulateE2EEncrypt,
  simulateE2EDecrypt,
} from './src/utils/crypto';
import { ManufacturingOrder, WorkOrder, InventoryTransaction, PurchaseOrder, AuditLogEntry, BomItem, Role } from './src/types/mrp';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent database states
  let users = [...INITIAL_USERS];
  let bomData = JSON.parse(JSON.stringify(INITIAL_BOM)) as BomItem[];
  let manufacturingOrders = JSON.parse(JSON.stringify(INITIAL_MANUFACTURING_ORDERS)) as ManufacturingOrder[];
  let inventoryLedger = JSON.parse(JSON.stringify(INITIAL_LEDGER)) as InventoryTransaction[];
  let purchaseOrders = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS)) as PurchaseOrder[];
  let auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)) as AuditLogEntry[];
  let microservices = JSON.parse(JSON.stringify(INITIAL_MICROSERVICES));
  let cloudConfig = { ...INITIAL_CLOUD_CONFIG };

  // OTP Active Tokens Store
  const otpStore = new Map<string, { code: string; expiresAt: number }>();

  // Rate Limiting Token Bucket state
  let totalApiRequests = 1420;
  let blockedApiRequests = 142;
  let tokensAvailable = 100;
  const maxBucketCapacity = 100;
  let currentRps = 48;
  const clientIps = new Set<string>(['192.168.10.45', '192.168.10.82', '192.168.20.104', '185.220.101.5']);

  // Rate Limiting Middleware
  app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
    totalApiRequests++;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    clientIps.add(ip);

    // Simulate Token Bucket refilling
    if (tokensAvailable < maxBucketCapacity) {
      tokensAvailable = Math.min(maxBucketCapacity, tokensAvailable + 2);
    }

    // Check if IP is flagged or bucket exhausted
    if (ip === '185.220.101.5' || tokensAvailable <= 0) {
      blockedApiRequests++;
      // Log blocked attempt
      const logId = `aud_block_${Date.now()}`;
      auditLogs.unshift({
        id: logId,
        timestamp: new Date().toISOString(),
        userId: 'ANONYMOUS_SCRAPER',
        userEmail: 'unauthorized@external.ip',
        userRole: 'SHOP_FLOOR_OPERATOR',
        actionType: 'RATE_LIMIT_BLOCKED',
        resourceTarget: req.path,
        detailsEncrypted: simulateE2EEncrypt(`Throttled suspicious API scrape request from IP: ${ip}`),
        detailsDecryptedForAdmin: `Throttled suspicious API scrape request from IP: ${ip}`,
        ipAddress: ip,
        complianceFlag: 'SECURITY_ALERT',
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Suspicious scraping activity blocked by Security Gateway.',
        retryAfterSeconds: 30,
        tokensAvailable: 0,
      });
    }

    tokensAvailable--;
    res.setHeader('X-RateLimit-Limit', maxBucketCapacity.toString());
    res.setHeader('X-RateLimit-Remaining', tokensAvailable.toString());
    res.setHeader('X-E2E-Encryption', 'AES-256-GCM');
    next();
  });

  // --- AUTHENTICATION & SECURITY ENDPOINTS ---

  // Generate OTP
  app.post('/api/auth/otp/send', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const otpObj = generateOtpCode();
    otpStore.set(email, otpObj);

    // Record audit log
    auditLogs.unshift({
      id: `aud_otp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'AUTH_SERVICE',
      userEmail: email,
      userRole: 'SHOP_FLOOR_OPERATOR',
      actionType: 'LOGIN_OTP',
      resourceTarget: 'EMAIL_OTP_DISPATCH',
      detailsEncrypted: simulateE2EEncrypt(`Dispatched 6-digit OTP code to ${email}`),
      detailsDecryptedForAdmin: `Dispatched 6-digit OTP code to ${email}`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || '192.168.10.45',
      complianceFlag: 'NORMAL',
    });

    res.json({
      success: true,
      message: `OTP generated and dispatched to ${email}`,
      otpPreviewForDemo: otpObj.code, // Returned for easy testing in UI
      expiresInSeconds: 300,
    });
  });

  // Verify OTP
  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    const { email, code } = req.body;
    const stored = otpStore.get(email);

    if (!stored) {
      // Demo fallback: Accept 123456 or match demo preview
      if (code === '123456') {
        let user = users.find((u) => u.email === email);
        if (!user) {
          user = {
            id: `usr_${Date.now()}`,
            email,
            name: email.split('@')[0],
            role: 'SHOP_FLOOR_OPERATOR',
            isTwoFactorEnabled: true,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            department: 'Production Floor',
          };
          users.push(user);
        }
        return res.json({ success: true, user, isTwoFactorRequired: user.isTwoFactorEnabled });
      }
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP code has expired. Request a new code.' });
    }

    if (stored.code !== code && code !== '123456') {
      return res.status(400).json({ error: 'Invalid OTP code entered.' });
    }

    otpStore.delete(email);
    let user = users.find((u) => u.email === email);
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'PLANT_MANAGER',
        isTwoFactorEnabled: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        department: 'Operations',
      };
      users.push(user);
    } else {
      user.lastLogin = new Date().toISOString();
    }

    res.json({ success: true, user, isTwoFactorRequired: user.isTwoFactorEnabled });
  });

  // Strong Password Generator API
  app.post('/api/auth/password/generate', (req: Request, res: Response) => {
    const { length = 16, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = true } = req.body;
    const password = generateStrongPassword({
      length: Number(length),
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    });
    const entropy = calculatePasswordEntropy(password);

    res.json({
      password,
      entropyScore: entropy.score,
      strengthLabel: entropy.label,
      bitsOfEntropy: entropy.bits,
    });
  });

  // 2FA TOTP Verification
  app.post('/api/auth/2fa/verify', (req: Request, res: Response) => {
    const { code, userEmail } = req.body;
    // Accept 6-digit TOTP code
    if (!code || code.length !== 6) {
      return res.status(400).json({ error: '2FA TOTP code must be 6 digits.' });
    }

    auditLogs.unshift({
      id: `aud_2fa_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: '2FA_SERVICE',
      userEmail: userEmail || 'user@factory-mrp.com',
      userRole: 'ADMIN',
      actionType: '2FA_VERIFY',
      resourceTarget: 'SECURITY_2FA_CHALLENGE',
      detailsEncrypted: simulateE2EEncrypt('Verified Time-based One-Time Password (TOTP) successfully.'),
      detailsDecryptedForAdmin: 'Verified Time-based One-Time Password (TOTP) successfully.',
      ipAddress: (req.headers['x-forwarded-for'] as string) || '192.168.10.45',
      complianceFlag: 'NORMAL',
    });

    res.json({
      success: true,
      message: '2FA Verification Successful.',
      sessionToken: `mrp_jwt_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    });
  });

  // Password Recovery
  app.post('/api/auth/password/recover', (req: Request, res: Response) => {
    const { email } = req.body;
    res.json({
      success: true,
      message: `Password reset link with E2E encrypted token sent to ${email}`,
    });
  });

  // --- MRP & RECURSIVE BOM ENDPOINTS ---

  // Get Recursive BOM Tree
  app.get('/api/mrp/bom', (req: Request, res: Response) => {
    res.json({ bom: bomData });
  });

  // Add new item to BOM
  app.post('/api/mrp/bom', (req: Request, res: Response) => {
    const newItem: BomItem = req.body;
    if (!newItem.partNumber || !newItem.name) {
      return res.status(400).json({ error: 'Part Number and Name are required.' });
    }
    newItem.id = `bom_${Date.now()}`;
    bomData.push(newItem);

    auditLogs.unshift({
      id: `aud_bom_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr_002',
      userEmail: 'plant.mgr@factory-mrp.com',
      userRole: 'PLANT_MANAGER',
      actionType: 'CREATE_MO',
      resourceTarget: newItem.partNumber,
      detailsEncrypted: simulateE2EEncrypt(`Added new BOM component ${newItem.partNumber} (${newItem.name})`),
      detailsDecryptedForAdmin: `Added new BOM component ${newItem.partNumber} (${newItem.name})`,
      ipAddress: '192.168.10.82',
      complianceFlag: 'NORMAL',
    });

    res.json({ success: true, item: newItem });
  });

  // Exploded BOM Calculator: Computes total raw materials needed recursively for target production quantity
  app.get('/api/mrp/bom/explode/:partNumber', (req: Request, res: Response) => {
    const { partNumber } = req.params;
    const targetQty = Number(req.query.quantity) || 1;

    // Helper function to recursively traverse BOM
    function explode(item: BomItem, multiplier: number): { partNumber: string; name: string; requiredQty: number; uom: string; unitCost: number; totalCost: number; stock: number; reorderNeeded: boolean }[] {
      let results: any[] = [];
      const itemScrapMultiplier = 1 + (item.scrapFactor || 0);
      const neededForThisLevel = item.quantityRequired * multiplier * itemScrapMultiplier;

      results.push({
        partNumber: item.partNumber,
        name: item.name,
        category: item.category,
        requiredQty: Math.ceil(neededForThisLevel),
        uom: item.unitOfMeasure,
        unitCost: item.unitCost,
        totalCost: Math.ceil(neededForThisLevel) * item.unitCost,
        stock: item.currentStock,
        reorderNeeded: item.currentStock < Math.ceil(neededForThisLevel),
      });

      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          results = results.concat(explode(child, neededForThisLevel));
        }
      }
      return results;
    }

    const rootItem = bomData.find((b) => b.partNumber === partNumber);
    if (!rootItem) {
      return res.status(404).json({ error: `Part Number ${partNumber} not found in BOM catalog.` });
    }

    const requirements = explode(rootItem, targetQty);
    const totalAssemblyCost = requirements.reduce((acc, curr) => acc + curr.totalCost, 0);

    res.json({
      productPartNumber: partNumber,
      targetQuantity: targetQty,
      explodedRequirements: requirements,
      totalCalculatedCost: totalAssemblyCost,
    });
  });

  // --- MANUFACTURING ORDERS & WORK ORDERS STATE ENGINE ---

  app.get('/api/mrp/orders', (req: Request, res: Response) => {
    res.json({ orders: manufacturingOrders });
  });

  // Create new Manufacturing Order (MO)
  app.post('/api/mrp/orders', (req: Request, res: Response) => {
    const { productPartNumber, productName, targetQuantity, priority = 'MEDIUM', createdBy = 'plant.mgr@factory-mrp.com' } = req.body;

    if (!productPartNumber || !targetQuantity) {
      return res.status(400).json({ error: 'Product Part Number and Target Quantity are required.' });
    }

    const moId = `mo_${Date.now()}`;
    const orderNumber = `MO-${Math.floor(80000 + Math.random() * 9999)}`;

    // Auto-generate standard Work Orders based on product BOM operations
    let workOrders: WorkOrder[] = [];

    if (productPartNumber === 'TBL-WOOD-001') {
      workOrders = [
        {
          id: `wo_${moId}_01`,
          moId,
          sequence: 1,
          operationName: 'Assembly (Screws & Joint Fastening)',
          workCenter: 'Assembly Line Alpha',
          status: 'PLANNED',
          plannedDurationHours: 1.0,
          materialsRequired: [
            { partNumber: 'LEG-WOOD-01', name: 'Wooden Table Leg', qty: targetQuantity * 4, uom: 'PCS', issued: false },
            { partNumber: 'TOP-OAK-01', name: 'Oak Table Top Slab', qty: targetQuantity, uom: 'PCS', issued: false },
            { partNumber: 'SCR-STL-12', name: 'Steel Screws', qty: targetQuantity * 12, uom: 'PCS', issued: false },
          ],
        },
        {
          id: `wo_${moId}_02`,
          moId,
          sequence: 2,
          operationName: 'Painting & Gloss Varnish Coating',
          workCenter: 'Paint Floor Beta',
          status: 'PLANNED',
          plannedDurationHours: 0.5,
          materialsRequired: [
            { partNumber: 'VAR-GLOSS-01', name: 'Polyurethane Gloss Varnish', qty: targetQuantity, uom: 'BTL', issued: false },
          ],
        },
        {
          id: `wo_${moId}_03`,
          moId,
          sequence: 3,
          operationName: 'Packing & Protective Crate Shipping',
          workCenter: 'Packaging Line Gamma',
          status: 'PLANNED',
          plannedDurationHours: 0.33,
          materialsRequired: [
            { partNumber: productPartNumber, name: productName || productPartNumber, qty: targetQuantity, uom: 'UNIT', issued: false },
          ],
        },
      ];
    } else {
      workOrders = [
        {
          id: `wo_${moId}_01`,
          moId,
          sequence: 1,
          operationName: 'Sub-assembly 1: Battery & Module Stacking',
          workCenter: 'Station Alpha - Battery Bay',
          status: 'PLANNED',
          plannedDurationHours: 10,
          materialsRequired: [{ partNumber: 'BAT-PACK-100KWH', name: '100kWh Battery Pack', qty: targetQuantity, uom: 'UNIT', issued: false }],
        },
        {
          id: `wo_${moId}_02`,
          moId,
          sequence: 2,
          operationName: 'Sub-assembly 2: Motor Stator Winding',
          workCenter: 'Station Beta - Precision Winding',
          status: 'PLANNED',
          plannedDurationHours: 12,
          materialsRequired: [{ partNumber: 'MOT-DUAL-400KW', name: 'Dual Permanent Magnet Motor', qty: targetQuantity, uom: 'UNIT', issued: false }],
        },
        {
          id: `wo_${moId}_03`,
          moId,
          sequence: 3,
          operationName: 'Final Assembly & Dynamometer Testing',
          workCenter: 'Station Delta - End of Line QA',
          status: 'PLANNED',
          plannedDurationHours: 8,
          materialsRequired: [{ partNumber: productPartNumber, name: productName || productPartNumber, qty: targetQuantity, uom: 'UNIT', issued: false }],
        },
      ];
    }

    const newMo: ManufacturingOrder = {
      id: moId,
      orderNumber,
      productPartNumber,
      productName: productName || productPartNumber,
      targetQuantity: Number(targetQuantity),
      completedQuantity: 0,
      status: 'PLANNED',
      startDate: new Date().toISOString(),
      targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority,
      totalEstimatedCost: targetQuantity * 14500,
      createdBy,
      workOrders,
    };

    manufacturingOrders.unshift(newMo);

    auditLogs.unshift({
      id: `aud_mo_create_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr_002',
      userEmail: createdBy,
      userRole: 'PLANT_MANAGER',
      actionType: 'CREATE_MO',
      resourceTarget: orderNumber,
      detailsEncrypted: simulateE2EEncrypt(`Created new Manufacturing Order ${orderNumber} for Qty: ${targetQuantity}`),
      detailsDecryptedForAdmin: `Created new Manufacturing Order ${orderNumber} for Qty: ${targetQuantity}`,
      ipAddress: '192.168.10.82',
      complianceFlag: 'NORMAL',
    });

    res.json({ success: true, order: newMo });
  });

  // State-driven workflow update: Update Work Order Status (PLANNED -> IN_PROGRESS -> DONE)
  app.put('/api/mrp/workorders/:woId/status', (req: Request, res: Response) => {
    const { woId } = req.params;
    const { newStatus, operatorEmail = 'operator1@factory-mrp.com' } = req.body;

    // Find MO & WO
    let parentMo: ManufacturingOrder | undefined;
    let targetWo: WorkOrder | undefined;

    for (const mo of manufacturingOrders) {
      const wo = mo.workOrders.find((w) => w.id === woId);
      if (wo) {
        parentMo = mo;
        targetWo = wo;
        break;
      }
    }

    if (!parentMo || !targetWo) {
      return res.status(404).json({ error: 'Work Order not found.' });
    }

    // Workflow state transition validation rules
    const validTransitions: Record<string, string[]> = {
      PLANNED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['DONE', 'CANCELLED'],
      DONE: [],
      CANCELLED: [],
    };

    if (!validTransitions[targetWo.status]?.includes(newStatus)) {
      return res.status(400).json({
        error: `Invalid State Transition: Cannot transition Work Order from ${targetWo.status} to ${newStatus}. Must follow sequence: PLANNED -> IN_PROGRESS -> DONE.`,
      });
    }

    // Enforce sequence constraint: Cannot start WO sequence 2 if WO sequence 1 is not DONE
    if (newStatus === 'IN_PROGRESS' && targetWo.sequence > 1) {
      const prevWo = parentMo.workOrders.find((w) => w.sequence === targetWo!.sequence - 1);
      if (prevWo && prevWo.status !== 'DONE') {
        return res.status(400).json({
          error: `Workflow Prerequisite Violation: Prior operation '${prevWo.operationName}' (Sequence ${prevWo.sequence}) must be completed (DONE) before starting Sequence ${targetWo.sequence}.`,
        });
      }
    }

    // Apply state change
    const oldStatus = targetWo.status;
    targetWo.status = newStatus;
    targetWo.assignedOperator = operatorEmail;

    if (newStatus === 'IN_PROGRESS') {
      targetWo.startTime = new Date().toISOString();
      if (parentMo.status === 'PLANNED') {
        parentMo.status = 'IN_PROGRESS';
      }
      // Material Issue trigger: deduct materials from stock & record in atomic inventory ledger
      targetWo.materialsRequired.forEach((mat) => {
        mat.issued = true;
        const lastTx = inventoryLedger[0];
        const lastHash = lastTx ? lastTx.txHash : '0x0000000000000000';
        const newTxHash = computeTxHash(lastHash, `${mat.partNumber}:-${mat.qty}`);

        inventoryLedger.unshift({
          id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          partNumber: mat.partNumber,
          partName: mat.name,
          type: 'CONSUMPTION_WO',
          quantityChange: -mat.qty,
          balanceAfter: 1000 - mat.qty, // Simulated balance
          referenceId: targetWo!.id,
          unitCost: 150,
          performedBy: operatorEmail,
          txHash: newTxHash,
          location: targetWo!.workCenter,
        });
      });
    } else if (newStatus === 'DONE') {
      targetWo.endTime = new Date().toISOString();
      targetWo.actualDurationHours = targetWo.plannedDurationHours;

      // Check if all WOs for this MO are done
      const allDone = parentMo.workOrders.every((w) => w.status === 'DONE');
      if (allDone) {
        parentMo.status = 'DONE';
        parentMo.completedQuantity = parentMo.targetQuantity;
        parentMo.actualCompletionDate = new Date().toISOString();

        // Stock in finished goods to inventory ledger
        const lastTx = inventoryLedger[0];
        const lastHash = lastTx ? lastTx.txHash : '0x0000000000000000';
        const newTxHash = computeTxHash(lastHash, `${parentMo.productPartNumber}:+${parentMo.targetQuantity}`);

        inventoryLedger.unshift({
          id: `tx_fin_${Date.now()}`,
          timestamp: new Date().toISOString(),
          partNumber: parentMo.productPartNumber,
          partName: parentMo.productName,
          type: 'PRODUCTION_MO',
          quantityChange: parentMo.targetQuantity,
          balanceAfter: 18 + parentMo.targetQuantity,
          referenceId: parentMo.orderNumber,
          unitCost: 14500,
          performedBy: operatorEmail,
          txHash: newTxHash,
          location: 'Finished Goods Warehouse Alpha',
        });
      }
    }

    auditLogs.unshift({
      id: `aud_wo_status_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr_003',
      userEmail: operatorEmail,
      userRole: 'SHOP_FLOOR_OPERATOR',
      actionType: 'UPDATE_WO_STATUS',
      resourceTarget: targetWo.id,
      detailsEncrypted: simulateE2EEncrypt(`Transitioned Work Order ${targetWo.operationName} from ${oldStatus} to ${newStatus}`),
      detailsDecryptedForAdmin: `Transitioned Work Order ${targetWo.operationName} from ${oldStatus} to ${newStatus}`,
      ipAddress: '192.168.20.104',
      complianceFlag: 'NORMAL',
    });

    res.json({
      success: true,
      workOrder: targetWo,
      parentMoStatus: parentMo.status,
    });
  });

  // --- REAL-TIME ATOMIC INVENTORY LEDGER ENDPOINTS ---

  app.get('/api/mrp/ledger', (req: Request, res: Response) => {
    res.json({ ledger: inventoryLedger });
  });

  // Manual stock adjustment / Inventory Ledger post
  app.post('/api/mrp/ledger/adjust', (req: Request, res: Response) => {
    const { partNumber, partName, quantityChange, type = 'ADJUSTMENT', location = 'Warehouse Main', performedBy = 'plant.mgr@factory-mrp.com' } = req.body;

    if (!partNumber || !quantityChange) {
      return res.status(400).json({ error: 'Part Number and Quantity Change are required.' });
    }

    const lastTx = inventoryLedger[0];
    const lastHash = lastTx ? lastTx.txHash : '0x0000000000000000';
    const changeVal = Number(quantityChange);
    const newTxHash = computeTxHash(lastHash, `${partNumber}:${changeVal > 0 ? '+' : ''}${changeVal}`);

    const newTx: InventoryTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
      partNumber,
      partName: partName || partNumber,
      type,
      quantityChange: changeVal,
      balanceAfter: Math.max(0, 1000 + changeVal),
      referenceId: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
      unitCost: 120,
      performedBy,
      txHash: newTxHash,
      location,
    };

    inventoryLedger.unshift(newTx);

    auditLogs.unshift({
      id: `aud_adj_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr_002',
      userEmail: performedBy,
      userRole: 'PLANT_MANAGER',
      actionType: 'STOCK_ADJUSTMENT',
      resourceTarget: partNumber,
      detailsEncrypted: simulateE2EEncrypt(`Manual inventory ledger movement ${changeVal > 0 ? '+' : ''}${changeVal} for ${partNumber}`),
      detailsDecryptedForAdmin: `Manual inventory ledger movement ${changeVal > 0 ? '+' : ''}${changeVal} for ${partNumber}`,
      ipAddress: '192.168.10.82',
      complianceFlag: 'SENSITIVE',
    });

    res.json({ success: true, transaction: newTx });
  });

  // --- PROCUREMENT DATABASE INTEGRATION ---

  app.get('/api/procurement/orders', (req: Request, res: Response) => {
    res.json({ purchaseOrders });
  });

  app.post('/api/procurement/orders', (req: Request, res: Response) => {
    const { supplierName, partNumber, partName, quantityOrdered, unitPrice, createdReason } = req.body;

    const poNumber = `PO-${Math.floor(9000 + Math.random() * 1000)}`;
    const newPo: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber,
      supplierName: supplierName || 'Global Metals Direct',
      partNumber,
      partName: partName || partNumber,
      quantityOrdered: Number(quantityOrdered),
      unitPrice: Number(unitPrice),
      totalCost: Number(quantityOrdered) * Number(unitPrice),
      status: 'APPROVED',
      orderDate: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdReason: createdReason || 'Procurement Reorder Trigger',
    };

    purchaseOrders.unshift(newPo);

    res.json({ success: true, order: newPo });
  });

  // Receive Purchase Order -> Stock Injection into Inventory Ledger
  app.put('/api/procurement/orders/:poId/receive', (req: Request, res: Response) => {
    const { poId } = req.params;
    const po = purchaseOrders.find((p) => p.id === poId);

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    po.status = 'RECEIVED';

    // Inject stock into inventory ledger
    const lastTx = inventoryLedger[0];
    const lastHash = lastTx ? lastTx.txHash : '0x0000000000000000';
    const newTxHash = computeTxHash(lastHash, `${po.partNumber}:+${po.quantityOrdered}`);

    const newTx: InventoryTransaction = {
      id: `tx_po_rcv_${Date.now()}`,
      timestamp: new Date().toISOString(),
      partNumber: po.partNumber,
      partName: po.partName,
      type: 'PROCUREMENT_RECEIPT',
      quantityChange: po.quantityOrdered,
      balanceAfter: 5000 + po.quantityOrdered,
      referenceId: po.poNumber,
      unitCost: po.unitPrice,
      performedBy: 'procurement@factory-mrp.com',
      txHash: newTxHash,
      location: 'Receiving Dock Alpha',
    };

    inventoryLedger.unshift(newTx);

    res.json({ success: true, purchaseOrder: po, ledgerEntry: newTx });
  });

  // --- AUDIT LOGGING & RBAC COMPLIANCE ENDPOINTS ---

  app.get('/api/security/audit', (req: Request, res: Response) => {
    const { role = 'ADMIN' } = req.query;

    // Decrypt details for ADMIN or AUDITOR_COMPLIANCE, keep encrypted string for others
    const logsProcessed = auditLogs.map((log) => {
      if (role === 'ADMIN' || role === 'AUDITOR_COMPLIANCE') {
        return {
          ...log,
          decryptedDetails: log.detailsDecryptedForAdmin || simulateE2EDecrypt(log.detailsEncrypted),
        };
      }
      return {
        ...log,
        decryptedDetails: '•••••••• [E2E Encrypted Payload - Requires Admin/Auditor Key]',
      };
    });

    res.json({ auditLogs: logsProcessed });
  });

  // --- API RATE LIMITING METRICS ---

  app.get('/api/security/ratelimit', (req: Request, res: Response) => {
    res.json({
      status: {
        totalRequests: totalApiRequests,
        blockedRequests: blockedApiRequests,
        currentRps,
        tokensAvailable,
        maxBucketCapacity,
        activeIpCount: clientIps.size,
      },
    });
  });

  // --- MICROSERVICES METRICS & SCALABILITY ---

  app.get('/api/microservices/metrics', (req: Request, res: Response) => {
    res.json({ services: microservices });
  });

  app.post('/api/microservices/surge', (req: Request, res: Response) => {
    // Simulate traffic surge and trigger Horizontal Pod Autoscaler (HPA)
    microservices = microservices.map((svc: any) => {
      const isMrp = svc.serviceName.includes('BOM') || svc.serviceName.includes('Ledger');
      return {
        ...svc,
        instancesCount: isMrp ? svc.instancesCount + 3 : svc.instancesCount + 1,
        cpuUtilizationPct: Math.min(88, svc.cpuUtilizationPct + 25),
        throughputRps: Math.round(svc.throughputRps * 1.8),
        status: 'SURGE',
      };
    });

    res.json({ success: true, services: microservices, message: 'HPA Autoscaler dynamically provisioned +8 microservice pods.' });
  });

  // --- CLOUD STORAGE INTEGRATION ENDPOINTS ---

  app.get('/api/cloud/sync', (req: Request, res: Response) => {
    res.json({ config: cloudConfig });
  });

  app.post('/api/cloud/sync', (req: Request, res: Response) => {
    const { provider } = req.body;
    cloudConfig.syncStatus = 'SYNCING';
    if (provider) cloudConfig.provider = provider;

    setTimeout(() => {
      cloudConfig.syncStatus = 'SUCCESS';
      cloudConfig.lastSyncTimestamp = new Date().toISOString();
    }, 1500);

    auditLogs.unshift({
      id: `aud_cloud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr_001',
      userEmail: 'admin@factory-mrp.com',
      userRole: 'ADMIN',
      actionType: 'CLOUD_SYNC',
      resourceTarget: cloudConfig.bucketName,
      detailsEncrypted: simulateE2EEncrypt(`Backed up MRP ledger snapshot to ${cloudConfig.provider} (${cloudConfig.bucketName})`),
      detailsDecryptedForAdmin: `Backed up MRP ledger snapshot to ${cloudConfig.provider} (${cloudConfig.bucketName})`,
      ipAddress: '192.168.10.45',
      complianceFlag: 'NORMAL',
    });

    res.json({ success: true, message: `Sync initiated with ${cloudConfig.provider}. Snapshot archived to ${cloudConfig.bucketName}` });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
