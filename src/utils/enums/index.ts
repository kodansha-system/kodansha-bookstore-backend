export enum OrderStatus {
  New = 900,
  WaitingPickup = 901,
  PickingUp = 902,
  PickedUp = 903,
  Delivering = 904,
  Delivered = 905,
  DeliveryFailed = 906,
  Returning = 907,
  Returned = 908,
  Reconciled = 909,
  CustomerReconciled = 910,
  CodTransferred = 911,
  WaitingCodPayment = 912,
  Completed = 913,
  Cancelled = 914,
  Delay = 915,
  PartiallyDelivered = 916,
  Error = 1000,
}

export enum VoucherType {
  FREE_SHIP = 'free_ship',
  DISCOUNT = 'discount',
}
