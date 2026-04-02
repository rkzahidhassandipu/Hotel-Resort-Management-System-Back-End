import { Prisma, RoomStatus, RoomType } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { NotFoundError, ConflictError, BadRequestError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

const ROOM_SELECT = {
  id: true, roomNumber: true, floor: true, type: true, status: true,
  bedType: true, maxOccupancy: true, sizeInSqFt: true, description: true,
  view: true, smokingAllowed: true, petFriendly: true, isActive: true,
  notes: true, createdAt: true, updatedAt: true,
  category: { select: { id: true, name: true, basePrice: true, weekendPrice: true } },
  images: { select: { id: true, imageUrl: true, caption: true, isPrimary: true, sortOrder: true } },
  amenities: { select: { amenity: { select: { id: true, name: true, icon: true } } } },
};

  // ── Create Room ───────────────────────────────────────────

const createRoom = async (data: {
  roomNumber: string; floor: number; type: string; bedType: string;
  maxOccupancy: number; sizeInSqFt?: number; categoryId: string;
  description?: string; view?: string; smokingAllowed?: boolean;
  petFriendly?: boolean; notes?: string;
}) => {
  const exists = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
  if (exists) throw new ConflictError(`Room ${data.roomNumber} already exists`);

  const category = await prisma.roomCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new NotFoundError('Room category not found');

  return prisma.room.create({ data: data as any, select: ROOM_SELECT });
}

const getAllRooms = async (query: {
  page?: string; limit?: string; search?: string; type?: RoomType;
  status?: RoomStatus; floor?: string; minPrice?: string; maxPrice?: string;
  petFriendly?: string; smokingAllowed?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.RoomWhereInput = {
    isActive: true,
    ...(query.type && { type: query.type }),
    ...(query.status && { status: query.status }),
    ...(query.floor && { floor: parseInt(query.floor) }),
    ...(query.petFriendly && { petFriendly: query.petFriendly === 'true' }),
    ...(query.smokingAllowed && { smokingAllowed: query.smokingAllowed === 'true' }),
    ...(query.search && {
      OR: [
        { roomNumber: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { view: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
    ...((query.minPrice || query.maxPrice) && {
      category: {
        basePrice: {
          ...(query.minPrice && { gte: parseFloat(query.minPrice) }),
          ...(query.maxPrice && { lte: parseFloat(query.maxPrice) }),
        },
      },
    }),
  };

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({ where, select: ROOM_SELECT, skip, take: limit,
      orderBy: { [query.sortBy || 'roomNumber']: query.sortOrder || 'asc' } }),
    prisma.room.count({ where }),
  ]);

  return { rooms, meta: getPaginationMeta(total, page, limit) };
}

const getRoomById = async (id: string) => {
  const room = await prisma.room.findUnique({ where: { id }, select: ROOM_SELECT });
  if (!room) throw new NotFoundError('Room not found');
  return room;
}

const updateRoom = async (id: string, data: Partial<{
  floor: number; type: string; status: string; bedType: string;
  maxOccupancy: number; sizeInSqFt: number; categoryId: string;
  description: string; view: string; smokingAllowed: boolean;
  petFriendly: boolean; isActive: boolean; notes: string;
}>) => {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new NotFoundError('Room not found');

  return prisma.room.update({ where: { id }, data: data as any, select: ROOM_SELECT });
}

const deleteRoom = async (id: string) => {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new NotFoundError('Room not found');

  const activeBooking = await prisma.booking.findFirst({
    where: { roomId: id, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
  });
  if (activeBooking) throw new BadRequestError('Cannot delete room with active bookings');

  await prisma.room.update({ where: { id }, data: { isActive: false } });
}

const checkAvailability = async (query: {
  checkIn: string; checkOut: string; type?: string;
  adults?: string; minPrice?: string; maxPrice?: string;
}) => {
  const checkIn = new Date(query.checkIn);
  const checkOut = new Date(query.checkOut);

  if (checkIn >= checkOut) throw new BadRequestError('Check-out must be after check-in');
  if (checkIn < new Date()) throw new BadRequestError('Check-in cannot be in the past');

  // Find rooms that have no overlapping confirmed bookings
  const bookedRoomIds = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      OR: [
        { checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn } },
      ],
    },
    select: { roomId: true },
  }).then((b) => b.map((b) => b.roomId));

  const where: Prisma.RoomWhereInput = {
    isActive: true,
    status: 'AVAILABLE',
    id: { notIn: bookedRoomIds },
    ...(query.type && { type: query.type as RoomType }),
    ...(query.adults && { maxOccupancy: { gte: parseInt(query.adults) } }),
    ...((query.minPrice || query.maxPrice) && {
      category: {
        basePrice: {
          ...(query.minPrice && { gte: parseFloat(query.minPrice) }),
          ...(query.maxPrice && { lte: parseFloat(query.maxPrice) }),
        },
      },
    }),
  };

  const rooms = await prisma.room.findMany({
    where,
    select: {
      ...ROOM_SELECT,
      pricingRules: {
        where: {
          startDate: { lte: checkOut },
          endDate: { gte: checkIn },
        },
      },
    },
  });

  // Calculate nights and effective price
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const isWeekend = checkIn.getDay() === 0 || checkIn.getDay() === 6;

  return rooms.map((room) => {
    const specialRule = (room as any).pricingRules?.[0];
    const basePrice = specialRule
      ? parseFloat(specialRule.pricePerNight)
      : isWeekend && (room.category as any).weekendPrice
      ? parseFloat((room.category as any).weekendPrice)
      : parseFloat((room.category as any).basePrice);

    return {
      ...room,
      pricePerNight: basePrice,
      totalPrice: basePrice * nights,
      nights,
      pricingNote: specialRule ? specialRule.name : isWeekend ? 'Weekend rate' : 'Standard rate',
    };
  });
}

const uploadRoomImages = async (roomId: string, files: Express.Multer.File[]) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new NotFoundError('Room not found');

  const existingCount = await prisma.roomImage.count({ where: { roomId } });
  const hasPrimary = await prisma.roomImage.findFirst({ where: { roomId, isPrimary: true } });

  const uploads = await Promise.all(
    files.map((f, i) =>
      uploadToCloudinary(f.buffer, 'rooms').then((result) => ({
        roomId,
        imageUrl: result.secureUrl,
        isPrimary: !hasPrimary && i === 0,
        sortOrder: existingCount + i,
      })),
    ),
  );

  await prisma.roomImage.createMany({ data: uploads });
  return prisma.room.findUnique({ where: { id: roomId }, select: ROOM_SELECT });
}

const deleteRoomImage = async (roomId: string, imageId: string) => {
  const image = await prisma.roomImage.findFirst({ where: { id: imageId, roomId } });
  if (!image) throw new NotFoundError('Image not found');

  // Extract public ID from Cloudinary URL
  const publicId = image.imageUrl.split('/').slice(-2).join('/').split('.')[0];
  deleteFromCloudinary(`hotel-management/rooms/${publicId}`).catch(() => {});

  await prisma.roomImage.delete({ where: { id: imageId } });
}

const setPrimaryImage = async (roomId: string, imageId: string) => {
  await prisma.$transaction([
    prisma.roomImage.updateMany({ where: { roomId }, data: { isPrimary: false } }),
    prisma.roomImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
}

const updateRoomAmenities = async (roomId: string, amenityIds: string[]) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new NotFoundError('Room not found');

  await prisma.$transaction([
    prisma.roomAmenity.deleteMany({ where: { roomId } }),
    prisma.roomAmenity.createMany({
      data: amenityIds.map((amenityId) => ({ roomId, amenityId })),
      skipDuplicates: true,
    }),
  ]);

  return prisma.room.findUnique({ where: { id: roomId }, select: ROOM_SELECT });
}

const addPricingRule = async (roomId: string, data: {
  name: string; startDate: string; endDate: string; pricePerNight: number; reason?: string;
}) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new NotFoundError('Room not found');

  return prisma.roomPricingRule.create({
    data: { roomId, ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
  });
}

const deletePricingRule = async (roomId: string, ruleId: string) => {
  const rule = await prisma.roomPricingRule.findFirst({ where: { id: ruleId, roomId } });
  if (!rule) throw new NotFoundError('Pricing rule not found');
  await prisma.roomPricingRule.delete({ where: { id: ruleId } });
}

const createCategory = async (data: {
  name: string; description?: string; basePrice: number;
  weekendPrice?: number; maxOccupancy: number; amenities?: string[];
}) => {
  const exists = await prisma.roomCategory.findUnique({ where: { name: data.name } });
  if (exists) throw new ConflictError('Category already exists');
  return prisma.roomCategory.create({ data });
}

const getAllCategories = async () => {
  return prisma.roomCategory.findMany({
    include: { _count: { select: { rooms: true } } },
    orderBy: { basePrice: 'asc' },
  });
}

const updateCategory = async (id: string, data: Partial<{
  name: string; description: string; basePrice: number; weekendPrice: number;
  maxOccupancy: number; amenities: string[];
}>) => {
  const cat = await prisma.roomCategory.findUnique({ where: { id } });
  if (!cat) throw new NotFoundError('Category not found');
  return prisma.roomCategory.update({ where: { id }, data });
}

const getRoomStats = async () => {
  const [total, byStatus, byType, maintenanceCount] = await Promise.all([
    prisma.room.count({ where: { isActive: true } }),
    prisma.room.groupBy({ by: ['status'], _count: { status: true }, where: { isActive: true } }),
    prisma.room.groupBy({ by: ['type'], _count: { type: true }, where: { isActive: true } }),
    prisma.room.count({ where: { status: 'MAINTENANCE', isActive: true } }),
  ]);

  const occupancyRate = byStatus.find((s) => s.status === 'OCCUPIED')?._count.status ?? 0;

  return {
    total,
    occupancyRate: total > 0 ? ((occupancyRate / total) * 100).toFixed(1) + '%' : '0%',
    byStatus,
    byType,
    maintenanceCount,
  };
}

const getAllAmenities = async () => {
  return prisma.amenity.findMany({ orderBy: { name: 'asc' } });
}

const createAmenity = async (data: { name: string; icon?: string; category?: string }) => {
  const exists = await prisma.amenity.findUnique({ where: { name: data.name } });
  if (exists) throw new ConflictError('Amenity already exists');
  return prisma.amenity.create({ data });
}

export const roomService = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  checkAvailability,
  uploadRoomImages,
  deleteRoomImage,
  setPrimaryImage,
  updateRoomAmenities,
  addPricingRule,
  deletePricingRule,
  createCategory,
  getAllCategories,
  updateCategory,
  getRoomStats,
  getAllAmenities,
  createAmenity,
};
