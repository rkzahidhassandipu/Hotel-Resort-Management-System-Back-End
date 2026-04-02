import { PrismaClient } from '../../generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Create Admin User ─────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      email: 'admin@hotel.com',
      firstName: 'System',
      lastName: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      staffProfile: {
        create: {
          employeeId: 'EMP-001',
          department: 'Management',
          designation: 'System Administrator',
          joiningDate: new Date(),
          salary: 100000,
          shift: 'FLEXIBLE',
        },
      },
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ── Create Manager ────────────────────────────────────────
  const managerPassword = await bcrypt.hash('Manager@1234', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@hotel.com' },
    update: {},
    create: {
      email: 'manager@hotel.com',
      firstName: 'Hotel',
      lastName: 'Manager',
      password: managerPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      staffProfile: {
        create: {
          employeeId: 'EMP-002',
          department: 'Operations',
          designation: 'General Manager',
          joiningDate: new Date(),
          salary: 75000,
          shift: 'MORNING',
        },
      },
    },
  });
  console.log('✅ Manager created:', manager.email);

  // ── Create Room Categories ────────────────────────────────
  const standardCat = await prisma.roomCategory.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      description: 'Comfortable standard rooms',
      basePrice: 5000,
      weekendPrice: 6000,
      maxOccupancy: 2,
    },
  });

  const deluxeCat = await prisma.roomCategory.upsert({
    where: { name: 'Deluxe' },
    update: {},
    create: {
      name: 'Deluxe',
      description: 'Premium deluxe rooms with extra amenities',
      basePrice: 8000,
      weekendPrice: 10000,
      maxOccupancy: 2,
    },
  });

  const suiteCat = await prisma.roomCategory.upsert({
    where: { name: 'Suite' },
    update: {},
    create: {
      name: 'Suite',
      description: 'Luxurious suite with living area',
      basePrice: 15000,
      weekendPrice: 18000,
      maxOccupancy: 4,
    },
  });
  console.log('✅ Room categories created');

  // ── Create Rooms ──────────────────────────────────────────
  const rooms = [
    { roomNumber: '101', floor: 1, type: 'SINGLE' as const, bedType: 'SINGLE' as const, maxOccupancy: 1, categoryId: standardCat.id },
    { roomNumber: '102', floor: 1, type: 'DOUBLE' as const, bedType: 'DOUBLE' as const, maxOccupancy: 2, categoryId: standardCat.id },
    { roomNumber: '103', floor: 1, type: 'TWIN' as const, bedType: 'TWIN' as const, maxOccupancy: 2, categoryId: standardCat.id },
    { roomNumber: '201', floor: 2, type: 'DOUBLE' as const, bedType: 'QUEEN' as const, maxOccupancy: 2, categoryId: deluxeCat.id },
    { roomNumber: '202', floor: 2, type: 'DELUXE' as const, bedType: 'KING' as const, maxOccupancy: 3, categoryId: deluxeCat.id },
    { roomNumber: '301', floor: 3, type: 'SUITE' as const, bedType: 'KING' as const, maxOccupancy: 4, categoryId: suiteCat.id },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: { ...room, status: 'AVAILABLE', isActive: true },
    });
  }
  console.log('✅ Rooms created');

  // ── Create Menu Categories ────────────────────────────────
  const menuCats = [
    { name: 'Breakfast', sortOrder: 1 },
    { name: 'Lunch', sortOrder: 2 },
    { name: 'Dinner', sortOrder: 3 },
    { name: 'Beverages', sortOrder: 4 },
    { name: 'Desserts', sortOrder: 5 },
  ];

  for (const cat of menuCats) {
    await prisma.menuCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isActive: true },
    });
  }
  console.log('✅ Menu categories created');

  // ── Hotel Info ────────────────────────────────────────────
  const hotelInfo = [
    { key: 'hotel_name', value: 'Grand Hotel & Resort', isPublic: true },
    { key: 'hotel_address', value: '123 Hotel Street, Dhaka, Bangladesh', isPublic: true },
    { key: 'hotel_phone', value: '+880-1234-567890', isPublic: true },
    { key: 'hotel_email', value: 'info@grandhotel.com', isPublic: true },
    { key: 'check_in_time', value: '14:00', isPublic: true },
    { key: 'check_out_time', value: '12:00', isPublic: true },
  ];

  for (const info of hotelInfo) {
    await prisma.hotelInfo.upsert({
      where: { key: info.key },
      update: { value: info.value },
      create: info,
    });
  }
  console.log('✅ Hotel info created');

  console.log('\n🎉 Seed completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin    → admin@hotel.com    / Admin@1234');
  console.log('Manager  → manager@hotel.com  / Manager@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
