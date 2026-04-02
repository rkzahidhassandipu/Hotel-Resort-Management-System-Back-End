
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  password: 'password',
  role: 'role',
  status: 'status',
  firstName: 'firstName',
  lastName: 'lastName',
  gender: 'gender',
  dateOfBirth: 'dateOfBirth',
  avatarUrl: 'avatarUrl',
  nationalId: 'nationalId',
  passportNumber: 'passportNumber',
  nationality: 'nationality',
  address: 'address',
  city: 'city',
  country: 'country',
  zipCode: 'zipCode',
  emailVerifiedAt: 'emailVerifiedAt',
  emailVerifyToken: 'emailVerifyToken',
  passwordResetToken: 'passwordResetToken',
  passwordResetExpiry: 'passwordResetExpiry',
  lastLoginAt: 'lastLoginAt',
  lastLoginIp: 'lastLoginIp',
  twoFactorEnabled: 'twoFactorEnabled',
  twoFactorSecret: 'twoFactorSecret',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  deviceInfo: 'deviceInfo',
  ipAddress: 'ipAddress',
  expiresAt: 'expiresAt',
  isRevoked: 'isRevoked',
  revokedAt: 'revokedAt',
  createdAt: 'createdAt'
};

exports.Prisma.UserSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  deviceInfo: 'deviceInfo',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  lastUsedAt: 'lastUsedAt'
};

exports.Prisma.StaffProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  employeeId: 'employeeId',
  department: 'department',
  designation: 'designation',
  joiningDate: 'joiningDate',
  salary: 'salary',
  bankAccount: 'bankAccount',
  emergencyContact: 'emergencyContact',
  shift: 'shift',
  isOnDuty: 'isOnDuty'
};

exports.Prisma.CustomerProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  loyaltyPoints: 'loyaltyPoints',
  membershipTier: 'membershipTier',
  totalSpent: 'totalSpent',
  totalStays: 'totalStays',
  preferences: 'preferences',
  notes: 'notes'
};

exports.Prisma.RoomCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  basePrice: 'basePrice',
  weekendPrice: 'weekendPrice',
  maxOccupancy: 'maxOccupancy',
  amenities: 'amenities',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoomScalarFieldEnum = {
  id: 'id',
  roomNumber: 'roomNumber',
  floor: 'floor',
  type: 'type',
  status: 'status',
  bedType: 'bedType',
  maxOccupancy: 'maxOccupancy',
  sizeInSqFt: 'sizeInSqFt',
  categoryId: 'categoryId',
  description: 'description',
  view: 'view',
  smokingAllowed: 'smokingAllowed',
  petFriendly: 'petFriendly',
  isActive: 'isActive',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoomImageScalarFieldEnum = {
  id: 'id',
  roomId: 'roomId',
  imageUrl: 'imageUrl',
  caption: 'caption',
  isPrimary: 'isPrimary',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt'
};

exports.Prisma.AmenityScalarFieldEnum = {
  id: 'id',
  name: 'name',
  icon: 'icon',
  category: 'category'
};

exports.Prisma.RoomAmenityScalarFieldEnum = {
  roomId: 'roomId',
  amenityId: 'amenityId'
};

exports.Prisma.RoomPricingRuleScalarFieldEnum = {
  id: 'id',
  roomId: 'roomId',
  name: 'name',
  startDate: 'startDate',
  endDate: 'endDate',
  pricePerNight: 'pricePerNight',
  reason: 'reason'
};

exports.Prisma.BookingScalarFieldEnum = {
  id: 'id',
  bookingNumber: 'bookingNumber',
  customerId: 'customerId',
  roomId: 'roomId',
  createdById: 'createdById',
  status: 'status',
  checkInDate: 'checkInDate',
  checkOutDate: 'checkOutDate',
  actualCheckIn: 'actualCheckIn',
  actualCheckOut: 'actualCheckOut',
  nights: 'nights',
  adults: 'adults',
  children: 'children',
  pricePerNight: 'pricePerNight',
  subtotal: 'subtotal',
  taxAmount: 'taxAmount',
  discountAmount: 'discountAmount',
  totalAmount: 'totalAmount',
  specialRequests: 'specialRequests',
  arrivalTime: 'arrivalTime',
  source: 'source',
  promoCode: 'promoCode',
  cancellationReason: 'cancellationReason',
  cancelledAt: 'cancelledAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookingGuestScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  firstName: 'firstName',
  lastName: 'lastName',
  nationalId: 'nationalId',
  passportNo: 'passportNo',
  age: 'age',
  isPrimary: 'isPrimary'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  paymentNumber: 'paymentNumber',
  bookingId: 'bookingId',
  userId: 'userId',
  amount: 'amount',
  method: 'method',
  status: 'status',
  currency: 'currency',
  transactionId: 'transactionId',
  gatewayResponse: 'gatewayResponse',
  notes: 'notes',
  paidAt: 'paidAt',
  refundedAt: 'refundedAt',
  refundAmount: 'refundAmount',
  refundReason: 'refundReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  paymentId: 'paymentId',
  status: 'status',
  subtotal: 'subtotal',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  discountAmount: 'discountAmount',
  totalAmount: 'totalAmount',
  notes: 'notes',
  issuedAt: 'issuedAt',
  dueDate: 'dueDate',
  voidedAt: 'voidedAt',
  voidReason: 'voidReason'
};

exports.Prisma.InvoiceItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  totalPrice: 'totalPrice',
  category: 'category'
};

exports.Prisma.MenuCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  imageUrl: 'imageUrl',
  isActive: 'isActive',
  sortOrder: 'sortOrder'
};

exports.Prisma.MenuItemScalarFieldEnum = {
  id: 'id',
  categoryId: 'categoryId',
  name: 'name',
  description: 'description',
  imageUrl: 'imageUrl',
  price: 'price',
  discountedPrice: 'discountedPrice',
  foodCategory: 'foodCategory',
  preparationTime: 'preparationTime',
  calories: 'calories',
  isVegetarian: 'isVegetarian',
  isVegan: 'isVegan',
  isGlutenFree: 'isGlutenFree',
  isAvailable: 'isAvailable',
  ingredients: 'ingredients',
  allergens: 'allergens',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FoodOrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  bookingId: 'bookingId',
  customerId: 'customerId',
  type: 'type',
  status: 'status',
  tableNumber: 'tableNumber',
  roomNumber: 'roomNumber',
  subtotal: 'subtotal',
  taxAmount: 'taxAmount',
  totalAmount: 'totalAmount',
  specialNotes: 'specialNotes',
  estimatedTime: 'estimatedTime',
  confirmedAt: 'confirmedAt',
  preparingAt: 'preparingAt',
  readyAt: 'readyAt',
  deliveredAt: 'deliveredAt',
  cancelledAt: 'cancelledAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FoodOrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  menuItemId: 'menuItemId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  totalPrice: 'totalPrice',
  notes: 'notes',
  customizations: 'customizations'
};

exports.Prisma.MaintenanceLogScalarFieldEnum = {
  id: 'id',
  ticketNumber: 'ticketNumber',
  roomId: 'roomId',
  location: 'location',
  type: 'type',
  priority: 'priority',
  status: 'status',
  title: 'title',
  description: 'description',
  reportedById: 'reportedById',
  assignedToId: 'assignedToId',
  scheduledAt: 'scheduledAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  estimatedHours: 'estimatedHours',
  actualHours: 'actualHours',
  cost: 'cost',
  notes: 'notes',
  images: 'images',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MaintenancePartScalarFieldEnum = {
  id: 'id',
  maintenanceId: 'maintenanceId',
  partName: 'partName',
  quantity: 'quantity',
  unitCost: 'unitCost',
  totalCost: 'totalCost'
};

exports.Prisma.HousekeepingLogScalarFieldEnum = {
  id: 'id',
  roomId: 'roomId',
  staffId: 'staffId',
  date: 'date',
  status: 'status',
  type: 'type',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  notes: 'notes',
  checklist: 'checklist'
};

exports.Prisma.ShiftScalarFieldEnum = {
  id: 'id',
  staffProfileId: 'staffProfileId',
  type: 'type',
  date: 'date',
  startTime: 'startTime',
  endTime: 'endTime',
  actualStartTime: 'actualStartTime',
  actualEndTime: 'actualEndTime',
  isPresent: 'isPresent',
  overtimeHours: 'overtimeHours',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.StaffTaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  assignedToId: 'assignedToId',
  createdById: 'createdById',
  status: 'status',
  priority: 'priority',
  dueDate: 'dueDate',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PerformanceReviewScalarFieldEnum = {
  id: 'id',
  staffProfileId: 'staffProfileId',
  reviewedById: 'reviewedById',
  period: 'period',
  rating: 'rating',
  punctuality: 'punctuality',
  productivity: 'productivity',
  attitude: 'attitude',
  teamwork: 'teamwork',
  comments: 'comments',
  goals: 'goals',
  reviewedAt: 'reviewedAt'
};

exports.Prisma.ServiceRequestScalarFieldEnum = {
  id: 'id',
  requestNumber: 'requestNumber',
  bookingId: 'bookingId',
  customerId: 'customerId',
  assignedToId: 'assignedToId',
  type: 'type',
  status: 'status',
  description: 'description',
  scheduledAt: 'scheduledAt',
  completedAt: 'completedAt',
  priority: 'priority',
  notes: 'notes',
  cost: 'cost',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description'
};

exports.Prisma.InventoryItemScalarFieldEnum = {
  id: 'id',
  categoryId: 'categoryId',
  name: 'name',
  sku: 'sku',
  unit: 'unit',
  currentStock: 'currentStock',
  minimumStock: 'minimumStock',
  maximumStock: 'maximumStock',
  reorderPoint: 'reorderPoint',
  unitCost: 'unitCost',
  supplier: 'supplier',
  location: 'location',
  expiryDate: 'expiryDate',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryTransactionScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  type: 'type',
  quantity: 'quantity',
  unitCost: 'unitCost',
  totalCost: 'totalCost',
  reference: 'reference',
  performedBy: 'performedBy',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.ProcurementOrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  requestedById: 'requestedById',
  approvedById: 'approvedById',
  status: 'status',
  supplier: 'supplier',
  totalAmount: 'totalAmount',
  expectedDate: 'expectedDate',
  receivedDate: 'receivedDate',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  inventoryItemId: 'inventoryItemId',
  quantity: 'quantity',
  unitCost: 'unitCost',
  totalCost: 'totalCost',
  receivedQty: 'receivedQty',
  notes: 'notes'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  userId: 'userId',
  overallRating: 'overallRating',
  cleanlinessRating: 'cleanlinessRating',
  serviceRating: 'serviceRating',
  foodRating: 'foodRating',
  locationRating: 'locationRating',
  valueRating: 'valueRating',
  title: 'title',
  comment: 'comment',
  status: 'status',
  isAnonymous: 'isAnonymous',
  managerResponse: 'managerResponse',
  respondedAt: 'respondedAt',
  respondedById: 'respondedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  channel: 'channel',
  title: 'title',
  message: 'message',
  data: 'data',
  isRead: 'isRead',
  readAt: 'readAt',
  sentAt: 'sentAt',
  isSent: 'isSent',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  channel: 'channel',
  subject: 'subject',
  bodyTemplate: 'bodyTemplate',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DailyReportScalarFieldEnum = {
  id: 'id',
  date: 'date',
  totalBookings: 'totalBookings',
  checkIns: 'checkIns',
  checkOuts: 'checkOuts',
  cancellations: 'cancellations',
  noShows: 'noShows',
  totalRevenue: 'totalRevenue',
  roomRevenue: 'roomRevenue',
  foodRevenue: 'foodRevenue',
  serviceRevenue: 'serviceRevenue',
  occupancyRate: 'occupancyRate',
  averageDailyRate: 'averageDailyRate',
  revPAR: 'revPAR',
  totalGuests: 'totalGuests',
  newCustomers: 'newCustomers',
  createdAt: 'createdAt'
};

exports.Prisma.MonthlyReportScalarFieldEnum = {
  id: 'id',
  year: 'year',
  month: 'month',
  totalBookings: 'totalBookings',
  totalRevenue: 'totalRevenue',
  totalGuests: 'totalGuests',
  averageOccupancy: 'averageOccupancy',
  topRoomType: 'topRoomType',
  topRevenueDay: 'topRevenueDay',
  staffPerformance: 'staffPerformance',
  createdAt: 'createdAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  resource: 'resource',
  action: 'action',
  description: 'description'
};

exports.Prisma.UserPermissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  permissionId: 'permissionId',
  grantedById: 'grantedById',
  grantedAt: 'grantedAt',
  expiresAt: 'expiresAt',
  isActive: 'isActive'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  role: 'role',
  permissionId: 'permissionId'
};

exports.Prisma.RoleOverrideScalarFieldEnum = {
  id: 'id',
  targetUserId: 'targetUserId',
  grantedById: 'grantedById',
  overrideRole: 'overrideRole',
  reason: 'reason',
  isActive: 'isActive',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.VisitorRegistrationScalarFieldEnum = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  purpose: 'purpose',
  visitedAt: 'visitedAt',
  handledById: 'handledById',
  notes: 'notes',
  convertedToCustomer: 'convertedToCustomer',
  convertedUserId: 'convertedUserId'
};

exports.Prisma.RoomInquiryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  checkIn: 'checkIn',
  checkOut: 'checkOut',
  adults: 'adults',
  children: 'children',
  roomType: 'roomType',
  budget: 'budget',
  message: 'message',
  isResolved: 'isResolved',
  resolvedById: 'resolvedById',
  resolvedAt: 'resolvedAt',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.HotelInfoScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  description: 'description',
  isPublic: 'isPublic',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  level: 'level',
  resource: 'resource',
  resourceId: 'resourceId',
  description: 'description',
  oldValue: 'oldValue',
  newValue: 'newValue',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  sessionId: 'sessionId',
  duration: 'duration',
  errorMessage: 'errorMessage',
  stackTrace: 'stackTrace',
  createdAt: 'createdAt'
};

exports.Prisma.ErrorLogScalarFieldEnum = {
  id: 'id',
  message: 'message',
  stackTrace: 'stackTrace',
  context: 'context',
  level: 'level',
  isResolved: 'isResolved',
  resolvedAt: 'resolvedAt',
  resolvedById: 'resolvedById',
  createdAt: 'createdAt'
};

exports.Prisma.AuditTrailScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  tableName: 'tableName',
  recordId: 'recordId',
  before: 'before',
  after: 'after',
  reason: 'reason',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
  MAINTENANCE: 'MAINTENANCE',
  CHEF: 'CHEF'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION'
};

exports.Gender = exports.$Enums.Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
};

exports.ShiftType = exports.$Enums.ShiftType = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING',
  NIGHT: 'NIGHT',
  FLEXIBLE: 'FLEXIBLE'
};

exports.MembershipTier = exports.$Enums.MembershipTier = {
  STANDARD: 'STANDARD',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
  DIAMOND: 'DIAMOND'
};

exports.RoomType = exports.$Enums.RoomType = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  TWIN: 'TWIN',
  SUITE: 'SUITE',
  DELUXE: 'DELUXE',
  PENTHOUSE: 'PENTHOUSE',
  FAMILY: 'FAMILY',
  VILLA: 'VILLA'
};

exports.RoomStatus = exports.$Enums.RoomStatus = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  CLEANING: 'CLEANING',
  OUT_OF_ORDER: 'OUT_OF_ORDER',
  RESERVED: 'RESERVED'
};

exports.BedType = exports.$Enums.BedType = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  QUEEN: 'QUEEN',
  KING: 'KING',
  TWIN: 'TWIN',
  BUNK: 'BUNK'
};

exports.BookingStatus = exports.$Enums.BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  WAITLISTED: 'WAITLISTED'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  ONLINE_PAYMENT: 'ONLINE_PAYMENT',
  MOBILE_BANKING: 'MOBILE_BANKING',
  CRYPTO: 'CRYPTO'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID',
  CANCELLED: 'CANCELLED'
};

exports.FoodCategory = exports.$Enums.FoodCategory = {
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  SNACKS: 'SNACKS',
  BEVERAGES: 'BEVERAGES',
  DESSERTS: 'DESSERTS',
  SPECIAL: 'SPECIAL'
};

exports.OrderType = exports.$Enums.OrderType = {
  DINE_IN: 'DINE_IN',
  ROOM_SERVICE: 'ROOM_SERVICE',
  TAKEAWAY: 'TAKEAWAY'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

exports.MaintenanceType = exports.$Enums.MaintenanceType = {
  ELECTRICAL: 'ELECTRICAL',
  PLUMBING: 'PLUMBING',
  HVAC: 'HVAC',
  FURNITURE: 'FURNITURE',
  APPLIANCE: 'APPLIANCE',
  STRUCTURAL: 'STRUCTURAL',
  CLEANING: 'CLEANING',
  OTHER: 'OTHER'
};

exports.MaintenancePriority = exports.$Enums.MaintenancePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.MaintenanceStatus = exports.$Enums.MaintenanceStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
};

exports.StaffTaskStatus = exports.$Enums.StaffTaskStatus = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE'
};

exports.TaskPriority = exports.$Enums.TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.ServiceRequestType = exports.$Enums.ServiceRequestType = {
  LAUNDRY: 'LAUNDRY',
  ROOM_SERVICE: 'ROOM_SERVICE',
  EXTRA_TOWELS: 'EXTRA_TOWELS',
  EXTRA_PILLOW: 'EXTRA_PILLOW',
  WAKE_UP_CALL: 'WAKE_UP_CALL',
  TAXI_BOOKING: 'TAXI_BOOKING',
  TOUR_BOOKING: 'TOUR_BOOKING',
  SPA_BOOKING: 'SPA_BOOKING',
  SPECIAL_ARRANGEMENT: 'SPECIAL_ARRANGEMENT',
  OTHER: 'OTHER'
};

exports.ServiceRequestStatus = exports.$Enums.ServiceRequestStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.StockStatus = exports.$Enums.StockStatus = {
  SUFFICIENT: 'SUFFICIENT',
  LOW: 'LOW',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  OVERSTOCKED: 'OVERSTOCKED'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  WASTAGE: 'WASTAGE',
  TRANSFER: 'TRANSFER',
  RETURN: 'RETURN'
};

exports.ProcurementStatus = exports.$Enums.ProcurementStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

exports.ReviewStatus = exports.$Enums.ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FLAGGED: 'FLAGGED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_CANCELLATION: 'BOOKING_CANCELLATION',
  CHECK_IN_REMINDER: 'CHECK_IN_REMINDER',
  CHECK_OUT_REMINDER: 'CHECK_OUT_REMINDER',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_DUE: 'PAYMENT_DUE',
  MAINTENANCE_UPDATE: 'MAINTENANCE_UPDATE',
  SERVICE_UPDATE: 'SERVICE_UPDATE',
  GENERAL_ALERT: 'GENERAL_ALERT',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP'
};

exports.LogAction = exports.$Enums.LogAction = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  OVERRIDE: 'OVERRIDE'
};

exports.LogLevel = exports.$Enums.LogLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  DEBUG: 'DEBUG'
};

exports.Prisma.ModelName = {
  User: 'User',
  RefreshToken: 'RefreshToken',
  UserSession: 'UserSession',
  StaffProfile: 'StaffProfile',
  CustomerProfile: 'CustomerProfile',
  RoomCategory: 'RoomCategory',
  Room: 'Room',
  RoomImage: 'RoomImage',
  Amenity: 'Amenity',
  RoomAmenity: 'RoomAmenity',
  RoomPricingRule: 'RoomPricingRule',
  Booking: 'Booking',
  BookingGuest: 'BookingGuest',
  Payment: 'Payment',
  Invoice: 'Invoice',
  InvoiceItem: 'InvoiceItem',
  MenuCategory: 'MenuCategory',
  MenuItem: 'MenuItem',
  FoodOrder: 'FoodOrder',
  FoodOrderItem: 'FoodOrderItem',
  MaintenanceLog: 'MaintenanceLog',
  MaintenancePart: 'MaintenancePart',
  HousekeepingLog: 'HousekeepingLog',
  Shift: 'Shift',
  StaffTask: 'StaffTask',
  PerformanceReview: 'PerformanceReview',
  ServiceRequest: 'ServiceRequest',
  InventoryCategory: 'InventoryCategory',
  InventoryItem: 'InventoryItem',
  InventoryTransaction: 'InventoryTransaction',
  ProcurementOrder: 'ProcurementOrder',
  ProcurementItem: 'ProcurementItem',
  Review: 'Review',
  Notification: 'Notification',
  NotificationTemplate: 'NotificationTemplate',
  DailyReport: 'DailyReport',
  MonthlyReport: 'MonthlyReport',
  Permission: 'Permission',
  UserPermission: 'UserPermission',
  RolePermission: 'RolePermission',
  RoleOverride: 'RoleOverride',
  VisitorRegistration: 'VisitorRegistration',
  RoomInquiry: 'RoomInquiry',
  HotelInfo: 'HotelInfo',
  SystemLog: 'SystemLog',
  ErrorLog: 'ErrorLog',
  AuditTrail: 'AuditTrail'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
