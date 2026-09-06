import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, MovementType, ItemStatus } from '../src/types/enums.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for BUSY Stock Control System...');

  await prisma.lowStockAlert.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned previous records.');

  const passwordHash = await bcrypt.hash('Manager@123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@inventory.com',
      password: passwordHash,
      name: 'Sahil Yadav (Inventory Manager)',
      role: Role.MANAGER,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff@inventory.com',
      password: staffPasswordHash,
      name: 'Rohan Sharma (Central Warehouse Lead)',
      role: Role.STAFF,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@inventory.com',
      password: staffPasswordHash,
      name: 'Priya Verma (Retail Dispatcher)',
      role: Role.STAFF,
    },
  });

  console.log('👤 Created Demo Users:');
  console.log('   - Manager: manager@inventory.com / Manager@123');
  console.log('   - Staff: staff@inventory.com / Staff@123');
  console.log('   - Staff 2: staff2@inventory.com / Staff@123');

  const locMain = await prisma.location.create({
    data: {
      name: 'Central Warehouse',
      code: 'WH-MAIN',
      type: 'WAREHOUSE',
      address: 'Plot 42, Logistics Park, Sector 18, Gurugram',
    },
  });

  const locNorth = await prisma.location.create({
    data: {
      name: 'North Distribution Hub',
      code: 'DC-NORTH',
      type: 'WAREHOUSE',
      address: 'Industrial Area Phase 2, Okhla, New Delhi',
    },
  });

  const locStore1 = await prisma.location.create({
    data: {
      name: 'Store 101 - Connaught Place',
      code: 'STR-101',
      type: 'STORE',
      address: 'Block B, Inner Circle, CP, New Delhi',
    },
  });

  const locStore2 = await prisma.location.create({
    data: {
      name: 'Store 102 - Cyber City',
      code: 'STR-102',
      type: 'STORE',
      address: 'Cyber Hub Ground Floor, DLF Cyber City, Gurugram',
    },
  });

  await prisma.userLocation.createMany({
    data: [
      { userId: staff1.id, locationId: locMain.id },
      { userId: staff1.id, locationId: locStore1.id },
      { userId: staff2.id, locationId: locNorth.id },
      { userId: staff2.id, locationId: locStore2.id },
    ],
  });

  console.log('📍 Created Locations & Staff Assignment Matrix.');

  const catElectronics = await prisma.category.create({
    data: { name: 'Electronics', description: 'Computing, peripherals, monitors, and networking equipment' },
  });
  const catOffice = await prisma.category.create({
    data: { name: 'Office Supplies', description: 'Paper, stationery, desk organizers, and writing accessories' },
  });
  const catFurniture = await prisma.category.create({
    data: { name: 'Furniture', description: 'Ergonomic chairs, sit-stand desks, and storage credenzas' },
  });
  const catPackaging = await prisma.category.create({
    data: { name: 'Packaging', description: 'Corrugated cartons, bubble wrap, stretch film, and tapes' },
  });
  const catRaw = await prisma.category.create({
    data: { name: 'Raw Materials', description: 'Metals, fasteners, extrusions, and hardware components' },
  });

  console.log('🏷️ Created 5 Item Categories.');

  const itemsData = [
    { sku: 'ELEC-KB-001', name: 'Mechanical Keyboard (RGB Brown Switch)', unit: 'pcs', reorderLevel: 25, categoryId: catElectronics.id, description: 'Hot-swappable USB-C mechanical keyboard with PBT keycaps' },
    { sku: 'ELEC-MS-002', name: 'Wireless Ergonomic Laser Mouse', unit: 'pcs', reorderLevel: 30, categoryId: catElectronics.id, description: 'Rechargeable multi-device Bluetooth mouse' },
    { sku: 'ELEC-MN-003', name: '27-inch 4K UHD IPS Monitor', unit: 'pcs', reorderLevel: 12, categoryId: catElectronics.id, description: 'Color-calibrated designer display with 90W Type-C power delivery' },
    { sku: 'ELEC-HB-004', name: '10-in-1 Aluminum USB-C Hub', unit: 'pcs', reorderLevel: 20, categoryId: catElectronics.id, description: 'Dual HDMI 4K60Hz, Gigabit Ethernet, SD card slot' },
    { sku: 'OFF-PPR-101', name: 'A4 Copier Paper 80GSM (Carton of 5 Reams)', unit: 'box', reorderLevel: 40, categoryId: catOffice.id, description: 'High brightness 98% jam-free copier paper' },
    { sku: 'OFF-PEN-102', name: 'Gel Ink Rollerball Pens (Box of 50)', unit: 'box', reorderLevel: 15, categoryId: catOffice.id, description: '0.7mm quick-drying waterproof black ink' },
    { sku: 'OFF-STP-103', name: 'Heavy Duty 100-Sheet Stapler', unit: 'pcs', reorderLevel: 10, categoryId: catOffice.id, description: 'All-metal construction with adjustable throat depth' },
    { sku: 'FURN-CHR-201', name: 'Ergonomic High-Back Mesh Chair', unit: 'pcs', reorderLevel: 10, categoryId: catFurniture.id, description: 'Synchronous tilt mechanism with dynamic lumbar support' },
    { sku: 'FURN-DSK-202', name: 'Dual-Motor Electric Standing Desk 140x70cm', unit: 'pcs', reorderLevel: 6, categoryId: catFurniture.id, description: 'Memory presets with anti-collision gyro sensor' },
    { sku: 'FURN-CAB-203', name: '3-Drawer Mobile Filing Cabinet Lockable', unit: 'pcs', reorderLevel: 8, categoryId: catFurniture.id, description: 'Under-desk steel mobile pedestal with master key' },
    { sku: 'PACK-BOX-301', name: 'Double-Wall Heavy Duty Shipping Boxes (Pack of 25)', unit: 'pack', reorderLevel: 50, categoryId: catPackaging.id, description: '18x14x12 inch 32-ECT corrugated kraft boxes' },
    { sku: 'PACK-BBL-302', name: 'Bubble Cushioning Wrap Roll (100m x 0.5m)', unit: 'roll', reorderLevel: 20, categoryId: catPackaging.id, description: 'High-density air retention bubble roll' },
    { sku: 'PACK-TPE-303', name: 'Industrial BOPP Packaging Tape (Pack of 6 Rolls)', unit: 'pack', reorderLevel: 35, categoryId: catPackaging.id, description: '65 Micron heavy-duty adhesive sealing tape' },
    { sku: 'RAW-ALU-401', name: '6063 Aluminum T-Slot Extrusion 2020 (2m)', unit: 'pcs', reorderLevel: 30, categoryId: catRaw.id, description: 'Silver anodized modular aluminum rail profile' },
    { sku: 'RAW-BLT-402', name: 'M8 Stainless Steel Hex Socket Bolts (Box of 100)', unit: 'box', reorderLevel: 40, categoryId: catRaw.id, description: 'Grade 304 anti-corrosion metric fasteners' },
  ];

  const createdItems = new Map<string, any>();
  for (const itemData of itemsData) {
    const item = await prisma.item.create({
      data: itemData,
    });
    createdItems.set(item.sku, item);
  }

  console.log(`📦 Created ${itemsData.length} Items across categories.`);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const movements = [
    { sku: 'ELEC-KB-001', type: MovementType.RECEIPT, qty: 150, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0810', notes: 'Supplier delivery batch #1', daysAgo: 35 },
    { sku: 'ELEC-MS-002', type: MovementType.RECEIPT, qty: 200, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0811', notes: 'Supplier delivery batch #1', daysAgo: 35 },
    { sku: 'ELEC-MN-003', type: MovementType.RECEIPT, qty: 40, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0812', notes: 'Monitors inbound direct import', daysAgo: 30 },
    { sku: 'ELEC-HB-004', type: MovementType.RECEIPT, qty: 80, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0815', notes: 'USB Hubs bulk pallet', daysAgo: 28 },
    { sku: 'OFF-PPR-101', type: MovementType.RECEIPT, qty: 300, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0818', notes: 'Mill direct paper pallets', daysAgo: 25 },
    { sku: 'OFF-PEN-102', type: MovementType.RECEIPT, qty: 100, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0819', notes: 'Gel pens consignment', daysAgo: 25 },
    { sku: 'OFF-STP-103', type: MovementType.RECEIPT, qty: 50, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0820', notes: 'Stationery receipt', daysAgo: 24 },
    { sku: 'FURN-CHR-201', type: MovementType.RECEIPT, qty: 35, dest: locMain.id, user: manager.id, ref: 'PO-2026-0822', notes: 'Container arrival from manufacturer', daysAgo: 20 },
    { sku: 'FURN-DSK-202', type: MovementType.RECEIPT, qty: 20, dest: locMain.id, user: manager.id, ref: 'PO-2026-0823', notes: 'Motorized desk frames and tops', daysAgo: 20 },
    { sku: 'FURN-CAB-203', type: MovementType.RECEIPT, qty: 25, dest: locMain.id, user: manager.id, ref: 'PO-2026-0824', notes: 'Steel pedestals batch', daysAgo: 19 },
    { sku: 'PACK-BOX-301', type: MovementType.RECEIPT, qty: 250, dest: locNorth.id, user: staff2.id, ref: 'PO-2026-0825', notes: 'Direct receipt at North Hub', daysAgo: 18 },
    { sku: 'PACK-BBL-302', type: MovementType.RECEIPT, qty: 120, dest: locNorth.id, user: staff2.id, ref: 'PO-2026-0826', notes: 'Bubble wrap shipment', daysAgo: 18 },
    { sku: 'PACK-TPE-303', type: MovementType.RECEIPT, qty: 180, dest: locNorth.id, user: staff2.id, ref: 'PO-2026-0827', notes: 'Tape packs delivery', daysAgo: 17 },
    { sku: 'RAW-ALU-401', type: MovementType.RECEIPT, qty: 100, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0830', notes: 'Aluminum rails bundle', daysAgo: 15 },
    { sku: 'RAW-BLT-402', type: MovementType.RECEIPT, qty: 150, dest: locMain.id, user: staff1.id, ref: 'PO-2026-0831', notes: 'Fasteners cartons', daysAgo: 15 },

    { sku: 'ELEC-KB-001', type: MovementType.TRANSFER, qty: 30, src: locMain.id, dest: locStore1.id, user: staff1.id, ref: 'TR-2026-0901', notes: 'Store 101 stock replenishment', daysAgo: 14 },
    { sku: 'ELEC-KB-001', type: MovementType.TRANSFER, qty: 25, src: locMain.id, dest: locStore2.id, user: staff1.id, ref: 'TR-2026-0902', notes: 'Store 102 stock replenishment', daysAgo: 14 },
    { sku: 'ELEC-MS-002', type: MovementType.TRANSFER, qty: 45, src: locMain.id, dest: locStore1.id, user: staff1.id, ref: 'TR-2026-0903', notes: 'Transfer to CP Store', daysAgo: 12 },
    { sku: 'ELEC-MN-003', type: MovementType.TRANSFER, qty: 10, src: locMain.id, dest: locStore1.id, user: staff1.id, ref: 'TR-2026-0904', notes: 'Display inventory transfer', daysAgo: 10 },
    { sku: 'OFF-PPR-101', type: MovementType.TRANSFER, qty: 50, src: locMain.id, dest: locStore1.id, user: staff1.id, ref: 'TR-2026-0905', notes: 'Store replenishment', daysAgo: 9 },
    { sku: 'PACK-BOX-301', type: MovementType.TRANSFER, qty: 60, src: locNorth.id, dest: locMain.id, user: staff2.id, ref: 'TR-2026-0906', notes: 'Inter-warehouse balancing', daysAgo: 8 },

    { sku: 'ELEC-KB-001', type: MovementType.ISSUE, qty: 28, src: locStore1.id, user: staff1.id, ref: 'SO-CP-4401', notes: 'Customer sales orders', daysAgo: 6 },
    { sku: 'ELEC-KB-001', type: MovementType.ISSUE, qty: 20, src: locStore2.id, user: staff2.id, ref: 'SO-CYBER-882', notes: 'Corporate office setup order', daysAgo: 5 },
    { sku: 'ELEC-MS-002', type: MovementType.ISSUE, qty: 40, src: locStore1.id, user: staff1.id, ref: 'SO-CP-4405', notes: 'Bulk peripheral sale', daysAgo: 4 },
    { sku: 'ELEC-MN-003', type: MovementType.ISSUE, qty: 8, src: locStore1.id, user: staff1.id, ref: 'SO-CP-4410', notes: 'High-end monitor sales', daysAgo: 3 },
    { sku: 'OFF-PPR-101', type: MovementType.ISSUE, qty: 45, src: locStore1.id, user: staff1.id, ref: 'SO-CP-4412', notes: 'Law firm quarterly contract', daysAgo: 2 },
    { sku: 'FURN-DSK-202', type: MovementType.ISSUE, qty: 17, src: locMain.id, user: manager.id, ref: 'SO-HQ-1092', notes: 'Delivered to tech startup HQ', daysAgo: 1 },

    { sku: 'ELEC-MN-003', type: MovementType.ADJUSTMENT, qty: -1, dest: locMain.id, user: manager.id, ref: 'AUDIT-DAMAGED-01', notes: '1 unit damaged during forklift movement, written off per audit policy', daysAgo: 2 },
    { sku: 'RAW-BLT-402', type: MovementType.ADJUSTMENT, qty: 5, dest: locMain.id, user: manager.id, ref: 'AUDIT-FOUND-02', notes: 'Physical count found 5 extra boxes from unrecorded vendor return', daysAgo: 1 },
  ];

  for (const m of movements) {
    const item = createdItems.get(m.sku);
    if (!item) continue;

    const createdAt = new Date(now - m.daysAgo * oneDay);

    await prisma.stockMovement.create({
      data: {
        itemId: item.id,
        type: m.type,
        quantity: m.qty,
        sourceLocationId: (m as any).src || null,
        destinationLocationId: (m as any).dest || null,
        userId: m.user,
        reference: m.ref || null,
        notes: m.notes || null,
        createdAt,
      },
    });
  }

  console.log(`📜 Recorded ${movements.length} Append-Only Stock Movements.`);

  const allItems = await prisma.item.findMany();
  for (const item of allItems) {
    const itemMovements = await prisma.stockMovement.findMany({ where: { itemId: item.id } });
    let totalStock = 0;
    for (const im of itemMovements) {
      if (im.type === MovementType.RECEIPT) totalStock += im.quantity;
      else if (im.type === MovementType.ISSUE) totalStock -= im.quantity;
      else if (im.type === MovementType.ADJUSTMENT) totalStock += im.quantity;
    }

    if (totalStock <= item.reorderLevel) {
      await prisma.lowStockAlert.create({
        data: {
          itemId: item.id,
          currentStock: totalStock,
          reorderLevel: item.reorderLevel,
          status: 'ACTIVE',
        },
      });
      console.log(`   ⚠️ Low Stock Alert generated for '${item.name}' (Stock: ${totalStock}, ReorderLevel: ${item.reorderLevel})`);
    }
  }

  console.log('✅ Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
