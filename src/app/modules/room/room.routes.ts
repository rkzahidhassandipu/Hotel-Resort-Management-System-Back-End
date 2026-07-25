import { Router } from "express";
import { roomController } from "./room.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { uploadMultiple } from "../../config/multer.config";
import { uploadRateLimiter } from "../../middlewares/rateLimit.middleware";
import {
  createRoomSchema,
  updateRoomSchema,
  createCategorySchema,
  roomAvailabilitySchema,
  pricingRuleSchema,
  roomListQuerySchema,
} from "./room.validator";

const router = Router();

// ── Public routes (no auth required) ──────────────────────────
router.get(
  "/available",
  validateRequest(roomAvailabilitySchema),
  roomController.checkAvailability,
);
router.get("/categories", roomController.getAllCategories);
router.get("/amenities", roomController.getAllAmenities);
router.get(
  "/",
  validateRequest(roomListQuerySchema),
  roomController.getAllRooms,
);

// ── All routes below require authentication ────────────────────
router.use(authenticate);

// Stats
router.get(
  "/stats",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  roomController.getRoomStats,
);

router.get("/:id", roomController.getRoomById);

// Room CRUD
router.post(
  "/",
  authorize("ADMIN", "MANAGER"),
  validateRequest(createRoomSchema),
  roomController.createRoom,
);
router.put(
  "/:id",
  authorize("ADMIN", "MANAGER"),
  validateRequest(updateRoomSchema),
  roomController.updateRoom,
);
router.delete("/:id", authorize("ADMIN"), roomController.deleteRoom);

// Images
router.post(
  "/:id/images",
  authorize("ADMIN", "MANAGER"),
  uploadRateLimiter,
  uploadMultiple("images", 10),
  roomController.uploadImages,
);
router.delete(
  "/:id/images/:imageId",
  authorize("ADMIN", "MANAGER"),
  roomController.deleteImage,
);
router.patch(
  "/:id/images/:imageId/primary",
  authorize("ADMIN", "MANAGER"),
  roomController.setPrimaryImage,
);

// Amenities
router.put(
  "/:id/amenities",
  authorize("ADMIN", "MANAGER"),
  roomController.updateAmenities,
);

// Pricing Rules
router.get(
  "/:id/pricing-rules",
  authorize("ADMIN", "MANAGER"),
  roomController.getPricingRules,
);
router.post(
  "/:id/pricing-rules",
  authorize("ADMIN", "MANAGER"),
  validateRequest(pricingRuleSchema),
  roomController.addPricingRule,
);
router.delete(
  "/:id/pricing-rules/:ruleId",
  authorize("ADMIN", "MANAGER"),
  roomController.deletePricingRule,
);

// Categories
router.post(
  "/categories/new",
  authorize("ADMIN"),
  validateRequest(createCategorySchema),
  roomController.createCategory,
);
router.put(
  "/categories/:id",
  authorize("ADMIN"),
  roomController.updateCategory,
);

// Amenity management
router.post("/amenities/new", authorize("ADMIN", "MANAGER"), roomController.createAmenity);
router.put(
  "/amenities/:amenityId",
  authorize("ADMIN", "MANAGER"),
  roomController.updateAmenity,
); // ← new
router.delete(
  "/amenities/:amenityId",
  authorize("ADMIN", "MANAGER"),
  roomController.deleteAmenity,
);

export default router;
