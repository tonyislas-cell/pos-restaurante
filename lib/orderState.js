export function mergeOrderUpdate(currentOrder, updatedOrder) {
  if (!currentOrder) return updatedOrder;
  if (!updatedOrder) return currentOrder;

  return {
    ...currentOrder,
    ...updatedOrder,
    dining_tables: updatedOrder.dining_tables ?? currentOrder.dining_tables,
  };
}
