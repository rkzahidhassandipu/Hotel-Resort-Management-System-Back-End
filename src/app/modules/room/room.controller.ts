import { Response } from 'express';
import { roomService } from './room.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { BadRequestError } from '../../errorHelpers/AppError';

const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const room = await roomService.createRoom(req.body);
  sendCreated(res, room, 'Room created');
}

const getAllRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await roomService.getAllRooms(req.query as any);
  sendSuccess(res, result.rooms, 'Rooms retrieved', 200, result.meta);
}

const getRoomById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const room = await roomService.getRoomById(req.params.id);
  sendSuccess(res, room, 'Room retrieved');
}

const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const room = await roomService.updateRoom(req.params.id, req.body);
  sendSuccess(res, room, 'Room updated');
}

const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await roomService.deleteRoom(req.params.id);
  sendNoContent(res);
}

const checkAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const rooms = await roomService.checkAvailability(req.query as any);
  sendSuccess(res, rooms, 'Available rooms retrieved');
}

const uploadImages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) throw new BadRequestError('No images provided');
  const room = await roomService.uploadRoomImages(req.params.id, files);
  sendSuccess(res, room, 'Images uploaded');
}

const deleteImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await roomService.deleteRoomImage(req.params.id, req.params.imageId);
  sendNoContent(res);
}

const setPrimaryImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await roomService.setPrimaryImage(req.params.id, req.params.imageId);
  sendSuccess(res, null, 'Primary image updated');
}

const updateAmenities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const room = await roomService.updateRoomAmenities(req.params.id, req.body.amenityIds);
  sendSuccess(res, room, 'Amenities updated');
}

const addPricingRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const rule = await roomService.addPricingRule(req.params.id, req.body);
  sendCreated(res, rule, 'Pricing rule added');
}

const deletePricingRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await roomService.deletePricingRule(req.params.id, req.params.ruleId);
  sendNoContent(res);
}

const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cat = await roomService.createCategory(req.body);
  sendCreated(res, cat, 'Category created');
}

const getAllCategories = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cats = await roomService.getAllCategories();
  sendSuccess(res, cats, 'Categories retrieved');
}

const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cat = await roomService.updateCategory(req.params.id, req.body);
  sendSuccess(res, cat, 'Category updated');
}

const getRoomStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await roomService.getRoomStats();
  sendSuccess(res, stats, 'Stats retrieved');
}

const getAllAmenities = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const amenities = await roomService.getAllAmenities();
  sendSuccess(res, amenities, 'Amenities retrieved');
}

const createAmenity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const amenity = await roomService.createAmenity(req.body);
  sendCreated(res, amenity, 'Amenity created');
}

export const roomController = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  checkAvailability,
  uploadImages,
  deleteImage,
  setPrimaryImage,
  updateAmenities,
  addPricingRule,
  deletePricingRule,
  createCategory,
  getAllCategories,
  updateCategory,
  getRoomStats,
  getAllAmenities,
  createAmenity,
};
